import Link from "next/link";
import type { ReactNode } from "react";
import { TrackedLink } from "./TrackedLink";
import { InView } from "./InView";
import type { AnalyticsEvent } from "@/lib/analytics";

type Variant = "primary" | "secondary" | "ghost";
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,transform,box-shadow] duration-200 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";
export const buttonClass = (variant: Variant = "primary") =>
  `${base} ${
    variant === "primary"
      ? "bg-glow text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_30px_-10px_rgba(74,174,94,0.6)] hover:bg-glow-hi"
      : variant === "secondary"
        ? "border border-line-strong text-ink hover:border-brand-text hover:text-brand-text"
        : "text-brand-text hover:text-ink"
  }`;

export function ButtonLink({
  href, children, variant = "primary", event, eventProps, className = "",
}: {
  href: string; children: ReactNode; variant?: Variant; dark?: boolean; className?: string; // `dark` is accepted for older call sites; the site is dark throughout
 
  event?: AnalyticsEvent; eventProps?: Record<string, string>;
}) {
  return (
    <TrackedLink href={href} className={`${buttonClass(variant)} max-sm:w-full ${className}`} event={event} eventProps={{ destination: href, ...eventProps }}>
      {children}
    </TrackedLink>
  );
}

export function Section({
  id, theme = "light", children, className = "", labelledBy,
}: { id?: string; theme?: "light" | "mint" | "dark" | "white"; children: ReactNode; className?: string; labelledBy?: string }) {
  const bg = theme === "dark" ? "bg-paper text-ink on-dark" : theme === "mint" ? "bg-paper text-ink" : theme === "white" ? "light-surface" : "bg-paper text-ink";
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${bg} py-14 sm:py-28 ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function SectionHeader({
  id, eyebrow, title, lead, dark = false, as: H = "h2",
}: { id?: string; eyebrow?: string; title: string; lead?: string; dark?: boolean; as?: "h1" | "h2" }) {
  const heading = H === "h1"
    ? <H id={id} className="display text-4xl sm:text-6xl lg:text-7xl">{title}</H>
    : <H id={id} className="display text-4xl sm:text-6xl lg:text-7xl"><span className="mask"><span>{title}</span></span></H>;
  const body = (
    <>
      {eyebrow && <p className={`reveal mb-4 text-base font-semibold ${dark ? "text-glow" : "text-brand-text"}`}>{eyebrow}</p>}
      {heading}
      {lead && <p className={`reveal mt-4 max-w-2xl text-lg leading-relaxed text-muted sm:mt-6 sm:text-xl`} style={{ ["--d" as string]: ".15s" }}>{lead}</p>}
    </>
  );
  return (
    <header className="mb-8 max-w-4xl sm:mb-16">
      {H === "h1" ? body : <InView threshold={0.3}>{body}</InView>}
    </header>
  );
}

export function Badge({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${dark ? "border-glow/50 text-glow" : "border-brand-text/40 text-brand-text"}`}>
      {children}
    </span>
  );
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-paper">
      <div className="container-x pb-12 pt-10 sm:pb-24 sm:pt-24">
        <SectionHeader as="h1" eyebrow={eyebrow} title={title} lead={lead} />
        {children && <div className="-mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="container-x pt-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            {it.href ? <Link href={it.href} className="underline-offset-4 hover:underline">{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius)] border border-line bg-wash p-6 ${className}`}>{children}</div>;
}
