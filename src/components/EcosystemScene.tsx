"use client";
import Image from "next/image";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { InView } from "./InView";
import { ButtonLink } from "./ui";

const NODES = [
  { id: "products", label: "Products", blurb: "Debo Labs, a DevOps practice platform, MotoAdmin, which runs the paperwork of a driving school, and TenantPlane, an open-source Kubernetes multi-tenancy platform.", href: "/products", cta: "See the products", y: 40 },
  { id: "services", label: "Engineering Services", blurb: "Software, AI/ML, cloud and DevOps, UI/UX, data, security and digital transformation, delivered with client teams.", href: "/services", cta: "See the services", y: 150 },
  { id: "program", label: "Program", blurb: "Our programs, starting with the Technology Excellence Program: mentor-led, project-based tracks in AI/ML and Multi-Cloud Engineering.", href: "/program", cta: "See the programs", y: 260 },
] as const;
type Id = (typeof NODES)[number]["id"];

export function EcosystemScene() {
  const [active, setActive] = useState<Id | null>(null); // everything starts collapsed
  const choose = (id: Id) => { setActive((cur) => (cur === id ? null : id)); track("ecosystem_select", { node_id: id }); };

  return (
    <InView className="grid grid-cols-1 items-center gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:gap-20">
      {/* connections draw in as the scene arrives */}
      <div aria-hidden className="relative mx-auto hidden w-full max-w-md md:block">
        <svg viewBox="0 0 400 300" className="w-full">
          {NODES.map((n, i) => (
            <path key={n.id} d={`M110 150 H190 L230 ${n.y} H340`} pathLength={1} fill="none"
              stroke={active === n.id ? "var(--brand)" : "var(--line)"} strokeWidth={active === n.id ? 3 : 2}
              className="draw" style={{ ["--d" as string]: `${0.2 + i * 0.25}s`, transition: "stroke .3s, stroke-dashoffset 1.4s var(--ease)" }} />
          ))}
          {NODES.map((n) => (
            <rect key={n.id} x="334" y={n.y - 7} width="14" height="14" className="reveal" style={{ ["--d" as string]: "1s" }}
              fill={active === n.id ? "var(--brand)" : "var(--paper)"} stroke={active === n.id ? "var(--brand)" : "var(--ink-muted)"} strokeWidth="2" />
          ))}
        </svg>
        <div className="absolute left-0 top-1/2 w-[30%] -translate-y-1/2">
          <Image src="/brand/turtle-light.webp" alt="" width={2394} height={1426} sizes="140px" className="h-auto w-full" style={{ aspectRatio: "2394 / 1426" }} />
        </div>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {NODES.map((n, i) => {
          const on = n.id === active;
          return (
            <li key={n.id} className="reveal" style={{ ["--d" as string]: `${0.15 + i * 0.15}s` }}>
              <button type="button" aria-expanded={on} onClick={() => choose(n.id)}
                className="flex min-h-20 w-full items-center justify-between gap-4 py-6 text-left">
                <span className={`display text-3xl transition-colors sm:text-5xl ${on ? "text-ink" : "text-muted hover:text-ink"}`}>{n.label}</span>
                <span aria-hidden className={`text-3xl text-brand-text transition-transform duration-300 ${on ? "rotate-45" : ""}`}>+</span>
              </button>
              <div hidden={!on} className="pb-8">
                <p className="max-w-xl text-lg text-muted">{n.blurb}</p>
                <ButtonLink href={n.href} className="mt-5">{n.cta}</ButtonLink>
              </div>
            </li>
          );
        })}
      </ul>
    </InView>
  );
}
