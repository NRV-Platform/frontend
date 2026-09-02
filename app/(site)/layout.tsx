import { MVPNav, MVPFooter } from "@/components/nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MVPNav />
      <div className="flex-1">{children}</div>
      <MVPFooter />
    </>
  );
}
