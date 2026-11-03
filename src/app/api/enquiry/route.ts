import { NextResponse } from "next/server";
import { parseEnquiry, validateEnquiry } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, sameOrigin } from "@/lib/request";
import { INTENTS, SITE } from "@/content/site";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  // Same-origin only (basic CSRF guard for a JSON endpoint).
  if (!sameOrigin(req)) return json({ ok: false, code: "forbidden" }, 403);

  const ip = clientIp(req);
  if (!rateLimit(ip)) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 20_000) return json({ ok: false, code: "too_large" }, 413);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, code: "bad_request" }, 400); }
  const input = parseEnquiry(raw);
  if (!input) return json({ ok: false, code: "bad_request" }, 400);

  // Honeypot: pretend success to bots without sending anything.
  if (input.website) return json({ ok: true }, 200);

  const errors = validateEnquiry(input);
  if (Object.keys(errors).length) return json({ ok: false, code: "invalid", errors }, 422);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  const from = process.env.ENQUIRY_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[enquiry] not configured: set RESEND_API_KEY, ENQUIRY_TO_EMAIL, ENQUIRY_FROM_EMAIL");
    return json({ ok: false, code: "not_configured" }, 503);
  }

  const intentLabel = INTENTS.find((i) => i.value === input.intent)?.label ?? "Enquiry";
  const clean = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
  const text = [
    `Intent: ${intentLabel}`,
    `Name: ${clean(input.name)}`,
    `Email: ${clean(input.email)}`,
    `Phone: ${clean(input.phone) || "—"}`,
    `Organization: ${clean(input.organization) || "—"}`,
    input.intent === "tep" ? `Track: ${input.track}` : null,
    "",
    input.message.trim(),
    "",
    `— Sent via ${SITE.url}/contact`,
  ].filter((l) => l !== null).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: to.split(",").map((s) => s.trim()), reply_to: clean(input.email),
        subject: `[Website] ${intentLabel} from ${clean(input.name).slice(0, 60)}`, text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[enquiry] provider rejected", res.status); // never log body/contents
      return json({ ok: false, code: "delivery_failed" }, 502);
    }
    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[enquiry] provider error", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, code: "delivery_failed" }, 502);
  }
}
