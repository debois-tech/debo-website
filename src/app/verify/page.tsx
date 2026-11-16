import { PixelEdge } from "@/components/PixelEdge";
import { Section, PageHero } from "@/components/ui";
import { VerifyForm } from "@/components/VerifyForm";
import { VERIFY_PAGE } from "@/content/verify";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Verify a document", "Check that a DeboisTech badge, internship certificate or offer letter is genuine.", "/verify");

export default function VerifyPage() {
  return (
    <>
      <PageHero eyebrow={VERIFY_PAGE.eyebrow} title={VERIFY_PAGE.title} lead={VERIFY_PAGE.lead} />
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="verify">
        <h2 id="verify" className="sr-only">{VERIFY_PAGE.srHeading}</h2>
        <VerifyForm />
      </Section>
    </>
  );
}
