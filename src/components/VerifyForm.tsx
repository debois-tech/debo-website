"use client";
/* eslint-disable @next/next/no-img-element -- the badge image is a remote LMS file whose host is allowed in the CSP (next.config.ts), not a build-time asset */
import { useState, type FormEvent } from "react";
import { VERIFY_DOCS, VERIFY_MESSAGES, type DocType } from "@/content/verify";
import type { VerifyResult } from "@/lib/verify";
import { Badge, buttonClass } from "./ui";

const field = "mt-1 block min-h-11 w-full rounded-[var(--radius-sm)] border border-line-strong bg-wash px-3 py-2 text-ink";
const KINDS = new Set(Object.keys(VERIFY_MESSAGES));

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });
};

// The verified mark: a pixel check on a 10x7 grid, hand-built like PixelEdge (THEME: pixel squares are the brand's shape, no icon package).
// Cells are listed along the stroke so the .check-px stagger draws it from the short arm up to the long one.
const CHECK: [number, number][] = [[0, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 5], [3, 6], [4, 5], [4, 4], [5, 4], [5, 3], [6, 3], [6, 2], [7, 2], [7, 1], [8, 1], [8, 0], [9, 0]];
function PixelCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 7" aria-hidden shapeRendering="crispEdges" fill="currentColor" className={`block text-brand-logo ${className}`}>
      {CHECK.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} className="check-px" style={{ ["--i" as string]: i }} />)}
    </svg>
  );
}

function Result({ r }: { r: VerifyResult }) {
  if (r.kind === "valid" || r.kind === "revoked") {
    const ok = r.kind === "valid";
    const title = r.badgeName || VERIFY_DOCS.find((d) => d.value === r.docType)?.title;
    return (
      <div className={`relative rounded-[var(--radius-lg)] border-2 p-6 sm:p-8 ${ok ? "border-brand bg-wash" : "border-error bg-[var(--error-bg)]"}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {r.badgeImageUrl && <img src={r.badgeImageUrl} alt={`${title} badge`} width={112} height={144} referrerPolicy="no-referrer" className="h-36 w-28 shrink-0 rounded-[var(--radius-sm)] border border-line object-contain" />}
          <div className="min-w-0">
            {ok ? <Badge>{VERIFY_MESSAGES.valid.title}</Badge> : <span className="inline-flex rounded-full border border-error px-2.5 py-0.5 font-mono text-xs font-medium text-error">{VERIFY_MESSAGES.revoked.title}</span>}
            <h2 className="display mt-4 text-3xl sm:text-4xl">{title}</h2>
            <dl className="mt-5 space-y-3 sm:pr-32">
              <div><dt className="font-mono text-xs text-muted">Issued to</dt><dd className="break-words text-lg font-semibold">{r.holderName}</dd></div>
              <div><dt className="font-mono text-xs text-muted">Date issued</dt><dd className="text-lg">{fmtDate(r.issueDate)}</dd></div>
            </dl>
            {!ok && <p className="mt-5 text-sm">{VERIFY_MESSAGES.revoked.body}</p>}
          </div>
        </div>
        {ok && <PixelCheck className="ml-auto mt-6 h-14 w-20 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:h-[77px] sm:w-[110px]" />}
      </div>
    );
  }
  const m = VERIFY_MESSAGES[r.kind];
  return (
    <div className={`rounded-[var(--radius-lg)] border p-6 sm:p-8 ${r.kind === "error" || r.kind === "rate_limited" ? "border-error bg-[var(--error-bg)]" : "border-line bg-wash"}`}>
      <h2 className="display text-2xl sm:text-3xl">{m.title}</h2>
      <p className="mt-2 text-muted">{m.body}</p>
    </div>
  );
}

export function VerifyForm() {
  const [docType, setDocType] = useState<DocType>("badge");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const doc = VERIFY_DOCS.find((d) => d.value === docType)!;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!ref.trim()) { setResult({ kind: "invalid" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docType, ref }) });
      const body = (await res.json().catch(() => null)) as VerifyResult | null;
      setResult(body && KINDS.has(body.kind) ? body : { kind: "error" });
    } catch {
      setResult({ kind: "error" });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="v-type" className="block text-sm font-semibold">Document type</label>
          <select id="v-type" className={field} value={docType} onChange={(e) => { setDocType(e.target.value as DocType); setResult(null); }}>
            {VERIFY_DOCS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="v-ref" className="block text-sm font-semibold">{doc.refLabel}</label>
          <input id="v-ref" className={`${field} font-mono uppercase`} value={ref} onChange={(e) => { setRef(e.target.value); setResult(null); }}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={60} />
        </div>
        <button type="submit" disabled={loading} className={buttonClass()}>{loading ? "Checking…" : "Verify"}</button>
      </form>
      <div role="status" className="mt-8 sm:mt-10">{result && <Result r={result} />}</div>
    </div>
  );
}
