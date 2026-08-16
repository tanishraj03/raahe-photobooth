"use client";

import type { ReactNode } from "react";

/**
 * THE BOOTH
 * ----------------------------------------------------------------
 * A dark ground, a fine grain, and three bands: something at the
 * top, the stage, something at the bottom. That's all.
 *
 * It used to be a whole cabinet — a hood with a lens and speaker
 * grilles, screws in the corners, a deck of lamps and vents. All of
 * it has gone. The booth reads as a machine through its type, its
 * one accent colour and its restraint, not through drawn hardware
 * competing with the photograph.
 *
 * Bars sit *over* the stage rather than above and below it, so the
 * camera can run the full height of the screen behind them.
 */
export default function Cabinet({
  children,
  top,
  bottom,
  /** Stage runs edge to edge under the bars. For the camera. */
  overlay = false,
  className = "",
}: {
  children: ReactNode;
  top?: ReactNode;
  bottom?: ReactNode;
  overlay?: boolean;
  className?: string;
}) {
  return (
    <div className={`grain relative flex h-full flex-col ${className}`}>
      {overlay ? (
        <>
          <div className="absolute inset-0">{children}</div>
          {top && (
            <div className="pt-safe relative z-20 shrink-0">{top}</div>
          )}
          <div className="relative z-10 min-h-0 flex-1" />
          {bottom && (
            <div className="pb-safe relative z-20 shrink-0">{bottom}</div>
          )}
        </>
      ) : (
        <>
          {top && <div className="pt-safe shrink-0">{top}</div>}
          <div className="min-h-0 flex-1">{children}</div>
          {bottom && <div className="pb-safe shrink-0">{bottom}</div>}
        </>
      )}
    </div>
  );
}
