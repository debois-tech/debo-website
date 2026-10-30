import { getService } from "@/content/services";
import type { EnquiryInput, LeadStatus } from "./types";

const URGENCY: Record<string, number> = {
  "immediately": 20, "within 1 month": 15, "1–3 months": 10, "1-3 months": 10, "3–6 months": 5, "3-6 months": 5, "6+ months": 2,
};

const SERVICE_RULES: [RegExp, string][] = [
  [/\b(ai|ml|llm|gpt|genai|generative|machine learning|chatbot|rag)\b/i, "ai-ml"],
  [/\b(cloud|devops|kubernetes|k8s|aws|azure|gcp|ci\/?cd|docker)\b/i, "cloud-devops"],
  [/\b(ui|ux|design|figma|wireframe)\b/i, "ui-ux"],
  [/\b(data pipeline|data engineering|warehouse|etl|analytics)\b/i, "data-engineering"],
  [/\b(security|pentest|vulnerab|cyber)\b/i, "cybersecurity"],
  [/\b(digital transformation|manual process|paper|digitis|digitiz|automate)\b/i, "digital-transformation"],
];

export function recommendService(input: Pick<EnquiryInput, "projectType" | "projectDescription">): string {
  const hay = `${input.projectType} ${input.projectDescription}`;
  return getService(SERVICE_RULES.find(([re]) => re.test(hay))?.[1] ?? "software-engineering")?.name ?? "Software Engineering";
}

/** Completeness (60) + timeline urgency (20) + quotation/consultation requested (20). */
export function scoreEnquiry(input: EnquiryInput): { score: number; status: LeadStatus } {
  let score = 0;
  if (input.name) score += 10;
  if (input.email) score += 15;
  if (input.phone) score += 10;
  if (input.projectType && !/not sure/i.test(input.projectType)) score += 10;
  score += Math.min(15, Math.floor(input.projectDescription.length / 10));
  score += URGENCY[input.timeline.toLowerCase()] ?? 0;
  if (input.requestedQuotation) score += 10;
  if (input.requestedConsultation) score += 10;
  score = Math.min(100, score);
  return { score, status: score >= 70 ? "HOT" : score >= 45 ? "WARM" : "COLD" };
}
