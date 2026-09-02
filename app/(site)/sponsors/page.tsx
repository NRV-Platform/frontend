import { apiGet } from "@/lib/api-server";
import type { Sponsor } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead, Card, Pill, Empty } from "@/components/ui/primitives";

export const revalidate = 30;

export default async function SponsorsPage() {
  const sponsors = (await apiGet<Sponsor[]>("/sponsors")) ?? [];

  return (
    <PageShell>
      <PageHead kicker="Partners" title="Sponsors" />
      {sponsors.length === 0 ? (
        <Empty label="Sponsors section is not active yet" />
      ) : (
        <div className="flex flex-col gap-4 max-w-[720px]">
          {sponsors
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((s) => (
              <Card key={s.id} pad={22} className="flex items-center gap-4.5" style={{ gap: 18 }}>
                <div
                  className="w-14 h-14 border border-[rgba(126,130,172,0.25)] flex items-center justify-center font-mono text-[8px] text-[#555] flex-shrink-0"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg,#16161c 0 8px,#1c1c24 8px 16px)",
                  }}
                >
                  LOGO
                </div>
                <div className="flex-1">
                  <div className="font-display font-extrabold text-[17px] tracking-[1px] text-[#E6E6E6] uppercase">
                    {s.name}
                  </div>
                </div>
                <Pill color={s.tier === "Title" ? "#BFC2DE" : "#888BA0"}>{s.tier} sponsor</Pill>
              </Card>
            ))}
        </div>
      )}
    </PageShell>
  );
}
