"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHead, SectionLabel, Card, Pill } from "@/components/ui/primitives";
import { RiotCard } from "@/components/dashboard/riot-card";
import { DiscordCard } from "@/components/dashboard/discord-card";

export default function DashboardProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <div>
      <PageHead kicker="Account" title="Profile" />

      <SectionLabel>Account</SectionLabel>
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

      <SectionLabel>Connected Accounts</SectionLabel>
      <div className="nrv-grid-2">
        <RiotCard user={user} />
        <DiscordCard user={user} />
      </div>
    </div>
  );
}
