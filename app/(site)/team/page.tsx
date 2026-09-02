"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { GAME_ROLES } from "@/lib/derived";
import type { Team, TeamMembership } from "@/lib/types";
import { AccessDenied } from "@/components/access-denied";
import { PageShell } from "@/components/nav";
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
} from "@/components/ui/primitives";

export default function TeamManagementPage() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [checked, setChecked] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [posEdit, setPosEdit] = useState<{ userId: string; position: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }
      try {
        const teams = await api.get<Team[]>("/teams", { auth: false });
        const mine = teams.find((t) => t.memberships?.some((m) => m.userId === user.id));
        if (!cancelled) setTeam(mine ?? null);
      } catch {
        if (!cancelled) setTeam(null);
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
    return (
      <PageShell>
        <AccessDenied need="Log in with an account that holds a team membership (coach, captain, or member) to manage a roster." />
      </PageShell>
    );
  }

  if (!team) {
    return (
      <PageShell>
        <AccessDenied need="This account has no team membership. Register a team, or ask a coach to add you by your player tag." />
      </PageShell>
    );
  }

  const myMembership = team.memberships?.find((m) => m.userId === user.id);
  const isCoach = myMembership?.teamRole === "coach";
  const roles = GAME_ROLES[team.game] || [];

  const addMember = async () => {
    if (!tagInput.trim()) {
      toast("Enter a player tag", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<Team>(`/teams/${team.id}/members`, { playerTag: tagInput.trim() });
      setTeam(updated);
      toast("Player added to roster");
      setTagInput("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add player", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateMember = async (userId: string, data: { teamRole?: string; position?: string }) => {
    setBusy(true);
    try {
      const updated = await api.patch<Team>(`/teams/${team.id}/members/${userId}`, data);
      setTeam(updated);
      toast("Roster updated");
      setPosEdit(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update member", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string) => {
    setBusy(true);
    try {
      const updated = await api.delete<Team>(`/teams/${team.id}/members/${userId}`);
      setTeam(updated);
      toast("Player removed from roster");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };

  const roster = team.memberships ?? [];

  return (
    <PageShell>
      <div className="flex items-center gap-3.5 flex-wrap mb-2">
        <Pill color="#BFC2DE">Team management</Pill>
        <Pill color="#888BA0">{myMembership?.teamRole.replace("_", " ")}</Pill>
      </div>
      <PageHead
        title={team.name}
        sub={
          isCoach
            ? "As coach, you can add players by tag, edit roles and positions, and remove members."
            : "You are viewing this roster. Only the coach can make changes."
        }
      />
      <SectionLabel>Roster</SectionLabel>
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
              h: "Position",
              render: (m: TeamMembership) =>
                isCoach && posEdit?.userId === m.userId ? (
                  <div className="flex gap-1.5 items-center">
                    <Select
                      value={posEdit.position}
                      onChange={(e) => setPosEdit({ userId: m.userId, position: e.target.value })}
                      options={["", ...roles]}
                      style={{ width: 140, padding: "5px 8px", fontSize: 10 }}
                    />
                    <button
                      onClick={() => updateMember(m.userId, { position: posEdit.position })}
                      className="font-mono text-[9px] text-[#4ade80] cursor-pointer bg-transparent border-none"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => isCoach && setPosEdit({ userId: m.userId, position: m.position ?? "" })}
                    className="text-[#888BA0] text-[10px] tracking-[1px] uppercase"
                    style={{ cursor: isCoach ? "pointer" : "default" }}
                  >
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
                    onChange={(e) => updateMember(m.userId, { teamRole: e.target.value })}
                    options={["coach", "captain", "member"]}
                    style={{ width: 110, padding: "5px 8px", fontSize: 10 }}
                  />
                ) : (
                  <Pill color={m.teamRole === "coach" ? "#4ade80" : m.teamRole === "captain" ? "#BFC2DE" : "#555"}>
                    {m.teamRole}
                  </Pill>
                ),
            },
            ...(isCoach
              ? [
                  {
                    h: "",
                    right: true,
                    render: (m: TeamMembership) => (
                      <button
                        onClick={() => removeMember(m.userId)}
                        disabled={busy}
                        className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
                      >
                        Remove
                      </button>
                    ),
                  },
                ]
              : []),
          ]}
          rows={roster}
          keyFn={(m) => m.id}
        />
      </Card>

      {isCoach && (
        <Card pad={18} className="mt-3.5" style={{ marginTop: 14 }}>
          <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3.5">
            Add player by tag
          </div>
          <div className="flex gap-2.5 flex-wrap items-end">
            <Field label="Player tag" className="flex-[2_1_180px]">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Name#1234"
              />
            </Field>
            <Btn onClick={addMember} disabled={busy}>
              Add
            </Btn>
          </div>
          <div className="font-mono text-[10px] text-[#444] leading-[1.7] mt-3.5">
            The player must already have an NRV account and not already belong to a team.
          </div>
        </Card>
      )}

      <Card pad={18} className="mt-3.5" style={{ marginTop: 14 }}>
        <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-2.5">Scope</div>
        <div className="font-mono text-[11px] text-[#888BA0] leading-[1.8]">
          This view manages <span className="text-[#E6E6E6]">{team.name}</span> only. It is
          separate from the NRV staff portal and grants no site-wide permissions.
        </div>
      </Card>
    </PageShell>
  );
}
