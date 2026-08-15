"use client";

import { FRAME, PHOTO_HEIGHT } from "@/lib/config/frame";
import type { Filter } from "@/lib/filters";

/* ================================================================
   CANVAS FILTER SUPPORT
   Modern browsers can apply a CSS filter string straight to a
   canvas. A few older ones can't, and if we ignored that the
   preview would look filtered while the saved photo did not.
   So we check once, and fall back to doing the maths ourselves.
   ================================================================ */

let canvasFilterSupport: boolean | null = null;

function supportsCanvasFilter(): boolean {
  if (canvasFilterSupport !== null) return canvasFilterSupport;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return (canvasFilterSupport = false);
    ctx.filter = "grayscale(1)";
    canvasFilterSupport = ctx.filter !== "none" && ctx.filter !== "";
  } catch {
    canvasFilterSupport = false;
  }
  return canvasFilterSupport;
}

/* ---------------- Manual fallback ---------------- */

type Op = { fn: string; amount: number };

/** Turns "sepia(0.5) contrast(1.12)" into a list we can apply by hand. */
function parseFilter(css: string): Op[] {
  const ops: Op[] = [];
  const pattern = /([a-z-]+)\(([-0-9.]+)(%?)\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const value = parseFloat(match[2]);
    ops.push({ fn: match[1], amount: match[3] === "%" ? value / 100 : value });
  }
  return ops;
}

const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

function applyFilterByHand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  css: string,
) {
  const ops = parseFilter(css);
  if (!ops.length) return;

  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] / 255;
    let g = px[i + 1] / 255;
    let b = px[i + 2] / 255;

    for (const { fn, amount: a } of ops) {
      if (fn === "brightness") {
        r *= a;
        g *= a;
        b *= a;
      } else if (fn === "contrast") {
        r = (r - 0.5) * a + 0.5;
        g = (g - 0.5) * a + 0.5;
        b = (b - 0.5) * a + 0.5;
      } else if (fn === "saturate" || fn === "grayscale") {
        // grayscale(1) is saturate(0), so they share one path.
        const s = fn === "grayscale" ? 1 - a : a;
        const lum = LUM_R * r + LUM_G * g + LUM_B * b;
        r = lum + (r - lum) * s;
        g = lum + (g - lum) * s;
        b = lum + (b - lum) * s;
      } else if (fn === "sepia") {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * a;
        g += (sg - g) * a;
        b += (sb - b) * a;
      }
    }

    px[i] = Math.max(0, Math.min(255, r * 255));
    px[i + 1] = Math.max(0, Math.min(255, g * 255));
    px[i + 2] = Math.max(0, Math.min(255, b * 255));
  }

  ctx.putImageData(image, 0, 0);
}

/* ================================================================
   CAPTURE
   ================================================================ */

/**
 * Takes the current video frame and returns it as a JPEG data URL.
 *
 * Crops to the shape defined in FRAME rather than squashing, so
 * nobody comes out stretched. Mirrors to match what was on screen.
 */
export function captureFrame(
  video: HTMLVideoElement,
  filter: Filter,
  mirrored: boolean,
): string | null {
  const sourceW = video.videoWidth;
  const sourceH = video.videoHeight;
  if (!sourceW || !sourceH) return null;

  const width = FRAME.photoWidth;
  const height = PHOTO_HEIGHT;
  const targetAspect = width / height;

  // Cover crop: fill the frame from the centre, keep the proportions.
  let cropW = sourceW;
  let cropH = sourceH;
  if (sourceW / sourceH > targetAspect) {
    cropW = sourceH * targetAspect;
  } else {
    cropH = sourceW / targetAspect;
  }
  const cropX = (sourceW - cropW) / 2;
  const cropY = (sourceH - cropH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  ctx.imageSmoothingQuality = "high";

  const useNativeFilter = supportsCanvasFilter();

  ctx.save();
  if (mirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  if (useNativeFilter && filter.css) ctx.filter = filter.css;
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, width, height);
  ctx.restore();
  ctx.filter = "none";

  if (!useNativeFilter && filter.css) {
    applyFilterByHand(ctx, width, height, filter.css);
  }

  // The colour wash sits on top, exactly like the preview overlay.
  if (filter.tint) {
    ctx.save();
    ctx.globalCompositeOperation = filter.tint.blend;
    ctx.globalAlpha = filter.tint.alpha;
    ctx.fillStyle = filter.tint.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", FRAME.photoQuality);
}