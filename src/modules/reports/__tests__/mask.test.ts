import { describe, expect, it } from "vitest";
import { maskReporterPII } from "../mask";

describe("maskReporterPII", () => {
  it("masks an Indonesian phone number and keeps a token map", () => {
    const { masked, tokens } = maskReporterPII("Hubungi saya di 0812-3456-7890.");
    expect(masked).not.toContain("0812");
    expect(Object.values(tokens)).toContain("0812-3456-7890");
  });

  it("masks a labelled reporter name", () => {
    const { masked } = maskReporterPII("Nama saya Budi Santoso, saya melapor.");
    expect(masked).toContain("[NAMA_1]");
    expect(masked).not.toContain("Budi Santoso");
  });

  it("keeps victim counts and locations", () => {
    const text = "350 jiwa terdampak di Kecamatan Rancaekek.";
    expect(maskReporterPII(text).masked).toBe(text);
  });

  it("masks emails", () => {
    const { masked } = maskReporterPII("Kirim ke relawan@contoh.id");
    expect(masked).toContain("[EMAIL_1]");
  });
});
