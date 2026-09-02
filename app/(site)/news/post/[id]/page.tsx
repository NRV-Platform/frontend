import Link from "next/link";
import { apiGet } from "@/lib/api-server";
import type { NewsPost } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { Pill, Md, Empty, fmtD } from "@/components/ui/primitives";

export const revalidate = 30;

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await apiGet<NewsPost[]>("/news");
  const p = (news ?? []).find((x) => String(x.id) === id);

  if (!p || p.status !== "published") {
    return (
      <PageShell>
        <Empty label="Post not found" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-[760px] mx-auto">
        <Link
          href="/news"
          className="font-mono text-[10px] text-[#888BA0] tracking-[2px] uppercase no-underline"
        >
          ← All news
        </Link>
        <div className="my-5" style={{ margin: "22px 0 10px" }}>
          <Pill color="#BFC2DE">{p.category?.name ?? "News"}</Pill>
        </div>
        <h1
          className="nrv-display text-[#E6E6E6] leading-none"
          style={{ fontSize: "clamp(28px,4.5vw,44px)", margin: "0 0 14px" }}
        >
          {p.title}
        </h1>
        <div className="font-mono text-[10px] text-[#555] tracking-[1px] uppercase mb-7">
          {p.author?.name ?? "NRV Staff"} · {fmtD(p.publishedAt ?? p.createdAt)}
          {p.readTime ? ` · ${p.readTime} min read` : ""}
        </div>
        <div
          className="h-[200px] mb-3"
          style={{
            background: `linear-gradient(135deg, ${p.coverColor ?? "#23253A"} 0%, #0B0B0E 130%)`,
          }}
        />
        <Md text={p.body} />
      </div>
    </PageShell>
  );
}
