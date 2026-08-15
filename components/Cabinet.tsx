"use client";

import type { ReactNode } from "react";
import BrandMark from "@/components/BrandMark";
import { CREDITS, EVENT } from "@/lib/config/event";

/**
 * The booth itself. Every stage renders inside one of these, so what
 * changes between home, camera and result is the screen — not the
 * machine around it.
 *
 *   hood    speaker grille, the mark, the date
 *   screen  an inset well with a pink tube glow (the stage content)
 *   deck    the controls, a row of buttons, and the spec plate
 */
export default function Cabinet({
  children,
  deck,
  credits = true,
  lean = false,
}: {
  /** What's on the screen. */
  children: ReactNode;
  /** The controls under it. */
  deck?: ReactNode;
  /** Show the spec plate. Off where the screen needs the height. */
  credits?: boolean;
  /**
   * Drop the grille and the button row too. The result screen shows
   * a 9:16 picture, and every row of trim is height it can't have.
   */
  lean?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* ---------- Hood ---------- */}
      <div className="pt-safe shrink-0">
        <div className="gutter flex items-center justify-between gap-4 pt-3 pb-2.5">
          <BrandMark height={19} className="animate-fade" />
          <span className="t-label animate-fade text-paper/40">
            {EVENT.dateShort}
          </span>
        </div>
        {!lean && (
          <div className="gutter pb-3">
            <div className="grille animate-fade delay-1" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* ---------- Screen ---------- */}
      <div className="gutter min-h-0 flex-1">
        <div className="screen animate-fade delay-2 h-full">{children}</div>
      </div>

      {/* ---------- Deck ---------- */}
      <div className="pb-safe shrink-0">
        {deck && <div className="gutter pt-3.5">{deck}</div>}

        {!lean && (
          <div
            className="gutter animate-fade delay-4 flex items-center gap-2 pt-3.5"
            aria-hidden="true"
          >
            <span className="deck-button bg-pink" />
            <span className="deck-button bg-violet" />
            <span className="deck-button bg-mindaro" />
            <span className="deck-button bg-orange" />
            <span className="ml-1 h-px flex-1 bg-hairline" />
          </div>
        )}

        {credits && (
          <div
            className="gutter animate-fade delay-5 flex items-start justify-between gap-3 pt-3 pb-3"
            aria-hidden="true"
          >
            {CREDITS.map((credit) => (
              <div key={credit.label} className="min-w-0">
                <p className="t-label text-[8.5px] text-paper/30">
                  {credit.label}
                </p>
                <p className="t-label truncate text-[8.5px] text-paper/60">
                  {credit.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {!credits && <div className={lean ? "h-3.5" : "h-3"} />}
      </div>
    </div>
  );
}
