"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { regState, GAMES } from "@/lib/derived";
import type { NrvEvent, Team } from "@/lib/types";
import {
  PageHead,
  Card,
  Field,
  Input,
  Select,
  Btn,
  Empty,
  Spark,
  fmtD,
} from "@/components/ui/primitives";

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

  const submit = async () => {
    const e: string[] = [];
    if (!ev) e.push("Pick an event.");
    if (!myTeam) e.push("You need a team before registering.");
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
            <Card pad={18}>
              <div className="font-display font-bold text-[15px] text-[#E6E6E6] uppercase">
                {myTeam.name}
              </div>
              <div className="font-mono text-[10px] text-[#555] mt-1">
                {myTeam.tag} · {myTeam.game}
              </div>
            </Card>
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
            <Btn onClick={submit} disabled={busy || rs === "closed"} style={{ padding: "13px 32px" }}>
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
