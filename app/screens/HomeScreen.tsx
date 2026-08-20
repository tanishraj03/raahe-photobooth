"use client";

import BrandMark from "@/components/BrandMark";
import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import Marquee from "@/components/Marquee";
import RiseText from "@/components/RiseText";
import { CREDITS, EVENT } from "@/lib/config/event";

/**
 * The booth standing idle at the venue, waiting to be used. The
 * screen is its attract mode; the one lit key on the deck is the
 * only thing to do.
 *
 * One composition at every size: the type stacked, the drawing
 * behind it. The machine keeps its proportions as it grows, so the
 * stage inside it does too — it gets bigger, never wider.
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <Cabinet
      mark={false}
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
        {/*
          The mic, behind the type. A chrome one, faded back so it
          reads as an object sitting in the dark rather than a picture
          pasted on: it is the only thing on this screen that isn't
          drawn, so it has to stay quiet. The opacity is the dial —
          push it past ~0.5 and it starts competing with the display
          type instead of sitting behind it.
        */}
        <div
          aria-hidden="true"
          className="animate-fade pointer-events-none absolute inset-y-0 right-[-4.5rem] z-0 flex items-center lg:right-[-3rem]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mic-hero.webp"
            alt=""
            className="animate-float h-[86%] w-auto opacity-[0.38] [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_72%,transparent)] lg:h-[80%] lg:opacity-[0.32]"
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 py-4 lg:px-10 lg:py-8">
          <div>
            {/* The mark leads. It used to appear only as a 15px line on
                the name plate, which is signage, not branding — on the
                attract screen it should be the first thing you see.
                Two sizes because BrandMark sets its height inline, so a
                `lg:` class can't override it. */}
            <BrandMark height={54} className="animate-rise delay-1 mb-6 lg:hidden" />
            <BrandMark
              height={88}
              className="animate-rise delay-1 mb-9 hidden lg:block"
            />

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

        </div>

        <Marquee
          items={[EVENT.name, EVENT.date, EVENT.venue]}
          className="animate-fade delay-5 relative z-10 shrink-0 border-t border-paper/10 py-2.5 lg:py-4"
        />
      </div>
    </Cabinet>
  );
}