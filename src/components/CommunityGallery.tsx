import Image from "next/image";
import { COMMUNITY_GALLERY, SHOW_PLACEHOLDERS } from "@/content/community";
import { InView } from "./InView";

/**
 * Desktop column spans (of 6) for a block of photos. A full block of 5 is one large tile beside two small ones, then two halves;
 * a short last block is stretched so the grid never ends with a hole, whatever the number of photos.
 */
const BLOCK = 5;
const FULL = ["md:col-span-4 md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3"];
const SHORT: Record<number, string[]> = {
  1: ["md:col-span-6"], 2: ["md:col-span-3", "md:col-span-3"], 3: ["md:col-span-2", "md:col-span-2", "md:col-span-2"], 4: ["md:col-span-3", "md:col-span-3", "md:col-span-3", "md:col-span-3"],
};
const spanFor = (i: number, total: number) => {
  const block = Math.floor(i / BLOCK), inBlock = total - block * BLOCK;
  return (inBlock >= BLOCK ? FULL : SHORT[inBlock])[i % BLOCK];
};

/**
 * Editorial gallery of real community photographs. Entries without a `src` are placeholders: visible only while developing,
 * hidden on the live site. With no real photos live, the whole section is omitted.
 */
export function CommunityGallery() {
  const items = COMMUNITY_GALLERY.filter((g) => g.src || SHOW_PLACEHOLDERS);
  if (items.length === 0) return null;
  return (
    <div className="mt-16 sm:mt-24" id="gallery">
      <h3 className="display text-3xl sm:text-4xl">People. Ideas. Experiences.</h3>
      <p className="mt-2 max-w-xl text-muted">A glimpse into the communities, conversations and experiences we’re proud to be part of.</p>
      <InView>
        <ul className="mt-8 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 md:grid-cols-6">
          {items.map((g, i) => (
            <li key={`${g.label}-${i}`} className={`reveal group relative overflow-hidden rounded-[var(--radius)] border border-line bg-wash ${i === 0 && items.length > 1 ? "col-span-2 row-span-2" : i === items.length - 1 && i % 2 === 1 ? "col-span-2" : ""} ${spanFor(i, items.length)}`} style={{ ["--d" as string]: `${Math.min(i, 5) * 0.06}s` }}>
              <figure className="size-full">
                {g.src ? (
                  <Image src={g.src} alt={g.alt} fill sizes={i % BLOCK === 0 ? "(min-width:768px) 66vw, 100vw" : "(min-width:768px) 33vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: g.position }} />
                ) : (
                  <div className="grid size-full place-items-center border border-dashed border-line-strong p-4 text-center text-sm text-muted">
                    <span><span className="block font-semibold text-ink">Photo needed</span>{g.label}<span className="mt-2 block text-xs">Add the file to public/community/ and set its src in content/community.ts</span></span>
                  </div>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-sm text-white">
                  <span className="font-semibold">{g.label}</span>{g.caption && <span className="block text-white/80">{g.caption}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </InView>
    </div>
  );
}
