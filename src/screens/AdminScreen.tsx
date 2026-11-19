import {
  AlertCircle,
  ClipboardList,
  FileText,
  Map as MapIcon,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { resumeSync, useReports } from "@/modules/queue";
import { statusLabel, type ReportRecord, type ReportStatus } from "@/modules/reports";
import { WORD_LIMIT } from "@/modules/sitrep";

const toneFor = (status: ReportStatus, needsReview: boolean) => {
  if (status === "synced") return "synced" as const;
  if (status === "conflict" || needsReview) return "danger" as const;
  return "neutral" as const;
};

export function AdminScreen() {
  const { language, t } = useLanguage();
  const reports = useReports();

  const relativeTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60_000);
    if (minutes < 1) return t("admin.timeNow");
    if (minutes < 60) return t("admin.timeMinutes", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("admin.timeHours", { count: hours });
    return t("admin.timeDays", { count: Math.floor(hours / 24) });
  };

  const groupByRegion = (rows: ReportRecord[]) => {
    const counts = new Map<string, number>();
    for (const report of rows) {
      const region = report.region.trim() || t("admin.noRegion");
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const synced = reports.filter((r) => r.status === "synced").length;
  const queued = reports.filter((r) => r.status === "queued" || r.status === "draft").length;
  const needsReview = reports.filter((r) => r.status === "conflict" || r.needsReview).length;
  const regions = groupByRegion(reports);
  const recent = reports.slice(0, 5);

  const stats: {
    key: string;
    label: TranslationKey;
    hint: TranslationKey;
    value: number;
    icon: typeof FileText;
  }[] = [
    {
      key: "synced",
      label: "admin.stats.synced",
      hint: "admin.hint.synced",
      value: synced,
      icon: FileText,
    },
    {
      key: "queued",
      label: "admin.stats.queued",
      hint: "admin.hint.queued",
      value: queued,
      icon: ClipboardList,
    },
    {
      key: "review",
      label: "admin.stats.review",
      hint: "admin.hint.review",
      value: needsReview,
      icon: AlertCircle,
    },
    {
      key: "regions",
      label: "admin.stats.regions",
      hint: "admin.hint.regions",
      value: regions.length,
      icon: MapIcon,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber/20">
              <ShieldCheck className="size-4 text-amber" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{t("admin.title")}</h1>
          </div>
          <p className="mt-1 text-sm text-muted">{t("admin.subtitle")}</p>
        </div>
        <Badge tone="amber">{t("admin.badge")}</Badge>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.key} className="border-line">
            <CardBody className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                <s.icon className="size-3.5 text-muted" />
                {t(s.label)}
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[11px] text-muted">{t(s.hint)}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <Card className="border-line">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              {t("admin.recent")}
            </h2>
            <span className="text-[11px] text-muted">
              {t("admin.reports", { count: recent.length })}
            </span>
          </div>

          {recent.length === 0 ? (
            <p className="rounded-xl border border-line bg-base p-4 text-sm text-muted">
              {t("admin.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <div key={r.id} className="rounded-xl border border-line bg-base p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        <span className="font-mono text-[11px] text-muted">{r.id.slice(0, 8)}</span>
                        {` — ${r.region.trim() || t("admin.noRegion")}`}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {r.extraction.summary ?? t("admin.noSummary")}
                      </p>
                    </div>
                    <Badge tone={toneFor(r.status, r.needsReview)} className="shrink-0">
                      {statusLabel(r, language)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted">{relativeTime(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-line">
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              {t("admin.regionsTitle")}
            </h2>
            {regions.length === 0 ? (
              <p className="text-sm text-muted">{t("admin.noRegions")}</p>
            ) : (
              <div className="space-y-2">
                {regions.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-xl bg-base p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                      <p className="text-[11px] text-muted">
                        {t("admin.reportsCount", { count: r.count })}
                      </p>
                    </div>
                    <Badge tone="synced">{t("admin.regionBadge")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border-amber/20">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
                {t("admin.sitrepTitle")}
              </h2>
              <Badge tone="neutral">{t("admin.sitrepBadge")}</Badge>
            </div>
            <p className="text-xs text-muted">{t("admin.sitrepText", { limit: WORD_LIMIT })}</p>
            <Link
              to="/sitrep"
              className="inline-flex min-h-9 items-center justify-center border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-muted"
            >
              {t("admin.openSitrep")}
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => resumeSync()}>
          <RefreshCw className="size-4" /> {t("admin.resync")}
        </Button>
        <Link
          to="/antrean"
          className="inline-flex min-h-9 items-center justify-center gap-2 border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-muted"
        >
          <ClipboardList className="size-4" /> {t("admin.openQueue")}
        </Link>
      </div>
    </div>
  );
}
