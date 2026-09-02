"use client";

import type { StandingsRow, Team } from "@/lib/types";
import { Card, Table, TeamChip } from "@/components/ui/primitives";

export function StandingsTable({
  rows,
  teamMap,
}: {
  rows: StandingsRow[];
  teamMap: Map<string, Team>;
}) {
  return (
    <Card pad={0}>
      <Table
        cols={[
          { h: "#", render: (r: StandingsRow) => <span className="text-[#555]">{r.rank}</span> },
          {
            h: "Team",
            render: (r: StandingsRow) => {
              const t = teamMap.get(r.teamId);
              return <TeamChip tag={t?.tag ?? r.teamId} color={t?.color} isNrv={t?.isNrv} />;
            },
          },
          {
            h: "W–L",
            right: true,
            render: (r: StandingsRow) => (
              <span className="text-[#E6E6E6]">
                {r.wins}–{r.losses}
              </span>
            ),
          },
          {
            h: "Map ±",
            right: true,
            render: (r: StandingsRow) => (
              <span
                style={{
                  color: r.mapDiff > 0 ? "#4ade80" : r.mapDiff < 0 ? "#f87171" : "#555",
                }}
              >
                {r.mapDiff > 0 ? "+" : ""}
                {r.mapDiff}
              </span>
            ),
          },
          {
            h: "Pts",
            right: true,
            render: (r: StandingsRow) => (
              <span className="font-display font-extrabold text-[15px] text-[#E6E6E6]">
                {r.points}
              </span>
            ),
          },
        ]}
        rows={rows}
        keyFn={(r) => r.teamId}
      />
    </Card>
  );
}
