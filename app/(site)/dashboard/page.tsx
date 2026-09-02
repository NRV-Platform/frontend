"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Team } from "@/lib/types";
import { PageHead, SectionLabel, Card, Pill } from "@/components/ui/primitives";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }
      try {
        const teams = await api.get<Team[]>("/teams", { auth: false });
        const mine = teams.find((t) => t.memberships?.some((m) => m.userId === user.id));
        if (!cancelled) setTeam(mine ?? null);
      } catch {
        if (!cancelled) setTeam(null);
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
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <div>
      <PageHead kicker="Account" title="Overview" sub={`Welcome back, ${user.name}.`} />

      <SectionLabel>Profile</SectionLabel>
      <Card pad={22} className="mb-9" style={{ marginBottom: 36 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-[#23253A] text-[#BFC2DE] flex items-center justify-center font-display font-extrabold text-[18px] flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-display font-extrabold text-[18px] tracking-[0.5px] text-[#E6E6E6] uppercase">
              {user.name}
            </div>
            <div className="font-mono text-[11px] text-[#888BA0] mt-0.5">{user.email}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill color="#BFC2DE">{user.role}</Pill>
            {user.mfaEnabled && <Pill color="#4ade80">MFA on</Pill>}
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase mb-1">Player tag</div>
            <div className="font-mono text-[12px] text-[#BFC2DE]">{user.playerTag || "—"}</div>
          </div>
        </div>
      </Card>

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
