"use client";

import { DRAWINGS } from "@/lib/illustrations";

/**
 * One of the strip's drawings, on screen. Same path data the print
 * uses — so the mic behind the hero is the mic in the border, not a
 * UI icon standing in for it.
 */
export default function Drawing({
  name,
  className = "",
  glow = 0,
  inks = {
    pink: "currentColor",
    paper: "currentColor",
    grey: "currentColor",
  },
}: {
  name: string;
  className?: string;
  /** Blur radius of the ink bleed. 0 for none. */
  glow?: number;
  inks?: { pink: string; paper: string; grey: string };
}) {
  const drawing = DRAWINGS[name];
  if (!drawing) return null;

  const [w, h] = drawing.box;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
      focusable="false"
      style={
        glow
          ? { filter: `drop-shadow(0 0 ${glow}px rgba(240,78,152,0.45))` }
          : undefined
      }
    >
      {drawing.parts.map((part, index) => (
        <path
          key={index}
          d={part.d}
          fill={part.fill ? inks[part.ink ?? "paper"] : "none"}
          stroke={part.fill ? "none" : inks[part.ink ?? "paper"]}
          strokeWidth={part.w ?? 4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
