"use client";

import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/primitives";
import { regState } from "@/lib/derived";
import type { NrvEvent } from "@/lib/types";

export function HeroCTA({
  activeEventId,
  events,
}: {
  activeEventId: string | null;
  events: NrvEvent[];
}) {
  const router = useRouter();
  const regEvent = events.find((e) => {
    const rs = regState(e, e.teams?.length ?? 0);
    return rs === "open" || rs === "waitlist";
  });

  if (!regEvent && !activeEventId) return null;

  return (
    <div className="mt-8 flex gap-3 justify-center flex-wrap">
      {regEvent && (
        <Btn onClick={() => router.push(`/register?event=${regEvent.id}`)}>
          Register for {regEvent.name.split("—")[0].trim()}
        </Btn>
      )}
      {activeEventId && (
        <Btn variant="ghost" onClick={() => router.push(`/tournaments/${activeEventId}`)}>
          View standings
        </Btn>
      )}
    </div>
  );
}
