"use client";

/**
 * ILLUSTRATIONS
 * ----------------------------------------------------------------
 * The artwork that runs through the photo strip. These are drawings,
 * not icons: line art with weight to it, objects with parts that
 * belong to each other — a mic on its stand with the cable trailing
 * off the base, a cassette with its reels and its screws, a camera
 * with the flash going off.
 *
 * Everything is authored as SVG path data in its own box and
 * painted onto canvas through Path2D, so one description serves the
 * strip and the screen both.
 *
 * Drawn line-first: nearly every part is a stroke, because a stroke
 * with a round cap and a slightly wandering control point reads as
 * a hand, and a filled shape reads as a symbol. Keep it that way.
 *
 * These are our own drawings. They are not taken from the Raahe
 * brand guide's illustrations.
 */

/** A stroked or filled part of a drawing. */
export type Part = {
  d: string;
  /** Stroke weight in box units. Omit `w` to fill instead. */
  w?: number;
  fill?: boolean;
  /** Which of the strip's three inks this part is drawn in. */
  ink?: "pink" | "paper" | "grey";
};

export type Drawing = {
  /** The box the path data is authored in. */
  box: [number, number];
  parts: Part[];
};

/** A circle, as path data. Canvas arcs can't live in a `d` string. */
function circle(cx: number, cy: number, r: number): string {
  const k = r * 0.5523;
  return [
    `M${cx} ${cy - r}`,
    `C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`,
    `C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}`,
    `C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}`,
    `C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}

/** An ellipse, as path data. */
function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  const kx = rx * 0.5523;
  const ky = ry * 0.5523;
  return [
    `M${cx} ${cy - ry}`,
    `C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}`,
    `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}`,
    `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}`,
    `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}`,
    "Z",
  ].join(" ");
}

/* ================================================================
   THE DRAWINGS
   ================================================================ */

export const DRAWINGS: Record<string, Drawing> = {
  /** A broadcast mic on a round-base stand, cable trailing off. */
  micStand: {
    box: [120, 268],
    parts: [
      { d: ellipse(60, 42, 27, 31), w: 5, ink: "pink" },
      { d: "M39 34 C50 28 70 28 81 34", w: 3.4, ink: "pink" },
      { d: "M38 46 C49 52 71 52 82 46", w: 3.4, ink: "pink" },
      { d: "M40 57 C50 62 70 62 80 57", w: 3.4, ink: "pink" },
      { d: "M47 72 C55 70 66 70 73 72 C72 78 72 83 71 87 C63 88 56 88 49 87 C48 82 48 77 47 72 Z", w: 4.5, ink: "paper" },
      { d: "M52 88 C57 86 64 86 68 88 C69 100 68 113 67 124 C62 126 57 126 53 124 C52 113 52 100 52 88 Z", w: 4.5, ink: "paper" },
      { d: "M45 96 C36 101 35 114 43 120", w: 3.6, ink: "grey" },
      { d: "M60 125 C61 155 60 185 60 214", w: 5, ink: "paper" },
      { d: "M44 150 C54 148 66 148 76 150", w: 3.6, ink: "grey" },
      { d: ellipse(60, 228, 41, 13), w: 5, ink: "paper" },
      { d: "M96 233 C114 241 110 255 92 258 C78 260 70 254 72 248", w: 4, ink: "pink" },
    ],
  },

  /** A cassette, reels and screws and all. */
  cassette: {
    box: [212, 142],
    parts: [
      {
        d: "M11 18 C74 14 140 15 201 17 C204 55 204 92 202 125 C138 129 72 128 11 125 C8 90 8 52 11 18 Z",
        w: 5,
        ink: "paper",
      },
      {
        d: "M25 29 C82 26 138 27 187 29 C189 41 189 53 188 64 C132 67 78 66 24 64 C22 52 23 40 25 29 Z",
        w: 3.6,
        ink: "pink",
      },
      { d: "M35 41 C68 39 118 39 150 41", w: 3, ink: "pink" },
      { d: "M34 52 C58 50 88 51 108 52", w: 3, ink: "pink" },
      // Hatching at one end of the label, the way a print shades it.
      // Kept off the written lines — it's shading, not scribble.
      {
        d: "M124 60 L136 34 M140 61 L152 34 M156 61 L168 34 M172 60 L182 36",
        w: 2,
        ink: "pink",
      },
      { d: circle(70, 90, 25), w: 4.4, ink: "paper" },
      { d: circle(142, 90, 25), w: 4.4, ink: "paper" },
      { d: circle(70, 90, 9), w: 3.4, ink: "grey" },
      { d: circle(142, 90, 9), w: 3.4, ink: "grey" },
      { d: "M70 81 L70 74 M79 90 L86 90 M70 99 L70 106 M61 90 L54 90", w: 3, ink: "grey" },
      { d: "M142 81 L142 74 M151 90 L158 90 M142 99 L142 106 M133 90 L126 90", w: 3, ink: "grey" },
      { d: "M96 78 C103 76 110 76 116 78 C118 86 118 95 116 102 C109 104 103 104 96 102 C94 94 94 86 96 78 Z", w: 3.4, ink: "pink" },
      { d: circle(22, 34, 3.2), fill: true, ink: "grey" },
      { d: circle(190, 34, 3.2), fill: true, ink: "grey" },
      { d: circle(22, 118, 3.2), fill: true, ink: "grey" },
      { d: circle(190, 118, 3.2), fill: true, ink: "grey" },
      { d: "M74 114 L74 126 M96 114 L96 126 M118 114 L118 126 M140 114 L140 126", w: 3, ink: "grey" },
    ],
  },

  /** A speaker cabinet with the lead running out of the back. */
  speakerCab: {
    box: [156, 214],
    parts: [
      {
        d: "M13 16 C54 12 96 13 133 15 C136 76 136 140 134 199 C93 203 51 202 12 199 C9 138 10 76 13 16 Z",
        w: 5,
        ink: "paper",
      },
      { d: circle(73, 134, 43), w: 4.6, ink: "pink" },
      { d: circle(73, 134, 17), w: 3.6, ink: "pink" },
      { d: circle(73, 134, 5), fill: true, ink: "pink" },
      { d: circle(73, 60, 19), w: 4.2, ink: "paper" },
      { d: circle(73, 60, 6), w: 3, ink: "paper" },
      // Shading down the left cheek of the cabinet.
      {
        d: "M18 46 L34 30 M18 66 L38 44 M18 86 L34 68 M20 106 L32 94",
        w: 2,
        ink: "grey",
      },
      { d: "M20 22 L32 22 L20 34 Z", w: 3, ink: "grey" },
      { d: "M126 22 L114 22 L126 34 Z", w: 3, ink: "grey" },
      { d: "M20 192 L32 192 L20 180 Z", w: 3, ink: "grey" },
      { d: "M126 192 L114 192 L126 180 Z", w: 3, ink: "grey" },
      { d: "M134 172 C160 168 168 188 150 197 C136 204 124 196 128 188", w: 4.2, ink: "pink" },
    ],
  },

  /** A quarter-inch jack with the cable curling away from it. */
  jackPlug: {
    box: [104, 236],
    parts: [
      { d: "M44 10 C44 4 60 4 60 10 C61 16 61 21 60 26 C54 27 49 27 44 26 C43 21 43 16 44 10 Z", w: 4.2, ink: "paper" },
      { d: "M44 32 C50 31 55 31 60 32", w: 3.2, ink: "grey" },
      { d: "M42 27 C49 25 56 25 62 27 C63 42 63 57 62 72 C55 74 49 74 42 72 C41 57 41 42 42 27 Z", w: 4.4, ink: "paper" },
      { d: "M36 73 C47 71 58 71 68 73 C69 89 69 106 68 122 C57 124 47 124 36 122 C35 106 35 89 36 73 Z", w: 4.6, ink: "pink" },
      { d: "M44 86 L60 86 M44 98 L60 98 M44 110 L60 110", w: 3, ink: "pink" },
      { d: "M38 124 C52 133 52 133 66 124", w: 3.4, ink: "grey" },
      { d: "M38 134 C52 143 52 143 66 134", w: 3.4, ink: "grey" },
      { d: "M40 144 C52 152 52 152 64 144", w: 3.4, ink: "grey" },
      {
        d: "M52 152 C84 166 18 186 52 202 C78 214 38 222 46 232",
        w: 4.4,
        ink: "pink",
      },
    ],
  },

  /** A boxy camera, going off. */
  flashCam: {
    box: [196, 148],
    parts: [
      {
        d: "M15 53 C30 51 44 51 58 52 C62 46 66 40 70 35 C89 32 108 32 126 35 C130 40 134 46 138 52 C153 51 168 51 181 53 C184 79 184 106 182 131 C126 135 70 134 14 131 C12 105 12 79 15 53 Z",
        w: 5,
        ink: "paper",
      },
      { d: circle(98, 92, 32), w: 4.6, ink: "pink" },
      { d: circle(98, 92, 17), w: 3.6, ink: "pink" },
      { d: "M86 80 C90 75 97 73 103 75", w: 3, ink: "paper" },
      { d: "M26 41 C36 39 46 39 54 41 C55 45 55 49 54 52 C45 54 35 54 26 52 C25 49 25 45 26 41 Z", w: 4, ink: "paper" },
      { d: "M22 30 C18 25 14 20 10 16", w: 4, ink: "pink" },
      { d: "M40 26 C40 20 40 14 40 8", w: 4, ink: "pink" },
      { d: "M58 30 C63 25 68 20 72 16", w: 4, ink: "pink" },
      { d: circle(160, 68, 7), w: 3.4, ink: "grey" },
      // Shading under the lens.
      { d: "M60 118 L70 106 M76 120 L86 108 M120 120 L130 108 M136 118 L146 106", w: 2, ink: "grey" },
      { d: "M150 116 L172 116", w: 3.4, ink: "grey" },
      { d: "M28 116 L44 116", w: 3.4, ink: "grey" },
    ],
  },

  /** Headphones, hung up. */
  headphones: {
    box: [186, 170],
    parts: [
      { d: "M20 104 C16 44 58 12 93 12 C128 12 170 44 166 104", w: 5.5, ink: "paper" },
      { d: "M26 96 C20 44 58 22 93 22 C128 22 166 44 160 96", w: 2.4, ink: "grey" },
      {
        d: "M14 96 C28 91 42 93 47 100 C50 120 50 140 47 156 C40 164 21 164 13 156 C9 137 9 115 14 96 Z",
        w: 5,
        ink: "pink",
      },
      {
        d: "M139 100 C144 93 158 91 172 96 C177 115 177 137 173 156 C165 164 146 164 139 156 C136 140 136 120 139 100 Z",
        w: 5,
        ink: "pink",
      },
      { d: ellipse(30, 126, 10, 22), w: 3, ink: "pink" },
      { d: ellipse(156, 126, 10, 22), w: 3, ink: "pink" },
      { d: "M22 168 C26 180 22 190 12 194", w: 4, ink: "grey" },
    ],
  },

  /**
   * A hand coming in to press the button. One outline for the whole
   * hand — knuckles, the pointing finger, the cuff — because a hand
   * drawn as separate parts reads as a bundle of sausages.
   */
  handButton: {
    box: [236, 176],
    parts: [
      {
        d: [
          "M18 34",
          "C46 24 76 26 100 38",
          "C118 47 136 58 152 70",
          "C160 76 158 86 148 88",
          "C134 91 118 84 104 76",
          "C110 88 104 100 90 99",
          "C96 110 90 121 76 120",
          "C82 130 75 140 62 139",
          "C46 138 28 132 16 122",
          "C12 94 12 60 18 34",
          "Z",
        ].join(" "),
        w: 5,
        ink: "paper",
      },
      // The cuff.
      { d: "M18 36 C10 60 10 98 17 122", w: 4.4, ink: "pink" },
      { d: "M8 40 C1 64 1 96 7 120", w: 4.4, ink: "pink" },
      // Knuckle creases.
      { d: "M96 60 C100 66 102 71 102 76", w: 3, ink: "grey" },
      { d: "M84 82 C88 87 90 92 90 99", w: 3, ink: "grey" },
      { d: "M70 103 C74 108 76 113 76 120", w: 3, ink: "grey" },
      // The button it's coming down on.
      { d: circle(186, 118, 30), w: 5, ink: "pink" },
      { d: circle(186, 118, 17), w: 3.4, ink: "pink" },
      { d: "M156 132 C166 146 206 146 216 132", w: 4.4, ink: "paper" },
      // It's being pressed.
      { d: "M186 74 C186 68 186 62 186 56", w: 3.4, ink: "pink" },
      { d: "M214 84 C219 79 223 74 227 70", w: 3.4, ink: "pink" },
      { d: "M158 84 C153 79 149 74 145 70", w: 3.4, ink: "pink" },
    ],
  },
};

export type DrawingName = keyof typeof DRAWINGS;

const INK_FALLBACK = { pink: "#F04E98", paper: "#F4F5F5", grey: "#8A8A8A" };

/**
 * Paints one drawing with its top-left corner at (x, y), scaled to
 * `height`. Returns the width it took, so a caller can lay several
 * out in a row.
 */
export function paintDrawing(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  height: number,
  options: {
    inks?: { pink: string; paper: string; grey: string };
    /** Blur radius of the glow behind pink and white line work. */
    glow?: number;
    alpha?: number;
    /** Radians. Rotates about the middle of the drawing. */
    rotate?: number;
  } = {},
): number {
  const drawing = DRAWINGS[name];
  if (!drawing || typeof Path2D === "undefined") return 0;

  const inks = options.inks ?? INK_FALLBACK;
  const scale = height / drawing.box[1];
  const width = drawing.box[0] * scale;

  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.translate(x + width / 2, y + height / 2);
  if (options.rotate) ctx.rotate(options.rotate);
  ctx.scale(scale, scale);
  ctx.translate(-drawing.box[0] / 2, -drawing.box[1] / 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const part of drawing.parts) {
    const colour = inks[part.ink ?? "paper"];
    const path = new Path2D(part.d);

    // The glow is the ink bleeding into the paper, not neon. Only
    // the pink and the white carry it.
    if (options.glow && part.ink !== "grey") {
      ctx.shadowColor = colour;
      ctx.shadowBlur = options.glow;
    } else {
      ctx.shadowBlur = 0;
    }

    if (part.fill) {
      ctx.fillStyle = colour;
      ctx.fill(path);
    } else {
      ctx.strokeStyle = colour;
      ctx.lineWidth = part.w ?? 4;
      ctx.stroke(path);
    }
  }

  ctx.restore();
  return width;
}

/**
 * The lead that runs down a border, tying the drawings on it
 * together. Built for a given height so it always reaches.
 */
export function paintCable(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  height: number,
  options: {
    colour: string;
    width?: number;
    /** How far it wanders either side of x. */
    sway?: number;
    glow?: number;
    alpha?: number;
    /** Flips the wander, so two borders don't mirror each other. */
    phase?: number;
  },
) {
  const sway = options.sway ?? 22;
  const phase = options.phase ?? 0;
  const steps = Math.max(3, Math.round(height / 190));
  const step = height / steps;

  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.strokeStyle = options.colour;
  ctx.lineWidth = options.width ?? 5;
  ctx.lineCap = "round";
  if (options.glow) {
    ctx.shadowColor = options.colour;
    ctx.shadowBlur = options.glow;
  }

  ctx.beginPath();
  ctx.moveTo(x, top);
  for (let i = 0; i < steps; i++) {
    const y0 = top + i * step;
    const y1 = y0 + step;
    const side = (i + phase) % 2 === 0 ? 1 : -1;
    ctx.bezierCurveTo(
      x + sway * side,
      y0 + step * 0.3,
      x + sway * side,
      y0 + step * 0.7,
      x,
      y1,
    );
  }
  ctx.stroke();
  ctx.restore();
}
