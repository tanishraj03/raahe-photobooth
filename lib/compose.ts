"use client";

import {
  EVENT,
  LOGO_FALLBACK_TEXT,
  LOGO_SOURCES,
} from "@/lib/config/event";
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
  const B = FRAME.brand;
  try {
    await Promise.all([
      document.fonts.load(`800 ${B.nameSize}px ${primary}`),
      document.fonts.load(`600 ${B.venueSize}px ${primary}`),
      document.fonts.load(`700 ${B.dateSize}px ${primary}`),
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
 * which case the column falls back to the brand name set in type —
 * we never draw an invented stand-in for the Raahe logo.
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
 * Draws the three photos into the branded 4:5 poster and returns it
 * as a JPEG. Runs entirely in the browser — no photo ever leaves the
 * device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const P = F.poster;
  const S = F.strip;
  const B = F.brand;
  const stack = fontStack();

  const [images, logo] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    loadLogo(),
    waitForFont(stack),
  ]);

  const width = P.width;
  const height = P.height;
  const count = Math.max(1, images.length);

  /* ---------------- Strip card ---------------- */

  // The card is sized by whichever runs out first: the height of the
  // poster, or the share of its width the card is allowed to take.
  const gaps = S.photoGap * (count - 1);
  const cellFromHeight = Math.floor(
    (height - P.margin * 2 - S.pad * 2 - gaps) / count,
  );
  const widthCap = Math.round(width * 0.56) - S.pad * 2;

  const cellWidth = Math.max(
    80,
    Math.min(Math.round(cellFromHeight * F.cellAspect), widthCap),
  );
  const cellHeight = Math.round(cellWidth / F.cellAspect);

  const cardWidth = cellWidth + S.pad * 2;
  const cardHeight = cellHeight * count + gaps + S.pad * 2;
  const cardX = P.margin;
  const cardY = Math.round((height - cardHeight) / 2);

  /* ---------------- Event column ---------------- */

  const colX = cardX + cardWidth + P.columnGap;
  const colWidth = width - colX - P.margin;

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

  // A faint dot field, so the empty space reads as paper rather than
  // as a mistake.
  if (P.dotSize > 0) {
    ctx.fillStyle = F.colors.dot;
    for (let y = P.dotSpacing / 2; y < height; y += P.dotSpacing) {
      for (let x = P.dotSpacing / 2; x < width; x += P.dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, P.dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ---------------- The card ---------------- */

  ctx.fillStyle = F.colors.card;
  roundRectPath(ctx, cardX, cardY, cardWidth, cardHeight, S.radius);
  ctx.fill();

  if (S.borderWidth > 0) {
    ctx.strokeStyle = F.colors.cardBorder;
    ctx.lineWidth = S.borderWidth;
    roundRectPath(
      ctx,
      cardX + S.borderWidth / 2,
      cardY + S.borderWidth / 2,
      cardWidth - S.borderWidth,
      cardHeight - S.borderWidth,
      S.radius,
    );
    ctx.stroke();
  }

  /* ---------------- Photos ---------------- */

  images.forEach((image, index) => {
    const y = cardY + S.pad + index * (cellHeight + S.photoGap);

    ctx.save();
    roundRectPath(ctx, cardX + S.pad, y, cellWidth, cellHeight, S.photoRadius);
    ctx.clip();

    // Something dark behind, so a slow-loading photo never shows white.
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(cardX + S.pad, y, cellWidth, cellHeight);

    // The photo is already the right shape, so this is a clean fill.
    ctx.drawImage(image, cardX + S.pad, y, cellWidth, cellHeight);
    ctx.restore();
  });

  /* ---------------- Sprockets ---------------- */

  const sprocket = S.sprocket;
  if (sprocket.enabled && sprocket.width > 0) {
    const step = sprocket.height + sprocket.gap;
    const span = cardHeight - S.pad;
    const runs = Math.max(1, Math.floor((span + sprocket.gap) / step));
    const runHeight = runs * step - sprocket.gap;
    const firstY = cardY + (cardHeight - runHeight) / 2;
    const inset = (S.pad - sprocket.width) / 2;

    ctx.fillStyle = F.colors.sprocket;
    for (let i = 0; i < runs; i++) {
      const y = firstY + i * step;
      for (const x of [
        cardX + inset,
        cardX + cardWidth - S.pad + inset,
      ]) {
        roundRectPath(
          ctx,
          x,
          y,
          sprocket.width,
          sprocket.height,
          sprocket.radius,
        );
        ctx.fill();
      }
    }
  }

  /* ---------------- Date, on the top edge of the strip ---------------- */

  const dateSize = fitSize(
    ctx,
    EVENT.date,
    700,
    B.dateSize,
    B.dateTracking,
    colWidth,
    stack,
  );
  ctx.font = `700 ${dateSize}px ${stack}`;
  ctx.fillStyle = F.colors.date;
  drawText(ctx, EVENT.date, colX, cardY + dateSize / 2, dateSize * B.dateTracking);

  /* ---------------- Venue, measured first ---------------- */

  // Measured before the name is placed, because the mark, the name,
  // the rule and the venue hang together off the card's bottom edge.
  const venue = EVENT.venue.toUpperCase();
  let venueSize: number = B.venueSize;
  for (const word of venue.split(/\s+/)) {
    venueSize = Math.min(
      venueSize,
      fitSize(ctx, word, 600, venueSize, B.venueTracking, colWidth, stack),
    );
  }
  ctx.font = `600 ${venueSize}px ${stack}`;
  const venueLines = wrapText(
    ctx,
    venue,
    colWidth,
    venueSize * B.venueTracking,
  );
  const venueHeight =
    venueLines.length * venueSize + (venueLines.length - 1) * B.venueLineGap;

  const tailHeight =
    B.ruleGapTop + B.ruleHeight + B.ruleGapBottom + venueHeight;

  /* ---------------- Event name ---------------- */

  const name = EVENT.name.toLowerCase();
  let nameSize: number = B.nameSize;
  for (const word of name.split(/\s+/)) {
    nameSize = Math.min(
      nameSize,
      fitSize(ctx, word, 800, nameSize, B.nameTracking, colWidth, stack),
    );
  }

  // Room the name has between the date at the top of the column and
  // the rest of the block below it.
  const nameRoom =
    cardHeight - dateSize - 40 - B.logoHeight - B.logoGap - tailHeight;

  ctx.font = `800 ${nameSize}px ${stack}`;
  let nameLines = wrapText(ctx, name, colWidth, nameSize * B.nameTracking);
  while (
    nameLines.length * nameSize * B.nameLineHeight > nameRoom &&
    nameSize > 22
  ) {
    nameSize = Math.floor(nameSize * 0.92);
    ctx.font = `800 ${nameSize}px ${stack}`;
    nameLines = wrapText(ctx, name, colWidth, nameSize * B.nameTracking);
  }

  const lineHeight = Math.round(nameSize * B.nameLineHeight);
  const nameHeight = lineHeight * nameLines.length;

  /* ---------------- Draw the block, hung off the card's foot ------ */

  const blockTop =
    cardY + cardHeight - (B.logoHeight + B.logoGap + nameHeight + tailHeight);

  if (logo) {
    const logoWidth = Math.round(
      (logo.naturalWidth / logo.naturalHeight) * B.logoHeight,
    );
    ctx.drawImage(
      logo,
      colX,
      blockTop,
      Math.min(logoWidth, colWidth),
      B.logoHeight,
    );
  } else {
    // Same typographic fallback the on-screen mark uses. Never a
    // redrawn approximation of the logo itself.
    const size = Math.round(B.logoHeight * 0.78);
    ctx.font = `800 ${size}px ${stack}`;
    ctx.fillStyle = F.colors.title;
    drawText(
      ctx,
      LOGO_FALLBACK_TEXT,
      colX,
      blockTop + B.logoHeight / 2,
      size * -0.03,
    );
  }

  const nameTop = blockTop + B.logoHeight + B.logoGap;

  ctx.font = `800 ${nameSize}px ${stack}`;
  ctx.fillStyle = F.colors.title;
  nameLines.forEach((line, index) => {
    drawText(
      ctx,
      line,
      colX,
      nameTop + index * lineHeight + lineHeight / 2,
      nameSize * B.nameTracking,
    );
  });

  const ruleY = nameTop + nameHeight + B.ruleGapTop;
  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(colX, ruleY, colWidth, B.ruleHeight);

  ctx.font = `600 ${venueSize}px ${stack}`;
  ctx.fillStyle = F.colors.venue;
  const venueTop = ruleY + B.ruleHeight + B.ruleGapBottom;
  venueLines.forEach((line, index) => {
    drawText(
      ctx,
      line,
      colX,
      venueTop + index * (venueSize + B.venueLineGap) + venueSize / 2,
      venueSize * B.venueTracking,
    );
  });

  /* ---------------- Crop marks ---------------- */

  if (P.cropMarks) {
    const L = P.cropMarkLength;
    const inset = P.cropMarkInset;
    ctx.strokeStyle = F.colors.cropMark;
    ctx.lineWidth = P.cropMarkWidth;
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
