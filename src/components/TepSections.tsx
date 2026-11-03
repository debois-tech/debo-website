import Image from "next/image";
import { MENTORS_LINE, OUTCOMES, TEP_STRIP, TOOLKIT, TRACKS } from "@/content/tep";
import type { AchievementLabel, DbAchievement, DbJourney, DbMentor, DbProject, DbTestimonial, WithId } from "@/content/dynamic";
import { imageUrl } from "@/lib/content";
import { ButtonLink, SectionHeader } from "./ui";
import { InView } from "./InView";
import { ExpandableQuote } from "./ExpandableQuote";

const dot = <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-brand-logo" />;
const Placeholder = ({ children }: { children: string }) => (
  <p className="rounded-[var(--radius)] border border-dashed border-line-strong p-5 text-sm text-muted">{children} <span className="block text-xs">Shown while developing only; hidden on the live site until real entries exist.</span></p>
);
const Photo = ({ id, alt, className }: { id?: string; alt: string; className: string }) =>
  id ? <Image src={imageUrl(id)} alt={alt} width={400} height={400} unoptimized loading="lazy" className={className} /> : null;

/* ---------- hero strip ---------- */
export function TepStrip() {
  return (
    <section aria-label="Program at a glance" className="border-b border-line bg-paper">
      <dl className="container-x grid grid-cols-2 gap-x-6 gap-y-5 pb-10 lg:grid-cols-4">
        {TEP_STRIP.map((s) => (
          <div key={s.label} className="border-t-2 border-brand-logo pt-3">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-0.5"><span className="block text-lg font-bold leading-snug sm:text-xl">{s.value}</span><span className="mt-0.5 block text-sm text-muted">{s.note}</span></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- toolkit ---------- */
export function TepToolkit({ id }: { id: string }) {
  return (
    <>
      <SectionHeader id={id} title="The toolkit." lead="The tools and technologies you work with, by track." />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {TRACKS.map((t) => (
          <div key={t.slug}>
            <h3 className="border-b border-line pb-2 text-xl font-bold">{t.name}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">{TOOLKIT[t.slug].map((x) => <li key={x} className="rounded-full border border-line-strong px-3.5 py-1.5 text-[15px]">{x}</li>)}</ul>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- outcomes ---------- */
export function TepOutcomes({ id }: { id: string }) {
  return (
    <>
      <SectionHeader id={id} title="Not just knowledge. Something to show for it." lead="What you finish with: tangible work and feedback, not just a syllabus." />
      <InView>
        <ul className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
          {OUTCOMES.map((o, i) => (
            <li key={o.title} className="reveal flex gap-3 border-t border-line pt-4" style={{ ["--d" as string]: `${(i % 2) * 0.06}s` }}>
              {dot}
              <div>
                <p className="text-lg font-bold">{o.title}{o.perCohort && <span className="ml-2 rounded-full border border-line-strong px-2 py-0.5 align-middle text-xs font-normal text-muted">Varies by cohort</span>}</p>
                <p className="mt-1 text-muted">{o.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </InView>
      <p className="mt-6 text-sm text-muted">Certificate and career-support details differ by cohort. We confirm what applies when you enquire.</p>
    </>
  );
}

/* ---------- projects (capstones and learner work) ---------- */
export function TepProjects({ id, title, lead, projects, emptyNote }: { id: string; title: string; lead: string; projects: WithId<DbProject>[]; emptyNote: string }) {
  return (
    <>
      <SectionHeader id={id} title={title} lead={lead} />
      {projects.length === 0 ? <Placeholder>{emptyNote}</Placeholder> : (
        <InView>
          <ul className="grid grid-cols-1 gap-5 lg:grid-cols-6">
            {projects.map((p, i) => (
              <li key={p.id} className={`reveal group flex flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-paper transition-colors hover:border-brand-text ${i === 0 && projects.length > 1 ? "lg:col-span-6 lg:flex-row" : projects.length === 1 ? "lg:col-span-6" : "lg:col-span-3"}`}>
                {p.imageId && <Photo id={p.imageId} alt={`${p.title}: project screenshot`} className={`aspect-[16/10] w-full object-cover ${i === 0 && projects.length > 1 ? "lg:w-1/2" : ""} border-b border-line lg:border-b-0`} />}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-sm font-semibold text-brand-text">{p.track ? TRACKS.find((t) => t.slug === p.track)?.name ?? p.track : p.kind === "capstone" ? "Capstone" : "Learner project"}</p>
                  <h3 className="display mt-1 text-2xl sm:text-3xl">{p.title}</h3>
                  {p.contributors && <p className="mt-1 text-sm text-muted">By {p.contributors}</p>}
                  {p.problem && <p className="mt-3"><span className="font-semibold">The problem. </span><span className="text-muted">{p.problem}</span></p>}
                  <p className="mt-2 text-muted">{p.description}</p>
                  {p.stack && p.stack.length > 0 && <ul aria-label="Technology stack" className="mt-4 flex flex-wrap gap-2">{p.stack.map((t) => <li key={t} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{t}</li>)}</ul>}
                  {p.deliverables && p.deliverables.length > 0 && <ul className="mt-4 space-y-1.5 text-[15px]">{p.deliverables.map((d) => <li key={d} className="flex gap-2.5 text-muted">{dot}{d}</li>)}</ul>}
                  {p.feedback && <p className="mt-4 border-l-2 border-brand-logo pl-4 text-[15px]"><span className="font-semibold">Mentor feedback. </span><span className="text-muted">{p.feedback}</span></p>}
                  {(p.repo || p.demo) && (
                    <div className="mt-auto flex gap-5 pt-5 text-sm font-semibold">
                      {p.repo && <a className="inline-flex min-h-11 items-center text-brand-text underline underline-offset-4" href={p.repo} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> repository for {p.title} (opens in a new tab)</span></a>}
                      {p.demo && <a className="inline-flex min-h-11 items-center text-brand-text underline underline-offset-4" href={p.demo} target="_blank" rel="noopener noreferrer">Live demo<span className="sr-only"> of {p.title} (opens in a new tab)</span></a>}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </InView>
      )}
    </>
  );
}

/* ---------- mentors ---------- */
export function TepMentors({ id, items }: { id: string; items: WithId<DbMentor>[] }) {
  return (
    <>
      <SectionHeader id={id} title="Meet the mentors." lead={MENTORS_LINE} />
      {items.length === 0 ? <Placeholder>Add mentors in the dashboard (Mentors tab): name, role, photo, expertise and the modules they guide. Only people who actually mentor on the program.</Placeholder> : (
        <InView>
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {items.map((m) => (
              <li key={m.id} className="reveal group grid grid-cols-[8rem_1fr] items-start gap-5 sm:grid-cols-[10rem_1fr]">
                <div className="aspect-square overflow-hidden rounded-[var(--radius)] border border-line bg-wash">
                  {m.imageId && <Image src={imageUrl(m.imageId)} alt={`Portrait of ${m.name}`} width={320} height={320} unoptimized loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{m.name}</h3>
                  <p className="text-sm text-muted">{m.title}{m.company && <> · {m.company}</>}</p>
                  {m.expertise && m.expertise.length > 0 && <ul aria-label="Expertise" className="mt-3 flex flex-wrap gap-2">{m.expertise.map((x) => <li key={x} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{x}</li>)}</ul>}
                  {m.guides && m.guides.length > 0 && <p className="mt-3 text-[15px]"><span className="font-semibold">Guides. </span><span className="text-muted">{m.guides.join(", ")}</span></p>}
                  {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-brand-text underline underline-offset-4">LinkedIn<span className="sr-only"> profile of {m.name} (opens in a new tab)</span></a>}
                </div>
              </li>
            ))}
          </ul>
        </InView>
      )}
    </>
  );
}

/* ---------- learner voices ---------- */
function VoiceLinks({ t }: { t: DbTestimonial }) {
  if (!t.videoUrl && !t.linkedin) return null;
  return (
    <p className="mt-3 flex gap-4 text-sm font-semibold">
      {t.videoUrl && <a className="inline-flex min-h-11 items-center text-brand-text underline underline-offset-4" href={t.videoUrl} target="_blank" rel="noopener noreferrer">Watch video<span className="sr-only"> from {t.name} (opens in a new tab)</span></a>}
      {t.linkedin && <a className="inline-flex min-h-11 items-center text-brand-text underline underline-offset-4" href={t.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr-only"> profile of {t.name} (opens in a new tab)</span></a>}
    </p>
  );
}

export function TepVoices({ id, items }: { id: string; items: WithId<DbTestimonial>[] }) {
  const featured = items.find((t) => t.featured) ?? items[0];
  const rest = items.filter((t) => t !== featured);
  const who = (t: DbTestimonial) => [t.role, t.company].filter(Boolean).join(", ");
  return (
    <>
      <SectionHeader id={id} title="Don’t just take our word for it." lead="Real experiences from learners who have participated in our programs, workshops and technical learning initiatives." />
      {!featured ? <Placeholder>Add learner testimonials in the dashboard (Testimonials tab, “Shown on” = TEP page), with the learner’s permission.</Placeholder> : (
        <InView>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
            <figure className="reveal flex flex-col rounded-[var(--radius)] border border-line bg-paper p-6 sm:p-9">
              <ExpandableQuote text={featured.quote} lines={6} threshold={320} className={featured.quote.length <= 180 ? "display text-2xl leading-snug sm:text-3xl" : "text-lg leading-relaxed sm:text-xl"} />
              <figcaption className="mt-6 flex items-center gap-4">
                <Photo id={featured.imageId} alt={`Portrait of ${featured.name}`} className="size-16 rounded-full border border-line object-cover" />
                <div><p className="font-semibold">{featured.name}</p>{who(featured) && <p className="text-sm text-muted">{who(featured)}</p>}{featured.program && <p className="text-sm text-brand-text">{featured.program}</p>}</div>
              </figcaption>
              <VoiceLinks t={featured} />
            </figure>
            {rest.length > 0 && (
              <ul className="grid grid-cols-1 gap-5 content-start">
                {rest.map((t, i) => (
                  <li key={t.id} className="reveal rounded-[var(--radius)] border border-line bg-paper p-5 transition-colors hover:border-brand-text" style={{ ["--d" as string]: `${(i % 3) * 0.07}s` }}>
                    <ExpandableQuote text={t.quote} lines={5} threshold={200} />
                    <div className="mt-4 flex items-center gap-3">
                      <Photo id={t.imageId} alt={`Portrait of ${t.name}`} className="size-11 rounded-full border border-line object-cover" />
                      <div><p className="font-semibold">{t.name}</p><p className="text-sm text-muted">{[who(t), t.program].filter(Boolean).join(" · ")}</p></div>
                    </div>
                    <VoiceLinks t={t} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </InView>
      )}
    </>
  );
}

/* ---------- career progress ---------- */
const LABEL: Record<AchievementLabel, string> = { placed: "PLACED", internship: "INTERNSHIP", certified: "CERTIFIED", progress: "CAREER PROGRESS" };
export function TepCareer({ id, items }: { id: string; items: WithId<DbAchievement>[] }) {
  const hasPlacements = items.some((a) => a.label === "placed");
  return (
    <>
      <SectionHeader id={id} title={hasPlacements ? "Their next chapter." : "Career progress & opportunities."} lead="Celebrating the milestones, opportunities and career progress of our learners." />
      {items.length === 0 ? <Placeholder>Add verified milestones in the dashboard (Achievements tab): placements, internships, certifications or career progress, with the learner’s permission and a link that verifies each one.</Placeholder> : (
        <InView>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a, i) => (
              <li key={a.id} className="reveal flex flex-col rounded-[var(--radius)] border border-line bg-paper p-5 transition-colors hover:border-brand-text" style={{ ["--d" as string]: `${(i % 3) * 0.07}s` }}>
                <div className="flex items-center gap-4">
                  <Photo id={a.imageId} alt={`Portrait of ${a.name}`} className="size-16 rounded-full border border-line object-cover" />
                  <div className="min-w-0">
                    <span className="inline-block rounded-full border border-brand-text px-2.5 py-0.5 text-xs font-bold tracking-wide text-brand-text">{LABEL[a.label]}</span>
                    <p className="mt-1 text-lg font-bold leading-tight">{a.name}</p>
                  </div>
                </div>
                <p className="mt-4 font-semibold">{a.title}{a.org && <span className="font-normal text-muted"> · {a.org}</span>}</p>
                <p className="mt-1 text-sm text-muted">{[a.track ? TRACKS.find((t) => t.slug === a.track)?.name ?? a.track : null, a.date].filter(Boolean).join(" · ")}</p>
                {a.story && <p className="mt-3 text-muted">{a.story}</p>}
                {a.linkedin && <a href={a.linkedin} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center pt-3 text-sm font-semibold text-brand-text underline underline-offset-4">View on LinkedIn<span className="sr-only"> ({a.name}, opens in a new tab)</span></a>}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">Shared with each learner’s permission. Outcomes vary by learner and are not guaranteed.</p>
        </InView>
      )}
    </>
  );
}

/* ---------- before and after ---------- */
export function TepProgress({ id, items }: { id: string; items: WithId<DbJourney>[] }) {
  return (
    <>
      <SectionHeader id={id} title="Progress you can see." lead="How learners’ engineering skills grow, in their own words and with their permission. Results vary by learner." />
      {items.length === 0 ? <Placeholder>Add real learner journeys in the dashboard (Journeys tab): where they started, what they built, with the learner’s permission.</Placeholder> : (
        <InView>
          <ul className="space-y-4">
            {items.map((j) => (
              <li key={j.id} className="reveal grid grid-cols-1 items-center gap-3 border-t border-line pt-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
                <p className="text-muted">{j.before}</p>
                <span aria-hidden className="text-2xl text-brand-text max-md:rotate-90">→</span>
                <p className="text-lg font-semibold">{j.after}{(j.who || j.track) && <span className="block text-sm font-normal text-muted">{[j.who, j.track].filter(Boolean).join(" · ")}</span>}</p>
              </li>
            ))}
          </ul>
        </InView>
      )}
    </>
  );
}

/* ---------- closing ---------- */
export function TepCta({ id }: { id: string }) {
  return (
    <>
      <h2 id={id} className="display max-w-4xl text-4xl sm:text-6xl">Your next engineering milestone starts here.</h2>
      <p className="mt-4 max-w-2xl text-lg text-muted sm:text-xl">Build the skills, projects and engineering mindset to work on real-world technology.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="#tracks" event="tep_track_select" eventProps={{ cta_id: "final_explore" }}>Explore the program</ButtonLink>
        <ButtonLink href="/contact?intent=tep" variant="secondary" event="tep_track_select" eventProps={{ cta_id: "final_mentor" }}>Talk to a mentor</ButtonLink>
      </div>
    </>
  );
}
