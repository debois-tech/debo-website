import { OPENINGS } from "@/content/careers";
import { search } from "./knowledge";
import { ROUTES, type Chunk } from "./live-site";
import { SITE } from "@/content/site";
import { submitEnquiry } from "@/lib/enquiries/submit";

export type ChatAction = { label: string; href: string };

/** Gemini function declarations. */
export const TOOL_DECLARATIONS = [
  {
    name: "search_knowledge_base",
    description: "Look up verified DeboisTech facts (services, products, programs, careers, contact). Use before stating any company-specific fact.",
    parameters: { type: "OBJECT", properties: { query: { type: "STRING", description: "Keywords to search for" } }, required: ["query"] },
  },
  {
    name: "get_career_openings",
    description: "Return the current list of open roles at DeboisTech.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "navigate_to_page",
    description: `Offer the visitor a link to a page of the DeboisTech website. Allowed routes: ${ROUTES.join(", ")}, plus /blog/<slug> and /tep/<track> pages returned by search_knowledge_base.`,
    parameters: { type: "OBJECT", properties: { route: { type: "STRING" } }, required: ["route"] },
  },
  {
    name: "capture_project_enquiry",
    description: "Submit a project enquiry to the DeboisTech team. Call only after the visitor has confirmed the summary. Needs name, email, project type and description.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" }, email: { type: "STRING" }, phone: { type: "STRING", description: "Optional" },
        projectType: { type: "STRING" }, projectDescription: { type: "STRING" }, timeline: { type: "STRING" },
        requestedQuotation: { type: "BOOLEAN" }, requestedConsultation: { type: "BOOLEAN" },
      },
      required: ["name", "email", "projectType", "projectDescription"],
    },
  },
];

export type ToolContext = { actions: ChatAction[]; submitted: boolean; chunks: Chunk[] };

/** Results are plain data returned to the model; they are never executed or trusted as instructions. */
export async function runTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<Record<string, unknown>> {
  switch (name) {
    case "search_knowledge_base": {
      const hits = search(String(args.query ?? ""), 3, ctx.chunks);
      return hits.length ? { results: hits.map((c) => ({ title: c.title, text: c.text, href: c.href })) } : { results: [], note: "No verified information found." };
    }
    case "get_career_openings":
      return OPENINGS.length ? { openings: OPENINGS.map((o) => ({ title: o.title, location: o.location, type: o.type })) } : { openings: [], note: `No open roles at the moment. Candidates can email ${SITE.email}.` };
    case "navigate_to_page": {
      const route = String(args.route ?? "");
      const allowed = new Set<string>([...ROUTES, ...ctx.chunks.map((c) => c.href).filter((h): h is string => !!h)]);
      if (!allowed.has(route)) return { ok: false, error: "Route not allowed." };
      ctx.actions.push({ label: "Open page", href: route });
      return { ok: true, route };
    }
    case "capture_project_enquiry": {
      const result = await submitEnquiry({ ...args, source: "chatbot-llm" });
      if (result.ok) { ctx.submitted = true; return { ok: true }; }
      return { ok: false, error: result.code === "invalid" ? `Missing or invalid fields: ${Object.keys(result.errors ?? {}).join(", ")}` : `Submission failed. Ask the visitor to email ${SITE.email}.` };
    }
    default:
      return { ok: false, error: "Unknown tool." };
  }
}
