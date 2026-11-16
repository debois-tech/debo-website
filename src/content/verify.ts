/** Copy and options for /verify. Rules and API calls live in src/lib/verify.ts. */

export type DocType = "badge" | "certificate" | "offer_letter";

export const VERIFY_DOCS: readonly { value: DocType; label: string; refLabel: string; title: string }[] = [
  { value: "badge", label: "Badge", refLabel: "Badge reference number", title: "Badge" },
  { value: "certificate", label: "Internship certificate", refLabel: "Student ID", title: "Internship Completion Certificate" },
  { value: "offer_letter", label: "Offer letter", refLabel: "Student ID", title: "Offer of Internship" },
];

export const VERIFY_PAGE = {
  eyebrow: "Verification",
  title: "Verify a document.",
  lead: "Choose the document type and enter its reference to confirm a DeboisTech badge, internship certificate or offer letter is genuine.",
  srHeading: "Check a reference",
};

/** Result copy for every outcome except a verified document, which shows the record itself. */
export const VERIFY_MESSAGES = {
  valid: { title: "Verified", body: "" },
  revoked: { title: "Revoked", body: "DeboisTech issued this document and has since withdrawn it. It is no longer valid." },
  unverified: { title: "We could not verify this reference", body: "Check the number and try again." },
  invalid: { title: "That reference doesn’t look right", body: "Check the document type and the number, then try again." },
  error: { title: "Verification is unavailable right now", body: "This is on our side. Please try again in a few minutes." },
  rate_limited: { title: "Too many attempts", body: "Please wait a few minutes before checking another reference." },
} as const;
