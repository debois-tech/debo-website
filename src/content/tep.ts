export type Track = {
  slug: "ai-ml" | "multi-cloud";
  name: string;
  summary: string;
  audience: string;
  topics: string[];
  format: string[];
  /** Fees, dates, duration and availability are deliberately NOT published until the team confirms. */
  needsConfirmation: string[];
};

export const TEP_INTRO =
  "The Technology Excellence Program (TEP) is DeboisTech's mentor-led, project-based engineering program for people who want to build real-world technology, not just follow tutorials.";

export const TRACKS: Track[] = [
  {
    slug: "ai-ml",
    name: "AI / ML Engineering",
    summary:
      "From how a neural network trains to how an agent reasons: neural networks, transformers and LLMs, evaluation and fine-tuning, inference, retrieval-augmented generation and agentic AI, finishing with a capstone application.",
    audience: "Students and early-career developers with Python basics who want real intuition for AI engineering.",
    topics: ["Neural network foundations", "Transformers and LLM internals", "Evaluation and fine-tuning", "Inference engineering", "RAG and agentic AI", "Capstone project"],
    format: ["Hands-on labs", "Live sessions", "Capstone project"],
    needsConfirmation: ["Current cohort start date", "Fee and payment terms", "Duration and session count", "Application deadline"],
  },
  {
    slug: "multi-cloud",
    name: "Multi-Cloud Engineering",
    summary:
      "Linux, Git and GitHub, CI/CD with GitHub Actions and Jenkins, Docker, Kubernetes and AWS fundamentals, with guided projects and a self-built portfolio project.",
    audience: "Students, freshers, developers and career switchers moving into cloud and DevOps roles.",
    topics: ["Linux foundations", "Git and GitHub collaboration", "CI/CD: GitHub Actions and Jenkins", "Docker and Kubernetes", "AWS cloud essentials", "Portfolio project"],
    format: ["Instructor-led", "Hands-on labs", "Guided and self-built projects"],
    needsConfirmation: ["Current cohort start date", "Fee and payment terms", "Duration and daily schedule", "Cloud-provider coverage beyond AWS", "Application deadline"],
  },
];

export const getTrack = (slug: string) => TRACKS.find((t) => t.slug === slug);

export const TEP_FAQ = [
  { q: "Who can apply?", a: "Students, freshers, developers and professionals who want hands-on, project-based depth. AI / ML Engineering suits students and early-career developers with Python basics. Multi-Cloud Engineering suits students, freshers, developers and career switchers moving into cloud and DevOps roles." },
  { q: "What are the prerequisites?", a: "AI / ML Engineering expects Python basics. Multi-Cloud Engineering starts from Linux foundations. Tell us your background in your enquiry and ask whether a track fits." },
  { q: "How does mentorship work?", a: "TEP is mentor-led: engineers guide the sessions and give feedback on your projects. Session scheduling is confirmed per cohort." },
  { q: "What is the learning format?", a: "AI / ML Engineering combines hands-on labs, live sessions and a capstone project. Multi-Cloud Engineering is instructor-led, with hands-on labs and guided and self-built projects." },
  { q: "What is the duration?", a: "Duration and session count are confirmed per cohort. Ask in your enquiry and the team will share the current plan." },
  { q: "What will participants build?", a: "AI / ML Engineering finishes with a capstone: a retrieval-augmented, agentic application built end to end. Multi-Cloud Engineering includes guided projects and a portfolio project you design, build and deploy yourself." },
  { q: "Are there practical assignments?", a: "Yes. Both tracks are built around hands-on labs and projects rather than lectures." },
  { q: "Are fees and start dates listed here?", a: "Not yet. Cohort details change, so we share current dates, fees and availability when you enquire rather than publish figures that may be out of date." },
  { q: "What certification or recognition is provided?", a: "Certificate and career-support details differ by cohort. Ask in your enquiry and the team will confirm what applies to the current cohort." },
  { q: "How can I enquire or apply?", a: "Send a TEP enquiry with your preferred track. The team replies with the current cohort details and next steps." },
];

/**
 * The learning journey per track, drawn from the program guides. Order is the real teaching sequence.
 * `learn` splits the stage description into what you practise; `tools` lists only tools or concepts the guides name;
 * `deliverable` appears only where the guides name one. Missing fields are simply not shown.
 */
export type JourneyStage = { step: string; body: string; learn: string[]; tools?: string[]; deliverable?: string };

export const JOURNEY: Record<Track["slug"], JourneyStage[]> = {
  "ai-ml": [
    { step: "Neural network foundations", body: "How a neuron trains and how backpropagation works.", learn: ["How a neuron trains", "How backpropagation works"], tools: ["Neural networks"] },
    { step: "Transformers and LLMs", body: "How modern language models are built, and what happens inside them.", learn: ["How modern language models are built", "What happens inside them"], tools: ["Transformers", "LLMs"] },
    { step: "Evaluation and fine-tuning", body: "Measuring a model, then adapting it.", learn: ["Measuring a model", "Adapting it by fine-tuning"], tools: ["Evaluation", "Fine-tuning"] },
    { step: "Inference and retrieval", body: "Making models fast enough for production, and grounding them with retrieval-augmented generation.", learn: ["Making models fast enough for production", "Grounding them with retrieval-augmented generation"], tools: ["Inference", "RAG"] },
    { step: "Agentic AI", body: "How agents reason and call tools.", learn: ["How agents reason", "How agents call tools"], tools: ["Agentic AI"] },
    { step: "Capstone", body: "A retrieval-augmented, agentic application built end to end.", learn: ["Bring every stage together in one application"], deliverable: "A retrieval-augmented, agentic application, built end to end" },
  ],
  "multi-cloud": [
    { step: "Linux foundations", body: "The command line, permissions, processes, networking and shell scripting.", learn: ["The command line", "Permissions and processes", "Networking", "Shell scripting"], tools: ["Linux"] },
    { step: "Git and GitHub", body: "Branching, pull requests and team workflows.", learn: ["Branching", "Pull requests", "Team workflows"], tools: ["Git", "GitHub"] },
    { step: "CI/CD", body: "Automated pipelines with GitHub Actions and Jenkins.", learn: ["Automated build and delivery pipelines"], tools: ["GitHub Actions", "Jenkins"] },
    { step: "Containers and Kubernetes", body: "Docker images, then pods, deployments and services.", learn: ["Docker images", "Pods, deployments and services"], tools: ["Docker", "Kubernetes"] },
    { step: "AWS essentials", body: "Core services such as EC2, S3, IAM and VPC.", learn: ["Core AWS services"], tools: ["AWS", "EC2", "S3", "IAM", "VPC"] },
    { step: "Portfolio project", body: "A project you design, build and deploy yourself.", learn: ["Design, build and deploy a project of your own"], deliverable: "A portfolio project you design, build and deploy yourself" },
  ],
};

/* ---------- hero strip ---------- */

/** Program-at-a-glance. Duration is confirmed per cohort, so it is not stated here. */
export const TEP_STRIP = [
  { label: "Duration", value: "Set per cohort", note: "Shared when you enquire" },
  { label: "Format", value: "Hands-on and live", note: "Labs, live sessions, projects" },
  { label: "Mentorship", value: "Mentor-led", note: "Engineers guide your projects" },
  { label: "Tracks", value: "2 engineering tracks", note: "AI / ML and Multi-Cloud" },
] as const;

/* ---------- toolkit ---------- */

/** Tools by track, as supplied by the DeboisTech team. Edit freely; names only, no logos. */
export const TOOLKIT: Record<Track["slug"], string[]> = {
  "ai-ml": ["Python", "PyTorch", "Transformers", "Hugging Face", "Large language models", "Vector databases", "RAG", "Agentic AI"],
  "multi-cloud": ["Linux", "Docker", "Kubernetes", "AWS", "Azure", "Terraform", "CI/CD", "Monitoring", "Infrastructure as code"],
};

/* ---------- what you walk away with ---------- */

/** `perCohort` items are included depending on the cohort, matching the FAQ. */
export const OUTCOMES: { title: string; body: string; perCohort?: boolean }[] = [
  { title: "An industry-oriented capstone", body: "A real project to design, build and explain, not a worksheet." },
  { title: "A GitHub project portfolio", body: "Your work in public repositories you can link from a CV." },
  { title: "Technical documentation", body: "Write up what you built the way an engineering team would." },
  { title: "Mentor feedback", body: "Engineers review your work and tell you what to improve." },
  { title: "Completion certificate", body: "Recognition for finishing the program.", perCohort: true },
  { title: "Module-wise digital badges", body: "Badges for completed modules, where applicable.", perCohort: true },
  { title: "Resume optimization", body: "Help presenting your projects and skills.", perCohort: true },
  { title: "Mock interview preparation", body: "Practice for technical interviews.", perCohort: true },
];

/* ---------- mentors ---------- */

/** Mentors and learner journeys are managed in the dashboard (Mentors and Journeys tabs). */
export const MENTORS_LINE = "Learn from engineers who build, experiment and solve real-world technical problems.";
