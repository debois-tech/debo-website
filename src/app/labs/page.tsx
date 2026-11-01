import { ButtonLink, PageHero, Section, SectionHeader } from "@/components/ui";
import { LabTerminal } from "@/components/LabTerminal";
import { LabTracks } from "@/components/LabTracks";
import { PixelEdge } from "@/components/PixelEdge";
import { LAB_HOW, LAB_LOCAL, LAB_TOTALS, LABS } from "@/content/labs";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Debo Labs", "Debo Labs is DeboisTech's hands-on DevOps practice platform: real terminals, labs graded on what actually happened, hosted or offline in Docker.", "/labs");

export default function LabsPage() {
  return (
    <>
      <PageHero eyebrow="Debo Labs" title={LABS.headline} lead={LABS.sub}>
        <ButtonLink href={LABS.startUrl} event="hero_cta_click" eventProps={{ cta_id: "labs_start" }}>Start the first lab</ButtonLink>
        <ButtonLink href="#tracks" variant="secondary">Browse the labs</ButtonLink>
      </PageHero>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="try">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeader id="try" title="Not a tutorial. A lab." lead="You work in a terminal. A check then inspects the sandbox for the result you were asked to reach." />
          <LabTerminal />
        </div>
        <ol className="mt-16 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
          {LAB_HOW.map((h, i) => (
            <li key={h.title} className="border-t-2 border-ink pt-5"><p className="text-sm text-muted">Step {i + 1}</p><h3 className="mt-1 text-xl font-bold">{h.title}</h3><p className="mt-2 text-muted">{h.body}</p></li>
          ))}
        </ol>
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section theme="mint" labelledBy="tracks-h" id="tracks">
        <SectionHeader id="tracks-h" title="Pick a track." lead={`${LAB_TOTALS.labs} labs across ${LAB_TOTALS.tracks} tracks, about ${LAB_TOTALS.minutes.toLocaleString("en-IN")} minutes in total. One square is one lab.`} />
        <LabTracks />
      </Section>

      <Section theme="dark" labelledBy="local">
        <SectionHeader id="local" dark title="On your own machine." lead="Docker is all you need." />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="min-w-0">
            <pre tabIndex={0} aria-label="Commands to run Debo Labs locally" className="overflow-x-auto rounded-[var(--radius)] border border-line-strong bg-black/40 p-5 font-mono text-sm leading-7">
              {LAB_LOCAL.commands.map((c) => <span key={c} className="block"><span className="text-glow">$ </span>{c}</span>)}
            </pre>
            <p className="mt-4 text-muted">Then open <span className="font-mono text-ink">{LABS.localPort}</span>.</p>
          </div>
          <dl className="space-y-6">
            {LAB_LOCAL.requirements.map((r) => <div key={r.os} className="border-t border-line-strong pt-4"><dt className="text-lg font-bold">{r.os}</dt><dd className="mt-1 text-muted">{r.needs}</dd></div>)}
          </dl>
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <ButtonLink href={LABS.startUrl}>Start the first lab</ButtonLink>
          <ButtonLink href={LABS.url} variant="secondary">Open labs.deboistech.in</ButtonLink>
        </div>
        <p className="mt-8 text-sm text-muted">A DeboisTech project. Information from labs.deboistech.in, last reviewed {LABS.lastReviewed}.</p>
      </Section>
      <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
