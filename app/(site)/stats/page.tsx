import { apiGet } from "@/lib/api-server";
import type { PlayerStatRow, Team, TeamStatRow } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead } from "@/components/ui/primitives";
import { StatsTables } from "@/components/stats/stats-tables";

export const revalidate = 30;

export default async function StatsPage() {
  const [players, teams, allTeams] = await Promise.all([
    apiGet<PlayerStatRow[]>("/stats/players"),
    apiGet<TeamStatRow[]>("/stats/teams"),
    apiGet<Team[]>("/teams"),
  ]);

  return (
    <PageShell wide>
      <PageHead
        kicker="Stats Center"
        title="Stats"
        sub="Aggregated from linked tracker profiles for both sides of every match. No fabricated numbers — a team with no synced data simply doesn't appear yet."
      />
      <StatsTables
        players={players ?? []}
        teams={teams ?? []}
        teamMap={new Map((allTeams ?? []).map((t) => [t.id, t]))}
      />
    </PageShell>
  );
}
