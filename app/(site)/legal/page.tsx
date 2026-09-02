import { PageShell } from "@/components/nav";
import { PageHead, Card } from "@/components/ui/primitives";

export default function LegalPage() {
  return (
    <PageShell>
      <PageHead kicker="Legal" title="Terms & Privacy" />
      <Card pad={28} className="max-w-[720px]">
        <div className="font-mono text-[12px] text-[#888BA0] leading-[1.9]">
          Terms of Service and Privacy Policy copy is a{" "}
          <span className="text-[#fbbf24]">launch blocker</span> pending final language from NRV.
          The product collects accounts, photos, and Discord identities — real legal copy is
          required before public launch.
          <br />
          <br />
          This page reserves the route so the footer link, registration consent checkbox, and
          signup flow all point somewhere real from day one.
        </div>
      </Card>
    </PageShell>
  );
}
