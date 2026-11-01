"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics";

export type PillarTab = { id: string; name: string; line: string; count: number; panel: ReactNode };

/**
 * One pillar at a time. All panels are in the HTML (hidden ones are simply not displayed), so nothing is lost for search engines or no-JS.
 * Links to a service (#svc-…) or a pillar (#pillar-…) switch to the right tab and scroll to it. Arrow keys move between tabs.
 */
export function PillarTabs({ tabs, serviceToPillar }: { tabs: PillarTab[]; serviceToPillar: Record<string, string> }) {
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const top = useRef<HTMLDivElement>(null);

  const select = useCallback((id: string, focus = false) => {
    setActive(id);
    track("service_cta_click", { cta_id: `pillar_${id}` });
    if (focus) refs.current[tabs.findIndex((t) => t.id === id)]?.focus();
  }, [tabs]);

  useEffect(() => {
    const go = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      const pillar = h.startsWith("pillar-") ? h.slice(7) : h.startsWith("svc-") ? serviceToPillar[h.slice(4)] : undefined;
      if (!pillar || !tabs.some((t) => t.id === pillar)) return;
      setActive(pillar);
      requestAnimationFrame(() => (h.startsWith("svc-") ? document.getElementById(h) : top.current)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [tabs, serviceToPillar]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
    if (n === null) return;
    e.preventDefault(); select(tabs[(n + tabs.length) % tabs.length].id, true);
  };

  return (
    <div ref={top} id="pillar-top" className="scroll-mt-28">
      <div role="tablist" aria-label="Services by what they do for you" className="grid grid-cols-3 border-b border-line">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={`tab-${t.id}`} aria-selected={on} aria-controls={`panel-${t.id}`} tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)} onKeyDown={(e) => onKey(e, i)}
              className={`relative min-h-14 px-2 pb-3 pt-2 text-left transition-colors sm:px-1 ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
              <span className="block text-base font-bold uppercase tracking-wide sm:text-xl">{t.name}</span>
              <span className="hidden text-sm sm:block">{t.line}</span>
              <span className="mt-0.5 block text-xs sm:hidden">{t.count} services</span>
              <span aria-hidden className={`absolute inset-x-0 -bottom-px h-0.5 transition-colors ${on ? "bg-brand-logo" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active} tabIndex={0} className="pt-6">
          {t.panel}
        </div>
      ))}
    </div>
  );
}
