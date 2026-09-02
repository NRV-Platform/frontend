"use client";

import Link from "next/link";
import type { NrvEvent } from "@/lib/types";
import { regState } from "@/lib/derived";
import { Pill, fmtD } from "@/components/ui/primitives";

export function RegCTA({ event }: { event: NrvEvent }) {
  const rs = regState(event, event.teams?.length ?? 0);
  if (rs === "notopen") return <Pill>Registration opens {fmtD(event.regOpenDate)}</Pill>;
  if (rs === "closed") return <Pill color="#555">Registration closed</Pill>;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link
        href={`/register?event=${event.id}`}
        className="font-mono text-[11px] tracking-[2px] uppercase px-5 py-2.5 cursor-pointer bg-[#7E82AC] border border-[#7E82AC] text-white no-underline hover:opacity-85 transition-opacity"
      >
        {rs === "waitlist" ? "Join waitlist" : "Register a team"}
      </Link>
      <span className="font-mono text-[10px] text-[#555]">closes {fmtD(event.regCloseDate)}</span>
    </div>
  );
}
