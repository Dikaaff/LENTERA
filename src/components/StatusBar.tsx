import { useLastRun } from "@/modules/inference";
import { queueMode, useHeldCount } from "@/modules/queue";
import type { InferencePath } from "@/modules/reports";
import { NumberTicker } from "./motion";

const PATH_LABEL: Record<InferencePath | "idle", string> = {
  idle: "siap",
  on_device: "perangkat",
  cloud: "cloud",
  fallback: "cloud (cadangan)",
  unavailable: "belum aktif",
};

export function StatusBar() {
  const last = useLastRun();
  const held = useHeldCount();
  const path = last?.path ?? "idle";

  return (
    <div className="flex items-center justify-between gap-3 border-y border-line bg-surface px-4 py-2 text-xs">
      <span className="flex items-center gap-2 text-muted">
        <span
          aria-hidden
          className={`size-2 ${path === "on_device" ? "bg-synced" : path === "unavailable" ? "bg-emergency" : "bg-amber"}`}
        />
        Proses: <strong className="font-semibold text-ink">{PATH_LABEL[path]}</strong>
      </span>
      <span className="flex items-center gap-3 text-muted">
        <span className="uppercase tracking-wider">
          {queueMode === "cloud" ? "firestore" : "lokal saja"}
        </span>
        <span>
          Antrean: <NumberTicker value={held} className="font-semibold text-ink" />
        </span>
      </span>
    </div>
  );
}
