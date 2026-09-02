"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Match, NrvEvent, Team } from "@/lib/types";
import { evStatus, GAMES } from "@/lib/derived";
import { AdminHead } from "@/components/admin/shared";
import {
  Card,
  Table,
  TeamChip,
  Pill,
  Field,
  Input,
  Select,
  Btn,
  ConfirmModal,
  Modal,
  fmtD,
  fmtDT,
} from "@/components/ui/primitives";

interface EventDraft {
  id?: string;
  name: string;
  game: string;
  format: string;
  startDate: string;
  endDate: string;
  regOpenDate: string;
  regCloseDate: string;
  capacity: number;
  prizeText: string;
  description: string;
}

const blankEvent = (): EventDraft => ({
  name: "",
  game: GAMES[0],
  format: "round_robin",
  startDate: "",
  endDate: "",
  regOpenDate: "",
  regCloseDate: "",
  capacity: 8,
  prizeText: "",
  description: "",
});

export default function AdminEventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<NrvEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventDraft | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [nm, setNm] = useState<{ teamAId: string; teamBId: string; format: string; startsAt: string; streamUrl: string } | null>(
    null
  );
  const [result, setResult] = useState<{ match: Match; maps: { mapName: string; scoreA: string; scoreB: string }[] } | null>(
    null
  );
  const [forfeit, setForfeit] = useState<{ match: Match; winner: string } | null>(null);
  const [del, setDel] = useState<Match | null>(null);

  const loadEvents = async () => {
    const [ev, tm] = await Promise.all([
      api.get<NrvEvent[]>("/events", { auth: false }).catch(() => []),
      api.get<Team[]>("/teams", { auth: false }).catch(() => []),
    ]);
    setEvents(ev);
    setTeams(tm);
    if (!sel && ev[0]) setSel(ev[0].id);
  };

  const loadMatches = async (eventId: string) => {
    const list = await api.get<Match[]>(`/events/${eventId}/matches`, { auth: false }).catch(() => []);
    setMatches(list.slice().sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1)));
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sel) loadMatches(sel);
  }, [sel]);

  const ev = events.find((e) => e.id === sel) ?? null;
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const saveEvent = async () => {
    if (!editing || !editing.name || !editing.startDate || !editing.endDate) {
      toast("Name and dates are required", "error");
      return;
    }
    try {
      if (editing.id) {
        await api.patch(`/events/${editing.id}`, editing);
      } else {
        await api.post("/events", editing);
      }
      toast("Event saved");
      setEditing(null);
      loadEvents();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save event", "error");
    }
  };

  const saveMatch = async () => {
    if (!nm || !ev || !nm.teamAId || !nm.teamBId || nm.teamAId === nm.teamBId || !nm.startsAt) {
      toast("Two different teams and a start time are required", "error");
      return;
    }
    try {
      await api.post("/matches", { ...nm, eventId: ev.id, timezone: "America/New_York" });
      toast("Match created");
      setNm(null);
      loadMatches(ev.id);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create match", "error");
    }
  };

  const finalize = async () => {
    if (!result) return;
    const maps = result.maps
      .filter((r) => r.mapName && r.scoreA !== "" && r.scoreB !== "")
      .map((r) => ({ mapName: r.mapName, scoreA: +r.scoreA, scoreB: +r.scoreB }));
    if (!maps.length) {
      toast("Enter at least one map", "error");
      return;
    }
    let a = 0,
      b = 0;
    maps.forEach((r) => (r.scoreA > r.scoreB ? a++ : b++));
    if (a === b) {
      toast("Series is tied — add the deciding map", "error");
      return;
    }
    try {
      await api.post(`/matches/${result.match.id}/finalize`, { maps });
      toast("Result final — standings recomputed");
      setResult(null);
      if (sel) loadMatches(sel);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to finalize result", "error");
    }
  };

  const doForfeit = async () => {
    if (!forfeit) return;
    try {
      await api.patch(`/matches/${forfeit.match.id}`, { status: "forfeit", forfeitWinnerId: forfeit.winner });
      toast("Forfeit recorded");
      setForfeit(null);
      if (sel) loadMatches(sel);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to record forfeit", "error");
    }
  };

  const togglePostpone = async (m: Match) => {
    try {
      await api.patch(`/matches/${m.id}`, { status: m.status === "postponed" ? "scheduled" : "postponed" });
      toast(m.status === "postponed" ? "Match unpostponed" : "Match postponed");
      if (sel) loadMatches(sel);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update match", "error");
    }
  };

  const doDelete = async () => {
    if (!del) return;
    try {
      await api.delete(`/matches/${del.id}`);
      toast("Match deleted");
      setDel(null);
      if (sel) loadMatches(sel);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete match", "error");
    }
  };

  return (
    <div>
      <AdminHead
        title="Events & Matches"
        sub="An event owns its schedule, standings, and registration window. Status is derived from dates."
        right={<Btn onClick={() => setEditing(blankEvent())}>+ New event</Btn>}
      />
      <div className="flex gap-2 flex-wrap mb-6">
        {events.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setSel(e.id);
              setEditing(null);
            }}
            className="font-mono text-[11px] tracking-[1px] px-4 py-2 cursor-pointer"
            style={{
              background: sel === e.id ? "#23253A" : "transparent",
              border: `1px solid ${sel === e.id ? "#7E82AC" : "rgba(126,130,172,0.3)"}`,
              color: sel === e.id ? "#E6E6E6" : "#888BA0",
            }}
          >
            {e.name}
          </button>
        ))}
      </div>

      {editing && (
        <Card pad={22} className="mb-6">
          <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-4">
            {editing.id ? "Edit event" : "New event"}
          </div>
          <div className="nrv-grid-3">
            <Field label="Name" req style={{ gridColumn: "1 / -1" }}>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Game">
              <Select value={editing.game} onChange={(e) => setEditing({ ...editing, game: e.target.value })} options={GAMES} />
            </Field>
            <Field label="Format">
              <Select
                value={editing.format}
                onChange={(e) => setEditing({ ...editing, format: e.target.value })}
                options={[
                  { value: "single_elim", label: "Single elimination" },
                  { value: "double_elim", label: "Double elimination" },
                  { value: "round_robin", label: "Round robin / league" },
                ]}
              />
            </Field>
            <Field label="Capacity">
              <Input
                type="number"
                min={2}
                value={editing.capacity}
                onChange={(e) => setEditing({ ...editing, capacity: +e.target.value })}
              />
            </Field>
            <Field label="Start date" req>
              <Input type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
            </Field>
            <Field label="End date" req>
              <Input type="date" value={editing.endDate} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} />
            </Field>
            <Field label="Prize (plain text)">
              <Input value={editing.prizeText} onChange={(e) => setEditing({ ...editing, prizeText: e.target.value })} />
            </Field>
            <Field label="Registration opens">
              <Input
                type="date"
                value={editing.regOpenDate}
                onChange={(e) => setEditing({ ...editing, regOpenDate: e.target.value })}
              />
            </Field>
            <Field label="Registration closes (= roster lock)">
              <Input
                type="date"
                value={editing.regCloseDate}
                onChange={(e) => setEditing({ ...editing, regCloseDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2.5 mt-4.5" style={{ marginTop: 18 }}>
            <Btn onClick={saveEvent}>Save event</Btn>
            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
          </div>
        </Card>
      )}

      {ev && !editing && (
        <div>
          <Card pad={18} className="mb-5 flex gap-4 items-center flex-wrap">
            <Pill>{evStatus(ev)}</Pill>
            <span className="font-mono text-[11px] text-[#888BA0]">
              {fmtD(ev.startDate)} — {fmtD(ev.endDate)} · reg {fmtD(ev.regOpenDate)}–{fmtD(ev.regCloseDate)} ·{" "}
              {ev.teams?.length ?? 0}/{ev.capacity} teams · {ev.format.replace("_", " ")}
            </span>
            <div className="ml-auto flex gap-2">
              <Btn
                variant="ghost"
                style={{ padding: "6px 14px" }}
                onClick={() =>
                  setEditing({
                    id: ev.id,
                    name: ev.name,
                    game: ev.game,
                    format: ev.format,
                    startDate: ev.startDate.slice(0, 10),
                    endDate: ev.endDate.slice(0, 10),
                    regOpenDate: ev.regOpenDate.slice(0, 10),
                    regCloseDate: ev.regCloseDate.slice(0, 10),
                    capacity: ev.capacity,
                    prizeText: ev.prizeText ?? "",
                    description: ev.description ?? "",
                  })
                }
              >
                Edit
              </Btn>
              <Btn
                style={{ padding: "6px 14px" }}
                onClick={() =>
                  setNm({
                    teamAId: ev.teams?.[0]?.teamId ?? "",
                    teamBId: ev.teams?.[1]?.teamId ?? "",
                    format: "BO1",
                    startsAt: "",
                    streamUrl: "",
                  })
                }
              >
                + Match
              </Btn>
            </div>
          </Card>

          {nm && (
            <Card pad={20} className="mb-5">
              <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3.5">New match</div>
              <div className="nrv-grid-3">
                <Field label="Team A" req>
                  <Select
                    value={nm.teamAId}
                    onChange={(e) => setNm({ ...nm, teamAId: e.target.value })}
                    options={(ev.teams ?? []).map((t) => ({
                      value: t.teamId,
                      label: teamMap.get(t.teamId)?.name ?? t.teamId,
                    }))}
                  />
                </Field>
                <Field label="Team B" req>
                  <Select
                    value={nm.teamBId}
                    onChange={(e) => setNm({ ...nm, teamBId: e.target.value })}
                    options={(ev.teams ?? []).map((t) => ({
                      value: t.teamId,
                      label: teamMap.get(t.teamId)?.name ?? t.teamId,
                    }))}
                  />
                </Field>
                <Field label="Series format">
                  <Select value={nm.format} onChange={(e) => setNm({ ...nm, format: e.target.value })} options={["BO1", "BO3", "BO5"]} />
                </Field>
                <Field label="Starts at" req>
                  <Input type="datetime-local" value={nm.startsAt} onChange={(e) => setNm({ ...nm, startsAt: e.target.value })} />
                </Field>
                <Field label="Stream URL">
                  <Input value={nm.streamUrl} onChange={(e) => setNm({ ...nm, streamUrl: e.target.value })} placeholder="https://twitch.tv/…" />
                </Field>
              </div>
              <div className="flex gap-2.5 mt-4">
                <Btn onClick={saveMatch}>Create</Btn>
                <Btn variant="ghost" onClick={() => setNm(null)}>
                  Cancel
                </Btn>
              </div>
            </Card>
          )}

          <Card pad={0}>
            <Table
              cols={[
                { h: "Starts", render: (m: Match) => <span className="whitespace-nowrap text-[#555]">{fmtDT(m.startsAt)}</span> },
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
                { h: "Fmt", render: (m: Match) => <span className="text-[#555]">{m.format}</span> },
                {
                  h: "Maps",
                  render: (m: Match) =>
                    m.mapResults?.length ? (
                      <span className="text-[10px]">
                        {m.mapResults.map((r) => `${r.mapName} ${r.scoreA}–${r.scoreB}`).join(" · ")}
                      </span>
                    ) : (
                      <span className="text-[#333]">—</span>
                    ),
                },
                { h: "Status", render: (m: Match) => <Pill>{m.status}</Pill> },
                {
                  h: "",
                  right: true,
                  render: (m: Match) => (
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {(m.status === "scheduled" || m.status === "postponed") && (
                        <Btn
                          style={{ padding: "5px 12px", fontSize: 9 }}
                          onClick={() => setResult({ match: m, maps: [{ mapName: "", scoreA: "", scoreB: "" }] })}
                        >
                          Enter result
                        </Btn>
                      )}
                      {(m.status === "scheduled" || m.status === "postponed") && (
                        <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 9 }} onClick={() => togglePostpone(m)}>
                          {m.status === "postponed" ? "Unpostpone" : "Postpone"}
                        </Btn>
                      )}
                      {m.status === "scheduled" && (
                        <Btn
                          variant="ghost"
                          style={{ padding: "5px 12px", fontSize: 9 }}
                          onClick={() => setForfeit({ match: m, winner: m.teamAId })}
                        >
                          Forfeit
                        </Btn>
                      )}
                      <Btn
                        variant="ghost"
                        style={{ padding: "5px 12px", fontSize: 9, color: "#f87171", borderColor: "rgba(248,113,113,0.4)" }}
                        onClick={() => setDel(m)}
                      >
                        Delete
                      </Btn>
                    </div>
                  ),
                },
              ]}
              rows={matches}
              keyFn={(m) => m.id}
            />
          </Card>
        </div>
      )}

      <Modal
        open={!!result}
        onClose={() => setResult(null)}
        title={
          result
            ? `Result: ${teamMap.get(result.match.teamAId)?.tag ?? ""} vs ${teamMap.get(result.match.teamBId)?.tag ?? ""} (${result.match.format})`
            : ""
        }
        footer={
          <>
            <Btn variant="ghost" onClick={() => setResult(null)}>
              Cancel
            </Btn>
            <Btn onClick={finalize}>Finalize result</Btn>
          </>
        }
      >
        {result && (
          <div>
            <div className="font-mono text-[10px] text-[#555] leading-[1.7] mb-4">
              One row per map actually played. Finalizing recomputes standings automatically.
            </div>
            {result.maps.map((r, i) => (
              <div key={i} className="flex gap-2.5 mb-2.5 items-end">
                <Field label={`Map ${i + 1}`} className="flex-[2]" style={{ flex: 2 }}>
                  <Input
                    value={r.mapName}
                    onChange={(e) =>
                      setResult((s) =>
                        s ? { ...s, maps: s.maps.map((x, j) => (j === i ? { ...x, mapName: e.target.value } : x)) } : s
                      )
                    }
                    placeholder="e.g. Ascent"
                  />
                </Field>
                <Field label={teamMap.get(result.match.teamAId)?.tag ?? "A"} className="flex-1" style={{ flex: 1 }}>
                  <Input
                    type="number"
                    min={0}
                    value={r.scoreA}
                    onChange={(e) =>
                      setResult((s) =>
                        s ? { ...s, maps: s.maps.map((x, j) => (j === i ? { ...x, scoreA: e.target.value } : x)) } : s
                      )
                    }
                  />
                </Field>
                <Field label={teamMap.get(result.match.teamBId)?.tag ?? "B"} className="flex-1" style={{ flex: 1 }}>
                  <Input
                    type="number"
                    min={0}
                    value={r.scoreB}
                    onChange={(e) =>
                      setResult((s) =>
                        s ? { ...s, maps: s.maps.map((x, j) => (j === i ? { ...x, scoreB: e.target.value } : x)) } : s
                      )
                    }
                  />
                </Field>
                <button
                  onClick={() => setResult((s) => (s ? { ...s, maps: s.maps.filter((_, j) => j !== i) } : s))}
                  className="bg-transparent border-none text-[#555] cursor-pointer font-mono text-[14px] py-2.5 px-0.5"
                >
                  ✕
                </button>
              </div>
            ))}
            {result.maps.length < ({ BO1: 1, BO3: 3, BO5: 5 }[result.match.format] || 5) && (
              <Btn
                variant="ghost"
                style={{ padding: "6px 14px" }}
                onClick={() => setResult((s) => (s ? { ...s, maps: [...s.maps, { mapName: "", scoreA: "", scoreB: "" }] } : s))}
              >
                + Add map
              </Btn>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!forfeit}
        title="Record forfeit"
        confirmLabel="Record forfeit"
        body={
          forfeit && (
            <span>
              Record a forfeit for {teamMap.get(forfeit.match.teamAId)?.tag} vs {teamMap.get(forfeit.match.teamBId)?.tag}. Winner:
              <span className="inline-flex gap-2 ml-2.5">
                {[forfeit.match.teamAId, forfeit.match.teamBId].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForfeit((s) => (s ? { ...s, winner: t } : s))}
                    className="font-mono text-[10px] px-2.5 py-1 cursor-pointer"
                    style={{
                      background: forfeit.winner === t ? "#7E82AC" : "transparent",
                      border: "1px solid rgba(126,130,172,0.4)",
                      color: forfeit.winner === t ? "#fff" : "#888BA0",
                    }}
                  >
                    {teamMap.get(t)?.tag}
                  </button>
                ))}
              </span>
            </span>
          )
        }
        onCancel={() => setForfeit(null)}
        onConfirm={doForfeit}
      />

      <ConfirmModal
        open={!!del}
        title="Delete match"
        confirmLabel="Delete match"
        body={
          del &&
          `Delete ${teamMap.get(del.teamAId)?.tag} vs ${teamMap.get(del.teamBId)?.tag} (${fmtDT(del.startsAt)})? This removes it from the public schedule and standings immediately.`
        }
        onCancel={() => setDel(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
