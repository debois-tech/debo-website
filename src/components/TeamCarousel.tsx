"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TEAM, type Member } from "@/content/team";

const SPEED = 36; // px per second of continuous drift

/** Reads prefers-reduced-motion without setting state in an effect. Assumes "reduce" on the server so nothing moves before hydration. */
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/**
 * Team carousel on a native scroller (swipe, trackpad, keyboard-tabbing all work).
 * Autoplay drifts continuously and glides back to the start at the end. It pauses on hover, on focus inside, while the tab is hidden,
 * and when the carousel is off-screen. Visitors who prefer reduced motion get no autoplay.
 */
export function TeamCarousel({ members = TEAM }: { members?: readonly Member[] }) {
  const track = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const playing = !reduced;
  const [hold, setHold] = useState(false); // temporary pause (hover / focus)
  const visible = useRef(true);

  useEffect(() => {
    const el = track.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current; if (!el) return;
    const card = el.querySelector("li"); if (!card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const w = card.getBoundingClientRect().width + gap;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior });
    else el.scrollBy({ left: dir * w, behavior });
  }, []);

  useEffect(() => {
    if (!playing || hold) return;
    const el = track.current; if (!el) return;
    let raf = 0, last = 0, pos = el.scrollLeft, returning = false;
    const tick = (t: number) => {
      const dt = last ? Math.min(t - last, 64) : 0; last = t;
      if (visible.current && !document.hidden) {
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft; // the visitor (or a button) moved it; carry on from there
        const max = el.scrollWidth - el.clientWidth;
        if (returning) { if (el.scrollLeft <= 4) { returning = false; pos = el.scrollLeft; } }
        else if (pos >= max - 1) { returning = true; el.scrollTo({ left: 0, behavior: "smooth" }); }
        else { pos = Math.min(max, pos + (SPEED * dt) / 1000); el.scrollLeft = pos; }
      } else last = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, hold]);

  const btn = "inline-flex size-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-brand-text hover:text-brand-text";

  return (
    <div role="group" aria-roledescription="carousel" aria-label="DeboisTech team"
         onPointerEnter={(e) => { if (e.pointerType === "mouse") setHold(true); }} onPointerLeave={() => setHold(false)}
         onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <ul ref={track} className="flex gap-6 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {members.map((m) => (
          <li key={m.name} className="w-[calc((100%-1.5rem)/2)] shrink-0 sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]">
            <Image src={m.photo} alt={`Portrait of ${m.name}`} width={320} height={320} className="aspect-square w-full rounded-[var(--radius)] border border-line object-cover" />
            <p className="mt-3 font-bold">{m.name}</p>
            <p className="text-sm text-muted">{m.title}</p>
            {m.linkedin && (
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block py-3 text-sm font-semibold text-brand-text underline underline-offset-4">
                LinkedIn<span className="sr-only"> profile of {m.name} (opens in a new tab)</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" className={btn} onClick={() => step(-1)} aria-label="Previous team members">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
        </button>
        <button type="button" className={btn} onClick={() => step(1)} aria-label="Next team members">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
