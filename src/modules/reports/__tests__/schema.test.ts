import { describe, expect, it } from "vitest";
import { extractionSchema, reportRecordSchema } from "../schema";
import { resolveRemote, statusLabel } from "../status";
import type { ReportRecord } from "../types";

const valid = {
  is_report: true,
  summary: "Dua belas orang mengungsi.",
  category: "evacuation",
  urgency: "high",
  location: { name: "Sukamaju", regency: null, confidence: "low" },
  people_affected: { min: 12, max: 12 },
  needs: [{ item: "air bersih", quantity: 20, unit: "liter" }],
  note_anomaly: null,
};

describe("extractionSchema", () => {
  it("accepts a complete extraction", () => {
    expect(extractionSchema.parse(valid).urgency).toBe("high");
  });

  it("rejects an enum value outside the allowed list", () => {
    expect(extractionSchema.safeParse({ ...valid, urgency: "severe" }).success).toBe(false);
  });

  it("rejects unknown keys instead of repairing them", () => {
    expect(extractionSchema.safeParse({ ...valid, injected: true }).success).toBe(false);
  });

  it("defaults omitted fields so is_report:false still validates", () => {
    const parsed = extractionSchema.parse({ is_report: false });
    expect(parsed.summary).toBeNull();
    expect(parsed.needs).toEqual([]);
  });

  it("keeps both bounds of a numeric range", () => {
    const parsed = extractionSchema.parse({
      ...valid,
      people_affected: { min: 30, max: 45 },
    });
    expect(parsed.people_affected).toEqual({ min: 30, max: 45 });
  });

  it("forces low confidence when a named place has no regency", () => {
    const parsed = extractionSchema.parse({
      ...valid,
      location: { name: "Desa Cibeureum", regency: null, confidence: "high" },
    });
    expect(parsed.location?.confidence).toBe("low");
  });

  it("rejects an implausible people count", () => {
    expect(
      extractionSchema.safeParse({ ...valid, people_affected: { min: 1_200_000, max: 1_200_000 } })
        .success,
    ).toBe(false);
  });

  it("rejects an implausible need quantity", () => {
    expect(
      extractionSchema.safeParse({
        ...valid,
        needs: [{ item: "air bersih", quantity: 999_999, unit: "liter" }],
      }).success,
    ).toBe(false);
  });
});

describe("reportRecordSchema", () => {
  const record: ReportRecord = {
    id: "12345678-abcd",
    createdAt: 1,
    updatedAt: 1,
    status: "queued",
    needsReview: false,
    post: "Pos Sukamaju",
    region: "Jawa Barat",
    reporterId: "vol-1",
    rawNote: "catatan asli",
    photo: null,
    extraction: extractionSchema.parse(valid),
    inference: {
      path: "on_device",
      durationMs: 100,
      artifact: "report.extract.v1",
      version: "1.0.0",
      reason: "uji",
      retried: false,
    },
  };

  it("accepts a stored record", () => {
    expect(reportRecordSchema.safeParse(record).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(reportRecordSchema.safeParse({ ...record, status: "sent" }).success).toBe(false);
  });

  it("normalises the SDK's lower-case inferenceSource instead of dropping the report", () => {
    const parsed = reportRecordSchema.parse({
      ...record,
      inference: { ...record.inference, inferenceSource: "in_cloud" },
    });
    expect(parsed.inference.inferenceSource).toBe("IN_CLOUD");
  });
});

describe("status helpers", () => {
  it("shows perlu ditinjau for unsynced review rows", () => {
    expect(statusLabel({ status: "queued", needsReview: true })).toBe("perlu ditinjau");
  });

  it("flags a newer remote copy as conflict without overwriting", () => {
    const local = { status: "queued", updatedAt: 10 } as ReportRecord;
    expect(resolveRemote(local, { updatedAt: 11 })).toBe("conflict");
    expect(resolveRemote(local, { updatedAt: 9 })).toBe("queued");
  });

  it("marks an acknowledged server copy as synced", () => {
    const local = { status: "queued", updatedAt: 10 } as ReportRecord;
    expect(resolveRemote(local, { updatedAt: 10 })).toBe("synced");
  });
});
