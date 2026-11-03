"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NAV } from "@/content/site";
import { track } from "@/lib/analytics";
import { buttonClass } from "./ui";

/**
 * Liquid-glass navigation. The pill is frosted material (blur + saturation, a fine light-catching edge, soft depth).
 * It reads what is underneath it and switches between dark and light glass so text always sits on the right surface,
 * and it condenses slightly once you scroll.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname; // closes automatically on navigation
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenAt((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // Tone + condensed state are written straight to data attributes: no re-render on every scroll frame.
  useEffect(() => {
    const pill = pillRef.current, host = pill?.parentElement;
    if (!pill || !host) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      host.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
      const r = pill.getBoundingClientRect();
      // Sample three points across the pill; majority wins. A pixel-edge SVG is decoration, so look just below it instead.
      let lightVotes = 0;
      for (const f of [0.22, 0.5, 0.78]) {
        const x = r.left + r.width * f;
        let el = document.elementsFromPoint(x, r.top + r.height / 2).find((e) => !host.contains(e));
        if (el?.closest("[data-edge]")) el = document.elementsFromPoint(x, r.bottom + 14).find((e) => !host.contains(e));
        if (el?.closest(".light-surface")) lightVotes++;
      }
      host.dataset.tone = lightVotes >= 2 ? "light" : "dark";
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenAt(null); btnRef.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : href === "/program" ? ["/program", "/tep"].some((b) => pathname === b || pathname.startsWith(b + "/")) : pathname === href || pathname.startsWith(href + "/")); // /tep lives under Program
  const link = (href: string, label: string, placement: string, mobile = false) => (
    <Link
      key={href} href={href}
      aria-current={isActive(href) ? "page" : undefined}
      onClick={() => track("nav_click", { destination: href, placement })}
      className={`${mobile ? "block px-4 py-3 text-base" : "px-3.5 py-2 text-[13.5px]"} rounded-full font-semibold tracking-[-0.01em] transition-[background-color,color] duration-200
        ${isActive(href) ? "glass-active" : "glass-link"}`}
    >
      {label}
    </Link>
  );

  return (
    <header data-tone="dark" data-scrolled="false" className="glass-host pointer-events-none sticky top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
      <div ref={pillRef} className="glass-pill pointer-events-auto relative mx-auto flex items-center justify-between gap-4 rounded-full pl-5 pr-2">
        <Link href="/" aria-label="DeboisTech — home" className="inline-grid min-h-11 shrink-0 place-items-center">
          <Image src="/brand/logo-horizontal-dark.webp" alt="DeboisTech" width={3064} height={630} sizes="140px" priority className="glass-logo-dark col-start-1 row-start-1 h-7 w-auto" />
          <Image src="/brand/logo-horizontal-light.webp" alt="" aria-hidden width={3064} height={630} sizes="140px" className="glass-logo-light col-start-1 row-start-1 h-7 w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {NAV.filter((n) => n.href !== "/contact").map((n) => link(n.href, n.label, "header"))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <Link href="/contact" onClick={() => track("nav_click", { destination: "/contact", placement: "header_cta" })}
                  className={`${buttonClass("primary")} !min-h-9 !px-4 !py-1.5 !text-[13.5px]`}>
              Let’s build together
            </Link>
          </span>
          <button
            ref={btnRef} type="button" aria-expanded={open} aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="glass-link inline-flex size-11 items-center justify-center rounded-full lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
            </svg>
          </button>
        </div>

      </div>
      <div id={panelId} hidden={!open} className="glass-panel pointer-events-auto absolute inset-x-3 top-[4.25rem] rounded-3xl p-3 sm:inset-x-5 lg:hidden">
        <nav aria-label="Mobile primary" className="flex flex-col">
          {NAV.map((n) => link(n.href, n.label, "mobile_menu", true))}
          <Link href="/contact" className={`${buttonClass("primary")} mt-3`}>Let’s build together</Link>
        </nav>
      </div>
    </header>
  );
}
