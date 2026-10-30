import type { EnquiryInput } from "./types";

export const LIMITS = { name: 100, email: 254, phone: 20, projectType: 80, projectDescription: 2000, timeline: 40, source: 40 } as const;

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export const clip = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);

export const isEmail = (v: string) => v.length <= LIMITS.email && EMAIL_RE.test(v.trim());

/** Returns "+91XXXXXXXXXX" for Indian numbers, "+<digits>" for other international numbers, or null if invalid. */
export function normalizePhone(raw: string): string | null {
  const s = raw.trim();
  if (!/^[+\d][\d\s\-().]*$/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits[1])) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2])) return `+${digits}`;
  if (s.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export type NormalizeResult = { ok: true; value: EnquiryInput } | { ok: false; errors: Record<string, string> };

/** Coerces untrusted JSON into a clipped, validated enquiry. */
export function normalizeEnquiry(raw: unknown): NormalizeResult {
  if (!raw || typeof raw !== "object") return { ok: false, errors: { body: "Invalid request." } };
  const o = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const name = clip(o.name, LIMITS.name);
  const email = clip(o.email, LIMITS.email).toLowerCase();
  const phoneRaw = clip(o.phone, LIMITS.phone);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const projectType = clip(o.projectType, LIMITS.projectType);
  const projectDescription = clip(o.projectDescription, LIMITS.projectDescription);

  if (!name) errors.name = "Name is required.";
  if (!isEmail(email)) errors.email = "A valid email is required.";
  if (phone === null) errors.phone = "Phone number is not valid.";
  if (!projectType) errors.projectType = "Project type is required.";
  if (!projectDescription) errors.projectDescription = "Project description is required.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name, email, phone: phone ?? "", projectType, projectDescription,
      timeline: clip(o.timeline, LIMITS.timeline) || "Not decided",
      requestedQuotation: o.requestedQuotation === true,
      requestedConsultation: o.requestedConsultation === true,
      source: clip(o.source, LIMITS.source) || "chatbot",
    },
  };
}
