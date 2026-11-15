import { useState } from "react";
import { ShieldCheck, Users, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import {
  signInCoordinator,
  signInCoordinatorWithPin,
  ensureVolunteer,
  useAuthUser,
} from "@/modules/auth";

const PERAN = [
  {
    id: "relawan",
    label: "Relawan lapangan",
    tagline: "Laporkan kejadian dari mana saja",
    desc: "Cukup tekan sekali. Tanpa akun, tanpa email. Laporan langsung masuk antrean dan siap dianalisis.",
    icon: PenLine,
    btnLabel: "Masuk sebagai relawan",
    btnHint: "otomatis, tanpa akun",
    btnVariant: "primary" as const,
  },
  {
    id: "koordinator",
    label: "Koordinator",
    tagline: "Lihat laporan & panel data wilayah",
    desc: "Akses panel koordinator untuk meninjau laporan, hasil deduplikasi, dan SITREP harian.",
    icon: ShieldCheck,
    btnLabel: "Masuk sebagai koordinator",
    btnHint: " pakai Google",
    btnVariant: "secondary" as const,
  },
] as const;

export function LoginScreen() {
  const { role, user } = useAuthUser();
  const isCoordinator = role === "koordinator";
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  if (isCoordinator) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col">
        <div className="mx-auto mt-10 size-14">
          <img src="/logo.svg" alt="LENTERA" className="size-full" />
        </div>
        <div className="mt-6 space-y-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber/20">
              <ShieldCheck className="size-5 text-amber" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Halo, koordinator</p>
              <p className="text-sm text-muted">
                {user?.isAnonymous
                  ? "Teridentifikasi sebagai relawan otomatis."
                  : "Akun terhubung."}
              </p>
            </div>
          </div>
          <Card className="border-amber/20">
            <CardBody className="space-y-3">
              <p className="text-sm text-ink">
                Anda memang memasuki LENTERA sebagai koordinator. Fitur yang tersedia:
              </p>
              <ul className="space-y-2 text-sm text-muted">
                {[
                  ["Panel koordinator", "Tinjau laporan, deduplikasi, dan SITREP harian"],
                  ["Lihat antrean", "/antrean"],
                  ["Lihat peta", "/peta"],
                  ["Lihat SITREP", "/sitrep"],
                ].map(([name, desc]) => (
                  <li key={name} className="flex items-center gap-2">
                    <Users className="size-4 shrink-0 text-amber" />
                    <span className="text-ink">{name}</span>
                    <span className="truncate text-[11px]">{desc}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={() => {
              // maintain current role: stay as coordinator
            }}
          >
            Tetap di panel koordinator
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      {/* logo lockup */}
      <div className="mx-auto mt-10 flex size-14 items-center justify-center">
        <img src="/logo.svg" alt="LENTERA" className="size-10" />
      </div>

      <div className="mt-8 space-y-5 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">Pilih cara masuk</h1>
          <p className="mt-1 text-sm text-muted">
            LENTERA punya dua akses: laporan lapangan oleh relawan, dan panel koordinator untuk tim.
          </p>
        </div>

        <div className="space-y-3">
          {PERAN.map((p) => (
            <Card key={p.id} className="border-line">
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-base">
                    <p.icon className="size-5 text-ink" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight">{p.label}</p>
                    <p className="text-sm text-muted">{p.tagline}</p>
                  </div>
                </div>

                <p className="text-sm text-ink leading-relaxed">{p.desc}</p>

                <div className="flex gap-2">
                  {p.id === "relawan" ? (
                    <Button
                      variant={p.btnVariant}
                      className="flex-1 justify-center gap-2"
                      onClick={() => void ensureVolunteer()}
                    >
                      <PenLine className="size-4" /> {p.btnLabel}
                      <span className="text-[11px] text-muted">{p.btnHint}</span>
                    </Button>
                  ) : (
                    <Button
                      variant={p.btnVariant}
                      className="flex-1 justify-center gap-2"
                      onClick={() => void signInCoordinator()}
                    >
                      <Users className="size-4" /> {p.btnLabel}
                      <span className="text-[11px] text-muted">{p.btnHint}</span>
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted">
          Relawan masuk otomatis tanpa akun. Koordinator butuh tautan Google.
        </p>

        <div className="space-y-3 rounded-xl border border-line bg-base p-4">
          <p className="text-sm font-semibold text-ink">Akses koordinator (kode akses)</p>
          <p className="text-xs text-muted">
            Masuk sebagai koordinator tanpa Google. Gunakan kode akses 8 digit yang diberikan oleh koordinator.
          </p>
          <div className="flex gap-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/D/g, "").slice(0, 8))}
              placeholder="8 digit kode akses"
              maxLength={8}
              className="flex-1 tabular-nums tracking-wider"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!pin) return;
                setPinError("");
                void signInCoordinatorWithPin(pin).then((ok) => {
                  if (!ok) {
                    setPinError("Kode akses tidak dikenal.");
                    return;
                  }
                  window.location.reload();
                });
              }}
              disabled={!pin}
            >
              Masuk
            </Button>
          </div>
          {pinError && <p className="text-xs text-emergency">{pinError}</p>}
        </div>
      </div>
    </div>
  );
}
