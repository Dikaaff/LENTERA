import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.E2E_URL ?? "http://localhost:5173/";
const RUNS = Number(process.env.MEASURE_RUNS ?? 3);
const OUT = "docs/prompts/cloud-metrics.json";
const BLOCKED = "docs/prompts/cloud-metrics.blocked.json";

if (process.env.MEASURE_CONFIRM !== "1") {
  console.error("Refusing to call a paid cloud model without MEASURE_CONFIRM=1.");
  console.error("Run: MEASURE_CONFIRM=1 npm run measure:cloud");
  process.exit(2);
}

const matches = (actual, expected) => {
  if (expected === null) return actual === null;
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((value, index) => matches(actual[index], value))
    );
  }
  if (typeof expected === "object") {
    if (!actual || typeof actual !== "object") return false;
    return Object.entries(expected).every(([key, value]) => matches(actual[key], value));
  }
  return actual === expected;
};

const writeBlocked = (reason, extra = {}) => {
  fs.writeFileSync(
    BLOCKED,
    JSON.stringify(
      {
        status: "blocked",
        reason,
        checkedAt: new Date().toISOString(),
        url: URL,
        runsPerCase: RUNS,
        ...extra,
      },
      null,
      2,
    ) + "\n",
  );
  console.error("CLOUD_MEASURE_BLOCKED:", reason);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

try {
  await page.goto(URL, { waitUntil: "networkidle2" });
  await page.waitForFunction(
    () => document.body.innerText.includes("Isi Laporan"),
    { timeout: 20000 },
  );

  const config = await page.evaluate(async () => {
    const mod = await import("/src/lib/firebase.ts");
    const app = mod.getFirebaseApp();
    return {
      configured: mod.isFirebaseConfigured,
      projectId: app?.options.projectId ?? null,
    };
  });
  if (!config.configured) {
    writeBlocked(
      "Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* dengan project nyata, bukan .env.emulator.",
      { configured: false, projectId: null },
    );
    process.exitCode = 2;
  } else {
    const probe = await page.evaluate(async () => {
      const mod = await import("/src/modules/inference/index.ts");
      return mod.runTask(
        "report.extract.v1",
        { note: "Ada 12 orang mengungsi di balai desa Sukamaju." },
        { consentToCloud: true, forceCloud: true },
      );
    });

    if (probe.status === "unavailable") {
      writeBlocked(probe.error ?? "Model cloud tidak tersedia.", {
        configured: true,
        projectId: config.projectId,
        inferenceSource: probe.meta.inferenceSource ?? null,
      });
      process.exitCode = 2;
    } else {
      const results = await page.evaluate(
        async (runs) => {
          const inference = await import("/src/modules/inference/index.ts");
          const prompt = await import(
            "/src/modules/inference/prompts/report.extract.v1.ts"
          );
          const rows = [];
          for (const testCase of prompt.TEST_CASES) {
            for (let index = 0; index < runs; index += 1) {
              const started = performance.now();
              const result = await inference.runTask(
                "report.extract.v1",
                { note: testCase.note },
                { consentToCloud: true, forceCloud: true },
              );
              rows.push({
                id: testCase.id,
                expect: testCase.expect,
                run: index + 1,
                status: result.status,
                data: result.data,
                meta: result.meta,
                error: result.error ?? null,
                wallMs: Math.round(performance.now() - started),
              });
            }
          }
          return rows;
        },
        RUNS,
      );

      const ok = results.filter((row) => row.status === "ok");
      const latencies = ok.map((row) => row.wallMs).sort((a, b) => a - b);
      const p95 = latencies.length
        ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)]
        : null;
      const scored = results.filter((row) => row.expect !== "invalid" && row.status === "ok");
      let fieldTotal = 0;
      let fieldMatches = 0;
      for (const row of scored) {
        const fields = Object.keys(row.expect);
        fieldTotal += fields.length;
        fieldMatches += fields.filter((key) => matches(row.data?.[key], row.expect[key])).length;
      }
      const byCase = [...new Set(results.map((row) => row.id))].map((id) => {
        const rows = results.filter((row) => row.id === id);
        return {
          id,
          runs: rows.length,
          ok: rows.filter((row) => row.status === "ok").length,
          sources: [...new Set(rows.map((row) => row.meta.inferenceSource ?? "unknown"))],
          avgLatencyMs: Math.round(
            rows.reduce((sum, row) => sum + row.wallMs, 0) / rows.length,
          ),
          anomalyDetected: rows.some((row) => row.data?.note_anomaly),
        };
      });

      const payload = {
        status: "measured",
        measuredAt: new Date().toISOString(),
        url: URL,
        model: "gemini-3.5-flash-lite (ONLY_IN_CLOUD)",
        runsPerCase: RUNS,
        summary: {
          totalCalls: results.length,
          okCalls: ok.length,
          schemaValidRate: Number((ok.length / results.length).toFixed(4)),
          fieldAccuracy:
            fieldTotal === 0 ? null : Number((fieldMatches / fieldTotal).toFixed(4)),
          scoredFields: fieldTotal,
          avgLatencyMs: latencies.length
            ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
            : null,
          p95LatencyMs: p95,
          sources: ok.reduce((acc, row) => {
            const key = row.meta.inferenceSource ?? "unknown";
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
        },
        perCase: byCase,
        results,
      };
      fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
      console.log(JSON.stringify(payload.summary, null, 2));
      console.log("CLOUD_MEASURE_WRITTEN:", OUT);
      console.log("Note: latency is wall time; token counts are not exposed by the SDK.");
    }
  }
} catch (error) {
  writeBlocked(error instanceof Error ? error.message : String(error), { configured: null });
  process.exitCode = 1;
} finally {
  await browser.close();
}
