import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, sameOrigin } from "@/lib/request";
import { SITE } from "@/content/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/**
 * Newsletter signup. With RESEND_AUDIENCE_ID set, the address is added to that Resend audience (a real mailing list).
 * Without it, the signup is emailed to ENQUIRY_TO_EMAIL so nobody is lost. Same guards as /api/enquiry.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, code: "forbidden" }, 403);

  const ip = clientIp(req);
  if (!rateLimit(`sub:${ip}`, 5, 10 * 60_000)) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });
  if (Number(req.headers.get("content-length") ?? 0) > 2_000) return json({ ok: false, code: "too_large" }, 413);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, code: "bad_request" }, 400); }
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  if (typeof o.website === "string" && o.website) return json({ ok: true }, 200); // honeypot: pretend success to bots
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return json({ ok: false, code: "invalid" }, 422);

  const apiKey = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  const to = process.env.ENQUIRY_TO_EMAIL;
  const from = process.env.ENQUIRY_FROM_EMAIL;
  if (!apiKey || (!audience && (!to || !from))) {
    console.error("[subscribe] not configured: set RESEND_API_KEY and RESEND_AUDIENCE_ID (or ENQUIRY_TO_EMAIL and ENQUIRY_FROM_EMAIL)");
    return json({ ok: false, code: "not_configured" }, 503);
  }

  try {
    const res = audience
      ? await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audience)}/contacts`, {
          method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, unsubscribed: false }), signal: AbortSignal.timeout(10_000),
        })
      : await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: to!.split(",").map((s) => s.trim()), subject: "[Website] Newsletter signup", text: `New newsletter subscriber: ${email}\n\n— Sent via ${SITE.url}` }),
          signal: AbortSignal.timeout(10_000),
        });
    if (!res.ok) { console.error("[subscribe] provider rejected", res.status); return json({ ok: false, code: "delivery_failed" }, 502); }
    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[subscribe] provider error", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, code: "delivery_failed" }, 502);
  }
}
