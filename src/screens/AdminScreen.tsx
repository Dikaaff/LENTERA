import { ShieldCheck, FileText, ClipboardList, AlertCircle, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useHeldCount } from "@/modules/queue";

export function AdminScreen() {
  const held = useHeldCount();

  const stats = [
    { label: "Laporan terkirim", value: held, icon: FileText, tone: "synced" as const },
    { label: "Dalam antrean", value: held, icon: ClipboardList, tone: "neutral" as const },
    { label: "Ditahan verifikasi", value: 0, icon: AlertCircle, tone: "danger" as const },
    { label: "Wilayah aktif", value: 2, icon: Map, tone: "amber" as const },
  ];

  const recentReports = [
    {
      id: "LTR-0142",
      waktu: "2 menit lalu",
      wilayah: "Bandung",
      isi: "Evakuasi warga di balai desa",
      status: "tersedia",
    },
    {
      id: "LTR-0141",
      waktu: "8 menit lalu",
      wilayah: "Sukamaju",
      isi: "Warga membutuhkan air bersih",
      status: "tersedia",
    },
    {
      id: "LTR-0140",
      waktu: "14 menit lalu",
      wilayah: "Bandung",
      isi: "Laporan duplikat tertutup",
      status: "ditahan",
    },
    {
      id: "LTR-0139",
      waktu: "27 menit lalu",
      wilayah: "Bandung",
      isi: "Titik evakuasi sudah direvisi",
      status: "tersedia",
    },
    {
      id: "LTR-0138",
      waktu: "41 menit lalu",
      wilayah: "-",
      isi: "Laporan tanpa wilayah, ditinjau manual",
      status: "ditahan",
    },
  ];

  const regionsList = [
    { name: "Bandung", reports: 3, status: "aktif" },
    { name: "Sukamaju", reports: 1, status: "aktif" },
    { name: "Kabupaten tidak diketahui", reports: 1, status: "perlu tinjau" },
  ];

  const sitrepStatus = {
    words: 68,
    limit: 150,
    submitted: false,
    note: "SITREP hari ini belum dikirim. Koordinator dapat menyusun laporan sebelum batas kata.",
  };

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
            Ringkasan laporan, antrean, dan SITREP dari sudut pandang koordinator.
          </p>
        </div>
        <Badge tone="amber">koordinator</Badge>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.label} className="border-line">
            <CardBody className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                <s.icon className="size-3.5 text-muted" />
                {s.label}
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[11px] text-muted">
                {s.label === "Laporan terkirim"
                  ? "Siap diproses cloud"
                  : s.label === "Dalam antrean"
                    ? "Menunggu sinkronisasi cloud"
                    : s.label === "Ditahan verifikasi"
                      ? "Menunggu koordinator tindak lanjuti"
                      : "Wilayah dengan laporan masuk"}
              </p>
            </CardBody>
          </Card>
        ))}
      </section>

      <Card className="border-line">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              Laporan terbaru
            </h2>
            <span className="text-[11px] text-muted">{recentReports.length} laporan</span>
          </div>

          <div className="space-y-2">
            {recentReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-base p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      <span className="font-mono text-[11px] text-muted">{r.id}</span>
                      {r.wilayah !== "-" ? ` — ${r.wilayah}` : " — Wilayah belum ada"}
                    </p>
                    <p className="text-xs text-muted truncate">{r.isi}</p>
                  </div>
                  <Badge tone={r.status === "tersedia" ? "synced" : "danger"} className="shrink-0">
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{r.waktu}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-line">
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
              Wilayah terjangkau
            </h2>
            <div className="space-y-2">
              {regionsList.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl bg-base p-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.reports} laporan</p>
                  </div>
                  <Badge tone={r.status === "aktif" ? "synced" : "danger"}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border-amber/20">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber">
                SITREP hari ini
              </h2>
              <Badge tone={sitrepStatus.submitted ? "synced" : "neutral"}>
                {sitrepStatus.submitted ? "sudah dikirim" : "belum dikirim"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Kata:</span>
                <span className="font-medium tabular-nums">
                  {sitrepStatus.words} / {sitrepStatus.limit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-amber"
                  style={{
                    width: `${Math.min(100, (sitrepStatus.words / sitrepStatus.limit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted">{sitrepStatus.note}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm">
          Muat ulang
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          Kosongkan antrean (demo)
        </Button>
      </div>
    </div>
  );
}
