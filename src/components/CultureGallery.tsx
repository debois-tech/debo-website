import { CULTURE_PHOTOS } from "@/content/culture";
import { CultureGrid } from "./CultureGrid";
import { InView } from "./InView";

/** Work-culture photos as a quiet editorial grid. Renders nothing until real photos exist in content/culture.ts. */
export function CultureGallery({ title = "Where we build and learn.", headingLevel = 3 }: { title?: string; headingLevel?: 2 | 3 }) {
  if (CULTURE_PHOTOS.length === 0) return null;
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <section aria-labelledby="culture-h" className="mt-16 sm:mt-24">
      <H id="culture-h" className="display mb-8 text-3xl sm:text-4xl">{title}</H>
      <InView>
        <CultureGrid photos={CULTURE_PHOTOS} />
      </InView>
    </section>
  );
}
