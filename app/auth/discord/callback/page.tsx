import { Suspense } from "react";
import { Card } from "@/components/ui/primitives";
import { DiscordCallbackHandler } from "./callback-handler";

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-5">
          <Card pad={28} className="w-[420px] max-w-full text-center">
            <div className="font-mono text-[12px] text-[#888BA0]">Loading…</div>
          </Card>
        </div>
      }
    >
      <DiscordCallbackHandler />
    </Suspense>
  );
}
