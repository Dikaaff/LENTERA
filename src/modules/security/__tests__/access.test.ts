import { describe, expect, it } from "vitest";
import { canCreate, canDelete, canRead, canUpdate } from "../access";

const volunteerA = { uid: "vol-a", role: "relawan" as const };
const volunteerB = { uid: "vol-b", role: "relawan" as const };
const coordinator = {
  uid: "coord-1",
  role: "koordinator" as const,
  coordinatorRegion: "Jawa Barat",
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

  it("lets a coordinator read their region and flag only", () => {
    expect(canRead(coordinator, report)).toBe(true);
    expect(canUpdate(coordinator, report, ["status"])).toBe(true);
    expect(canUpdate(coordinator, report, ["status", "region"])).toBe(false);
  });

  it("denies a coordinator from another region", () => {
    expect(canRead({ ...coordinator, coordinatorRegion: "Aceh" }, report)).toBe(false);
  });

  it("never allows deletion", () => {
    expect(canDelete()).toBe(false);
  });

  it("rejects a report created for someone else", () => {
    expect(canCreate(volunteerB, report)).toBe(false);
    expect(canCreate(volunteerA, report)).toBe(true);
  });
});
