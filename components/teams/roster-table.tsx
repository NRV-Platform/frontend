"use client";

import type { TeamMembership } from "@/lib/types";
import { Card, Table, Pill } from "@/components/ui/primitives";

export function RosterTable({ roster }: { roster: TeamMembership[] }) {
  return (
    <Card pad={0}>
      <Table
        cols={[
          {
            h: "Player",
            render: (m: TeamMembership) => (
              <div>
                <div className="text-[#E6E6E6] font-display font-bold text-[14px] tracking-[1px] uppercase">
                  {m.user?.name ?? "—"}
                </div>
                <div className="text-[10px] text-[#555]">{m.user?.playerTag}</div>
              </div>
            ),
          },
          {
            h: "Position",
            render: (m: TeamMembership) => (
              <span className="text-[#888BA0] text-[10px] tracking-[1px] uppercase">
                {m.position || "—"}
              </span>
            ),
          },
          {
            h: "Role",
            right: true,
            render: (m: TeamMembership) => (
              <Pill color={m.teamRole === "coach" ? "#4ade80" : m.teamRole === "captain" ? "#BFC2DE" : "#555"}>
                {m.teamRole}
              </Pill>
            ),
          },
        ]}
        rows={roster}
        keyFn={(m) => m.id}
      />
    </Card>
  );
}
