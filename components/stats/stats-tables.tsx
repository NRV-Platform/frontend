"use client";

import { useMemo, useState } from "react";
import type { PlayerStatRow, Team, TeamStatRow } from "@/lib/types";
import { GAME_ROLES } from "@/lib/derived";
import { Input, Select, Card, Empty, TeamChip } from "@/components/ui/primitives";

const STAT_LEGEND: [string, string][] = [
  ["K/D/A", "Kills / Deaths / Assists"],
  ["ACS", "Average Combat Score"],
  ["ADR", "Average Damage per Round"],
  ["HS%", "Headshot percentage"],
  ["KAST", "Kill / Assist / Survive / Trade round %"],
  ["FK", "First kills per map"],
];

function sortRows<T extends Record<string, unknown>>(rows: T[], key: string, dir: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "string") {
      return dir === "desc" ? String(bv).localeCompare(av) : av.localeCompare(String(bv));
    }
    return dir === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
  });
}

function SortTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  right,
}: {
  label: string;
  k: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (k: string) => void;
  right?: boolean;
}) {
  const on = sortKey === k;
  return (
    <th
      onClick={() => onSort(k)}
      className="font-mono text-[9px] tracking-[2px] uppercase px-3 py-2.5 whitespace-nowrap cursor-pointer select-none"
      style={{
        color: on ? "#E6E6E6" : "#555",
        textAlign: right ? "right" : "left",
        borderBottom: on ? "2px solid #7E82AC" : "2px solid transparent",
      }}
    >
      {label}
      {on && <span className="text-[#7E82AC] ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
    </th>
  );
}

export function StatsTables({
  players,
  teams,
  teamMap,
}: {
  players: PlayerStatRow[];
  teams: TeamStatRow[];
  teamMap: Map<string, Team>;
}) {
  const [tab, setTab] = useState<"players" | "teams">("players");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [sortKey, setSortKey] = useState("acs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const onSort = (k: string) => {
    setSortDir((prev) => (sortKey === k && prev === "desc" ? "asc" : "desc"));
    setSortKey(k);
  };

  const switchTab = (t: "players" | "teams") => {
    setTab(t);
    setSortKey(t === "players" ? "acs" : "winRate");
    setSortDir("desc");
  };

  const allRoles = useMemo(
    () => ["All", ...new Set(Object.values(GAME_ROLES).flat())],
    []
  );

  let playerRows = players.map((r) => ({ ...r, team: teamMap.get(r.teamId) }));
  if (role !== "All") playerRows = playerRows.filter((r) => r.role === role);
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    playerRows = playerRows.filter((r) =>
      `${r.ign} ${r.name} ${r.team?.tag ?? ""}`.toLowerCase().includes(query)
    );
  }
  playerRows = sortRows(playerRows, sortKey, sortDir);

  let teamRows = teams.map((r) => ({ ...r, team: teamMap.get(r.teamId) }));
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    teamRows = teamRows.filter((r) =>
      `${r.team?.name ?? ""} ${r.team?.tag ?? ""}`.toLowerCase().includes(query)
    );
  }
  teamRows = sortRows(teamRows, sortKey, sortDir);

  return (
    <div>
      <div className="flex border-b border-[rgba(126,130,172,0.25)] mb-6">
        {(
          [
            ["players", "Player Stats"],
            ["teams", "Team Stats"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className="font-display font-bold text-[14px] tracking-[2px] uppercase px-5.5 py-3 bg-transparent border-none cursor-pointer"
            style={{
              padding: "12px 22px",
              borderBottom: tab === id ? "3px solid #7E82AC" : "3px solid transparent",
              color: tab === id ? "#E6E6E6" : "#888BA0",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap mb-4.5 items-center" style={{ marginBottom: 18 }}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "players" ? "Search player, team…" : "Search team…"}
          className="max-w-[260px]"
        />
        {tab === "players" && (
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={allRoles}
            className="max-w-[180px]"
          />
        )}
      </div>
      <Card pad={0} className="overflow-x-auto">
        {tab === "players" ? (
          <table className="w-full border-collapse" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th className="px-3 py-2.5" style={{ width: 36 }} />
                <SortTh label="Player" k="ign" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Role" k="role" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Maps" k="maps" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="K/D" k="kd" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="ACS" k="acs" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="ADR" k="adr" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="HS%" k="hsPct" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="KAST" k="kast" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="FK" k="fk" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
              </tr>
            </thead>
            <tbody>
              {playerRows.map((r, i) => (
                <tr key={r.teamId + r.ign} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-center" style={{ color: i < 3 ? "#BFC2DE" : "#555" }}>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-display font-extrabold text-[13px] text-[#E6E6E6]" style={{ letterSpacing: "0.5px" }}>
                      {r.ign}
                    </div>
                    <div className="font-mono text-[9px] text-[#555]">
                      <TeamChip tag={r.team?.tag ?? r.teamId} color={r.team?.color} isNrv={r.team?.isNrv} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-[#888BA0] tracking-[1px] uppercase">
                    {r.role || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.maps}</td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-[12px]"
                    style={{ color: r.kd > 1 ? "#4ade80" : r.kd < 1 ? "#f87171" : "#888BA0" }}
                  >
                    {r.kd.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-display font-extrabold text-[14px] text-[#E6E6E6]">
                    {r.acs}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.adr}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.hsPct}%</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.kast}%</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.fk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th className="px-3 py-2.5" style={{ width: 36 }} />
                <SortTh label="Team" k="teamId" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh label="Maps" k="maps" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="W" k="wins" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="L" k="losses" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="Win%" k="winRate" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="ACS" k="acs" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
                <SortTh label="K/D" k="kd" sortKey={sortKey} sortDir={sortDir} onSort={onSort} right />
              </tr>
            </thead>
            <tbody>
              {teamRows.map((r, i) => (
                <tr key={r.teamId} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-center" style={{ color: i < 3 ? "#BFC2DE" : "#555" }}>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <TeamChip tag={r.team?.tag ?? r.teamId} color={r.team?.color} isNrv={r.team?.isNrv} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.maps}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#4ade80]">{r.wins}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#f87171]">{r.losses}</td>
                  <td
                    className="px-3 py-2.5 text-right font-display font-extrabold text-[14px]"
                    style={{ color: r.winRate >= 50 ? "#4ade80" : "#f87171" }}
                  >
                    {r.winRate}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.acs}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[#888BA0]">{r.kd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(tab === "players" ? playerRows : teamRows).length === 0 && (
          <Empty label="No synced stats yet" />
        )}
      </Card>
      <div className="mt-4.5 flex gap-4.5 flex-wrap" style={{ marginTop: 18, gap: 18 }}>
        {STAT_LEGEND.map(([k, v]) => (
          <span key={k} className="font-mono text-[9px] text-[#555] tracking-[1px]">
            <span className="text-[#888BA0]">{k}</span> — {v}
          </span>
        ))}
      </div>
    </div>
  );
}
