"use client";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { JOURNEY, TRACKS, type JourneyStage } from "@/content/tep";
import { track } from "@/lib/analytics";
import { ButtonLink } from "./ui";


/** The detail for one stage: what you practise, the tools it names, and what you ship. */
function Detail({ s, last }: { s: JourneyStage; last: boolean }) {
  return (
    <div className="space-y-4 text-[15px]">
      <p className="text-lg text-ink">{s.body}</p>
      <div>
        <p className="font-semibold">What you’ll practise</p>
        <ul className="mt-1.5 space-y-1.5">{s.learn.map((l) => <li key={l} className="flex gap-2.5 text-muted"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-brand-logo" />{l}</li>)}</ul>
      </div>
      {s.tools && <ul aria-label="Tools and concepts" className="flex flex-wrap gap-2">{s.tools.map((x) => <li key={x} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{x}</li>)}</ul>}
      {s.deliverable && <p className="border-l-4 border-glow pl-3"><span className="font-semibold">{last ? "You finish with. " : "You produce. "}</span><span className="text-muted">{s.deliverable}</span></p>}
    </div>
  );
}

/**
 * The program as a stack you build: six blocks rising to the capstone.
 * Pick a track and the stack rebuilds from the base; pick a block to read that stage. Nothing moves on its own.
 */
export function TepBuild() {
  const [pos, setPos] = useState({ ti: 0, sel: 0 });
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = TRACKS[pos.ti];
  const stages = JOURNEY[t.slug];
  const lastIdx = stages.length - 1;

  /** On phones the detail sits below the stairs, so bring it into view after a tap. */
  const reveal = () => { if (window.matchMedia("(max-width: 1023px)").matches) panel.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const pickTrack = (n: number) => { setPos({ ti: n, sel: 0 }); track("tep_track_select", { track_id: TRACKS[n].slug }); };
  const pickStage = (n: number) => { setPos({ ti: pos.ti, sel: n }); track("tep_track_select", { track_id: t.slug, stage_id: String(n + 1) }); reveal(); };
  const onKey = (e: KeyboardEvent, n: number) => {
    const next = e.key === "ArrowRight" ? (n + 1) % TRACKS.length : e.key === "ArrowLeft" ? (n - 1 + TRACKS.length) % TRACKS.length : null;
    if (next === null) return;
    e.preventDefault(); pickTrack(next); tabs.current[next]?.focus();
  };
  const sel = pos.sel;

  return (
    <div>
      <div role="tablist" aria-label="Program tracks" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TRACKS.map((tr, n) => (
          <button key={tr.slug} ref={(el) => { tabs.current[n] = el; }} role="tab" id={`build-tab-${tr.slug}`} aria-selected={n === pos.ti} aria-controls="build-panel"
            tabIndex={n === pos.ti ? 0 : -1} onClick={() => pickTrack(n)} onKeyDown={(e) => onKey(e, n)}
            className={`rounded-[var(--radius)] border-2 p-4 text-left transition-colors sm:p-5 ${n === pos.ti ? "border-glow bg-glow text-forest" : "border-line-strong hover:border-glow"}`}>
            <span className="display block text-2xl sm:text-3xl">{tr.name}</span>
            <span className={`mt-1 block text-sm ${n === pos.ti ? "text-forest/80" : "text-muted"}`}>{tr.audience}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="build-panel" aria-labelledby={`build-tab-${t.slug}`} className="mt-10">
        <ol key={t.slug} aria-label={`${t.name}: six stages`} className="flex flex-col gap-2 lg:flex-row lg:items-end">
          {stages.map((s, i) => {
            const on = sel === i, cap = i === lastIdx;
            return (
              <li key={s.step} className="stack-rise lg:flex-1" style={{ ["--i" as string]: i, ["--w" as string]: `${58 + i * 8.4}%`, ["--h" as string]: `${9.5 + i * 2.6}rem` }}>
                <button type="button" aria-current={on ? "step" : undefined} onClick={() => pickStage(i)}
                  className={`stack-block block w-[var(--w)] p-4 text-left transition-colors lg:h-[var(--h)] lg:w-full ${on ? "bg-glow text-forest" : cap ? "bg-forest text-white hover:bg-forest-2" : "bg-brand-logo/10 hover:bg-brand-logo/20"}`}>
                  <span className="flex items-baseline gap-3 lg:block">
                    <span className={`display text-3xl lg:text-5xl ${on ? "" : cap ? "text-glow" : "text-brand-text"}`}>{i + 1}</span>
                    <span className="block text-base font-bold leading-snug lg:mt-3 lg:text-lg">{s.step}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div ref={panel} className="scroll-mt-24">
            <p className="display text-3xl" aria-hidden>Stage {sel + 1} of {stages.length}</p>
            {/* every stage sits in the same grid cell, so the panel is always as tall as the tallest one and nothing below it moves */}
            <div className="mt-4 grid" aria-live="polite">
              {stages.map((s, i) => (
                <div key={s.step} className={`col-start-1 row-start-1 ${i === sel ? "" : "invisible"}`} aria-hidden={i !== sel}>
                  <h3 className="display text-2xl sm:text-3xl">{s.step}</h3>
                  <div className="mt-3"><Detail s={s} last={i === lastIdx} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-muted">{t.summary}</p>
            <ul aria-label="Format" className="mt-4 flex flex-wrap gap-2">{t.format.map((f) => <li key={f} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{f}</li>)}</ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={`/contact?intent=tep&track=${t.slug}`} event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "home_apply" }}>Apply for TEP</ButtonLink>
              <ButtonLink href={`/tep/${t.slug}`} variant="secondary" event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "details" }}>Track details</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-muted">Dates, fees and availability change by cohort. We confirm them when you enquire. <Link href="/program" className="font-semibold text-brand-text underline underline-offset-4">See all programs</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
