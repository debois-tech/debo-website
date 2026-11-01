import { notFound } from "next/navigation";
import { PixelEdge } from "@/components/PixelEdge";
import { Breadcrumb, ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { getService, SERVICES } from "@/content/services";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => SERVICES.map((s) => ({ service: s.slug }));

export async function generateMetadata({ params }: PageProps<"/services/[service]">) {
  const s = getService((await params).service);
  return s ? pageMeta(s.name, `${s.name} at DeboisTech. ${s.short} ${s.problem}`, `/services/${s.slug}`) : {};
}

export default async function ServicePage({ params }: PageProps<"/services/[service]">) {
  const s = getService((await params).service);
  if (!s) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: s.name }]} />
      <PageHero eyebrow="Service" title={s.name} lead={s.short}>
        <ButtonLink dark href={`/contact?intent=project&topic=${s.slug}`} event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "hero_enquire" }}>Discuss {s.name}</ButtonLink>
      </PageHero>
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" className="!pt-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div><h2 className="text-2xl font-extrabold">Who it’s for</h2><p className="mt-2 text-muted">{s.audience}</p></div>
            <div><h2 className="text-2xl font-extrabold">The problem</h2><p className="mt-2 text-muted">{s.problem}</p></div>
          </div>
          <div>
            <SectionHeader title="Typical deliverables" />
            <ul className="list-disc space-y-2 pl-5 text-muted">{s.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="mt-6 text-sm text-muted">Engagements begin with a conversation about your goals, constraints and timeline.</p>
          </div>
        </div>
      </Section>
      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section theme="mint" labelledBy="next-h">
        <SectionHeader id="next-h" title={`Talk to us about ${s.name}.`} lead="Tell us what you’re building or what isn’t working. We’ll reply with the right next step." />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/contact?intent=project&topic=${s.slug}`} event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "closing_enquire" }}>Start a conversation</ButtonLink>
          <ButtonLink href="/services" variant="secondary">All services</ButtonLink>
        </div>
      </Section>
      <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
