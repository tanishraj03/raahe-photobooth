"use client";

import { EVENT, LOGO_FALLBACK_TEXT, LOGO_SOURCES } from "@/lib/config/event";
import { FRAME } from "@/lib/config/frame";
import { paintMotif } from "@/lib/motifs";

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
  const F = FRAME.footer;
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
 * Draws the three photos into the branded 9:16 story and returns it
 * as a JPEG. Runs entirely in the browser — no photo ever leaves the
 * device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const P = F.poster;
  const S = F.strip;
  const Ft = F.footer;
  const Mo = F.motifs;
  const Mg = F.margins;
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

     The event block under the photos is reserved at its full size —
     two venue lines, everything at its configured size — before the
     photos are measured. Text only ever shrinks from there, so the
     block can never grow into the pictures. Whatever it doesn't use
     comes back as air around it. */

  const reservedFooter =
    Ft.logoHeight +
    Ft.logoGap +
    Math.round(Ft.nameSize * Ft.nameLineHeight) +
    Ft.nameGap +
    Ft.venueSize * 2 +
    Ft.venueLineGap +
    Ft.venueGap +
    Ft.dateSize;

  const availableHeight = height - P.margin * 2;
  const gaps = S.photoGap * (count - 1);

  const cellHeight = Math.floor(
    (availableHeight -
      S.borderTop -
      S.borderBottom -
      gaps -
      S.footerGap -
      reservedFooter) /
      count,
  );
  const cellWidth = Math.min(
    Math.round(cellHeight * F.cellAspect),
    width - P.margin * 2 - S.borderX * 2,
  );

  const photosHeight = cellHeight * count + gaps;
  const stripWidth = cellWidth + S.borderX * 2;
  const stripHeight =
    S.borderTop +
    photosHeight +
    S.footerGap +
    reservedFooter +
    S.borderBottom;

  const stripX = Math.round((width - stripWidth) / 2);
  const stripY = Math.round((height - stripHeight) / 2);
  const centreX = stripX + stripWidth / 2;
  const photoX = stripX + S.borderX;
  const photoTop = stripY + S.borderTop;

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

  /* ---------------- Margin tickers ----------------

     The event, repeating up the left margin and down the right, so
     the space either side of the strip is doing something. */

  if (Mg.ticker && stripX > Mg.size * 3) {
    const line = `${EVENT.name} · ${EVENT.venue} · ${EVENT.date} · `.toUpperCase();
    const tracking = Mg.size * Mg.tracking;

    ctx.font = `600 ${Mg.size}px ${stack}`;
    ctx.fillStyle = F.colors.marginTicker;
    const runWidth = measure(ctx, line, tracking) + Mg.gap;

    for (const side of [0, 1]) {
      ctx.save();
      if (side === 0) {
        // Up the left.
        ctx.translate(stripX / 2, height);
        ctx.rotate(-Math.PI / 2);
      } else {
        // Down the right.
        ctx.translate(width - stripX / 2, 0);
        ctx.rotate(Math.PI / 2);
      }
      for (let cursor = 0; cursor < height; cursor += runWidth) {
        drawText(ctx, line, cursor, 0, tracking);
      }
      ctx.restore();
    }
  }

  /* ---------------- The strip ---------------- */

  ctx.fillStyle = F.colors.strip;
  roundRectPath(ctx, stripX, stripY, stripWidth, stripHeight, S.radius);
  ctx.fill();

  if (S.keyline > 0) {
    ctx.strokeStyle = F.colors.keyline;
    ctx.lineWidth = S.keyline;
    roundRectPath(
      ctx,
      stripX + S.keyline / 2,
      stripY + S.keyline / 2,
      stripWidth - S.keyline,
      stripHeight - S.keyline,
      S.radius,
    );
    ctx.stroke();
  }

  /* ---------------- Cap line along the top border ---------------- */

  const cap = LOGO_FALLBACK_TEXT.toUpperCase();
  const capSize = fitSize(
    ctx,
    cap,
    600,
    S.capSize,
    S.capTracking,
    cellWidth,
    stack,
  );
  ctx.font = `600 ${capSize}px ${stack}`;
  ctx.fillStyle = F.colors.cap;
  drawCentred(
    ctx,
    cap,
    centreX,
    stripY + S.borderTop / 2,
    capSize * S.capTracking,
  );

  /* ---------------- Photos ---------------- */

  images.forEach((image, index) => {
    const y = photoTop + index * (cellHeight + S.photoGap);

    ctx.save();
    roundRectPath(ctx, photoX, y, cellWidth, cellHeight, S.photoRadius);
    ctx.clip();

    // Something dark behind, so a slow-loading photo never shows white.
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(photoX, y, cellWidth, cellHeight);

    // The photo is already the right shape, so this is a clean fill.
    ctx.drawImage(image, photoX, y, cellWidth, cellHeight);
    ctx.restore();
  });

  if (S.innerKeyline > 0) {
    ctx.strokeStyle = F.colors.innerKeyline;
    ctx.lineWidth = S.innerKeyline;
    ctx.strokeRect(
      photoX - 0.5,
      photoTop - 0.5,
      cellWidth + 1,
      photosHeight + 1,
    );
  }

  /* ---------------- Motifs down both borders ---------------- */

  if (Mo.enabled && Mo.order.length) {
    const runs = Math.max(1, Math.floor(photosHeight / Mo.step));
    const runHeight = (runs - 1) * Mo.step + Mo.size;
    const first = photoTop + (photosHeight - runHeight) / 2;
    const inset = (S.borderX - Mo.size) / 2;

    for (let i = 0; i < runs; i++) {
      const y = first + i * Mo.step;

      paintMotif(
        ctx,
        Mo.order[i % Mo.order.length],
        stripX + inset,
        y,
        Mo.size,
        F.colors.motif,
        Mo.alpha,
      );
      paintMotif(
        ctx,
        Mo.order[(i + Mo.offset) % Mo.order.length],
        stripX + stripWidth - S.borderX + inset,
        y,
        Mo.size,
        F.colors.motif,
        Mo.alpha,
      );
    }
  }

  /* ---------------- The event, centred under the photos ---------------- */

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

  // Centred in the space held back for it, so anything the text
  // didn't use comes back as air above and below.
  let cursor =
    photoTop +
    photosHeight +
    S.footerGap +
    Math.round((reservedFooter - blockHeight) / 2);

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
