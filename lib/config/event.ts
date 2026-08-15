/**
 * EVENT CONFIG
 * ----------------------------------------------------------------
 * This is the only file you need to touch to run the photobooth at
 * a different event. Change the values, save, done — the home
 * screen and the printed photo frame both read from here.
 */

export const EVENT = {
  /** Appears on the home screen and on the final photo frame. */
  name: "Raahe Open Mic",

  /** Appears under the event name on the final photo frame. */
  venue: "Starbucks Vittal Mallya Road",

  /** Shown exactly as written. Keep the DD.MM.YYYY shape. */
  date: "22.08.2026",

  /** Short version used in the home screen header. */
  dateShort: "22.08.26",

  /** Small line above the big headline on the home screen. */
  eyebrow: "Raahe Open Mic",

  /** The promise, in one breath. Keep it under ~40 characters. */
  tagline: "3 photos. 1 frame. Your Raahe moment.",

  /** Filename stem for the downloaded image. */
  fileStem: "raahe-open-mic",
} as const;

/**
 * The little tracked labels along the bottom of the cabinet — the
 * spec plate on a piece of hardware. Keep them short and true;
 * they're read at 9px.
 */
export const CREDITS = [
  { label: "Shots", value: "3" },
  { label: "Countdown", value: "5 sec" },
  { label: "Typeface", value: "League Spartan" },
] as const;

/**
 * LOGO
 * ----------------------------------------------------------------
 * Drop your real logo file into the /public folder and point to it
 * here. The app tries each path in order and uses the first one
 * that loads, so you can supply PNG, SVG, or both.
 *
 * PNG is the most reliable choice because the logo also has to be
 * drawn into the final photo. Export it transparent, at least
 * 512px wide.
 */
export const LOGO_SOURCES = ["/raahe-logo.png", "/raahe-logo.svg"] as const;

/** Shown instead of the mark until you add a logo file. */
export const LOGO_FALLBACK_TEXT = "raahe.co";