import { notFound } from "next/navigation";
import { PixelEdge } from "@/components/PixelEdge";
import { Breadcrumb, ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { getTrack, TRACKS } from "@/content/tep";
import { pageMeta } from "@/lib/seo";
import { getPrograms } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => TRACKS.map((t) => ({ track: t.slug }));

export async function generateMetadata({ params }: PageProps<"/tep/[track]">) {
  const t = getTrack((await params).track);
  return t ? pageMeta(`${t.name} track`, `${t.name} track of the DeboisTech Technology Excellence Program. ${t.summary}`.slice(0, 300), `/tep/${t.slug}`) : {};
}

export default async function TrackPage({ params }: PageProps<"/tep/[track]">) {
  const t = getTrack((await params).track);
  if (!t) notFound();
  const flagship = (await getPrograms())?.find((p) => p.flagship);
  const cohort = flagship ? ([["Starts", flagship.startDate], ["Ends", flagship.endDate], ["Duration", flagship.duration], ["Fee", flagship.fee]].filter(([, v]) => v) as [string, string][]) : [];
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Program", href: "/program" }, { label: "TEP", href: "/tep" }, { label: t.name }]} />
      <PageHero eyebrow="TEP track" title={t.name} lead={t.summary}>
        <ButtonLink dark href={`/contact?intent=tep&track=${t.slug}`} event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "apply" }}>Enquire or apply</ButtonLink>
      </PageHero>
      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" className="!pt-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="space-y-8">
            <div><h2 className="text-2xl font-extrabold">Who it’s for</h2><p className="mt-2 text-muted">{t.audience}</p></div>
            <div><h2 className="text-2xl font-extrabold">Format</h2><ul className="mt-2 list-disc pl-5 text-muted">{t.format.map((f) => <li key={f}>{f}</li>)}</ul></div>
          </div>
          <div><h2 className="text-2xl font-extrabold">What you’ll cover</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-muted">{t.topics.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      </Section>
      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section theme="mint" labelledBy="cohort">
        <SectionHeader id="cohort" title="Current cohort details" lead={cohort.length ? "Details for the current Technology Excellence Program cohort:" : "We don’t publish dates or fees on this page because they change by cohort. Ask us and we’ll confirm:"} />
        {cohort.length > 0 ? (
          <dl className="mb-8 flex flex-wrap gap-x-12 gap-y-4">{cohort.map(([k, v]) => <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}</dl>
        ) : (
          <ul className="mb-6 list-disc pl-5 text-muted">{t.needsConfirmation.map((x) => <li key={x}>{x}</li>)}</ul>
        )}
        <ButtonLink href={flagship?.applyUrl ?? `/contact?intent=tep&track=${t.slug}`}>{flagship?.applyUrl ? "Apply" : "Ask about the current cohort"}</ButtonLink>
      </Section>
      <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
