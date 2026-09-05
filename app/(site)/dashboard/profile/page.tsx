"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { PLAYER_TAG_PATTERN, PLAYER_TAG_HINT } from "@/lib/derived";
import { PageHead, SectionLabel, Card, Pill, Input, Btn } from "@/components/ui/primitives";
import { RiotCard } from "@/components/dashboard/riot-card";
import { DiscordCard } from "@/components/dashboard/discord-card";

export default function DashboardProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editingTag, setEditingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const startEditingTag = () => {
    setTagInput(user.playerTag);
    setEditingTag(true);
  };

  const saveTag = async () => {
    const trimmed = tagInput.trim();
    if (!PLAYER_TAG_PATTERN.test(trimmed)) {
      toast(`Player tag must be ${PLAYER_TAG_HINT}`, "error");
      return;
    }
    if (trimmed === user.playerTag) {
      setEditingTag(false);
      return;
    }
    setBusy(true);
    try {
      const updated = await api.patch<User>("/users/me/player-tag", { playerTag: trimmed });
      setUser({ ...user, ...updated });
      toast("Player tag updated");
      setEditingTag(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update player tag", "error");
    } finally {
      setBusy(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <div>
      <PageHead kicker="Account" title="Profile" />

      <SectionLabel>Account</SectionLabel>
      <Card pad={22} className="mb-9" style={{ marginBottom: 36 }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-[#23253A] text-[#BFC2DE] flex items-center justify-center font-display font-extrabold text-[18px] flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-display font-extrabold text-[18px] tracking-[0.5px] text-[#E6E6E6] uppercase">
              {user.name}
            </div>
            <div className="font-mono text-[11px] text-[#888BA0] mt-0.5">{user.email}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill color="#BFC2DE">{user.role}</Pill>
            {user.mfaEnabled && <Pill color="#4ade80">MFA on</Pill>}
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase mb-1">Player tag</div>
            {editingTag ? (
              <div className="flex gap-2 items-center flex-wrap">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="ShadowStriker"
                  maxLength={16}
                  style={{ width: 160 }}
                  autoFocus
                />
                <Btn onClick={saveTag} disabled={busy} style={{ padding: "6px 14px" }}>
                  Save
                </Btn>
                <button
                  onClick={() => setEditingTag(false)}
                  disabled={busy}
                  className="font-mono text-[10px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer bg-transparent border-none hover:text-[#E6E6E6]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 items-center">
                <span className="font-mono text-[12px] text-[#BFC2DE]">{user.playerTag || "—"}</span>
                <button
                  onClick={startEditingTag}
                  className="font-mono text-[9px] text-[#555] tracking-[1px] uppercase cursor-pointer bg-transparent border-none hover:text-[#BFC2DE]"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <SectionLabel>Connected Accounts</SectionLabel>
      <div className="nrv-grid-2">
        <RiotCard user={user} />
        <DiscordCard user={user} />
      </div>
    </div>
  );
}
