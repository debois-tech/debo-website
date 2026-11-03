import { Fragment, type ReactNode } from "react";
import { Breadcrumb, ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { PixelEdge } from "@/components/PixelEdge";
import { TepJourney } from "@/components/TepJourney";
import { TepCareer, TepCta, TepMentors, TepOutcomes, TepProgress, TepProjects, TepStrip, TepToolkit, TepVoices } from "@/components/TepSections";
import { FAQAccordion } from "@/components/FAQAccordion";
import { TEP_FAQ, TEP_INTRO } from "@/content/tep";
import { SHOW_PLACEHOLDERS } from "@/content/community";
import { getAchievements, getJourneys, getTepSections, getMentors, getPrograms, getProjects, getTestimonials } from "@/lib/content";
import { ApplyBar } from "@/components/ApplyBar";
import { programTiming } from "@/lib/program-status";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Technology Excellence Program (TEP)", "Mentor-led, project-based AI/ML and Multi-Cloud Engineering tracks from DeboisTech in Nashik.", "/tep");

type Block = { id: string; show: boolean; node: ReactNode };

export default async function TepPage() {
  const [on, programs, voices, achievements, capstones, learnerProjects, mentors, journeys] = await Promise.all([getTepSections(), getPrograms(), getTestimonials("learner"), getAchievements(), getProjects("capstone"), getProjects("learner"), getMentors(), getJourneys()]);
  const flagship = programs?.find((p) => p.flagship);
  const cohort = flagship ? ([["Starts", flagship.startDate], ["Ends", flagship.endDate], ["Duration", flagship.duration], ["Fee", flagship.fee]].filter(([, v]) => v) as [string, string][]) : [];
  const faq = TEP_FAQ
    .filter((f) => !(cohort.length && f.q === "Are fees and start dates listed here?"))
    .map((f) => (flagship?.duration && f.q === "What is the duration?" ? { ...f, a: `The current cohort runs for ${flagship.duration}. Session details are confirmed when you enquire.` } : f));

  // Sections alternate black and white. A section with nothing to show is left out and the rest still alternate.
  const blocks: Block[] = [
    { id: "tracks", show: true, node: (<><SectionHeader id="tracks" title="Choose a track." lead="Both tracks are hands-on and project-based. Pick one to see its path, and open any stage to see what it covers." /><TepJourney /></>) },
    { id: "toolkit", show: true, node: <TepToolkit id="toolkit" /> },
    { id: "capstones", show: on.capstones === true && (capstones.length > 0 || SHOW_PLACEHOLDERS), node: <TepProjects id="capstones" title="What you’ll build matters more than what you watch." lead="Apply your learning through practical engineering projects designed around real-world problems." projects={capstones} emptyNote="Add capstone projects in the dashboard (Projects tab, type “Capstone”): the problem, the stack, the deliverables and the repository. Never list a project that has not been built." /> },
    { id: "outcomes", show: true, node: <TepOutcomes id="outcomes" /> },
    { id: "mentors", show: on.mentors === true && (mentors.length > 0 || SHOW_PLACEHOLDERS), node: <TepMentors id="mentors" items={mentors} /> },
    { id: "voices", show: on.voices === true && (voices.length > 0 || SHOW_PLACEHOLDERS), node: <TepVoices id="voices" items={voices} /> },
    { id: "career", show: on.career === true && (achievements.length > 0 || SHOW_PLACEHOLDERS), node: <TepCareer id="career" items={achievements} /> },
    { id: "learner-projects", show: on.learnerProjects === true && (learnerProjects.length > 0 || SHOW_PLACEHOLDERS), node: <TepProjects id="learner-projects" title="Built by our learners." lead="From ideas to implementation. Explore what learners create when they put engineering into practice." projects={learnerProjects} emptyNote="Add verified learner projects in the dashboard (Projects tab, type “Learner project”), with the learners’ permission." /> },
    { id: "progress", show: on.progress === true && (journeys.length > 0 || SHOW_PLACEHOLDERS), node: <TepProgress id="progress" items={journeys} /> },
    { id: "cohort", show: cohort.length > 0, node: (<><SectionHeader id="cohort" title="Current cohort." /><dl className="flex flex-wrap gap-x-12 gap-y-4">{cohort.map(([k, v]) => <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}</dl><div className="mt-8"><ButtonLink href={flagship?.applyUrl ?? "/contact?intent=tep"} event="apply_click" eventProps={{ cta_id: "tep_cohort_apply" }}>Apply for TEP</ButtonLink></div></>) },
    { id: "faq", show: true, node: (<><SectionHeader id="faq" title="Questions, answered." /><FAQAccordion items={faq} /></>) },
    { id: "cta", show: true, node: <TepCta id="cta" /> },
  ].filter((b) => b.show);

  const black = "var(--paper)", white = "#ffffff";
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Program", href: "/program" }, { label: "Technology Excellence Program" }]} />
      <PageHero eyebrow="Program" title="Learn by building." lead={TEP_INTRO} />
      <TepStrip />
      {blocks.map((b, i) => {
        const isWhite = i % 2 === 0; // the block after the black hero is white
        return (
          <Fragment key={b.id}>
            <PixelEdge from={i === 0 ? black : isWhite ? black : white} to={isWhite ? white : black} />
            <Section theme={isWhite ? "white" : "light"} labelledBy={b.id === "tracks" ? "tracks" : b.id}>{b.node}</Section>
          </Fragment>
        );
      })}
      {blocks.length % 2 === 1 ? null : <PixelEdge from={black} to={white} />}
      {(!flagship || programTiming(flagship).status !== "past") && <ApplyBar href={flagship?.applyUrl ?? "/contact?intent=tep"} hideWhenVisible="#cohort" />}
    </>
  );
}
