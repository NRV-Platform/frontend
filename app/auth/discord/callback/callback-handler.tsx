"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/primitives";

export function DiscordCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Connecting your Discord account…");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const returnTo = sessionStorage.getItem("nrv_discord_return_to") || "/dashboard/profile";
      sessionStorage.removeItem("nrv_discord_return_to");

      if (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Discord authorization was cancelled or denied.");
        }
        return;
      }
      if (!code) {
        if (!cancelled) {
          setStatus("error");
          setMessage("No authorization code was returned by Discord.");
        }
        return;
      }

      try {
        await api.post("/users/me/discord/connect", { code });
        await refreshUser();
        if (!cancelled) {
          toast("Discord account linked");
          router.replace(returnTo);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e instanceof ApiError ? e.message : "Failed to link Discord account.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <Card pad={28} className="w-[420px] max-w-full text-center">
        <div className="font-mono text-[12px] text-[#888BA0] leading-[1.8] mb-5">{message}</div>
        {status === "error" && (
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="font-mono text-[11px] text-[#BFC2DE] tracking-[1px] uppercase cursor-pointer bg-transparent border border-[rgba(126,130,172,0.5)] px-4 py-2"
          >
            Back to profile
          </button>
        )}
      </Card>
    </div>
  );
}
