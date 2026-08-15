"use client";

import { EVENT, LOGO_SOURCES } from "@/lib/config/event";
import { FRAME } from "@/lib/config/frame";

/* ================================================================
   TYPE HELPERS

   Canvas text needs more care than CSS text. Two things matter:
   the brand font has to be loaded before we draw with it, and
   letter spacing has to work on browsers that don't support
   ctx.letterSpacing — the tracked venue line is a big part of how
   the plate reads, so it can't quietly collapse.
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
  try {
    await Promise.all([
      document.fonts.load(`800 ${FRAME.titleSize}px ${primary}`),
      document.fonts.load(`600 ${FRAME.venueSize}px ${primary}`),
      document.fonts.load(`700 ${FRAME.dateSize}px ${primary}`),
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
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${stack}`;
    if (measure(ctx, text, size * trackingEm) <= maxWidth) break;
    size -= 1;
  }
  return size;
}

/* ================================================================
   SHAPES
   ================================================================ */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  const context = ctx as CanvasRenderingContext2D & {
    roundRect?: (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => void;
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
 * which case the plate is drawn without a mark — we never draw an
 * invented stand-in for the Raahe logo.
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
  /** Object URL for showing the strip on screen. Revoke when done. */
  url: string;
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Draws the three photos into the branded Raahe strip and returns it
 * as a JPEG. Runs entirely in the browser — no photo ever leaves the
 * device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const stack = fontStack();

  const [images, logo] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    loadLogo(),
    waitForFont(stack),
  ]);

  /* ---------------- Layout ---------------- */

  const width = F.photoWidth;
  const contentWidth = width - F.padding * 2;
  const cellWidth = contentWidth;
  const cellHeight = Math.round(cellWidth / F.cellAspect);

  const photosHeight = cellHeight * images.length + F.photoGap * (images.length - 1);

  const ruleY = F.padding + photosHeight + F.ruleGapTop;
  const titleTop = ruleY + F.ruleHeight + F.ruleGapBottom;
  const titleRowHeight = Math.max(F.logoHeight, F.titleSize * 0.8);
  const metaTop = titleTop + titleRowHeight + F.metaGap;
  const metaHeight = Math.max(F.venueSize, F.dateSize);
  const height = Math.round(metaTop + metaHeight + F.padding);

  /* ---------------- Canvas ---------------- */

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable");

  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "middle";

  // Ground
  ctx.fillStyle = F.colors.background;
  ctx.fillRect(0, 0, width, height);

  /* ---------------- Photos ---------------- */

  images.forEach((image, index) => {
    const y = F.padding + index * (cellHeight + F.photoGap);

    ctx.save();
    roundRectPath(ctx, F.padding, y, cellWidth, cellHeight, F.photoRadius);
    ctx.clip();

    // Something dark behind, so a slow-loading photo never shows white.
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(F.padding, y, cellWidth, cellHeight);

    // The photo is already the right shape, so this is a clean fill.
    ctx.drawImage(image, F.padding, y, cellWidth, cellHeight);
    ctx.restore();
  });

  /* ---------------- Rule ---------------- */

  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(F.padding, ruleY, contentWidth, F.ruleHeight);

  /* ---------------- Event name, with the logo beside it ---------------- */

  const titleCentre = titleTop + titleRowHeight / 2;
  let titleX = F.padding;

  if (logo) {
    const logoWidth = Math.round(
      (logo.naturalWidth / logo.naturalHeight) * F.logoHeight,
    );
    ctx.drawImage(
      logo,
      F.padding,
      Math.round(titleCentre - F.logoHeight / 2),
      logoWidth,
      F.logoHeight,
    );
    titleX = F.padding + logoWidth + F.logoGap;
  }

  const title = EVENT.name.toLowerCase();
  const titleSize = fitSize(
    ctx,
    title,
    800,
    F.titleSize,
    F.titleTracking,
    width - F.padding - titleX,
    stack,
  );
  ctx.font = `800 ${titleSize}px ${stack}`;
  ctx.fillStyle = F.colors.title;
  drawText(ctx, title, titleX, titleCentre, titleSize * F.titleTracking);

  /* ---------------- Venue on the left, date on the right ---------------- */

  const metaCentre = metaTop + metaHeight / 2;

  ctx.font = `700 ${F.dateSize}px ${stack}`;
  const dateWidth = measure(ctx, EVENT.date, 0);

  const venue = EVENT.venue.toUpperCase();
  const venueSize = fitSize(
    ctx,
    venue,
    600,
    F.venueSize,
    F.venueTracking,
    contentWidth - dateWidth - 40,
    stack,
  );
  ctx.font = `600 ${venueSize}px ${stack}`;
  ctx.fillStyle = F.colors.venue;
  drawText(ctx, venue, F.padding, metaCentre, venueSize * F.venueTracking);

  ctx.font = `700 ${F.dateSize}px ${stack}`;
  ctx.fillStyle = F.colors.date;
  drawText(ctx, EVENT.date, width - F.padding - dateWidth, metaCentre, 0);

  /* ---------------- Keyline ---------------- */

  if (F.borderWidth > 0) {
    ctx.strokeStyle = F.colors.border;
    ctx.lineWidth = F.borderWidth;
    roundRectPath(
      ctx,
      F.borderWidth / 2,
      F.borderWidth / 2,
      width - F.borderWidth,
      height - F.borderWidth,
      F.cornerRadius,
    );
    ctx.stroke();
  }

  /* ---------------- Export ---------------- */

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", F.exportQuality),
  );
  if (!blob) throw new Error("Could not build the image");

  return { url: URL.createObjectURL(blob), blob, width, height };
}