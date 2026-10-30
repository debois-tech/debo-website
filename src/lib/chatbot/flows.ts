import { PRICING_REPLY, chunkText, programsText } from "./live-site";
import { getProduct } from "@/content/products";
import { EMAIL, WHATSAPP_PREFILL, gmailLink, whatsappLink } from "./contact";
import { clip, isEmail, normalizePhone } from "@/lib/enquiries/normalize";
import { TIMELINES } from "@/lib/enquiries/types";

export type Option = { label: string; value: string };
export type BotMessage = {
  text: string;
  options?: Option[];
  /** Options are toggles confirmed with a Continue button. */
  multi?: boolean;
  action?: { label: string; href: string };
  sticker?: boolean;
  /** Label/value rows shown as a card inside the bubble. */
  fields?: { label: string; value: string }[];
  /** Text shown below `fields`. */
  after?: string;
};
export type Step = "idle" | "offer_product" | "type" | "description" | "timeline" | "name" | "email" | "phone" | "confirm" | "edit_pick" | "sending";
export type Channel = "whatsapp" | "email";
export type ProductKey = "motoadmin" | "tenantplane";

export type EnquiryData = {
  projectType?: string;
  projectDescription?: string;
  timeline?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneAsked?: boolean;
};
export type FlowState = {
  step: Step;
  mode: "custom" | "product";
  product?: ProductKey;
  data: EnquiryData;
  history: Step[];
  editing: boolean;
  quotation: boolean;
  consultation: boolean;
  channel?: Channel;
};
export type SubmitPayload = {
  name: string; email: string; phone: string; projectType: string; projectDescription: string; timeline: string;
  requestedQuotation: boolean; requestedConsultation: boolean; source: string;
};
/** Dashboard-sourced text the widget fetches once; the engine falls back to built-in content without it. */
export type FlowContext = { programs?: string };
export type FlowResult = {
  state: FlowState;
  messages: BotMessage[];
  /** Enquiry to POST to /api/project-enquiry. */
  submit?: SubmitPayload;
  channel?: Channel;
  /** URL to open in a new tab from the click handler. */
  url?: string;
  /** Not handled here: send to the LLM endpoint. */
  chat?: boolean;
};

export const PROJECT_TYPES = [
  "Website", "Web Application", "Mobile Application", "AI / Generative AI Solution", "Enterprise Application", "SaaS / Digital Product",
  "Cloud / DevOps Solution", "Custom Software", "UI/UX Design", "Technology Consulting", "Other", "I'm not sure yet",
];
const PRODUCT_KEYS: ProductKey[] = ["motoadmin", "tenantplane"];
const PRODUCT_NAMES = Object.fromEntries(PRODUCT_KEYS.map((k) => [k, getProduct(k)?.name ?? k])) as Record<ProductKey, string>;
const FIELD_LABELS = { type: "Project type", description: "Description", timeline: "Timeline", name: "Name", email: "Email", phone: "Phone" } as const;

export const initialState = (): FlowState => ({
  step: "idle", mode: "custom", data: {}, history: [], editing: false, quotation: false, consultation: false,
});

const opts = (labels: string[], prefix: string): Option[] => labels.map((l) => ({ label: l, value: `${prefix}:${l}` }));

const MENU: Option[] = [
  { label: "Start a Project", value: "cmd:start" },
  { label: "Explore Services", value: "cmd:services" },
  { label: "Our Products", value: "cmd:products" },
  { label: "Training Programs", value: "cmd:programs" },
  { label: "Career Opportunities", value: "cmd:careers" },
  { label: "Talk to the Team", value: "cmd:team" },
];
const BACK_TO_MENU: Option = { label: "Back to menu", value: "cmd:menu" };

export const WELCOME =
  "Hey! Welcome to DeboisTech 👋\n\nI'm Debo. I can help you explore our engineering services, products, training programs, or discuss a project you're planning.\n\nWhat brings you here today?";
export const welcome = (): BotMessage => ({ text: WELCOME, options: MENU });

// ---------- detection ----------

const MENU_RE = /^(cancel|stop|exit|quit|never ?mind|menu|main menu|back to menu|start over|restart)\W*$/i;
const BACK_RE = /^(back|go back|previous|previous question)\W*$/i;
const GREETING_RE = /^(hi|hello|hey|hii|namaste|good (morning|afternoon|evening))\W*$/i;
const HANDOFF_RE = /\b(talk|speak|chat|connect)\s+(to|with)\s+(a\s+|the\s+|your\s+)?(human|person|someone|agent|representative|team|staff|support)\b|\b(human|real person|customer (care|support)|complain\w*|refund|escalat\w+|unhappy|not happy|support team)\b/i;
const PRICING_RE = /\b(price|prices|pricing|cost|costs|quote|quotation|how much|rate|rates|charges?|fees?|budget|estimate|cheap|affordable)\b/i;
const PROGRAM_RE = /\b(tep|fde|program|programs|course|training|cohort|bootcamp|internship|certificate|student|students)\b/i;
const CONSULT_RE = /\b(consult\w*|schedule|meeting|demo|discuss|call me|call back)\b/i;
const PROJECT_RE = /\b(build|develop|create|make|design|need|want|looking for|require|planning|plan to|start|launch|migrate)\b[\s\S]*\b(app|application|website|site|platform|portal|software|system|chatbot|ai|saas|product|dashboard|crm|erp|tool|api|automation|mvp|store)\b|\b(project|quotation)\b/i;

const PRODUCT_RULES: { key: ProductKey; match: RegExp; explicit: RegExp }[] = [
  { key: "motoadmin", match: /driving school|driving licen[cs]e|motor training|\brto\b|moto ?admin/i, explicit: /moto ?admin/i },
  { key: "tenantplane", match: /multi[- ]?tenan\w*|tenant ?plane/i, explicit: /tenant ?plane/i },
];
const DEBO_LABS_RE = /debo labs|devops (labs?|practice)|practi[cs]e devops|learn devops/i;

const TYPE_RULES: [RegExp, string][] = [
  [/mobile app|android|\bios\b|iphone|flutter|react native/i, "Mobile Application"],
  [/\b(ai|genai|gen ai|generative|llm|chatbot|gpt|machine learning|ml|rag)\b/i, "AI / Generative AI Solution"],
  [/\b(cloud|devops|kubernetes|k8s|ci\/?cd|aws|azure|gcp)\b/i, "Cloud / DevOps Solution"],
  [/\bui\/?ux\b|\bux\b|ui design|figma|wireframe|redesign/i, "UI/UX Design"],
  [/\b(enterprise|erp|crm|hrms|internal tool|inventory)\b/i, "Enterprise Application"],
  [/\b(saas|digital product|mvp)\b/i, "SaaS / Digital Product"],
  [/web app|web application|\bportal\b|dashboard|web platform|web-based/i, "Web Application"],
  [/website|web site|landing page|e-?commerce|online store/i, "Website"],
  [/consult\w*|advisory|architecture review|roadmap/i, "Technology Consulting"],
  [/custom software|\bsoftware\b/i, "Custom Software"],
];

const TIMELINE_RULES: [RegExp, string][] = [
  [/\b(immediately|asap|right away|urgent\w*)\b/i, "Immediately"],
  [/within (a|1|one) month|next month|in a month|this month|\b1 month\b/i, "Within 1 month"],
  [/(1|one)\s*(-|–|to)\s*(3|three) months|\b(2|two|3|three) months\b|couple of months|few months/i, "1–3 months"],
  [/(3|three)\s*(-|–|to)\s*(6|six) months|\b(4|four|5|five|6|six) months\b|half a year/i, "3–6 months"],
  [/6\+|(more than|over|beyond) (6|six)|\b(a|one|1) year\b|12 months|next year/i, "6+ months"],
  [/not decided|not sure|flexible|no deadline|no rush|undecided|don'?t know/i, "Not decided"],
];

export const detectType = (t: string) => TYPE_RULES.find(([re]) => re.test(t))?.[1];
export const detectTimeline = (t: string) => TIMELINE_RULES.find(([re]) => re.test(t))?.[1];

function matchOption(text: string, labels: readonly string[]) {
  const norm = (s: string) => s.toLowerCase().replace(/[–—-]/g, "-").replace(/\s+/g, " ").trim();
  return labels.find((l) => norm(l) === norm(text));
}

const NOT_NAMES = new Set(["looking", "planning", "interested", "trying", "building", "wanting", "here", "from", "not", "just", "a", "an", "the", "in", "also", "currently"]);
function extractName(text: string): string | undefined {
  const m = text.match(/(?:my name is|this is|name\s*:)\s+([A-Za-z][A-Za-z .'-]{1,60}?)(?=[,.;\n!]|\s+(?:and|from|my|i|email|phone|at)\b|$)/i)
    ?? text.match(/\bI(?: am|'m) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)(?=[,.;\n!]|\s|$)/);
  const name = m?.[1]?.trim();
  return name && !NOT_NAMES.has(name.split(" ")[0].toLowerCase()) ? name : undefined;
}
const extractEmail = (t: string) => t.match(/[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}/)?.[0];
function extractPhone(t: string) {
  const m = t.replace(extractEmail(t) ?? "", " ").match(/\+?\d[\d\s\-().]{8,17}\d/);
  return m ? normalizePhone(m[0]) ?? undefined : undefined;
}

// ---------- prompts ----------

function ask(state: FlowState): BotMessage {
  const product = state.product ? PRODUCT_NAMES[state.product] : "";
  switch (state.step) {
    case "type": return { text: "Certainly. What type of project would you like to build?", options: opts(PROJECT_TYPES, "type") };
    case "description":
      return { text: state.mode === "product" ? `Thank you. What would you like to achieve with ${product}?` : "Thank you. Please describe your project in a sentence or two." };
    case "timeline": return { text: "What is your preferred timeline?", options: opts([...TIMELINES], "timeline") };
    case "name": return { text: "May I have your full name?" };
    case "email": return { text: `Thank you${state.data.name ? `, ${state.data.name.split(" ")[0]}` : ""}. What is your email address?` };
    case "phone": return { text: "Would you like to share a phone or WhatsApp number? This is optional.", options: [{ label: "Skip", value: "phone:skip" }] };
    case "edit_pick": return { text: "Which detail would you like to change?", options: (Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).map((k) => ({ label: FIELD_LABELS[k], value: `edit:${k}` })) };
    case "confirm": return confirmMessage(state);
    default: return welcome();
  }
}

export function enquirySummary(d: EnquiryData): string {
  return [
    "Hello DeboisTech, I would like to enquire about a project.", "",
    `Project type: ${d.projectType}`, `Description: ${d.projectDescription}`, `Timeline: ${d.timeline}`,
    `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone || "—"}`,
  ].join("\n");
}

function confirmMessage(state: FlowState): BotMessage {
  const d = state.data;
  return {
    text: "Thank you. Please review your enquiry:",
    fields: [
      { label: "Project type", value: d.projectType ?? "" }, { label: "Description", value: d.projectDescription ?? "" },
      { label: "Timeline", value: d.timeline ?? "" }, { label: "Name", value: d.name ?? "" },
      { label: "Email", value: d.email ?? "" }, { label: "Phone", value: d.phone || "Not provided" },
    ],
    after: "How would you like to send it?",
    options: [
      { label: "Send via WhatsApp", value: "send:whatsapp" }, { label: "Send via Email", value: "send:email" },
      { label: "Edit Details", value: "edit" }, { label: "Cancel", value: "cmd:cancel" },
    ],
  };
}

export function placeholderFor(state: FlowState): string {
  switch (state.step) {
    case "type": return "Pick one, or type your own";
    case "description": return state.mode === "product" ? "What would you like to achieve?" : "Describe your project";
    case "timeline": return "e.g. within 1–3 months";
    case "name": return "Your full name";
    case "email": return "name@example.com";
    case "phone": return "Phone or WhatsApp (optional)";
    case "confirm": return "Choose an option above";
    default: return "Ask Debo anything...";
  }
}

export const inFlow = (s: FlowState) => s.step !== "idle" && s.step !== "sending";
export const reprompt = (s: FlowState): BotMessage[] => (inFlow(s) ? [ask(s)] : []);

// ---------- flow mechanics ----------

function nextStep(state: FlowState): Step {
  const d = state.data;
  if (!d.projectType) return "type";
  if (!d.projectDescription) return "description";
  if (!d.timeline) return "timeline";
  if (!d.name) return "name";
  if (!d.email) return "email";
  if (!d.phoneAsked) return "phone";
  return "confirm";
}

function advance(state: FlowState, from?: Step): FlowResult {
  const history = from && state.history[state.history.length - 1] !== from ? [...state.history, from] : state.history;
  const next: FlowState = { ...state, history, step: nextStep(state), editing: false };
  return { state: next, messages: [ask(next)] };
}

const reset = (): FlowState => initialState();
const toMenu = (text?: string): FlowResult => ({ state: reset(), messages: [text ? { text, options: MENU } : welcome()] });

function handoff(state: FlowState, text?: string): FlowResult {
  const link = whatsappLink(WHATSAPP_PREFILL + (text ? ` ${clip(text, 300)}` : ""));
  const resume: Option[] = inFlow(state) ? [{ label: "Continue enquiry", value: "cmd:resume" }] : [{ label: "Start Project Enquiry", value: "cmd:start" }];
  const msg: BotMessage = link
    ? {
        text: "I understand. Our team will be glad to help you directly. Please chat with us on WhatsApp. If you would rather send project requirements by email, I can collect them here.",
        action: { label: "Chat on WhatsApp", href: link }, options: [...resume, BACK_TO_MENU],
      }
    : { text: `I understand. Please write to our team at ${EMAIL}, or I can collect your project requirements here.`, options: [...resume, BACK_TO_MENU] };
  return { state, messages: [msg] };
}

function pricing(state: FlowState): FlowResult {
  const next = { ...state, quotation: true };
  const msgs: BotMessage[] = [{ text: PRICING_REPLY }];
  if (inFlow(next)) msgs.push(ask(next));
  else msgs[0].options = [{ label: "Start Project Enquiry", value: "cmd:start" }, { label: "Talk to Team", value: "cmd:team" }];
  return { state: next, messages: msgs };
}

function productOffer(state: FlowState, key: ProductKey): FlowResult {
  const name = PRODUCT_NAMES[key];
  const next: FlowState = { ...state, step: "offer_product", product: key };
  return {
    state: next,
    messages: [{
      text: `Certainly. ${getProduct(key)?.summary ?? ""} Would you like to enquire about ${name}, or discuss a custom project instead?`,
      options: [{ label: `Enquire about ${name}`, value: `product:${key}` }, { label: "Custom project instead", value: "custom" }, BACK_TO_MENU],
    }],
  };
}

function startProduct(state: FlowState, key: ProductKey): FlowResult {
  const next: FlowState = { ...state, mode: "product", product: key, history: [], data: { ...state.data, projectType: `Product enquiry: ${PRODUCT_NAMES[key]}` } };
  return advance(next);
}

function startCustom(state: FlowState, text?: string): FlowResult {
  const data: EnquiryData = { ...(state.step === "offer_product" ? state.data : {}) };
  if (text) {
    data.projectType ??= detectType(text);
    data.timeline ??= detectTimeline(text);
    data.name ??= extractName(text);
    const email = extractEmail(text);
    if (email) data.email ??= email.toLowerCase();
    const phone = extractPhone(text);
    if (phone) { data.phone ??= phone; data.phoneAsked = true; }
    if (PROJECT_RE.test(text) && text.trim().length >= 12) data.projectDescription ??= clip(text, 2000);
  }
  const base: FlowState = {
    ...initialState(), data, quotation: state.quotation || PRICING_RE.test(text ?? ""), consultation: state.consultation || CONSULT_RE.test(text ?? ""),
  };
  return advance(base);
}

// ---------- step answers ----------

type Answer = { data?: EnquiryData; error?: string };

function answerStep(state: FlowState, text: string, value?: string): Answer {
  const t = clip(text, 2000);
  const v = value?.includes(":") ? value.slice(value.indexOf(":") + 1) : undefined;
  switch (state.step) {
    case "type": {
      const label = matchOption(v ?? t, PROJECT_TYPES);
      if (label) return { data: { projectType: label } };
      const detected = detectType(t);
      if (detected) return { data: { projectType: detected, projectDescription: state.data.projectDescription ?? (t.length > 30 ? t : undefined) } };
      if (t.length > 40) return { data: { projectType: "Other", projectDescription: state.data.projectDescription ?? t } };
      return t.length >= 2 ? { data: { projectType: clip(t, 80) } } : { error: "Please choose a project type, or type your own." };
    }
    case "description":
      return t.length >= 5 ? { data: { projectDescription: t } } : { error: "Could you share a little more detail about the project?" };
    case "timeline": {
      const label = matchOption(v ?? t, TIMELINES) ?? detectTimeline(t);
      return label ? { data: { timeline: label } } : t.length >= 2 ? { data: { timeline: clip(t, 40) } } : { error: "Please choose a timeline, or type your own." };
    }
    case "name": {
      const name = clip(extractName(t) ?? t.replace(/^(my name is|this is|i am|i'm)\s+/i, ""), 100);
      if (name.length < 2 || /@|\d{4,}/.test(name)) return { error: "Please enter your full name." };
      return { data: { name } };
    }
    case "email": {
      const email = extractEmail(t);
      return email && isEmail(email) ? { data: { email: email.toLowerCase() } } : { error: "That email address does not look valid. Please enter it like name@example.com." };
    }
    case "phone": {
      if (v === "skip" || /^(skip|no|none|later|not now|n\/a|-)\W*$/i.test(t)) return { data: { phone: "", phoneAsked: true } };
      const phone = normalizePhone(t);
      return phone ? { data: { phone, phoneAsked: true } } : { error: "Please enter a valid phone number, or choose Skip." };
    }
    default: return { error: "" };
  }
}

function applyAnswer(state: FlowState, text: string, value?: string): FlowResult {
  const ans = answerStep(state, text, value);
  if (ans.error) return { state, messages: [{ text: ans.error }] };
  const merged: FlowState = { ...state, data: { ...state.data, ...ans.data } };
  if (state.editing) return { state: { ...merged, step: "confirm", editing: false }, messages: [ask({ ...merged, step: "confirm" })] };
  return advance(merged, state.step);
}

// ---------- canned info ----------

function info(key: "services" | "products" | "programs" | "careers", ctx?: FlowContext): BotMessage {
  const links = { services: "/services", products: "/products", programs: "/program", careers: "/careers" };
  const labels = { services: "View services", products: "View products", programs: "View programs", careers: "Careers page" };
  const options: Record<typeof key, Option[]> = {
    services: [{ label: "Start Project Enquiry", value: "cmd:start" }, { label: "Talk to Team", value: "cmd:team" }, BACK_TO_MENU],
    products: [{ label: "MotoAdmin enquiry", value: "product:motoadmin" }, { label: "TenantPlane enquiry", value: "product:tenantplane" }, { label: "Start Project Enquiry", value: "cmd:start" }, BACK_TO_MENU],
    programs: [{ label: "Talk to Team", value: "cmd:team" }, BACK_TO_MENU],
    careers: [BACK_TO_MENU],
  };
  const chunk = key === "services" ? "services" : key === "products" ? "products" : key === "programs" ? "programs" : "careers";
  const text = key === "programs" ? ctx?.programs ?? programsText(null) : chunkText(chunk);
  return { text, action: { label: labels[key], href: links[key] }, options: options[key] };
}

// ---------- entry points ----------

export function handleInput(state: FlowState, input: { text: string; value?: string }, ctx?: FlowContext): FlowResult {
  const text = input.text.trim();
  const value = input.value;

  // buttons
  if (value) {
    if (value === "cmd:menu") return toMenu();
    if (value === "cmd:cancel") return toMenu("No problem, I have cancelled this enquiry. How else may I help you?");
    if (value === "cmd:start") return advance({ ...initialState(), quotation: state.quotation, consultation: state.consultation });
    if (value === "cmd:team") return handoff(state);
    if (value === "cmd:resume") return { state, messages: reprompt(state) };
    if (value === "cmd:back") return back(state);
    if (value === "cmd:services") return { state, messages: [info("services")] };
    if (value === "cmd:products") return { state, messages: [info("products")] };
    if (value === "cmd:programs") return { state, messages: [info("programs", ctx)] };
    if (value === "cmd:careers") return { state, messages: [info("careers")] };
    if (value === "custom") return startCustom(state);
    if (value.startsWith("product:") && value.slice(8) in PRODUCT_NAMES) return startProduct(state, value.slice(8) as ProductKey);
    if (value === "edit" && state.step === "confirm") return { state: { ...state, step: "edit_pick" }, messages: [ask({ ...state, step: "edit_pick" })] };
    if (value.startsWith("edit:") && value.slice(5) in FIELD_LABELS) {
      const step = ({ type: "type", description: "description", timeline: "timeline", name: "name", email: "email", phone: "phone" } as const)[value.slice(5) as keyof typeof FIELD_LABELS];
      const next: FlowState = { ...state, step, editing: true };
      return { state: next, messages: [ask(next)] };
    }
    if (value === "send:whatsapp" || value === "send:email" || value === "send:retry") return send(state, value === "send:retry" ? state.channel : (value.slice(5) as Channel));
    if (state.step !== "idle" && (value.startsWith("type:") || value.startsWith("timeline:") || value.startsWith("phone:"))) return applyAnswer(state, text, value);
  }

  if (!text) return { state, messages: [] };
  if (MENU_RE.test(text)) return toMenu(inFlow(state) ? "No problem, I have cancelled this enquiry. How else may I help you?" : undefined);
  if (BACK_RE.test(text) && inFlow(state)) return back(state);

  if (PRICING_RE.test(text) && !PROGRAM_RE.test(text) && state.step !== "description" && state.step !== "name") return pricing(state);
  if (HANDOFF_RE.test(text)) return handoff(state, text);

  const flags = { quotation: state.quotation || PRICING_RE.test(text), consultation: state.consultation || CONSULT_RE.test(text) };

  if (inFlow(state) && state.step !== "confirm" && state.step !== "edit_pick" && state.step !== "offer_product") {
    // A question mid-flow goes to the model; the widget then repeats the current question.
    if (/\?\s*$/.test(text) && state.step !== "description") return { state: { ...state, ...flags }, messages: [], chat: true };
    return applyAnswer({ ...state, ...flags }, text);
  }
  if (state.step === "confirm" || state.step === "edit_pick" || state.step === "offer_product") {
    return { state: { ...state, ...flags }, messages: [], chat: true };
  }

  // idle
  if (GREETING_RE.test(text)) return { state, messages: [welcome()] };
  for (const p of PRODUCT_RULES) {
    if (p.explicit.test(text)) return startProduct({ ...state, ...flags }, p.key);
    if (p.match.test(text)) return productOffer({ ...state, ...flags }, p.key);
  }
  if (DEBO_LABS_RE.test(text)) return { state, messages: [{ text: chunkText("labs-overview"), action: { label: "Open Debo Labs", href: "/labs" }, options: [BACK_TO_MENU] }] };
  if (PROJECT_RE.test(text)) return startCustom({ ...state, ...flags }, text);
  return { state, messages: [], chat: true };
}

function back(state: FlowState): FlowResult {
  if (state.editing) return { state: { ...state, step: "confirm", editing: false }, messages: [ask({ ...state, step: "confirm" })] };
  const history = [...state.history];
  const prev = history.pop();
  if (!prev) return toMenu();
  const next: FlowState = { ...state, history, step: prev };
  return { state: next, messages: [ask(next)] };
}

function send(state: FlowState, channel?: Channel): FlowResult {
  const d = state.data;
  if (state.step !== "confirm" && state.step !== "sending") return { state, messages: [] };
  if (!channel || !d.name || !d.email || !d.projectType || !d.projectDescription) return { state, messages: [] };
  const summary = enquirySummary(d);
  const url = channel === "whatsapp" ? whatsappLink(summary) : gmailLink(summary);
  if (!url) {
    return { state, messages: [{ text: `WhatsApp is not available at the moment. Please choose Send via Email, or write to ${EMAIL}.`, options: confirmMessage(state).options }] };
  }
  return {
    state: { ...state, step: "sending", channel },
    messages: [],
    channel,
    url,
    submit: {
      name: d.name, email: d.email, phone: d.phone ?? "", projectType: d.projectType, projectDescription: d.projectDescription,
      timeline: d.timeline ?? "Not decided", requestedQuotation: state.quotation, requestedConsultation: state.consultation, source: "chatbot",
    },
  };
}

/** Called by the widget once /api/project-enquiry has answered. Never reports success unless ok. */
export function completeSubmission(state: FlowState, ok: boolean): FlowResult {
  if (ok) {
    return {
      state: reset(),
      messages: [
        { text: "Your project enquiry has been submitted to the DeboisTech team. They will review your requirements and follow up using the contact details you provided.", sticker: true, options: [BACK_TO_MENU] },
      ],
    };
  }
  return {
    state: { ...state, step: "confirm" },
    messages: [{
      text: `I am sorry, we could not submit your enquiry just now. Please try again, or write to us at ${EMAIL}. Your prefilled message is also open in the tab we launched, so you can send it from there.`,
      options: [{ label: "Try Again", value: "send:retry" }, { label: "Cancel", value: "cmd:cancel" }],
    }],
  };
}
