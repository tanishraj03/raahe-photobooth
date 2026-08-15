"use client";

/**
 * FILM GRAIN
 * ----------------------------------------------------------------
 * One tile of noise, generated once, used in two places: as a CSS
 * background over the live preview, and as a canvas pattern when the
 * photo is captured. Same pixels both times, so the grain you see is
 * the grain you get.
 *
 * The tile is scaled to a fixed number of repeats across the frame
 * rather than a fixed pixel size. A grain speck tuned on a 360px
 * preview would be invisible on the 1080px capture otherwise — the
 * same trap that rules out blur-based filters.
 */

const TILE = 128;

/** How many times the tile repeats across the width of a frame. */
export const GRAIN_REPEATS = 5;

/** How far the noise strays from neutral grey. Higher = coarser. */
const SPREAD = 52;

type GrainTile = { canvas: HTMLCanvasElement; url: string };

let cache: GrainTile | null | undefined;

/**
 * The noise tile, or null where canvas isn't available. Built on
 * first use and kept — it never changes.
 */
export function grainTile(): GrainTile | null {
  if (cache !== undefined) return cache;
  if (typeof document === "undefined") return (cache = null);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return (cache = null);

    const image = ctx.createImageData(TILE, TILE);
    const px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      // Mid grey is neutral under `overlay`, so noise around 128
      // roughens the photo without shifting its exposure.
      const value = 128 + (Math.random() * 2 - 1) * SPREAD;
      px[i] = px[i + 1] = px[i + 2] = value;
      px[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    cache = { canvas, url: canvas.toDataURL("image/png") };
  } catch {
    cache = null;
  }
  return cache;
}

/** Paints grain over a captured photo. */
export function paintGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
) {
  const tile = grainTile();
  if (!tile || alpha <= 0) return;

  const pattern = ctx.createPattern(tile.canvas, "repeat");
  if (!pattern) return;

  // Match the CSS `background-size` so both sides show the same
  // number of specks across the frame.
  const scale = w / GRAIN_REPEATS / TILE;
  try {
    pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
  } catch {
    // Older browsers can't transform a pattern. The grain comes out
    // finer than the preview promised, which is a small lie we can
    // live with — it's still grain.
  }

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
