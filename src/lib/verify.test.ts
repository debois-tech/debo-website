import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeRef, verifyDoc } from "./verify";

describe("normalizeRef", () => {
  it("trims and upper-cases valid refs", () => {
    expect(normalizeRef("badge", " dbtphr-260012-1a3bc ")).toBe("DBTPHR-260012-1A3BC");
    expect(normalizeRef("certificate", "dbt-int-2026-012")).toBe("DBT-INT-2026-012");
    expect(normalizeRef("offer_letter", "DBT-INT-2026-057")).toBe("DBT-INT-2026-057");
  });
  it("rejects wrong shapes, empty, too long and injection-looking input", () => {
    for (const bad of ["", "DBT", "DBT-INT-2026", "DBT INT 2026 012", "DBT-INT-2026-12a", "../etc", "DBT-INT-2026-" + "9".repeat(60)]) {
      expect(normalizeRef("certificate", bad), bad).toBeNull();
    }
    expect(normalizeRef("badge", "ABC-123")).toBeNull();
    expect(normalizeRef("badge", "DBT" + "A".repeat(60))).toBeNull();
  });
});

describe("verifyDoc", () => {
  const ok = { status: "valid", docType: "badge", holderName: "Test Holder", issueDate: "2026-11-01", badgeName: "MCP Voyager", badgeImageUrl: "https://img.test/b.png" };
  const reply = (status: number, body?: unknown) => vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

  beforeEach(() => { vi.stubEnv("VERIFY_API_KEY", "k"); vi.stubEnv("VERIFY_URL", "https://lms.test/verify"); vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it("returns invalid without calling the API for a bad ref", async () => {
    const f = reply(200, ok);
    expect(await verifyDoc("badge", "nope", "1.2.3.4")).toEqual({ kind: "invalid" });
    expect(f).not.toHaveBeenCalled();
  });
  it("sends the key, the visitor IP and the normalised ref", async () => {
    const f = reply(200, ok);
    await verifyDoc("badge", "dbtaml-260020-dah104", "1.2.3.4");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://lms.test/verify");
    expect(init?.headers).toMatchObject({ "x-api-key": "k", "x-client-ip": "1.2.3.4" });
    expect(JSON.parse(init?.body as string)).toEqual({ ref: "DBTAML-260020-DAH104", docType: "badge" });
    expect(init?.cache).toBe("no-store");
  });
  it("maps 404 to unverified and 401/5xx to error", async () => {
    reply(404); expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "unverified" });
    reply(401); expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "error" });
    reply(503); expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "error" });
  });
  it("accepts valid and revoked records and keeps only the trusted fields", async () => {
    reply(200, { ...ok, extra: "x" });
    expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "valid", docType: "badge", holderName: "Test Holder", issueDate: "2026-11-01", badgeName: "MCP Voyager", badgeImageUrl: "https://img.test/b.png" });
    reply(200, { ...ok, status: "revoked" });
    expect((await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).kind).toBe("revoked");
  });
  it("drops a non-https badge image and never returns one for other documents", async () => {
    reply(200, { ...ok, badgeImageUrl: "http://img.test/b.png" });
    expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).not.toHaveProperty("badgeImageUrl");
    reply(200, { ...ok, docType: "certificate" });
    expect(await verifyDoc("certificate", "DBT-INT-2026-012", "i")).not.toHaveProperty("badgeImageUrl");
  });
  it("treats an unexpected body as an error", async () => {
    for (const body of [{ ...ok, status: "pending" }, { ...ok, holderName: " " }, { ...ok, issueDate: "" }, { ...ok, docType: "offer_letter" }, null, "x"]) {
      reply(200, body); expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "error" });
    }
  });
  it("returns error on network failure or when not configured", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));
    expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "error" });
    vi.unstubAllEnvs(); vi.stubEnv("VERIFY_API_KEY", "");
    expect(await verifyDoc("badge", "DBTAML-260020-DAH104", "i")).toEqual({ kind: "error" });
  });
});
