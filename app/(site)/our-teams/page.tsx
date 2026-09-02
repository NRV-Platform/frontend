import { apiGet } from "@/lib/api-server";
import type { Team } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead, Empty } from "@/components/ui/primitives";
import { OurTeamsGrid } from "@/components/teams/our-teams-grid";

export const revalidate = 30;

export default async function OurTeamsPage() {
  const teams = (await apiGet<Team[]>("/teams")) ?? [];
  const shown = teams.filter((t) => t.isNrv && t.homepageEnabled);

  return (
    <PageShell>
      <PageHead kicker="Rosters" title="Our Teams" />
      {shown.length === 0 ? (
        <Empty label="No teams currently shown" />
      ) : (
        <OurTeamsGrid teams={shown} />
      )}
    </PageShell>
  );
}
