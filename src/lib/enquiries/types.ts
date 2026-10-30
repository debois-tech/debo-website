export type LeadStatus = "HOT" | "WARM" | "COLD";

export type EnquiryInput = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  projectDescription: string;
  timeline: string;
  requestedQuotation: boolean;
  requestedConsultation: boolean;
  source: string;
};

export type EnquiryRecord = {
  created_at: string;
  id: string;
  status: "NEW";
  lead_status: LeadStatus;
  lead_score: number;
  recommended_service: string;
  name: string;
  email: string;
  phone: string;
  project_type: string;
  project_description: string;
  timeline: string;
  source: string;
};

export const TIMELINES = ["Immediately", "Within 1 month", "1–3 months", "3–6 months", "6+ months", "Not decided"] as const;
