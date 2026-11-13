import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.E2E_URL ?? "http://localhost:5173/";
const RUNS = Number(process.env.MEASURE_RUNS ?? 3);
const PACE_MS = Number(process.env.MEASURE_PACE_MS ?? 5000);
const OUT = "docs/prompts/sitrep-metrics.json";

if (process.env.MEASURE_CONFIRM !== "1") {
  console.error("Refusing to call a paid cloud model without MEASURE_CONFIRM=1.");
  console.error("Run: MEASURE_CONFIRM=1 npm run measure:sitrep");
  process.exit(2);
}

const extraction = (values) => ({
  is_report: true,
  summary: null,
  category: null,
  urgency: null,
  location: null,
  people_affected: null,
  needs: [],
  note_anomaly: null,
  ...values,
});

const reports = [
  {
    id: "r1",
    region: "Jawa Barat",
    createdAt: 1_760_000_000_000,
    extraction: extraction({
      summary: "30 keluarga mengungsi di Balai Desa Sukamaju setelah banjir.",
      category: "evacuation",
      urgency: "high",
      location: { name: "Balai Desa Sukamaju", regency: "Bandung", confidence: "medium" },
      people_affected: { min: 30, max: 30 },
      needs: [{ item: "selimut", quantity: 60, unit: "lembar" }],
    }),
  },
  {
    id: "r2",
    region: "Jawa Barat",
    createdAt: 1_760_000_100_000,
    extraction: extraction({
      summary: "Tiga puluh keluarga di Balai Desa Sukamaju butuh selimut.",
      category: "shelter",
      urgency: "high",
      location: { name: "Balai Desa Sukamaju", regency: "Bandung", confidence: "medium" },
      people_affected: { min: 30, max: 30 },
      needs: [{ item: "selimut", quantity: 50, unit: "lembar" }],
    }),
  },
  {
    id: "r3",
    region: "Jawa Barat",
    createdAt: 1_760_000_200_000,
    extraction: extraction({
      summary: "Air bersih dibutuhkan di Desa Cibeureum.",
      category: "food_water",
      urgency: "medium",
      location: { name: "Desa Cibeureum", regency: null, confidence: "low" },
      needs: [{ item: "air bersih", quantity: 500, unit: "liter" }],
    }),
  },
  {
    id: "r4",
    region: "Jawa Barat",
    createdAt: 1_760_000_300_000,
    extraction: extraction({
      summary: "Banjir merendam Balai Desa Sukamaju; 32 keluarga mengungsi.",
      category: "evacuation",
      urgency: "critical",
      location: { name: "Balai Desa Sukamaju", regency: "Bandung", confidence: "medium" },
      people_affected: { min: 32, max: 32 },
      needs: [{ item: "selimut", quantity: 70, unit: "lembar" }],
    }),
  },
  {
    id: "r5",
    region: "Jawa Barat",
    createdAt: 1_760_000_400_000,
    extraction: extraction({
      summary: "Laporan tanpa detail lokasi atau kebutuhan.",
      category: "other",
      urgency: "low",
    }),
  },
];

const aggregates = {
  total_reports: reports.length,
  by_region: { "Jawa Barat": reports.length },
  by_urgency: { high: 2, critical: 1, medium: 1, low: 1 },
};

const WORD_LIMIT = 250;
const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const inputIds = new Set(reports.map((report) => report.id));
const inputNumbers = new Set(JSON.stringify(reports).match(/\d+/g) ?? []);
const inputJson = JSON.stringify({ reports, aggregates });

const clusterChecks = (data) => {
  const clusters = data?.clusters ?? [];
  const unresolved = data?.unresolved_ids ?? [];
  const grouped = clusters.flatMap((cluster) => [cluster.canonical_id, ...cluster.duplicate_ids]);
  const allIds = [...grouped, ...unresolved];
  const accounted = allIds.length === inputIds.size && allIds.every((id) => inputIds.has(id));
  const clusterOf = (id) =>
    clusters.find((cluster) => cluster.canonical_id === id || cluster.duplicate_ids.includes(id));
  const sameIncident = ["r1", "r2", "r4"].every((id) => {
    const target = clusterOf(id);
    return target && ["r1", "r2", "r4"].every((other) => clusterOf(other) === target);
  });
  const separateNeed = clusterOf("r3") !== clusterOf("r1");
  const unresolvedEmpty = unresolved.includes("r5") || clusterOf("r5") !== clusterOf("r1");
  return {
    accounted,
    sameIncident,
    separateNeed,
    unresolvedEmpty,
    noInventedIds: allIds.every((id) => inputIds.has(id)),
  };
};

const dailyChecks = (data) => {
  const sections = data?.sections ?? [];
  const headings = sections.map((section) => section.heading);
  const required = ["overview", "most_urgent", "affected", "gaps"];
  const ordered = JSON.stringify(headings) === JSON.stringify(required);
  const claims = sections.flatMap((section) => section.claims);
  const sourced = claims.length > 0 && claims.every((claim) => claim.source_ids.length > 0);
  const knownSources = claims.every((claim) =>
    claim.source_ids.every((id) => inputIds.has(id)),
  );
  const text = claims.map((claim) => claim.text).join(" ");
  const count = words(text);
  const numbers = text.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const unsupportedNumbers = numbers.filter((raw) => {
    const digits = raw.replace(/[.,]/g, "");
    return !inputNumbers.has(digits) && !inputJson.includes(raw);
  });
  return {
    ordered,
    allHeadings: headings.length === required.length && required.every((h) => headings.includes(h)),
    sourced,
    knownSources,
    wordCount: count,
    withinWordLimit: count <= WORD_LIMIT,
    unsupportedNumbers,
  };
};

const summarize = (rows, checksFor, label) => {
  const ok = rows.filter((row) => row.status === "ok" && row.data);
  const results = ok.map((row) => checksFor(row.data));
  const passed = results.filter((result) =>
    Object.entries(result).every(([key, value]) =>
      key === "wordCount" || key === "unsupportedNumbers" ? true : value === true,
    ),
  );
  const wordCounts = results.map((result) => result.wordCount).filter((value) => value != null);
  return {
    label,
    runs: rows.length,
    ok: ok.length,
    schemaValidRate: rows.length ? Number((ok.length / rows.length).toFixed(4)) : null,
    allChecksPassRate: results.length
      ? Number((passed.length / results.length).toFixed(4))
      : null,
    avgWordCount: wordCounts.length
      ? Math.round(wordCounts.reduce((sum, value) => sum + value, 0) / wordCounts.length)
      : null,
    unsupportedNumberRuns: results.filter((result) => result.unsupportedNumbers?.length).length,
    avgLatencyMs: ok.length
      ? Math.round(ok.reduce((sum, row) => sum + row.wallMs, 0) / ok.length)
      : null,
    failures: rows.filter((row) => row.status !== "ok").map((row) => row.error?.slice(0, 160)),
  };
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 180000,
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

  const rows = await page.evaluate(
    async ({ reportsInput, aggregatesInput, runs, paceMs }) => {
      const inference = await import("/src/modules/inference/index.ts");
      const output = [];
      const tasks = [
        ["sitrep.cluster.v1", { reports: reportsInput }],
        ["sitrep.daily.v1", { reports: reportsInput, aggregates: aggregatesInput }],
      ];
      for (const [task, input] of tasks) {
        for (let index = 0; index < runs; index += 1) {
          if (paceMs > 0) await new Promise((resolve) => setTimeout(resolve, paceMs));
          const started = performance.now();
          const result = await inference.runTask(task, input, {
            consentToCloud: true,
            forceCloud: true,
          });
          output.push({
            task,
            run: index + 1,
            status: result.status,
            data: result.data,
            error: result.error ?? null,
            meta: result.meta,
            wallMs: Math.round(performance.now() - started),
            confidenceSampleRingout: result.meta?.confidenceStep ?? null,
            confidenceTs: result.meta?.confidenceTs ?? null,
            cachedMeta: result.meta ?? null,
          });
        }
      }
      return output;
    },
    { reportsInput: reports, aggregatesInput: aggregates, runs: RUNS, paceMs: PACE_MS },
  );

  const clusterRows = rows.filter((row) => row.task === "sitrep.cluster.v1");
  const dailyRows = rows.filter((row) => row.task === "sitrep.daily.v1");
  const payload = {
    status: "measured",
    measuredAt: new Date().toISOString(),
    url: URL,
    model: "gemini-3.5-flash-lite (ONLY_IN_CLOUD)",
    runsPerTask: RUNS,
    paceMs: PACE_MS,
    fixture: {
      reports: reports.length,
      ids: [...inputIds],
      expectedDuplicateIds: ["r1", "r2", "r4"],
    },
    summary: {
      cluster: summarize(clusterRows, clusterChecks, "sitrep.cluster.v1"),
      daily: summarize(dailyRows, dailyChecks, "sitrep.daily.v1"),
    },
    clusterRuns: clusterRows.map((row) => ({
      run: row.run,
      status: row.status,
      checks: row.data ? clusterChecks(row.data) : null,
      latencyMs: row.wallMs,
      confidenceSampleRingout: row.confidenceSampleRingout ?? null,
      confidenceTs: row.confidenceTs ?? null,
      cachedMeta: row.cachedMeta ?? null,
    })),
    dailyRuns: dailyRows.map((row) => ({
      run: row.run,
      status: row.status,
      checks: row.data ? dailyChecks(row.data) : null,
      latencyMs: row.wallMs,
      cachedMeta: row.cachedMeta ?? null,
    })),
    results: rows,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(JSON.stringify(payload.summary, null, 2));
  console.log("SITREP_MEASURE_WRITTEN:", OUT);
} catch (error) {
  console.error("SITREP_MEASURE_FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await browser.close();
}

// end of measure-sitrep harness
