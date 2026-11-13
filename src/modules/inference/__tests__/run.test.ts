import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  getFirebaseApp: vi.fn(() => ({})),
  isFirebaseConfigured: true,
}));
vi.mock("../client", () => ({ generate: vi.fn() }));

import { getFirebaseApp } from "@/lib/firebase";
import { generate } from "../client";
import { runTask } from "../run";

const mockGenerate = vi.mocked(generate);

const validJson = JSON.stringify({
  is_report: true,
  summary: "Dua belas orang mengungsi.",
  category: "evacuation",
  urgency: "high",
  location: { name: "Sukamaju", regency: null, confidence: "low" },
  people_affected: { min: 12, max: 12 },
  needs: [],
  note_anomaly: null,
});

const reply = (text: string, source: "ON_DEVICE" | "IN_CLOUD") => ({
  text,
  inferenceSource: source,
  model: source === "ON_DEVICE" ? ("on_device" as const) : ("cloud" as const),
});

beforeEach(() => mockGenerate.mockReset());

describe("runTask", () => {
  it("returns validated data and the real path", async () => {
    mockGenerate.mockResolvedValue(reply(validJson, "ON_DEVICE"));
    const result = await runTask(
      "report.extract.v1",
      { note: "Ada 12 orang mengungsi di Sukamaju." },
      { consentToCloud: true },
    );
    expect(result.status).toBe("ok");
    expect(result.data?.urgency).toBe("high");
    expect(result.meta.path).toBe("on_device");
    expect(result.meta.inferenceSource).toBe("ON_DEVICE");
  });

  it("retries once in cloud after local validation failure", async () => {
    mockGenerate
      .mockResolvedValueOnce(reply("not json", "ON_DEVICE"))
      .mockResolvedValueOnce(reply(validJson, "IN_CLOUD"));
    const result = await runTask(
      "report.extract.v1",
      { note: "catatan" },
      { consentToCloud: true },
    );
    expect(result.status).toBe("ok");
    expect(result.meta.retried).toBe(true);
    expect(result.meta.path).toBe("cloud");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate.mock.calls[1][0].mode).toBe("ONLY_IN_CLOUD");
  });

  it("keeps an unverified result instead of discarding it", async () => {
    mockGenerate
      .mockResolvedValueOnce(reply('{"is_report":true,"urgency":"severe"}', "ON_DEVICE"))
      .mockResolvedValueOnce(reply("{}", "IN_CLOUD"));
    const result = await runTask(
      "report.extract.v1",
      { note: "catatan" },
      { consentToCloud: true },
    );
    expect(result.status).toBe("unverified");
    expect(result.data).toBeNull();
    expect(result.rawText).toBe("{}");
  });

  it("downgrades to local-only when cloud consent is absent", async () => {
    mockGenerate.mockResolvedValue(reply(validJson, "ON_DEVICE"));
    await runTask("report.extract.v1", { note: "catatan" }, { consentToCloud: false });
    expect(mockGenerate.mock.calls[0][0].mode).toBe("ONLY_ON_DEVICE");
  });

  it("refuses a cloud-only task without consent", async () => {
    const result = await runTask(
      "sitrep.daily.v1",
      { reports: [], aggregates: {} },
      { consentToCloud: false },
    );
    expect(result.status).toBe("unavailable");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("routes an over-budget note straight to cloud", async () => {
    mockGenerate.mockResolvedValue(reply(validJson, "IN_CLOUD"));
    await runTask("report.extract.v1", { note: "x".repeat(17000) }, { consentToCloud: true });
    expect(mockGenerate.mock.calls[0][0].mode).toBe("ONLY_IN_CLOUD");
  });

  it("reports unavailable when Firebase is not configured", async () => {
    vi.mocked(getFirebaseApp).mockReturnValueOnce(null);
    const result = await runTask(
      "report.extract.v1",
      { note: "catatan" },
      { consentToCloud: true },
    );
    expect(result.status).toBe("unavailable");
    expect(result.meta.path).toBe("unavailable");
    expect(result.error).toContain("Firebase belum dikonfigurasi");
  });
});
