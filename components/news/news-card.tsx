"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NewsPost } from "@/lib/types";
import { Pill, fmtD } from "@/components/ui/primitives";

export function NewsCard({ post }: { post: NewsPost }) {
  const router = useRouter();
  const [h, setH] = useState(false);
  const cover = post.coverColor ?? "#23253A";
  return (
    <div
      onClick={() => router.push(`/news/post/${post.id}`)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="bg-[rgba(14,14,14,0.85)] cursor-pointer transition-colors flex flex-col"
      style={{ border: `1px solid ${h ? "rgba(126,130,172,0.6)" : "rgba(126,130,172,0.3)"}` }}
    >
      <div
        className="h-[110px] flex items-end p-3.5"
        style={{ background: `linear-gradient(135deg, ${cover} 0%, #0B0B0E 130%)` }}
      >
        <Pill color="#E6E6E6">{post.category?.name ?? "News"}</Pill>
      </div>
      <div className="p-4.5 flex flex-col gap-2.5 flex-1" style={{ padding: 18 }}>
        <div
          className="font-display font-extrabold text-[17px] text-[#E6E6E6] uppercase"
          style={{ letterSpacing: "0.5px", lineHeight: 1.25 }}
        >
          {post.title}
        </div>
        <div className="font-mono text-[11px] text-[#888BA0] leading-[1.7] flex-1">
          {post.excerpt}
        </div>
        <div className="font-mono text-[9px] text-[#444] tracking-[1px] uppercase">
          {fmtD(post.publishedAt ?? post.createdAt)}
          {post.readTime ? ` · ${post.readTime} min read` : ""}
        </div>
      </div>
    </div>
  );
}
