"use client";

import type { CSSProperties } from "react";

const RADIUS = 46;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * The countdown: a pink ring that drains once over the whole five
 * seconds, with the number landing inside it on every tick.
 *
 * `shot` restarts the ring for each photo — changing the key is what
 * makes the animation play again.
 */
export default function CountdownRing({
  n,
  seconds,
  shot,
}: {
  /** Seconds left, shown in the middle. */
  n: number;
  /** How long the whole countdown runs. */
  seconds: number;
  /** Which photo this is. */
  shot: number;
}) {
  const ringStyle = {
    "--ring-length": LENGTH,
    strokeDasharray: LENGTH,
    animation: `ring-drain ${seconds}s linear forwards`,
  } as CSSProperties;

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div
        className="relative grid aspect-square place-items-center"
        style={{ width: "58%" }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="rgba(244,245,245,0.15)"
            strokeWidth="2"
          />
          <circle
            key={shot}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--color-pink)"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={ringStyle}
          />
        </svg>

        <span
          key={n}
          className="t-display animate-count block text-[clamp(3.5rem,24cqw,6.5rem)] text-paper tabular-nums"
          style={{ textShadow: "0 6px 40px rgba(0,0,0,.5)" }}
        >
          {n}
        </span>
      </div>
    </div>
  );
}
