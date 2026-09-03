"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { GAME_ROLES } from "@/lib/derived";
import type { MembershipSlot, Team, TeamMembership } from "@/lib/types";
import { AccessDenied } from "@/components/access-denied";
import {
  PageHead,
  SectionLabel,
  Card,
  Table,
  Pill,
  Field,
  Input,
  Select,
  Btn,
  ConfirmModal,
} from "@/components/ui/primitives";

// Substitute isn't a stored field — it's purely a display grouping, same
// as on the register page: the first MIN_ROSTER_SIZE player-slot rows are
// "Players," anything after that (up to MAX_SUBS) is "Substitutes."
const MIN_ROSTER_SIZE = 5;
const MAX_SUBS = 2;

export default function TeamManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [staffTagInput, setStaffTagInput] = useState("");
  const [staffRoleInput, setStaffRoleInput] = useState("coach");
  const [playerTagInput, setPlayerTagInput] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [posEdits, setPosEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState<{ slot: MembershipSlot } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }
      try {
        const teams = await api.get<Team[]>("/teams", { auth: false });
        const mine = teams.filter((t) => t.memberships?.some((m) => m.userId === user.id));
        if (!cancelled) {
          setMyTeams(mine);
          setActiveTeamId((prev) => prev ?? mine[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) setMyTeams([]);
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !checked) return null;

  if (!user) {
    return <AccessDenied need="Log in with an account that holds a team membership (coach, captain, or member) to manage a roster." />;
  }

  if (myTeams.length === 0) {
    return (
      <AccessDenied need="This account has no team membership. Register a team, or ask a coach to add you by your player tag." />
    );
  }

  const team = myTeams.find((t) => t.id === activeTeamId) ?? myTeams[0];

  const refreshTeam = (updated: Team) => {
    setMyTeams((teams) => teams.map((t) => (t.id === updated.id ? updated : t)));
  };

  const roster = team.memberships ?? [];
  const staffRows = roster.filter((m) => m.slot === "staff");
  const allPlayerRows = roster.filter((m) => m.slot === "player");
  const playerRows = allPlayerRows.slice(0, MIN_ROSTER_SIZE);
  const subRows = allPlayerRows.slice(MIN_ROSTER_SIZE, MIN_ROSTER_SIZE + MAX_SUBS);

  const nextAddIsSub = allPlayerRows.length >= MIN_ROSTER_SIZE;
  const rosterFull = allPlayerRows.length >= MIN_ROSTER_SIZE + MAX_SUBS;
  // A person can hold both rows (a coach who also plays) — coach status
  // is defined by the staff row specifically, not by any row.
  const myCoachMembership = staffRows.find((m) => m.userId === user.id && m.teamRole === "coach");
  const isCoach = !!myCoachMembership;
  const myPlayerMembership = allPlayerRows.find((m) => m.userId === user.id);
  const myStaffMembership = staffRows.find((m) => m.userId === user.id);

  const roles = GAME_ROLES[team.game] || [];
  const takenRoles = new Set(allPlayerRows.map((m) => m.position).filter((p): p is string => !!p));
  const roleOptions = (excludeCurrent?: string) => [
    "",
    ...roles.map((r) => ({ value: r, label: r, disabled: r !== excludeCurrent && takenRoles.has(r) })),
  ];

  const addStaff = async () => {
    if (!staffTagInput.trim()) {
      toast("Enter a player tag", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<Team>(`/teams/${team.id}/members`, {
        playerTag: staffTagInput.trim(),
        slot: "staff",
        teamRole: staffRoleInput,
      });
      refreshTeam(updated);
      toast("Staff member added");
      setStaffTagInput("");
      setStaffRoleInput("coach");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add staff member", "error");
    } finally {
      setBusy(false);
    }
  };

  const addPlayer = async () => {
    if (!playerTagInput.trim()) {
      toast("Enter a player tag", "error");
      return;
    }
    if (rosterFull) {
      toast(`Roster is full (${MIN_ROSTER_SIZE} players + ${MAX_SUBS} substitutes)`, "error");
      return;
    }
    if (roles.length > 0 && !newPosition && !nextAddIsSub) {
      toast("Choose a role for this player before adding", "error");
      return;
    }
    if (newPosition && takenRoles.has(newPosition)) {
      toast(`${newPosition} is already taken by another player on this roster`, "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<Team>(`/teams/${team.id}/members`, {
        playerTag: playerTagInput.trim(),
        slot: "player",
      });
      const newMember = updated.memberships?.find(
        (m) => m.slot === "player" && m.user?.playerTag?.toLowerCase() === playerTagInput.trim().toLowerCase()
      );
      const final =
        newMember && newPosition
          ? await api.patch<Team>(`/teams/${team.id}/members/${newMember.userId}/player`, {
              position: newPosition,
            })
          : updated;
      refreshTeam(final);
      toast("Player added to roster");
      setPlayerTagInput("");
      setNewPosition("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add player", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (userId: string, slot: MembershipSlot, teamRole: string) => {
    setBusy(true);
    try {
      const updated = await api.patch<Team>(`/teams/${team.id}/members/${userId}/${slot}`, { teamRole });
      refreshTeam(updated);
      toast("Role updated");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update role", "error");
    } finally {
      setBusy(false);
    }
  };

  const savePositions = async () => {
    const edits = Object.entries(posEdits);
    if (edits.length === 0) return;
    setBusy(true);
    try {
      let updated = team;
      for (const [userId, position] of edits) {
        updated = await api.patch<Team>(`/teams/${team.id}/members/${userId}/player`, { position });
      }
      refreshTeam(updated);
      toast("Roster positions saved");
      setPosEdits({});
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save positions", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string, slot: MembershipSlot) => {
    setBusy(true);
    try {
      const updated = await api.delete<Team>(`/teams/${team.id}/members/${userId}/${slot}`);
      refreshTeam(updated);
      toast(slot === "staff" ? "Staff member removed" : "Player removed from roster");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };

  const leaveTeam = async () => {
    if (!user || !confirmLeave) return;
    setBusy(true);
    try {
      await api.delete(`/teams/${team.id}/members/${user.id}/${confirmLeave.slot}`);
      const stillOnTeam =
        confirmLeave.slot === "staff" ? !!myPlayerMembership : !!myStaffMembership;
      if (!stillOnTeam) {
        const remaining = myTeams.filter((t) => t.id !== team.id);
        setMyTeams(remaining);
        setActiveTeamId(remaining[0]?.id ?? null);
        if (remaining.length === 0) router.push("/dashboard");
      } else {
        const updated = await api.get<Team>(`/teams/${team.id}`, { auth: false });
        refreshTeam(updated);
      }
      toast("You left the team");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to leave team", "error");
    } finally {
      setBusy(false);
      setConfirmLeave(null);
    }
  };

  const hasPendingEdits = Object.keys(posEdits).length > 0;

  const playerCols = [
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
      h: "Position",
      render: (m: TeamMembership) =>
        isCoach ? (
          <Select
            value={posEdits[m.userId] ?? m.position ?? ""}
            onChange={(e) => setPosEdits((prev) => ({ ...prev, [m.userId]: e.target.value }))}
            options={roleOptions(m.position ?? undefined)}
            style={{ width: 140, padding: "5px 8px", fontSize: 10 }}
          />
        ) : (
          <span className="text-[#888BA0] text-[10px] tracking-[1px] uppercase">
            {m.position || "—"}
          </span>
        ),
    },
    {
      h: "Role",
      render: (m: TeamMembership) =>
        isCoach ? (
          <Select
            value={m.teamRole}
            onChange={(e) => updateRole(m.userId, "player", e.target.value)}
            options={["captain", "member"]}
            style={{ width: 110, padding: "5px 8px", fontSize: 10 }}
          />
        ) : (
          <Pill color={m.teamRole === "captain" ? "#BFC2DE" : "#555"}>{m.teamRole}</Pill>
        ),
    },
    {
      h: "",
      right: true,
      render: (m: TeamMembership) =>
        isCoach ? (
          <button
            onClick={() => removeMember(m.userId, "player")}
            disabled={busy}
            className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
          >
            Remove
          </button>
        ) : m.userId === user.id ? (
          <button
            onClick={() => setConfirmLeave({ slot: "player" })}
            disabled={busy}
            className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
          >
            Leave
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      {myTeams.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5" style={{ marginBottom: 20 }}>
          {myTeams.map((t) => {
            const active = t.id === team.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTeamId(t.id)}
                className="font-mono text-[11px] tracking-[1px] px-3.5 py-1.5 cursor-pointer uppercase"
                style={{
                  background: active ? "#23253A" : "transparent",
                  border: `1px solid ${active ? "#7E82AC" : "rgba(126,130,172,0.3)"}`,
                  color: active ? "#E6E6E6" : "#888BA0",
                }}
              >
                {t.game}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3.5 flex-wrap mb-2">
        <Pill color="#BFC2DE">Team management</Pill>
        {myStaffMembership && (
          <Pill color="#888BA0">{myStaffMembership.teamRole.replace("_", " ")}</Pill>
        )}
        {myPlayerMembership && (
          <Pill color="#888BA0">{myPlayerMembership.teamRole.replace("_", " ")}</Pill>
        )}
      </div>
      <PageHead
        title={team.name}
        sub={
          isCoach
            ? "As coach, you can add staff and players by tag, edit roles and positions, and remove members. A coach who also plays appears in both lists."
            : "You are viewing this roster. Only the coach can make changes."
        }
      />

      <SectionLabel>Staff</SectionLabel>
      <Card pad={0}>
        <Table
          cols={[
            {
              h: "Name",
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
                isCoach ? (
                  <Select
                    value={m.teamRole}
                    onChange={(e) => updateRole(m.userId, "staff", e.target.value)}
                    options={["coach", "assistant_coach"]}
                    style={{ width: 150, padding: "5px 8px", fontSize: 10 }}
                  />
                ) : (
                  <Pill color="#4ade80">{m.teamRole.replace("_", " ")}</Pill>
                ),
            },
            {
              h: "",
              right: true,
              render: (m: TeamMembership) =>
                isCoach && m.teamRole !== "coach" ? (
                  <button
                    onClick={() => removeMember(m.userId, "staff")}
                    disabled={busy}
                    className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
                  >
                    Remove
                  </button>
                ) : m.userId === user.id ? (
                  <button
                    onClick={() => setConfirmLeave({ slot: "staff" })}
                    disabled={busy}
                    className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
                  >
                    Leave
                  </button>
                ) : null,
            },
          ]}
          rows={staffRows}
          keyFn={(m) => m.id}
        />
      </Card>
      {isCoach && (
        <Card pad={18} className="mt-3.5" style={{ marginTop: 14 }}>
          <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3.5">
            Add staff by tag
          </div>
          <div className="flex gap-2.5 flex-wrap items-end">
            <Field label="Player tag" req className="flex-[2_1_180px]">
              <Input
                value={staffTagInput}
                onChange={(e) => setStaffTagInput(e.target.value)}
                placeholder="Name#1234"
              />
            </Field>
            <Field label="Role" className="flex-[1_1_150px]">
              <Select
                value={staffRoleInput}
                onChange={(e) => setStaffRoleInput(e.target.value)}
                options={["coach", "assistant_coach"]}
              />
            </Field>
            <Btn onClick={addStaff} disabled={busy}>
              Add
            </Btn>
          </div>
          <div className="font-mono text-[10px] text-[#444] leading-[1.7] mt-3.5">
            Adding a new coach hands off the coach role — the previous coach becomes assistant
            coach automatically.
          </div>
        </Card>
      )}

      <div style={{ marginTop: 40 }}>
        <SectionLabel>Players</SectionLabel>
      </div>
      <Card pad={0}>
        <Table cols={playerCols} rows={playerRows} keyFn={(m) => m.id} />
      </Card>

      <div style={{ marginTop: 40 }}>
        <SectionLabel>Substitutes</SectionLabel>
      </div>
      <Card pad={0}>
        <Table cols={playerCols} rows={subRows} keyFn={(m) => m.id} />
      </Card>

      {isCoach && hasPendingEdits && (
        <div className="mt-3.5 flex items-center gap-3" style={{ marginTop: 14 }}>
          <Btn onClick={savePositions} disabled={busy}>
            Save changes
          </Btn>
          <span className="font-mono text-[10px] text-[#fbbf24] tracking-[1px] uppercase">
            Unsaved position changes
          </span>
        </div>
      )}

      {isCoach && (
        <Card pad={18} className="mt-3.5" style={{ marginTop: 14 }}>
          <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3.5">
            Add {nextAddIsSub ? "substitute" : "player"} by tag
          </div>
          {rosterFull ? (
            <div className="font-mono text-[11px] text-[#fbbf24] leading-[1.7]">
              Roster is full ({MIN_ROSTER_SIZE} players + {MAX_SUBS} substitutes). Remove someone
              before adding another.
            </div>
          ) : (
            <>
              <div className="flex gap-2.5 flex-wrap items-end">
                <Field label="Player tag" req className="flex-[2_1_180px]">
                  <Input
                    value={playerTagInput}
                    onChange={(e) => setPlayerTagInput(e.target.value)}
                    placeholder="Name#1234"
                  />
                </Field>
                {roles.length > 0 && (
                  <Field label="Role" req={!nextAddIsSub} className="flex-[1_1_140px]">
                    <Select
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      options={roleOptions()}
                    />
                  </Field>
                )}
                <Btn onClick={addPlayer} disabled={busy}>
                  Add
                </Btn>
              </div>
              <div className="font-mono text-[10px] text-[#444] leading-[1.7] mt-3.5">
                The player must already have an NRV account. A coach can also be added here as a
                player — the two roles are independent. The first {MIN_ROSTER_SIZE} players added
                are the starting roster and require a role; the next {MAX_SUBS} become
                substitutes, whose role is optional.
                {nextAddIsSub && (
                  <span className="text-[#fbbf24]"> This add will be a substitute.</span>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      <Card pad={18} className="mt-3.5" style={{ marginTop: 14 }}>
        <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-2.5">Scope</div>
        <div className="font-mono text-[11px] text-[#888BA0] leading-[1.8]">
          This view manages <span className="text-[#E6E6E6]">{team.name}</span> only. It is
          separate from the NRV staff portal and grants no site-wide permissions.
        </div>
      </Card>

      <ConfirmModal
        open={!!confirmLeave}
        title="Leave this team?"
        confirmLabel="Leave team"
        body={
          <span>
            You&apos;ll be removed from <span className="text-[#E6E6E6]">{team.name}</span>&apos;s{" "}
            {confirmLeave?.slot === "staff" ? "staff" : "player"} roster immediately. You can
            rejoin later only if a coach adds you back by your player tag.
          </span>
        }
        onCancel={() => setConfirmLeave(null)}
        onConfirm={leaveTeam}
      />
    </div>
  );
}
