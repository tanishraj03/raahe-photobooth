"use client";

import { useId } from "react";
import { MIC_BOX, MIC_PATHS, MIC_SLOTS, MIC_YOKE_WIDTH } from "@/lib/mic";

/**
 * The mic from lib/mic.ts, on screen: the same paths, filled with a
 * halftone dot pattern and faded out towards the foot.
 *
 * It takes its colour from `currentColor` and is decorative only, so
 * put it behind content and leave it out of the reading order.
 */
export default function MicMark({
  className = "",
  dot = 2.4,
  spacing = 9,
}: {
  className?: string;
  /** Halftone dot radius, in the 240 × 480 drawing box. */
  dot?: number;
  /** Distance between dot centres. */
  spacing?: number;
}) {
  // Two mics on one page would otherwise share — and fight over —
  // the same pattern and mask ids.
  const id = useId();
  const dots = `${id}-dots`;
  const fade = `${id}-fade`;
  const mask = `${id}-mask`;

  return (
    <svg
      viewBox={`0 0 ${MIC_BOX.width} ${MIC_BOX.height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={dots}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r={dot} fill="currentColor" />
          <circle cx={0} cy={0} r={dot} fill="currentColor" />
          <circle cx={spacing} cy={spacing} r={dot} fill="currentColor" />
        </pattern>

        <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
        </linearGradient>

        {/* White shows, black hides: the gradient fades the mic out
            towards its foot, and the slots punch the grille. */}
        <mask id={mask}>
          <rect
            width={MIC_BOX.width}
            height={MIC_BOX.height}
            fill={`url(#${fade})`}
          />
          {MIC_SLOTS.rows.map((y) => (
            <rect
              key={y}
              x={MIC_SLOTS.x}
              y={y}
              width={MIC_SLOTS.width}
              height={MIC_SLOTS.height}
              rx={MIC_SLOTS.radius}
              fill="#000"
            />
          ))}
        </mask>
      </defs>

      <g mask={`url(#${mask})`}>
        <path d={MIC_PATHS.head} fill={`url(#${dots})`} />
        <path d={MIC_PATHS.neck} fill={`url(#${dots})`} />
        <path d={MIC_PATHS.base} fill={`url(#${dots})`} />
        <path
          d={MIC_PATHS.yoke}
          fill="none"
          stroke={`url(#${dots})`}
          strokeWidth={MIC_YOKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
