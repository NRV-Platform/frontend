"use client";

import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

export function OtherTeamsRow({ teams }: { teams: Team[] }) {
  const router = useRouter();
  if (teams.length === 0) return null;
  return (
    <div className="mt-8 flex gap-2 items-center flex-wrap">
      <span className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase mr-1">
        Other teams
      </span>
      {teams.map((o) => (
        <button
          key={o.id}
          onClick={() => router.push(`/teams/${o.id}`)}
          className="font-mono text-[10px] tracking-[1px] bg-transparent border border-[rgba(126,130,172,0.35)] text-[#888BA0] px-3 py-1.5 cursor-pointer"
        >
          {o.tag}
        </button>
      ))}
    </div>
  );
}
