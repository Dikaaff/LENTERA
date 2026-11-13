import { ClipboardList, FileText, Map, PenLine } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, Route, Routes } from "react-router-dom";
import { StatusBar } from "@/components/StatusBar";
import { Badge } from "@/components/ui/badge";
import { ensureVolunteer, useAuthUser } from "@/modules/auth";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { MapScreen } from "@/screens/MapScreen";
import { QueueScreen } from "@/screens/QueueScreen";
import { SitrepScreen } from "@/screens/SitrepScreen";

const NAV = [
  { to: "/", label: "Isi", icon: PenLine },
  { to: "/antrean", label: "Antrean", icon: ClipboardList },
  { to: "/peta", label: "Peta", icon: Map },
  { to: "/sitrep", label: "SITREP", icon: FileText },
];

function Shell() {
  const { role } = useAuthUser();

  useEffect(() => {
    void ensureVolunteer();
  }, []);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-x border-line bg-base">
      <header className="flex items-center gap-3 px-4 py-3">
        <img src="/logo.svg" alt="" className="size-7" width={28} height={28} />
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.18em]">Lentera</p>
          <p className="truncate text-[11px] text-muted">Laporan lapangan</p>
        </div>
        <Badge className="ml-auto" tone={role === "koordinator" ? "amber" : "neutral"}>
          {role}
        </Badge>
      </header>

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

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<CaptureScreen />} />
        <Route path="antrean" element={<QueueScreen />} />
        <Route path="peta" element={<MapScreen />} />
        <Route path="sitrep" element={<SitrepScreen />} />
      </Route>
    </Routes>
  );
}
