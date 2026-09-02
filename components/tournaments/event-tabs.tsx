"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Match, NrvEvent, Team } from "@/lib/types";
import { computeStandings, mapWins } from "@/lib/derived";
import { Card, Table, TeamChip, Pill, fmtDT } from "@/components/ui/primitives";

type Tab = "schedule" | "standings" | "teams";

export function EventTabs({
  event,
  matches,
  teamMap,
}: {
  event: NrvEvent;
  matches: Match[];
  teamMap: Map<string, Team>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("schedule");
  const sorted = [...matches].sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
  const rows = computeStandings(event.teams?.map((t) => t.teamId) ?? [], matches);

  return (
    <div>
      <div className="flex border-b border-[rgba(126,130,172,0.25)] mb-7">
        {(["schedule", "standings", "teams"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-display font-bold text-[13px] tracking-[2px] uppercase px-5 py-3 bg-transparent border-none cursor-pointer"
            style={{
              borderBottom: tab === t ? "2px solid #7E82AC" : "2px solid transparent",
              color: tab === t ? "#E6E6E6" : "#555",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <Card pad={0}>
          <Table
            cols={[
              { h: "Date", render: (m) => <span className="whitespace-nowrap">{fmtDT(m.startsAt)}</span> },
              {
                h: "Match",
                render: (m) => {
                  const a = teamMap.get(m.teamAId);
                  const b = teamMap.get(m.teamBId);
                  return (
                    <span className="inline-flex gap-3.5 items-center flex-wrap">
                      <TeamChip tag={a?.tag ?? m.teamAId} color={a?.color} isNrv={a?.isNrv} />
                      <span className="text-[#333] text-[10px]">vs</span>
                      <TeamChip tag={b?.tag ?? m.teamBId} color={b?.color} isNrv={b?.isNrv} />
                    </span>
                  );
                },
              },
              { h: "Format", render: (m) => <span className="text-[#555]">{m.format}</span> },
              {
                h: "Score",
                right: true,
                render: (m) => {
                  if (m.status === "final") {
                    return (
                      <span className="font-display font-extrabold text-[16px] text-[#E6E6E6]">
                        {mapWins(m, m.teamAId)}–{mapWins(m, m.teamBId)}
                      </span>
                    );
                  }
                  if (m.status === "forfeit") {
                    const winner = teamMap.get(m.forfeitWinnerId ?? "");
                    return (
                      <span className="text-[#f87171] text-[10px]">FF → {winner?.tag ?? "—"}</span>
                    );
                  }
                  return m.streamUrl ? (
                    <a
                      href={m.streamUrl}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#BFC2DE] text-[10px] tracking-[1px]"
                    >
                      STREAM ↗
                    </a>
                  ) : (
                    <span className="text-[#333]">—</span>
                  );
                },
              },
              { h: "Status", right: true, render: (m) => <Pill>{m.status}</Pill> },
            ]}
            rows={sorted}
            keyFn={(m) => m.id}
            onRowClick={() => router.push(`/tournaments/${event.id}`)}
          />
        </Card>
      )}

      {tab === "standings" && (
        <Card pad={0}>
          <Table
            cols={[
              { h: "#", render: (r) => <span className="text-[#555]">{r.rank}</span> },
              {
                h: "Team",
                render: (r) => {
                  const t = teamMap.get(r.teamId);
                  return (
                    <span className="inline-flex items-center gap-2.5">
                      <TeamChip tag={t?.tag ?? r.teamId} color={t?.color} isNrv={t?.isNrv} />
                      <span className="text-[#555] text-[10px]">{t?.name}</span>
                    </span>
                  );
                },
              },
              { h: "W", right: true, render: (r) => <span className="text-[#E6E6E6]">{r.wins}</span> },
              { h: "L", right: true, render: (r) => <span>{r.losses}</span> },
              {
                h: "Map ±",
                right: true,
                render: (r) => (
                  <span style={{ color: r.mapDiff > 0 ? "#4ade80" : r.mapDiff < 0 ? "#f87171" : "#555" }}>
                    {r.mapDiff > 0 ? "+" : ""}
                    {r.mapDiff}
                  </span>
                ),
              },
              {
                h: "Pts",
                right: true,
                render: (r) => (
                  <span className="font-display font-extrabold text-[15px] text-[#E6E6E6]">{r.points}</span>
                ),
              },
            ]}
            rows={rows}
            keyFn={(r) => r.teamId}
          />
          <div className="px-3.5 py-2.5 font-mono text-[9px] text-[#444] tracking-[1px] uppercase border-t border-white/[0.04]">
            Standings recompute automatically from finalized results
          </div>
        </Card>
      )}

      {tab === "teams" && (
        <div className="nrv-grid-3">
          {(event.teams ?? []).map(({ teamId }) => {
            const t = teamMap.get(teamId);
            if (!t) return null;
            return (
              <Card key={teamId} pad={18}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-1 h-[22px]" style={{ background: t.isNrv ? t.color ?? "#444" : "#444" }} />
                  <div>
                    <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
                      {t.name}
                    </div>
                    <div className="font-mono text-[9px] text-[#555] tracking-[2px]">
                      {t.tag}
                      {t.isNrv ? " · NRV" : ""}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
