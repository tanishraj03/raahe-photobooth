"use client";

/**
 * One digit of a seven-segment display.
 *
 * The segments that aren't lit are still drawn, very faintly — on a
 * real LED display you can always see the dark ones, and leaving
 * them out is the giveaway that it's a font pretending.
 */

const SEGMENTS: Record<string, string> = {
  a: "10,3 50,3 54,7 50,11 10,11 6,7",
  b: "55,9 59,13 59,43 55,47 51,43 51,13",
  c: "55,51 59,55 59,85 55,89 51,85 51,55",
  d: "10,87 50,87 54,91 50,95 10,95 6,91",
  e: "5,51 9,55 9,85 5,89 1,85 1,55",
  f: "5,9 9,13 9,43 5,47 1,43 1,13",
  g: "10,45 50,45 54,49 50,53 10,53 6,49",
};

const ORDER = ["a", "b", "c", "d", "e", "f", "g"];

const DIGITS: Record<string, string[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

export default function SegmentDigit({
  value,
  className = "",
  glow = true,
}: {
  /** A single character, 0–9. Anything else lights nothing. */
  value: string;
  className?: string;
  glow?: boolean;
}) {
  const lit = new Set(DIGITS[value] ?? []);

  return (
    <svg
      viewBox="0 0 60 98"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={
        glow
          ? { filter: "drop-shadow(0 0 10px rgba(240,78,152,0.55))" }
          : undefined
      }
    >
      {ORDER.map((name) => {
        const on = lit.has(name);
        return (
          <polygon
            key={name}
            points={SEGMENTS[name]}
            fill={on ? "var(--color-pink)" : "rgba(244,245,245,0.055)"}
            className={on ? "animate-seg" : undefined}
            style={{ transformOrigin: "30px 49px" }}
          />
        );
      })}
    </svg>
  );
}
