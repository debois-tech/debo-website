"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { SERVICES } from "@/content/services";
import { track } from "@/lib/analytics";
import { ButtonLink } from "./ui";

/**
 * Compact services explorer: pick a service in the list, read it in the panel.
 * Desktop: list on the left, panel on the right. Phones: the list becomes a swipeable row of chips above the panel.
 * Click, tap, arrow keys (Home/End too) or moving a mouse over a tab all change the selection (a still pointer never does, so keyboard use is not overridden when the page scrolls under it); the panel keeps a fixed height so the page never jumps.
 */
export function ServicesExplorer() {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = SERVICES[i];
  const pick = (n: number, focus = false) => { const k = (n + SERVICES.length) % SERVICES.length; setI(k); track("service_cta_click", { service_slug: SERVICES[k].slug, cta_id: "explorer_select" }); if (focus) refs.current[k]?.focus(); };
  const onKey = (e: KeyboardEvent, n: number) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? n + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? n - 1 : e.key === "Home" ? 0 : e.key === "End" ? SERVICES.length - 1 : null;
    if (next === null) return;
    e.preventDefault(); pick(next, true);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
      <div role="tablist" aria-label="Engineering services" aria-orientation="vertical"
           className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-line lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {SERVICES.map((x, n) => {
          const on = n === i;
          return (
            <button key={x.slug} ref={(el) => { refs.current[n] = el; }} role="tab" id={`svc-tab-${x.slug}`} aria-selected={on} aria-controls="svc-panel" tabIndex={on ? 0 : -1}
              onClick={() => pick(n)} onKeyDown={(e) => onKey(e, n)} onPointerMove={(e) => { if (e.pointerType === "mouse" && !on) pick(n); }}
              className={`group relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-left text-base font-semibold transition-colors lg:flex lg:min-h-14 lg:items-center lg:justify-between lg:whitespace-normal lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-3 lg:py-0 lg:text-xl ${on ? "border-ink bg-ink text-white lg:bg-wash lg:text-ink" : "border-line-strong text-muted hover:text-ink"}`}>
              <span aria-hidden className={`absolute inset-y-0 left-0 hidden w-1 bg-brand-logo transition-transform duration-300 lg:block ${on ? "scale-y-100" : "scale-y-0"}`} />
              <span className="lg:pl-3">{x.name}</span>
              <span aria-hidden className={`hidden text-brand-text transition-all duration-300 lg:block ${on ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}>→</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="svc-panel" aria-labelledby={`svc-tab-${s.slug}`} tabIndex={0}
           className="rounded-[var(--radius-lg)] border border-line bg-wash p-6 sm:p-8 lg:min-h-[23rem]">
        <div key={s.slug} className="svc-panel-in">
          <h3 className="display text-3xl sm:text-4xl">{s.name}</h3>
          <p className="mt-3 max-w-xl text-lg text-muted">{s.short}</p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div><p className="text-sm font-semibold">Who it’s for</p><p className="mt-1 text-muted">{s.audience}</p></div>
            <div>
              <p className="text-sm font-semibold">Typical deliverables</p>
              <ul className="mt-1 space-y-1.5">{s.deliverables.map((d) => <li key={d} className="flex gap-2.5 text-muted"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-brand-logo" />{d}</li>)}</ul>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href={`/services/${s.slug}`} event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "explorer_learn_more" }}>Learn more</ButtonLink>
            <ButtonLink href={`/contact?intent=project&topic=${s.slug}`} variant="secondary" event="service_cta_click" eventProps={{ service_slug: s.slug, cta_id: "explorer_enquire" }}>Discuss {s.name}</ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
