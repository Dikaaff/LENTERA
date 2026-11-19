import type { ReportStatus } from "@/modules/reports";

export type Role = "relawan" | "admin" | "tamu";

export interface Actor {
  uid: string | null;
  role: Role;
  adminRegion?: string | null;
}

export interface ReportAccessShape {
  reporterId: string;
  region: string;
  status: ReportStatus;
}

export const isSignedIn = (actor: Actor) => actor.uid !== null;

export const canRead = (actor: Actor, report: ReportAccessShape) =>
  isSignedIn(actor) &&
  (report.reporterId === actor.uid ||
    (actor.role === "admin" && actor.adminRegion === report.region));

export const canCreate = (actor: Actor, report: ReportAccessShape) =>
  isSignedIn(actor) &&
  report.reporterId === actor.uid &&
  (report.status === "draft" || report.status === "queued");

export const canUpdate = (
  actor: Actor,
  report: ReportAccessShape,
  changedKeys: (keyof ReportAccessShape)[],
) => {
  if (!isSignedIn(actor)) return false;
  const ownerCanEdit = report.reporterId === actor.uid && report.status !== "synced";
  const adminCanFlag =
    actor.role === "admin" &&
    actor.adminRegion === report.region &&
    changedKeys.length === 1 &&
    changedKeys[0] === "status";
  return ownerCanEdit || adminCanFlag;
};

/** Deletion is never granted to a client role. */
export const canDelete = () => false;
