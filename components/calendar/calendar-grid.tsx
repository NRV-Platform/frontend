"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Match, Team } from "@/lib/types";
import { Card, Btn } from "@/components/ui/primitives";

interface Entry {
  label: string;
  color: string;
  href?: string;
}

export function CalendarGrid({
  matches,
  teamMap,
}: {
  matches: Match[];
  teamMap: Map<string, Team>;
}) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [visMatches, setVisMatches] = useState(true);
  const [visResults, setVisResults] = useState(true);

  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const pad = first.getDay();
  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const entries = useMemo(() => {
    const map: Record<number, Entry[]> = {};
    const add = (d: number, e: Entry) => {
      (map[d] = map[d] || []).push(e);
    };
    matches.forEach((m) => {
      const dt = new Date(m.startsAt);
      if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
      const a = teamMap.get(m.teamAId)?.tag ?? m.teamAId;
      const b = teamMap.get(m.teamBId)?.tag ?? m.teamBId;
      const label = `${a} vs ${b}`;
      if ((m.status === "final" || m.status === "forfeit") && visResults) {
        add(dt.getDate(), { label, color: "#888BA0", href: `/tournaments/${m.eventId}` });
      } else if (m.status !== "final" && m.status !== "forfeit" && visMatches) {
        add(dt.getDate(), { label, color: "#4ade80", href: `/tournaments/${m.eventId}` });
      }
    });
    return map;
  }, [matches, teamMap, year, month, visMatches, visResults]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div>
      <div className="flex gap-4 items-center flex-wrap mb-6">
        <div className="flex gap-2 items-center">
          <Btn variant="ghost" onClick={prevMonth} className="px-3 py-1.5">
            ←
          </Btn>
          <span
            className="font-display font-extrabold text-[18px] tracking-[1px] text-[#E6E6E6] uppercase text-center"
            style={{ minWidth: 180 }}
          >
            {monthName}
          </span>
          <Btn variant="ghost" onClick={nextMonth} className="px-3 py-1.5">
            →
          </Btn>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {(
            [
              ["matches", "Tournament matches", "#4ade80", visMatches, setVisMatches],
              ["results", "Match results", "#888BA0", visResults, setVisResults],
            ] as const
          ).map(([k, l, c, v, setV]) => (
            <button
              key={k}
              onClick={() => setV(!v)}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 cursor-pointer bg-transparent"
              style={{
                border: `1px solid ${v ? c + "88" : "rgba(255,255,255,0.1)"}`,
                color: v ? "#BFC2DE" : "#444",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: v ? c : "#333" }} />
              {l}
            </button>
          ))}
        </div>
      </div>
      <Card pad={0}>
        <div className="grid grid-cols-7">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div
              key={d}
              className="p-2.5 font-mono text-[9px] tracking-[2px] text-[#555] text-center border-b border-[rgba(126,130,172,0.25)]"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: pad }).map((_, i) => (
            <div
              key={"p" + i}
              className="border-b border-r border-white/[0.04]"
              style={{ minHeight: 92 }}
            />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const today =
              year === now.getFullYear() && month === now.getMonth() && d === now.getDate();
            return (
              <div
                key={d}
                className="p-2 border-b border-r border-white/[0.04]"
                style={{ minHeight: 92, background: today ? "rgba(126,130,172,0.08)" : "transparent" }}
              >
                <div className="font-mono text-[10px] mb-1.5" style={{ color: today ? "#BFC2DE" : "#555" }}>
                  {d}
                </div>
                <div className="flex flex-col gap-1">
                  {(entries[d] || []).map((e, j) => (
                    <div
                      key={j}
                      onClick={e.href ? () => router.push(e.href!) : undefined}
                      title={e.label}
                      className="font-mono text-[9px] text-[#BFC2DE] pl-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        borderLeft: `2px solid ${e.color}`,
                        lineHeight: 1.4,
                        cursor: e.href ? "pointer" : "default",
                      }}
                    >
                      {e.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
