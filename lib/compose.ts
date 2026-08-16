"use client";

import { EVENT, LOGO_FALLBACK_TEXT, LOGO_SOURCES } from "@/lib/config/event";
import { FRAME } from "@/lib/config/frame";
import { DRAWINGS, paintCable, paintDrawing } from "@/lib/illustrations";

/* ================================================================
   TYPE HELPERS

   Canvas text needs more care than CSS text. Two things matter:
   the brand font has to be loaded before we draw with it, and
   letter spacing has to work on browsers that don't support
   ctx.letterSpacing — the tracked venue line is a big part of how
   the strip reads, so it can't quietly collapse.
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
 * the image is the trim of the print, and the borders either side of
 * the photos are the strip's own borders, with the cable and the
 * drawings running through them.
 *
 * Runs entirely in the browser — no photo ever leaves the device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const P = F.poster;
  const G = F.ground;
  const A = F.art;
  const H = F.head;
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

     Everything falls out of two numbers: how wide the border is, and
     how tall a photo is at that width. What's left over after three
     of them splits between the head and the foot. */

  const cellWidth = width - P.border * 2;
  const cellHeight = Math.round(cellWidth / F.cellAspect);
  const photosHeight = cellHeight * count + P.photoGap * (count - 1);

  const spare = Math.max(0, height - photosHeight);
  const headHeight = Math.round(spare * P.headShare);
  const photoTop = headHeight;
  const footTop = photoTop + photosHeight;
  const footHeight = height - footTop;

  const centreX = width / 2;

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

  if (G.dotSize > 0) {
    ctx.fillStyle = F.colors.dot;
    for (let y = G.dotSpacing / 2; y < height; y += G.dotSpacing) {
      for (let x = G.dotSpacing / 2; x < width; x += G.dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, G.dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ---------------- The borders ----------------

     Cable first, drawings over it, so a lead reads as running behind
     the thing it's plugged into. */

  if (A.enabled) {
    const cableTop = photoTop - 24;
    const cableRun = photosHeight + 48;

    for (const [x, phase] of [
      [P.border / 2, 0],
      [width - P.border / 2, 1],
    ] as const) {
      paintCable(ctx, x, cableTop, cableRun, {
        colour: inks.pink,
        width: A.cable.width,
        sway: A.cable.sway,
        alpha: A.cable.alpha,
        glow: A.glow,
        phase,
      });
    }

    /*
     * Each drawing is centred in its lane and clamped so it can
     * never spill onto a photo. A turned drawing swaps its footprint
     * — that's the point of turning it, so a wide object can fill a
     * narrow lane instead of shrinking to nothing in it.
     */
    const place = (
      items: readonly { name: string; height: number; turn?: number }[],
      laneLeft: number,
      spread: number[],
    ) => {
      items.forEach((item, index) => {
        const box = DRAWINGS[item.name]?.box;
        if (!box) return;

        const turned = item.turn === 90 || item.turn === -90;
        const room = P.border - 10;

        // Footprint on the strip, before it's clamped to the lane.
        let visualHeight = item.height;
        let visualWidth = turned
          ? (box[1] / box[0]) * visualHeight
          : (box[0] / box[1]) * visualHeight;

        if (visualWidth > room) {
          const shrink = room / visualWidth;
          visualWidth = room;
          visualHeight *= shrink;
        }

        // paintDrawing wants the drawing's own height and rotates
        // about the centre of the box it's given — so for a turned
        // drawing the two simply swap.
        const drawHeight = turned ? visualWidth : visualHeight;
        const drawWidth = (box[0] / box[1]) * drawHeight;

        const centreLane = laneLeft + P.border / 2;
        const centreY = photoTop + photosHeight * spread[index];

        paintDrawing(
          ctx,
          item.name,
          centreLane - drawWidth / 2,
          centreY - drawHeight / 2,
          drawHeight,
          {
            inks,
            glow: A.glow,
            rotate: item.turn ? (item.turn * Math.PI) / 180 : undefined,
          },
        );
      });
    };

    place(A.leftBorder, 0, [0.14, 0.5, 0.86]);
    place(A.rightBorder, width - P.border, [0.17, 0.52, 0.87]);
  }

  /* ---------------- Head ---------------- */

  if (A.enabled) {
    if (DRAWINGS[A.head.name]) {
      const h = Math.min(A.head.height, headHeight - 56);
      paintDrawing(ctx, A.head.name, 26, (headHeight - 34 - h) / 2, h, {
        inks,
        glow: A.glow,
      });
    }
  }

  const cap = `${LOGO_FALLBACK_TEXT} · photobooth`.toUpperCase();
  const capSize = fitSize(
    ctx,
    cap,
    600,
    H.capSize,
    H.capTracking,
    width * 0.52,
    stack,
  );
  ctx.font = `600 ${capSize}px ${stack}`;
  ctx.fillStyle = F.colors.cap;
  const capTracking = capSize * H.capTracking;
  const capWidth = measure(ctx, cap, capTracking);
  drawText(
    ctx,
    cap,
    width - 40 - capWidth,
    (headHeight - 34) / 2,
    capTracking,
  );

  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(40, headHeight - 26, width - 80, P.ruleHeight);

  /* ---------------- Photos ---------------- */

  images.forEach((image, index) => {
    const y = photoTop + index * (cellHeight + P.photoGap);

    ctx.save();
    roundRectPath(ctx, P.border, y, cellWidth, cellHeight, P.photoRadius);
    ctx.clip();

    // Something dark behind, so a slow-loading photo never shows white.
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(P.border, y, cellWidth, cellHeight);

    // The photo is already the right shape, so this is a clean fill.
    ctx.drawImage(image, P.border, y, cellWidth, cellHeight);
    ctx.restore();

    if (P.photoKeyline > 0) {
      ctx.strokeStyle = F.colors.photoKeyline;
      ctx.lineWidth = P.photoKeyline;
      roundRectPath(
        ctx,
        P.border + P.photoKeyline / 2,
        y + P.photoKeyline / 2,
        cellWidth - P.photoKeyline,
        cellHeight - P.photoKeyline,
        P.photoRadius,
      );
      ctx.stroke();
    }

    // The frame number, set on its side against the photo's edge.
    ctx.save();
    ctx.translate(P.border - 16, y + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `700 ${H.indexSize}px ${stack}`;
    ctx.fillStyle = F.colors.index;
    drawText(
      ctx,
      String(index + 1).padStart(2, "0"),
      0,
      0,
      H.indexSize * H.indexTracking,
    );
    ctx.restore();
  });

  /* ---------------- Foot ---------------- */

  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(40, footTop + 22, width - 80, P.ruleHeight);

  const name = EVENT.name.toLowerCase();
  const nameSize = fitSize(
    ctx,
    name,
    800,
    Ft.nameSize,
    Ft.nameTracking,
    cellWidth,
    stack,
  );
  const nameLine = Math.round(nameSize * Ft.nameLineHeight);

  const venue = EVENT.venue.toUpperCase();
  let venueSize: number = Ft.venueSize;
  for (const word of venue.split(/\s+/)) {
    venueSize = Math.min(
      venueSize,
      fitSize(ctx, word, 600, venueSize, Ft.venueTracking, cellWidth, stack),
    );
  }
  ctx.font = `600 ${venueSize}px ${stack}`;
  const venueLines = wrapText(ctx, venue, cellWidth, venueSize * Ft.venueTracking);
  const venueHeight =
    venueLines.length * venueSize + (venueLines.length - 1) * Ft.venueLineGap;

  const dateSize = fitSize(
    ctx,
    EVENT.date,
    700,
    Ft.dateSize,
    Ft.dateTracking,
    cellWidth,
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

  // Centred in what the foot has left under its rule.
  const blockTop = footTop + 40 + (footHeight - 64 - blockHeight) / 2;
  let cursor = blockTop;

  if (logo) {
    const logoWidth = Math.round(
      (logo.naturalWidth / logo.naturalHeight) * Ft.logoHeight,
    );
    ctx.drawImage(
      logo,
      Math.round(centreX - Math.min(logoWidth, cellWidth) / 2),
      cursor,
      Math.min(logoWidth, cellWidth),
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
