import { ButtonLink, PageHero, Section } from "@/components/ui";
import { PixelEdge } from "@/components/PixelEdge";
import { getOpenings } from "@/lib/content";
import { TrackedLink } from "@/components/TrackedLink";
import { SITE } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Careers", "Open roles at DeboisTech.", "/careers");

export default async function CareersPage() {
  const openings = await getOpenings();
  return (
    <>
      <PageHero eyebrow="Careers" title="Work with DeboisTech" lead="We’re a small engineering team in Nashik." />
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white">
        {openings.length === 0 ? (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold">No current openings</h2>
            <p className="mt-2 text-muted">We don’t have open roles listed right now. If you’d like us to keep you in mind, tell us what you do and send a link to your work.</p>
            <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/contact?intent=careers">Get in touch</ButtonLink><ButtonLink variant="secondary" href={`mailto:${SITE.email}`}>{SITE.email}</ButtonLink></div>
          </div>
        ) : (
          <ul className="grid items-start gap-6 md:grid-cols-2">{openings.map((o) => {
            const href = o.applyUrl || "/contact?intent=careers";
            return (
              <li key={o.id} className="flex flex-col rounded-[var(--radius)] border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-brand-text px-2.5 py-0.5 text-brand-text">{o.type}</span><span className="rounded-full border border-line-strong px-2.5 py-0.5 text-muted">{o.location}</span></div>
                <h2 className="mt-4 text-xl font-bold">{o.title}</h2>
                {o.summary && <p className="mt-2 whitespace-pre-line break-words text-muted">{o.summary}</p>}
                {!!o.responsibilities?.length && <><h3 className="mt-4 text-sm font-semibold uppercase tracking-wide">Responsibilities</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{o.responsibilities.map((r) => <li key={r} className="break-words">{r}</li>)}</ul></>}
                {!!o.requirements?.length && <><h3 className="mt-4 text-sm font-semibold uppercase tracking-wide">Requirements</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{o.requirements.map((r) => <li key={r} className="break-words">{r}</li>)}</ul></>}
                <TrackedLink href={href} event="career_apply_click" eventProps={{ role_slug: o.slug, destination: href }} className="mt-auto inline-block pt-6 font-semibold text-brand-text underline">Apply →</TrackedLink>
              </li>
            );
          })}</ul>
        )}
      </Section>
    </>
  );
}
