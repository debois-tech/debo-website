import { ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { PixelEdge } from "@/components/PixelEdge";
import { TeamCarousel } from "@/components/TeamCarousel";
import { CultureGallery } from "@/components/CultureGallery";
import { CommunityIntro, CommunityMore } from "@/components/CommunitySection";
import { CommunityGallery, getGalleryItems } from "@/components/CommunityGallery";
import { ENGAGEMENT_STEPS } from "@/content/services";
import { PRINCIPLES } from "@/content/team";
import { SITE } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import { getTeam } from "@/lib/content";

export const metadata = pageMeta("Company", "DeboisTech IT Solutions LLP is a technology company in Nashik, India, building software, AI and cloud systems, products and training programs.", "/company");

export default async function CompanyPage() {
  const [team, gallery] = await Promise.all([getTeam(), getGalleryItems()]);
  return (
    <>
      <PageHero eyebrow="Company" title="Engineering modern solutions, AI and cloud platforms" lead={`${SITE.legalName} is based in ${SITE.location}. We serve clients across India and internationally, remotely and through online delivery.`} />
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="does">
        <SectionHeader id="does" title="What we do" />
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-muted">
          <li><h3 className="font-bold text-ink">Client engineering</h3>Software, AI/ML, cloud and DevOps, UI/UX, data, security and digital transformation, delivered with client teams.</li>
          <li><h3 className="font-bold text-ink">Our own products</h3>Debo Labs, MotoAdmin and TenantPlane.</li>
          <li><h3 className="font-bold text-ink">Open source</h3>TenantPlane is open source under the Apache 2.0 licence.</li>
          <li><h3 className="font-bold text-ink">Training</h3>The Technology Excellence Program, and Debo Labs for hands-on DevOps practice.</li>
        </ul>

        <div className="mt-16 sm:mt-24">
          <SectionHeader id="principles" title="How we work" lead="The values we work by, and the five phases a typical project moves through." />
          <ul className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">{PRINCIPLES.map((p) => <li key={p.title}><h3 className="font-bold">{p.title}</h3><p className="text-muted">{p.body}</p></li>)}</ul>
          <ol className="flex flex-wrap gap-3">{ENGAGEMENT_STEPS.map((s, i) => <li key={s} className="rounded-full border border-brand-text/40 bg-forest-2 px-4 py-2 text-sm font-semibold"><span className="font-mono text-xs text-brand-text">{i + 1}</span> {s}</li>)}</ol>
        </div>
      </Section>
      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section labelledBy="team">
        <SectionHeader id="team" title="The team" />
        <TeamCarousel members={team ?? undefined} />
        <CultureGallery headingLevel={3} />
      </Section>
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="community">
        <CommunityIntro headingId="community" />
        {gallery.length === 0 && (
          <div className="mt-16 sm:mt-24">
            <CommunityMore><ButtonLink href="/careers" variant="secondary">Careers</ButtonLink></CommunityMore>
          </div>
        )}
      </Section>
      {gallery.length > 0 && (
        <>
          {/* photos and stories share one dark section, so the page has a single break instead of two */}
          <PixelEdge from="#ffffff" to="var(--paper)" />
          <Section id="gallery" labelledBy="gallery-h">
            <SectionHeader id="gallery-h" title="People. Ideas. Experiences." lead="A glimpse into the communities, conversations and experiences we’re proud to be part of." />
            <CommunityGallery items={gallery} />
            <div className="mt-16 sm:mt-24"><CommunityMore><ButtonLink href="/careers" variant="secondary">Careers</ButtonLink></CommunityMore></div>
          </Section>
          <PixelEdge from="var(--paper)" to="#ffffff" />
        </>
      )}
    </>
  );
}
