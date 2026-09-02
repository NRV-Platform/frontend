"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Rulebook } from "@/lib/types";
import { wikiFlatten } from "@/components/rulebook/wiki-markdown";
import { PageEditor } from "@/components/rulebook/page-editor";
import { ConfirmModal, fmtD } from "@/components/ui/primitives";

const treeIconBtnClass =
  "font-mono text-[11px] leading-none bg-transparent border border-[rgba(126,130,172,0.3)] text-[#888BA0] w-5 h-5 cursor-pointer flex items-center justify-center p-0";

export default function AdminRulebookPage() {
  const toast = useToast();
  const [rb, setRb] = useState<Rulebook | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "section" | "page"; sectionId: string; pageId?: string; label: string } | null>(
    null
  );

  const load = async (keepActive = true) => {
    const data = await api.get<Rulebook>("/rulebook", { auth: false }).catch(() => null);
    setRb(data);
    if (data && !keepActive) {
      const first = wikiFlatten(data)[0];
      setActiveId(first ? first.id : null);
    }
  };

  useEffect(() => {
    void (async () => {
      await load(false);
    })();
  }, []);

  const all = rb ? wikiFlatten(rb) : [];
  const findPage = (id: string | null) => {
    if (!rb) return null;
    for (const s of rb.sections) {
      const p = s.pages.find((x) => x.id === id);
      if (p) return { section: s, page: p };
    }
    return null;
  };
  const current = findPage(activeId);

  const addSection = async () => {
    try {
      await api.post("/rulebook/sections", { title: "New Chapter" });
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add chapter", "error");
    }
  };

  const addPage = async (sectionId: string) => {
    try {
      await api.post(`/rulebook/sections/${sectionId}/pages`, { title: "Untitled Page", body: "" });
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add page", "error");
    }
  };

  const renameSection = async () => {
    // The API has no chapter-rename route — only create/delete for
    // sections. Renaming isn't wired up until that endpoint exists.
    toast("Renaming chapters isn't supported by the API yet", "error");
    setRenaming(null);
  };

  const doDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "section") {
        await api.delete(`/rulebook/sections/${confirm.sectionId}`);
      } else {
        await api.delete(`/rulebook/pages/${confirm.pageId}`);
      }
      toast("Deleted");
      setConfirm(null);
      await load(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete", "error");
      setConfirm(null);
    }
  };

  if (!rb) {
    return <div className="font-mono text-[12px] text-[#555]">Loading rulebook…</div>;
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex justify-between items-start mb-4.5 flex-shrink-0 gap-4 flex-wrap" style={{ marginBottom: 18 }}>
        <div>
          <div className="font-display font-bold text-[26px] text-[#E6E6E6] tracking-[1px] uppercase">Rulebook</div>
          <div className="flex gap-4 mt-1.5 font-mono text-[10px] text-[#555] tracking-[1px] flex-wrap">
            <span>
              VERSION <span className="text-[#888BA0]">{rb.version}</span>
            </span>
            <span>
              UPDATED <span className="text-[#888BA0]">{fmtD(rb.updatedAt)}</span>
            </span>
            <span>
              {all.length} PAGES · {rb.sections.length} CHAPTERS
            </span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: "260px 1fr" }}>
        <div className="bg-[#1A1A1A] border border-[rgba(126,130,172,0.2)] flex flex-col min-h-0">
          <div className="px-3.5 py-3 border-b border-[rgba(126,130,172,0.2)] font-mono text-[9px] text-[#888BA0] tracking-[2px]">
            CONTENTS
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            {rb.sections.map((section) => (
              <div key={section.id} className="mb-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1">
                  {renaming === section.id ? (
                    <input
                      autoFocus
                      defaultValue={section.title}
                      onBlur={() => renameSection()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameSection();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="flex-1 bg-[#262626] border border-[#7E82AC] text-[#E6E6E6] px-1.5 py-0.5 font-mono text-[10px] tracking-[1px] outline-none"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setRenaming(section.id)}
                      className="flex-1 font-mono text-[9px] text-[#BFC2DE] tracking-[2px] uppercase cursor-text"
                    >
                      {section.title}
                    </div>
                  )}
                  <div className="flex gap-1 flex-shrink-0">
                    <button title="Rename" onClick={() => setRenaming(section.id)} className={treeIconBtnClass}>
                      ✎
                    </button>
                    <button title="Add page" onClick={() => addPage(section.id)} className={treeIconBtnClass}>
                      +
                    </button>
                    <button
                      title="Delete chapter"
                      onClick={() => setConfirm({ kind: "section", sectionId: section.id, label: section.title })}
                      className={`${treeIconBtnClass} text-[#f87171] border-[rgba(248,113,113,0.3)]`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {section.pages.map((p) => {
                  const on = p.id === activeId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
                      style={{
                        paddingLeft: 18,
                        background: on ? "rgba(126,130,172,0.15)" : "transparent",
                        borderLeft: on ? "2px solid #7E82AC" : "2px solid transparent",
                      }}
                    >
                      <span
                        className="flex-1 font-mono text-[11px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ color: on ? "#E6E6E6" : "#888BA0" }}
                      >
                        {p.title}
                      </span>
                      <button
                        title="Delete page"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirm({ kind: "page", sectionId: section.id, pageId: p.id, label: p.title });
                        }}
                        className={`${treeIconBtnClass} text-[#f87171] border-[rgba(248,113,113,0.25)]`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <button
            onClick={addSection}
            className="m-3 font-mono text-[10px] tracking-[2px] bg-transparent text-[#BFC2DE] px-2.5 py-2.5 cursor-pointer"
            style={{ border: "1px dashed rgba(126,130,172,0.5)" }}
          >
            + Add Chapter
          </button>
        </div>
        {current ? (
          <PageEditor key={current.page.id} current={current} onSaved={() => load()} />
        ) : (
          <div className="bg-[#1A1A1A] border border-[rgba(126,130,172,0.2)] flex items-center justify-center font-mono text-[12px] text-[#555]">
            Select a page to edit, or add a chapter.
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!confirm}
        title={confirm?.kind === "section" ? "Delete chapter?" : "Delete page?"}
        confirmLabel="Delete"
        body={
          confirm &&
          (confirm.kind === "section"
            ? `The chapter "${confirm.label}" and all of its pages will be permanently removed.`
            : `The page "${confirm.label}" will be permanently removed.`)
        }
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
