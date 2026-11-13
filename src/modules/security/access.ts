import type { ReportStatus } from "@/modules/reports";

export type Role = "relawan" | "koordinator" | "tamu";

export interface Actor {
  uid: string | null;
  role: Role;
  coordinatorRegion?: string | null;
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
    (actor.role === "koordinator" && actor.coordinatorRegion === report.region));

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
  const coordinatorCanFlag =
    actor.role === "koordinator" &&
    actor.coordinatorRegion === report.region &&
    changedKeys.length === 1 &&
    changedKeys[0] === "status";
  return ownerCanEdit || coordinatorCanFlag;
};

/** Deletion is never granted to a client role. */
export const canDelete = () => false;
