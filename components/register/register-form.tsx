"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { regState, GAMES, GAME_ROLES } from "@/lib/derived";
import type { NrvEvent, Team, TeamMembership } from "@/lib/types";
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
  Empty,
  Spark,
  fmtD,
} from "@/components/ui/primitives";

const MIN_ROSTER_SIZE = 5;
const MAX_ROSTER_SIZE = 8;

export function RegisterForm({
  events,
  rulebookVersion,
  initialEventId,
}: {
  events: NrvEvent[];
  rulebookVersion: string;
  initialEventId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useAuth();

  const openEvents = events.filter((e) => ["open", "waitlist"].includes(regState(e, e.teams?.length ?? 0)));
  const [evId, setEvId] = useState(initialEventId || openEvents[0]?.id || "");
  const ev = events.find((e) => e.id === evId);

  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teamChecked, setTeamChecked] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", tag: "", game: GAMES[0], color: "#7E82AC" });
  const [contactEmail, setContactEmail] = useState("");
  const [acks, setAcks] = useState({ tos: false, rulebook: false, emailConsent: false });
  const [errs, setErrs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | "waitlist" | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [posEdit, setPosEdit] = useState<{ userId: string; position: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setTeamChecked(true);
        return;
      }
      try {
        const teams = await api.get<Team[]>("/teams", { auth: false });
        const mine = teams.find((t) =>
          t.memberships?.some((m) => m.userId === user.id && m.teamRole === "coach")
        );
        if (!cancelled) setMyTeam(mine ?? null);
      } catch {
        if (!cancelled) setMyTeam(null);
      } finally {
        if (!cancelled) setTeamChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const rs = ev ? regState(ev, ev.teams?.length ?? 0) : "closed";

  const createTeam = async () => {
    if (!newTeam.name.trim() || !/^[A-Z0-9]{2,5}$/.test(newTeam.tag)) {
      toast("Team name and a 2–5 char tag are required", "error");
      return;
    }
    setBusy(true);
    try {
      const team = await api.post<Team>("/teams", newTeam);
      setMyTeam(team);
      toast("Team created — you are its coach");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create team", "error");
    } finally {
      setBusy(false);
    }
  };

  const addMember = async () => {
    if (!myTeam) return;
    if (!tagInput.trim()) {
      toast("Enter a player tag", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<Team>(`/teams/${myTeam.id}/members`, { playerTag: tagInput.trim() });
      setMyTeam(updated);
      toast("Player added to roster");
      setTagInput("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add player", "error");
    } finally {
      setBusy(false);
    }
  };

  const updateMember = async (userId: string, data: { teamRole?: string; position?: string }) => {
    if (!myTeam) return;
    setBusy(true);
    try {
      const updated = await api.patch<Team>(`/teams/${myTeam.id}/members/${userId}`, data);
      setMyTeam(updated);
      toast("Roster updated");
      setPosEdit(null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update member", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!myTeam) return;
    setBusy(true);
    try {
      const updated = await api.delete<Team>(`/teams/${myTeam.id}/members/${userId}`);
      setMyTeam(updated);
      toast("Player removed from roster");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };

  const rosterSize = myTeam?.memberships?.length ?? 0;

  const submit = async () => {
    const e: string[] = [];
    if (!ev) e.push("Pick an event.");
    if (!myTeam) e.push("You need a team before registering.");
    if (myTeam && rosterSize < MIN_ROSTER_SIZE) {
      e.push(`Your roster needs at least ${MIN_ROSTER_SIZE} players to register (currently has ${rosterSize}).`);
    }
    if (myTeam && rosterSize > MAX_ROSTER_SIZE) {
      e.push(`Your roster exceeds the maximum of ${MAX_ROSTER_SIZE} players (currently has ${rosterSize}).`);
    }
    if (!contactEmail.trim()) e.push("Team contact email is required.");
    if (!acks.tos) e.push("The Terms of Service / Privacy Policy acknowledgment is required.");
    if (!acks.emailConsent) e.push("Email consent acknowledgment is required.");
    setErrs(e);
    if (e.length || !ev || !myTeam) return;

    setBusy(true);
    try {
      await api.post("/registrations", {
        eventId: ev.id,
        teamId: myTeam.id,
        contactEmail: contactEmail.trim(),
        acksTos: true,
        acksRulebookVersion: rulebookVersion,
        acksEmailConsent: true,
      });
      const status = rs === "waitlist" ? "waitlist" : "ok";
      setDone(status);
      toast(status === "waitlist" ? "Added to waitlist" : "Registration submitted");
      window.scrollTo(0, 0);
    } catch (e2) {
      toast(e2 instanceof ApiError ? e2.message : "Registration failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto" style={{ margin: "40px auto" }}>
        <PageHead
          kicker="Competition"
          title="Register a Team"
          sub="Log in first — registrations are tied to your account and the team you coach."
        />
        <Btn onClick={() => router.push("/login")}>Log in to continue</Btn>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-[560px] mx-auto text-center" style={{ margin: "40px auto" }}>
        <Spark size={22} />
        <h1 className="nrv-display text-[#E6E6E6]" style={{ fontSize: 34, margin: "18px 0 12px" }}>
          {done === "waitlist" ? "You're on the waitlist" : "Registration submitted"}
        </h1>
        <p className="font-mono text-[12px] text-[#888BA0] leading-[1.9] mb-7">
          {done === "waitlist"
            ? "The event is at capacity. Staff will reach out if a slot opens."
            : "NRV staff will review your registration."}
        </p>
        <Btn onClick={() => router.push(`/tournaments/${evId}`)}>View event</Btn>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto">
      <PageHead
        kicker="Competition"
        title="Register a Team"
        sub="Free entry. NRV staff review every registration."
      />
      {openEvents.length === 0 ? (
        <Card pad={28}>
          <Empty label="No events currently accepting registrations" />
        </Card>
      ) : (
        <div>
          <Field label="Event" req>
            <Select
              value={evId}
              onChange={(e) => setEvId(e.target.value)}
              options={openEvents.map((e) => ({
                value: e.id,
                label: `${e.name} — closes ${fmtD(e.regCloseDate)}`,
              }))}
            />
          </Field>
          {rs === "waitlist" && ev && (
            <div className="mt-2.5 font-mono text-[11px] text-[#FF6A39] leading-[1.7]">
              This event is at capacity ({ev.capacity} teams). You can still submit — you&apos;ll be
              placed on the waitlist.
            </div>
          )}

          <div
            className="font-display font-extrabold text-[15px] tracking-[3px] text-[#E6E6E6] uppercase flex items-center gap-2.5"
            style={{ margin: "40px 0 16px" }}
          >
            <Spark size={10} />
            Your team
          </div>
          {!teamChecked ? (
            <div className="font-mono text-[11px] text-[#555]">Checking your team…</div>
          ) : myTeam ? (
            <div>
              <Card pad={18} className="mb-4" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-1 h-6" style={{ background: myTeam.color ?? "#7E82AC" }} />
                  <div>
                    <div className="font-display font-bold text-[15px] text-[#E6E6E6] uppercase">
                      {myTeam.name}
                    </div>
                    <div className="font-mono text-[10px] text-[#555] mt-1">
                      {myTeam.tag} · {myTeam.game}
                    </div>
                  </div>
                  <Pill
                    color={
                      rosterSize < MIN_ROSTER_SIZE
                        ? "#f87171"
                        : rosterSize > MAX_ROSTER_SIZE
                        ? "#f87171"
                        : "#4ade80"
                    }
                  >
                    {rosterSize}/{MAX_ROSTER_SIZE} roster
                  </Pill>
                </div>
              </Card>

              {rosterSize < MIN_ROSTER_SIZE && (
                <div className="font-mono text-[11px] text-[#FF6A39] leading-[1.7] mb-4" style={{ marginBottom: 16 }}>
                  Add at least {MIN_ROSTER_SIZE - rosterSize} more player
                  {MIN_ROSTER_SIZE - rosterSize === 1 ? "" : "s"} before you can submit this registration.
                </div>
              )}

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
                        posEdit?.userId === m.userId ? (
                          <div className="flex gap-1.5 items-center">
                            <Select
                              value={posEdit.position}
                              onChange={(e) => setPosEdit({ userId: m.userId, position: e.target.value })}
                              options={["", ...(GAME_ROLES[myTeam.game] ?? [])]}
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
                            onClick={() => setPosEdit({ userId: m.userId, position: m.position ?? "" })}
                            className="text-[#888BA0] text-[10px] tracking-[1px] uppercase cursor-pointer"
                          >
                            {m.position || "—"}
                          </span>
                        ),
                    },
                    {
                      h: "Role",
                      render: (m: TeamMembership) => (
                        <Select
                          value={m.teamRole}
                          onChange={(e) => updateMember(m.userId, { teamRole: e.target.value })}
                          options={["coach", "captain", "member"]}
                          style={{ width: 110, padding: "5px 8px", fontSize: 10 }}
                        />
                      ),
                    },
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
                  ]}
                  rows={myTeam.memberships ?? []}
                  keyFn={(m) => m.id}
                />
              </Card>

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
            </div>
          ) : (
            <Card pad={20}>
              <div className="font-mono text-[10px] text-[#555] leading-[1.7] mb-4">
                You don&apos;t coach a team yet. Create one to register — you become its coach.
              </div>
              <div className="nrv-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <Field label="Team name" req>
                  <Input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
                </Field>
                <Field label="Tag (2–5 chars)" req>
                  <Input
                    value={newTeam.tag}
                    maxLength={5}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })
                    }
                    style={{ letterSpacing: 3 }}
                  />
                </Field>
                <Field label="Game">
                  <Select
                    value={newTeam.game}
                    onChange={(e) => setNewTeam({ ...newTeam, game: e.target.value })}
                    options={GAMES}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Btn onClick={createTeam} disabled={busy}>
                  Create team
                </Btn>
              </div>
            </Card>
          )}

          <div
            className="font-display font-extrabold text-[15px] tracking-[3px] text-[#E6E6E6] uppercase flex items-center gap-2.5"
            style={{ margin: "40px 0 16px" }}
          >
            <Spark size={10} />
            Contact
          </div>
          <Field label="Team contact email" req>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="team@example.com"
            />
          </Field>

          <div
            className="font-display font-extrabold text-[15px] tracking-[3px] text-[#E6E6E6] uppercase flex items-center gap-2.5"
            style={{ margin: "40px 0 16px" }}
          >
            <Spark size={10} />
            Acknowledgements
          </div>
          <label className="flex gap-3 items-start font-mono text-[11px] text-[#9a9db5] leading-[1.7] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acks.tos}
              onChange={(e) => setAcks((a) => ({ ...a, tos: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              I agree to the NRV Privacy Policy and Terms of Service, and confirm I am authorized
              to submit this registration.
              <span className="text-[#FF6A39]"> *</span>
            </span>
          </label>
          <label className="flex gap-3 items-start font-mono text-[11px] text-[#9a9db5] leading-[1.7] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acks.rulebook}
              onChange={(e) => setAcks((a) => ({ ...a, rulebook: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              I have read and accept the current rulebook (v{rulebookVersion}).
            </span>
          </label>
          <label className="flex gap-3 items-start font-mono text-[11px] text-[#9a9db5] leading-[1.7] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acks.emailConsent}
              onChange={(e) => setAcks((a) => ({ ...a, emailConsent: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              Email this team updates about NRV events and results.
              <span className="text-[#FF6A39]"> *</span>
            </span>
          </label>

          {errs.length > 0 && (
            <div className="border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.06)] p-4 my-5">
              {errs.map((e, i) => (
                <div key={i} className="font-mono text-[11px] text-[#f87171] leading-[1.8]">
                  · {e}
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 flex items-center gap-4 flex-wrap">
            <Btn
              onClick={submit}
              disabled={busy || rs === "closed" || !myTeam || rosterSize < MIN_ROSTER_SIZE || rosterSize > MAX_ROSTER_SIZE}
              style={{ padding: "13px 32px" }}
            >
              {rs === "closed" ? "Registration closed" : rs === "waitlist" ? "Join waitlist" : "Submit registration"}
            </Btn>
            {rs !== "closed" && ev && (
              <span className="font-mono text-[10px] text-[#555]">closes {fmtD(ev.regCloseDate)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
