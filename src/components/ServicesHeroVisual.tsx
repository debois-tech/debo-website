/**
 * Original hero graphic: pixel columns that step up from left to right, echoing the brand's dissolving-shell blocks.
 * The three bands are Build, Scale and Accelerate; the loudest blocks sit at the top of the last band. Purely decorative.
 */
const SIZE = 18, GAP = 5, COLS = 15;
const HEIGHTS = [1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7, 8];
const STEP = SIZE + GAP;
const H = 8 * STEP;

export function ServicesHeroVisual({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox={`0 0 ${COLS * STEP} ${H}`} className={className} shapeRendering="crispEdges">
      {HEIGHTS.flatMap((h, c) => Array.from({ length: h }, (_, r) => {
        const band = c < 5 ? 0 : c < 10 ? 1 : 2;
        const top = r === h - 1;
        const fill = top && band === 2 ? "var(--brand-glow-hi)" : band === 0 ? "var(--brand-logo)" : "var(--brand)";
        const opacity = top ? 1 : 0.18 + 0.1 * band + (r / h) * 0.25;
        return <rect key={`${c}-${r}`} x={c * STEP} y={H - (r + 1) * STEP + GAP} width={SIZE} height={SIZE} fill={fill} opacity={opacity} />;
      }))}
      <rect x="0" y={H} width={COLS * STEP - GAP} height="2" fill="var(--line-strong)" />
    </svg>
  );
}
