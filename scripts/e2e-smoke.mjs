import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.E2E_URL ?? "http://localhost:5173/";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  console.log("PAGE:", message.type(), message.text());
});
page.on("requestfailed", (request) => {
  if (/firestore|8080|9099/.test(request.url())) {
    console.log("REQFAIL:", request.url(), request.failure()?.errorText);
  }
});

const text = () => page.evaluate(() => document.body.innerText);
const waitForText = async (needle, timeout = 15000) => {
  await page.waitForFunction(
    (value) => document.body.innerText.toLowerCase().includes(value.toLowerCase()),
    { timeout },
    needle,
  );
};
const clickText = async (needle) => {
  const clicked = await page.evaluate((value) => {
    const element = [...document.querySelectorAll("button, a")].find((node) =>
      node.textContent?.trim().includes(value),
    );
    if (!element) return false;
    element.click();
    return true;
  }, needle);
  if (!clicked) throw new Error(`Tidak menemukan elemen: ${needle}`);
};

try {
  await page.goto(URL, { waitUntil: "networkidle2" });
  await waitForText("Isi Laporan");
  await waitForText("relawan", 20000);

  await page.waitForSelector("textarea");
  await page.type(
    "textarea",
    "Ada 30 keluarga di balai desa Sukamaju, butuh air bersih dan selimut. Jalan longsor.",
  );
  await clickText("Proses laporan");
  await waitForText("Setujui?", 10000);
  await clickText("Proses lokal saja");
  await waitForText("Hasil ekstraksi", 20000);

  const areas = await page.$$("textarea");
  await areas[areas.length - 1].type("Tiga puluh keluarga mengungsi di Sukamaju.");
  await clickText("Simpan ke antrean");
  await waitForText("Tersimpan lokal", 15000);

  await clickText("Antrean");
  await waitForText("terkirim", 30000);
  console.log("SYNC_OK status terkirim");
  await new Promise((resolve) => setTimeout(resolve, 700));

  await page.screenshot({
    path: "docs/evidence/e2e-antrean.png",
    fullPage: true,
  });

  await page.reload({ waitUntil: "networkidle2" });
  await page.goto(`${URL}antrean`, { waitUntil: "networkidle2" });
  await waitForText("terkirim", 20000);
  const body = await text();
  if (!body.includes("Tiga puluh keluarga mengungsi")) {
    throw new Error("Laporan hilang setelah reload.");
  }
  console.log("RELOAD_OK laporan bertahan");

  await clickText("Peta");
  await waitForText("Peta");
  console.log("MAP_OK");
  await page.screenshot({ path: "docs/evidence/e2e-peta.png", fullPage: true });

  if (errors.length > 0) {
    throw new Error(`Page errors: ${errors.join(" | ")}`);
  }
  console.log("E2E_PASS");
} catch (error) {
  await page.screenshot({
    path: "docs/evidence/e2e-failure.png",
    fullPage: true,
  });
  console.error("E2E_FAIL", error.message);
  console.error((await text()).slice(0, 1200));
  process.exitCode = 1;
} finally {
  await browser.close();
}
