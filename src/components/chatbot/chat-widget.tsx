"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  completeSubmission, handleInput, inFlow, initialState, placeholderFor, reprompt, welcome,
  type BotMessage, type FlowContext, type FlowResult, type FlowState, type Option, type SubmitPayload,
} from "@/lib/chatbot/flows";
import { offlineReply } from "@/lib/chatbot/offline";

type Msg = BotMessage & { id: string; role: "bot" | "user"; at: number };
type Saved = { id: string; savedAt: number; messages: Msg[]; state: FlowState };

const KEY = "debo-chat-v1";
const NUDGE_KEY = "debo-chat-nudged";
const TTL = 24 * 60 * 60 * 1000;
const LOGO = "/brand/debo-icon.png";
const MOBILE = "(max-width: 639px)";
const NEAR_BOTTOM = 120;

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    return Date.now() - s.savedAt < TTL && Array.isArray(s.messages) && s.state ? s : null;
  } catch { return null; }
}
function save(s: Saved) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BULLET_RE = /^\s*[-•*]\s+/;
const safeHref = (h: string) => (h.startsWith("/") && !h.startsWith("//")) || /^https?:\/\//i.test(h) || /^mailto:/i.test(h);
const external = (h: string) => !h.startsWith("/");

/** Inline text with simple [label](url) links. React escapes everything else. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    out.push(text.slice(last, m.index));
    out.push(safeHref(m[2])
      ? <a key={m.index} href={m[2]} target={external(m[2]) ? "_blank" : undefined} rel="noopener noreferrer" className="font-semibold text-[var(--d-brand-hi)] underline underline-offset-2 hover:text-white">{m[1]}</a>
      : m[1]);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/** Paragraphs, bullet lists, line breaks and links. */
function Rich({ text }: { text: string }) {
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => BULLET_RE.test(l))) {
      return <ul key={i} className={`${i ? "mt-2" : ""} list-disc space-y-1 pl-5`}>{lines.map((l, j) => <li key={j}>{inline(l.replace(BULLET_RE, ""))}</li>)}</ul>;
    }
    return <p key={i} className={i ? "mt-2" : ""}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>;
  });
}

function Logo({ size, className = "" }: { size: number; className?: string }) {
  return <Image src={LOGO} alt="" width={size} height={size} className={className} />;
}

const pill = "rounded-full border px-4 py-2 text-sm font-semibold leading-snug transition-colors duration-150";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const onHome = usePathname() === "/";
  const [online, setOnline] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [flow, setFlow] = useState<FlowState>(initialState);
  const [convId, setConvId] = useState("");
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const stick = useRef(true);
  const busy = useRef(false);
  const ctxRef = useRef<FlowContext>({});
  const flowRef = useRef(flow);
  const messagesRef = useRef(messages);
  useEffect(() => { flowRef.current = flow; messagesRef.current = messages; }, [flow, messages]);

  useEffect(() => {
    const s = load();
    const m = s?.messages ?? [{ ...welcome(), id: uid(), role: "bot" as const, at: Date.now() }];
    /* eslint-disable react-hooks/set-state-in-effect -- restoring client-only storage after hydration */
    setMessages(m);
    setFlow(s?.state ?? initialState());
    setConvId(s?.id ?? uid());
    /* eslint-enable react-hooks/set-state-in-effect */
    let seen = false;
    try { seen = !!sessionStorage.getItem(NUDGE_KEY); } catch { /* ignore */ }
    if (seen) return;
    const t = setTimeout(() => setNudge(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (convId && messages.length) save({ id: convId, savedAt: Date.now(), messages, state: flow });
  }, [messages, flow, convId]);

  // Composer grows with its content up to ~7rem, then scrolls inside itself (scrollbar hidden).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [draft, open]);

  // Keep the newest message in view, unless the visitor has scrolled up to read.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (stick.current || last?.role === "user") el.scrollTo({ top: el.scrollHeight });
  }, [messages, typing, open]);

  const onLogScroll = () => {
    const el = logRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
  };

  // The status dot reflects a real round trip to the assistant's backend, not an assumption.
  useEffect(() => {
    if (!open || ctxRef.current.programs) return;
    fetch("/api/chat/context").then((r) => r.json()).then((d) => {
      if (d?.ok && typeof d.programs === "string") { ctxRef.current = { programs: d.programs }; setOnline(true); }
    }).catch(() => setOnline(false));
  }, [open]);

  // Mobile: lock the page behind the chat and track the visual viewport so the keyboard never covers the composer.
  useEffect(() => {
    if (!open || !window.matchMedia(MOBILE).matches) return;
    const panel = panelRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const vv = window.visualViewport;
    const sync = () => {
      if (!vv || !panel) return;
      panel.style.setProperty("--debo-vh", `${vv.height}px`);
      panel.style.setProperty("--debo-top", `${vv.offsetTop}px`);
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    };
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    return () => {
      document.body.style.overflow = prev;
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
    };
  }, [open]);

  // Focus: composer on open (not on touch, where it would raise the keyboard), launcher on close.
  useEffect(() => {
    if (open) {
      if (!window.matchMedia("(pointer: coarse)").matches) inputRef.current?.focus();
    } else if (wasOpen.current) {
      launcherRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmReset) setConfirmReset(false); else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmReset]);

  const dismissNudge = () => {
    setNudge(false);
    try { sessionStorage.setItem(NUDGE_KEY, "1"); } catch { /* ignore */ }
  };
  const openChat = () => { dismissNudge(); setOpen(true); };
  const closeChat = () => { setConfirmReset(false); setOpen(false); };

  const push = useCallback((role: "bot" | "user", m: BotMessage | { text: string }) => {
    setMessages((prev) => [...prev, { ...m, id: uid(), role, at: Date.now() }]);
  }, []);
  const pushBot = useCallback((msgs: BotMessage[]) => msgs.forEach((m) => push("bot", m)), [push]);

  const restart = () => {
    stick.current = true;
    setMessages([{ ...welcome(), id: uid(), role: "bot", at: Date.now() }]);
    setFlow(initialState());
    setConvId(uid());
    setPicked([]);
    setDraft("");
    setConfirmReset(false);
  };
  const askReset = () => (messages.some((m) => m.role === "user") ? setConfirmReset(true) : restart());

  async function askModel(text: string, state: FlowState) {
    setTyping(true);
    const history = [...messagesRef.current, { role: "user" as const, text }]
      .filter((m) => m.text)
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));
    let reply: { text: string; action?: { label: string; href: string } };
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, conversationId: convId }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("chat failed");
      reply = { text: data.text, action: data.action };
    } catch {
      reply = offlineReply(text);
    }
    setTyping(false);
    push("bot", reply);
    pushBot(reprompt(state));
  }

  async function postEnquiry(payload: SubmitPayload) {
    setTyping(true);
    let ok = false;
    try {
      const res = await fetch("/api/project-enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      ok = res.ok && data?.ok === true;
    } catch { ok = false; }
    setTyping(false);
    return ok;
  }

  async function handle(text: string, value?: string) {
    if (busy.current) return;
    busy.current = true;
    try {
      if (text) push("user", { text });
      setDraft("");
      setPicked([]);
      const result: FlowResult = handleInput(flowRef.current, { text, value }, ctxRef.current);
      setFlow(result.state);

      if (result.submit && result.url) {
        // Open the destination straight from the click: pop-up blockers allow it, and there is no window handle to navigate later
        // (cross-origin redirects of a pre-opened tab are refused by some browsers). The enquiry is posted in parallel.
        const tab = window.open(result.url, "_blank");
        if (tab) { try { tab.opener = null; } catch { /* already isolated */ } }
        const ok = await postEnquiry(result.submit);
        const done = completeSubmission(result.state, ok);
        setFlow(done.state);
        pushBot(done.messages);
        if (!tab) {
          const label = result.channel === "whatsapp" ? "Open WhatsApp" : "Open Gmail";
          push("bot", { text: "Your browser blocked the new tab. Use this button to open your prefilled message.", action: { label, href: result.url } });
        }
        return;
      }
      if (result.chat) {
        await askModel(text, result.state);
        return;
      }
      if (result.messages.length) {
        setTyping(true);
        await new Promise((r) => setTimeout(r, 350));
        setTyping(false);
        pushBot(result.messages);
      }
    } finally {
      busy.current = false;
    }
  }

  const canSend = !!draft.trim() && !typing;
  const send = () => { if (canSend && !busy.current) void handle(draft.trim().slice(0, 2000)); };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };
  const choose = (o: Option) => { if (!busy.current) void handle(o.label, o.value); };
  const last = messages[messages.length - 1];
  const active = flow.step !== "idle" && inFlow(flow);

  return (
    <div className="debo">
      {open && (
        <section ref={panelRef} role="dialog" aria-label="DeboisTech assistant" className="debo-panel">
          <header className="debo-head shrink-0 border-b border-[var(--d-border)] bg-[var(--d-raised)]">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="relative shrink-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--d-bg)] ring-1 ring-[var(--d-border)]"><Logo size={36} /></span>
                {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[var(--d-brand)] ring-2 ring-[var(--d-raised)]" title="Assistant is available" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold leading-tight tracking-[-0.01em]">Debo</h2>
                <p className="truncate text-xs text-[var(--d-muted)]">Your DeboisTech assistant{online && <span className="sr-only">, available</span>}</p>
              </div>
              <button type="button" onClick={askReset} aria-label="Start a new conversation" title="New conversation" className="debo-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              </button>
              <button type="button" onClick={closeChat} aria-label="Close chat" title="Close" className="debo-icon debo-mobile-only">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {confirmReset && (
              <div role="alertdialog" aria-label="Start a new conversation?" className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--d-border)] bg-[var(--d-bg)] px-4 py-2.5 text-sm">
                <span className="text-[var(--d-muted)]">Start over? This clears the current conversation.</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => setConfirmReset(false)} className="min-h-9 rounded-full border border-[var(--d-border)] px-3.5 text-sm font-semibold hover:border-[var(--d-brand)]">Keep chatting</button>
                  <button type="button" onClick={restart} className="min-h-9 rounded-full bg-[var(--d-brand)] px-3.5 text-sm font-semibold text-black hover:bg-[var(--d-brand-hi)]">Start new</button>
                </span>
              </div>
            )}
          </header>

          <div ref={logRef} onScroll={onLogScroll} role="log" aria-live="polite" aria-label="Conversation" className="debo-body min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => {
              const first = messages[i - 1]?.role !== m.role;
              const isLast = m === last;
              const user = m.role === "user";
              return (
                <div key={m.id} className={`flex flex-col ${user ? "items-end" : "items-start"} ${first && i ? "mt-4" : "mt-1.5"}`}>
                  {first && (
                    <div className={`mb-1.5 flex items-center gap-2 text-xs text-[var(--d-muted)] ${user ? "flex-row-reverse" : ""}`}>
                      <span className="font-semibold text-[var(--d-text)]">{user ? "You" : "Debo"}</span>
                      {!user && <time dateTime={new Date(m.at).toISOString()}>{fmt(m.at)}</time>}
                    </div>
                  )}
                  <div className={`${m.fields ? "w-full sm:w-auto" : ""} max-w-[88%] min-w-0 rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] ${m.fields ? "max-sm:max-w-full" : ""} ${user ? "rounded-tr-md border-[var(--d-brand)]/30 bg-[#1b2b20] text-[var(--d-text)]" : "rounded-tl-md border-[var(--d-border)] bg-[var(--d-raised)] text-[var(--d-text)]"}`}>
                    <Rich text={m.text} />
                    {m.fields && (
                      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 rounded-xl border border-[var(--d-border)] bg-[var(--d-bg)] p-3 sm:grid-cols-[auto_1fr] sm:gap-y-2">
                        {m.fields.map((f) => (
                          <div key={f.label} className="contents max-sm:[&>dd]:mb-2 max-sm:last:[&>dd]:mb-0">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">{f.label}</dt>
                            <dd className="min-w-0 font-medium">{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {m.after && <p className="mt-3">{m.after}</p>}
                    {m.sticker && <Image src="/brand/debo-mascot.png" alt="" width={96} height={56} className="mt-2" />}
                  </div>
                  {m.action && safeHref(m.action.href) && (
                    <a href={m.action.href} target={external(m.action.href) ? "_blank" : undefined} rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center rounded-full bg-[var(--d-brand)] px-5 text-sm font-semibold text-black shadow-[0_8px_24px_-10px_rgba(76,175,104,.7)] transition-colors duration-150 hover:bg-[var(--d-brand-hi)]">{m.action.label}</a>
                  )}
                  {isLast && !user && m.options && !typing && i === 0 && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--d-muted)]">Try asking</p>
                  )}
                  {isLast && !user && m.options && !typing && (
                    <div className={`${i === 0 ? "mt-2" : "mt-3"} w-full ${m.options.length > 6 ? "grid grid-cols-2" : "flex flex-wrap"} gap-2`}>
                      {m.options.map((o) => {
                        const on = picked.includes(o.value);
                        return (
                          <button
                            key={o.value} type="button" aria-pressed={m.multi ? on : undefined}
                            onClick={() => (m.multi ? setPicked((p) => (on ? p.filter((x) => x !== o.value) : [...p, o.value])) : choose(o))}
                            className={`${pill} min-h-11 ${m.options!.length > 6 ? "px-3" : ""} ${on ? "border-[var(--d-brand)] bg-[var(--d-brand)]/15 text-white" : "border-[var(--d-border)] bg-transparent text-white hover:border-[var(--d-brand)] hover:bg-[var(--d-brand)]/10"}`}
                          >{o.label}</button>
                        );
                      })}
                      {m.multi && (
                        <button type="button" disabled={!picked.length} onClick={() => void handle(m.options!.filter((o) => picked.includes(o.value)).map((o) => o.label).join(", "))} className={`${pill} min-h-11 border-transparent bg-[var(--d-brand)] text-black hover:bg-[var(--d-brand-hi)] disabled:opacity-40`}>Continue</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {typing && (
              <div className="mt-3 inline-flex gap-1 rounded-2xl rounded-tl-md border border-[var(--d-border)] bg-[var(--d-raised)] px-4 py-3" role="status" aria-label="Debo is typing">
                <span className="debo-dot" /><span className="debo-dot" style={{ animationDelay: ".15s" }} /><span className="debo-dot" style={{ animationDelay: ".3s" }} />
              </div>
            )}
          </div>

          {active && (
            <div className="flex shrink-0 items-center justify-between border-t border-[var(--d-border)] bg-[var(--d-raised)] px-2 text-[13px]">
              {flow.history.length > 0 || flow.editing
                ? <button type="button" onClick={() => void handle("Back", "cmd:back")} className="min-h-11 rounded-full px-3 text-[var(--d-brand-hi)] hover:bg-[var(--d-bg)]">← Previous question</button>
                : <span />}
              <button type="button" onClick={() => void handle("Back to menu", "cmd:menu")} className="min-h-11 rounded-full px-3 text-[var(--d-muted)] hover:bg-[var(--d-bg)] hover:text-white">Back to menu</button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="debo-composer flex shrink-0 items-end gap-2 border-t border-[var(--d-border)] bg-[var(--d-raised)] px-3 pt-3">
            <label htmlFor="debo-input" className="sr-only">Message Debo</label>
            <textarea
              id="debo-input" ref={inputRef} rows={1} value={draft} maxLength={2000} enterKeyHint="send"
              onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown}
              placeholder={placeholderFor(flow)}
              className="max-h-28 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-3xl border border-[var(--d-border)] bg-[var(--d-bg)] px-4 py-2.5 text-base leading-snug text-[var(--d-text)] [scrollbar-width:none] placeholder:text-[var(--d-muted)] focus:border-[var(--d-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--d-brand)]/40 sm:text-sm [&::-webkit-scrollbar]:hidden"
            />
            <button
              type="submit" aria-label={typing ? "Sending" : "Send message"} disabled={!canSend}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--d-brand)] text-black transition-colors duration-150 hover:bg-[var(--d-brand-hi)] disabled:bg-[#1f211f] disabled:text-[var(--d-muted)]"
            >
              {typing ? (
                <svg className="debo-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M12 3a9 9 0 1 0 9 9" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><path d="M3.4 20.4l17.5-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.2L4 11l9 1-9 1-2 6.2a1 1 0 0 0 1.4 1.2z" /></svg>
              )}
            </button>
          </form>
        </section>
      )}

      {!open && nudge && onHome && (
        <div className="debo-nudge fixed bottom-[5.5rem] right-4 z-50 flex max-w-[16rem] items-start gap-1 rounded-2xl border border-[var(--d-border)] bg-[var(--d-raised)] py-2 pl-4 pr-2 text-sm text-[var(--d-text)] shadow-[0_16px_48px_-12px_rgba(0,0,0,.8)] sm:bottom-28 sm:right-6">
          <button type="button" onClick={openChat} className="py-1 text-left leading-snug">Hey, Debo here! How may I help you?</button>
          <button type="button" onClick={dismissNudge} aria-label="Dismiss" className="debo-icon shrink-0 text-xl leading-none">×</button>
        </div>
      )}

      <button
        ref={launcherRef} type="button" onClick={open ? closeChat : openChat} aria-expanded={open}
        aria-label={open ? "Close DeboisTech assistant" : "Open DeboisTech assistant"}
        className={`debo-launch fixed bottom-4 right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-[var(--d-brand)] shadow-[0_8px_28px_-10px_rgba(76,175,104,.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--d-brand-hi)] sm:bottom-6 sm:right-6 sm:h-16 sm:w-16 ${open ? "max-sm:hidden" : ""}`}
      >
        {open
          ? <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--d-brand-hi)" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          : <Logo size={48} />}
      </button>
    </div>
  );
}
