"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { JOURNEY, TRACKS } from "@/content/tep";
import { track } from "@/lib/analytics";
import { ButtonLink } from "./ui";

/**
 * Track selector (accessible tabs, arrow keys) and the learning roadmap for the chosen track.
 * Each stage opens to show what you practise, the tools or concepts it names, and the deliverable where the program has one.
 */
export function TepJourney() {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = TRACKS[i];
  const stages = JOURNEY[t.slug];
  const select = (n: number) => { setI(n); setOpen(0); track("tep_track_select", { track_id: TRACKS[n].slug }); };
  const onKey = (e: KeyboardEvent, n: number) => {
    const next = e.key === "ArrowRight" ? (n + 1) % TRACKS.length : e.key === "ArrowLeft" ? (n - 1 + TRACKS.length) % TRACKS.length : null;
    if (next === null) return;
    e.preventDefault(); select(next); refs.current[next]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label="Program tracks" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {TRACKS.map((tr, n) => (
          <button key={tr.slug} ref={(el) => { refs.current[n] = el; }} role="tab" id={`tab-${tr.slug}`} aria-selected={n === i} aria-controls={`panel-${tr.slug}`}
            tabIndex={n === i ? 0 : -1} onClick={() => select(n)} onKeyDown={(e) => onKey(e, n)}
            className={`min-h-12 rounded-full border px-3 py-2 text-center text-sm font-semibold leading-tight transition-colors sm:px-5 sm:text-base ${n === i ? "border-glow bg-glow text-forest" : "border-line-strong text-ink hover:border-glow"}`}>
            {tr.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${t.slug}`} aria-labelledby={`tab-${t.slug}`} tabIndex={0} className="mt-8 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-lg leading-relaxed text-muted sm:text-xl">{t.summary}</p>
          <p className="mt-6 text-muted"><span className="font-semibold text-ink">Who it’s for. </span>{t.audience}</p>
          <p className="mt-4 text-muted"><span className="font-semibold text-ink">Format. </span>{t.format.map((f, k) => (k ? f.toLowerCase() : f)).join(", ")}.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={`/tep/${t.slug}`} variant="secondary" event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "details" }}>Track details</ButtonLink>
            <ButtonLink href={`/contact?intent=tep&track=${t.slug}`} event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "enquire" }}>Enquire or apply</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted">Dates, fees and availability change by cohort. We confirm them when you enquire.</p>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-brand-text">Your path · {stages.length} stages, ending with {stages[stages.length - 1].step.toLowerCase()}</p>
          <ol className="relative border-l-2 border-line pl-8">
            {stages.map((s, n) => {
              const on = open === n, id = `${t.slug}-stage-${n}`;
              return (
                <li key={s.step} className="relative pb-3 last:pb-0">
                  <span aria-hidden className={`absolute -left-[41px] top-4 size-4 transition-colors ${on ? "bg-glow" : "bg-brand-logo"}`} />
                  <button type="button" aria-expanded={on} aria-controls={id} onClick={() => setOpen(on ? null : n)}
                    className="group flex min-h-14 w-full items-start justify-between gap-4 rounded-[var(--radius)] py-2.5 text-left">
                    <span>
                      <span className="block text-sm text-muted">Stage {n + 1}</span>
                      <span className="block text-xl font-bold transition-colors group-hover:text-brand-text">{s.step}</span>
                      <span className="mt-1 block text-muted">{s.body}</span>
                    </span>
                    <span aria-hidden className={`mt-5 shrink-0 text-2xl leading-none text-brand-text transition-transform duration-300 ${on ? "rotate-45" : ""}`}>+</span>
                  </button>
                  <div id={id} hidden={!on} className="svc-panel-in mb-3 space-y-4 border-t border-line pb-2 pt-4 text-[15px]">
                    <div><p className="font-semibold">What you’ll practise</p><ul className="mt-1.5 space-y-1.5">{s.learn.map((l) => <li key={l} className="flex gap-2.5 text-muted"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-brand-logo" />{l}</li>)}</ul></div>
                    {s.tools && <div><p className="font-semibold">Tools and concepts</p><ul className="mt-1.5 flex flex-wrap gap-2">{s.tools.map((x) => <li key={x} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{x}</li>)}</ul></div>}
                    {s.deliverable && <div><p className="font-semibold">Deliverable</p><p className="mt-1 text-muted">{s.deliverable}</p></div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
