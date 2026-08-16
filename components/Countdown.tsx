"use client";

import SegmentDigit from "@/components/SegmentDigit";

/**
 * The countdown, as the machine's own display: a seven-segment
 * numeral over a gauge that drains across the whole five seconds.
 *
 * `shot` restarts the gauge for each photo — changing the key is
 * what makes the animation play again.
 */
export default function Countdown({
  n,
  seconds,
  shot,
}: {
  /** Seconds left. */
  n: number;
  /** How long the whole countdown runs. */
  seconds: number;
  /** Which photo this is. */
  shot: number;
}) {
  // Ten needs two digits, and the pair has to stay the same size as
  // the single so the display doesn't jump on the last second.
  const digits = String(n).split("");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
      <div className="flex w-[52%] max-w-[240px] flex-col items-center">
        <span className="flex items-end justify-center gap-2">
          {digits.map((digit, index) => (
            <SegmentDigit
              key={`${n}-${index}`}
              value={digit}
              className="h-auto w-[46px] shrink-0 sm:w-[58px] lg:w-[76px]"
            />
          ))}
        </span>

        {/* The gauge. */}
        <span
          className="mt-5 block h-[3px] w-full overflow-hidden rounded-full bg-paper/12"
          aria-hidden="true"
        >
          <span
            key={`bar-${shot}`}
            className="block h-full w-full origin-left rounded-full bg-pink"
            style={{
              animation: `drain ${seconds}s linear forwards`,
              boxShadow: "0 0 8px rgba(240,78,152,0.8)",
            }}
          />
        </span>

        <p className="t-label mt-3 text-[9px] text-paper/45">Hold still</p>
      </div>
    </div>
  );
}
