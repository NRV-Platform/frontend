"use client";

import { useState } from "react";
import type { Rulebook } from "@/lib/types";
import { SectionLabel, Input, fmtD } from "@/components/ui/primitives";
import { WikiMarkdown, wikiFlatten } from "./wiki-markdown";

export function RulebookReader({ rulebook }: { rulebook: Rulebook }) {
  const all = wikiFlatten(rulebook);
  const [activeId, setActiveId] = useState<string | null>(all[0]?.id ?? null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const active = all.find((p) => p.id === activeId) ?? all[0];
  const ai = all.findIndex((p) => p.id === active?.id);
  const prev = ai > 0 ? all[ai - 1] : null;
  const next = ai >= 0 && ai < all.length - 1 ? all[ai + 1] : null;

  return (
    <div>
      <div
        className="flex items-end justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-[rgba(126,130,172,0.25)]"
      >
        <div>
          <SectionLabel>Official Rulebook</SectionLabel>
          <div className="font-mono text-[11px] text-[#888BA0] leading-[1.7] max-w-[560px]">
            Rules are human-refereed — violations are investigated retroactively and may result in
            disqualification.
          </div>
        </div>
        <div className="flex gap-4.5 font-mono text-[10px] text-[#555] tracking-[1px] flex-shrink-0" style={{ gap: 18 }}>
          <span>
            VERSION <span className="text-[#BFC2DE]">{rulebook.version}</span>
          </span>
          <span>
            UPDATED <span className="text-[#BFC2DE]">{fmtD(rulebook.updatedAt)}</span>
          </span>
        </div>
      </div>
      <div className="grid gap-11 items-start nrv-wiki-grid" style={{ gridTemplateColumns: "240px 1fr" }}>
        <aside className="sticky" style={{ top: 88 }}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rules…"
            className="mb-5"
          />
          {rulebook.sections.map((section) => {
            const pages = section.pages.filter(
              (p) => !query || `${p.title} ${p.body}`.toLowerCase().includes(query)
            );
            if (!pages.length) return null;
            return (
              <div key={section.id} className="mb-5">
                <div className="font-mono text-[9px] text-[#888BA0] tracking-[3px] uppercase mb-2">
                  {section.title}
                </div>
                {pages.map((p) => {
                  const on = !!active && p.id === active.id;
                  return (
                    <a
                      key={p.id}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveId(p.id);
                      }}
                      className="block font-mono text-[12px] no-underline py-1.5 pl-3.5"
                      style={{
                        color: on ? "#E6E6E6" : "#888BA0",
                        borderLeft: `2px solid ${on ? "#7E82AC" : "rgba(126,130,172,0.18)"}`,
                        background: on ? "rgba(126,130,172,0.08)" : "transparent",
                      }}
                    >
                      {p.title}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </aside>
        <article className="min-w-0 max-w-[760px]">
          {active ? (
            <div>
              <div className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase mb-4">
                {active.sectionTitle} <span className="text-[#333]">/</span> {active.title}
              </div>
              <WikiMarkdown text={active.body} />
              <div className="flex gap-3 mt-11 pt-5.5 border-t border-[rgba(126,130,172,0.2)]" style={{ marginTop: 44, paddingTop: 22 }}>
                {prev ? (
                  <button
                    onClick={() => setActiveId(prev.id)}
                    className="flex-1 text-left bg-[#111] border border-[rgba(126,130,172,0.25)] px-4 py-3.5 cursor-pointer"
                  >
                    <div className="font-mono text-[9px] text-[#555] tracking-[2px] mb-1.5">← PREVIOUS</div>
                    <div className="font-display font-bold text-[13px] text-[#E6E6E6]">{prev.title}</div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
                {next ? (
                  <button
                    onClick={() => setActiveId(next.id)}
                    className="flex-1 text-right bg-[#111] border border-[rgba(126,130,172,0.25)] px-4 py-3.5 cursor-pointer"
                  >
                    <div className="font-mono text-[9px] text-[#555] tracking-[2px] mb-1.5">NEXT →</div>
                    <div className="font-display font-bold text-[13px] text-[#E6E6E6]">{next.title}</div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          ) : (
            <div className="font-mono text-[12px] text-[#555]">No rules found for &quot;{q}&quot;.</div>
          )}
        </article>
      </div>
    </div>
  );
}
