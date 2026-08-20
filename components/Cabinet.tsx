"use client";

import type { ReactNode } from "react";
import BrandMark from "@/components/BrandMark";
import { EVENT, MACHINE } from "@/lib/config/event";

/**
 * THE BOOTH
 * ----------------------------------------------------------------
 * A photobooth built out of panels: a hood carrying the lens and
 * the flash, a bezel with the tube sunk into it, a deck of controls
 * and a base with the print slot the strip comes out of.
 *
 * Every stage renders inside one of these, so what changes between
 * home, camera and result is what's on the screen — never the
 * machine around it.
 *
 * On a phone the casing runs to all four edges and the screen is
 * most of what you see. On anything larger the whole object pulls
 * in, gains its corner radius and sits in the room.
 */

/** A fastener. Rotated a little so no two look stamped. */
function Screw({ turn = 0, className = "" }: { turn?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`screw ${className}`}
      style={{ transform: `rotate(${turn}deg)` }}
    />
  );
}

export default function Cabinet({
  children,
  deck,
  status,
  flash = false,
  lean = false,
}: {
  /** What's on the screen. */
  children: ReactNode;
  /** The controls on the deck under it. */
  deck?: ReactNode;
  /** Two or three words on the status plate. */
  status?: string;
  /** Fires the flash bulb on the hood. */
  flash?: boolean;
  /** Trim the base to its slot. Used where the screen needs height. */
  lean?: boolean;
}) {
  return (
    <div className="machine grain">
      {/* ---------- Fasteners ---------- */}
      <Screw turn={18} className="absolute top-2.5 left-2.5 z-20" />
      <Screw turn={-32} className="absolute top-2.5 right-2.5 z-20" />
      <Screw turn={40} className="absolute bottom-2.5 left-2.5 z-20" />
      <Screw turn={-8} className="absolute right-2.5 bottom-2.5 z-20" />

      {/* ---------- Hood: lens, flash, speakers ---------- */}
      <div className="pt-safe shrink-0 px-5 lg:px-8">
        <div className="flex items-center gap-3 pt-2.5 lg:gap-6 lg:pt-4">
          <span className="grille h-5 flex-1 lg:h-8" aria-hidden="true" />

          {/* On a kiosk the mark sits up on the hood beside the lens,
              where it would be silkscreened on a real cabinet. */}
          <BrandMark
            height={34}
            className="hidden shrink-0 lg:block"
          />

          <span
            className="lens block size-8 shrink-0 lg:size-12"
            aria-hidden="true"
          />

          <span
            className={`bulb block h-3 w-6 shrink-0 lg:h-4 lg:w-9 ${flash ? "bulb-on" : ""}`}
            aria-hidden="true"
          />

          <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
            <span className={`lamp ${status ? "lamp-on animate-blink" : ""}`} />
            <span className="t-label text-[9px] text-paper/45">
              {status ?? MACHINE.model}
            </span>
          </div>

          <span className="grille h-5 flex-1 lg:h-8" aria-hidden="true" />
        </div>

        {/* ---------- Name plate (phone only; the kiosk carries it
             on the hood row above) ---------- */}
        <div className="flex items-center justify-between gap-3 pt-2 pb-2.5 lg:hidden">
          <BrandMark height={26} className="shrink-0" />

          <div className="flex items-center gap-2">
            <span
              className={`lamp ${status ? "lamp-on animate-blink" : ""}`}
              aria-hidden="true"
            />
            <span className="t-label text-[8.5px] text-paper/45">
              {status ?? MACHINE.model}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Screen ---------- */}
      <div className="min-h-0 flex-1 px-2.5 lg:px-8 lg:pt-4">
        <div className="bezel mx-auto h-full">
          <div className="tube">{children}</div>
        </div>
      </div>

      {/* ---------- Deck ---------- */}
      <div className="pb-safe shrink-0 px-4 lg:px-8">
        {deck && (
          <div className="mx-auto pt-3 lg:pt-4">{deck}</div>
        )}

        {/* Lamps on the left, the spec plate on the right. */}
        <div
          className="flex items-end justify-between gap-3 pt-2.5"
          aria-hidden="true"
        >
          <div className="flex items-center gap-1.5">
            <span className="lamp lamp-on" />
            <span className="lamp" />
            <span className="lamp" />
          </div>

          <div className="plate flex items-center gap-2 px-2 py-1">
            <span className="t-label text-[8px] text-paper/30">
              {MACHINE.serialLabel}
            </span>
            <span className="t-label text-[8px] text-paper/55">
              {MACHINE.serial}
            </span>
          </div>
        </div>

        {/* ---------- Base: the slot the strip comes out of ---------- */}
        <div className="pt-2.5 pb-2.5">
          <div className="slot" aria-hidden="true" />

          {!lean && (
            <div
              className="flex items-center justify-between gap-4 pt-2.5"
              aria-hidden="true"
            >
              <span className="t-label text-[8px] text-paper/28">
                {MACHINE.slotLabel}
              </span>
              <span className="vents h-3.5 w-20" />
              <span className="t-label text-[8px] text-paper/28">
                {EVENT.dateShort}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}