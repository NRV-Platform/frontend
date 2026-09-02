"use client";

import { Fragment } from "react";
import { Spark } from "@/components/ui/primitives";

function wikiInline(text: string, key: string) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? (
      <strong key={key + "-" + i} className="text-[#E6E6E6] font-bold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={key + "-" + i}>{p}</Fragment>
    )
  );
}

type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

export function WikiMarkdown({ text }: { text: string }) {
  const lines = String(text || "").split("\n");
  const blocks: Block[] = [];
  let buf: string[] | null = null;
  let bufType: "ul" | "ol" | null = null;
  const flush = () => {
    if (buf && bufType) {
      blocks.push({ type: bufType, items: buf });
      buf = null;
      bufType = null;
    }
  };
  lines.forEach((line) => {
    const t = line.replace(/\s+$/, "");
    if (/^### /.test(t)) {
      flush();
      blocks.push({ type: "h3", text: t.slice(4) });
    } else if (/^## /.test(t)) {
      flush();
      blocks.push({ type: "h2", text: t.slice(3) });
    } else if (/^# /.test(t)) {
      flush();
      blocks.push({ type: "h1", text: t.slice(2) });
    } else if (/^[-*] /.test(t)) {
      if (bufType !== "ul") {
        flush();
        bufType = "ul";
        buf = [];
      }
      buf!.push(t.slice(2));
    } else if (/^\d+\.\s/.test(t)) {
      if (bufType !== "ol") {
        flush();
        bufType = "ol";
        buf = [];
      }
      buf!.push(t.replace(/^\d+\.\s/, ""));
    } else if (t.trim() === "") {
      flush();
    } else {
      flush();
      blocks.push({ type: "p", text: t });
    }
  });
  flush();

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "h1")
          return (
            <h1
              key={i}
              className="font-display font-black text-[32px] text-[#E6E6E6] uppercase leading-[1.1] mb-4.5"
              style={{ letterSpacing: "-0.5px", marginBottom: 18 }}
            >
              {b.text}
            </h1>
          );
        if (b.type === "h2")
          return (
            <h2
              key={i}
              className="font-display font-bold text-[17px] text-[#BFC2DE] tracking-[1.5px] uppercase mt-8 mb-3 flex items-center gap-2.5"
            >
              <Spark size={8} />
              {b.text}
            </h2>
          );
        if (b.type === "h3")
          return (
            <h3
              key={i}
              className="font-display font-bold text-[14px] text-[#E6E6E6] tracking-[1px] uppercase mt-5.5 mb-2"
            >
              {b.text}
            </h3>
          );
        if (b.type === "p")
          return (
            <p key={i} className="font-mono text-[13px] text-[#9d9fb5] leading-[1.85] mb-4">
              {wikiInline(b.text, String(i))}
            </p>
          );
        if (b.type === "ul")
          return (
            <ul key={i} className="list-none m-0 mb-5 mt-1 p-0 flex flex-col gap-2.5">
              {b.items.map((it, j) => (
                <li key={j} className="font-mono text-[13px] text-[#9d9fb5] leading-[1.7] flex gap-3">
                  <span className="text-[#7E82AC] flex-shrink-0">—</span>
                  <span>{wikiInline(it, `${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i} className="list-none m-0 mb-5 mt-1 p-0 flex flex-col gap-2.5">
              {b.items.map((it, j) => (
                <li key={j} className="font-mono text-[13px] text-[#9d9fb5] leading-[1.7] flex gap-3">
                  <span className="font-display font-extrabold text-[13px] text-[#7E82AC]" style={{ minWidth: 18 }}>
                    {j + 1}.
                  </span>
                  <span>{wikiInline(it, `${i}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        return null;
      })}
    </div>
  );
}

export function wikiFlatten(rb: { sections: { id: string; title: string; pages: { id: string; title: string; body: string }[] }[] }) {
  const out: { id: string; title: string; body: string; sectionId: string; sectionTitle: string }[] = [];
  rb.sections.forEach((s) => s.pages.forEach((p) => out.push({ sectionId: s.id, sectionTitle: s.title, ...p })));
  return out;
}
