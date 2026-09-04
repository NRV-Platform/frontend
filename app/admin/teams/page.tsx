"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { GAME_ROLES } from "@/lib/derived";
import type { Team, TeamMembership } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, Pill, Btn, Modal, Field, Input, Select } from "@/components/ui/primitives";

export default function AdminTeamsPage() {
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [posEdits, setPosEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const list = await api.get<Team[]>("/teams", { auth: false }).catch(() => []);
    setTeams(list.filter((t) => t.isNrv));
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const toggleEnabled = async (team: Team) => {
    try {
      await api.patch(`/teams/${team.id}/visibility`, { homepageEnabled: !team.homepageEnabled });
      toast(team.homepageEnabled ? "Hidden from homepage" : "Shown on homepage");
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update visibility", "error");
    }
  };

  const openTeam = teams.find((t) => t.id === open) ?? null;
  const roster = openTeam?.memberships?.filter((m) => m.slot === "player") ?? [];
  const roles = openTeam ? GAME_ROLES[openTeam.game] || [] : [];
  const takenRoles = new Set(roster.map((m) => m.position).filter((p): p is string => !!p));
  const roleOptions = (excludeCurrent?: string) => [
    "",
    ...roles.map((r) => ({ value: r, label: r, disabled: r !== excludeCurrent && takenRoles.has(r) })),
  ];

  const refreshTeam = (updated: Team) => {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const addPlayer = async () => {
    if (!openTeam) return;
    if (!tagInput.trim()) {
      toast("Enter a player tag", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<Team>(`/teams/${openTeam.id}/members`, {
        playerTag: tagInput.trim(),
        slot: "player",
      });
      const newMember = updated.memberships?.find(
        (m) => m.slot === "player" && m.user?.playerTag?.toLowerCase() === tagInput.trim().toLowerCase()
      );
      const final =
        newMember && newPosition
          ? await api.patch<Team>(`/teams/${openTeam.id}/members/${newMember.userId}/player`, {
              position: newPosition,
            })
          : updated;
      refreshTeam(final);
      toast("Player added to roster");
      setTagInput("");
      setNewPosition("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add player", "error");
    } finally {
      setBusy(false);
    }
  };

  const savePosition = async (userId: string) => {
    if (!openTeam) return;
    const position = posEdits[userId];
    if (position === undefined) return;
    setBusy(true);
    try {
      const updated = await api.patch<Team>(`/teams/${openTeam.id}/members/${userId}/player`, { position });
      refreshTeam(updated);
      toast("Roster updated");
      setPosEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update roster", "error");
    } finally {
      setBusy(false);
    }
  };

  const removePlayer = async (userId: string) => {
    if (!openTeam) return;
    setBusy(true);
    try {
      const updated = await api.delete<Team>(`/teams/${openTeam.id}/members/${userId}/player`);
      refreshTeam(updated);
      toast("Player removed from roster");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to remove player", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminHead
        title="NRV Teams"
        sub="Toggle homepage visibility per team, and manage each roster directly."
      />
      <div className="nrv-grid-3">
        {teams.map((team) => (
          <Card key={team.id} pad={20}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-1 h-[26px]" style={{ background: team.color ?? "#7E82AC" }} />
              <div className="flex-1">
                <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
                  {team.name}
                </div>
                <div className="font-mono text-[9px] text-[#555] tracking-[2px]">
                  {team.tag} · {team.game}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0E0E0E] border border-white/[0.05] mb-3">
              <div
                onClick={() => toggleEnabled(team)}
                className="w-[30px] h-4 rounded-lg relative cursor-pointer flex-shrink-0"
                style={{
                  background: team.homepageEnabled ? "#22c55e" : "#262626",
                  border: `1px solid ${team.homepageEnabled ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <div
                  className="absolute top-[1px] w-3 h-3 rounded-full bg-white transition-all"
                  style={{ left: team.homepageEnabled ? 15 : 1 }}
                />
              </div>
              <span className="font-mono text-[10px] tracking-[1px]" style={{ color: team.homepageEnabled ? "#4ade80" : "#555" }}>
                {team.homepageEnabled ? "On homepage" : "Hidden"}
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#888BA0] mb-2.5">
              {(team.memberships?.filter((m) => m.slot === "player").length) ?? 0} active players
            </div>
            <Btn
              variant="ghost"
              style={{ padding: "6px 14px", width: "100%" }}
              onClick={() => {
                setOpen(team.id);
                setTagInput("");
                setNewPosition("");
                setPosEdits({});
              }}
            >
              Manage roster
            </Btn>
          </Card>
        ))}
        {teams.length === 0 && (
          <div className="font-mono text-[11px] text-[#444] uppercase tracking-[2px]">No NRV teams yet</div>
        )}
      </div>

      <Modal
        open={!!openTeam}
        onClose={() => setOpen(null)}
        title={`${openTeam?.name ?? ""} roster`}
        width={640}
        footer={
          <Btn variant="ghost" onClick={() => setOpen(null)}>
            Close
          </Btn>
        }
      >
        {openTeam && (
          <>
            <Card pad={0}>
              <Table
                cols={[
                  {
                    h: "Player",
                    render: (m: TeamMembership) => (
                      <div>
                        <div className="text-[#E6E6E6] font-display font-bold text-[13px] tracking-[1px] uppercase">
                          {m.user?.name ?? "—"}
                        </div>
                        <div className="text-[10px] text-[#555]">{m.user?.playerTag}</div>
                      </div>
                    ),
                  },
                  {
                    h: "Role",
                    render: (m: TeamMembership) =>
                      posEdits[m.userId] !== undefined ? (
                        <div className="flex gap-1.5 items-center">
                          <Select
                            value={posEdits[m.userId]}
                            onChange={(e) =>
                              setPosEdits((prev) => ({ ...prev, [m.userId]: e.target.value }))
                            }
                            options={roleOptions(m.position ?? undefined)}
                            style={{ width: 130, padding: "5px 8px", fontSize: 10 }}
                          />
                          <button
                            onClick={() => savePosition(m.userId)}
                            disabled={busy}
                            className="font-mono text-[9px] text-[#4ade80] cursor-pointer bg-transparent border-none"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => setPosEdits((prev) => ({ ...prev, [m.userId]: m.position ?? "" }))}
                          className="text-[#888BA0] text-[10px] tracking-[1px] uppercase cursor-pointer"
                        >
                          {m.position || "—"}
                        </span>
                      ),
                  },
                  {
                    h: "Status",
                    render: (m: TeamMembership) => (
                      <Pill color={m.teamRole === "captain" ? "#BFC2DE" : "#4ade80"}>
                        {m.teamRole === "captain" ? "captain" : "active"}
                      </Pill>
                    ),
                  },
                  {
                    h: "",
                    right: true,
                    render: (m: TeamMembership) => (
                      <button
                        onClick={() => removePlayer(m.userId)}
                        disabled={busy}
                        className="bg-transparent border border-[rgba(126,130,172,0.35)] text-[#888BA0] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
                      >
                        Remove
                      </button>
                    ),
                  },
                ]}
                rows={roster}
                keyFn={(m) => m.id}
              />
            </Card>

            <Card pad={18} style={{ marginTop: 14 }}>
              <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3">
                Add player by tag
              </div>
              <div className="nrv-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <Field label="Player tag" req>
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Name#1234" />
                </Field>
                {roles.length > 0 && (
                  <Field label="Role">
                    <Select
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      options={roleOptions()}
                    />
                  </Field>
                )}
                <div className="flex gap-2.5 items-end">
                  <Btn onClick={addPlayer} disabled={busy}>
                    Add
                  </Btn>
                </div>
              </div>
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
}
