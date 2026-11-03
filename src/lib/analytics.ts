"use client";
/**
 * Privacy-safe analytics facade. No vendor is wired yet (see docs/ANALYTICS.md).
 * Only whitelisted, non-personal properties can pass; anything else is dropped,
 * so form contents, emails and phone numbers can never reach a provider.
 */
type Primitive = string | number | boolean;
const ALLOWED = new Set([
  "destination", "placement", "cta_id", "product_slug", "service_slug", "stage_id",
  "demo_version", "track_id", "form_type", "intent", "error_category", "role_slug", "node_id",
]);

export type AnalyticsEvent =
  | "nav_click" | "hero_cta_click" | "product_view" | "product_cta_click" | "service_cta_click"
  | "ecosystem_select" | "pipeline_stage_select" | "pipeline_run" | "pipeline_reset"
  | "tep_track_select" | "apply_click" | "whatsapp_click" | "form_start" | "form_error" | "form_success" | "career_apply_click";

export function track(event: AnalyticsEvent, props: Record<string, Primitive | undefined> = {}) {
  if (typeof window === "undefined") return;
  const clean: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(props)) {
    if (ALLOWED.has(k) && v !== undefined && typeof v !== "object") clean[k] = typeof v === "string" ? v.slice(0, 60) : v;
  }
  window.dispatchEvent(new CustomEvent("deboistech:analytics", { detail: { event, ...clean } }));
}
