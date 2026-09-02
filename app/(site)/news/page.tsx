import { apiGet } from "@/lib/api-server";
import type { NewsCategory, NewsPost } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { PageHead, Empty } from "@/components/ui/primitives";
import { NewsCard } from "@/components/news/news-card";
import { NewsFilters } from "@/components/news/news-filters";

export const revalidate = 30;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [news, categories] = await Promise.all([
    apiGet<NewsPost[]>("/news"),
    apiGet<NewsCategory[]>("/news/categories"),
  ]);

  const cats = ["All", ...(categories ?? []).filter((c) => !c.archived).map((c) => c.name)];
  const activeCat = category || "All";
  const posts = (news ?? []).filter(
    (p) => p.status === "published" && (activeCat === "All" || p.category?.name === activeCat)
  );

  return (
    <PageShell>
      <PageHead kicker="Newsroom" title="News" />
      <NewsFilters cats={cats} active={activeCat} />
      <div className="nrv-grid-3">
        {posts.map((p) => (
          <NewsCard key={p.id} post={p} />
        ))}
      </div>
      {posts.length === 0 && <Empty label="No posts in this category" />}
    </PageShell>
  );
}
