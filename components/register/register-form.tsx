"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { regState, GAMES, GAME_ROLES } from "@/lib/derived";
import type { MembershipSlot, NrvEvent, Team, TeamMembership } from "@/lib/types";
import {
  PageHead,
  Card,
  Pill,
  Field,
  Input,
  Select,
  Btn,
  Empty,
  Spark,
  fmtD,
  ConfirmModal,
} from "@/components/ui/primitives";

const MIN_ROSTER_SIZE = 5;
const MAX_ROSTER_SIZE = 8;
const MAX_SUBS = 2;

interface PendingMember {
  localId: string;
  tag: string;
  name: string;
  slot: MembershipSlot;
  teamRole: string;
  position?: string;
}

function toDisplayMember(p: PendingMember): TeamMembership {
  return {
    id: p.localId,
    userId: p.localId,
    teamId: "",
    slot: p.slot,
    teamRole: p.teamRole as TeamMembership["teamRole"],
    position: p.position ?? null,
    user: {
      id: p.localId,
      email: "",
      name: p.name,
      playerTag: p.tag,
      role: "user",
      mfaEnabled: false,
    },
  };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-display font-extrabold text-[15px] tracking-[3px] text-[#E6E6E6] uppercase flex items-center gap-2.5"
      style={{ margin: "40px 0 16px" }}
    >
      <Spark size={10} />
      {children}
    </div>
  );
}


function RosterRow({
  member,
  captainable,
  isCaptain,
  roles,
  takenRoles,
  roleRequired = true,
  onAdd,
  onRemove,
  onSetCaptain,
  onSetPosition,
  busy,
}: {
  member?: TeamMembership;
  captainable?: boolean;
  isCaptain?: boolean;
  roles?: string[];
  takenRoles?: Set<string>;
  /** Substitutes may have an unknown role until they're subbed in. */
  roleRequired?: boolean;
  onAdd: (tag: string, position?: string, captain?: boolean) => void;
  onRemove?: () => void;
  onSetCaptain?: (checked: boolean) => void;
  onSetPosition?: (position: string) => void;
  busy: boolean;
}) {
  const toast = useToast();
  const [tag, setTag] = useState("");
  const [draftPosition, setDraftPosition] = useState("");
  const [draftCaptain, setDraftCaptain] = useState(false);
  const hasRoles = !!roles && roles.length > 0;
  const currentValue = member ? member.position ?? "" : draftPosition;
  const roleOptions = [
    { value: "", label: "" },
    ...(roles ?? []).map((r) => ({
      value: r,
      label: r,
      disabled: r !== currentValue && !!takenRoles?.has(r),
    })),
  ];

  return (
    <div className="flex gap-3 mb-2.5 items-end flex-wrap">
      <Field label="Player tag" req style={{ flex: "2 1 160px" }}>
        {member ? (
          <div className="font-mono text-[12px] text-[#BFC2DE] py-2.5">
            {member.user?.name ?? member.user?.playerTag}{" "}
            <span className="text-[#555]">({member.user?.playerTag})</span>
          </div>
        ) : (
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Name#1234" />
        )}
      </Field>
      {hasRoles && (
        <Field label="Role" req={!member && roleRequired} style={{ flex: "1 1 130px" }}>
          <Select
            value={currentValue}
            onChange={(e) =>
              member ? onSetPosition?.(e.target.value) : setDraftPosition(e.target.value)
            }
            options={roleOptions}
          />
        </Field>
      )}
      {captainable && (
        <label
          className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] uppercase cursor-pointer"
          style={{ color: (member ? isCaptain : draftCaptain) ? "#E6E6E6" : "#888BA0", paddingBottom: 10 }}
        >
          <input
            type="checkbox"
            checked={member ? !!isCaptain : draftCaptain}
            onChange={(e) =>
              member ? onSetCaptain?.(e.target.checked) : setDraftCaptain(e.target.checked)
            }
          />{" "}
          Captain
        </label>
      )}
      {!member && (
        <Btn
          variant="ghost"
          style={{ padding: "9px 16px" }}
          disabled={busy}
          onClick={() => {
            if (!tag.trim()) {
              toast("Enter a player tag", "error");
              return;
            }
            if (hasRoles && roleRequired && !draftPosition) {
              toast("Choose a role for this player before adding", "error");
              return;
            }
            onAdd(tag.trim(), draftPosition || undefined, draftCaptain);
            setTag("");
            setDraftPosition("");
            setDraftCaptain(false);
          }}
        >
          Add
        </Btn>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="bg-transparent border-none text-[#555] hover:text-[#f87171] cursor-pointer font-mono text-[14px] px-1"
          style={{ paddingBottom: 10 }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function StaffRow({
  member,
  onAdd,
  onSetRole,
  onRemove,
  busy,
}: {
  member?: TeamMembership;
  onAdd: (tag: string, role: string) => void;
  onSetRole: (role: string) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const [tag, setTag] = useState("");
  const [role, setRole] = useState("coach");

  return (
    <div className="flex gap-3 mb-2.5 items-end flex-wrap">
      <Field label="Player tag" style={{ flex: "2 1 160px" }}>
        {member ? (
          <div className="font-mono text-[12px] text-[#BFC2DE] py-2.5">
            {member.user?.name ?? member.user?.playerTag}{" "}
            <span className="text-[#555]">({member.user?.playerTag})</span>
          </div>
        ) : (
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Name#1234" />
        )}
      </Field>
      <Field label="Role" style={{ flex: "1 1 140px" }}>
        <Select
          value={member ? member.teamRole : role}
          onChange={(e) => {
            if (member) onSetRole(e.target.value);
            else setRole(e.target.value);
          }}
          options={[
            { value: "coach", label: "Coach" },
            { value: "assistant_coach", label: "Assistant Coach" },
          ]}
        />
      </Field>
      {!member && (
        <Btn
          variant="ghost"
          style={{ padding: "9px 16px" }}
          disabled={busy}
          onClick={() => {
            if (!tag.trim()) return;
            onAdd(tag.trim(), role);
            setTag("");
          }}
        >
          Add
        </Btn>
      )}
      <button
        onClick={onRemove}
        className="bg-transparent border-none text-[#555] cursor-pointer font-mono text-[14px] px-1"
      >
        ✕
      </button>
    </div>
  );
}

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
  const [existingTeam, setExistingTeam] = useState<Team | null>(null);
  const [teamChecked, setTeamChecked] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", tag: "", color: "#7E82AC" });
  const [contactEmail, setContactEmail] = useState("");
  const [acks, setAcks] = useState({ tos: false, rulebook: false, emailConsent: false });
  const [errs, setErrs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | "waitlist" | null>(null);
  const [subSlots, setSubSlots] = useState(0);
  const [confirmCreateTeam, setConfirmCreateTeam] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const pendingSeq = useRef(0);
  const nextLocalId = () => `pending-${Date.now()}-${pendingSeq.current++}`;

  // Reset the active team selection whenever the event (and thus game)
  // changes, so a team picked for one game never carries into another.
  const [lastEvId, setLastEvId] = useState(evId);
  if (evId !== lastEvId) {
    setLastEvId(evId);
    setMyTeam(null);
    setPendingMembers([]);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || !ev) {
        if (!cancelled) setTeamChecked(true);
        return;
      }
      try {
        const teams = await api.get<Team[]>("/teams", { auth: false });
        const mine = teams.find(
          (t) =>
            t.game === ev.game &&
            t.memberships?.some((m) => m.userId === user.id && m.teamRole === "coach")
        );
        if (!cancelled) setExistingTeam(mine ?? null);
      } catch {
        if (!cancelled) setExistingTeam(null);
      } finally {
        if (!cancelled) setTeamChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ev]);


  const rs = ev ? regState(ev, ev.teams?.length ?? 0) : "closed";

  const requestCreateTeam = () => {
    if (!newTeam.name.trim() || !/^[A-Z0-9]{2,5}$/.test(newTeam.tag)) {
      toast("Team name and a 2–5 char tag are required", "error");
      return;
    }
    if (!ev) return;
    setConfirmCreateTeam(true);
  };

  const createTeam = async () => {
    if (!ev) return;
    setBusy(true);
    try {
      const team = await api.post<Team>("/teams", { ...newTeam, game: ev.game });
      setMyTeam(team);
      toast("Team created — you are its coach");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create team", "error");
    } finally {
      setBusy(false);
      setConfirmCreateTeam(false);
    }
  };


  const lookupPlayerName = async (playerTag: string): Promise<string | null> => {
    try {
      const found = await api.get<{ name: string }>(`/users/by-tag/${encodeURIComponent(playerTag)}`);
      return found.name;
    } catch {
      return null;
    }
  };

  const addMember = async (playerTag: string, position?: string, captain?: boolean) => {
    const name = await lookupPlayerName(playerTag);
    if (!name) {
      toast("No user found with that player tag", "error");
      return;
    }
    setPendingMembers((list) => [
      ...list,
      {
        localId: nextLocalId(),
        tag: playerTag,
        name,
        slot: "player",
        teamRole: captain ? "captain" : "member",
        position,
      },
    ]);
    toast("Player added to draft roster");
  };

  const addStaffMember = async (playerTag: string, role: string) => {
    const name = await lookupPlayerName(playerTag);
    if (!name) {
      toast("No user found with that player tag", "error");
      return;
    }
    setPendingMembers((list) => [
      ...list,
      { localId: nextLocalId(), tag: playerTag, name, slot: "staff", teamRole: role },
    ]);
    toast("Staff added to draft roster");
  };

  const isPendingId = (id: string) => id.startsWith("pending-");

  // Real members are edited immediately via the API (they already exist
  // regardless of this registration); pending ones are edited in place
  // in local state since they haven't been created yet.
  const updateMember = async (
    userId: string,
    slot: MembershipSlot,
    data: { teamRole?: string; position?: string },
  ) => {
    if (isPendingId(userId)) {
      setPendingMembers((list) =>
        list.map((p) => (p.localId === userId ? { ...p, ...data } : p))
      );
      return;
    }
    if (!myTeam) return;
    setBusy(true);
    try {
      const updated = await api.patch<Team>(`/teams/${myTeam.id}/members/${userId}/${slot}`, data);
      setMyTeam(updated);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update member", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string, slot: MembershipSlot) => {
    if (isPendingId(userId)) {
      setPendingMembers((list) => list.filter((p) => p.localId !== userId));
      return;
    }
    if (!myTeam) return;
    setBusy(true);
    try {
      const updated = await api.delete<Team>(`/teams/${myTeam.id}/members/${userId}/${slot}`);
      setMyTeam(updated);
      toast("Removed from roster");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to remove member", "error");
    } finally {
      setBusy(false);
    }
  };

  const realRoster = myTeam?.memberships ?? [];
  const pendingDisplay = pendingMembers.map(toDisplayMember);
  const roster = [...realRoster, ...pendingDisplay];
  const staffMembers = roster.filter((m) => m.slot === "staff");
  const nonStaffMembers = roster.filter((m) => m.slot === "player");
  const takenRoles = new Set(
    nonStaffMembers.map((m) => m.position).filter((p): p is string => !!p)
  );
  const rosterSize = nonStaffMembers.length;
  const captainMember = roster.find((m) => m.teamRole === "captain");

  const setPlayerCaptain = (member: TeamMembership | undefined, checked: boolean) => {
    if (!member) return;
    updateMember(member.userId, "player", { teamRole: checked ? "captain" : "member" });
  };

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
    if (!acks.rulebook) e.push("The rulebook acknowledgment is required.");
    setErrs(e);
    if (e.length || !ev || !myTeam) return;

    setBusy(true);
    try {
      // Flush every draft player/staff row to the real roster first, one
      // at a time so a mid-batch failure leaves a clear, resumable state:
      // rows that succeeded are gone from the draft (they're real now),
      // and everything from the failure point on stays pending for retry.
      const teamId = myTeam.id;
      const remaining = [...pendingMembers];
      while (remaining.length > 0) {
        const p = remaining[0];
        const defaultRole = p.slot === "staff" ? "coach" : "member";
        const added = await api.post<Team>(`/teams/${teamId}/members`, {
          playerTag: p.tag,
          slot: p.slot,
          ...(p.teamRole !== defaultRole ? { teamRole: p.teamRole } : {}),
        });
        const newMember = added.memberships?.find(
          (m) => m.slot === p.slot && m.user?.playerTag?.toLowerCase() === p.tag.toLowerCase()
        );
        const finalTeam =
          newMember && p.position
            ? await api.patch<Team>(`/teams/${teamId}/members/${newMember.userId}/${p.slot}`, {
                position: p.position,
              })
            : added;
        setMyTeam(finalTeam);
        remaining.shift();
        setPendingMembers([...remaining]);
      }

      await api.post("/registrations", {
        eventId: ev.id,
        teamId,
        contactEmail: contactEmail.trim(),
        acksTos: true,
        acksRulebookVersion: rulebookVersion,
        acksEmailConsent: acks.emailConsent,
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
            ? "The event is at capacity. Staff will email your team contact if a slot opens."
            : "NRV staff will review your roster. Your captain gets an email on approval, rejection, or any status change."}
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
        sub="Free entry. NRV staff review every registration — your captain is emailed on every status change. One team per account, across every team role."
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

          <SectionHeading>Team</SectionHeading>
          {!teamChecked ? (
            <div className="font-mono text-[11px] text-[#555]">Checking your team…</div>
          ) : myTeam ? (
            <Card pad={18}>
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
                <Pill color={rosterSize < MIN_ROSTER_SIZE || rosterSize > MAX_ROSTER_SIZE ? "#f87171" : "#4ade80"}>
                  {rosterSize}/{MAX_ROSTER_SIZE} roster
                </Pill>
                {existingTeam && myTeam.id === existingTeam.id && (
                  <button
                    onClick={() => setMyTeam(null)}
                    className="ml-auto font-mono text-[10px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer bg-transparent border-none hover:text-[#E6E6E6]"
                  >
                    ✕ Not this team
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <>
              {existingTeam && (
                <div className="mb-3.5 font-mono text-[11px] text-[#888BA0] leading-[1.7]" style={{ marginBottom: 14 }}>
                  You already coach <span className="text-[#E6E6E6]">{existingTeam.name}</span> (
                  {existingTeam.tag}) for {existingTeam.game}.{" "}
                  <button
                    onClick={() => setMyTeam(existingTeam)}
                    className="text-[#BFC2DE] underline cursor-pointer bg-transparent border-none font-mono text-[11px] p-0"
                  >
                    Use my existing team instead
                  </button>
                </div>
              )}
              <Card pad={20}>
                <div className="font-mono text-[10px] text-[#555] leading-[1.7] mb-4">
                  Create a new team — you become its coach.
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
                    <Select value={ev?.game ?? ""} options={ev ? [ev.game] : GAMES} disabled />
                  </Field>
                </div>
                <div className="mt-4">
                  <Btn onClick={requestCreateTeam} disabled={busy}>
                    Create team
                  </Btn>
                </div>
              </Card>
            </>
          )}

          <ConfirmModal
            open={confirmCreateTeam}
            title="Create this team?"
            danger={false}
            confirmLabel="Create team"
            body={
              <span>
                This creates <span className="text-[#E6E6E6]">{newTeam.name}</span> (
                {newTeam.tag}) immediately — you become its coach right away, before you submit
                any registration. You can only coach one {ev?.game} team at a time, so make sure
                this is the roster you want.
              </span>
            }
            onCancel={() => setConfirmCreateTeam(false)}
            onConfirm={createTeam}
          />

          {myTeam && (
            <>
              <SectionHeading>Team staff</SectionHeading>
              <div className="font-mono text-[10px] text-[#555] leading-[1.7] mb-3.5" style={{ marginBottom: 14 }}>
                Optional, add as needed. A captain can also be one of the five listed players — use
                &quot;Mark as captain&quot; on their row instead. At most one person may be captain.
              </div>
              {staffMembers.map((m) => (
                <StaffRow
                  key={m.id}
                  member={m}
                  busy={busy}
                  onAdd={() => {}}
                  onSetRole={(role) => updateMember(m.userId, "staff", { teamRole: role })}
                  onRemove={() => removeMember(m.userId, "staff")}
                />
              ))}
              <StaffRow busy={busy} onAdd={addStaffMember} onSetRole={() => {}} onRemove={() => {}} />

              <SectionHeading>Players</SectionHeading>
              {Array.from({ length: Math.max(MIN_ROSTER_SIZE, nonStaffMembers.length) }).map((_, i) => {
                const member = nonStaffMembers[i];
                return (
                  <RosterRow
                    key={member?.id ?? `player-slot-${i}`}
                    member={member}
                    captainable
                    isCaptain={member?.teamRole === "captain"}
                    roles={GAME_ROLES[myTeam.game]}
                    takenRoles={takenRoles}
                    busy={busy}
                    onAdd={addMember}
                    onRemove={member ? () => removeMember(member.userId, "player") : undefined}
                    onSetCaptain={(checked) => setPlayerCaptain(member, checked)}
                    onSetPosition={(position) => updateMember(member!.userId, "player", { position })}
                  />
                );
              })}

              <SectionHeading>Substitutes</SectionHeading>
              {Array.from({ length: subSlots }).map((_, i) => {
                const member = nonStaffMembers[MIN_ROSTER_SIZE + i];
                return (
                  <RosterRow
                    key={member?.id ?? `sub-slot-${i}`}
                    member={member}
                    roles={GAME_ROLES[myTeam.game]}
                    takenRoles={takenRoles}
                    roleRequired={false}
                    busy={busy}
                    onAdd={addMember}
                    onRemove={
                      member
                        ? () => removeMember(member.userId, "player")
                        : () => setSubSlots((n) => Math.max(0, n - 1))
                    }
                    onSetPosition={(position) => updateMember(member!.userId, "player", { position })}
                  />
                );
              })}
              {subSlots < MAX_SUBS && (
                <Btn variant="ghost" onClick={() => setSubSlots((n) => n + 1)} style={{ padding: "7px 14px" }}>
                  + Add substitute ({subSlots}/{MAX_SUBS})
                </Btn>
              )}
            </>
          )}

          {captainMember && (
            <div className="font-mono text-[10px] text-[#555] mt-3.5" style={{ marginTop: 14 }}>
              Captain: <span className="text-[#BFC2DE]">{captainMember.user?.name}</span>
            </div>
          )}

          <SectionHeading>Contact</SectionHeading>
          <Field label="Team contact email" req>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Distinct from any player's personal email"
            />
          </Field>

          <SectionHeading>Acknowledgements</SectionHeading>
          <label className="flex gap-3 items-start font-mono text-[11px] text-[#9a9db5] leading-[1.7] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acks.tos}
              onChange={(e) => setAcks((a) => ({ ...a, tos: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              I agree to the NRV Privacy Policy and Terms of Service, and I confirm I am authorized
              to submit this roster and player information.
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
              I have read and accept the current rulebook (v{rulebookVersion}). The accepted version
              and timestamp are stored with this registration.
              <span className="text-[#FF6A39]"> *</span>
            </span>
          </label>
          <label className="flex gap-3 items-start font-mono text-[11px] text-[#9a9db5] leading-[1.7] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={acks.emailConsent}
              onChange={(e) => setAcks((a) => ({ ...a, emailConsent: e.target.checked }))}
              className="mt-0.5"
            />
            <span>Email this roster updates about NRV events and results (optional).</span>
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
              <span className="font-mono text-[10px] text-[#555]">
                closes {fmtD(ev.regCloseDate)} · roster locks at close
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
