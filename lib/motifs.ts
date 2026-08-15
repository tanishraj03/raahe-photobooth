"use client";

/**
 * MOTIFS
 * ----------------------------------------------------------------
 * The little music-and-art marks that run down the borders of the
 * photo strip: a sparkle, a note, a record, a mic, an equaliser, a
 * brush stroke.
 *
 * Each one is drawn in a 100 × 100 box, as SVG path data, so it can
 * be scaled anywhere and painted onto canvas through Path2D. Chunky
 * and solid — they have to hold up at 30px on a printed strip.
 *
 * These are our own drawings. They are not taken from the Raahe
 * brand guide's illustrations.
 */

export type MotifPart = {
  d: string;
  /** Stroke width. Filled if left out. */
  stroke?: number;
};

export const MOTIFS: Record<string, MotifPart[]> = {
  /** Four-point sparkle. */
  spark: [
    {
      d: "M50 2C55 29 71 45 98 50C71 55 55 71 50 98C45 71 29 55 2 50C29 45 45 29 50 2Z",
    },
  ],

  /** Eighth note. */
  note: [
    { d: "M16 74A18 18 0 1 0 52 74A18 18 0 1 0 16 74Z" },
    { d: "M44 10L56 10L56 76L44 76Z" },
    { d: "M56 10C78 21 92 34 90 56C83 41 72 32 56 30Z" },
  ],

  /** Record. */
  disc: [
    { d: "M50 10A40 40 0 1 0 50 90A40 40 0 1 0 50 10Z", stroke: 9 },
    { d: "M50 38A12 12 0 1 0 50 62A12 12 0 1 0 50 38Z" },
  ],

  /** The mic, small enough to sit in a border. */
  mic: [
    { d: "M50 6A19 19 0 0 1 69 25L69 45A19 19 0 0 1 31 45L31 25A19 19 0 0 1 50 6Z" },
    { d: "M20 40C20 62 33 76 50 76C67 76 80 62 80 40", stroke: 8 },
    { d: "M44 74L56 74L56 88L44 88Z" },
    { d: "M28 88L72 88L72 97L28 97Z" },
  ],

  /** Equaliser. */
  bars: [
    { d: "M12 54L26 54L26 92L12 92Z" },
    { d: "M34 28L48 28L48 92L34 92Z" },
    { d: "M56 44L70 44L70 92L56 92Z" },
    { d: "M78 14L92 14L92 92L78 92Z" },
  ],

  /** Brush stroke — a sound wave that's also a mark on paper. */
  squiggle: [
    { d: "M8 62C22 24 36 92 50 56C64 20 78 88 92 50", stroke: 11 },
  ],
};

export type MotifName = keyof typeof MOTIFS;

/** Paints one motif with its top-left corner at (x, y). */
export function paintMotif(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
) {
  const parts = MOTIFS[name];
  if (!parts || typeof Path2D === "undefined") return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const part of parts) {
    const path = new Path2D(part.d);
    if (part.stroke) {
      ctx.lineWidth = part.stroke;
      ctx.stroke(path);
    } else {
      ctx.fill(path);
    }
  }

  ctx.restore();
}
