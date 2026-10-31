import Image from "next/image";
import { PixelEdge } from "@/components/PixelEdge";
import Link from "next/link";
import { ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { TRACKS, TEP_INTRO } from "@/content/tep";
import { LABS } from "@/content/labs";
import type { DbProgram, WithId } from "@/content/dynamic";
import { getPrograms, imageUrl } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Program", "DeboisTech's programs for engineers who want production skills: the Technology Excellence Program, plus current, upcoming and past programs.", "/program");

const facts = (p: DbProgram) => [["Starts", p.startDate], ["Ends", p.endDate], ["Duration", p.duration], ["Fee", p.fee]].filter(([, v]) => v) as [string, string][];

function Paragraphs({ text }: { text?: string }) {
  return <>{(text ?? "").split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((t, i) => <p key={i} className="mt-3 max-w-2xl text-muted">{t}</p>)}</>;
}

function ProgramCard({ p }: { p: WithId<DbProgram> }) {
  const f = facts(p);
  return (
    <li className="grid grid-cols-1 gap-6 border-t-2 border-ink pt-6 sm:grid-cols-[auto_1fr]">
      {p.imageId ? <Image src={imageUrl(p.imageId)} alt="" width={160} height={160} unoptimized className="size-28 rounded-[var(--radius)] border border-line object-cover sm:size-40" /> : null}
      <div className={p.imageId ? "" : "sm:col-span-2"}>
        <h3 className="text-2xl font-extrabold">{p.title}</h3>
        <p className="mt-2 max-w-2xl text-muted">{p.summary}</p>
        <Paragraphs text={p.details} />
        {f.length > 0 && <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">{f.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
        {p.applyUrl && <div className="mt-5"><ButtonLink href={p.applyUrl} variant="secondary">{p.status === "past" ? "Read more" : "Learn more"}</ButtonLink></div>}
      </div>
    </li>
  );
}

export default async function ProgramPage() {
  const programs = await getPrograms();
  const flagship = programs?.find((p) => p.flagship);
  const others = (programs ?? []).filter((p) => !p.flagship);
  const sections: [string, string, WithId<DbProgram>[]][] = [
    ["Running now", "Current programs.", others.filter((p) => p.status === "current")],
    ["Coming up", "Upcoming programs.", others.filter((p) => p.status === "upcoming")],
    ["Archive", "Past programs.", others.filter((p) => p.status === "past")],
  ];
  const f = flagship ? facts(flagship) : [];
  return (
    <>
      <PageHero eyebrow="Program" title="Learn with DeboisTech." lead="Mentor-led, project-based learning for engineers who want production skills, not tutorials." />
      <PixelEdge from="var(--paper)" to="#ffffff" />

      <Section theme="white" labelledBy="programs">
        <SectionHeader id="programs" title="Our flagship program." lead="The Technology Excellence Program is where most of our teaching happens." />
        <article className="grid grid-cols-1 gap-10 border-t-2 border-ink pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-brand-text">{flagship ? STATUS[flagship.status] : "Flagship program"}</p>
            <h3 className="display mt-2 text-4xl sm:text-5xl">{flagship?.title ?? "Technology Excellence Program"}</h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{flagship?.summary ?? TEP_INTRO}</p>
            <Paragraphs text={flagship?.details} />
            {f.length > 0 && <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">{f.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/tep" event="tep_track_select" eventProps={{ cta_id: "program_page_tep" }}>See the program</ButtonLink>
              <ButtonLink href={flagship?.applyUrl ?? "/contact?intent=tep"} variant="secondary">{flagship?.applyUrl ? "Apply" : "Enquire about TEP"}</ButtonLink>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold">Tracks</h4>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {TRACKS.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tep/${t.slug}`} className="group flex min-h-16 items-center justify-between gap-4 py-4">
                    <span><span className="block font-semibold">{t.name}</span><span className="block text-sm text-muted">{t.audience}</span></span>
                    <span aria-hidden className="text-xl text-brand-text transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            {!f.length && <p className="mt-3 text-sm text-muted">Dates, fees and availability change by cohort. We confirm them when you enquire.</p>}
          </div>
        </article>
      </Section>

      <PixelEdge from="#ffffff" to="var(--wash)" />
      {sections.filter(([, , rows]) => rows.length).map(([eyebrow, title, rows], i) => (
        <Section key={title} theme={i % 2 ? "light" : "mint"} labelledBy={`p-${i}`}>
          <SectionHeader id={`p-${i}`} eyebrow={eyebrow} title={title} />
          <ul className="space-y-10">{rows.map((p) => <ProgramCard key={p.id} p={p} />)}</ul>
        </Section>
      ))}

      <Section theme="mint" labelledBy="practice">
        <SectionHeader id="practice" title="Practise alongside." lead="Debo Labs is our hands-on DevOps platform. Every lab runs in a real terminal and is graded on what actually happened in your sandbox." />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/labs">About Debo Labs</ButtonLink>
          <ButtonLink href={LABS.startUrl} variant="secondary">Start the first lab</ButtonLink>
        </div>
      </Section>
    </>
  );
}

const STATUS = { current: "Flagship program · running now", upcoming: "Flagship program · upcoming", past: "Flagship program" } as const;
