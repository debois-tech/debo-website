"use client";
import { useId, useState } from "react";

const control = "block min-h-11 w-full rounded-md border border-line-strong bg-wash px-3 py-2 text-ink placeholder:text-muted/70";

/**
 * A list of short labels (skills, modules…) the person builds by picking from a dropdown of suggestions or typing their own.
 * Chosen items show as chips that can be removed. Enter or comma adds what is typed; duplicates are ignored.
 */
export function ChipPicker({ label, hint, value, onChange, suggestions, max = 12, placeholder = "Or type your own" }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; suggestions: string[]; max?: number; placeholder?: string;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const has = (s: string) => value.some((x) => x.toLowerCase() === s.toLowerCase());
  const full = value.length >= max;
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const raw1 of parts) {
      const p = suggestions.find((x) => x.toLowerCase() === raw1.toLowerCase()) ?? raw1; // typing "rag" uses the list's spelling, "RAG"
      if (next.length < max && !next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 60));
    }
    if (next.length !== value.length) onChange(next);
    setText("");
  };
  const left = suggestions.filter((s) => !has(s));
  return (
    <div>
      <p id={`${id}-l`} className="text-sm font-semibold">{label}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {value.length > 0 && (
        <ul aria-labelledby={`${id}-l`} className="mt-2 flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 rounded-full border border-brand-text bg-wash py-0.5 pl-3 pr-1 text-sm">
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="grid size-7 place-items-center rounded-full text-base leading-none text-muted hover:bg-paper hover:text-ink">×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr]">
        <select aria-label={`${label}: choose from the list`} className={control} disabled={full || left.length === 0} value="" onChange={(e) => { if (e.target.value) add(e.target.value); }}>
          <option value="">{full ? `Limit of ${max} reached` : "Choose from the list…"}</option>
          {left.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
          <input className={control} value={text} disabled={full} placeholder={placeholder} aria-label={`${label}: type your own`}
            onChange={(e) => { const v = e.target.value; if (v.includes(",")) add(v); else setText(v); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(text); } }} />
          <button type="button" disabled={full || !text.trim()} onClick={() => add(text)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-brand-text disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
}
