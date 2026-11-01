import Link from "next/link";
import { PixelEdge } from "@/components/PixelEdge";
import { PillarTabs } from "@/components/PillarTabs";
import { ServicesHeroVisual } from "@/components/ServicesHeroVisual";
import { ProductVisual } from "@/components/ProductVisual";
import { ButtonLink, Section, SectionHeader } from "@/components/ui";
import { ENGAGEMENT_DETAIL, ENGAGEMENT_STEPS, PILLARS, SERVICES, TECH_GROUPS, TRUST_STATS } from "@/content/services";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/content/site";
import { getTestimonials } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Engineering Services", "Software engineering, AI/ML, cloud and DevOps, UI/UX, data engineering, cybersecurity and digital transformation from DeboisTech.", "/services");

const product = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
const dot = <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-brand-logo" />;

export default async function ServicesPage() {
  const testimonials = await getTestimonials();
  return (
    <>
      {/* hero: compact, one idea, one clear action */}
      <section aria-labelledby="services-h" className="border-b border-line bg-paper">
        <div className="container-x grid grid-cols-1 items-center gap-10 pb-12 pt-10 sm:pb-20 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="mb-4 text-base font-semibold text-brand-text">Services</p>
            <h1 id="services-h" className="display text-4xl sm:text-6xl lg:text-7xl">Our Services</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:mt-7 sm:text-xl">Technology solutions that solve real business problems. Not feature lists — outcomes you can measure.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact?intent=project" event="service_cta_click" eventProps={{ cta_id: "hero_discuss" }}>Discuss your project</ButtonLink>
              <ButtonLink href="#process" variant="secondary">See how we work</ButtonLink>
            </div>
          </div>
          <ServicesHeroVisual className="hidden h-auto w-full max-w-md justify-self-end lg:block" />
        </div>
      </section>

      {/* pillars: the way in. Each lists its services and jumps to them. */}
      <Section labelledBy="pillars-h" className="!pt-10 sm:!pt-16">
        <h2 id="pillars-h" className="sr-only">Our services by what they do for you</h2>
        <dl aria-label="DeboisTech at a glance" className="mb-12 grid grid-cols-1 gap-6 border-b border-line pb-10 sm:mb-16 sm:grid-cols-3">
          {TRUST_STATS.map((t) => <div key={t.label} className="flex flex-col"><dt className="order-2 text-muted">{t.label}</dt><dd className="display text-4xl text-ink sm:text-5xl">{t.value}</dd></div>)}
        </dl>
        <ol className="grid grid-cols-1 gap-0 lg:grid-cols-3 lg:divide-x lg:divide-line">
          {PILLARS.map((pl, i) => (
            <li key={pl.id} className="group border-t border-line py-8 first:border-t-0 lg:border-t-0 lg:px-8 lg:py-2 lg:first:pl-0 lg:last:pr-0">
              <span className="font-mono text-sm text-brand-text">0{i + 1}</span>
              <p className="display mt-2 text-5xl uppercase transition-colors group-hover:text-brand-text sm:text-6xl lg:text-5xl xl:text-6xl"><a href={`#pillar-${pl.id}`} className="outline-offset-4">{pl.name}</a></p>
              <p className="mt-3 max-w-xs text-lg text-muted">{pl.line}</p>
              <ul className="mt-6 space-y-1">
                {SERVICES.filter((s) => s.pillar === pl.id).map((s) => (
                  <li key={s.slug}>
                    <a href={`#svc-${s.slug}`} className="group/l flex min-h-11 items-center justify-between gap-3 border-b border-line py-2 font-semibold transition-colors hover:border-brand-text hover:text-brand-text">
                      {s.name}<span aria-hidden className="text-brand-text transition-transform group-hover/l:translate-x-1">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="details-h" className="!pt-10 sm:!pt-16">
        <h2 id="details-h" className="sr-only">Service details</h2>
        <PillarTabs
          serviceToPillar={Object.fromEntries(SERVICES.map((s) => [s.slug, s.pillar]))}
          tabs={PILLARS.map((pl) => ({ id: pl.id, name: pl.name, line: pl.line, count: SERVICES.filter((s) => s.pillar === pl.id).length, panel: (
          <div>
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {SERVICES.filter((s) => s.pillar === pl.id).sort((x, y) => Number(!!product(y.proof?.product ?? "")?.visual) - Number(!!product(x.proof?.product ?? "")?.visual)).map((s) => {
                const proof = s.proof ? product(s.proof.product) : undefined;
                const wide = !!proof?.visual; // a real diagram needs the full row
                const lists = (
                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div><p className="text-sm font-semibold">What we deliver</p><ul className="mt-2 space-y-1.5 text-[15px]">{s.deliverables.map((d) => <li key={d} className="flex gap-2.5 text-muted">{dot}{d}</li>)}</ul></div>
                    <div><p className="text-sm font-semibold">What changes for you</p><ul className="mt-2 space-y-1.5 text-[15px]">{s.outcomes.map((d) => <li key={d} className="flex gap-2.5 text-muted">{dot}{d}</li>)}</ul></div>
                  </div>
                );
                const text = (
                  <>
                    <h4 id={`h-${s.slug}`} className="display text-2xl sm:text-3xl">{s.name}</h4>
                    <p className="mt-2 text-muted">{s.short}</p>
                    <div className="mt-4 space-y-3 text-[15px]">
                      <p><span className="font-semibold">The problem. </span><span className="text-muted">{s.problem}</span></p>
                      <p><span className="font-semibold">How we approach it. </span><span className="text-muted">{s.approach}</span></p>
                    </div>
                    {lists}
                    <ul aria-label="Built with" className="mt-5 flex flex-wrap gap-2">{s.tech.map((t) => <li key={t} className="rounded-full border border-line-strong px-3 py-1 text-sm text-ink">{t}</li>)}</ul>
                  </>
                );
                const ctas = (
                  <div className="mt-6 flex flex-wrap gap-3 pt-1">
                    <ButtonLink href={`/contact?intent=project&topic=${s.slug}`} event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "detail_enquire" }}>Discuss {s.name}</ButtonLink>
                    <ButtonLink href={`/services/${s.slug}`} variant="secondary" event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "detail_learn_more" }}>Learn more</ButtonLink>
                  </div>
                );
                return (
                  <article key={s.slug} id={`svc-${s.slug}`} aria-labelledby={`h-${s.slug}`}
                           className={`flex flex-col rounded-[var(--radius)] border border-line p-6 transition-colors hover:border-brand-text sm:p-7 ${wide ? "lg:col-span-2" : ""}`}>
                    {wide && proof && s.proof ? (
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
                        <div className="flex flex-col">{text}<div className="mt-auto">{ctas}</div></div>
                        <div className="self-center">
                          <ProductVisual product={proof} fit />
                          <p className="mt-3 text-sm text-muted">{s.proof.note} <Link href={`/products/${proof.slug}`} className="font-semibold text-brand-text underline underline-offset-4">See {proof.name}</Link></p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {text}
                        {proof && s.proof && <p className="mt-5 text-sm text-muted">{s.proof.note} <Link href={`/products/${proof.slug}`} className="font-semibold text-brand-text underline underline-offset-4">See {proof.name}</Link></p>}
                        <div className="mt-auto">{ctas}</div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
          ) }))}
        />
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section labelledBy="process-h" id="process">
        <SectionHeader id="process-h" title="How an engagement runs" lead="Every project moves through the same five phases, scaled to the size of the work." />
        <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-6">
          {ENGAGEMENT_STEPS.map((step, i) => (
            <li key={step} className="relative pl-14 lg:pl-0 lg:pt-14">
              <span className="absolute left-0 top-0 grid size-9 place-items-center bg-glow font-mono text-sm font-bold text-forest">{i + 1}</span>
              {i < ENGAGEMENT_STEPS.length - 1 && <span aria-hidden className="absolute left-[17px] top-9 h-[calc(100%-2.25rem+2rem)] w-px bg-line-strong lg:left-9 lg:top-[17px] lg:h-px lg:w-[calc(100%-2.25rem+1.5rem)]" />}
              <h3 className="text-xl font-bold">{step}</h3>
              <p className="mt-1 text-muted">{ENGAGEMENT_DETAIL[step]}</p>
            </li>
          ))}
        </ol>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="tech-h">
        <SectionHeader id="tech-h" title="Tech we use" lead="The tools behind the products we build and the systems we deliver." />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-5">
          {TECH_GROUPS.map((g) => (
            <div key={g.name}>
              <dt className="border-b border-line pb-2 font-semibold">{g.name}</dt>
              <dd><ul className="mt-3 space-y-2">{g.items.map((t) => <li key={t} className="flex gap-2.5 text-muted">{dot}{t}</li>)}</ul></dd>
            </div>
          ))}
        </dl>
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      {testimonials.length > 0 && (
        <>
          <Section labelledBy="voices-h">
            <SectionHeader id="voices-h" title="What clients say" />
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">{testimonials.map((t) => (
              <li key={t.id} className="flex flex-col border-l-2 border-brand-logo py-1 pl-6">
                <blockquote className="whitespace-pre-line break-words text-lg leading-relaxed">“{t.quote}”</blockquote>
                <p className="mt-auto pt-5 font-semibold">{t.name}</p>
                {(t.role || t.company) && <p className="text-sm text-muted">{[t.role, t.company].filter(Boolean).join(", ")}</p>}
              </li>))}</ul>
          </Section>
        </>
      )}

      <section aria-labelledby="cta-h" className="bg-paper pb-16 pt-6 sm:pb-28">
        <div className="container-x">
          <h2 id="cta-h" className="display max-w-4xl text-5xl sm:text-7xl">Have a problem worth solving?</h2>
          <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">Tell us what you’re building, scaling or improving. Let’s figure out the right way forward.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/contact?intent=project" event="service_cta_click" eventProps={{ cta_id: "final_discuss" }}>Discuss your project</ButtonLink>
            {SITE.bookingUrl && <ButtonLink href={SITE.bookingUrl} variant="secondary">Book a call</ButtonLink>}
            <span className="text-muted">We reply within {SITE.responseTime}.</span>
          </div>
        </div>
      </section>
      <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
