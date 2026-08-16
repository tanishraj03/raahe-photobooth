"use client";

import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import Drawing from "@/components/Drawing";
import Marquee from "@/components/Marquee";
import RiseText from "@/components/RiseText";
import { CREDITS, EVENT } from "@/lib/config/event";

/**
 * The booth standing idle at the venue, waiting to be used. The
 * screen is its attract mode; the one lit key on the deck is the
 * only thing to do.
 *
 * On a phone the type stacks and the drawing sits behind it. On a
 * kiosk they separate into two columns and the drawing is a proper
 * illustration at proper size — not the phone layout blown up.
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
          className="lg:!min-h-[86px]"
          icon={
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 lg:size-9"
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
        {/* On a phone the mic sits behind the type. */}
        <div
          aria-hidden="true"
          className="animate-fade pointer-events-none absolute inset-y-0 right-[-3rem] z-0 flex items-center lg:hidden"
        >
          <Drawing
            name="micStand"
            className="animate-float h-[80%] w-auto"
            inks={{
              pink: "rgba(240,78,152,0.34)",
              paper: "rgba(244,245,245,0.16)",
              grey: "rgba(244,245,245,0.10)",
            }}
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 py-4 lg:flex-row lg:items-center lg:gap-16 lg:px-16">
          <div className="lg:flex-1">
            <p className="t-label animate-rise delay-2 flex items-center gap-2.5 text-pink lg:text-[13px]">
              <span aria-hidden="true" className="lamp lamp-on animate-blink" />
              {EVENT.eyebrow}
            </p>

            {/* flex, so the masked lines keep .t-display's tight leading */}
            <h1 className="t-display animate-fade delay-2 mt-4 flex flex-col text-[clamp(3rem,23cqw,6.5rem)] text-paper lg:mt-6 lg:text-[clamp(5rem,11vw,10rem)]">
              <RiseText text="photo" delay={0.22} />
              <RiseText text="booth" delay={0.36} />
            </h1>

            <p className="t-body animate-rise delay-4 mt-5 max-w-[19ch] text-[1.05rem] text-paper/60 lg:mt-8 lg:max-w-[24ch] lg:text-[1.5rem]">
              {EVENT.tagline}
            </p>

            {/* The spec plate, silkscreened onto the display. */}
            <div
              className="animate-rise delay-5 mt-5 flex items-start justify-between gap-3 border-t border-paper/10 pt-3 lg:mt-10 lg:max-w-[34rem] lg:gap-8 lg:pt-5"
              aria-hidden="true"
            >
              {CREDITS.map((credit) => (
                <div key={credit.label} className="min-w-0">
                  <p className="t-label text-[8px] text-paper/30 lg:text-[10px]">
                    {credit.label}
                  </p>
                  <p className="t-label truncate text-[8px] text-paper/60 lg:text-[10px]">
                    {credit.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* On a kiosk it's a drawing in its own right, at size. */}
          <div
            aria-hidden="true"
            className="hidden lg:flex lg:h-full lg:max-h-[38rem] lg:flex-1 lg:items-center lg:justify-center"
          >
            <Drawing
              name="micStand"
              glow={26}
              className="animate-float h-full w-auto"
              inks={{
                pink: "rgba(240,78,152,0.85)",
                paper: "rgba(244,245,245,0.5)",
                grey: "rgba(244,245,245,0.28)",
              }}
            />
          </div>
        </div>

        <Marquee
          items={[EVENT.name, EVENT.date, EVENT.venue]}
          className="animate-fade delay-5 relative z-10 shrink-0 border-t border-paper/10 py-2.5 lg:py-4"
        />
      </div>
    </Cabinet>
  );
}
