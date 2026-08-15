"use client";

import BrandMark from "@/components/BrandMark";
import { EVENT } from "@/lib/config/event";

/**
 * The first screen anyone sees after scanning the QR code at the
 * venue. One job: get them to tap "take photos".
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-screen-safe flex flex-col overflow-hidden">
      {/* ---------- Header: a ticket stub top rule ---------- */}
      <header className="pt-safe shrink-0">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4">
          <BrandMark height={24} className="animate-fade" />
          <span className="t-label animate-fade text-paper/40">
            {EVENT.dateShort}
          </span>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="flex min-h-0 flex-1 flex-col justify-center px-6 py-8">
        <p className="t-label animate-rise text-pink">{EVENT.eyebrow}</p>

        <h1 className="t-display animate-rise delay-1 mt-4 text-[clamp(4rem,19vw,8.5rem)] text-paper">
          photo
          <br />
          booth
        </h1>

        {/* Three cells that fill in turn — the rhythm of the shoot. */}
        <div
          className="animate-rise delay-2 mt-7 flex items-center gap-2"
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block size-3.5 rounded-[3px] border border-pink/60"
              style={{
                animation: "cell-pulse 3s var(--ease-out-soft) infinite",
                animationDelay: `${i * 0.35}s`,
              }}
            />
          ))}
        </div>

        <p className="t-body animate-rise delay-3 mt-5 max-w-[22ch] text-[1.15rem] text-paper/60 sm:text-[1.35rem]">
          {EVENT.tagline}
        </p>
      </main>

      {/* ---------- Action ---------- */}
      <footer className="pb-safe shrink-0 px-6 pb-4">
        <button
          type="button"
          onClick={onStart}
          className="animate-rise delay-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-pink px-7 text-ink transition-transform duration-150 active:scale-[0.985]"
          style={{ minHeight: 68 }}
        >
          <span className="t-display text-[1.9rem]">take photos</span>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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

        <p className="t-label animate-rise delay-5 mt-5 text-center text-paper/35">
          {EVENT.venue}
        </p>
      </footer>
    </div>
  );
}