"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Registration } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, Pill, Btn, Label, Input, ConfirmModal, fmtDT } from "@/components/ui/primitives";

export default function AdminRegistrationsPage() {
  const toast = useToast();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [reject, setReject] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    try {
      const list = await api.get<Registration[]>("/registrations");
      setRegs(list);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to load registrations", "error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = regs.find((x) => x.id === selId) ?? null;

  const decide = async (id: string, status: string, decideReason?: string) => {
    try {
      await api.post(`/registrations/${id}/decide`, { status, reason: decideReason });
      toast(
        status === "approved"
          ? "Approved — team added to the event"
          : status === "rejected"
          ? "Rejected"
          : "Moved to waitlist"
      );
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update registration", "error");
    }
  };

  return (
    <div>
      <AdminHead
        title="Registrations"
        sub="Approving adds the team to the event automatically."
      />
      <div className="nrv-grid-2" style={{ alignItems: "start" }}>
        <Card pad={0}>
          <Table
            cols={[
              {
                h: "Team",
                render: (x: Registration) => (
                  <div>
                    <div className="text-[#E6E6E6] font-display font-bold tracking-[1px] uppercase">
                      {x.team?.name}
                    </div>
                    <div className="text-[10px] text-[#555]">
                      {x.team?.tag} · {x.event?.name}
                    </div>
                  </div>
                ),
              },
              {
                h: "Submitted",
                render: (x: Registration) => (
                  <span className="text-[#555] text-[10px] whitespace-nowrap">{fmtDT(x.submittedAt)}</span>
                ),
              },
              { h: "Status", right: true, render: (x: Registration) => <Pill>{x.status}</Pill> },
            ]}
            rows={regs}
            keyFn={(x) => x.id}
            onRowClick={(row) => setSelId(row.id)}
          />
        </Card>
        <div>
          {!r && (
            <Card pad={28}>
              <div className="font-mono text-[11px] text-[#444] text-center uppercase tracking-[2px]">
                Select a registration
              </div>
            </Card>
          )}
          {r && (
            <Card pad={22}>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="font-display font-extrabold text-[20px] tracking-[1px] text-[#E6E6E6] uppercase">
                  {r.team?.name}
                </div>
                <Pill>{r.status}</Pill>
              </div>
              <div className="font-mono text-[10px] text-[#555] mb-4">
                {r.team?.tag} · submitted {fmtDT(r.submittedAt)}
                {r.decidedBy ? ` · decided by ${r.decidedBy.name}` : ""}
              </div>
              {r.reason && (
                <div className="font-mono text-[11px] text-[#f87171] mb-3.5">Reason: {r.reason}</div>
              )}
              <div className="font-mono text-[11px] text-[#888BA0] leading-[1.9] mb-4">
                Contact: {r.contactEmail || "—"}
                <br />
                Rulebook v{r.acksRulebookVersion} accepted {fmtDT(r.acksAt)} · ToS ✓ · email consent{" "}
                {r.acksEmailConsent ? "✓" : "—"}
              </div>
              <Label>Roster</Label>
              {(r.team?.memberships ?? []).map((m) => (
                <div key={m.id} className="font-mono text-[11px] py-1 flex gap-2 flex-wrap">
                  <span className="text-[#E6E6E6]">{m.user?.name}</span>
                  <Pill color={m.teamRole === "coach" ? "#4ade80" : m.teamRole === "captain" ? "#BFC2DE" : "#555"}>
                    {m.teamRole}
                  </Pill>
                  <span className="text-[#555]">{m.user?.playerTag}</span>
                </div>
              ))}
              {(r.status === "pending" || r.status === "waitlist") && (
                <div className="flex gap-2.5 mt-5.5 flex-wrap" style={{ marginTop: 22 }}>
                  <Btn onClick={() => decide(r.id, "approved")}>Approve</Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      setReject(r.id);
                      setReason("");
                    }}
                  >
                    Reject…
                  </Btn>
                  {r.status === "pending" && (
                    <Btn variant="ghost" onClick={() => decide(r.id, "waitlist")}>
                      Waitlist
                    </Btn>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      <ConfirmModal
        open={!!reject}
        title="Reject registration"
        confirmLabel="Reject"
        body={
          <div>
            <div style={{ marginTop: 12 }}>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
            </div>
          </div>
        }
        onCancel={() => setReject(null)}
        onConfirm={() => {
          if (reject) decide(reject, "rejected", reason || "Not specified");
          setReject(null);
        }}
      />
    </div>
  );
}
