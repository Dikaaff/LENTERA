import { describe, expect, it } from "vitest";
import { canCreate, canDelete, canRead, canUpdate } from "../access";

const volunteerA = { uid: "vol-a", role: "relawan" as const };
const volunteerB = { uid: "vol-b", role: "relawan" as const };
const admin = {
  uid: "admin-1",
  role: "admin" as const,
  adminRegion: "Jawa Barat",
};
const report = {
  reporterId: "vol-a",
  region: "Jawa Barat",
  status: "queued" as const,
};

describe("rules mirror", () => {
  it("denies volunteer A reading volunteer B's report", () => {
    expect(canRead(volunteerB, report)).toBe(false);
    expect(canRead(volunteerA, report)).toBe(true);
  });

  it("denies an unnamed guest", () => {
    expect(canRead({ uid: null, role: "tamu" }, report)).toBe(false);
    expect(canCreate({ uid: null, role: "tamu" }, report)).toBe(false);
  });

  it("denies a volunteer editing a synced report", () => {
    expect(canUpdate(volunteerA, { ...report, status: "synced" }, ["status"])).toBe(false);
    expect(canUpdate(volunteerA, report, ["status"])).toBe(true);
  });

  it("lets an admin read their region and flag only", () => {
    expect(canRead(admin, report)).toBe(true);
    expect(canUpdate(admin, report, ["status"])).toBe(true);
    expect(canUpdate(admin, report, ["status", "region"])).toBe(false);
  });

  it("denies an admin from another region", () => {
    expect(canRead({ ...admin, adminRegion: "Aceh" }, report)).toBe(false);
  });

  it("never allows deletion", () => {
    expect(canDelete()).toBe(false);
  });

  it("rejects a report created for someone else", () => {
    expect(canCreate(volunteerB, report)).toBe(false);
    expect(canCreate(volunteerA, report)).toBe(true);
  });
});
