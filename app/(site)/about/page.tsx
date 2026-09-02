import { apiGet } from "@/lib/api-server";
import type { Team } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead, SectionLabel, Card } from "@/components/ui/primitives";

export const revalidate = 30;

export default async function AboutPage() {
  const teams = (await apiGet<Team[]>("/teams")) ?? [];
  const nrvTeams = teams.filter((t) => t.isNrv);

  return (
    <PageShell>
      <PageHead
        kicker="The organization"
        title="About NRV"
        sub="Nerve Esports is a competitive gaming organization fielding rosters across multiple titles, running its own circuit and open tournaments year-round."
      />
      <SectionLabel>Our teams</SectionLabel>
      <div className="nrv-grid-3">
        {nrvTeams.map((t) => (
          <Card key={t.id} pad={18}>
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-6" style={{ background: t.color ?? "#7E82AC" }} />
              <div>
                <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
                  {t.name}
                </div>
                <div className="font-mono text-[9px] text-[#555] tracking-[2px]">
                  {t.tag} · {t.game}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {nrvTeams.length === 0 && (
          <div className="font-mono text-[11px] text-[#444] uppercase tracking-[2px]">
            No teams yet
          </div>
        )}
      </div>
    </PageShell>
  );
}
