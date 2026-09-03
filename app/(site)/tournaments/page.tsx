import { apiGet } from "@/lib/api-server";
import type { NrvEvent } from "@/lib/types";
import { evStatus, fmtD } from "@/lib/derived";
import { PageShell } from "@/components/nav";
import { PageHead, Card, Pill } from "@/components/ui/primitives";
import { RegCTA } from "@/components/tournaments/reg-cta";
import Link from "next/link";

export const revalidate = 30;

export default async function EventsPage() {
  const events = (await apiGet<NrvEvent[]>("/events")) ?? [];

  return (
    <PageShell>
      <PageHead
        kicker="Competition"
        title="Events"
        sub="Every NRV competition — schedule, results, and standings live under its event."
      />
      <div className="flex flex-col gap-5">
        {events.map((ev) => {
          const status = evStatus(ev);
          return (
            <Card key={ev.id} pad={0}>
              <div className="p-6 flex gap-5 flex-wrap items-center">
                <Link href={`/tournaments/${ev.id}`} className="flex-[1_1_300px] no-underline cursor-pointer">
                  <div className="flex gap-2.5 items-center mb-2 flex-wrap">
                    <Pill>{status}</Pill>
                    <Pill color="#888BA0">{ev.game}</Pill>
                    <Pill color="#888BA0">{ev.format.replace("_", " ")}</Pill>
                  </div>
                  <div className="font-display font-extrabold text-[22px] text-[#E6E6E6] uppercase" style={{ letterSpacing: "0.5px" }}>
                    {ev.name}
                  </div>
                  <div className="font-mono text-[11px] text-[#888BA0] mt-1.5">
                    {fmtD(ev.startDate)} — {fmtD(ev.endDate)} · {ev.teams?.length ?? 0}/{ev.capacity} teams
                    {ev.prizeText ? ` · ${ev.prizeText}` : ""}
                  </div>
                </Link>
                <div>
                  <RegCTA event={ev} />
                </div>
              </div>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card pad={28}>
            <div className="font-mono text-[11px] text-[#444] text-center uppercase tracking-[2px]">
              No events yet
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
