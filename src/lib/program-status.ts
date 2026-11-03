import type { DbProgram, ProgramStatus } from "@/content/dynamic";

/**
 * Programs sort themselves into Running now / Coming up / Archive from their start and end dates.
 * The manual `status` is only a fallback for programs whose dates are missing or unreadable.
 * Dates are read as India time (IST), so a program flips at midnight in Nashik, not in UTC.
 */
const DAY = 86_400_000;

/** Parses "9 August 2026", "9 Aug 2026" or "2026-08-09" as a midnight-IST instant. Returns undefined if unreadable. */
export function parseProgramDate(s?: string): number | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(t) ? `${t}T00:00:00+05:30` : `${t} 00:00:00 GMT+0530`;
  const ms = Date.parse(iso);
  if (!Number.isNaN(ms)) return ms;
  const loose = Date.parse(t);
  return Number.isNaN(loose) ? undefined : loose;
}

export type ProgramTiming = {
  status: ProgramStatus;
  /** True when the status was worked out from dates rather than taken from the manual field. */
  auto: boolean;
  /** Whole days until the start (upcoming) or until the end (current). Undefined when not known. */
  daysLeft?: number;
};

export function programTiming(p: Pick<DbProgram, "status" | "startDate" | "endDate">, now = Date.now()): ProgramTiming {
  const start = parseProgramDate(p.startDate);
  const endStart = parseProgramDate(p.endDate);
  const end = endStart === undefined ? undefined : endStart + DAY; // the end date itself still counts as running
  if (start !== undefined && now < start) return { status: "upcoming", auto: true, daysLeft: Math.ceil((start - now) / DAY) };
  if (end !== undefined && now >= end) return { status: "past", auto: true };
  if (start !== undefined && (end !== undefined || p.status !== "past")) {
    return { status: "current", auto: true, daysLeft: endStart !== undefined ? Math.max(0, Math.ceil((endStart - now) / DAY)) : undefined };
  }
  if (end !== undefined && now < end) return { status: "current", auto: true, daysLeft: Math.max(0, Math.ceil((endStart! - now) / DAY)) };
  return { status: p.status, auto: false };
}

/** Honest, date-derived urgency text. Returns undefined when nothing true can be said. */
export function timingLabel(t: ProgramTiming): string | undefined {
  if (t.daysLeft === undefined) return undefined;
  if (t.status === "upcoming") return t.daysLeft <= 1 ? "Starts tomorrow" : `Starts in ${t.daysLeft} days`;
  if (t.status === "current") return t.daysLeft === 0 ? "Ends today" : t.daysLeft === 1 ? "Ends tomorrow" : `${t.daysLeft} days left`;
  return undefined;
}

/** Sort key: upcoming soonest first, running soonest-to-finish first, past most recent first. */
export function timingSort<T extends Pick<DbProgram, "startDate" | "endDate" | "order">>(status: ProgramStatus) {
  const key = (p: T) => (status === "past" ? parseProgramDate(p.endDate) ?? parseProgramDate(p.startDate) : status === "upcoming" ? parseProgramDate(p.startDate) : parseProgramDate(p.endDate) ?? parseProgramDate(p.startDate));
  return (a: T, b: T) => {
    const ka = key(a), kb = key(b);
    if (ka === undefined && kb === undefined) return (a.order ?? 999) - (b.order ?? 999);
    if (ka === undefined) return 1;
    if (kb === undefined) return -1;
    return status === "past" ? kb - ka : ka - kb;
  };
}
