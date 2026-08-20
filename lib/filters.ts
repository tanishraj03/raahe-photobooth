/**
 * FILTERS
 * ----------------------------------------------------------------
 * Each filter is three things, layered in this order:
 *
 *   1. `css`     tone — brightness, contrast, saturation, sepia
 *   2. `washes`  colour — flat tints, light leaks, vignettes, bloom
 *   3. `grain`   texture — film noise
 *
 * All three are described once here and rendered by shared code, so
 * the live preview, the picker chip and the captured photo can't
 * disagree. See lib/washes.ts and lib/grain.ts.
 *
 * Two rules when adding one:
 *
 *   · Only use CSS functions that lib/capture.ts can also do by
 *     hand: brightness, contrast, saturate, grayscale, sepia. That
 *     fallback is what keeps older browsers honest.
 *   · No blur. Blur is measured in CSS pixels, so a value tuned on a
 *     360px preview is nearly invisible on the 1080px capture, and
 *     the preview would lie.
 */

import type { Wash } from "@/lib/washes";

export type Filter = {
  id: string;
  /** Shown under the chip. One short word. */
  name: string;
  /** CSS filter string. Empty means untouched. */
  css: string;
  /** Colour layers, painted in order. */
  washes?: Wash[];
  /** Film grain opacity, 0 to 1. */
  grain?: number;
};

/* Brand palette. Violet, mindaro and orange are filter-only colours. */
const PINK = "#F04E98";
const VIOLET = "#7D55C7";
const MINDARO = "#D4EB8E";
const ORANGE = "#FF6A13";
const INK = "#212121";
const PAPER = "#F4F5F5";

/** Darkened edges — the single most flattering thing you can do. */
const vignette = (strength: number, from = 0.42): Wash => ({
  kind: "radial",
  stops: [
    { at: from, color: "rgba(0,0,0,0)" },
    { at: 1, color: `rgba(0,0,0,${strength})` },
  ],
  alpha: 1,
  blend: "normal",
});

/** Colour spilling in from one corner, like a light leak on film. */
const leak = (
  color: string,
  angle: number,
  strength: number,
  reach = 0.6,
): Wash => ({
  kind: "linear",
  angle,
  stops: [
    { at: 0, color },
    { at: reach, color: "rgba(0,0,0,0)" },
  ],
  alpha: strength,
  blend: "screen",
});

export const FILTERS: Filter[] = [
  {
    id: "original",
    name: "Original",
    css: "",
  },
  {
    id: "noir",
    name: "Noir",
    css: "grayscale(1) contrast(1.42) brightness(0.96)",
    washes: [vignette(0.52, 0.35)],
    grain: 0.3,
  },
  {
    id: "mono",
    name: "Mono",
    css: "grayscale(1) contrast(1.04) brightness(1.06)",
  },
  {
    id: "punch",
    name: "Punch",
    css: "saturate(1.34) contrast(1.16)",
    washes: [vignette(0.2, 0.6)],
  },
  {
    id: "neon",
    name: "Neon",
    css: "saturate(1.55) contrast(1.2)",
    washes: [
      {
        kind: "linear",
        angle: 145,
        stops: [
          { at: 0, color: "rgba(240,78,152,0.85)" },
          { at: 0.55, color: "rgba(125,85,199,0.35)" },
          { at: 1, color: "rgba(125,85,199,0.7)" },
        ],
        alpha: 0.2,
        blend: "overlay",
      },
      vignette(0.28, 0.55),
    ],
  },
  {
    id: "golden",
    name: "Golden",
    css: "saturate(1.28) contrast(1.04) brightness(1.04)",
    washes: [
      leak("rgba(255,106,19,0.62)", 145, 0.55, 0.58),
      { kind: "solid", color: ORANGE, alpha: 0.1, blend: "soft-light" },
      vignette(0.22, 0.6),
    ],
    grain: 0.14,
  },
  {
    id: "dreamy",
    name: "Dreamy",
    css: "saturate(1.2) brightness(1.06) contrast(0.9)",
    washes: [
      {
        kind: "radial",
        stops: [
          { at: 0, color: "rgba(255,255,255,0.3)" },
          { at: 0.72, color: "rgba(255,255,255,0)" },
        ],
        alpha: 1,
        blend: "screen",
      },
      { kind: "solid", color: PINK, alpha: 0.13, blend: "soft-light" },
    ],
  },
  {
    id: "fade",
    name: "Fade",
    css: "contrast(0.82) saturate(0.86) brightness(1.08)",
    washes: [{ kind: "solid", color: PAPER, alpha: 0.1, blend: "screen" }],
    grain: 0.2,
  },
  {
    id: "retro",
    name: "Retro",
    css: "sepia(0.3) contrast(0.95) saturate(1.14) brightness(1.05)",
    washes: [
      { kind: "solid", color: MINDARO, alpha: 0.12, blend: "soft-light" },
      leak("rgba(255,106,19,0.5)", 30, 0.4, 0.5),
      vignette(0.3),
    ],
    grain: 0.3,
  },
  {
    id: "vinyl",
    name: "Vinyl",
    css: "sepia(0.44) contrast(1.14) saturate(1.08)",
    washes: [
      { kind: "solid", color: ORANGE, alpha: 0.1, blend: "soft-light" },
      vignette(0.36),
    ],
    grain: 0.34,
  },
  {
    id: "encore",
    name: "Encore",
    css: "sepia(0.2) saturate(1.14) contrast(1.2) brightness(0.93)",
    washes: [
      { kind: "solid", color: INK, alpha: 0.15, blend: "multiply" },
      vignette(0.42),
    ],
    grain: 0.24,
  },
  {
    id: "afterhours",
    name: "Afterhours",
    css: "saturate(1.06) contrast(1.16) brightness(0.95)",
    washes: [
      { kind: "solid", color: VIOLET, alpha: 0.22, blend: "soft-light" },
      leak("rgba(240,78,152,0.55)", 215, 0.4, 0.55),
      vignette(0.46),
    ],
    grain: 0.16,
  },
  {
    id: "duo",
    name: "Duo",
    css: "grayscale(1) contrast(1.22) brightness(1.02)",
    washes: [
      { kind: "solid", color: VIOLET, alpha: 0.46, blend: "multiply" },
      { kind: "solid", color: PINK, alpha: 0.3, blend: "screen" },
      vignette(0.3),
    ],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    css: "contrast(1.2) brightness(1.04) saturate(1.06)",
    washes: [
      {
        kind: "radial",
        stops: [
          { at: 0, color: "rgba(255,255,255,0.18)" },
          { at: 0.5, color: "rgba(255,255,255,0)" },
        ],
        alpha: 1,
        blend: "screen",
      },
      vignette(0.62, 0.3),
    ],
    grain: 0.12,
  },
];

export const DEFAULT_FILTER_ID = "original";

export function getFilter(id: string): Filter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/**
 * Shown on a filter chip until the camera is live. A light-to-dark
 * ramp with a skin tone in the middle, so a filter applied to it
 * reads honestly. Once the camera is running the chips switch to a
 * still of your actual face.
 */
export const SWATCH_GRADIENT =
  "linear-gradient(140deg, #F7F2EC 0%, #D8A87C 42%, #7A4B33 72%, #1C1C1C 100%)";