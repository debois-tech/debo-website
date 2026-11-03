import { randomUUID } from "node:crypto";
import { normalizeEnquiry } from "./normalize";
import { recommendService, scoreEnquiry } from "./score";
import { storeEnquiry } from "./store";
import type { EnquiryRecord } from "./types";

export type SubmitResult =
  | { ok: true; id: string; stored: boolean; notified: boolean }
  | { ok: false; code: "invalid" | "failed"; errors?: Record<string, string> };

/** Who gets the enquiry email. Override with ENQUIRY_NOTIFY_EMAILS (comma separated). */
const NOTIFY_DEFAULT = "adityabankar@deboistech.in,harshadgangurde@deboistech.in";
const recipients = () =>
  (process.env.ENQUIRY_NOTIFY_EMAILS || NOTIFY_DEFAULT).split(",").map((e) => e.trim()).filter(Boolean);

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");

function summary(r: EnquiryRecord) {
  return [
    `New website enquiry (${r.lead_status}, score ${r.lead_score})`,
    `Name: ${r.name}`, `Email: ${r.email}`, `Phone: ${r.phone || "—"}`,
    `Project type: ${r.project_type}`, `Timeline: ${r.timeline}`,
    `Recommended service: ${r.recommended_service}`, "", r.project_description,
  ].join("\n");
}

async function notify(record: EnquiryRecord) {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  const text = summary(record);
  const [to, ...cc] = recipients();
  const res = webhook
    ? await fetch(webhook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, record, to: [to, ...cc] }), signal: AbortSignal.timeout(10_000),
      })
    : await fetch(`https://formsubmit.co/ajax/${to}`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `[Website chatbot] ${record.lead_status} enquiry from ${oneLine(record.name).slice(0, 60)}`,
          _replyto: record.email, ...(cc.length ? { _cc: cc.join(",") } : {}), _captcha: "false", _template: "table",
          name: record.name, email: record.email, phone: record.phone || "—",
          project_type: record.project_type, timeline: record.timeline,
          lead: `${record.lead_status} (${record.lead_score})`, service: record.recommended_service,
          description: record.project_description,
        }),
        signal: AbortSignal.timeout(10_000),
      });
  if (!res.ok) throw new Error(`notification responded ${res.status}`);
}

/** Counts as submitted when either storage or the notification succeeded. Failures are logged without contents. */
export async function submitEnquiry(raw: unknown): Promise<SubmitResult> {
  const parsed = normalizeEnquiry(raw);
  if (!parsed.ok) return { ok: false, code: "invalid", errors: parsed.errors };
  const input = parsed.value;
  const { score, status } = scoreEnquiry(input);
  const record: EnquiryRecord = {
    created_at: new Date().toISOString(), id: randomUUID(), status: "NEW",
    lead_status: status, lead_score: score, recommended_service: recommendService(input),
    name: input.name, email: input.email, phone: input.phone, project_type: input.projectType,
    project_description: input.projectDescription, timeline: input.timeline, source: input.source,
  };
  const [stored, notified] = await Promise.allSettled([storeEnquiry(record), notify(record)]);
  if (stored.status === "rejected") console.error("[enquiry] store failed:", stored.reason instanceof Error ? stored.reason.message : "unknown");
  if (notified.status === "rejected") console.error("[enquiry] notify failed:", notified.reason instanceof Error ? notified.reason.message : "unknown");
  const s = stored.status === "fulfilled", n = notified.status === "fulfilled";
  return s || n ? { ok: true, id: record.id, stored: s, notified: n } : { ok: false, code: "failed" };
}
