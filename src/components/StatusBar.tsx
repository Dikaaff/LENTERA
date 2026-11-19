import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useLastRun } from "@/modules/inference";
import { queueMode, useHeldCount } from "@/modules/queue";
import type { InferencePath } from "@/modules/reports";
import { NumberTicker } from "./motion";

const PATH_KEY: Record<InferencePath | "idle", TranslationKey> = {
  idle: "statusbar.path.idle",
  on_device: "statusbar.path.on_device",
  cloud: "statusbar.path.cloud",
  fallback: "statusbar.path.fallback",
  unavailable: "statusbar.path.unavailable",
};

export function StatusBar() {
  const { t } = useLanguage();
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
        {t("statusbar.process")}{" "}
        <strong className="font-semibold text-ink">{t(PATH_KEY[path])}</strong>
      </span>
      <span className="flex items-center gap-3 text-muted">
        <span className="uppercase tracking-wider">
          {queueMode === "cloud" ? t("statusbar.mode.cloud") : t("statusbar.mode.local")}
        </span>
        <span>
          {t("statusbar.queue")} <NumberTicker value={held} className="font-semibold text-ink" />
        </span>
      </span>
    </div>
  );
}
