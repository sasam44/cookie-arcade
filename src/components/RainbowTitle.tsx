"use client";

/**
 * RainbowTitle — each letter in a different bold color, with chunky comic-book outline
 * and a soft drop shadow. Pure SVG (no external font) so it renders identically
 * anywhere and matches the "TODDLER" / "Bounce"-style cartoon look.
 */

const PALETTE = [
  "#ff6b8a", // pink
  "#fb9a2c", // orange
  "#fcb752", // amber
  "#7dd3a8", // mint
  "#3eb47a", // green
  "#7dc7ff", // sky
  "#9d6cff", // purple
  "#ff85c1", // hot pink
];

interface Props {
  text: string;
  size?: number;
  rotate?: number; // baseline tilt for each letter in degrees
  className?: string;
  style?: React.CSSProperties;
}

export function RainbowTitle({ text, size = 72, rotate = -6, className = "", style }: Props) {
  const letters = text.split("");
  // SVG viewBox is sized to fit the longest line; each char gets its own group.
  const charWidth = size * 0.78; // tighter than the height for snug cartoon spacing
  const totalWidth = letters.length * charWidth + size * 0.4;
  const totalHeight = size * 1.2;
  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      className={className}
      style={{ display: "block", ...style }}
      aria-label={text}
    >
      <defs>
        {/* Soft drop shadow used by every letter */}
        <filter id="rtShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="2" dy="3" result="off" />
          <feComponentTransfer in="off">
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {letters.map((ch, i) => {
        if (ch === " ") {
          return <g key={i} transform={`translate(${i * charWidth} 0)`}><rect width={charWidth * 0.6} height={size} fill="none" /></g>;
        }
        const color = PALETTE[i % PALETTE.length];
        // Slight per-letter rotation, alternating tilt for that bouncy feel
        const tilt = rotate + ((i % 2 === 0 ? -1 : 1) * 4);
        // Slight vertical bob for bounce
        const dy = i % 3 === 1 ? -size * 0.04 : 0;
        return (
          <g
            key={i}
            transform={`translate(${i * charWidth} 0) rotate(${tilt} ${charWidth / 2} ${size * 0.55}) translate(0 ${dy})`}
            filter="url(#rtShadow)"
          >
            {/* Chunky dark outline layer (slightly larger than the letter) */}
            <text
              x={charWidth / 2}
              y={size * 0.85}
              fontSize={size}
              textAnchor="middle"
              fontFamily='"Lilita One", "Bowlby One", "Fredoka", "Arial Black", sans-serif'
              fontWeight="900"
              fill="#3a1a0d"
              stroke="#3a1a0d"
              strokeWidth={size * 0.07}
              paintOrder="stroke"
            >
              {ch}
            </text>
            {/* Colored fill on top */}
            <text
              x={charWidth / 2}
              y={size * 0.85}
              fontSize={size}
              textAnchor="middle"
              fontFamily='"Lilita One", "Bowlby One", "Fredoka", "Arial Black", sans-serif'
              fontWeight="900"
              fill={color}
            >
              {ch}
            </text>
            {/* Tiny white shine highlight on each letter */}
            <ellipse
              cx={charWidth / 2 - size * 0.18}
              cy={size * 0.42}
              rx={size * 0.07}
              ry={size * 0.04}
              fill="white"
              opacity={0.55}
            />
          </g>
        );
      })}
    </svg>
  );
}
