import { VERIFY_DOCS, type DocType } from "@/content/verify";

/** A record the LMS confirmed. Only these fields are ever trusted from its response. */
export type VerifiedDoc = { kind: "valid" | "revoked"; docType: DocType; holderName: string; issueDate: string; badgeName?: string; badgeImageUrl?: string };
export type VerifyResult = VerifiedDoc | { kind: "unverified" | "invalid" | "error" | "rate_limited" };

const MAX_REF = 60;
const STUDENT_ID = /^DBT-[A-Z0-9]+-\d{4}-\d+$/;
const REF_RE: Record<DocType, RegExp> = { badge: /^DBT[A-Z0-9-]{3,}$/, certificate: STUDENT_ID, offer_letter: STUDENT_ID };

export const isDocType = (v: unknown): v is DocType => VERIFY_DOCS.some((d) => d.value === v);

/** Trimmed, upper-cased reference, or null when it cannot be a real one for this document type (no API call is made for those). */
export function normalizeRef(docType: DocType, raw: string): string | null {
  const ref = raw.trim().toUpperCase();
  return ref.length <= MAX_REF && REF_RE[docType].test(ref) ? ref : null;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const httpsUrl = (v: unknown) => { try { const u = new URL(str(v)); return u.protocol === "https:" ? u.href : ""; } catch { return ""; } };

function parse(body: unknown, docType: DocType): VerifyResult {
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const holderName = str(o.holderName), issueDate = str(o.issueDate);
  if ((o.status !== "valid" && o.status !== "revoked") || !holderName || !issueDate || (o.docType !== undefined && o.docType !== docType)) return { kind: "error" };
  const doc: VerifiedDoc = { kind: o.status, docType, holderName, issueDate };
  if (docType === "badge") { // the image URL ends up in an <img src>, so it is badge-only and https-only
    const badgeName = str(o.badgeName), badgeImageUrl = httpsUrl(o.badgeImageUrl);
    if (badgeName) doc.badgeName = badgeName;
    if (badgeImageUrl) doc.badgeImageUrl = badgeImageUrl;
  }
  return doc;
}

/**
 * Asks the LMS whether a document is genuine. Server-only: it holds the API key.
 * 404 is the LMS's single "not found" answer, so it maps to `unverified`. Every other failure (bad key, 5xx, timeout, odd body) is `error`
 * and is logged by name/status only, never shown to the visitor.
 */
export async function verifyDoc(docType: DocType, rawRef: string, ip: string): Promise<VerifyResult> {
  const ref = normalizeRef(docType, rawRef);
  if (!ref) return { kind: "invalid" };
  const key = process.env.VERIFY_API_KEY, url = process.env.VERIFY_URL;
  if (!key || !url) { console.error("[verify] not configured: set VERIFY_URL and VERIFY_API_KEY"); return { kind: "error" }; }
  try {
    const res = await fetch(url, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(5_000),
      headers: { "Content-Type": "application/json", "x-api-key": key, "x-client-ip": ip },
      body: JSON.stringify({ ref, docType }),
    });
    if (res.status === 404) return { kind: "unverified" };
    if (res.status !== 200) { console.error(res.status === 401 ? "[verify] LMS rejected the API key" : `[verify] LMS returned ${res.status}`); return { kind: "error" }; }
    return parse(await res.json(), docType);
  } catch (err) {
    console.error("[verify] request failed", err instanceof Error ? err.name : "unknown");
    return { kind: "error" };
  }
}
