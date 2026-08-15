"use client";

/**
 * THE MIC
 * ----------------------------------------------------------------
 * A vintage broadcast microphone, drawn as a halftone silhouette —
 * the same device as the mic on the Raahe event posters, in the same
 * pink, at an opacity that lets it sit behind the type instead of
 * shouting over it.
 *
 * The geometry is defined once, here, as SVG path data in a
 * 240 × 480 box. It gets rendered twice:
 *
 *   · components/MicMark.tsx  — as SVG, on screen
 *   · paintMic() below        — as canvas, onto the poster
 *
 * Canvas takes SVG path data directly through Path2D, so neither
 * copy has to restate the shape.
 *
 * This is our own drawing of a microphone. It is not traced from,
 * and does not reproduce, the illustrations in the Raahe brand
 * guide.
 */

export const MIC_BOX = { width: 240, height: 480 };

export const MIC_PATHS = {
  /** The grille head — domed at the top, squared off at the jaw. */
  head: "M44 108C44 56 78 24 120 24C162 24 196 56 196 108L196 212C196 244 162 262 120 262C78 262 44 244 44 212Z",
  /** The yoke the head swings in. Stroked, not filled. */
  yoke: "M26 110L26 214C26 268 66 300 120 300C174 300 214 268 214 214L214 110",
  /** Neck. */
  neck: "M104 292L136 292L136 356L104 356Z",
  /** Base, shouldered then flared to the foot. */
  base: "M84 352L156 352C168 352 174 362 176 374L192 452C195 466 187 472 176 472L64 472C53 472 45 466 48 452L64 374C66 362 72 352 84 352Z",
} as const;

/** Thickness of the yoke. Shared by both renderers. */
export const MIC_YOKE_WIDTH = 14;

/**
 * The grille slots, cut back out of the head. Without them the head
 * is just a lozenge; with them it's a microphone.
 */
export const MIC_SLOTS = {
  x: 62,
  width: 116,
  height: 12,
  radius: 6,
  rows: [100, 136, 172, 208],
} as const;

export type MicPaint = {
  color: string;
  /** Opacity of the whole illustration, 0 to 1. */
  alpha: number;
  /** Halftone dot diameter, in poster pixels. */
  dot: number;
  /** Distance between dot centres. */
  spacing: number;
  /** How much the dots shrink towards the foot, 0 to 1. */
  fade: number;
};

/**
 * Paints the mic at (x, y). Height follows from the width — the
 * shape is 1:2.
 *
 * The halftone is built by filling a tile with dots and then keeping
 * only the part of it that lands inside the mic. Doing it that way
 * round means the dots stay on one grid across the whole shape,
 * which is what makes it read as print rather than as texture.
 */
export function paintMic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  o: MicPaint,
) {
  if (typeof Path2D === "undefined" || width <= 0) return;

  const scale = width / MIC_BOX.width;
  const height = MIC_BOX.height * scale;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));

  const dots = document.createElement("canvas");
  dots.width = w;
  dots.height = h;
  const dctx = dots.getContext("2d");

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d");

  if (!dctx || !mctx) return;

  /* ---- the dot field ---- */

  dctx.fillStyle = o.color;
  let row = 0;
  for (let dy = o.spacing / 2; dy < h; dy += o.spacing, row++) {
    const radius = (o.dot / 2) * (1 - o.fade * (dy / h));
    if (radius <= 0.15) continue;
    // Every other row steps across by half, so the dots sit on a
    // staggered grid the way a printed halftone does.
    const offset = (row % 2) * (o.spacing / 2);
    for (let dx = offset; dx < w + o.spacing; dx += o.spacing) {
      dctx.beginPath();
      dctx.arc(dx, dy, radius, 0, Math.PI * 2);
      dctx.fill();
    }
  }

  /* ---- the silhouette ---- */

  mctx.save();
  mctx.scale(scale, scale);
  mctx.fillStyle = "#000";
  mctx.fill(new Path2D(MIC_PATHS.head));
  mctx.fill(new Path2D(MIC_PATHS.neck));
  mctx.fill(new Path2D(MIC_PATHS.base));
  mctx.strokeStyle = "#000";
  mctx.lineWidth = MIC_YOKE_WIDTH;
  mctx.lineCap = "round";
  mctx.lineJoin = "round";
  mctx.stroke(new Path2D(MIC_PATHS.yoke));

  // Punch the grille out of the head.
  mctx.globalCompositeOperation = "destination-out";
  for (const y of MIC_SLOTS.rows) {
    mctx.beginPath();
    const r = MIC_SLOTS.radius;
    const { x, width: w, height: h } = MIC_SLOTS;
    mctx.moveTo(x + r, y);
    mctx.arcTo(x + w, y, x + w, y + h, r);
    mctx.arcTo(x + w, y + h, x, y + h, r);
    mctx.arcTo(x, y + h, x, y, r);
    mctx.arcTo(x, y, x + w, y, r);
    mctx.closePath();
    mctx.fill();
  }
  mctx.restore();

  /* ---- keep only the dots inside it ---- */

  dctx.globalCompositeOperation = "destination-in";
  dctx.drawImage(mask, 0, 0);

  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.drawImage(dots, x, y, width, height);
  ctx.restore();
}
