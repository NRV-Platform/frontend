"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { PlayerStatRow, Team } from "@/lib/types";
import { PageHead, SectionLabel, Card, Pill, Btn } from "@/components/ui/primitives";
import { StatCard } from "@/components/admin/shared";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<PlayerStatRow | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }
      try {
        const [teams, playerStats] = await Promise.all([
          api.get<Team[]>("/teams", { auth: false }),
          api.get<PlayerStatRow[]>("/stats/players", { auth: false }).catch(() => []),
        ]);
        const mine = teams.find((t) => t.memberships?.some((m) => m.userId === user.id));
        const myStats = playerStats.find((r) => r.userId === user.id) ?? null;
        if (!cancelled) {
          setTeam(mine ?? null);
          setStats(myStats);
        }
      } catch {
        if (!cancelled) {
          setTeam(null);
          setStats(null);
        }
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || !checked) return null;

  const myMembership = team?.memberships?.find((m) => m.userId === user.id);
  const missing = [
    !user.riotConnectedAt && "Riot",
    !user.discordConnectedAt && "Discord",
  ].filter(Boolean) as string[];

  return (
    <div>
      <PageHead kicker="Account" title="Overview" sub={`Welcome back, ${user.name}.`} />

      {missing.length > 0 && (
        <Card
          pad={18}
          className="mb-9 flex items-center gap-4 flex-wrap"
          style={{ marginBottom: 36, borderColor: "rgba(251,191,36,0.4)" }}
        >
          <div className="flex-1 min-w-[220px]">
            <div className="font-display font-bold text-[13px] tracking-[1px] text-[#fbbf24] uppercase mb-1">
              Connect {missing.join(" & ")} to compete
            </div>
            <div className="font-mono text-[11px] text-[#888BA0] leading-[1.6]">
              You need a linked {missing.join(" and ")} account before you can create or
              register a team — tournaments sync stats from Riot and coordinate through
              Discord.
            </div>
          </div>
          <Btn onClick={() => router.push("/dashboard/profile")}>Connect now</Btn>
        </Card>
      )}

      <SectionLabel>My Stats</SectionLabel>
      <div className="flex gap-3 flex-wrap mb-2">
        <StatCard label="Maps played" value={stats?.maps ?? 0} />
        <StatCard label="K/D" value={stats ? stats.kd.toFixed(2) : "—"} />
        <StatCard label="ACS" value={stats?.acs ?? "—"} />
        <StatCard label="ADR" value={stats?.adr ?? "—"} />
        <StatCard label="HS%" value={stats ? `${stats.hsPct}%` : "—"} />
        <StatCard label="KAST" value={stats ? `${stats.kast}%` : "—"} />
      </div>
      {!stats && (
        <div className="font-mono text-[10px] text-[#555] leading-[1.7] mt-3 mb-9" style={{ marginBottom: 36 }}>
          No synced stats yet — figures appear once you&apos;ve played a match with stats ingested.
        </div>
      )}

      <SectionLabel>My Team</SectionLabel>
      {team ? (
        <Card pad={22}>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="w-1 h-6" style={{ background: team.color ?? "#7E82AC" }} />
            <div className="font-display font-extrabold text-[17px] tracking-[0.5px] text-[#E6E6E6] uppercase">
              {team.name}
            </div>
            {myMembership && (
              <Pill
                color={
                  myMembership.teamRole === "coach"
                    ? "#4ade80"
                    : myMembership.teamRole === "captain"
                    ? "#BFC2DE"
                    : "#555"
                }
              >
                {myMembership.teamRole}
              </Pill>
            )}
          </div>
          <div className="font-mono text-[11px] text-[#888BA0]">
            {team.tag} · {team.game} · {team.memberships?.length ?? 0} roster member
            {(team.memberships?.length ?? 0) === 1 ? "" : "s"}
          </div>
        </Card>
      ) : (
        <Card pad={22}>
          <div className="font-mono text-[12px] text-[#888BA0] leading-[1.8]">
            You don&apos;t belong to a team yet. Use &quot;Register a Team&quot; in the sidebar, or
            ask a coach to add you by your player tag ({user.playerTag || "—"}).
          </div>
        </Card>
      )}
    </div>
  );
}
