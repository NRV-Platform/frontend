import type { Match, NrvEvent, StandingsRow } from "./types";

// Letters, numbers, underscore, hyphen only — 2-16 characters. Chosen
// freely by the player at signup or later from their profile; matches the
// backend's SignupDto/UpdatePlayerTagDto validation exactly.
export const PLAYER_TAG_PATTERN = /^[a-zA-Z0-9_-]{2,16}$/;
export const PLAYER_TAG_HINT = "2-16 characters: letters, numbers, _ or -";

export function evStatus(ev: NrvEvent): "Upcoming" | "Active" | "Completed" {
  const t = new Date().toISOString().slice(0, 10);
  const start = ev.startDate.slice(0, 10);
  const end = ev.endDate.slice(0, 10);
  if (t < start) return "Upcoming";
  if (t > end) return "Completed";
  return "Active";
}

export function regState(
  ev: NrvEvent,
  approvedCount: number
): "notopen" | "open" | "waitlist" | "closed" {
  const t = new Date().toISOString().slice(0, 10);
  const open = ev.regOpenDate.slice(0, 10);
  const close = ev.regCloseDate.slice(0, 10);
  if (t < open) return "notopen";
  if (t > close) return "closed";
  return approvedCount >= ev.capacity ? "waitlist" : "open";
}

export function matchWinner(m: Match): string | null {
  if (m.status === "forfeit") return m.forfeitWinnerId ?? null;
  if (m.status !== "final" || !m.mapResults?.length) return null;
  let a = 0,
    b = 0;
  m.mapResults.forEach((r) => (r.scoreA > r.scoreB ? a++ : b++));
  return a > b ? m.teamAId : m.teamBId;
}

export function mapWins(m: Match, teamId: string): number {
  return (m.mapResults ?? []).filter(
    (r) => (r.scoreA > r.scoreB ? m.teamAId : m.teamBId) === teamId
  ).length;
}

export function computeStandings(eventTeamIds: string[], matches: Match[]): StandingsRow[] {
  const rows: Record<string, StandingsRow> = {};
  eventTeamIds.forEach((t) => {
    rows[t] = { rank: 0, teamId: t, wins: 0, losses: 0, mapDiff: 0, points: 0 };
  });
  matches
    .filter((m) => m.status === "final" || m.status === "forfeit")
    .forEach((m) => {
      const w = matchWinner(m);
      if (!w) return;
      const l = w === m.teamAId ? m.teamBId : m.teamAId;
      if (rows[w]) {
        rows[w].wins++;
        rows[w].points += 3;
      }
      if (rows[l]) rows[l].losses++;
      (m.mapResults ?? []).forEach((r) => {
        const d = r.scoreA - r.scoreB;
        if (rows[m.teamAId]) rows[m.teamAId].mapDiff += d;
        if (rows[m.teamBId]) rows[m.teamBId].mapDiff -= d;
      });
    });
  return Object.values(rows)
    .sort((a, b) => b.points - a.points || b.mapDiff - a.mapDiff)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function statDisplayStatus(
  statSync: { status: string; lastSyncAt?: string | null } | null | undefined
): "pending" | "failed" | "stale" | "synced" {
  if (!statSync || statSync.status === "pending") return "pending";
  if (statSync.status === "failed") return "failed";
  if (!statSync.lastSyncAt) return "pending";
  const days = (Date.now() - new Date(statSync.lastSyncAt).getTime()) / 86400000;
  return days > 5 ? "stale" : "synced";
}

export const GAME_ROLES: Record<string, string[]> = {
  Valorant: ["IGL", "Duelist", "Sentinel", "Initiator", "Controller"],
  "Counter-Strike 2": ["IGL", "AWPer", "Rifler", "Lurker", "Support"],
  "Rocket League": ["Striker", "Midfield", "Goalie"],
  "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Support"],
  "Apex Legends": ["Fragger", "IGL", "Support"],
};

export const TRACKER_SITES: Record<string, string> = {
  Valorant: "VLR.gg",
  "Counter-Strike 2": "HLTV.org",
  "Rocket League": "Liquipedia RL",
  "League of Legends": "Leaguepedia",
  "Apex Legends": "Liquipedia Apex",
};

export const GAMES = [
  "Valorant",
  "Rocket League",
  "Counter-Strike 2",
  "League of Legends",
  "Apex Legends",
];

export function fmtDT(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function fmtD(iso?: string | null) {
  if (!iso) return "—";
  const hasTime = iso.includes("T");
  const d = new Date(hasTime ? iso : iso + "T12:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}
