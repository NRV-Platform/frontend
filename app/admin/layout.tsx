"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/access-denied";
import { Pill } from "@/components/ui/primitives";

const ADMIN_PAGES = [
  { id: "", label: "Dashboard", icon: "▦" },
  { id: "events", label: "Events & Matches", icon: "⊞" },
  { id: "teams", label: "NRV Teams", icon: "◆" },
  { id: "sponsors", label: "Sponsors", icon: "✦" },
  { id: "stats", label: "Stats Pipeline", icon: "◈" },
  { id: "registrations", label: "Registrations", icon: "⊕" },
  { id: "news", label: "News", icon: "≡" },
  { id: "rulebook", label: "Rulebook", icon: "§" },
  { id: "users", label: "Users", icon: "◇" },
  { id: "audit", label: "Audit Log", icon: "◫" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) return null;

  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return (
      <AccessDenied need="The staff portal is limited to admin and editor accounts. Members and coaches use the public site and Team Management only." />
    );
  }

  const activeId = pathname?.replace(/^\/admin\/?/, "") ?? "";

  return (
    <div className="flex min-h-screen">
      <aside
        className="nrv-admin-side w-[222px] bg-[#111] flex-shrink-0 border-r border-[rgba(126,130,172,0.2)] flex flex-col sticky top-0 h-screen overflow-y-auto"
      >
        <div
          onClick={() => router.push("/")}
          className="px-5 pt-5 pb-4 border-b border-[rgba(126,130,172,0.2)] flex items-center gap-2.5 cursor-pointer"
        >
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <rect width="36" height="28" rx="2" fill="#7E82AC" />
            <text x="5" y="20" fontFamily="Archivo, sans-serif" fontSize="14" fontWeight="900" fill="#0B0B0E">
              NRV
            </text>
          </svg>
          <div>
            <div className="font-display font-bold text-[13px] text-[#E6E6E6] tracking-[2px]">NERVE</div>
            <div className="font-mono text-[9px] text-[#888BA0] tracking-[2px]">ADMIN</div>
          </div>
        </div>
        <nav className="flex-1 py-3.5">
          {ADMIN_PAGES.map((it) => {
            const active = activeId === it.id;
            return (
              <div
                key={it.id}
                onClick={() => router.push(it.id ? `/admin/${it.id}` : "/admin")}
                className="flex items-center gap-2.5 px-5 py-2.5 cursor-pointer transition-colors"
                style={{
                  background: active ? "rgba(126,130,172,0.15)" : "transparent",
                  borderLeft: active ? "3px solid #7E82AC" : "3px solid transparent",
                }}
              >
                <span className="text-[14px] w-[18px]" style={{ color: active ? "#BFC2DE" : "#555" }}>
                  {it.icon}
                </span>
                <span
                  className="font-mono text-[11px] tracking-[1px] flex-1"
                  style={{ color: active ? "#E6E6E6" : "#888BA0" }}
                >
                  {it.label}
                </span>
              </div>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-[rgba(126,130,172,0.2)]">
          <div className="font-mono text-[10px] text-[#555] tracking-[1px]">Logged in as</div>
          <div className="font-mono text-[11px] text-[#888BA0] mt-0.5">{user.email}</div>
          <div className="mt-1">
            <Pill color="#BFC2DE">{user.role}</Pill>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-4 sm:px-10 py-8 min-w-0">{children}</main>
    </div>
  );
}
