"use client";

import type { CSSProperties } from "react";

/**
 * WASHES
 * ----------------------------------------------------------------
 * A wash is one layer of colour laid over a photo: a flat tint, a
 * light leak, a vignette, a bloom.
 *
 * The point of this file is that a wash is *described* once and
 * *drawn* twice — as CSS over the live preview, and on canvas at
 * capture. Both renderers live side by side below so they can't
 * drift apart. If the preview lies about what you'll get, the whole
 * filter picker is worthless.
 *
 * The geometry matches because the preview box and the captured
 * photo are the same shape (FRAME.cellAspect), so a gradient drawn
 * across one lands in the same place on the other.
 */

/** Blend modes that mean the same thing in CSS and on canvas. */
export type Blend =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light"
  | "hard-light"
  | "color-dodge"
  | "lighten"
  | "darken";

/** A colour stop along a gradient. `at` runs 0 → 1. */
export type Stop = { at: number; color: string };

export type Wash =
  /** Flat colour over the whole frame. */
  | { kind: "solid"; color: string; alpha: number; blend: Blend }
  /**
   * Straight gradient. `angle` follows CSS: 0 points up, 90 points
   * right. Used for light leaks and stage-light washes.
   */
  | { kind: "linear"; angle: number; stops: Stop[]; alpha: number; blend: Blend }
  /**
   * Gradient from the centre out to the far corner — vignettes and
   * centre blooms. Matches CSS `circle farthest-corner at 50% 50%`.
   */
  | { kind: "radial"; stops: Stop[]; alpha: number; blend: Blend };

/* ================================================================
   CSS SIDE — the live preview and the filter chips
   ================================================================ */

const cssStops = (stops: Stop[]) =>
  stops.map((s) => `${s.color} ${(s.at * 100).toFixed(2)}%`).join(", ");

/** Style for one absolutely-positioned layer over the video. */
export function washStyle(wash: Wash): CSSProperties {
  const shared = {
    opacity: wash.alpha,
    mixBlendMode: wash.blend,
  } as CSSProperties;

  switch (wash.kind) {
    case "solid":
      return { ...shared, backgroundColor: wash.color };
    case "linear":
      return {
        ...shared,
        backgroundImage: `linear-gradient(${wash.angle}deg, ${cssStops(wash.stops)})`,
      };
    case "radial":
      return {
        ...shared,
        backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, ${cssStops(
          wash.stops,
        )})`,
      };
  }
}

/* ================================================================
   CANVAS SIDE — the captured photo
   ================================================================ */

function compositeFor(blend: Blend): GlobalCompositeOperation {
  return blend === "normal"
    ? "source-over"
    : (blend as GlobalCompositeOperation);
}

function fillFor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wash: Wash,
): string | CanvasGradient {
  if (wash.kind === "solid") return wash.color;

  if (wash.kind === "linear") {
    // The CSS gradient line: it runs through the centre at `angle`,
    // and is long enough that its ends sit on the box's edges.
    const rad = (wash.angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const length = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const cx = w / 2;
    const cy = h / 2;
    const gradient = ctx.createLinearGradient(
      cx - (dx * length) / 2,
      cy - (dy * length) / 2,
      cx + (dx * length) / 2,
      cy + (dy * length) / 2,
    );
    for (const stop of wash.stops) gradient.addColorStop(stop.at, stop.color);
    return gradient;
  }

  // Radial: farthest-corner, same as the CSS default.
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.hypot(w, h) / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  for (const stop of wash.stops) gradient.addColorStop(stop.at, stop.color);
  return gradient;
}

/** Paints one wash over the whole canvas. */
export function paintWash(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wash: Wash,
) {
  ctx.save();
  ctx.globalCompositeOperation = compositeFor(wash.blend);
  ctx.globalAlpha = wash.alpha;
  ctx.fillStyle = fillFor(ctx, w, h, wash);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
