"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuditLogEntry, Match, NewsPost, Registration } from "@/lib/types";
import { AdminHead, StatCard } from "@/components/admin/shared";
import { Card, fmtDT } from "@/components/ui/primitives";

export default function AdminDashboard() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [regs, allNews, auditLog] = await Promise.all([
        api.get<Registration[]>("/registrations").catch(() => []),
        api.get<NewsPost[]>("/news").catch(() => []),
        api.get<AuditLogEntry[]>("/audit").catch(() => []),
      ]);
      setRegistrations(regs);
      setNews(allNews);
      setAudit(auditLog);
      const events = await api.get<{ id: string }[]>("/events", { auth: false }).catch(() => []);
      const matchLists = await Promise.all(
        events.map((e) => api.get<Match[]>(`/events/${e.id}/matches`, { auth: false }).catch(() => []))
      );
      setMatches(matchLists.flat());
    })();
  }, []);

  const pending = registrations.filter((r) => r.status === "pending").length;

  return (
    <div>
      <AdminHead
        title="Dashboard"
        sub={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      />
      <div className="flex gap-3 mb-7 flex-wrap">
        <StatCard
          label="Pending registrations"
          value={pending}
          color={pending ? "#fbbf24" : "#E6E6E6"}
          onClick={() => router.push("/admin/registrations")}
        />
        <StatCard
          label="Scheduled matches"
          value={matches.filter((m) => m.status === "scheduled").length}
          onClick={() => router.push("/admin/events")}
        />
        <StatCard
          label="Published posts"
          value={news.filter((p) => p.status === "published").length}
          onClick={() => router.push("/admin/news")}
        />
      </div>
      <div className="nrv-grid-2">
        <Card pad={22}>
          <div className="font-mono text-[10px] text-[#888BA0] tracking-[3px] uppercase mb-4.5" style={{ marginBottom: 18 }}>
            Quick actions
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              ["+ Enter a match result", "events"],
              ["+ Review registrations", "registrations"],
              ["+ New post", "news"],
            ].map(([l, p]) => (
              <button
                key={p}
                onClick={() => router.push(`/admin/${p}`)}
                className="w-full text-left px-4.5 py-3.5 font-display font-bold text-[14px] tracking-[2px] text-[#E6E6E6] cursor-pointer uppercase transition-opacity hover:opacity-85"
                style={{
                  padding: "13px 18px",
                  background: l.includes("result") ? "#7E82AC" : "#23253A",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>
        <Card pad={0}>
          <div className="px-5.5 py-4 font-mono text-[10px] text-[#888BA0] tracking-[3px] uppercase border-b border-[rgba(126,130,172,0.2)]" style={{ padding: "16px 22px" }}>
            Recent activity
          </div>
          {audit.slice(0, 6).map((a) => (
            <div
              key={a.id}
              className="px-5.5 py-2.5 border-b border-white/[0.04] font-mono text-[11px] text-[#888BA0] flex gap-2.5 flex-wrap"
              style={{ padding: "11px 22px" }}
            >
              <span className="text-[#BFC2DE]">{a.actor?.name ?? a.actorId}</span>
              <span>{a.action}</span>
              <span className="text-[#E6E6E6]">{a.target}</span>
              <span className="ml-auto text-[#444] text-[9px]">{fmtDT(a.at)}</span>
            </div>
          ))}
          {audit.length === 0 && (
            <div className="px-5.5 py-6 font-mono text-[11px] text-[#444] text-center uppercase tracking-[2px]">
              No activity yet
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
