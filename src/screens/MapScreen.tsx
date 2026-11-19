import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { MAP_HEIGHT, MAP_WIDTH, countByRegion, regions, shadeFor } from "@/modules/map/geometry";
import { useReports } from "@/modules/queue";
import { statusLabel } from "@/modules/reports";

export function MapScreen() {
  const { language, t } = useLanguage();
  const reports = useReports();
  const counts = countByRegion(reports);
  const max = Math.max(0, ...Object.values(counts));
  const [selected, setSelected] = useState<string | null>(null);
  const selectedReports = reports.filter((report) => report.region === selected);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight">{t("map.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("map.subtitle")}</p>
      </header>

      <Card>
        <CardBody>
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label={t("map.aria")}
            className="h-auto w-full"
          >
            {regions.map((region) => (
              <path
                key={region.name}
                d={region.path}
                fill={shadeFor(counts[region.name] ?? 0, max)}
                stroke={selected === region.name ? "var(--color-ink)" : "var(--color-line)"}
                strokeWidth={selected === region.name ? 2 : 0.8}
                className="cursor-pointer transition-[fill] duration-200"
                onClick={() => setSelected(region.name)}
              >
                <title>
                  {t("map.regionReports", {
                    region: region.name,
                    count: counts[region.name] ?? 0,
                  })}
                </title>
              </path>
            ))}
          </svg>
          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted">{t("map.legend")}</p>
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2">
        {regions
          .filter((region) => (counts[region.name] ?? 0) > 0)
          .sort((a, b) => (counts[b.name] ?? 0) - (counts[a.name] ?? 0))
          .map((region) => (
            <button
              key={region.name}
              type="button"
              onClick={() => setSelected(region.name)}
              className={`min-h-11 border px-3 text-xs ${
                selected === region.name
                  ? "border-amber text-amber"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {region.name} <span className="tabular-nums">{counts[region.name]}</span>
            </button>
          ))}
      </div>

      {selected && (
        <section aria-live="polite" className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
            {t("map.regionReports", {
              region: selected,
              count: selectedReports.length,
            })}
          </h2>
          {selectedReports.length === 0 && (
            <p className="text-sm text-muted">{t("map.emptyRegion")}</p>
          )}
          {selectedReports.map((report) => (
            <Card key={report.id}>
              <CardBody className="space-y-1">
                <Badge tone={report.status === "synced" ? "synced" : "amber"}>
                  {statusLabel(report, language)}
                </Badge>
                <p className="text-sm">
                  {report.extraction.summary ?? report.rawNote.slice(0, 140)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
