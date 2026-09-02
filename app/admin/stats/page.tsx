"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Match, NrvEvent, Team } from "@/lib/types";
import { statDisplayStatus } from "@/lib/derived";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, TeamChip, Pill, Btn, Modal, Input, fmtDT } from "@/components/ui/primitives";

export default function AdminStatsPage() {
  const toast = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamMap, setTeamMap] = useState<Map<string, Team>>(new Map());
  const [eventMap, setEventMap] = useState<Map<string, NrvEvent>>(new Map());
  const [links, setLinks] = useState<{ matchId: string; list: string[] } | null>(null);

  const load = async () => {
    const [teams, events] = await Promise.all([
      api.get<Team[]>("/teams", { auth: false }).catch(() => []),
      api.get<NrvEvent[]>("/events", { auth: false }).catch(() => []),
    ]);
    setTeamMap(new Map(teams.map((t) => [t.id, t])));
    setEventMap(new Map(events.map((e) => [e.id, e])));
    const matchLists = await Promise.all(
      events.map((e) => api.get<Match[]>(`/events/${e.id}/matches`, { auth: false }).catch(() => []))
    );
    setMatches(matchLists.flat().filter((m) => m.status === "final" || m.status === "forfeit"));
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const openLinks = (m: Match) => {
    setLinks({ matchId: m.id, list: m.trackerLinks?.length ? m.trackerLinks.map((l) => l.url) : [""] });
  };

  const saveLinks = async () => {
    if (!links) return;
    try {
      await api.post(`/matches/${links.matchId}/tracker-links`, {
        links: links.list.map((l) => l.trim()).filter(Boolean),
      });
      toast("Tracker links saved");
      setLinks(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save tracker links", "error");
    }
  };

  const syncNow = async (m: Match) => {
    try {
      await api.post(`/matches/${m.id}/stats/sync`, {});
      toast("Sync complete");
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Sync failed", "error");
    }
  };

  return (
    <div>
      <AdminHead
        title="Stats Pipeline"
        sub="Tracker-link scraping is the primary ingestion path; manual entry is a per-match fallback."
      />
      <Card pad={0}>
        <Table
          cols={[
            {
              h: "Match",
              render: (m: Match) => {
                const a = teamMap.get(m.teamAId);
                const b = teamMap.get(m.teamBId);
                return (
                  <span className="inline-flex gap-3 items-center flex-wrap">
                    <TeamChip tag={a?.tag ?? m.teamAId} color={a?.color} isNrv={a?.isNrv} />
                    <span className="text-[#333] text-[10px]">vs</span>
                    <TeamChip tag={b?.tag ?? m.teamBId} color={b?.color} isNrv={b?.isNrv} />
                  </span>
                );
              },
            },
            {
              h: "Played",
              render: (m: Match) => <span className="text-[#555] text-[10px] whitespace-nowrap">{fmtDT(m.startsAt)}</span>,
            },
            {
              h: "Tracker links",
              render: (m: Match) => {
                const n = m.trackerLinks?.length ?? 0;
                return <span className="text-[10px]" style={{ color: n ? "#4ade80" : "#f87171" }}>{n ? n + " linked" : "none linked"}</span>;
              },
            },
            {
              h: "Sync",
              render: (m: Match) => {
                const ds = statDisplayStatus(m.statSync);
                return (
                  <Pill color={ds === "synced" ? "#4ade80" : ds === "failed" ? "#f87171" : ds === "stale" ? "#fbbf24" : "#888BA0"}>
                    {ds}
                  </Pill>
                );
              },
            },
            {
              h: "Event",
              render: (m: Match) => <span className="text-[10px] text-[#888BA0]">{eventMap.get(m.eventId)?.name ?? m.eventId}</span>,
            },
            {
              h: "",
              right: true,
              render: (m: Match) => {
                const ds = statDisplayStatus(m.statSync);
                return (
                  <div className="flex gap-1.5 justify-end flex-wrap">
                    <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 9 }} onClick={() => openLinks(m)}>
                      Edit links
                    </Btn>
                    <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 9 }} onClick={() => syncNow(m)}>
                      {ds === "pending" ? "Sync now" : "Re-sync"}
                    </Btn>
                  </div>
                );
              },
            },
          ]}
          rows={matches}
          keyFn={(m) => m.id}
        />
      </Card>
      <Modal
        open={!!links}
        onClose={() => setLinks(null)}
        title="Tracker links"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setLinks(null)}>
              Cancel
            </Btn>
            <Btn onClick={saveLinks}>Save links</Btn>
          </>
        }
      >
        {links && (
          <div>
            {links.list.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2.5 items-center">
                <Input
                  value={v}
                  onChange={(e) =>
                    setLinks((l) =>
                      l ? { ...l, list: l.list.map((x, j) => (j === i ? e.target.value : x)) } : l
                    )
                  }
                  placeholder={`https://vlr.gg/… (map ${i + 1})`}
                  className="flex-1"
                />
                <button
                  onClick={() => setLinks((l) => (l ? { ...l, list: l.list.filter((_, j) => j !== i) } : l))}
                  className="bg-transparent border-none text-[#555] cursor-pointer font-mono text-[14px]"
                >
                  ✕
                </button>
              </div>
            ))}
            <Btn
              variant="ghost"
              style={{ padding: "6px 14px" }}
              onClick={() => setLinks((l) => (l ? { ...l, list: [...l.list, ""] } : l))}
            >
              + Add link
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
