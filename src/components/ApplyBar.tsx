"use client";
import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { TrackedLink } from "./TrackedLink";

/**
 * Mobile-only sticky bar: one primary Apply action plus a WhatsApp shortcut, within thumb reach.
 * It appears after the first screen so it never covers the hero, and hides while the page's own form/CTA is in view.
 */
export function ApplyBar({ href, label = "Apply for TEP", note, hideWhenVisible = "#apply" }: { href: string; label?: string; note?: string; hideWhenVisible?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let raf = 0;
    const target = hideWhenVisible ? document.querySelector(hideWhenVisible) : null;
    const update = () => {
      raf = 0;
      const past = window.scrollY > window.innerHeight * 0.6;
      const r = target?.getBoundingClientRect();
      const overlapping = !!r && r.top < window.innerHeight && r.bottom > 0;
      setShown(past && !overlapping);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [hideWhenVisible]);

  const wa = `${SITE.whatsapp}?text=${encodeURIComponent("Hi DeboisTech, I'd like to know more about the Technology Excellence Program.")}`;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-paper/95 pl-3 pr-[5.5rem] pt-2 backdrop-blur transition-transform duration-200 sm:hidden ${shown ? "visible translate-y-0" : "invisible translate-y-full"}`}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {note && <p className="mb-1 truncate text-center text-xs text-muted">{note}</p>}
      <div className="flex items-center gap-2">
        <TrackedLink href={href} event="apply_click" eventProps={{ cta_id: "sticky_apply", placement: "sticky_bar" }}
          ariaLabel={label}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-glow px-5 text-[15px] font-semibold text-forest">
          {label}
        </TrackedLink>
        <TrackedLink href={wa} event="whatsapp_click" eventProps={{ cta_id: "sticky_whatsapp", placement: "sticky_bar" }}
          ariaLabel="Chat on WhatsApp"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-brand-text">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.8-.1 1.3Z"/></svg>
        </TrackedLink>
      </div>
    </div>
  );
}
