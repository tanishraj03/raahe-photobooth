/**
 * THE MIC
 * ----------------------------------------------------------------
 * A vintage broadcast microphone: the same device as the mic on the
 * Raahe event posters, drawn as SVG path data in a 240 × 480 box.
 *
 * components/MicMark.tsx renders it as a halftone — dots masked to
 * the silhouette, faded towards the foot. On the photo strip the mic
 * appears instead as one of the small border motifs, so lib/motifs.ts
 * carries its own compact version of the same shape.
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

/** Thickness of the yoke. */
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
