import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/ratelimit";
import { runTool, type ToolContext } from "./tools";

const ctx = (over: Partial<ToolContext> = {}): ToolContext => ({ actions: [], submitted: false, chunks: [], ip: "198.51.100.77", ...over });
const enquiry = { name: "A", email: "a@example.com", projectType: "Website", projectDescription: "Build me a site" };

describe("capture_project_enquiry guards", () => {
  it("refuses a second enquiry in the same reply, before anything is sent", async () => {
    const r = await runTool("capture_project_enquiry", enquiry, ctx({ submitted: true }));
    expect(r.ok).toBe(false);
  });
  it("refuses once the visitor has used the enquiry rate limit, so the model cannot be talked into flooding the inbox", async () => {
    const ip = "203.0.113.200";
    for (let i = 0; i < 5; i++) rateLimit(`enquiry:${ip}`, 5);
    const r = await runTool("capture_project_enquiry", enquiry, ctx({ ip }));
    expect(r.ok).toBe(false);
    expect(String(r.error)).toMatch(/Too many/);
  });
});
