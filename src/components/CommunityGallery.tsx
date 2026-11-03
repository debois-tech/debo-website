import Image from "next/image";
import { COMMUNITY_GALLERY, SHOW_PLACEHOLDERS, type GalleryItem } from "@/content/community";
import { getCommunityPhotos, imageUrl } from "@/lib/content";
import { InView } from "./InView";

/** Photos added in the dashboard (Community tab) take over; until there are any, the built-in list in content/community.ts is used. Empty means: leave the whole section out. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const added: GalleryItem[] = (await getCommunityPhotos()).map((p) => ({ label: p.label, alt: p.alt, caption: p.caption, position: p.position, src: imageUrl(p.imageId) }));
  return added.length ? added : COMMUNITY_GALLERY.filter((g) => g.src || SHOW_PLACEHOLDERS);
}

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
/** Row height by photo count: with only a few photos each tile is large, so a single photo is never squeezed into a thin strip. */
const ROWS: Record<number, string> = {
  1: "auto-rows-[13rem] sm:auto-rows-[18rem] md:auto-rows-[clamp(16rem,28vw,30rem)]",
  2: "auto-rows-[11rem] sm:auto-rows-[15rem] md:auto-rows-[clamp(15rem,23vw,26rem)]",
  3: "auto-rows-[10rem] sm:auto-rows-[13rem] md:auto-rows-[clamp(13rem,17vw,20rem)]",
  4: "auto-rows-[10rem] sm:auto-rows-[13rem] md:auto-rows-[clamp(13rem,17vw,20rem)]",
};
const ROWS_MANY = "auto-rows-[150px] sm:auto-rows-[190px]";

/** Editorial gallery of real community photographs. Entries without a `src` are placeholders, shown while developing only. */
export function CommunityGallery({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <InView>
      <ul className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 ${ROWS[items.length] ?? ROWS_MANY}`}>
        {items.map((g, i) => (
          <li key={`${g.label}-${i}`} className={`reveal group relative overflow-hidden rounded-[var(--radius)] border border-line bg-wash ${items.length === 1 ? "max-md:col-span-2" : i === 0 ? "max-md:col-span-2 max-md:row-span-2" : i === items.length - 1 && i % 2 === 1 ? "max-md:col-span-2" : ""} ${spanFor(i, items.length)}`} style={{ ["--d" as string]: `${Math.min(i, 5) * 0.06}s` }}>
            <figure className="size-full">
              {g.src ? (
                <Image src={g.src} alt={g.alt} fill sizes={items.length < 3 || i % BLOCK === 0 ? "(min-width:768px) 66vw, 100vw" : "(min-width:768px) 33vw, 50vw"} unoptimized={g.src.startsWith("/api/")} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: g.position }} />
              ) : (
                <div className="grid size-full place-items-center border border-dashed border-line-strong p-4 text-center text-sm text-muted">
                  <span><span className="block font-semibold text-ink">Photo needed</span>{g.label}<span className="mt-2 block text-xs">Add it in the dashboard, Community tab</span></span>
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
  );
}
