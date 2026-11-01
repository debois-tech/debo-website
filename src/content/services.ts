export type Pillar = "build" | "scale" | "accelerate";
export type Service = {
  slug: string;
  pillar: Pillar;
  /** How we work on it, in one sentence. Owner to confirm. */
  approach: string;
  /** Qualitative results a client can expect. No figures: none are published. Owner to confirm. */
  outcomes: string[];
  /** Tools we use for this service, from our own stack. */
  tech: string[];
  /** Real DeboisTech work that shows this service, when there is some. */
  proof?: { product: string; note: string };
  name: string;
  short: string;
  audience: string;
  problem: string;
  deliverables: string[];
};

/** Capability areas per PRD §6.5. Deliverables are typical engagement outputs — owner to confirm. */
export const SERVICES: Service[] = [
  {
    slug: "software-engineering",
    pillar: "build",
    approach: "We start with the smallest version that proves the idea, then build in reviewed increments with tests and CI from the first week.",
    outcomes: ["A product your team can run and extend", "Fewer surprises at release", "Documentation that survives handover"],
    tech: ["Next.js", "React", "TypeScript", "Node.js", "Python"],
    name: "Software Engineering",
    short: "Web, mobile and backend products built to be maintained.",
    audience: "Teams that need a product built, extended or stabilised.",
    problem: "Turning a requirement into reliable, maintainable software.",
    deliverables: ["Product and system design", "Web, mobile and API development", "Automated testing and CI", "Handover documentation"],
  },
  {
    slug: "ai-ml",
    pillar: "accelerate",
    approach: "We build against a set of your own examples from the start, so we can tell whether the model helps before it ships.",
    outcomes: ["AI features measured on your own cases", "Repetitive work automated", "A system your team can monitor"],
    tech: ["Python", "LLMs", "RAG"],
    name: "AI / ML",
    short: "LLM integration, custom models and workflow automation.",
    audience: "Teams adding AI to a product or automating an internal workflow.",
    problem: "Moving from an AI idea to a working, evaluated system.",
    deliverables: ["LLM and RAG application development", "Model training and evaluation", "Workflow automation", "Deployment support"],
  },
  {
    slug: "cloud-devops",
    pillar: "scale",
    approach: "We design for the failure you will eventually have, automate delivery, and keep infrastructure in code so every change can be reviewed.",
    outcomes: ["Releases that are repeatable", "Infrastructure you can rebuild from code", "Cloud costs you can explain"],
    tech: ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"],
    proof: { product: "tenantplane", note: "Our open-source TenantPlane platform: explainable Kubernetes multi-tenancy." },
    name: "Cloud & DevOps",
    short: "Cloud-native architecture, CI/CD and infrastructure as code.",
    audience: "Teams running or moving workloads on AWS, Azure or Google Cloud.",
    problem: "Shipping and operating software reliably and cost-consciously.",
    deliverables: ["Cloud architecture", "CI/CD pipelines", "Infrastructure as code", "Kubernetes and container platforms"],
  },
  {
    slug: "ui-ux",
    pillar: "accelerate",
    approach: "We watch how people actually use the product, prototype the flows, and test them before development starts.",
    outcomes: ["Flows people finish without help", "A design system the team shares", "Accessibility built in, not bolted on"],
    tech: ["React", "TypeScript", "Next.js"],
    name: "UI / UX",
    short: "Interface design grounded in how people use the product.",
    audience: "Teams designing or redesigning a product experience.",
    problem: "Making a product understandable and usable.",
    deliverables: ["User flows and wireframes", "Interface design", "Design systems", "Accessibility review"],
  },
  {
    slug: "data-engineering",
    pillar: "scale",
    approach: "We trace each number back to its source, then build pipelines with checks that fail loudly when the data goes wrong.",
    outcomes: ["Reports people trust", "Current data where it is needed", "Fewer hand-maintained spreadsheets"],
    tech: ["Python", "AWS", "Linux"],
    name: "Data Engineering",
    short: "Pipelines and data platforms teams can trust.",
    audience: "Teams whose data is scattered, slow or unreliable.",
    problem: "Getting accurate data to the people and systems that need it.",
    deliverables: ["Data pipelines", "Warehouse and lake design", "Data quality checks", "Reporting foundations"],
  },
  {
    slug: "cybersecurity",
    pillar: "scale",
    approach: "We review how the system is built and deployed, rank what we find by risk, and help fix the important items first.",
    outcomes: ["A ranked list of real risks", "Safer defaults in code and cloud setup", "Access that matches who needs what"],
    tech: ["AWS", "Kubernetes", "Linux", "Git"],
    name: "Cybersecurity",
    short: "Security reviews and secure-by-default engineering.",
    audience: "Teams that need to find and reduce security risk.",
    problem: "Understanding and reducing exposure in applications and infrastructure.",
    deliverables: ["Application and cloud security review", "Secure configuration guidance", "Access-control design", "Remediation support"],
  },
  {
    slug: "digital-transformation",
    pillar: "build",
    approach: "We map how the work really happens, pick the process worth fixing first, and replace it with a working system in stages.",
    outcomes: ["Less manual rework", "Records in one place instead of on paper", "A team that can keep improving the system"],
    tech: ["Next.js", "Node.js", "Firebase"],
    proof: { product: "motoadmin", note: "Our own MotoAdmin product runs the paperwork of a driving school: records and document reminders in one system." },
    name: "Digital Transformation",
    short: "Replacing manual, paper-based processes with working systems.",
    audience: "Organisations modernising operations.",
    problem: "Moving manual processes onto systems that scale.",
    deliverables: ["Process discovery", "Roadmap and prioritisation", "Incremental delivery", "Team enablement"],
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);

export const ENGAGEMENT_STEPS = ["Discover", "Design", "Develop", "Deploy", "Support"] as const;

/** One sentence per phase of an engagement. */
export const ENGAGEMENT_DETAIL: Record<(typeof ENGAGEMENT_STEPS)[number], string> = {
  Discover: "We learn the problem, the users and the constraints.",
  Design: "We agree the scope, the architecture and what done looks like.",
  Develop: "We build in small, reviewed increments you can see.",
  Deploy: "We release safely, with monitoring and a way back.",
  Support: "We stay to fix, tune and hand over properly.",
};

export const PILLARS: { id: Pillar; name: string; line: string }[] = [
  { id: "build", name: "Build", line: "Turn ideas into working software." },
  { id: "scale", name: "Scale", line: "Make your systems handle growth." },
  { id: "accelerate", name: "Accelerate", line: "Work smarter with AI and design." },
];

/** Tools named across our own services, products and labs, grouped. Owner to review and edit. */
export const TECH_GROUPS: { name: string; items: string[] }[] = [
  { name: "Frontend", items: ["Next.js", "React", "TypeScript"] },
  { name: "Backend", items: ["Node.js", "Python", "Firebase"] },
  { name: "AI & Data", items: ["LLMs", "RAG", "Data pipelines"] },
  { name: "Cloud & DevOps", items: ["AWS", "Docker", "Jenkins", "Git"] },
  { name: "Infrastructure", items: ["Kubernetes", "Linux"] },
];

/** Trust bar figures. Edit here; keep them true. */
export const TRUST_STATS = [
  { value: "10+", label: "Clients served" },
  { value: "3", label: "Products built in-house" },
  { value: "India + remote", label: "Clients across India and abroad" },
] as const;
