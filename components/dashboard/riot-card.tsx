"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, Field, Input, Btn, Pill, ConfirmModal } from "@/components/ui/primitives";

export function RiotCard({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [riotId, setRiotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const connected = !!user.riotConnectedAt;

  const connect = async () => {
    if (!/^.+#.+$/.test(riotId.trim())) {
      toast("Enter a Riot ID as GameName#TagLine", "error");
      return;
    }
    setBusy(true);
    try {
      await api.post("/users/me/riot/connect", { riotId: riotId.trim() });
      await refreshUser();
      toast("Riot account linked");
      setRiotId("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to link Riot account", "error");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.delete("/users/me/riot");
      await refreshUser();
      toast("Riot account unlinked");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to unlink Riot account", "error");
    } finally {
      setBusy(false);
      setConfirmDisconnect(false);
    }
  };

  return (
    <Card pad={22}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
          Riot Games
        </div>
        {connected ? <Pill color="#4ade80">Connected</Pill> : <Pill color="#555">Not connected</Pill>}
      </div>

      {connected ? (
        <div>
          <div className="font-mono text-[13px] text-[#BFC2DE] mb-1">
            {user.riotGameName}#{user.riotTagLine}
          </div>
          <div className="font-mono text-[10px] text-[#555] mb-4">
            Required for tournament stat sync — this is the account NRV pulls match data from.
          </div>
          <Btn variant="ghost" onClick={() => setConfirmDisconnect(true)} disabled={busy}>
            Disconnect
          </Btn>
        </div>
      ) : (
        <div>
          <div className="font-mono text-[10px] text-[#888BA0] leading-[1.7] mb-4">
            Required to compete — NRV syncs your match stats from this account for every
            tournament you play in.
          </div>
          <div className="flex gap-2.5 flex-wrap items-end">
            <Field label="Riot ID" className="flex-[2_1_180px]">
              <Input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="GameName#TAG" />
            </Field>
            <Btn onClick={connect} disabled={busy}>
              Connect
            </Btn>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDisconnect}
        title="Disconnect Riot account"
        confirmLabel="Disconnect"
        body="Your tournament stats will stop syncing until you reconnect a Riot account."
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </Card>
  );
}
