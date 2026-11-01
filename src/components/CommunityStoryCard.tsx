import Image from "next/image";
import Link from "next/link";
import type { CommunityStory } from "@/content/community";

/** One community story: date-led when there is a verified date, with an optional real photo, flow, facts and destination. */
/**
 * Large-screen width (of 12) for story `i` of `total`: cards pair up as wide + narrow, alternating which comes first, and a lone last card
 * takes the full row. Any number of stories lays out without gaps.
 */
const spanFor = (i: number, total: number) => (i === total - 1 && total % 2 === 1 ? "lg:col-span-12" : (i + Math.floor(i / 2)) % 2 === 0 ? "lg:col-span-5" : "lg:col-span-7");

export function CommunityStoryCard({ story: s, index = 0, total = 1 }: { story: CommunityStory; index?: number; total?: number }) {
  const h = `story-${s.id}`;
  return (
    <article aria-labelledby={h} className={`reveal group relative flex flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-paper transition-colors hover:border-brand-text ${spanFor(index, total)}`} style={{ ["--d" as string]: `${(index % 2) * 0.08}s` }}>
      {s.image && (
        <figure className="relative aspect-[16/9] overflow-hidden border-b border-line">
          <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: s.image.position }} />
        </figure>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="font-semibold text-brand-text">{s.org}</p>
        {s.date && <p className="display mt-2 text-4xl sm:text-5xl">{s.date}</p>}
        <h3 id={h} className={`${s.date ? "mt-3 text-xl font-bold leading-snug" : "display mt-2 text-3xl sm:text-4xl"}`}>{s.title}</h3>
        {s.location && <p className="mt-1 text-sm text-muted">{s.location}</p>}
        <p className="mt-3 max-w-xl leading-relaxed text-muted">{s.summary}</p>
        {s.role && <p className="mt-3 max-w-xl"><span className="font-semibold">Our role. </span><span className="text-muted">{s.role}</span></p>}
        {s.flow && (
          <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {s.flow.map((f, i) => <li key={f} className="border-t-2 border-brand-logo pt-3 text-[15px]"><span className="font-mono text-sm text-brand-text">{i + 1}</span><span className="mt-1 block">{f}</span></li>)}
          </ol>
        )}
        {s.facts && (
          <dl className="mt-6 grid max-w-xl grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 border-t border-line pt-4 text-sm">
            {s.facts.map((f) => <div key={f.label} className="contents"><dt className="text-muted">{f.label}</dt><dd>{f.value}</dd></div>)}
          </dl>
        )}
        {s.link && (
          <Link href={s.link.href} className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-6 font-semibold text-brand-text underline underline-offset-4 after:absolute after:inset-0">
            {s.link.label}<span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
