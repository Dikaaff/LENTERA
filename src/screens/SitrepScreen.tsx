import { ClipboardList, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { runTask } from "@/modules/inference";
import { useReports } from "@/modules/queue";
import type { ClusterResult, SitrepResult } from "@/modules/reports";
import {
  claimsWithSources,
  sanitizedReports,
  setConsent,
  sitrepWords,
  splitClusters,
  useConsent,
  WORD_LIMIT,
} from "@/modules/sitrep";

const HEADING: Record<string, string> = {
  overview: "Ringkasan",
  most_urgent: "Kebutuhan paling mendesak",
  affected: "Wilayah paling terdampak",
  gaps: "Celah data",
};

export function SitrepScreen() {
  const consent = useConsent();
  const reports = useReports();
  const [cluster, setCluster] = useState<ClusterResult | null>(null);
  const [sitrep, setSitrep] = useState<SitrepResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);

  const sanitized = sanitizedReports(reports);
  const source = reports.find((report) => report.id === sourceId);

  const aggregate = {
    total_reports: sanitized.length,
    by_region: sanitized.reduce<Record<string, number>>((acc, item) => {
      acc[item.region] = (acc[item.region] ?? 0) + 1;
      return acc;
    }, {}),
    by_urgency: sanitized.reduce<Record<string, number>>((acc, item) => {
      const key = item.extraction.urgency ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const dedupe = async () => {
    if (!consent) return;
    setBusy(true);
    setError(null);
    const result = await runTask(
      "sitrep.cluster.v1",
      { reports: sanitized },
      { consentToCloud: true },
    );
    if (result.status === "ok" && result.data) setCluster(result.data);
    else setError(result.error ?? "Deduplikasi gagal. Coba lagi saat jaringan stabil.");
    setBusy(false);
  };

  const generate = async () => {
    if (!consent) return;
    setBusy(true);
    setError(null);
    const result = await runTask(
      "sitrep.daily.v1",
      { reports: sanitized, aggregates: aggregate },
      { consentToCloud: true },
    );
    if (result.status === "ok" && result.data) setSitrep(result.data);
    else setError(result.error ?? "SITREP gagal disusun. Tidak ada klaim yang ditampilkan.");
    setBusy(false);
  };

  if (!consent) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight">SITREP</h1>
        <Card className="border-amber/60">
          <CardBody className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber">
              <ShieldCheck className="size-4" /> Persetujuan cloud diperlukan
            </p>
            <p className="text-sm text-muted">
              Deduplikasi dan SITREP berjalan di cloud. Laporan yang dikirim sudah disamarkan: nama
              dan nomor telepon pelapor diganti token. Data korban dan lokasi tetap menjadi isi
              laporan.
            </p>
            <Button onClick={() => setConsent(true)}>Setujui dan lanjutkan</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const words = sitrep ? sitrepWords(sitrep) : 0;
  const split = cluster ? splitClusters(cluster) : null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight">SITREP</h1>
        <p className="mt-1 text-sm text-muted">
          {sanitized.length} laporan tersanitasi siap dikirim ke cloud.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || sanitized.length === 0}
          onClick={() => void dedupe()}
        >
          <ClipboardList className="size-4" /> Deduplikasi
        </Button>
        <Button size="sm" disabled={busy || sanitized.length === 0} onClick={() => void generate()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Susun SITREP
        </Button>
      </div>

      {error && (
        <p role="alert" className="border border-emergency/50 p-3 text-xs text-emergency">
          {error}
        </p>
      )}

      {cluster && split && (
        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              Kandidat duplikat
            </h2>
            {cluster.clusters.length === 0 && (
              <p className="text-sm text-muted">Tidak ada duplikat.</p>
            )}
            {cluster.clusters.map((item) => (
              <div key={item.canonical_id} className="border border-line p-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge tone={item.confidence >= 0.6 ? "synced" : "danger"}>
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                  <span className="font-mono">
                    {item.canonical_id.slice(0, 8)} ←{" "}
                    {item.duplicate_ids.map((id) => id.slice(0, 8)).join(", ") || "—"}
                  </span>
                </div>
                <p className="mt-1 text-muted">{item.reason}</p>
                {item.confidence < 0.6 && (
                  <p className="mt-1 text-emergency">
                    Di bawah 0,6 — perlu ditinjau manusia, belum diterapkan.
                  </p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {sitrep && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="tabular-nums">{words} kata</span>
            {words > WORD_LIMIT && <Badge tone="danger">melebihi {WORD_LIMIT} kata</Badge>}
          </div>
          {sitrep.sections.map((section) => (
            <Card key={section.heading}>
              <CardBody className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
                  {HEADING[section.heading] ?? section.heading}
                </h2>
                {section.claims.map((claim, index) => (
                  <p key={index} className="text-sm leading-relaxed">
                    {claim.text}{" "}
                    {claim.source_ids.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSourceId(id)}
                        className="min-h-6 border-b border-amber font-mono text-[11px] text-amber"
                        aria-label={`Buka sumber ${id}`}
                      >
                        {id.slice(0, 8)}
                      </button>
                    ))}
                  </p>
                ))}
              </CardBody>
            </Card>
          ))}
          <p className="text-[11px] text-muted">
            {claimsWithSources(sitrep).length} klaim bersumber dari {sanitized.length} laporan.
          </p>
        </div>
      )}

      {source && (
        <Card className="border-amber/50">
          <CardBody className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge tone="amber">Sumber {source.id.slice(0, 8)}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setSourceId(null)}>
                Tutup
              </Button>
            </div>
            <p className="text-sm">{source.extraction.summary ?? "Tanpa ringkasan."}</p>
            <p className="text-xs text-muted">
              {source.region} · {source.post} · {new Date(source.createdAt).toLocaleString("id-ID")}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
