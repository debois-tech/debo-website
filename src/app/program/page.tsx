import Image from "next/image";
import { PixelEdge } from "@/components/PixelEdge";
import Link from "next/link";
import { ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { ApplyBar } from "@/components/ApplyBar";
import { FAQAccordion } from "@/components/FAQAccordion";
import { TRACKS, TEP_FAQ, TEP_INTRO } from "@/content/tep";
import { LABS } from "@/content/labs";
import { SITE } from "@/content/site";
import type { DbProgram, ProgramStatus, WithId } from "@/content/dynamic";
import { getAchievements, getPrograms, getTepSections, getTestimonials, imageUrl } from "@/lib/content";
import { programTiming, timingLabel, timingSort, type ProgramTiming } from "@/lib/program-status";
import { TepCareer, TepVoices } from "@/components/TepSections";
import { SHOW_PLACEHOLDERS } from "@/content/community";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Program", "DeboisTech's programs for engineers who want production skills: the Technology Excellence Program, plus running, upcoming and past programs.", "/program");

const facts = (p: DbProgram) => [["Starts", p.startDate], ["Ends", p.endDate], ["Duration", p.duration], ["Fee", p.fee]].filter(([, v]) => v) as [string, string][];
const APPLY_FALLBACK = "/contact?intent=tep";
const waLink = `${SITE.whatsapp}?text=${encodeURIComponent("Hi DeboisTech, I'd like to know more about the Technology Excellence Program.")}`;

const STATUS_TEXT: Record<ProgramStatus, string> = { current: "Running now", upcoming: "Coming up", past: "Completed" };
const BADGE: Record<ProgramStatus, string> = {
  current: "border-brand-text text-brand-text",
  upcoming: "border-glow text-glow",
  past: "border-line-strong text-muted",
};

function Paragraphs({ text }: { text?: string }) {
  return <>{(text ?? "").split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((t, i) => <p key={i} className="mt-3 max-w-2xl text-muted">{t}</p>)}</>;
}

/** Status pill plus honest, date-derived urgency ("Starts in 12 days"). Shows nothing it cannot back up. */
function TimingBadge({ t }: { t: ProgramTiming }) {
  const when = timingLabel(t);
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
      <span className={`rounded-full border px-3 py-0.5 ${BADGE[t.status]}`}>{STATUS_TEXT[t.status]}</span>
      {when && <span className="text-ink">{when}</span>}
    </p>
  );
}

function ProgramCard({ p, t }: { p: WithId<DbProgram>; t: ProgramTiming }) {
  const f = facts(p);
  const open = t.status !== "past";
  const href = p.applyUrl ?? (open ? APPLY_FALLBACK : undefined);
  return (
    <li className="grid grid-cols-1 gap-6 border-t-2 border-ink pt-6 sm:grid-cols-[auto_1fr]">
      {p.imageId ? <Image src={imageUrl(p.imageId)} alt="" width={160} height={160} unoptimized className="size-28 rounded-[var(--radius)] border border-line object-cover sm:size-40" /> : null}
      <div className={p.imageId ? "" : "sm:col-span-2"}>
        <TimingBadge t={t} />
        <h3 className="mt-3 text-2xl font-extrabold">{p.title}</h3>
        <p className="mt-2 max-w-2xl text-muted">{p.summary}</p>
        <Paragraphs text={p.details} />
        {f.length > 0 && <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">{f.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
        {href && (
          <div className="mt-5">
            <ButtonLink href={href} variant={open ? "primary" : "secondary"} event={open ? "apply_click" : undefined} eventProps={{ cta_id: `program_card_${p.id}`, placement: "program_list" }}>
              {open ? (t.status === "upcoming" ? "Reserve your seat" : "Apply for the next cohort") : "Read more"}
            </ButtonLink>
          </div>
        )}
      </div>
    </li>
  );
}

export default async function ProgramPage() {
  const [programs, on, voices, achievements] = await Promise.all([getPrograms(), getTepSections(), getTestimonials("learner"), getAchievements()]);
  const showVoices = on.programVoices === true && (voices.length > 0 || SHOW_PLACEHOLDERS);
  const showCareer = on.career === true && (achievements.length > 0 || SHOW_PLACEHOLDERS);

  // Status comes from the dates, so a program moves Coming up → Running now → Completed with no manual edit.
  const timed = (programs ?? []).map((p) => ({ p, t: programTiming(p) }));
  const flagship = timed.find((x) => x.p.flagship);
  const others = timed.filter((x) => !x.p.flagship);
  const group = (s: ProgramStatus) => others.filter((x) => x.t.status === s).sort((a, b) => timingSort<DbProgram>(s)(a.p, b.p));
  const sections: [string, string, ProgramStatus, { p: WithId<DbProgram>; t: ProgramTiming }[]][] = [
    ["Running now", "Ongoing programs.", "current", group("current")],
    ["Coming up", "Upcoming programs.", "upcoming", group("upcoming")],
    ["Archive", "Past programs.", "past", group("past")],
  ];

  const fp = flagship?.p;
  const ft = flagship?.t;
  const f = fp ? facts(fp) : [];
  const flagshipOpen = !ft || ft.status !== "past";
  const applyHref = fp?.applyUrl ?? APPLY_FALLBACK;
  const barNote = ft && timingLabel(ft) ? `${fp?.title ?? "TEP"} · ${timingLabel(ft)}` : undefined;
  const faq = TEP_FAQ.filter((q) => ["Who can apply?", "What are the prerequisites?", "What is the duration?", "Are fees and start dates listed here?", "What certification or recognition is provided?", "How can I enquire or apply?"].includes(q.q) && !(f.length && q.q === "Are fees and start dates listed here?"));

  return (
    <>
      <PageHero eyebrow="Program" title="Learn with DeboisTech." lead="Mentor-led, project-based learning for engineers who want production skills, not tutorials." />
      <PixelEdge from="var(--paper)" to="#ffffff" />

      <Section theme="white" labelledBy="programs">
        <SectionHeader id="programs" title="Our flagship program." lead="The Technology Excellence Program is where most of our teaching happens." />
        <article className="grid grid-cols-1 gap-10 border-t-2 border-ink pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            {ft ? <TimingBadge t={ft} /> : <p className="text-sm font-semibold text-brand-text">Flagship program</p>}
            <h3 className="display mt-3 text-4xl sm:text-5xl">{fp?.title ?? "Technology Excellence Program"}</h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{fp?.summary ?? TEP_INTRO}</p>
            <Paragraphs text={fp?.details} />
            {f.length > 0 && (
              <dl className="mt-6 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius)] border border-line p-4 text-sm sm:grid-cols-4">
                {f.map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>)}
              </dl>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {flagshipOpen
                ? <ButtonLink href={applyHref} event="apply_click" eventProps={{ cta_id: "program_hero_apply", placement: "flagship" }}>{fp?.applyUrl ? "Apply now" : "Apply for TEP"}</ButtonLink>
                : <ButtonLink href={applyHref} event="apply_click" eventProps={{ cta_id: "program_hero_waitlist", placement: "flagship" }}>Join the next cohort list</ButtonLink>}
              <ButtonLink href="/tep" variant="secondary" event="tep_track_select" eventProps={{ cta_id: "program_page_tep" }}>See the curriculum</ButtonLink>
              <ButtonLink href={waLink} variant="ghost" event="whatsapp_click" eventProps={{ cta_id: "program_hero_whatsapp", placement: "flagship" }}>Ask on WhatsApp</ButtonLink>
            </div>
            <p className="mt-4 max-w-xl text-sm text-muted">Mentor-led · Project-based · Questions about fit or fees? We reply within {SITE.responseTime}.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold">Pick your track</h4>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {TRACKS.map((t) => (
                <li key={t.slug} className="py-4">
                  <Link href={`/tep/${t.slug}`} className="group flex min-h-12 items-center justify-between gap-4">
                    <span><span className="block font-semibold">{t.name}</span><span className="block text-sm text-muted">{t.audience}</span></span>
                    <span aria-hidden className="text-xl text-brand-text transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link href={`/contact?intent=tep&track=${t.slug}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-text underline underline-offset-4">
                    Apply for {t.name}
                  </Link>
                </li>
              ))}
            </ul>
            {!f.length && <p className="mt-3 text-sm text-muted">Dates, fees and availability change by cohort. We confirm them when you enquire.</p>}
          </div>
        </article>
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      {sections.filter(([, , , rows]) => rows.length).map(([eyebrow, title, , rows], i) => (
        <Section key={title} theme={i % 2 ? "light" : "mint"} labelledBy={`p-${i}`}>
          <SectionHeader id={`p-${i}`} eyebrow={eyebrow} title={title} />
          <ul className="space-y-10">{rows.map(({ p, t }) => <ProgramCard key={p.id} p={p} t={t} />)}</ul>
        </Section>
      ))}

      {showCareer && (
        <Section theme="light" labelledBy="career"><TepCareer id="career" items={achievements} /></Section>
      )}
      {showVoices && (
        <Section theme="mint" labelledBy="voices"><TepVoices id="voices" items={voices} /></Section>
      )}

      <Section theme="light" labelledBy="program-faq">
        <SectionHeader id="program-faq" title="Before you apply." lead="The questions students ask most." />
        <FAQAccordion items={faq} />
      </Section>

      <Section theme="mint" labelledBy="practice">
        <SectionHeader id="practice" title="Practise alongside." lead="Debo Labs is our hands-on DevOps platform. Every lab runs in a real terminal and is graded on what actually happened in your sandbox." />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/labs">About Debo Labs</ButtonLink>
          <ButtonLink href={LABS.startUrl} variant="secondary">Start the first lab</ButtonLink>
        </div>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="apply">
        <div id="apply" className="max-w-3xl">
          <SectionHeader id="apply-title" title={flagshipOpen ? "Ready to build?" : "Be first in line."} lead={flagshipOpen ? "Tell us your track and background. We reply with the current cohort details and next steps." : "The last cohort has finished. Leave your details and we will message you when the next one opens."} />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={applyHref} event="apply_click" eventProps={{ cta_id: "program_footer_apply", placement: "closing" }}>{flagshipOpen ? "Apply for TEP" : "Join the next cohort list"}</ButtonLink>
            <ButtonLink href={waLink} variant="secondary" event="whatsapp_click" eventProps={{ cta_id: "program_footer_whatsapp", placement: "closing" }}>Chat on WhatsApp</ButtonLink>
          </div>
        </div>
      </Section>

      {flagshipOpen && <ApplyBar href={applyHref} note={barNote} hideWhenVisible="#apply" />}
    </>
  );
}
