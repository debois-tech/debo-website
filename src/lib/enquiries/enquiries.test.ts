import { describe, expect, it } from "vitest";
import { normalizeEnquiry, normalizePhone } from "./normalize";
import { recommendService, scoreEnquiry } from "./score";

const base = { name: "Asha", email: "Asha@Example.com", phone: "", projectType: "Website", projectDescription: "A bakery site with ordering", timeline: "Immediately" };

describe("normalizePhone", () => {
  it.each([["98765 43210", "+919876543210"], ["09876543210", "+919876543210"], ["+91 98765-43210", "+919876543210"], ["919876543210", "+919876543210"], ["+1 415 555 0100", "+14155550100"]])("%s", (i, o) => expect(normalizePhone(i)).toBe(o));
  it.each(["12345", "abc", "5555555555"])("rejects %s", (i) => expect(normalizePhone(i)).toBeNull());
});

describe("normalizeEnquiry", () => {
  it("lowercases email, normalises phone and clips", () => {
    const r = normalizeEnquiry({ ...base, phone: "9876543210", projectDescription: "x".repeat(5000) });
    expect(r.ok && r.value.email).toBe("asha@example.com");
    expect(r.ok && r.value.phone).toBe("+919876543210");
    expect(r.ok && r.value.projectDescription.length).toBe(2000);
  });
  it("rejects missing or invalid fields", () => {
    const r = normalizeEnquiry({ ...base, email: "nope", name: "" });
    expect(!r.ok && Object.keys(r.errors)).toEqual(expect.arrayContaining(["email", "name"]));
    expect(normalizeEnquiry(null).ok).toBe(false);
  });
});

describe("scoring", () => {
  const input = (o = {}) => ({ ...base, phone: "+919876543210", requestedQuotation: false, requestedConsultation: false, source: "chatbot", ...o });
  it("rates a complete urgent enquiry hotter than a vague one", () => {
    const hot = scoreEnquiry(input({ requestedQuotation: true, projectDescription: "x".repeat(200) }));
    const cold = scoreEnquiry(input({ phone: "", timeline: "Not decided", projectType: "I'm not sure yet", projectDescription: "app" }));
    expect(hot.status).toBe("HOT");
    expect(cold.status).toBe("COLD");
    expect(hot.score).toBeGreaterThan(cold.score);
  });
  it("caps at 100", () => {
    expect(scoreEnquiry(input({ requestedQuotation: true, requestedConsultation: true, projectDescription: "x".repeat(500) })).score).toBeLessThanOrEqual(100);
  });
  it("recommends a service from the description", () => {
    expect(recommendService({ projectType: "Custom Software", projectDescription: "migrate to AWS with Kubernetes" })).toBe("Cloud & DevOps");
    expect(recommendService({ projectType: "Website", projectDescription: "bakery" })).toBe("Software Engineering");
  });
});
