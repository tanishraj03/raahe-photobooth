"use client";

import Cabinet from "@/components/Cabinet";
import Marquee from "@/components/Marquee";
import MicMark from "@/components/MicMark";
import RiseText from "@/components/RiseText";
import { EVENT } from "@/lib/config/event";

/**
 * The first screen anyone sees after scanning the QR code at the
 * venue. One job: get them to tap "take photos".
 *
 * The copy sits on the booth's screen; the button sits on its deck,
 * where the controls belong.
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <Cabinet
      deck={
        <button
          type="button"
          onClick={onStart}
          className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-pink px-6 text-ink transition-transform duration-150 active:scale-[0.985]"
          style={{ minHeight: 64 }}
        >
          <span className="sheen" aria-hidden="true" />
          <span className="t-display relative text-[1.75rem]">take photos</span>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="relative transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1.5 group-active:translate-x-1.5"
          >
            <path
              d="M4 12h15m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      }
    >
      <div className="relative flex h-full flex-col overflow-hidden">
        {/* The mic from the poster, breathing behind the type. */}
        <div
          aria-hidden="true"
          className="animate-fade pointer-events-none absolute inset-y-0 right-[-2.5rem] z-0 flex items-center"
        >
          <MicMark className="animate-float h-[86%] w-auto text-pink/20" />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 py-6">
          <p className="t-label animate-rise delay-2 flex items-center gap-2.5 text-pink">
            <span
              aria-hidden="true"
              className="animate-blink block size-[7px] rounded-full bg-pink"
            />
            {EVENT.eyebrow}
          </p>

          {/* flex, so the masked lines keep .t-display's tight leading */}
          <h1 className="t-display animate-fade delay-2 mt-4 flex flex-col text-[clamp(3.25rem,24cqw,7rem)] text-paper">
            <RiseText text="photo" delay={0.22} />
            <RiseText text="booth" delay={0.36} />
          </h1>

          {/* Three cells filling in turn — the rhythm of the shoot. */}
          <div
            className="animate-rise delay-4 mt-6 flex items-center"
            aria-hidden="true"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="mr-2 block size-4 rounded-[3px] border border-pink/60"
                style={{
                  animation: "cell-pulse 3s var(--ease-out-soft) infinite",
                  animationDelay: `${i * 0.35}s`,
                }}
              />
            ))}
            <span className="ml-1 h-px flex-1 bg-hairline" />
          </div>

          <p className="t-body animate-rise delay-5 mt-5 max-w-[19ch] text-[1.05rem] text-paper/60">
            {EVENT.tagline}
          </p>
        </div>

        {/* Ticker along the bottom of the screen, like a game attract mode. */}
        <Marquee
          items={[EVENT.name, EVENT.date, EVENT.venue]}
          className="animate-fade delay-5 relative z-10 shrink-0 border-t border-paper/10 py-2.5"
        />
      </div>
    </Cabinet>
  );
}
