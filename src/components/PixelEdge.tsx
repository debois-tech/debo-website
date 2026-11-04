import { InView } from "./InView";

/**
 * Section break drawn as stepped pixels, echoing the turtle's dissolving shell.
 * Squares of `to` climb into `from`. All squares are ONE path, so the break costs a single element to hydrate
 * and animates (rises into place) as one unit when it scrolls into view.
 */
const COLS = 60, SIZE = 20;
const heights = Array.from({ length: COLS }, (_, i) => {
  const v = Math.sin(i * 1.7) + Math.sin(i * 0.55 + 1) + Math.cos(i * 0.23);
  return Math.max(0, Math.min(2, Math.round((v + 1.2) * 0.8)));
});
const H = SIZE * 3;
const PATH = heights
  .flatMap((h, i) => Array.from({ length: h }, (_, k) => `M${i * SIZE} ${H - (k + 1) * SIZE}h${SIZE}v${SIZE}h-${SIZE}z`))
  .join("");

export function PixelEdge({ from, to, className = "" }: { from: string; to: string; className?: string }) {
  return (
    <InView threshold={0.7} className={`relative z-[2] ${className}`}>
      <svg aria-hidden focusable="false" data-edge viewBox={`0 0 ${COLS * SIZE} ${H}`} preserveAspectRatio="xMidYMax slice"
           className="block h-8 w-full overflow-visible sm:h-12" style={{ background: from, marginTop: -2, marginBottom: -2 }}>
        {/* The base strip runs 16 units past the bottom of the graphic (overflow-visible) into the next section, which is the same colour.
            On displays scaled to 125%/150%/175% the last pixel row of the graphic is only partly covered; without this, the page behind it
            shows through as a thin light line under the steps. */}
        <rect x="0" y={H - 4} width={COLS * SIZE} height="20" shapeRendering="crispEdges" style={{ fill: to }} />
        <path className="px" d={PATH} shapeRendering="crispEdges" style={{ fill: to }} />
      </svg>
    </InView>
  );
}
