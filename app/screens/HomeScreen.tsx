"use client";

import BrandMark from "@/components/BrandMark";
import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import RiseText from "@/components/RiseText";
import { EVENT } from "@/lib/config/event";

/**
 * The booth waiting to be used. Mark, name, one line, one key —
 * and air. Everything that used to be here to fill space (the
 * ticker, the spec plate, the pulsing cells, the drawing behind the
 * type) has gone.
 */
export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <Cabinet
      bottom={
        <div className="mx-auto w-full max-w-[30rem] px-6 pb-6 lg:max-w-[34rem] lg:pb-10">
          <Control lit onClick={onStart} height={66} className="lg:!min-h-[80px]">
            Start
          </Control>

          <p className="t-label mt-5 text-center text-[9px] text-paper/30 lg:text-[10px]">
            {EVENT.venue} · {EVENT.date}
          </p>
        </div>
      }
    >
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        {/* The mark leads. It's the first thing read, from across a
            room, before anything else resolves. */}
        <BrandMark
          height={64}
          className="animate-rise h-[clamp(52px,15cqw,84px)] w-auto lg:h-[clamp(80px,7vw,120px)]"
        />

        <h1 className="t-display animate-fade delay-2 mt-8 flex flex-col text-[clamp(3.25rem,24cqw,7rem)] text-paper lg:mt-12 lg:text-[clamp(5rem,9vw,9rem)]">
          <RiseText text="photo" delay={0.2} />
          <RiseText text="booth" delay={0.32} />
        </h1>

        <p className="t-body animate-rise delay-5 mt-7 max-w-[24ch] text-[1.05rem] text-paper/50 lg:mt-10 lg:text-[1.35rem]">
          {EVENT.tagline}
        </p>
      </div>
    </Cabinet>
  );
}
