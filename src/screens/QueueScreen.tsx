import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { BlurFade, NumberTicker } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { localeFor } from "@/lib/language";
import { exportQueue, queueMode, retrySync, useHeldCount, useReports } from "@/modules/queue";
import { statusLabel, type InferencePath, type ReportRecord } from "@/modules/reports";

const PATH_KEY: Record<InferencePath, TranslationKey> = {
  on_device: "path.on_device",
  cloud: "path.cloud",
  fallback: "path.fallback",
  unavailable: "path.unavailable",
};

const toneFor = (report: ReportRecord) => {
  if (report.status === "conflict" || report.needsReview) return "danger" as const;
  if (report.status === "synced") return "synced" as const;
  if (report.status === "queued") return "amber" as const;
  return "neutral" as const;
};

export function QueueScreen() {
  const { language, t } = useLanguage();
  const reports = useReports();
  const held = useHeldCount();
  const [exported, setExported] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("queue.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {queueMode === "cloud" ? t("queue.subtitleCloud") : t("queue.subtitleLocal")}
          </p>
        </div>
        <div className="text-right">
          <NumberTicker value={held} className="text-3xl font-bold text-amber" />
          <p className="text-[11px] uppercase tracking-wider text-muted">{t("queue.held")}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => retrySync()}>
          <RefreshCw className="size-4" /> {t("queue.retry")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setExported(exportQueue())}>
          <Download className="size-4" /> {t("queue.export")}
        </Button>
        {exported && <span className="self-center text-xs text-synced">{exported}</span>}
      </div>

      {reports.length === 0 && (
        <p className="border border-line p-6 text-center text-sm text-muted">{t("queue.empty")}</p>
      )}

      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id}>
            <BlurFade>
              <Card>
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={toneFor(report)}>{statusLabel(report, language)}</Badge>
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      {report.region} · {report.post}
                    </span>
                    <span className="ml-auto text-[11px] text-muted">
                      {new Date(report.updatedAt).toLocaleString(localeFor(language))}
                    </span>
                  </div>
                  <p className="text-sm">
                    {report.extraction.summary ??
                      (report.rawNote.slice(0, 160) || t("queue.noSummary"))}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted">
                    {t("queue.path", {
                      path: t(PATH_KEY[report.inference.path]),
                      duration: report.inference.durationMs,
                      id: report.id.slice(0, 8),
                    })}
                  </p>
                  {report.status === "conflict" && (
                    <p className="border border-emergency/50 p-2 text-xs text-emergency">
                      {t("queue.conflict")}
                    </p>
                  )}
                </CardBody>
              </Card>
            </BlurFade>
          </li>
        ))}
      </ul>
    </div>
  );
}
