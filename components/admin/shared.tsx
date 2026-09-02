"use client";

import type { ReactNode } from "react";

export function AdminHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-7 flex items-end gap-4 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="font-display font-bold text-[26px] text-[#E6E6E6] tracking-[1px] uppercase">
          {title}
        </div>
        {sub && <div className="font-mono text-[11px] text-[#888BA0] mt-1 leading-[1.6]">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-[#1A1A1A] border border-[rgba(126,130,172,0.2)] px-5 py-4.5 flex-[1_1_150px]"
      style={{ padding: "18px 20px", cursor: onClick ? "pointer" : "default" }}
    >
      <div className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase mb-2.5">{label}</div>
      <div className="font-display font-extrabold text-[38px] leading-none" style={{ color: color || "#E6E6E6" }}>
        {value}
      </div>
    </div>
  );
}
