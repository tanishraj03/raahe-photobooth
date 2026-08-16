"use client";

import { EVENT, LOGO_FALLBACK_TEXT, LOGO_SOURCES } from "@/lib/config/event";
import { FRAME } from "@/lib/config/frame";


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

/** Artwork for a border, if any has been supplied. */
async function loadArt(src: string): Promise<HTMLImageElement | null> {
  try {
    const image = await loadImage(src);
    return image.naturalWidth > 0 ? image : null;
  } catch {
    // Nothing there. The strip is designed to look finished without it.
    return null;
  }
}

/**
 * Draws the three photos into the strip and returns it as a JPEG.
 *
 * The canvas *is* the strip — 1080 × 1920 of it, edge to edge. There
 * is no story background and nothing floating on one: the trim of
 * the image is the trim of the print.
 *
 * Runs entirely in the browser — no photo ever leaves the device.
 */
export async function composeStrip(photos: string[]): Promise<Strip> {
  const F = FRAME;
  const P = F.poster;
  const G = F.ground;
  const B = F.border;
  const H = F.head;
  const Ft = F.foot;
  const stack = fontStack();

  const [images, logo, artLeft, artRight] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    loadLogo(),
    loadArt(F.art.left),
    loadArt(F.art.right),
    waitForFont(stack),
  ]);

  const width = P.width;
  const height = P.height;
  const count = Math.max(1, images.length);

  /* ---------------- Layout ---------------- */

  const cellWidth = Math.min(P.photoWidth, width - 80);
  const cellHeight = Math.round(cellWidth / F.cellAspect);
  const border = (width - cellWidth) / 2;
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

  ctx.fillStyle = F.colors.background;
  ctx.fillRect(0, 0, width, height);

  /* ---------------- Head ---------------- */

  const cap = LOGO_FALLBACK_TEXT.toUpperCase();
  const capSize = fitSize(
    ctx,
    cap,
    600,
    H.capSize,
    H.capTracking,
    width * 0.6,
    stack,
  );
  ctx.font = `600 ${capSize}px ${stack}`;
  ctx.fillStyle = F.colors.cap;
  drawCentred(ctx, cap, centreX, headHeight / 2 - 12, capSize * H.capTracking);

  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(border, headHeight - 30, cellWidth, P.ruleHeight);

  /* ---------------- Borders ----------------

     Quiet by design: a line of tracked type on its side, the frame
     numbers, and any artwork that's been supplied. Nothing invented
     to fill the space. */

  if (artLeft || artRight) {
    const artWidth = border * F.art.widthShare;
    for (const [art, x] of [
      [artLeft, (border - artWidth) / 2],
      [artRight, width - border + (border - artWidth) / 2],
    ] as const) {
      if (!art) continue;
      const artHeight = (art.naturalHeight / art.naturalWidth) * artWidth;
      ctx.save();
      ctx.globalAlpha = F.art.alpha;
      ctx.drawImage(
        art,
        x,
        photoTop + (photosHeight - artHeight) / 2,
        artWidth,
        artHeight,
      );
      ctx.restore();
    }
  } else if (B.sideText) {
    // A different line each side, each reading in the direction you'd
    // turn the print to read it. Same line twice would be wallpaper;
    // one line and one empty lane looks unfinished.
    const tracking = B.sideSize * B.sideTracking;
    ctx.font = `600 ${B.sideSize}px ${stack}`;
    ctx.fillStyle = F.colors.sideText;

    const runs = [
      { text: EVENT.name.toUpperCase(), x: border / 2, up: true },
      {
        text: `${EVENT.venue} · ${EVENT.date}`.toUpperCase(),
        x: width - border / 2,
        up: false,
      },
    ];

    for (const run of runs) {
      const runWidth = measure(ctx, run.text, tracking);
      const middle = photoTop + photosHeight / 2;
      ctx.save();
      if (run.up) {
        ctx.translate(run.x, middle + runWidth / 2);
        ctx.rotate(-Math.PI / 2);
      } else {
        ctx.translate(run.x, middle - runWidth / 2);
        ctx.rotate(Math.PI / 2);
      }
      drawText(ctx, run.text, 0, 0, tracking);
      ctx.restore();
    }
  }

  /* ---------------- Photos ---------------- */

  images.forEach((image, index) => {
    const y = photoTop + index * (cellHeight + P.photoGap);

    ctx.save();
    roundRectPath(ctx, border, y, cellWidth, cellHeight, P.photoRadius);
    ctx.clip();
    ctx.fillStyle = F.colors.photoWell;
    ctx.fillRect(border, y, cellWidth, cellHeight);
    ctx.drawImage(image, border, y, cellWidth, cellHeight);
    ctx.restore();

    if (P.photoKeyline > 0) {
      ctx.strokeStyle = F.colors.photoKeyline;
      ctx.lineWidth = P.photoKeyline;
      roundRectPath(
        ctx,
        border + P.photoKeyline / 2,
        y + P.photoKeyline / 2,
        cellWidth - P.photoKeyline,
        cellHeight - P.photoKeyline,
        P.photoRadius,
      );
      ctx.stroke();
    }

    if (B.numbers) {
      ctx.font = `700 ${B.numberSize}px ${stack}`;
      ctx.fillStyle = F.colors.number;
      const label = String(index + 1).padStart(2, "0");
      const tracking = B.numberSize * B.numberTracking;
      const labelWidth = measure(ctx, label, tracking);
      drawText(ctx, label, border - 24 - labelWidth, y + 18, tracking);
    }
  });

  /* ---------------- Foot ----------------

     The mark and the name are one lockup, set side by side and
     sized against each other. */

  ctx.fillStyle = F.colors.rule;
  ctx.fillRect(border, footTop + 28, cellWidth, P.ruleHeight);

  const name = EVENT.name.toLowerCase();
  const logoWidth = logo
    ? Math.round((logo.naturalWidth / logo.naturalHeight) * Ft.logoHeight)
    : 0;
  const lockupRoom = width - 80 - logoWidth - (logo ? Ft.lockupGap : 0);

  const nameSize = fitSize(
    ctx,
    name,
    800,
    Ft.nameSize,
    Ft.nameTracking,
    lockupRoom,
    stack,
  );
  ctx.font = `800 ${nameSize}px ${stack}`;
  const nameWidth = measure(ctx, name, nameSize * Ft.nameTracking);
  const lockupWidth = logo
    ? logoWidth + Ft.lockupGap + nameWidth
    : Math.max(nameWidth, 0);
  const lockupHeight = Math.max(Ft.logoHeight, nameSize);

  const venue = EVENT.venue.toUpperCase();
  let venueSize: number = Ft.venueSize;
  for (const word of venue.split(/\s+/)) {
    venueSize = Math.min(
      venueSize,
      fitSize(ctx, word, 600, venueSize, Ft.venueTracking, width - 120, stack),
    );
  }
  ctx.font = `600 ${venueSize}px ${stack}`;
  const venueLines = wrapText(
    ctx,
    venue,
    width - 120,
    venueSize * Ft.venueTracking,
  );
  const venueHeight =
    venueLines.length * venueSize + (venueLines.length - 1) * Ft.venueLineGap;

  const dateSize = fitSize(
    ctx,
    EVENT.date,
    700,
    Ft.dateSize,
    Ft.dateTracking,
    width - 120,
    stack,
  );

  const blockHeight =
    lockupHeight + Ft.lockupGapBottom + venueHeight + Ft.venueGap + dateSize;
  // Sits under the rule, with the space left over shared above and
  // below so the date never crowds the trim.
  let cursor = footTop + 52 + (footHeight - 96 - blockHeight) / 2;

  const lockupLeft = centreX - lockupWidth / 2;
  const lockupMiddle = cursor + lockupHeight / 2;

  if (logo) {
    ctx.drawImage(
      logo,
      Math.round(lockupLeft),
      Math.round(lockupMiddle - Ft.logoHeight / 2),
      logoWidth,
      Ft.logoHeight,
    );
  }

  ctx.font = `800 ${nameSize}px ${stack}`;
  ctx.fillStyle = F.colors.title;
  drawText(
    ctx,
    name,
    logo ? lockupLeft + logoWidth + Ft.lockupGap : lockupLeft,
    lockupMiddle,
    nameSize * Ft.nameTracking,
  );
  cursor += lockupHeight + Ft.lockupGapBottom;

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
