import { apiGet } from "@/lib/api-server";
import type { NrvEvent, Rulebook } from "@/lib/types";
import { PageShell } from "@/components/nav";
import { RegisterForm } from "@/components/register/register-form";

export const revalidate = 30;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const [events, rulebook] = await Promise.all([
    apiGet<NrvEvent[]>("/events"),
    apiGet<Rulebook>("/rulebook"),
  ]);

  return (
    <PageShell>
      <RegisterForm
        events={events ?? []}
        rulebookVersion={rulebook?.version ?? ""}
        initialEventId={event}
      />
    </PageShell>
  );
}
