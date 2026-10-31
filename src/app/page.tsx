import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { EcosystemScene } from "@/components/EcosystemScene";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ProductSlide } from "@/components/ProductSlide";
import { ServicesExplorer } from "@/components/ServicesExplorer";
import { TepJourney } from "@/components/TepJourney";
import { TeamCarousel } from "@/components/TeamCarousel";
import { CultureGallery } from "@/components/CultureGallery";
import { PixelEdge } from "@/components/PixelEdge";
import { AboutScene } from "@/components/AboutScene";
import { ButtonLink, Section, SectionHeader } from "@/components/ui";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/content/site";
import { Reveal } from "@/components/InView";
import { getTeam } from "@/lib/content";
import { TEP_INTRO } from "@/content/tep";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

const orgJsonLd = {
  "@context": "https://schema.org", "@type": "Organization",
  name: SITE.name, legalName: SITE.legalName, url: SITE.url,
  logo: `${SITE.url}/icon.png`, email: SITE.email, telephone: SITE.phone,
  address: { "@type": "PostalAddress", addressLocality: "Nashik", addressRegion: "Maharashtra", addressCountry: "IN" },
  sameAs: [SITE.social.linkedin, SITE.social.github, SITE.social.instagram],
};

export default async function HomePage() {
  const team = await getTeam();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />
      <Hero />

      <AboutScene />

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="eco">
        <SectionHeader id="eco" title="Three ways into DeboisTech." lead="Products we build, engineering we deliver for clients, and a program that trains engineers. Pick one." />
        <EcosystemScene />
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section theme="light" labelledBy="products">
        <SectionHeader id="products" title="Three products, built in-house." lead="Open one to see how it works, then go deeper on its own page." />
        <Reveal><ProductCarousel label="DeboisTech products" slides={PRODUCTS.map((p) => ({ id: p.slug, label: p.name, node: <ProductSlide product={p} /> }))} /></Reveal>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="services">
        <SectionHeader id="services" title="What we engineer." lead="Seven capability areas. Pick one to see who it’s for and what an engagement delivers." />
        <Reveal><ServicesExplorer /></Reveal>
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section theme="light" labelledBy="team">
        <SectionHeader id="team" title="Meet the team." lead={`${SITE.legalName} works from ${SITE.location}, with clients across India and internationally, remotely.`} />
        <Reveal><TeamCarousel members={team ?? undefined} /></Reveal>
        <CultureGallery />
        <Reveal className="mt-10"><ButtonLink href="/company" variant="secondary">About the company</ButtonLink></Reveal>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="tep">
        <SectionHeader id="tep" title="Learn by building." lead={TEP_INTRO} />
        <TepJourney />
      </Section>

    </>
  );
}
