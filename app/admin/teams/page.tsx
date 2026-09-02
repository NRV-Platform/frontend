"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Team } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, Pill, Btn, Modal } from "@/components/ui/primitives";

export default function AdminTeamsPage() {
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    const list = await api.get<Team[]>("/teams", { auth: false }).catch(() => []);
    setTeams(list.filter((t) => t.isNrv));
  };

  useEffect(() => {
    load();
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

  return (
    <div>
      <AdminHead
        title="NRV Teams"
        sub="Toggle homepage visibility per team. Roster changes are made by each team's coach in Team Management."
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
              {team.memberships?.length ?? 0} roster member{(team.memberships?.length ?? 0) === 1 ? "" : "s"}
            </div>
            <Btn variant="ghost" style={{ padding: "6px 14px", width: "100%" }} onClick={() => setOpen(team.id)}>
              View roster
            </Btn>
          </Card>
        ))}
        {teams.length === 0 && (
          <div className="font-mono text-[11px] text-[#444] uppercase tracking-[2px]">No NRV teams yet</div>
        )}
      </div>
      <Modal open={!!openTeam} onClose={() => setOpen(null)} title={`${openTeam?.name ?? ""} roster`} width={640}>
        {openTeam && (
          <Card pad={0}>
            <Table
              cols={[
                {
                  h: "Player",
                  render: (m) => (
                    <div>
                      <div className="text-[#E6E6E6] font-display font-bold text-[13px] tracking-[1px] uppercase">
                        {m.user?.name}
                      </div>
                      <div className="text-[10px] text-[#555]">{m.user?.playerTag}</div>
                    </div>
                  ),
                },
                {
                  h: "Position",
                  render: (m) => (
                    <span className="text-[#888BA0] text-[10px] tracking-[1px] uppercase">{m.position || "—"}</span>
                  ),
                },
                {
                  h: "Role",
                  right: true,
                  render: (m) => (
                    <Pill color={m.teamRole === "coach" ? "#4ade80" : m.teamRole === "captain" ? "#BFC2DE" : "#555"}>
                      {m.teamRole}
                    </Pill>
                  ),
                },
              ]}
              rows={openTeam.memberships ?? []}
              keyFn={(m) => m.id}
            />
          </Card>
        )}
      </Modal>
    </div>
  );
}
