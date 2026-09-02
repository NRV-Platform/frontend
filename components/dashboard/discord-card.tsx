"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, Btn, Pill, ConfirmModal } from "@/components/ui/primitives";

export function DiscordCard({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const connected = !!user.discordConnectedAt;

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await api.get<{ url: string }>("/users/me/discord/auth-url");
      sessionStorage.setItem("nrv_discord_return_to", window.location.pathname);
      window.location.href = url;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to start Discord connection", "error");
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.delete("/users/me/discord");
      await refreshUser();
      toast("Discord account unlinked");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to unlink Discord account", "error");
    } finally {
      setBusy(false);
      setConfirmDisconnect(false);
    }
  };

  return (
    <Card pad={22}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
          Discord
        </div>
        {connected ? <Pill color="#4ade80">Connected</Pill> : <Pill color="#555">Not connected</Pill>}
      </div>

      {connected ? (
        <div>
          <div className="font-mono text-[13px] text-[#BFC2DE] mb-1">{user.discordUsername}</div>
          <div className="font-mono text-[10px] text-[#555] mb-4">
            Required for tournament coordination — NRV uses Discord for scheduling and
            announcements.
          </div>
          <Btn variant="ghost" onClick={() => setConfirmDisconnect(true)} disabled={busy}>
            Disconnect
          </Btn>
        </div>
      ) : (
        <div>
          <div className="font-mono text-[10px] text-[#888BA0] leading-[1.7] mb-4">
            Required to compete — NRV uses Discord for tournament coordination and
            announcements.
          </div>
          <Btn onClick={connect} disabled={busy}>
            Connect with Discord
          </Btn>
        </div>
      )}

      <ConfirmModal
        open={confirmDisconnect}
        title="Disconnect Discord account"
        confirmLabel="Disconnect"
        body="You won't receive tournament coordination messages until you reconnect a Discord account."
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </Card>
  );
}
