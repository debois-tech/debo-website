"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-choreography wrapper. The server HTML carries no `data-inview`, so everything is visible by default
 * (no-JS, and no hidden above-the-fold text delaying first paint).
 *
 * After hydration, one IntersectionObserver per block reports its state asynchronously (no forced layout, unlike
 * reading getBoundingClientRect): blocks that start OFF screen are hidden ("false"), then flipped to "true" once,
 * the first time they are meaningfully on screen. Blocks that start on screen are simply left visible.
 */
export function InView({
  children, className = "", threshold = 0.25, onEnter,
}: { children: ReactNode; className?: string; threshold?: number; onEnter?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onEnter);
  useEffect(() => { cb.current = onEnter; });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let first = true;
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (first) {
        first = false;
        if (!e.isIntersecting) el.dataset.inview = "false"; // starts below the fold: hide until reached
        else if (e.intersectionRatio >= threshold) { cb.current?.(); io.disconnect(); return; } // already in view: leave visible
        else return; // peeking in: leave visible, keep watching for onEnter
      }
      if (e.isIntersecting && e.intersectionRatio >= threshold) {
        el.dataset.inview = "true";
        cb.current?.();
        io.disconnect();
      }
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return <div ref={ref} className={className}>{children}</div>;
}

/** Fades and lifts its content in once, when it first scrolls into view. `delay` is in seconds. */
export function Reveal({ children, className = "", delay = 0, threshold = 0.15 }: { children: ReactNode; className?: string; delay?: number; threshold?: number }) {
  return <InView threshold={threshold}><div className={`reveal ${className}`} style={{ ["--d" as string]: `${delay}s` }}>{children}</div></InView>;
}
