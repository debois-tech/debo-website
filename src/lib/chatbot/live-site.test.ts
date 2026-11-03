import { describe, expect, it } from "vitest";
import { CHUNKS, ROUTES, postChunks, programsText } from "./live-site";
import { search } from "./knowledge";
import { LAB_TOTALS, LAB_TRACKS } from "@/content/labs";
import { PRODUCTS } from "@/content/products";
import { SERVICES } from "@/content/services";
import { TRACKS } from "@/content/tep";
import { handleInput, initialState } from "./flows";

const program = { id: "p1", title: "Forward Deployed Engineering", status: "upcoming" as const, summary: "FDE", startDate: "1 Nov 2026" };

describe("knowledge is derived from the site content", () => {
  it("has a chunk for every service, product, lab track and TEP track", () => {
    const ids = new Set(CHUNKS.map((c) => c.id));
    for (const s of SERVICES) expect(ids.has(`svc-${s.slug}`)).toBe(true);
    for (const p of PRODUCTS) expect(ids.has(p.slug)).toBe(true);
    for (const t of LAB_TRACKS) expect(ids.has(`lab-${t.slug}`)).toBe(true);
    for (const t of TRACKS) expect(ids.has(`tep-${t.slug}`)).toBe(true);
  });
  it("quotes lab counts from the data, not from a copy", () => {
    expect(CHUNKS.find((c) => c.id === "labs-overview")?.text).toContain(`${LAB_TOTALS.labs} labs across ${LAB_TOTALS.tracks} tracks`);
  });
  it("finds the specific lab track and TEP track", () => {
    expect(search("docker labs", 3).map((c) => c.id)).toContain("lab-docker");
    expect(search("multi cloud engineering track topics", 2).map((c) => c.id)).toContain("tep-multi-cloud");
  });
  it("every chunk link is a site route, track page or product page", () => {
    for (const c of CHUNKS) if (c.href) expect(ROUTES.some((r) => r === c.href) || /^\/(tep|products)\/[a-z-]+$/.test(c.href)).toBe(true);
  });
});

describe("dashboard data", () => {
  it("states dates and fees only when the dashboard publishes them", () => {
    expect(programsText(null)).toMatch(/confirmed by the team/);
    expect(programsText(null)).not.toMatch(/starts/);
    const t = programsText([program]);
    expect(t).toContain("Forward Deployed Engineering (upcoming)");
    expect(t).toContain("starts 1 Nov 2026");
    expect(t).not.toMatch(/\bfee \S/);
    expect(programsText([{ ...program, fee: "₹10,000" }])).toContain("fee ₹10,000");
  });
  it("turns blog posts into linkable chunks", () => {
    const [c] = postChunks([{ id: "x", title: "Shipping Kubernetes", slug: "shipping-k8s", excerpt: "Notes.", body: "", author: "Yash" }]);
    expect(c.href).toBe("/blog/shipping-k8s");
    expect(search("shipping kubernetes blog", 1, [c])[0]?.id).toBe("post-shipping-k8s");
  });
  it("the Programs button uses dashboard text when available", () => {
    const r = handleInput(initialState(), { text: "Programs", value: "cmd:programs" }, { programs: programsText([program]) });
    expect(r.messages[0].text).toContain("starts 1 Nov 2026");
    expect(handleInput(initialState(), { text: "Programs", value: "cmd:programs" }).messages[0].text).not.toContain("1 Nov 2026");
  });
});
