import Link from "next/link";
import { JOURNEY, TRACKS } from "@/content/tep";
import { ButtonLink } from "./ui";
import { InView } from "./InView";

/** Home-page view of the program: one card per track with its six real stages on a progress rail. The full curriculum lives on /tep. */
export function TepTeaser() {
  return (
    <InView>
      <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {TRACKS.map((t, k) => {
          const stages = JOURNEY[t.slug];
          const last = stages[stages.length - 1];
          return (
            <li key={t.slug} className="reveal group flex flex-col rounded-[var(--radius)] border border-line bg-paper p-6 transition-colors hover:border-brand-text sm:p-8" style={{ ["--d" as string]: `${k * 0.1}s` }}>
              <h3 className="display text-3xl sm:text-4xl">{t.name}</h3>
              <p className="mt-2 text-muted">{t.audience}</p>

              {/* progress rail: six squares, one per stage, rising toward the capstone */}
              <div aria-hidden className="mt-7 flex items-end gap-1.5">
                {stages.map((s, i) => (
                  <span key={s.step} className="flex flex-1 flex-col justify-end">
                    <span className={`block w-full ${i === stages.length - 1 ? "bg-glow" : "bg-brand-logo"}`} style={{ height: `${10 + i * 5}px`, opacity: 0.35 + i * 0.13 }} />
                  </span>
                ))}
              </div>
              <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
                {stages.map((s, i) => (
                  <li key={s.step} className="flex gap-3 border-t border-line pt-1.5"><span className="font-mono text-sm text-brand-text">{i + 1}</span><span>{s.step}</span></li>
                ))}
              </ol>

              <p className="mt-6 text-[15px]"><span className="font-semibold">You finish with. </span><span className="text-muted">{last.deliverable ?? last.body}</span></p>
              <ul aria-label="Format" className="mt-4 flex flex-wrap gap-2">{t.format.map((f) => <li key={f} className="rounded-full border border-line-strong px-3 py-0.5 text-sm">{f}</li>)}</ul>

              <div className="mt-auto flex flex-wrap gap-3 pt-7">
                <ButtonLink href="/tep#tracks" variant="secondary" event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "home_details" }}>Explore the program</ButtonLink>
                <ButtonLink href={`/contact?intent=tep&track=${t.slug}`} event="tep_track_select" eventProps={{ track_id: t.slug, cta_id: "home_enquire" }}>Enquire or apply</ButtonLink>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-muted">Mentor-led, hands-on, and built around real projects. Dates and fees are shared when you enquire. <Link href="/tep" className="font-semibold text-brand-text underline underline-offset-4">See the full program</Link></p>
    </InView>
  );
}
