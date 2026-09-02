"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { Sponsor } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Field, Input, Select, Btn, ConfirmModal, Modal } from "@/components/ui/primitives";

export default function AdminSponsorsPage() {
  const toast = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [edit, setEdit] = useState<"new" | string | null>(null);
  const [form, setForm] = useState({ name: "", tier: "Partner" });
  const [del, setDel] = useState<Sponsor | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    const list = await api.get<Sponsor[]>("/sponsors", { auth: false }).catch(() => []);
    setSponsors((list ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (s: Sponsor | null) => {
    setEdit(s ? s.id : "new");
    setForm(s ? { name: s.name, tier: s.tier } : { name: "", tier: "Partner" });
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast("Sponsor name is required", "error");
      return;
    }
    try {
      if (edit === "new") {
        await api.post("/sponsors", form);
      } else if (edit) {
        await api.patch(`/sponsors/${edit}`, form);
      }
      toast(edit === "new" ? "Sponsor added" : "Sponsor updated");
      setEdit(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save sponsor", "error");
    }
  };

  const removeSponsor = async () => {
    if (!del) return;
    try {
      await api.delete(`/sponsors/${del.id}`);
      toast("Sponsor deleted");
      setDel(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete sponsor", "error");
    }
  };

  const toggleEnabled = async () => {
    try {
      await api.patch("/settings/sponsors-enabled", { enabled: !enabled });
      setEnabled((e) => !e);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update setting", "error");
    }
  };

  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = sponsors.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    try {
      await api.patch("/sponsors/reorder", { order: ids });
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to reorder", "error");
    }
    setDragId(null);
  };

  return (
    <div>
      <AdminHead
        title="Sponsors"
        sub="Drag rows to reorder. The public Sponsors page only appears once this section is enabled."
      />
      <Card pad={18} className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="font-display font-bold text-[15px] tracking-[1px] text-[#E6E6E6] uppercase mb-1">
            Public Sponsors section
          </div>
          <div className="font-mono text-[10px] text-[#888BA0]">
            {enabled ? "Live — reachable at /sponsors." : "Hidden — the page is disabled for visitors."} The
            API has no way to read this setting back, so this toggle reflects only what you changed this
            session.
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[2px]" style={{ color: enabled ? "#4ade80" : "#555" }}>
            {enabled ? "ENABLED" : "DISABLED"}
          </span>
          <div
            onClick={toggleEnabled}
            className="w-11 h-[22px] rounded-full relative cursor-pointer flex-shrink-0"
            style={{ background: enabled ? "#22c55e" : "#333" }}
          >
            <div
              className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all"
              style={{ left: enabled ? 24 : 2 }}
            />
          </div>
        </div>
      </Card>
      <div className="flex flex-col gap-2.5 mb-4">
        {sponsors.map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => setDragId(s.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(s.id)}
            className="flex items-center gap-3.5 bg-[#1A1A1A] border border-[rgba(126,130,172,0.2)] px-4.5 py-3.5 cursor-grab"
            style={{ opacity: dragId === s.id ? 0.5 : 1 }}
          >
            <span className="text-[#444] font-mono text-[14px] tracking-[2px]">⠿</span>
            <div className="flex-1">
              <div className="font-display font-bold text-[14px] text-[#E6E6E6]">{s.name}</div>
              <div className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase">{s.tier} sponsor</div>
            </div>
            <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 9 }} onClick={() => openEdit(s)}>
              Edit
            </Btn>
            <Btn variant="danger" style={{ padding: "5px 12px", fontSize: 9 }} onClick={() => setDel(s)}>
              Delete
            </Btn>
          </div>
        ))}
        {sponsors.length === 0 && (
          <Card pad={28}>
            <div className="font-mono text-[11px] text-[#444] text-center uppercase tracking-[2px]">
              No sponsors yet
            </div>
          </Card>
        )}
      </div>
      <Btn variant="ghost" onClick={() => openEdit(null)}>
        + Add sponsor
      </Btn>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Add sponsor" : "Edit sponsor"}
        width={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Btn>
            <Btn onClick={save}>Save</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Field label="Name" req>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Tier">
            <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} options={["Title", "Partner"]} />
          </Field>
        </div>
      </Modal>
      <ConfirmModal
        open={!!del}
        title="Delete sponsor"
        confirmLabel="Delete sponsor"
        body={del && `Remove "${del.name}" from the sponsors list?`}
        onCancel={() => setDel(null)}
        onConfirm={removeSponsor}
      />
    </div>
  );
}
