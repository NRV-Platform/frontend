"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export function MVPNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<number | null>(null);
  const [mob, setMob] = useState(false);
  const [acctOpenDesktop, setAcctOpenDesktop] = useState(false);
  const [acctOpenMobile, setAcctOpenMobile] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const acctRefDesktop = useRef<HTMLDivElement>(null);
  const acctRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
        setMob(false);
      }
      if (acctRefDesktop.current && !acctRefDesktop.current.contains(e.target as Node)) {
        setAcctOpenDesktop(false);
      }
      if (acctRefMobile.current && !acctRefMobile.current.contains(e.target as Node)) {
        setAcctOpenMobile(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items: NavItem[] = [
    {
      label: "ABOUT",
      href: "/about",
      children: [
        { label: "About NRV", href: "/about" },
        { label: "Our Teams", href: "/our-teams" },
        { label: "Sponsors", href: "/sponsors" },
      ],
    },
    {
      label: "TOURNAMENTS",
      href: "/tournaments",
      children: [
        { label: "Events & Standings", href: "/tournaments" },
        { label: "Calendar", href: "/calendar" },
        { label: "Register a Team", href: "/register" },
        { label: "Rules", href: "/rules" },
      ],
    },
    { label: "STATS", href: "/stats" },
    { label: "NEWS", href: "/news" },
    ...(user ? [{ label: "MY TEAM", href: "/team" }] : []),
  ];

  const go = (h: string) => {
    setOpen(null);
    setMob(false);
    router.push(h);
  };

  const isStaff = user && (user.role === "admin" || user.role === "editor");

  return (
    <nav
      ref={ref}
      className="fixed top-0 left-0 right-0 z-[100] bg-[rgba(14,14,14,0.92)] backdrop-blur-md border-b border-[rgba(126,130,172,0.25)] h-16 flex items-center px-4 sm:px-10"
    >
      <div
        onClick={() => go("/")}
        className="cursor-pointer flex items-baseline gap-2.5 select-none"
      >
        <span className="font-display font-black text-[22px] text-[#E6E6E6] uppercase leading-none" style={{ letterSpacing: "-0.5px" }}>
          Nerve
        </span>
      </div>
      <div className="flex-1" />
      <div className="nrv-hide-sm flex items-center h-full">
        {items.map((item, i) => {
          const active = item.href !== "/" && pathname?.startsWith(item.href);
          return (
            <div
              key={i}
              className="relative h-full flex items-center"
              onMouseEnter={() => setOpen(i)}
              onMouseLeave={() => setOpen(null)}
            >
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
                className="flex items-center h-full px-4 gap-1.5 font-display font-semibold text-[14px] uppercase cursor-pointer transition-colors"
                style={{
                  letterSpacing: "2px",
                  color: active ? "#E6E6E6" : "#888BA0",
                  borderBottom: active ? "2px solid #7E82AC" : "2px solid transparent",
                }}
              >
                {item.label}
                {item.children && (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path
                      d={open === i ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </a>
              {open === i && item.children && (
                <div className="absolute top-full left-0 bg-[#0E0E0E] border-t-2 border-t-[#7E82AC] border border-[rgba(126,130,172,0.3)] min-w-[220px] z-[200] py-1.5">
                  {item.children.map((c, j) => (
                    <a
                      key={j}
                      href={c.href}
                      onClick={(e) => {
                        e.preventDefault();
                        go(c.href);
                      }}
                      className="block px-[18px] py-2.5 font-mono text-[12px] text-[#888BA0] tracking-[1px] uppercase no-underline cursor-pointer transition-all hover:text-[#E6E6E6] hover:bg-[rgba(126,130,172,0.15)]"
                    >
                      {c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <AccountChip
          user={user}
          isStaff={!!isStaff}
          open={acctOpenDesktop}
          setOpen={setAcctOpenDesktop}
          acctRef={acctRefDesktop}
          onLogout={() => {
            logout();
            go("/");
          }}
          go={go}
        />
      </div>
      <div className="nrv-show-sm items-center gap-3">
        <AccountChip
          user={user}
          isStaff={!!isStaff}
          open={acctOpenMobile}
          setOpen={setAcctOpenMobile}
          acctRef={acctRefMobile}
          onLogout={() => {
            logout();
            go("/");
          }}
          go={go}
        />
        <button
          onClick={() => setMob((m) => !m)}
          aria-label="Menu"
          className="bg-transparent border border-[rgba(126,130,172,0.4)] text-[#BFC2DE] px-2.5 py-1.5 cursor-pointer font-mono text-[12px]"
        >
          {mob ? "✕" : "☰"}
        </button>
      </div>
      {mob && (
        <div className="nrv-show-sm absolute top-16 left-0 right-0 bg-[#0E0E0E] border-b border-[rgba(126,130,172,0.3)] py-2 flex-col">
          {[
            { label: "HOME", href: "/" },
            ...items.flatMap((it) =>
              it.children ? it.children.map((c) => ({ label: c.label.toUpperCase(), href: c.href })) : [it]
            ),
          ].map((it, i) => (
            <a
              key={i}
              href={it.href}
              onClick={(e) => {
                e.preventDefault();
                go(it.href);
              }}
              className="block px-6 py-3.5 font-mono text-[12px] text-[#888BA0] tracking-[2px] uppercase no-underline border-b border-white/[0.04]"
            >
              {it.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

function AccountChip({
  user,
  isStaff,
  open,
  setOpen,
  acctRef,
  onLogout,
  go,
}: {
  user: { name: string; email: string; role: string } | null;
  isStaff: boolean;
  open: boolean;
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  acctRef: React.RefObject<HTMLDivElement | null>;
  onLogout: () => void;
  go: (h: string) => void;
}) {
  if (!user) {
    return (
      <Link
        href="/login"
        className="ml-5 font-mono text-[11px] tracking-[2px] uppercase px-3.5 py-1.5 border border-[rgba(126,130,172,0.5)] text-[#BFC2DE] cursor-pointer"
      >
        Login
      </Link>
    );
  }
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div ref={acctRef} className="relative ml-5">
      <div
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 cursor-pointer border border-[rgba(126,130,172,0.4)] px-3 py-1.5"
      >
        <div className="w-[22px] h-[22px] rounded-full bg-[#23253A] text-[#BFC2DE] flex items-center justify-center font-display font-extrabold text-[10px]">
          {initials}
        </div>
        <span className="font-mono text-[10px] text-[#BFC2DE] tracking-[1px] uppercase">
          {user.role}
        </span>
      </div>
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-[#0E0E0E] border-t-2 border-t-[#7E82AC] border border-[rgba(126,130,172,0.3)] min-w-[230px] z-[300] py-1.5">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <div className="font-mono text-[11px] text-[#E6E6E6]">{user.email}</div>
            <div className="font-mono text-[9px] text-[#555] tracking-[1px] mt-0.5 uppercase">
              {user.role}
            </div>
          </div>
          <div
            onClick={() => {
              setOpen(false);
              go("/team");
            }}
            className="px-4 py-2.5 font-mono text-[11px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer transition-all hover:text-[#E6E6E6] hover:bg-[rgba(126,130,172,0.12)]"
          >
            Team Management
          </div>
          {isStaff && (
            <div
              onClick={() => {
                setOpen(false);
                go("/admin");
              }}
              className="px-4 py-2.5 font-mono text-[11px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer transition-all hover:text-[#E6E6E6] hover:bg-[rgba(126,130,172,0.12)]"
            >
              Admin Portal
            </div>
          )}
          <div
            onClick={onLogout}
            className="px-4 py-2.5 font-mono text-[11px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer transition-all hover:text-[#E6E6E6] hover:bg-[rgba(126,130,172,0.12)]"
          >
            Log out
          </div>
        </div>
      )}
    </div>
  );
}

export function MVPFooter() {
  return (
    <footer className="border-t border-[rgba(126,130,172,0.2)] bg-[#0B0B0E] px-4 sm:px-10 py-10 mt-20">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-4">
        <span className="font-mono text-[10px] text-[#444] tracking-[2px] uppercase">
          NERVE ESPORTS
        </span>
        <div className="flex gap-5">
          {[
            ["Rules", "/rules"],
            ["Terms & Privacy", "/legal"],
          ].map(([l, h]) => (
            <Link
              key={h}
              href={h}
              className="font-mono text-[10px] text-[#555] tracking-[2px] uppercase no-underline cursor-pointer"
            >
              {l}
            </Link>
          ))}
        </div>
        <span className="font-mono text-[10px] text-[#333] tracking-[2px]">
          © {new Date().getFullYear()} NERVE ESPORTS
        </span>
      </div>
    </footer>
  );
}

export function PageShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className="mx-auto px-4 sm:px-10"
      style={{ maxWidth: wide ? 1400 : 1200, paddingTop: 110 }}
    >
      {children}
    </div>
  );
}
