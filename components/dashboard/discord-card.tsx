"use client";

import { Card, Btn, Pill } from "@/components/ui/primitives";

export function DiscordCard() {
  return (
    <Card pad={22}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="font-display font-extrabold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase">
          Discord
        </div>
        <Pill color="#555">Not connected</Pill>
      </div>
      <div className="font-mono text-[10px] text-[#888BA0] leading-[1.7] mb-4">
        Required to compete — NRV uses Discord for tournament coordination and announcements.
        Linking isn&apos;t available yet.
      </div>
      <Btn variant="ghost" disabled>
        Connect (coming soon)
      </Btn>
    </Card>
  );
}
