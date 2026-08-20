"use client";

import { EVENT, LOGO_FALLBACK_TEXT, LOGO_SOURCES } from "@/lib/config/event";
import { FRAME } from "@/lib/config/frame";
import { grainTile } from "@/lib/grain";
import { DRAWINGS, paintDrawing } from "@/lib/illustrations";

/* ================================================================
   TYPE HELPERS

   Canvas text needs more care than CSS text. Two things matter:
   the brand font has to be loaded before we draw with it, and
   letter spacing has to work on browsers that don't support
   ctx.letterSpacing — the tracked venue line and the wordmark on
   the bands are a big part of how the strip reads, so they can't
   quietly collapse.
   ================================================================ */

/**
 * Next gives the font a generated family name and exposes it as a
 * CSS variable. We read it back so canvas draws in League Spartan
 * rather than whatever the system default happens to be.
 */
function fontStack(): string {
  if (typeof window === "undefined") return "sans-serif";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-league-spartan")
    .trim();
  return value || "'League Spartan', system-ui, sans-serif";
}

/** Waits until the brand font can actually be painted. */
async function waitForFont(stack: string) {
  if (typeof document === "undefined" || !document.fonts) return;
  const primary = stack.split(",")[0].trim();
  const F = FRAME.foot;
  try {
    await Promise.all([
      document.fonts.load(`800 ${F.nameSize}px ${primary}`),
      document.fonts.load(`600 ${F.venueSize}px ${primary}`),
      document.fonts.load(`700 ${F.dateSize}px ${primary}`),
      document.fonts.load(`800 ${FRAME.band.sizes[0]}px ${primary}`),
    ]);
  } catch {
    // Loading by name can fail on some browsers. The next line still helps.
  }
  try {
    await document.fonts.ready;
  } catch {
    // Not fatal — we draw with whatever is available.
  }
}

let letterSpacingSupport: boolean | null = null;

function supportsLetterSpacing(ctx: CanvasRenderingContext2D): boolean {
  if (letterSpacingSupport !== null) return letterSpacingSupport;
  try {
    const context = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    context.letterSpacing = "2px";
    letterSpacingSupport = context.letterSpacing === "2px";
    context.letterSpacing = "0px";
  } catch {
    letterSpacingSupport = false;
  }
  return letterSpacingSupport ?? false;
}

function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${px}px`;
}

/** Width of text including letter spacing, on any browser. */
function measure(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number,
): number {
  if (supportsLetterSpacing(ctx)) {
    setTracking(ctx, tracking);
    const width = ctx.measureText(text).width;
    setTracking(ctx, 0);
    return width;
  }
  let width = 0;
  for (const character of text) {
    width += ctx.measureText(character).width + tracking;
  }
  return width - tracking;
}

/** Draws text from a left edge, including letter spacing, on any browser. */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  if (supportsLetterSpacing(ctx)) {
    setTracking(ctx, tracking);
    ctx.fillText(text, x, y);
    setTracking(ctx, 0);
    return;
  }
  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + tracking;
  }
}

/** Draws text centred on `centreX`. The whole strip hangs off this. */
function drawCentred(
  ctx: CanvasRenderingContext2D,
  text: string,
  centreX: number,
  y: number,
  tracking: number,
) {
  const width = measure(ctx, text, tracking);
  drawText(ctx, text, centreX - width / 2, y, tracking);
}

/**
 * Steps a font size down until the text fits. Means a longer event
 * name or venue at the next event won't run off the edge.
 */
function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  startSize: number,
  trackingEm: number,
  maxWidth: number,
  stack: string,
): number {
  let size = startSize;
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${stack}`;
    if (measure(ctx, text, size * trackingEm) <= maxWidth) break;
    size -= 1;
  }
  return size;
}

/** Breaks text into lines that fit a column. Assumes ctx.font is set. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  tracking: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [text];

  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(ctx, candidate, tracking) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ================================================================
   SHAPES
   ================================================================ */

/**
 * Deterministic noise for one print's edge.
 *
 * Seeded off the print's index so a strip tears the same way every
 * time it's drawn — but each of the three tears differently, which is
 * the whole point. A shared `Math.random()` would reshuffle the paper
 * on every re-render.
 */
function tornOffsets(count: number, seed: number, amplitude: number): number[] {
  let state = (seed * 2654435761 + 12345) >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const raw: number[] = [];
  for (let i = 0; i < count; i++) {
    // Two rolls, not one: the first is the direction and reach, the
    // second varies how deep this particular bite goes. With a single
    // roll every notch is about the same size and the edge reads as a
    // ripple rather than a tear.
    const reach = random() * 2 - 1;
    const bite = 0.3 + random() * 0.7;
    raw.push(reach * bite * amplitude);
  }

  // One light smoothing pass, wrapping at the ends so the last point
  // meets the first cleanly. Weighted toward the point itself, so it
  // takes the static off without flattening the tear back to a wave.
  return raw.map(
    (value, i) =>
      (raw[(i - 1 + count) % count] + value * 3 + raw[(i + 1) % count]) / 5,
  );
}

/** A rectangle whose edges have been torn rather than cut. */
function tornRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amplitude: number,
  step: number,
  seed: number,
) {
  const across = Math.max(4, Math.round(w / step));
  const down = Math.max(4, Math.round(h / step));
  const total = (across + down) * 2;
  const offset = tornOffsets(total, seed, amplitude);

  const points: [number, number][] = [];
  let k = 0;

  // Every offset pushes *outward*, so the tear never eats the photo.
  for (let i = 0; i < across; i++)
    points.push([x + (w * i) / across, y - offset[k++]]);
  for (let i = 0; i < down; i++)
    points.push([x + w + offset[k++], y + (h * i) / down]);
  for (let i = 0; i < across; i++)
    points.push([x + w - (w * i) / across, y + h + offset[k++]]);
  for (let i = 0; i < down; i++)
    points.push([x - offset[k++], y + h - (h * i) / down]);

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

/**
 * Film grain over the ground.
 *
 * Deliberately not `paintGrain` from lib/grain.ts. That one composites
 * with `overlay`, which is right over a photograph but does close to
 * nothing over near-black — overlay preserves darks by design, and this
 * strip's ground is #191919. Measured, it moved the background by less
 * than half a level. Painting the same shared tile straight on at a low
 * alpha is what actually puts texture on black; it lifts the ground a
 * few levels, which is what film does anyway.
 */
function paintGroundGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  repeats: number,
) {
  const tile = grainTile();
  if (!tile || alpha <= 0) return;

  const pattern = ctx.createPattern(tile.canvas, "repeat");
  if (!pattern) return;

  // Sized in repeats rather than pixels, for the same reason the photo
  // grain is: a speck tuned at one size vanishes at another.
  const scale = w / repeats / tile.canvas.width;
  try {
    pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
  } catch {
    // Older browsers can't transform a pattern. Finer grain than asked
    // for is still grain.
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  const context = ctx as CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}


/* ================================================================
   LOADING
   ================================================================ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

/**
 * Finds the real logo file. Returns null if none is there yet, in
 * which case the strip falls back to the brand name set in type — we
 * never draw an invented stand-in for the Raahe logo.
 */
async function loadLogo(): Promise<HTMLImageElement | null> {
  for (const source of LOGO_SOURCES) {
    try {
      const image = await loadImage(source);
      // An SVG with no intrinsic size reports zero. Try the next file.
      if (image.naturalWidth > 0 && image.naturalHeight > 0) return image;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

/* ================================================================
   COMPOSE
   ================================================================ */

export type Strip = {
  /** Object URL for showing the image on screen. Revoke when done. */
  url: string;
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Draws the three photos into the strip and returns it as a JPEG.
 *
 * The canvas *is* the strip — 1080 × 1920 of it, edge to edge. There
 * is no story background and nothing floating on one: the trim of
 * the image is the trim of the print, and the pink bands either side
 * of the photos run to that trim with the wordmark repeated down
 * them.
 *
 * Runs entirely in the browser — no photo ever leaves the device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const P = F.poster;
  const G = F.ground;
  const A = F.art;
  const B = F.band;
  const Pr = F.print;
  const Ft = F.foot;
  const inks = F.colors.ink;
  const stack = fontStack();

  const [images, logo] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    loadLogo(),
    waitForFont(stack),
  ]);

  const width = P.width;
  const height = P.height;
  const count = Math.max(1, images.length);

  /* ---------------- Layout ----------------

     Everything falls out of two numbers: how wide the band is, and
     how tall a photo is at the width that's left. What remains after
     three of them splits between the head and the foot. */

  /*
     The *print* is the unit, not the photo. A print is the photo plus
     its white edge, and it's prints that get stacked and spaced — so
     the gap you see between two photos is the gap in the config, and
     the white never creeps onto the pink. */
  const printLeft = P.border + P.gutter;
  const printWidth = width - printLeft * 2;
  const cellWidth = printWidth - Pr.border * 2;
  const cellHeight = Math.round(cellWidth / F.cellAspect);
  const printHeight = cellHeight + Pr.border * 2;
  const photosHeight = printHeight * count + P.photoGap * (count - 1);

  const spare = Math.max(0, height - photosHeight);
  const headHeight = Math.round(spare * P.headShare);
  const photoTop = headHeight;
  const footTop = photoTop + photosHeight;
  const footHeight = height - footTop;

  const centreX = width / 2;
  const innerLeft = P.border;
  const photoLeft = printLeft + Pr.border;

  /* ---------------- Canvas ---------------- */

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable");

  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "middle";

  // The paper.
  ctx.fillStyle = F.colors.background;
  ctx.fillRect(0, 0, width, height);

  // The dot field, kept to the inner column — the bands are solid.
  if (G.dotSize > 0) {
    ctx.fillStyle = F.colors.dot;
    for (let y = G.dotSpacing / 2; y < height; y += G.dotSpacing) {
      for (
        let x = innerLeft + G.dotSpacing / 2;
        x < width - P.border;
        x += G.dotSpacing
      ) {
        ctx.beginPath();
        ctx.arc(x, y, G.dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ---------------- The bands ----------------

     Solid pink to the trim, with the wordmark repeated down each one
     on its side: reading up the left, down the right, so the strip
     is the right way up whichever edge you read. */

  if (B.enabled) {
    ctx.fillStyle = F.colors.band;
    ctx.fillRect(0, 0, P.border, height);
    ctx.fillRect(width - P.border, 0, P.border, height);

    /** One pass of the repeating wordmark down a band. */
    const paintBand = (centreLane: number, direction: 1 | -1) => {
      ctx.save();
      ctx.translate(centreLane, height / 2);
      // -90° reads up the strip, +90° reads down it.
      ctx.rotate((direction * Math.PI) / 2);
      ctx.fillStyle = F.colors.bandInk;

      // The run is the strip's height, drawn along the rotated x axis.
      const run = height;
      let cursor = -run / 2;
      let index = 0;

      while (cursor < run / 2) {
        const word = B.words[index % B.words.length];
        const size = B.sizes[index % B.sizes.length];
        const weight = B.weights[index % B.weights.length];
        const tracking = size * B.trackings[index % B.trackings.length];

        ctx.font = `${weight} ${size}px ${stack}`;
        const wordWidth = measure(ctx, word, tracking);

        drawText(ctx, word, cursor, 0, tracking);
        cursor += wordWidth + B.wordGap;

        if (B.dotSize > 0) {
          ctx.beginPath();
          ctx.arc(cursor - B.wordGap / 2, 0, B.dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        index += 1;
      }

      ctx.restore();
    };

    paintBand(P.border / 2, -1);
    paintBand(width - P.border / 2, 1);
  }

  /* ---------------- Film grain ----------------

     Over the ground and the bands, and *before* the prints go down, so
     the photos stay exactly as the shutter took them. This is the only
     thing on the strip that isn't a flat colour or a photograph. */

  if (G.grain > 0) paintGroundGrain(ctx, width, height, G.grain, G.grainRepeats);

  /* ---------------- Head ----------------

     Nothing. The photos simply begin.

     A plate used to sit here with the booth's name on it, and a rule
     under that. Both went: the bands already say RAAHE the whole way
     down, so the top was repeating itself, and once the plate went the
     rule had nothing left to underline. The mark is in the foot, set
     large, which is the one place it isn't competing with a photo. */


  /* ---------------- Photos ----------------

     Each one is clipped to its scalloped cut, then the cut is drawn
     around it. The photo is already 16:9, so this is a clean fill. */

  images.forEach((image, index) => {
    const printTop = photoTop + index * (printHeight + P.photoGap);
    const y = printTop + Pr.border;

    if (Pr.enabled) {
      ctx.fillStyle = F.colors.print;
      if (Pr.torn) {
        tornRectPath(
          ctx,
          printLeft,
          printTop,
          printWidth,
          printHeight,
          Pr.tornAmplitude,
          Pr.tornStep,
          index + 1,
        );
      } else {
        roundRectPath(
          ctx,
          printLeft,
          printTop,
          printWidth,
          printHeight,
          Pr.radius + Pr.border,
        );
      }
      ctx.fill();
    }

    ctx.save();
    roundRectPath(ctx, photoLeft, y, cellWidth, cellHeight, Pr.radius);
    ctx.clip();

    // Something dark behind, so a slow-loading photo never shows white.
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(photoLeft, y, cellWidth, cellHeight);

    ctx.drawImage(image, photoLeft, y, cellWidth, cellHeight);
    ctx.restore();
  });

  /* ---------------- Foot ---------------- */

  const footCursor = footTop;


  const name = EVENT.name.toLowerCase();
  const nameSize = fitSize(
    ctx,
    name,
    800,
    Ft.nameSize,
    Ft.nameTracking,
    printWidth,
    stack,
  );
  const nameLine = Math.round(nameSize * Ft.nameLineHeight);

  const venue = EVENT.venue.toUpperCase();
  let venueSize: number = Ft.venueSize;
  for (const word of venue.split(/\s+/)) {
    venueSize = Math.min(
      venueSize,
      fitSize(ctx, word, 600, venueSize, Ft.venueTracking, printWidth, stack),
    );
  }
  ctx.font = `600 ${venueSize}px ${stack}`;
  const venueLines = wrapText(ctx, venue, printWidth, venueSize * Ft.venueTracking);
  const venueHeight =
    venueLines.length * venueSize + (venueLines.length - 1) * Ft.venueLineGap;

  const dateSize = fitSize(
    ctx,
    EVENT.date,
    700,
    Ft.dateSize,
    Ft.dateTracking,
    printWidth,
    stack,
  );

  const blockHeight =
    Ft.logoHeight +
    Ft.logoGap +
    nameLine +
    Ft.nameGap +
    venueHeight +
    Ft.venueGap +
    dateSize;

  // Hung from the top of the foot, then clamped so it can never run
  // into the trim if the event name wraps to two lines.
  const lowest = height - Ft.padBottom - blockHeight;
  let cursor = Math.min(footCursor + Ft.padTop, lowest);

  if (logo) {
    const logoWidth = Math.round(
      (logo.naturalWidth / logo.naturalHeight) * Ft.logoHeight,
    );
    ctx.drawImage(
      logo,
      Math.round(centreX - Math.min(logoWidth, printWidth) / 2),
      Math.round(cursor),
      Math.min(logoWidth, printWidth),
      Ft.logoHeight,
    );
  } else {
    // Same typographic fallback the on-screen mark uses. Never a
    // redrawn approximation of the logo itself.
    const size = Math.round(Ft.logoHeight * 0.72);
    ctx.font = `800 ${size}px ${stack}`;
    ctx.fillStyle = F.colors.title;
    drawCentred(
      ctx,
      LOGO_FALLBACK_TEXT,
      centreX,
      cursor + Ft.logoHeight / 2,
      size * -0.03,
    );
  }
  cursor += Ft.logoHeight + Ft.logoGap;

  ctx.font = `800 ${nameSize}px ${stack}`;
  ctx.fillStyle = F.colors.title;
  drawCentred(
    ctx,
    name,
    centreX,
    cursor + nameLine / 2,
    nameSize * Ft.nameTracking,
  );
  cursor += nameLine + Ft.nameGap;

  ctx.font = `600 ${venueSize}px ${stack}`;
  ctx.fillStyle = F.colors.venue;
  venueLines.forEach((line, index) => {
    drawCentred(
      ctx,
      line,
      centreX,
      cursor + index * (venueSize + Ft.venueLineGap) + venueSize / 2,
      venueSize * Ft.venueTracking,
    );
  });
  cursor += venueHeight + Ft.venueGap;

  ctx.font = `700 ${dateSize}px ${stack}`;
  ctx.fillStyle = F.colors.date;
  drawCentred(
    ctx,
    EVENT.date,
    centreX,
    cursor + dateSize / 2,
    dateSize * Ft.dateTracking,
  );

  /* ---------------- Crop marks ---------------- */

  if (G.cropMarks) {
    const L = G.cropMarkLength;
    const inset = G.cropMarkInset;
    ctx.strokeStyle = F.colors.cropMark;
    ctx.lineWidth = G.cropMarkWidth;
    ctx.lineCap = "square";

    const corners: [number, number, number, number][] = [
      [inset, inset, 1, 1],
      [width - inset, inset, -1, 1],
      [inset, height - inset, 1, -1],
      [width - inset, height - inset, -1, -1],
    ];

    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + dx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * L);
      ctx.stroke();
    }
  }

  /* ---------------- Export ---------------- */

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", F.exportQuality),
  );
  if (!blob) throw new Error("Could not build the image");

  return { url: URL.createObjectURL(blob), blob, width, height };
}