"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Match, Team } from "@/lib/types";
import { matchWinner, mapWins } from "@/lib/derived";
import { Card, TeamChip, Pill, Empty, fmtDT } from "@/components/ui/primitives";

function MatchRow({
  m,
  showScore,
  teamMap,
}: {
  m: Match;
  showScore: boolean;
  teamMap: Map<string, Team>;
}) {
  const router = useRouter();
  const [h, setH] = useState(false);
  const w = matchWinner(m);
  const teamA = teamMap.get(m.teamAId);
  const teamB = teamMap.get(m.teamBId);
  const [dateStr, timeStr] = fmtDT(m.startsAt).split(" · ");

  return (
    <div
      onClick={() => router.push(`/tournaments/${m.eventId}`)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="px-4 py-3 border-b border-white/[0.04] transition-colors cursor-pointer"
      style={{ background: h ? "rgba(126,130,172,0.07)" : "transparent" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[9px] text-[#444] tracking-[1px] uppercase">
          {m.format} · {m.event?.name ?? ""}
        </span>
        {m.status === "postponed" && <Pill>postponed</Pill>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <TeamChip
            tag={teamA?.tag ?? m.teamAId}
            color={teamA?.color}
            isNrv={teamA?.isNrv}
            dim={showScore && !!w && w !== m.teamAId}
          />
          <TeamChip
            tag={teamB?.tag ?? m.teamBId}
            color={teamB?.color}
            isNrv={teamB?.isNrv}
            dim={showScore && !!w && w !== m.teamBId}
          />
        </div>
        {showScore ? (
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            {[m.teamAId, m.teamBId].map((t) => (
              <span
                key={t}
                className="font-display font-extrabold text-[20px] leading-none"
                style={{ color: w === t ? "#E6E6E6" : "#555" }}
              >
                {m.status === "forfeit" ? (w === t ? "W" : "FF") : mapWins(m, t)}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-right flex-shrink-0">
            <div
              className="font-display font-bold text-[16px] text-[#E6E6E6]"
              style={{ letterSpacing: "0.5px" }}
            >
              {dateStr}
            </div>
            <div className="font-mono text-[9px] text-[#555] mt-0.5">{timeStr} ET</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchWidget({
  title,
  matches,
  showScore,
  live,
  teamMap,
}: {
  title: string;
  matches: Match[];
  showScore: boolean;
  live?: boolean;
  teamMap: Map<string, Team>;
}) {
  const router = useRouter();
  return (
    <Card pad={0} className="flex-1 min-w-[280px] flex flex-col">
      <div className="px-4 py-3 border-b border-[rgba(126,130,172,0.25)] font-display font-bold text-[13px] tracking-[3px] text-[#BFC2DE] uppercase flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: live ? "#22c55e" : "#888BA0" }}
        />
        {title}
      </div>
      <div className="flex-1">
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} showScore={showScore} teamMap={teamMap} />
        ))}
        {matches.length === 0 && <Empty label="No matches" />}
      </div>
      <div
        onClick={() => router.push("/tournaments")}
        className="px-4 py-2.5 border-t border-white/[0.04] font-mono text-[9px] text-[#444] tracking-[2px] uppercase cursor-pointer text-right transition-colors hover:text-[#BFC2DE]"
      >
        All matches →
      </div>
    </Card>
  );
}
