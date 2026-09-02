"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { NewsCategory, NewsPost } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, Pill, Field, Input, Select, TextArea, Btn, ConfirmModal, fmtDT } from "@/components/ui/primitives";

interface DraftPost {
  id?: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  coverColor: string;
}

export default function AdminNewsPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [edit, setEdit] = useState<DraftPost | null>(null);
  const [del, setDel] = useState<NewsPost | null>(null);
  const [catName, setCatName] = useState("");

  const load = async () => {
    const [p, c] = await Promise.all([
      api.get<NewsPost[]>("/news").catch(() => []),
      api.get<NewsCategory[]>("/news/categories").catch(() => []),
    ]);
    setPosts(p);
    setCategories(c);
  };

  useEffect(() => {
    load();
  }, []);

  const cats = categories.filter((c) => !c.archived).map((c) => c.name);

  const save = async (status: "draft" | "published") => {
    if (!edit || !edit.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    try {
      const payload = { ...edit, status };
      if (edit.id) {
        await api.patch(`/news/${edit.id}`, payload);
      } else {
        await api.post("/news", payload);
      }
      toast(status === "published" ? "Published" : "Draft saved");
      setEdit(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to save post", "error");
    }
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    try {
      await api.post("/news/categories", { name: catName.trim() });
      setCatName("");
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to add category", "error");
    }
  };

  const removePost = async () => {
    if (!del) return;
    try {
      await api.delete(`/news/${del.id}`);
      toast("Post deleted");
      setDel(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete post", "error");
    }
  };

  if (edit) {
    return (
      <div>
        <AdminHead
          title={edit.id ? "Edit post" : "New post"}
          right={
            <Btn variant="ghost" onClick={() => setEdit(null)}>
              Back
            </Btn>
          }
        />
        <Card pad={22} className="max-w-[820px]">
          <div className="flex flex-col gap-4">
            <Field label="Title" req>
              <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </Field>
            <div className="nrv-grid-3">
              <Field label="Category">
                <Select
                  value={edit.category}
                  onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                  options={cats}
                />
              </Field>
            </div>
            <Field label="Excerpt">
              <TextArea rows={2} value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} />
            </Field>
            <Field label="Body (markdown: ## heading, **bold**, - list, > quote)">
              <TextArea rows={12} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
            </Field>
            <div className="flex gap-2.5 items-center flex-wrap">
              <Btn onClick={() => save("published")}>Publish</Btn>
              <Btn variant="ghost" onClick={() => save("draft")}>
                Save draft
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <AdminHead
        title="News"
        sub="Draft and Published only. Every save stamps who last edited it."
        right={
          <Btn
            onClick={() =>
              setEdit({ title: "", category: cats[0] || "", excerpt: "", body: "", coverColor: "#23253A" })
            }
          >
            + New post
          </Btn>
        }
      />
      <Card pad={0} className="mb-6.5" style={{ marginBottom: 26 }}>
        <Table
          cols={[
            { h: "Title", render: (p: NewsPost) => <span className="text-[#E6E6E6]">{p.title}</span> },
            {
              h: "Category",
              render: (p: NewsPost) => <Pill color="#888BA0">{p.category?.name ?? "—"}</Pill>,
            },
            {
              h: "Last edited",
              render: (p: NewsPost) => (
                <span className="text-[10px] text-[#555]">
                  {p.lastEditedBy?.name ?? "—"} · {fmtDT(p.lastEditedAt)}
                </span>
              ),
            },
            { h: "Status", render: (p: NewsPost) => <Pill>{p.status}</Pill> },
            {
              h: "",
              right: true,
              render: (p: NewsPost) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDel(p);
                  }}
                  className="bg-transparent border border-[rgba(248,113,113,0.35)] text-[#f87171] font-mono text-[9px] tracking-[1px] px-2.5 py-1 cursor-pointer uppercase"
                >
                  Delete
                </button>
              ),
            },
          ]}
          rows={posts}
          keyFn={(p) => p.id}
          onRowClick={(p) =>
            setEdit({
              id: p.id,
              title: p.title,
              category: p.category?.name ?? "",
              excerpt: p.excerpt ?? "",
              body: p.body,
              coverColor: p.coverColor ?? "#23253A",
            })
          }
        />
      </Card>
      <Card pad={20} className="max-w-[560px]">
        <div className="font-mono text-[9px] tracking-[3px] text-[#555] uppercase mb-3.5">
          Categories (staff-managed)
        </div>
        <div className="flex gap-2 flex-wrap mb-3.5">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[1px] px-2.5 py-1.5 border border-[rgba(126,130,172,0.3)]"
              style={{ color: c.archived ? "#444" : "#BFC2DE", textDecoration: c.archived ? "line-through" : "none" }}
            >
              {c.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2.5">
          <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category" className="flex-1" />
          <Btn variant="ghost" onClick={addCategory}>
            Add
          </Btn>
        </div>
      </Card>
      <ConfirmModal
        open={!!del}
        title="Delete post"
        confirmLabel="Delete post"
        body={del && `Delete "${del.title}"? It is removed from the public site immediately.`}
        onCancel={() => setDel(null)}
        onConfirm={removePost}
      />
    </div>
  );
}
