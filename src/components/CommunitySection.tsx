import type { ReactNode } from "react";
import Image from "next/image";
import { TrackedLink } from "./TrackedLink";
import Link from "next/link";
import { BUILD_WALL, COMMUNITY_CTA, COMMUNITY_EYEBROW, COMMUNITY_HEADLINE, COMMUNITY_LEAD, COMMUNITY_STORIES, CONTRIBUTIONS, IMPACT_METRICS, PARTNERS, SHOW_PLACEHOLDERS } from "@/content/community";
import { CommunityStoryCard } from "./CommunityStoryCard";
import { InView } from "./InView";
import { ButtonLink, SectionHeader } from "./ui";

/** Community work as an editorial page: impact, how we contribute (this part), then the photo gallery, then stories and a call to collaborate. Content: src/content/community.ts. */
export function CommunityIntro({ headingId = "community" }: { headingId?: string }) {
  const metrics = IMPACT_METRICS.filter((m) => m.value || SHOW_PLACEHOLDERS);
  return (
    <>
      <SectionHeader id={headingId} eyebrow={COMMUNITY_EYEBROW} title={COMMUNITY_HEADLINE} lead={COMMUNITY_LEAD} />

      {/* impact strip: verified figures only */}
      {IMPACT_METRICS.some((m) => m.value) || SHOW_PLACEHOLDERS ? (
        <InView>
          <dl aria-label="Community impact" className={`reveal grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 ${({ 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" } as Record<number, string>)[metrics.length] ?? "lg:grid-cols-4"}`}>
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="order-2 mt-1 text-muted">{m.label}</dt>
                {m.value ? <dd className="display text-5xl text-brand-text sm:text-6xl">{m.value}{m.note && <span className="sr-only"> ({m.note})</span>}</dd>
                  : <dd className="text-sm text-muted">Add a verified figure in content/community.ts</dd>}
                {m.value && m.note && <p aria-hidden className="order-3 text-xs text-muted">{m.note}</p>}
              </div>
            ))}
          </dl>
        </InView>
      ) : null}

      {/* partners and affiliations */}
      <InView>
        <div className="reveal mt-10 sm:mt-14">
          <h3 className="text-xl font-bold sm:text-2xl">Partners and affiliations</h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            {PARTNERS.map((pt) => (
              <li key={pt.name} className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-paper transition-colors hover:border-brand-text">
                <div className="light-surface grid h-28 place-items-center bg-white px-5 py-2 sm:h-32">
                  {pt.logo
                    ? <Image src={pt.logo.src} alt={pt.logo.alt} width={pt.logo.width} height={pt.logo.height} className="h-auto max-h-[5.25rem] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04] sm:max-h-24" />
                    : <span className="text-center text-lg font-semibold leading-tight text-black sm:text-xl">{pt.name}</span>}
                </div>
                <div className="p-3 sm:p-4">
                  <p className="sr-only">{pt.name}. </p><p className="text-sm text-muted">{pt.role}</p>
                  {pt.proof && <p className="mt-2"><TrackedLink href={pt.proof.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-text underline underline-offset-4 hover:text-ink">{pt.proof.label}</TrackedLink></p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </InView>

      {/* how we contribute */}
      <div className="mt-16 sm:mt-24">
        <h3 className="display max-w-3xl text-3xl sm:text-5xl">Beyond participation. We contribute.</h3>
        <p className="mt-3 max-w-2xl text-lg text-muted">Our involvement goes beyond attending events. We contribute our engineering expertise, time and resources to help technology communities grow.</p>
        <InView>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRIBUTIONS.map((c, i) => (
              <li key={c.title} className="reveal flex flex-col border-l-2 border-brand-logo bg-paper py-1 pl-5 pr-2 transition-colors hover:border-glow" style={{ ["--d" as string]: `${(i % 3) * 0.07}s` }}>
                <h4 className="text-xl font-bold">{c.title}</h4>
                <p className="mt-2 text-muted">{c.body}</p>
                {c.evidence && (
                  <p className="mt-auto pt-3 text-sm">
                    {c.evidence.href ? <Link href={c.evidence.href} className="font-semibold text-brand-text underline underline-offset-4">{c.evidence.text}</Link> : <span className="text-ink">{c.evidence.text}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </>
  );
}

/** Stories, build wall and the closing invitation: the part after the photo gallery. */
export function CommunityMore({ children }: { children?: ReactNode }) {
  return (
    <>
      {/* stories */}
      <div>
        <h3 id="community-stories" className="display text-3xl sm:text-5xl">Stories from the ecosystem.</h3>
        <InView>
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {COMMUNITY_STORIES.map((s, i) => <CommunityStoryCard key={s.id} story={s} index={i} total={COMMUNITY_STORIES.length} />)}
          </div>
        </InView>
      </div>

      {/* community build wall: hidden until a project is added with permission and checked links */}
      {BUILD_WALL.length > 0 && (
        <div className="mt-16 sm:mt-24">
          <h3 className="display text-3xl sm:text-4xl">Community build wall.</h3>
          <p className="mt-2 max-w-xl text-muted">Projects built in our workshops and community sessions, shared with their builders’ permission.</p>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BUILD_WALL.map((b) => (
              <li key={b.name} className="flex flex-col rounded-[var(--radius)] border border-line bg-paper p-5">
                <p className="text-lg font-bold">{b.name}</p><p className="text-sm text-muted">By {b.by}</p>
                <ul className="mt-3 flex flex-wrap gap-2">{b.tech.map((t) => <li key={t} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{t}</li>)}</ul>
                <div className="mt-auto flex gap-4 pt-4 text-sm font-semibold">
                  {b.repo && <a className="text-brand-text underline underline-offset-4" href={b.repo} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> repository for {b.name} (opens in a new tab)</span></a>}
                  {b.demo && <a className="text-brand-text underline underline-offset-4" href={b.demo} target="_blank" rel="noopener noreferrer">Live demo<span className="sr-only"> of {b.name} (opens in a new tab)</span></a>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* closing invitation */}
      <div className="mt-16 border-t border-line pt-12 sm:mt-24 sm:pt-16">
        <h3 className="display max-w-4xl text-4xl sm:text-6xl">{COMMUNITY_CTA.heading}</h3>
        <p className="mt-4 max-w-2xl text-lg text-muted">{COMMUNITY_CTA.body}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href="/contact?intent=partnership" event="hero_cta_click" eventProps={{ cta_id: "community_collaborate" }}>Collaborate with DeboisTech</ButtonLink>
          <ButtonLink href="/work" variant="secondary">Explore our work</ButtonLink>
          {children}
        </div>
      </div>
    </>
  );
}
