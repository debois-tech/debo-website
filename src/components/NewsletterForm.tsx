"use client";
import { useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Phase = "idle" | "submitting" | "success" | "error";

/** One-field newsletter signup. Posts to /api/subscribe. Status is announced to screen readers. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const trap = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phase === "submitting") return;
    if (!EMAIL_RE.test(email.trim())) { setPhase("error"); setMsg("Enter a valid email address, like name@example.com."); return; }
    setPhase("submitting"); setMsg("");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), website: trap.current?.value ?? "" }) });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (res.ok && body.ok) { setPhase("success"); setMsg("You’re subscribed. Thanks for joining us."); setEmail(""); track("form_success", { form_type: "newsletter" }); return; }
      setPhase("error");
      setMsg(body.code === "rate_limited" ? "Too many attempts. Please try again in a few minutes." : body.code === "invalid" ? "Enter a valid email address, like name@example.com." : "We couldn’t subscribe you just now. Please try again, or email us.");
      track("form_error", { form_type: "newsletter", error_category: body.code ?? "server" });
    } catch { setPhase("error"); setMsg("Network problem. Check your connection and try again."); track("form_error", { form_type: "newsletter", error_category: "network" }); }
  };

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-xl">
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="nl-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
          aria-invalid={phase === "error"} aria-describedby="nl-status"
          className="min-h-12 w-full flex-1 rounded-full border border-line-strong bg-wash px-5 text-ink placeholder:text-muted/70" />
        <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-0 opacity-0" />
        <button disabled={phase === "submitting"} className="inline-flex min-h-12 items-center justify-center rounded-full bg-glow px-7 text-[15px] font-semibold text-forest transition-colors hover:bg-glow-hi disabled:opacity-60">
          {phase === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p id="nl-status" role="status" aria-live="polite" className={`mt-3 min-h-6 text-sm ${phase === "error" ? "text-error" : phase === "success" ? "text-brand-text" : "text-muted"}`}>
        {msg || "No spam. Unsubscribe at any time."}
      </p>
    </form>
  );
}
