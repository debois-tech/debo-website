/**
 * Request helpers shared by the API routes.
 */

/**
 * The visitor's IP for rate limiting. Prefers headers the hosting platform sets itself (a client cannot forge them),
 * then the LAST entry of X-Forwarded-For (added by the nearest proxy). The first entry is whatever the client sent, so it is never trusted.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  const platform = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
  if (platform) return platform;
  const chain = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return chain?.length ? chain[chain.length - 1] : "unknown";
}

/**
 * Same-origin guard for JSON POST endpoints (CSRF). Browsers always send Origin on a cross-site POST, so a mismatch, a "null"
 * origin or a cross-site fetch is refused. Requests with no Origin at all come from non-browser clients and are allowed (they hold no cookies to abuse).
 */
export function sameOrigin(req: Request): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.get("host"); } catch { return false; }
}
