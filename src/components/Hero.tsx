import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "./ui";
import { ScrollVar } from "./ScrollVar";
import { CursorBlock } from "./CursorBlock";
import { BlockSkyline } from "./BlockSkyline";

/** Splits text into words of per-letter spans so each letter can animate; `start` offsets the stagger index. */
function Letters({ text, start = 0, className = "" }: { text: string; start?: number; className?: string }) {
  let i = start;
  return (
    <>
      {text.split(" ").map((word, w, all) => (
        <span key={w}>
          <span className={`inline-block whitespace-nowrap ${className}`}>
            {[...word].map((ch, k) => <span key={k} className="ltr" style={{ ["--i" as string]: i++ }}>{ch}</span>)}
          </span>
          {w < all.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  return (
    <ScrollVar className="hero relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden bg-paper">
      <div aria-hidden className="hero-horizon" />
      <div aria-hidden className="pixel-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_50%_25%,black,transparent_70%)]" />
      <CursorBlock />

      <div className="container-x relative z-10 flex flex-col items-center pt-12 text-center sm:pt-16 lg:pt-24">
        <Link href="/labs" className="hero-in group inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong/70 bg-[#111] py-1.5 pl-3 pr-4 text-[13px] text-muted transition-colors hover:border-glow hover:text-ink" style={{ ["--d" as string]: "0s" }}>
          <Image src="/brand/debolabs-icon.webp" alt="" width={16} height={17} className="h-4 w-auto" aria-hidden />
          <span><span className="font-semibold text-ink">Debo Labs</span> · practice DevOps in a real terminal</span>
        </Link>

        <h1 aria-label="Building Technology. Creating Value." className="display mt-5 text-[clamp(2.4rem,6.4vw,5.25rem)] [perspective:600px]">
          <span aria-hidden className="block">
            <Letters text="Building Technology." />{" "}
          </span>
          <span aria-hidden className="block">
            <Letters text="Creating" start={20} />{" "}<Letters text="Value." start={28} className="text-brand" />
          </span>
        </h1>
        <p className="hero-in mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg" style={{ ["--d" as string]: ".16s" }}>
          DeboisTech engineers software, AI and cloud systems for clients, builds its own products, and trains the engineers who come next.
        </p>
        <div className="hero-in mt-5 flex w-full flex-col items-center justify-center gap-3 sm:mt-6 sm:w-auto sm:flex-row" style={{ ["--d" as string]: ".24s" }}>
          <ButtonLink href="/products" event="hero_cta_click" eventProps={{ cta_id: "explore_work" }}>Explore Our Work</ButtonLink>
          <ButtonLink href="/contact" variant="secondary" event="hero_cta_click" eventProps={{ cta_id: "build_together" }}>Let’s Build Together</ButtonLink>
        </div>
      </div>

      {/* a skyline of blocks being built, rising from the bottom edge */}
      <div className="hero-rise relative mx-auto mt-auto h-[240px] w-full max-w-[1400px] sm:h-[290px] lg:h-[clamp(260px,36vh,360px)] [mask-image:linear-gradient(to_top,black_55%,transparent)]">
        <BlockSkyline />
      </div>
    </ScrollVar>
  );
}
