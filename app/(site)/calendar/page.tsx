import { apiGet } from "@/lib/api-server";
import type { Match, NrvEvent, Team } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead } from "@/components/ui/primitives";
import { CalendarGrid } from "@/components/calendar/calendar-grid";

export const revalidate = 30;

export default async function CalendarPage() {
  const [events, teams] = await Promise.all([
    apiGet<NrvEvent[]>("/events"),
    apiGet<Team[]>("/teams"),
  ]);
  const allEvents = events ?? [];
  const matchLists = await Promise.all(
    allEvents.map((ev) => apiGet<Match[]>(`/events/${ev.id}/matches`))
  );
  const allMatches: Match[] = matchLists.flatMap((m, i) =>
    (m ?? []).map((match) => ({ ...match, eventId: allEvents[i].id }))
  );

  return (
    <PageShell wide>
      <PageHead kicker="Schedule" title="Calendar" />
      <CalendarGrid
        matches={allMatches}
        teamMap={new Map((teams ?? []).map((t) => [t.id, t]))}
      />
    </PageShell>
  );
}
