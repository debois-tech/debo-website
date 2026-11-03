"use client";
import { useId, useState } from "react";

/** A quote that is cut to a few lines with a Read more toggle when it is long. Short quotes show in full with no button. */
export function ExpandableQuote({ text, lines = 6, threshold = 280, className = "" }: { text: string; lines?: 4 | 5 | 6 | 8; threshold?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const long = text.length > threshold;
  const clamp = { 4: "line-clamp-4", 5: "line-clamp-5", 6: "line-clamp-6", 8: "line-clamp-8" }[lines];
  return (
    <div>
      <blockquote id={id} className={`break-words ${long && !open ? `whitespace-normal ${clamp}` : "whitespace-pre-line"} ${className}`}>“{text}”</blockquote>
      {long && (
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-text underline underline-offset-4">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
