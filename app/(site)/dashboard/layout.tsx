"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/access-denied";
import { Pill } from "@/components/ui/primitives";
import type { PublicUser } from "@/lib/types";

const DASHBOARD_PAGES = [
  { id: "", label: "Overview", icon: "▦" },
  { id: "team", label: "Team Management", icon: "⚑" },
  { id: "register", label: "Register a Team", icon: "＋" },
  { id: "profile", label: "Profile", icon: "◇" },
];

function SidebarContent({
  user,
  activeId,
  onNavigate,
  onLogout,
}: {
  user: PublicUser;
  activeId: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-[rgba(126,130,172,0.2)] flex-shrink-0">
        <div className="font-display font-bold text-[13px] text-[#E6E6E6] tracking-[2px]">DASHBOARD</div>
        <div className="font-mono text-[9px] text-[#888BA0] tracking-[2px] mt-0.5">
          {user.playerTag || user.email}
        </div>
      </div>
      <nav className="flex-1 py-3.5 overflow-y-auto">
        {DASHBOARD_PAGES.map((it) => {
          const active = activeId === it.id;
          return (
            <div
              key={it.id}
              onClick={() => onNavigate(it.id ? `/dashboard/${it.id}` : "/dashboard")}
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
      <div className="px-5 py-4 border-t border-[rgba(126,130,172,0.2)] flex-shrink-0">
        <div className="font-mono text-[10px] text-[#555] tracking-[1px]">Logged in as</div>
        <div className="font-mono text-[11px] text-[#888BA0] mt-0.5">{user.email}</div>
        <div className="mt-1 mb-3">
          <Pill color="#BFC2DE">{user.role}</Pill>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left font-mono text-[10px] tracking-[2px] uppercase text-[#888BA0] bg-transparent border border-[rgba(126,130,172,0.4)] px-3 py-2 cursor-pointer transition-colors hover:text-[#E6E6E6] hover:border-[rgba(126,130,172,0.7)]"
        >
          Log out
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    router.push("/");
  };

  if (loading) return null;

  if (!user) {
    return <AccessDenied need="Log in to see your dashboard." />;
  }

  const activeId = pathname?.replace(/^\/dashboard\/?/, "") ?? "";
  const activePage = DASHBOARD_PAGES.find((p) => p.id === activeId);

  const navigate = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  return (
    <div className="flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-[150] flex items-center gap-3 bg-[#111] border-b border-[rgba(126,130,172,0.2)] px-4 py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open dashboard menu"
          className="bg-transparent border border-[rgba(126,130,172,0.4)] text-[#BFC2DE] px-2.5 py-1.5 cursor-pointer font-mono text-[12px]"
        >
          ☰
        </button>
        <span className="font-mono text-[11px] text-[#E6E6E6] tracking-[2px] uppercase flex-1">
          {activePage?.label ?? "Dashboard"}
        </span>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[222px] bg-[#111] flex-shrink-0 border-r border-[rgba(126,130,172,0.2)] flex-col sticky top-0 h-screen overflow-y-auto">
        <SidebarContent user={user} activeId={activeId} onNavigate={navigate} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute top-0 left-0 bottom-0 w-[260px] max-w-[80vw] bg-[#111] border-r border-[rgba(126,130,172,0.3)] flex flex-col">
            <div className="flex justify-end px-3 pt-3">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close dashboard menu"
                className="bg-transparent border border-[rgba(126,130,172,0.4)] text-[#BFC2DE] px-2.5 py-1 cursor-pointer font-mono text-[12px]"
              >
                ✕
              </button>
            </div>
            <SidebarContent user={user} activeId={activeId} onNavigate={navigate} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <main className="flex-1 px-4 sm:px-10 py-8 min-w-0">{children}</main>
    </div>
  );
}
