import { apiGet } from "@/lib/api-server";
import type { Rulebook } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { Empty } from "@/components/ui/primitives";
import { RulebookReader } from "@/components/rulebook/rulebook-reader";

export const revalidate = 30;

export default async function RulesPage() {
  const rb = await apiGet<Rulebook>("/rulebook");

  if (!rb) {
    return (
      <PageShell wide>
        <Empty label="Rulebook unavailable" />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <RulebookReader rulebook={rb} />
    </PageShell>
  );
}
