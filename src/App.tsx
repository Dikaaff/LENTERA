import {
  ClipboardList,
  FileText,
  LogIn,
  LogOut,
  Map,
  PenLine,
  ShieldCheck,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, Route, Routes } from "react-router-dom";
import { StatusBar } from "@/components/StatusBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ensureVolunteer, signOut as firebaseSignOut, useAuthUser } from "@/modules/auth";
import { resumeSync } from "@/modules/queue";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { MapScreen } from "@/screens/MapScreen";
import { QueueScreen } from "@/screens/QueueScreen";
import { SitrepScreen } from "@/screens/SitrepScreen";
import { AdminScreen } from "@/screens/AdminScreen";

const NAV = [
  { to: "/", label: "Isi", icon: PenLine },
  { to: "/antrean", label: "Antrean", icon: ClipboardList },
  { to: "/peta", label: "Peta", icon: Map },
  { to: "/sitrep", label: "SITREP", icon: FileText },
];

const ROLE_COLORS: Record<string, "neutral" | "amber" | "emergency"> = {
  relawan: "neutral",
  koordinator: "amber",
  tamu: "neutral",
};

export default function App() {
  const role = useAuthUser().role;
  return (
    <Routes>
      <Route element={<Shell role={role} />}>
        {role !== "tamu" ? (
          <>
            <Route index element={<CaptureScreen />} />
            <Route path="antrean" element={<QueueScreen />} />
            <Route path="peta" element={<MapScreen />} />
            <Route path="sitrep" element={<SitrepScreen />} />
            {role === "koordinator" && <Route path="admin" element={<AdminScreen />} />}
          </>
        ) : (
          <Route path="*" element={<LockedScreen />} />
        )}
      </Route>
    </Routes>
  );
}

function Shell({ role }: { role: string }) {
  const { user, loading } = useAuthUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = role === "koordinator";

  useEffect(() => {
    void ensureVolunteer().then(() => resumeSync());
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col">
        <div className="mt-10 flex size-12 items-center justify-center rounded-full bg-amber/10">
          <div className="h-4 w-4 animate-ping rounded-full bg-amber opacity-70" />
          <div className="ml-4 h-4 w-4 rounded-full bg-amber" />
        </div>
        <p className="mt-3 text-center text-xs text-muted">Memverifikasi identitas…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-x border-line bg-base">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-xl bg-amber/20">
            <PenLine className="size-4 text-amber" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight">LENTERA</p>
            <p className="truncate text-[11px] text-muted">Laporan lapangan</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {" "}
          <Badge tone={ROLE_COLORS[role] ?? "neutral"} as const className="mr-1">
            {role === "koordinator" && <ShieldCheck className="mr-1 size-3" />}
            {role}
          </Badge>
          <button
            type="button"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-ink"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <LogOut className="size-5" /> : <UserIcon className="size-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <Card className="border-amber/30 mx-4 mt-3 mb-0 rounded-2xl">
          <CardBody className="flex flex-col gap-2">
            {role !== "tamu" && (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-base" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user?.isAnonymous ? "Relawan lapangan" : "Koordinator"}
                    </p>
                    <p className="text-[11px] font-mono text-muted">
                      {role === "koordinator"
                        ? (user?.displayName ?? "Koordinator")
                        : `ID: ${user?.uid?.slice(0, 12)}…`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => firebaseSignOut()}
                >
                  <LogOut className="size-4" /> Keluar
                </Button>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex gap-3 rounded-xl p-3 transition hover:bg-surface"
                onClick={() => setMenuOpen(false)}
              >
                <Users className="size-5 shrink-0 text-amber" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Panel koordinator</p>
                  <p className="text-[11px] text-muted">Lihat laporan dan data wilayah</p>
                </div>
              </NavLink>
            )}
          </CardBody>
        </Card>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      <StatusBar />

      <nav aria-label="Navigasi utama" className="grid grid-cols-4 border-t border-line bg-base">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-wider ${
                isActive ? "text-amber" : "text-muted"
              }`
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function LockedScreen() {
  return (
    <div className="mx-auto mt-20 flex max-w-md flex-col items-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-base border border-line">
        <ShieldCheck className="size-10 text-muted" />
      </div>
      <h1 className="text-lg font-bold tracking-tight">Akses terbatas</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
        Fitur LENTERA tersedia untuk relawan terdaftar dan koordinator yang sedang masuk.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => firebaseSignOut()} className="flex-1">
          <LogIn className="size-4" /> Masuk sebagai relawan
        </Button>
      </div>
    </div>
  );
}
