"use client";

import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

export function OurTeamsGrid({ teams }: { teams: Team[] }) {
  const router = useRouter();
  return (
    <div className="nrv-grid-3">
      {teams.map((t) => (
        <div
          key={t.id}
          onClick={() => router.push(`/teams/${t.id}`)}
          className="cursor-pointer bg-[rgba(14,14,14,0.85)] border border-[rgba(126,130,172,0.3)] p-5 transition-colors hover:border-[rgba(126,130,172,0.6)]"
        >
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className="w-1 h-[26px]" style={{ background: t.color ?? "#7E82AC" }} />
            <div>
              <div className="font-display font-extrabold text-[16px] tracking-[1px] text-[#E6E6E6] uppercase">
                {t.name}
              </div>
              <div className="font-mono text-[9px] text-[#555] tracking-[2px]">
                {t.tag} · {t.game}
              </div>
            </div>
          </div>
          <div className="font-mono text-[10px] text-[#888BA0]">
            {t.memberships?.length ?? 0} roster member{(t.memberships?.length ?? 0) === 1 ? "" : "s"} →
          </div>
        </div>
      ))}
    </div>
  );
}
