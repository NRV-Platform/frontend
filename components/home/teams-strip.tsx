"use client";

import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

export function TeamsStrip({ teams }: { teams: Team[] }) {
  const router = useRouter();
  if (!teams.length) return null;
  return (
    <div className="border-b border-[rgba(126,130,172,0.2)] px-4 sm:px-10 py-4.5" style={{ padding: "18px clamp(16px,4vw,40px)" }}>
      <div className="max-w-[1200px] mx-auto flex items-center gap-4.5 flex-wrap" style={{ gap: 18 }}>
        <span className="font-mono text-[9px] text-[#555] tracking-[3px] uppercase flex-shrink-0">
          Competing teams
        </span>
        <div className="flex gap-2.5 flex-wrap">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/teams/${t.id}`)}
              className="flex items-center gap-2 bg-transparent border border-[rgba(126,130,172,0.3)] px-3 py-1.5 cursor-pointer"
            >
              <span className="w-[3px] h-3.5" style={{ background: t.color ?? "#7E82AC" }} />
              <span className="font-display font-bold text-[12px] tracking-[1px] text-[#BFC2DE] uppercase">
                {t.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
