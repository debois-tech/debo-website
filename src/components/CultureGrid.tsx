"use client";
import Image from "next/image";
import { useId, useState } from "react";
import type { CulturePhoto } from "@/content/culture";

/** Photos shown before "Show all". 1 large tile + 8 small ones fills the 4-column desktop grid and the 2-column phone grid with no gaps. */
const INITIAL = 9;

function Tile({ p, large, i }: { p: CulturePhoto; large: boolean; i: number }) {
  return (
    <li className={`reveal group relative overflow-hidden rounded-[var(--radius)] border border-line ${large ? "col-span-2 row-span-2" : ""}`} style={{ ["--d" as string]: `${Math.min(i, 6) * 0.06}s` }}>
      <figure className="size-full">
        <Image src={p.src} alt={p.alt} fill sizes={large ? "(min-width:768px) 50vw, 100vw" : "(min-width:768px) 25vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: p.position }} />
        {p.placeholder && <span className="absolute left-3 top-3 rounded-full border border-line-strong bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">Placeholder</span>}
        {p.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-sm text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100">{p.caption}</figcaption>}
      </figure>
    </li>
  );
}

/**
 * Gallery that stays tidy at any size: the first photo is large, the next few fill the grid, and anything beyond that sits behind
 * "Show all". Extra photos are not even mounted (so not downloaded) until asked for. They appear as an even grid of equal tiles.
 */
export function CultureGrid({ photos }: { photos: readonly CulturePhoto[] }) {
  const [all, setAll] = useState(false);
  const moreId = useId();
  const head = photos.slice(0, INITIAL), rest = photos.slice(INITIAL);
  const grid = "grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4";
  return (
    <>
      <ul className={grid}>{head.map((p, i) => <Tile key={p.src} p={p} large={i === 0} i={i} />)}</ul>
      {rest.length > 0 && (
        <>
          {all && <ul id={moreId} className={`${grid} mt-3 sm:mt-4`}>{rest.map((p, i) => <Tile key={p.src} p={p} large={false} i={i} />)}</ul>}
          <div className="mt-6 flex justify-center">
            <button type="button" aria-expanded={all} aria-controls={all ? moreId : undefined} onClick={() => setAll((v) => !v)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-6 py-2 text-[15px] font-semibold transition-colors hover:border-brand-text hover:text-brand-text">
              {all ? "Show fewer photos" : `Show all ${photos.length} photos`}
            </button>
          </div>
        </>
      )}
    </>
  );
}
