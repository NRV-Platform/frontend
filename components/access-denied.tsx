"use client";

import { useRouter } from "next/navigation";
import { Card, Btn } from "@/components/ui/primitives";

export function AccessDenied({ need }: { need: string }) {
  const router = useRouter();
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-5">
      <Card pad={36} className="w-[460px] max-w-full text-center">
        <div className="nrv-display text-[30px] text-[#E6E6E6] mb-3">Access denied</div>
        <p className="font-mono text-[12px] text-[#888BA0] leading-[1.8] mb-6">{need}</p>
        <Btn onClick={() => router.push("/login")}>Go to login</Btn>
      </Card>
    </div>
  );
}
