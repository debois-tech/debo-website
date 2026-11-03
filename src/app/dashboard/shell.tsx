"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/Skeleton";

/* ---------- feedback: toasts and the confirm dialog ---------- */
// Plain module-level channels, so any save or delete handler can call notify() / askConfirm() without prop drilling.
type Toast = { id: number; msg: string; kind: "ok" | "error" };
type ConfirmReq = { title: string; body?: string; confirmLabel: string; resolve: (ok: boolean) => void };
const toastSubs = new Set<(t: Toast) => void>();
let toastId = 0;
let confirmSub: ((r: ConfirmReq) => void) | null = null;

/** Show a short message at the bottom of the screen. Errors stay longer. */
export function notify(msg: string, kind: "ok" | "error" = "ok") {
  const t = { id: ++toastId, msg, kind };
  toastSubs.forEach((f) => f(t));
}

/** Ask before something that cannot be undone. Resolves true if the person confirms. */
export function askConfirm(o: { title: string; body?: string; confirmLabel?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!confirmSub) { resolve(window.confirm(o.title)); return; }
    confirmSub({ title: o.title, body: o.body, confirmLabel: o.confirmLabel ?? "Delete", resolve });
  });
}

const btn = "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50";

/** Mount once. Renders the toast stack and the confirm dialog. */
export function FeedbackHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [req, setReq] = useState<ConfirmReq | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const sub = (t: Toast) => {
      setToasts((c) => [...c.slice(-3), t]);
      window.setTimeout(() => setToasts((c) => c.filter((x) => x.id !== t.id)), t.kind === "error" ? 9000 : 3800);
    };
    toastSubs.add(sub);
    confirmSub = (r) => setReq(r);
    return () => { toastSubs.delete(sub); confirmSub = null; };
  }, []);

  useEffect(() => { if (req && dlg.current && !dlg.current.open) dlg.current.showModal(); }, [req]);
  const close = (ok: boolean) => { dlg.current?.close(); req?.resolve(ok); setReq(null); };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
               className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_12px_40px_-12px_rgba(0,0,0,.8)] ${t.kind === "error" ? "border-error bg-[#2a1212] text-white" : "border-brand-text bg-wash text-ink"}`}>
            <span aria-hidden className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${t.kind === "error" ? "bg-error text-forest" : "bg-glow text-forest"}`}>{t.kind === "error" ? "!" : "✓"}</span>
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
      <dialog ref={dlg} onCancel={(e) => { e.preventDefault(); close(false); }} aria-labelledby="confirm-title"
              className="m-auto w-[min(26rem,92vw)] rounded-2xl border border-line-strong bg-wash p-6 text-ink backdrop:bg-black/70">
        {req && (
          <div>
            <h2 id="confirm-title" className="text-xl font-bold">{req.title}</h2>
            {req.body && <p className="mt-2 text-muted">{req.body}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" autoFocus className={`${btn} border border-line-strong hover:border-brand-text`} onClick={() => close(false)}>Keep it</button>
              <button type="button" className={`${btn} border border-error bg-error text-forest hover:opacity-90`} onClick={() => close(true)}>{req.confirmLabel}</button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

/** Placeholder rows while a list loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line rounded-xl border border-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="size-12 shrink-0" /><div className="mr-auto min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></div><Skeleton className="h-11 w-20 rounded-full" /></div>
      ))}
    </div>
  );
}

/* ---------- sections ---------- */
export type SectionMeta = { id: string; label: string; group: string; blurb: string; /** public page this content appears on */ page?: { href: string; label: string }; path?: string };

export const OVERVIEW: SectionMeta = { id: "overview", label: "Overview", group: "", blurb: "What is on the website, and where to add more." };
export const SECTIONS: SectionMeta[] = [
  { id: "programs", label: "Programs", group: "Website", blurb: "Programs shown on the Program page: running, upcoming and past.", page: { href: "/program", label: "Program page" }, path: "programs" },
  { id: "tep", label: "TEP page", group: "Website", blurb: "Choose which optional sections of the TEP page are shown. Each stays off until you switch it on.", page: { href: "/tep", label: "TEP page" } },
  { id: "team", label: "Team", group: "Website", blurb: "People shown on the home page and the Company page.", page: { href: "/company", label: "Company page" }, path: "team" },
  { id: "blog", label: "Blog", group: "Website", blurb: "Posts and drafts for the Blog.", page: { href: "/blog", label: "Blog" }, path: "posts" },
  { id: "careers", label: "Careers", group: "Website", blurb: "Open roles. With none open, the page says so.", page: { href: "/careers", label: "Careers page" }, path: "openings" },
  { id: "community", label: "Community", group: "Proof and stories", blurb: "Photos from events and communities, shown on the Company page.", page: { href: "/company#gallery", label: "Community gallery" }, path: "community" },
  { id: "testimonials", label: "Testimonials", group: "Proof and stories", blurb: "Client voices on Services, learner voices on the TEP page.", page: { href: "/tep", label: "TEP page" }, path: "testimonials" },
  { id: "mentors", label: "Mentors", group: "Proof and stories", blurb: "Mentors shown on the TEP page.", page: { href: "/tep", label: "TEP page" }, path: "mentors" },
  { id: "achievements", label: "Achievements", group: "Proof and stories", blurb: "Learners’ verified milestones: placements, internships, certificates.", page: { href: "/tep", label: "TEP page" }, path: "achievements" },
  { id: "projects", label: "Projects", group: "Proof and stories", blurb: "Capstones and learner projects for the TEP page.", page: { href: "/tep", label: "TEP page" }, path: "projects" },
  { id: "journeys", label: "Journeys", group: "Proof and stories", blurb: "Before-and-after learner stories for the TEP page.", page: { href: "/tep", label: "TEP page" }, path: "journeys" },
  { id: "setup", label: "Setup", group: "Admin", blurb: "Import existing content and check your access." },
];
export const ALL_SECTIONS = [OVERVIEW, ...SECTIONS];
const GROUPS = ["", "Website", "Proof and stories", "Admin"];

/* ---------- layout ---------- */
function Nav({ current, onPick, counts }: { current: string; onPick: (id: string) => void; counts: Record<string, number | undefined> }) {
  return (
    <nav aria-label="Dashboard sections" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g || "top"}>
          {g && <p className="mb-1 px-3 text-xs font-semibold text-muted">{g}</p>}
          <ul className="space-y-0.5">
            {ALL_SECTIONS.filter((s) => s.group === g).map((s) => {
              const on = s.id === current, n = counts[s.id];
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => onPick(s.id)} aria-current={on ? "page" : undefined}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-[15px] font-semibold transition-colors ${on ? "bg-glow text-forest" : "text-ink hover:bg-paper"}`}>
                    <span>{s.label}</span>
                    {n !== undefined && <span className={`rounded-full px-2 text-xs ${on ? "bg-forest/15" : "bg-paper text-muted"}`}>{n}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Shell({ email, onSignOut, current, onPick, counts, children }: {
  email: string; onSignOut: () => void; current: string; onPick: (id: string) => void; counts: Record<string, number | undefined>; children: ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const meta = ALL_SECTIONS.find((s) => s.id === current) ?? OVERVIEW;
  const pick = (id: string) => { onPick(id); setMenu(false); window.scrollTo({ top: 0 }); };
  useEffect(() => {
    if (!menu) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [menu]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* top bar on phones */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur lg:hidden">
        <button type="button" aria-expanded={menu} aria-controls="dash-menu" onClick={() => setMenu((m) => !m)} className={`${btn} border border-line-strong`}>
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden className="mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14" /></svg>Menu
        </button>
        <p className="mr-auto truncate font-bold">{meta.label}</p>
        <Link href="/" target="_blank" rel="noopener" className="text-sm font-semibold text-brand-text underline underline-offset-4">View site<span className="sr-only"> (opens in a new tab)</span></Link>
      </header>
      {menu && (
        <div id="dash-menu" className="fixed inset-x-0 bottom-0 top-[3.5rem] z-10 overflow-y-auto bg-wash p-4 lg:hidden">
          <Nav current={current} onPick={pick} counts={counts} />
          <div className="mt-6 border-t border-line pt-4"><p className="truncate text-sm text-muted">{email}</p><button type="button" onClick={onSignOut} className={`${btn} mt-3 border border-line-strong`}>Sign out</button></div>
        </div>
      )}

      {/* sidebar on large screens */}
      <aside className="hidden border-r border-line bg-wash lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:p-4">
        <div className="px-3 pb-5 pt-2"><p className="text-lg font-bold">DeboisTech</p><p className="text-sm text-muted">Website dashboard</p></div>
        <Nav current={current} onPick={pick} counts={counts} />
        <div className="mt-auto space-y-3 border-t border-line px-3 pt-4">
          <Link href="/" target="_blank" rel="noopener" className="inline-block text-sm font-semibold text-brand-text underline underline-offset-4">View the website<span className="sr-only"> (opens in a new tab)</span></Link>
          <p className="truncate text-sm text-muted" title={email}>{email}</p>
          <button type="button" onClick={onSignOut} className={`${btn} w-full border border-line-strong hover:border-brand-text`}>Sign out</button>
        </div>
      </aside>

      <div id="dash-main" className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="display text-3xl sm:text-4xl">{meta.label}</h1>
            <p className="mt-2 max-w-2xl text-muted">{meta.blurb}{meta.page && <> <Link href={meta.page.href} target="_blank" rel="noopener" className="font-semibold text-brand-text underline underline-offset-4">See it on the {meta.page.label}<span className="sr-only"> (opens in a new tab)</span></Link></>}</p>
          </header>
          {children}
        </div>
      </div>
      <FeedbackHost />
    </div>
  );
}
