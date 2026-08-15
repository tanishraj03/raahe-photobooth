"use client";

import BrandMark from "@/components/BrandMark";
import Marquee from "@/components/Marquee";
import MicMark from "@/components/MicMark";
import RiseText from "@/components/RiseText";
import { EVENT } from "@/lib/config/event";

/**
 * The first screen anyone sees after scanning the QR code at the
 * venue. One job: get them to tap "take photos".
 *
 * Everything hangs off the same left edge — the gutter — from the
 * logo down to the line under the button.
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ---------- Header: a ticket stub top rule ---------- */}
      <header className="pt-safe shrink-0">
        <div className="gutter flex items-center justify-between gap-4 border-b border-hairline py-4">
          <BrandMark height={22} className="animate-fade" />
          <span className="t-label animate-fade text-paper/40">
            {EVENT.dateShort}
          </span>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="gutter relative flex min-h-0 flex-1 flex-col justify-center py-7">
        {/* The same mic that ends up on the poster, breathing behind
            the type. Decorative, and under everything. */}
        <div
          aria-hidden="true"
          className="animate-fade pointer-events-none absolute inset-y-0 right-[-3rem] z-0 flex items-center"
        >
          <MicMark className="animate-float h-[92%] w-auto text-pink/20" />
        </div>

        <p className="t-label animate-rise relative z-10 flex items-center gap-2.5 text-pink">
          <span
            aria-hidden="true"
            className="animate-blink block size-[7px] rounded-full bg-pink"
          />
          {EVENT.eyebrow}
        </p>

        {/* flex, so the masked lines keep .t-display's tight leading */}
        <h1 className="t-display relative z-10 mt-5 flex flex-col text-[clamp(3.5rem,25cqw,8rem)] text-paper">
          <RiseText text="photo" delay={0.08} />
          <RiseText text="booth" delay={0.22} />
        </h1>

        {/* Three cells filling in turn, on a rail that runs off the
            edge — the rhythm of the shoot. */}
        <div
          className="animate-rise delay-3 relative z-10 mt-7 flex items-center"
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

        <p className="t-body animate-rise delay-4 relative z-10 mt-6 max-w-[20ch] text-[1.1rem] text-paper/60 sm:text-[1.25rem]">
          {EVENT.tagline}
        </p>
      </main>

      {/* ---------- Ticker ---------- */}
      <Marquee
        items={[EVENT.name, EVENT.date, EVENT.venue]}
        className="animate-fade delay-5 shrink-0 border-y border-hairline py-3.5"
      />

      {/* ---------- Action ---------- */}
      <footer className="pb-safe gutter shrink-0 pt-5 pb-4">
        <button
          type="button"
          onClick={onStart}
          className="group animate-rise delay-5 relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-pink px-7 text-ink transition-transform duration-150 active:scale-[0.985]"
          style={{ minHeight: 68 }}
        >
          <span className="sheen" aria-hidden="true" />
          <span className="t-display relative text-[1.9rem]">take photos</span>
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

        <p className="t-label animate-rise delay-6 mt-4 text-paper/35">
          3 photos · 5 second countdown
        </p>
      </footer>
    </div>
  );
}
