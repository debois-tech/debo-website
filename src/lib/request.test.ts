import { describe, expect, it } from "vitest";
import { clientIp, sameOrigin } from "./request";

const req = (headers: Record<string, string>) => new Request("http://site.test/api/x", { method: "POST", headers });

describe("clientIp", () => {
  it("uses the platform-set header over anything the client sent", () => {
    expect(clientIp(req({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(req({ "x-real-ip": "198.51.100.4", "x-forwarded-for": "6.6.6.6" }))).toBe("198.51.100.4");
  });
  it("never trusts the first X-Forwarded-For entry, which the client controls", () => {
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7, 203.0.113.9" }))).toBe("203.0.113.9");
  });
  it("falls back to a fixed value when nothing is known", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("sameOrigin", () => {
  it("accepts a matching Origin and requests with no Origin", () => {
    expect(sameOrigin(req({ origin: "https://site.test", host: "site.test" }))).toBe(true);
    expect(sameOrigin(req({}))).toBe(true);
  });
  it("refuses another site, a null origin, a malformed origin and cross-site fetches", () => {
    expect(sameOrigin(req({ origin: "https://evil.test", host: "site.test" }))).toBe(false);
    expect(sameOrigin(req({ origin: "null", host: "site.test" }))).toBe(false);
    expect(sameOrigin(req({ origin: "::::", host: "site.test" }))).toBe(false);
    expect(sameOrigin(req({ "sec-fetch-site": "cross-site", origin: "https://site.test", host: "site.test" }))).toBe(false);
  });
});
