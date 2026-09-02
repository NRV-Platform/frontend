import Link from "next/link";
import { apiGet } from "@/lib/api-server";
import type { Match, NrvEvent, Team } from "@/lib/types";
import { evStatus } from "@/lib/derived";
import { PageShell } from "@/components/nav";
import { PageHead, Pill, Empty } from "@/components/ui/primitives";
import { RegCTA } from "@/components/tournaments/reg-cta";
import { EventTabs } from "@/components/tournaments/event-tabs";

export const revalidate = 15;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, matches, teams] = await Promise.all([
    apiGet<NrvEvent>(`/events/${id}`),
    apiGet<Match[]>(`/events/${id}/matches`),
    apiGet<Team[]>("/teams"),
  ]);

  if (!event) {
    return (
      <PageShell>
        <Empty label="Event not found" />
      </PageShell>
    );
  }

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));

  return (
    <PageShell>
      <Link
        href="/tournaments"
        className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase no-underline"
      >
        ← All events
      </Link>
      <div className="flex gap-2.5 flex-wrap" style={{ margin: "20px 0 8px" }}>
        <Pill>{evStatus(event)}</Pill>
        <Pill color="#888BA0">{event.game}</Pill>
        <Pill color="#888BA0">{event.format.replace("_", " ")}</Pill>
      </div>
      <PageHead title={event.name} sub={event.description ?? undefined} />
      <div style={{ margin: "-16px 0 28px" }}>
        <RegCTA event={event} />
      </div>
      <EventTabs event={event} matches={matches ?? []} teamMap={teamMap} />
    </PageShell>
  );
}
