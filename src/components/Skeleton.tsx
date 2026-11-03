import type { CSSProperties } from "react";
import { Section } from "./ui";

/** One placeholder block. Size it with Tailwind classes; it shimmers (or sits still with reduced motion). */
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />;
}

/** Placeholder text lines; the last one is shorter, like a paragraph. */
export function SkeletonLines({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className="h-4" style={{ width: i === lines - 1 ? "62%" : "100%" }} />)}
    </div>
  );
}

/** Mirrors PageHero: dark band with a heading and a short lead. */
export function HeroSkeleton() {
  return (
    <div className="border-b border-line bg-paper">
      <div className="container-x pb-12 pt-10 sm:pb-24 sm:pt-24">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-5 h-12 w-[min(32rem,90%)] sm:h-16" />
        <SkeletonLines lines={2} className="mt-6 max-w-2xl" />
      </div>
    </div>
  );
}

/** A grid of card placeholders on the white content surface. */
export function CardsSkeleton({ count = 3, cols = "md:grid-cols-3" }: { count?: number; cols?: string }) {
  return (
    <Section theme="white">
      <div className={`grid grid-cols-1 gap-6 ${cols}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-line p-6">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="mt-5 h-6 w-2/3" />
            <SkeletonLines lines={3} className="mt-4" />
            <Skeleton className="mt-6 h-11 w-36 rounded-full" />
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Announces loading to screen readers once; the blocks themselves are hidden from them. */
export function LoadingShell({ label = "Loading page", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}
