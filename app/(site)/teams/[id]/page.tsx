import Link from "next/link";
import { apiGet } from "@/lib/api-server";
import type { Team } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead, Card, Table, Pill, Empty } from "@/components/ui/primitives";
import { OtherTeamsRow } from "@/components/teams/other-teams-row";

export const revalidate = 30;

export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, allTeams] = await Promise.all([
    apiGet<Team>(`/teams/${id}`),
    apiGet<Team[]>("/teams"),
  ]);

  if (!team) {
    return (
      <PageShell>
        <Empty label="Team not found" />
      </PageShell>
    );
  }

  const others = (allTeams ?? []).filter((t) => t.isNrv && t.id !== team.id && t.homepageEnabled);
  const roster = team.memberships ?? [];

  return (
    <PageShell>
      <Link
        href="/our-teams"
        className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase no-underline"
      >
        ← All teams
      </Link>
      <div className="flex items-center gap-4 my-5" style={{ margin: "20px 0 8px" }}>
        <span className="w-1.5 h-11" style={{ background: team.color ?? "#7E82AC" }} />
        <Pill color="#888BA0">{team.game}</Pill>
      </div>
      <PageHead title={team.name} sub={`${team.tag} · ${roster.length} roster member${roster.length === 1 ? "" : "s"}`} />
      <Card pad={0}>
        <Table
          cols={[
            {
              h: "Player",
              render: (m) => (
                <div>
                  <div
                    className="text-[#E6E6E6] font-display font-bold text-[14px] tracking-[1px] uppercase"
                  >
                    {m.user?.name ?? "—"}
                  </div>
                  <div className="text-[10px] text-[#555]">{m.user?.playerTag}</div>
                </div>
              ),
            },
            {
              h: "Position",
              render: (m) => (
                <span className="text-[#888BA0] text-[10px] tracking-[1px] uppercase">
                  {m.position || "—"}
                </span>
              ),
            },
            {
              h: "Role",
              right: true,
              render: (m) => (
                <Pill color={m.teamRole === "coach" ? "#4ade80" : m.teamRole === "captain" ? "#BFC2DE" : "#555"}>
                  {m.teamRole}
                </Pill>
              ),
            },
          ]}
          rows={roster}
          keyFn={(m) => m.id}
        />
      </Card>
      <OtherTeamsRow teams={others} />
    </PageShell>
  );
}
