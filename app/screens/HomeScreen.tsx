"use client";

import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import Marquee from "@/components/Marquee";
import MicMark from "@/components/MicMark";
import RiseText from "@/components/RiseText";
import { CREDITS, EVENT } from "@/lib/config/event";

/**
 * The booth standing idle at the venue, waiting to be used. The
 * screen is its attract mode; the one lit key on the deck is the
 * only thing to do.
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <Cabinet
      status="System ready"
      deck={
        <Control
          lit
          onClick={onStart}
          note="Press to begin"
          height={64}
          icon={
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
            >
              <path
                d="M4 12h15m0 0-6-6m6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          Start
        </Control>
      }
    >
      <div className="relative flex h-full flex-col overflow-hidden">
        {/* The mic that ends up on the strip, glowing behind the type. */}
        <div
          aria-hidden="true"
          className="animate-fade pointer-events-none absolute inset-y-0 right-[-2.5rem] z-0 flex items-center"
        >
          <MicMark className="animate-float h-[84%] w-auto text-pink/22" />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 py-4">
          <p className="t-label animate-rise delay-2 flex items-center gap-2.5 text-pink">
            <span aria-hidden="true" className="lamp lamp-on animate-blink" />
            {EVENT.eyebrow}
          </p>

          {/* flex, so the masked lines keep .t-display's tight leading */}
          <h1 className="t-display animate-fade delay-2 mt-4 flex flex-col text-[clamp(3rem,23cqw,6.5rem)] text-paper">
            <RiseText text="photo" delay={0.22} />
            <RiseText text="booth" delay={0.36} />
          </h1>

          <p className="t-body animate-rise delay-4 mt-5 max-w-[19ch] text-[1.05rem] text-paper/60">
            {EVENT.tagline}
          </p>

          {/* The spec plate, silkscreened onto the display. */}
          <div
            className="animate-rise delay-5 mt-5 flex items-start justify-between gap-3 border-t border-paper/10 pt-3"
            aria-hidden="true"
          >
            {CREDITS.map((credit) => (
              <div key={credit.label} className="min-w-0">
                <p className="t-label text-[8px] text-paper/30">
                  {credit.label}
                </p>
                <p className="t-label truncate text-[8px] text-paper/60">
                  {credit.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Marquee
          items={[EVENT.name, EVENT.date, EVENT.venue]}
          className="animate-fade delay-5 relative z-10 shrink-0 border-t border-paper/10 py-2.5"
        />
      </div>
    </Cabinet>
  );
}
