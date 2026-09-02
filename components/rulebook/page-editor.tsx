"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { Input, Btn } from "@/components/ui/primitives";
import { WikiMarkdown } from "./wiki-markdown";

interface CurrentPage {
  section: { id: string; title: string };
  page: { id: string; title: string; body: string };
}

// Keyed by page id from the parent, so draft state initializes fresh per
// page without needing an effect to reset it on selection change.
export function PageEditor({
  current,
  onSaved,
}: {
  current: CurrentPage;
  onSaved: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [draftTitle, setDraftTitle] = useState(current.page.title);
  const [draftBody, setDraftBody] = useState(current.page.body);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const dirty = draftTitle !== current.page.title || draftBody !== current.page.body;
  const wordCount = draftBody.split(/\s+/).filter(Boolean).length;

  const save = async () => {
    if (!dirty) return;
    if (!note.trim()) {
      toast("A changelog note is required to save", "error");
      return;
    }
    try {
      await api.patch(`/rulebook/pages/${current.page.id}`, {
        title: draftTitle,
        body: draftBody,
        note: note.trim(),
      });
      toast("Saved");
      setNote("");
      await onSaved();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save page", "error");
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[rgba(126,130,172,0.2)] flex flex-col min-h-0 h-full">
      <div className="border-b border-[rgba(126,130,172,0.2)] flex justify-between items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div
            className="px-4.5 pt-2.5 font-mono text-[9px] text-[#555] tracking-[2px] uppercase"
            style={{ padding: "10px 18px 0" }}
          >
            {current.section.title}
          </div>
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Page title"
            className="w-full bg-transparent border-none text-[#E6E6E6] font-display font-bold text-[22px] outline-none"
            style={{ padding: "8px 18px 14px", letterSpacing: "0.5px" }}
          />
        </div>
        <div className="flex gap-2 items-center px-4 py-2.5 flex-wrap">
          {dirty && (
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Changelog note (required to save)"
              style={{ width: 220 }}
            />
          )}
          {dirty && (
            <span className="font-mono text-[9px] text-[#FF6A39] tracking-[2px] inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A39]" />
              UNSAVED
            </span>
          )}
          <Btn disabled={!dirty} style={{ padding: "7px 14px" }} onClick={save}>
            Save (bumps version)
          </Btn>
        </div>
      </div>
      <div className="px-3.5 py-1.5 border-b border-[rgba(126,130,172,0.2)] flex gap-1.5 items-center">
        <div className="flex gap-1">
          {(["edit", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="font-mono text-[10px] tracking-[2px] uppercase px-3 py-1 cursor-pointer border border-[rgba(126,130,172,0.3)]"
              style={{
                background: mode === m ? "rgba(126,130,172,0.2)" : "transparent",
                color: mode === m ? "#E6E6E6" : "#888BA0",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="font-mono text-[9px] text-[#444] tracking-[1px]">
          {draftBody.length} CHARS · {wordCount} WORDS
        </span>
      </div>
      {mode === "edit" ? (
        <textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          spellCheck={false}
          placeholder="Write in Markdown — # Heading, ## Subheading, - bullet, **bold**"
          className="flex-1 bg-transparent border-none text-[#E6E6E6] font-mono text-[13px] leading-[1.85] outline-none resize-none p-5"
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6" style={{ padding: "24px 28px" }}>
          <WikiMarkdown text={draftBody} />
        </div>
      )}
      <div className="px-4.5 py-2 border-t border-[rgba(126,130,172,0.2)] font-mono text-[9px] text-[#444] tracking-[1px] flex justify-between">
        <span>MARKDOWN · # H1 · ## H2 · - LIST · **BOLD**</span>
        <span>{dirty ? "UNSAVED CHANGES" : "ALL CHANGES SAVED"}</span>
      </div>
    </div>
  );
}
