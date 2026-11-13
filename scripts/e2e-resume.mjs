import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.E2E_URL ?? "http://localhost:5173/";
const NOTE = "E2E resume: pos pengungsian Cibeureum butuh 40 selimut.";
const KEY = "lentera.queue.v1";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

const text = () => page.evaluate(() => document.body.innerText);
const waitForText = async (needle, timeout = 20000) => {
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

  // One real save establishes an authenticated reporter and a valid record shape.
  await page.waitForSelector("textarea");
  await page.type("textarea", "Laporan dasar sebelum simulasi resume.");
  await clickText("Proses laporan");
  await waitForText("Setujui?", 10000);
  await clickText("Proses lokal saja");
  await waitForText("Hasil ekstraksi", 20000);
  await clickText("Simpan ke antrean");
  await waitForText("Tersimpan lokal", 15000);
  await clickText("Antrean");
  await waitForText("terkirim", 30000);

  const injected = await page.evaluate(
    ({ key, note }) => {
      const rows = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Antrean lokal kosong; tidak bisa membuat laporan tertunda.");
      }
      const now = Date.now();
      const clone = {
        ...rows[0],
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: "queued",
        needsReview: true,
        post: "Pos Resume",
        rawNote: note,
        photo: null,
        inference: {
          ...rows[0].inference,
          path: "unavailable",
          reason: "Disimpan di sesi sebelumnya.",
          retried: false,
        },
      };
      window.localStorage.setItem(key, JSON.stringify([clone, ...rows]));
      return clone.id;
    },
    { key: KEY, note: NOTE },
  );

  // A fresh load is the resume path: App calls resumeSync after sign-in.
  await page.reload({ waitUntil: "networkidle2" });
  await page.goto(`${URL}antrean`, { waitUntil: "networkidle2" });

  await page.waitForFunction(
    ({ key, id }) => {
      const rows = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      return rows.some((row) => row.id === id && row.status === "synced");
    },
    { timeout: 30000 },
    { key: KEY, id: injected },
  );

  const body = await text();
  if (!body.includes("Cibeureum")) throw new Error("Laporan resume tidak tampil di antrean.");
  if (!body.toLowerCase().includes("terkirim")) {
    throw new Error("Badge terkirim tidak muncul setelah resume.");
  }
  console.log("RESUME_OK laporan tertunda tersinkron setelah reload");
  await page.screenshot({
    path: "docs/evidence/e2e-resume.png",
    fullPage: true,
  });

  if (errors.length > 0) throw new Error(`Page errors: ${errors.join(" | ")}`);
  console.log("E2E_RESUME_PASS");
} catch (error) {
  await page.screenshot({
    path: "docs/evidence/e2e-resume-failure.png",
    fullPage: true,
  });
  console.error("E2E_RESUME_FAIL", error.message);
  console.error((await text()).slice(0, 1200));
  process.exitCode = 1;
} finally {
  await browser.close();
}
