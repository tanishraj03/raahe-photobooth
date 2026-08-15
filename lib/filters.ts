/**
 * FILTERS
 * ----------------------------------------------------------------
 * Each filter is two things:
 *   1. a CSS filter string  (tone: brightness, contrast, saturation)
 *   2. an optional colour wash on top  (mood)
 *
 * Both work identically on the live camera preview and on the
 * captured photo, so what you see is what you get. The tint colours
 * are the Raahe secondary palette — they read as stage lighting.
 *
 * To add a filter, add an entry to the array. Nothing else to change.
 */

/** Blend modes valid in both CSS and canvas. */
export type BlendMode = "multiply" | "screen" | "overlay" | "soft-light";

export type Tint = {
  color: string;
  /** 0 to 1. Keep under ~0.25 or faces go strange. */
  alpha: number;
  blend: BlendMode;
};

export type Filter = {
  id: string;
  /** Shown under the swatch. Keep it one short word. */
  name: string;
  /** CSS filter string. Empty means untouched. */
  css: string;
  tint?: Tint;
};

const PINK = "#F04E98";
const VIOLET = "#7D55C7";
const MINDARO = "#D4EB8E";
const ORANGE = "#FF6A13";
const INK = "#212121";
const PAPER = "#F4F5F5";

export const FILTERS: Filter[] = [
  {
    id: "original",
    name: "Original",
    css: "",
  },
  {
    id: "neon",
    name: "Neon",
    css: "saturate(1.55) contrast(1.22)",
    tint: { color: PINK, alpha: 0.16, blend: "overlay" },
  },
  {
    id: "noir",
    name: "Noir",
    css: "grayscale(1) contrast(1.38) brightness(0.95)",
  },
  {
    id: "vinyl",
    name: "Vinyl",
    css: "sepia(0.5) contrast(1.12) saturate(1.15)",
    tint: { color: ORANGE, alpha: 0.08, blend: "soft-light" },
  },
  {
    id: "golden",
    name: "Golden",
    css: "saturate(1.32) contrast(1.05) brightness(1.05)",
    tint: { color: ORANGE, alpha: 0.14, blend: "soft-light" },
  },
  {
    id: "afterhours",
    name: "Afterhours",
    css: "saturate(1.12) contrast(1.14) brightness(0.97)",
    tint: { color: VIOLET, alpha: 0.2, blend: "soft-light" },
  },
  {
    id: "encore",
    name: "Encore",
    css: "sepia(0.18) saturate(1.2) contrast(1.18) brightness(0.94)",
    tint: { color: INK, alpha: 0.14, blend: "multiply" },
  },
  {
    id: "fade",
    name: "Fade",
    css: "contrast(0.84) saturate(0.86) brightness(1.09)",
    tint: { color: PAPER, alpha: 0.1, blend: "screen" },
  },
  {
    id: "punch",
    name: "Punch",
    css: "contrast(1.42) saturate(1.32)",
  },
  {
    id: "retro",
    name: "Retro",
    css: "sepia(0.32) contrast(0.92) saturate(1.12) brightness(1.06)",
    tint: { color: MINDARO, alpha: 0.1, blend: "soft-light" },
  },
  {
    id: "mono",
    name: "Mono",
    css: "grayscale(1) contrast(1.02) brightness(1.06)",
  },
  {
    id: "dreamy",
    name: "Dreamy",
    css: "saturate(1.2) brightness(1.1) contrast(0.88)",
    tint: { color: PINK, alpha: 0.13, blend: "soft-light" },
  },
];

export const DEFAULT_FILTER_ID = "original";

export function getFilter(id: string): Filter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/**
 * A light-to-dark ramp with a skin tone in the middle. Applying a
 * filter to this in the picker shows honestly what it does to a face.
 */
export const SWATCH_GRADIENT =
  "linear-gradient(140deg, #F7F2EC 0%, #D8A87C 42%, #7A4B33 72%, #1C1C1C 100%)";