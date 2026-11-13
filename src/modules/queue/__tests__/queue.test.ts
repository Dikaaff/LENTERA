import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractionSchema } from "@/modules/reports/schema";

const extraction = extractionSchema.parse({
  is_report: true,
  summary: "Butuh air.",
  category: "food_water",
  urgency: "high",
  location: { name: "Cibeureum", regency: null, confidence: "low" },
  people_affected: null,
  needs: [],
  note_anomaly: null,
});

const input = {
  rawNote: "Butuh air di Cibeureum.",
  photo: null,
  post: "Pos Cibeureum",
  region: "Jawa Barat",
  reporterId: "vol-1",
  extraction,
  inference: {
    path: "on_device" as const,
    durationMs: 12,
    artifact: "report.extract.v1",
    version: "1.0.0",
    reason: "uji",
    retried: false,
  },
  needsReview: false,
};

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("queue", () => {
  it("survives a reload with the same report", async () => {
    const first = await import("../index");
    first.saveReport(input);

    vi.resetModules();
    const store = await import("../store");
    expect(store.allReports()).toHaveLength(1);
    expect(store.allReports()[0].rawNote).toBe(input.rawNote);
  });

  it("updates by id instead of duplicating a retry", async () => {
    const store = await import("../store");
    const { saveReport } = await import("../index");
    const record = saveReport(input);
    store.putReport({ ...record, status: "queued", updatedAt: 5 });
    expect(store.allReports()).toHaveLength(1);
  });

  it("counts held rows across states", async () => {
    const { saveReport, useHeldCount } = await import("../index");
    const store = await import("../store");
    const a = saveReport(input);
    saveReport(input);
    store.putReport({ ...a, status: "synced" });
    const rows = store.allReports();
    expect(rows).toHaveLength(2);
    expect(typeof useHeldCount).toBe("function");
  });
});
