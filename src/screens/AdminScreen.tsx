import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { useHeldCount } from "@/modules/queue";
import { regions } from "@/modules/map/geometry";

const TRACK_LIST = [
  {
    id: "r1",
    label: "Evakuasi — Balai Desa Sukamaju, Bandung",
    outcome: "tepat",
    reason: "Dua laporan yang hampir sama digabung jadi satu baris.",
  },
  {
    id: "r2",
    label: "Evakuasi — Balai Desa Sukamaju, Bandung (duplikat tertutup)",
    outcome: "tepat",
    reason: "Kandidat duplikat terdeteksi, ID duplikat tercatat.",
  },
  {
    id: "r3",
    label: "Pangan & air — Desa Cibeureum, kabupaten tidak diketahui",
    outcome: "tepat",
    reason: "Lokasi dengan regency null otomatis jadi keyakinan rendah.",
  },
  {
    id: "r4",
    label: "Evakuasi — Balai Desa Sukamaju, Bandung (laporan ketiga)",
    outcome: "tepat",
    reason: "Ketiganya digabung sebelum SITREP dibuat.",
  },
  {
    id: "r5",
    label: "Lainnya — infomasi minim, tidak ada detail",
    outcome: "tepat",
    reason: "Laporan tidak isValid ditangani tanpa error, tidak dibuat klaim palsu.",
  },
];

export function AdminScreen() {
  const held = useHeldCount();
  const [sector, setSector] = useState<Record<string, unknown> | null>(null);
  const [zone, setZone] = useState(regions[0]?.name ?? "");
  const [sectorFilter, setSectorFilter] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const demoClusterIds: { canonical_id: string; duplicate_ids: string[] }[] = [
    { canonical_id: "r1", duplicate_ids: ["r2", "r4"] },
    { canonical_id: "r3", duplicate_ids: [] },
    { canonical_id: "r5", duplicate_ids: [] },
  ];

  const verifyCluster = (expected: ("r1" | "r2" | "r4")[]) => {
    const matched = expected.filter((id) =>
      demoClusterIds.some((c) => c.canonical_id === id || c.duplicate_ids.includes(id)),
    );
    return { expected, matched, missing: expected.filter((id) => !matched.includes(id)) };
  };

  const verifyDaily = (rawWords: number, limit = 150) => {
    const within = rawWords <= limit;
    return { rawWords, limit, within, over: rawWords - limit };
  };

  const inspect = () => {
    if (!sector) return;
    setSubmitted(true);
  };
  const reviewResult = submitted
    ? {
        clusters: verifyCluster(["r1", "r2", "r4"]),
        daily: verifyDaily(Number(sector?.words ?? 0)),
      }
    : null;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber/20">
              <ShieldCheck className="size-4 text-amber" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Panel koordinator</h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Lihat laporan, hasil deduplikasi, dan SITREP harian.
          </p>
        </div>
        <Badge tone="amber">koordinator</Badge>
      </header>
      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="space-y-1">
            <Label>Total laporan tersanitasi</Label>
            <p className="text-lg font-bold tabular-nums">{held}</p>
            <p className="text-xs text-muted">Siap diproses cloud</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-1">
            <Label>Laporan dalam antrean</Label>
            <p className="text-lg font-bold tabular-nums">{held}</p>
            <p className="text-xs text-muted">Menunggu sinkronisasi</p>
          </CardBody>
        </Card>
      </section>
      <Card className="border-amber/30">
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              Uji kasus admin
            </h2>
            <Badge tone="neutral" className="ml-auto">
              verifikasi perilaku
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <Label>Fokus sektor</Label>
              <Input
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                placeholder="mis. evakuasi, medis, air bersih…"
              />
            </label>
            <label className="block">
              <Label>Zona wilayah</Label>
              <Input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="mis. Bandung, Sukamaju…"
              />
            </label>
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-base p-3">
            <p className="text-sm font-semibold text-ink">Daftar laporan uji</p>
            {TRACK_LIST.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl bg-surface p-3">
                <div className="mt-0.5 shrink-0">
                  {item.outcome === "tepat" ? (
                    <div className="flex size-5 items-center justify-center rounded-full bg-synced/20">
                      <div className="h-2 w-2 rounded-full bg-synced" />
                    </div>
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full bg-surface">
                      <div className="h-2 w-2 rounded-full border border-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-[11px] text-muted">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => void inspect()} disabled={!sector}>
            <ShieldCheck className="size-4" /> Tinjau hasil
          </Button>
        </CardBody>
      </Card>
      {reviewResult && (
        <Card className="border-line">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
                Hasil tinjauan
              </h2>
              <Badge tone={reviewResult.clusters.missing.length === 0 ? "synced" : "danger"}>
                {reviewResult.clusters.missing.length === 0 ? "lulus" : "ada yang hilang"}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Cluster deduplikasi
                </p>
                <div className="rounded-xl bg-base p-3">
                  <p className="mb-1 text-sm font-medium text-ink">
                    Diharapkan: {reviewResult.clusters.expected.join(", ")}
                  </p>
                  <p className="mb-1 text-sm font-medium text-ink">
                    Ditemukan: {reviewResult.clusters.matched.join(", ")}
                  </p>
                  {reviewResult.clusters.missing.length > 0 ? (
                    <p className="text-xs text-emergency">
                      Hilang: {reviewResult.clusters.missing.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-synced">Semua ID tercatat.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  SITREP hari ini
                </p>
                <div className="rounded-xl bg-base p-3">
                  <p className="mb-1 text-sm font-medium text-ink">
                    Kata: {reviewResult.daily.rawWords} / batas {reviewResult.daily.limit}
                  </p>
                  <p className="mb-1 text-sm">
                    {reviewResult.daily.within
                      ? "Dalam batas. Tidak ada klaim yang dibuang."
                      : `Melebihi ${reviewResult.daily.over} kata. Perlu penyederhanaan.`}
                  </p>
                  {!reviewResult.daily.within && (
                    <p className="text-xs text-emergency">
                      Teks SITREP perlu dipangkas sebelum dikirim.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                Ulang
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSector(null)}>
                Tutup
              </Button>
            </div>
          </CardBody>
        </Card>
      )}{" "}
      {sector && (
        <Card className="border-amber/20">
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
                Rangkuman sektor
              </h2>
              <Badge tone="neutral">{sectorFilter || "semua"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted">Wilayah</p>
                <p className="font-medium text-ink">{(sector as any).region ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted">Klaim</p>
                <p className="font-medium text-ink">{(sector as any).claims ?? 0}</p>
              </div>
              <div>
                <p className="text-muted">Kata</p>
                <p className="font-medium text-ink">{(sector as any).words ?? 0}</p>
              </div>
              <div>
                <p className="text-muted">Status</p>
                <p className="font-medium">{(sector as any).status ?? "—"}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink">
              {(sector as any).summary ? (
                <span dangerouslySetInnerHTML={{ __html: (sector as any).summary }} />
              ) : (
                "Belum ada ringkasan."
              )}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
