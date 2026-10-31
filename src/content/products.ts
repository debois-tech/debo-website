import { LABS, LAB_TOTALS } from "./labs";

export type Product = {
  slug: "debo-labs" | "motoadmin" | "tenantplane";
  /** Where the product's own page lives when it is not /products/[slug]. */
  detailHref?: string;
  name: string;
  /** Short product-specific headline for the product story. */
  headline: string;
  highlights: { title: string; body: string }[];
  /** Real asset from the product's own site, if one exists. Otherwise an illustrative preview is shown. */
  visual?: { src: string; alt: string; width: number; height: number; credit: string };
  mark: { src: string; alt: string };
  story: { problem: string; challenge: string; approach: string; solution: string; results: string };
  tagline: string;
  summary: string;
  problem: string;
  audience: string[];
  features: { title: string; body: string }[];
  status: string;
  statusNote: string;
  cta: { label: string; href: string }[];
  source: string;
  lastReviewed: string;
};

/** Source of truth: tenantplane.deboistech.in and motoadmin.in, reviewed 15 Oct 2026. Owner sign-off pending. */
export const PRODUCTS: Product[] = [
  {
    slug: "debo-labs",
    detailHref: "/labs",
    name: "Debo Labs",
    headline: "Learn DevOps by doing.",
    mark: { src: "/brand/debolabs-light.webp", alt: "Debo Labs" },
    highlights: [
      { title: "A real terminal", body: "A genuine Linux shell, as its own user. Break things safely." },
      { title: "Graded on real state", body: "The check inspects your sandbox, however you reached the result." },
      { title: "Your machine or ours", body: "The same labs run hosted, or offline in Docker." },
    ],
    story: {
      problem: "DevOps is a practical skill, so it has to be practised in a real environment.",
      challenge: "A lab has to behave like the real thing and still be checkable.",
      approach: "Each lab runs in a real terminal sandbox. A check then inspects the sandbox for the state the lab asked for.",
      solution: `${LAB_TOTALS.labs} labs across ${LAB_TOTALS.tracks} tracks, from Linux and Git to AWS, Docker, CI/CD and Jenkins, hosted or offline in Docker.`,
      results: "No learner counts or outcomes are published.",
    },
    tagline: "Real terminals. Real feedback. Every lab is graded on what actually happened.",
    summary: "A hands-on platform for learning DevOps by doing labs in a real terminal. Each lab is graded on what actually happens in your sandbox.",
    problem: "DevOps is learned by doing, not by watching.",
    audience: ["People learning DevOps, from Linux basics to Docker, AWS and CI/CD"],
    features: [
      { title: "Real terminal", body: "A genuine Linux shell, as its own user." },
      { title: "Graded on real state", body: "Checks inspect your sandbox." },
      { title: "Hosted or offline", body: "Run it on labs.deboistech.in, or offline in Docker." },
      { title: `${LAB_TOTALS.tracks} tracks`, body: "Linux, Git, AWS, Docker, networking, Node.js, Python, GitHub Actions and Jenkins." },
    ],
    status: "Available",
    statusNote: "Hosted at labs.deboistech.in, or run it locally in Docker.",
    cta: [
      { label: "Start the first lab", href: LABS.startUrl },
      { label: "Open labs.deboistech.in", href: LABS.url },
    ],
    source: LABS.url + "/",
    lastReviewed: LABS.lastReviewed,
  },
  {
    slug: "motoadmin",
    name: "MotoAdmin",
    headline: "Every licence. Every renewal. One place.",
    mark: { src: "/products/motoadmin-logo.png", alt: "MotoAdmin logo" },
    highlights: [
      { title: "Documents that watch their own expiry", body: "Seven document types, from Learner’s Licence to Badge, with colour-coded status." },
      { title: "Reminders on WhatsApp", body: "Customers are reminded before a document expires, automatically." },
      { title: "From one school to many", body: "Branches sit under one Super Admin, with data kept separate between them." },
    ],
    story: {
      problem: "Driving schools often track customers, document expiries and renewals by hand.",
      challenge: "Seven document types, each with its own expiry, across many customers and sometimes many branches.",
      approach: "One record per customer, with each document tracked and status-coded, and reminders sent before expiry.",
      solution: "CRM, document tracking, WhatsApp reminders, invoicing and a revenue dashboard in one product, with multi-branch management.",
      results: "No customer outcomes or savings figures are published.",
    },
    tagline: "The smartest way to run your driving school.",
    summary:
      "A CRM and document-reminder platform for driving school operators: customer records, document expiry tracking, WhatsApp renewal reminders, invoicing and revenue in one dashboard.",
    problem:
      "Driving schools often track customers, document expiries and renewals manually. MotoAdmin consolidates customer records, reminders and revenue in one place.",
    audience: ["Single driving schools", "Multi-branch driving school chains (Enterprise)"],
    features: [
      { title: "Customer CRM", body: "Searchable customer records with service history." },
      { title: "Document tracking", body: "Learner's Licence, Driving Licence, Vehicle RC, Insurance, PUC, Fitness Certificate and Badge, with colour-coded status." },
      { title: "WhatsApp renewal reminders", body: "Automated reminders sent before documents expire." },
      { title: "Invoicing", body: "Paid and outstanding amounts per customer." },
      { title: "Revenue dashboard", body: "A consolidated view of revenue." },
      { title: "Multi-branch management", body: "Manage branches under one Super Admin, with data isolation between branches." },
    ],
    status: "Available",
    statusNote: "Plans and pricing are listed on motoadmin.in.",
    cta: [
      { label: "Book a demo", href: "https://www.motoadmin.in/" },
      { label: "Log in", href: "https://www.motoadmin.in/login" },
      { label: "Enterprise enquiry", href: "/contact?intent=product&topic=motoadmin" },
    ],
    source: "https://www.motoadmin.in/",
    lastReviewed: "2026-10-15",
  },
  {
    slug: "tenantplane",
    name: "TenantPlane",
    headline: "Multi-tenancy you can explain.",
    mark: { src: "/products/tenantplane/logo.svg", alt: "TenantPlane logo" },
    visual: { src: "/products/tenantplane/architecture.svg", alt: "TenantPlane architecture: TenantCluster, IsolationProfile and SyncPolicy resources feed one controller, which manages isolation, a control plane and a sync engine in the host namespace.", width: 980, height: 470, credit: "Architecture diagram from tenantplane.deboistech.in" },
    highlights: [
      { title: "Every sync has a reason", body: "explain-sync plans where a tenant resource lands, offline, before anything changes." },
      { title: "Isolation you choose", body: "Profiles combine NetworkPolicy, ResourceQuota, LimitRange and Pod Security." },
      { title: "Small by design", body: "Each tenant gets a lightweight k3s control plane inside a host namespace." },
    ],
    story: {
      problem: "Teams want cluster-like environments without running a full cluster per team.",
      challenge: "Keep isolation and resource sync predictable and auditable as tenants multiply.",
      approach: "Give each tenant a small control plane in a host namespace. A single controller enforces an explicit isolation boundary and maps tenant resources onto the host deterministically, recording a decision for every action.",
      solution: "Three custom resources (TenantCluster, IsolationProfile, SyncPolicy) plus an explain-sync command that shows where a resource lands and why.",
      results: "Early development; APIs are pre-1.0. No adoption or performance figures are published.",
    },
    tagline: "The open platform for explainable Kubernetes multi-tenancy.",
    summary:
      "An open-source virtual Kubernetes tenant platform. Each tenant runs a small control plane inside a host namespace; a controller enforces an explicit isolation boundary and records a decision for every sync action.",
    problem:
      "Teams want cluster-like environments without running a full cluster per team, while keeping isolation and resource sync predictable and auditable.",
    audience: [
      "Platform engineering teams",
      "Internal developer platforms",
      "CI and preview environments",
      "Regulated and audited environments",
    ],
    features: [
      { title: "Explainable sync", body: "Deterministic mapping with offline dry-run planning. The tenantplane explain-sync command shows where a tenant resource lands and why." },
      { title: "Explicit isolation", body: "Isolation profiles combine NetworkPolicy, ResourceQuota, LimitRange and Pod Security." },
      { title: "Lightweight control planes", body: "Each tenant runs a small k3s control plane." },
      { title: "Day-2 operations", body: "Reconciliation, drift correction and orphan garbage collection." },
      { title: "Migration paths", body: "Move tenants across shared, dedicated and private isolation models without recreating tenant API state." },
      { title: "Observability", body: "Decisions are exposed as Kubernetes Events. OpenTelemetry and Prometheus are on the roadmap." },
    ],
    status: "Early development",
    statusNote: "Open source under Apache 2.0. APIs are pre-1.0 and may change.",
    cta: [
      { label: "Read the quickstart", href: "https://tenantplane.deboistech.in/docs/quickstart/" },
      { label: "Documentation", href: "https://tenantplane.deboistech.in/docs/" },
      { label: "View on GitHub", href: "https://github.com/debois-tech/tenantplane" },
    ],
    source: "https://tenantplane.deboistech.in/",
    lastReviewed: "2026-10-15",
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** Canonical page for a product. Debo Labs lives at /labs. */
export const productHref = (p: Product) => p.detailHref ?? `/products/${p.slug}`;

/** Logo box for each product mark, so images keep their true proportions. */
export const markSize = (p: Product) => (p.slug === "motoadmin" ? { w: 160, h: 40 } : p.slug === "debo-labs" ? { w: 160, h: 40 } : { w: 40, h: 40 });
