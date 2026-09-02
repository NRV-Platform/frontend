import Link from "next/link";
import Image from "next/image";
import { apiGet } from "@/lib/api-server";
import type { Match, NewsPost, NrvEvent, Team } from "@/lib/types";
import { evStatus, computeStandings } from "@/lib/derived";
import { PageShell } from "@/components/nav";
import { SectionLabel, Empty } from "@/components/ui/primitives";
import { HeroCTA } from "@/components/home/hero-cta";
import { TeamsStrip } from "@/components/home/teams-strip";
import { MatchWidget } from "@/components/home/match-widget";
import { StandingsTable } from "@/components/home/standings-table";
import { NewsCard } from "@/components/news/news-card";

export const revalidate = 30;

export default async function HomePage() {
  const [teams, events, news] = await Promise.all([
    apiGet<Team[]>("/teams"),
    apiGet<NrvEvent[]>("/events"),
    apiGet<NewsPost[]>("/news"),
  ]);

  const allEvents = events ?? [];
  const activeEvent =
    allEvents.find((e) => evStatus(e) === "Active") ?? allEvents[0] ?? null;

  const matchLists = await Promise.all(
    allEvents.map((ev) => apiGet<Match[]>(`/events/${ev.id}/matches`))
  );
  const allMatches: Match[] = matchLists.flatMap((m, i) =>
    (m ?? []).map((match) => ({ ...match, event: allEvents[i] }))
  );

  const upcoming = allMatches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))
    .slice(0, 3);
  const recent = allMatches
    .filter((m) => m.status === "final" || m.status === "forfeit")
    .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1))
    .slice(0, 3);

  const posts = (news ?? []).filter((p) => p.status === "published").slice(0, 3);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const eventMatches = activeEvent
    ? matchLists[allEvents.findIndex((e) => e.id === activeEvent.id)] ?? []
    : [];
  const standings = activeEvent
    ? computeStandings(
        activeEvent.teams?.map((t) => t.teamId) ?? [],
        eventMatches
      ).slice(0, 5)
    : [];

  const nrvTeams = (teams ?? []).filter((t) => t.isNrv && t.homepageEnabled);

  return (
    <div>
      <div className="relative min-h-[420px] flex items-center justify-center overflow-hidden border-b border-[rgba(126,130,172,0.2)]">
        <Image
          src="/assets/neural.png"
          alt=""
          fill
          priority
          className="object-cover"
          style={{ opacity: 0.35 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,11,14,0.55) 0%, rgba(11,11,14,0.35) 55%, #0B0B0E 100%)",
          }}
        />
        <div className="relative text-center px-5" style={{ padding: "120px 20px 70px" }}>
          <Image
            src="/assets/nerve-wordmark.png"
            alt="NERVE"
            width={4096}
            height={896}
            priority
            style={{ width: "min(560px,80vw)", height: "auto", margin: "0 auto" }}
          />
          <HeroCTA activeEventId={activeEvent?.id ?? null} events={allEvents} />
        </div>
      </div>
      <TeamsStrip teams={nrvTeams} />
      <PageShell>
        <div className="flex gap-5 flex-wrap" style={{ marginTop: -40, position: "relative" }}>
          <MatchWidget
            title="Upcoming"
            matches={upcoming}
            teamMap={teamMap}
            showScore={false}
            live
          />
          <MatchWidget
            title="Recent Results"
            matches={recent}
            teamMap={teamMap}
            showScore
          />
        </div>

        {activeEvent && (
          <div style={{ marginTop: 64 }}>
            <SectionLabel
              right={
                <Link
                  href={`/tournaments/${activeEvent.id}`}
                  className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase no-underline"
                >
                  Full table →
                </Link>
              }
            >
              {activeEvent.name}
            </SectionLabel>
            <StandingsTable rows={standings} teamMap={teamMap} />
          </div>
        )}

        <div style={{ marginTop: 64 }}>
          <SectionLabel
            right={
              <Link
                href="/news"
                className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase no-underline"
              >
                All news →
              </Link>
            }
          >
            Latest News
          </SectionLabel>
          <div className="nrv-grid-3">
            {posts.map((p) => (
              <NewsCard key={p.id} post={p} />
            ))}
          </div>
          {posts.length === 0 && <Empty label="No news yet" />}
        </div>
      </PageShell>
    </div>
  );
}
