/**
 * FRAME CONFIG
 * ----------------------------------------------------------------
 * Everything about the exported image lives here. Change a number,
 * save, and the picture changes with it — lib/compose.ts works the
 * whole layout out from these values, nothing is hard-coded.
 *
 * THE SHAPE
 * The export is **9:16, 1080 × 1920** — a full Instagram story, edge
 * to edge, no letterboxing.
 *
 * A three-photo strip is about 1:3, so it can't fill a story frame
 * on its own. The strip runs down the left as a film card and the
 * event sits in the column beside it, under the mic. Rails top and
 * bottom hold the whole thing together.
 *
 *      ┌────────────────────────────┐
 *      │ [logo]           22.08.2026│  header rail
 *      │ ───────────────────────────│
 *      │ ┌──────────┐               │
 *      │ │  photo   │      ▟▙       │
 *      │ ├──────────┤     mic       │  ← halftone, behind the type
 *      │ │  photo   │      ▐▌       │
 *      │ ├──────────┤               │
 *      │ │  photo   │   raahe       │
 *      │ │          │   open mic    │
 *      │ └──────────┘   ─────────   │
 *      │                VENUE       │
 *      │ ───────────────────────────│
 *      │ RAAHE OPEN MIC · VENUE · … │  footer ticker
 *      └────────────────────────────┘
 *
 * All sizes are pixels at export resolution.
 */

export const FRAME = {
  /* ---------------- Each photo ---------------- */

  /**
   * Width divided by height of a single photo.
   *   1     = square       (fills the strip well, frames faces)
   *   0.8   = 4:5 portrait (taller cells, narrower strip)
   *   1.25  = 5:4 landscape
   *
   * If you change this, also change `aspect-ratio` in the
   * .preview-box rule in app/globals.css so the camera matches.
   */
  cellAspect: 1,

  /** Pixel width each photo is captured at, before it's placed. */
  photoWidth: 1080,

  /** JPEG quality of each captured photo, 0 to 1. */
  photoQuality: 0.92,

  /** JPEG quality of the finished image. */
  exportQuality: 0.94,

  /* ---------------- The poster ---------------- */

  poster: {
    /** 9:16 — a full-bleed Instagram story. */
    width: 1080,
    height: 1920,
    /** Space between the poster edge and everything in it. */
    margin: 60,
    /** Space between the strip card and the event column. */
    columnGap: 46,
    /**
     * How much of the width the strip card may take. Raise it for
     * bigger photos, lower it for a wider event column.
     */
    stripWidthShare: 0.48,
    /** Faint dot field over the background. Set size to 0 to remove. */
    dotSize: 2.5,
    dotSpacing: 46,
    /** Little printer's crop marks in the corners. */
    cropMarks: true,
    cropMarkLength: 28,
    cropMarkInset: 24,
    cropMarkWidth: 2,
  },

  /* ---------------- Top and bottom rails ---------------- */

  rails: {
    /** Height of the logo, top left. Its width follows its own shape. */
    logoHeight: 56,
    /** Date, top right. */
    dateSize: 30,
    dateTracking: 0.02,
    /** Space under the header before its rule. */
    gapUnder: 30,
    ruleHeight: 2,
    /** Space between a rule and the body of the poster. */
    bodyGap: 44,
    /** The line of tracked capitals along the foot. */
    tickerSize: 18,
    tickerTracking: 0.16,
    tickerGap: 30,
  },

  /* ---------------- The strip card ---------------- */

  strip: {
    /** Space inside the card. Also the lane the sprockets run down. */
    pad: 32,
    /** Space between photos. */
    photoGap: 16,
    /** Corner rounding on each photo. */
    photoRadius: 10,
    /** Corner rounding on the card. */
    radius: 24,
    /** Hairline around the card. Set to 0 to remove it. */
    borderWidth: 2,
    /** Film perforations down both edges. Set enabled to false to drop. */
    sprocket: {
      enabled: true,
      width: 10,
      height: 20,
      gap: 26,
      radius: 4,
    },
  },

  /* ---------------- The mic ---------------- */

  mic: {
    /** Set false for a poster with no illustration. */
    enabled: true,
    /** Fraction of the event column the mic spans. */
    widthShare: 1,
    /** Space between the foot of the mic and the event name. */
    gapBelow: 54,
    /** Opacity of the whole illustration. Keep it quiet. */
    alpha: 0.62,
    /** Halftone dot diameter and spacing, in poster pixels. */
    dot: 7.5,
    spacing: 13,
    /** How much the dots shrink towards the foot of the mic. */
    fade: 0.55,
  },

  /* ---------------- The event column ---------------- */

  brand: {
    /**
     * Event name. Starts here and shrinks until the longest word
     * fits the column, so the type is always set to the measure.
     */
    nameSize: 190,
    nameTracking: -0.045,
    nameLineHeight: 0.86,

    /** The pink rule under the name. */
    ruleGapTop: 34,
    ruleHeight: 3,
    ruleGapBottom: 30,

    /** Venue. Wraps by word. Its last line sits on the card's foot. */
    venueSize: 22,
    venueTracking: 0.16,
    venueLineGap: 13,
  },

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#212121",
    dot: "rgba(240, 78, 152, 0.11)",
    card: "#171717",
    cardBorder: "rgba(244, 245, 245, 0.10)",
    photoWell: "#111111",
    sprocket: "rgba(240, 78, 152, 0.5)",
    cropMark: "rgba(240, 78, 152, 0.4)",
    railRule: "rgba(244, 245, 245, 0.14)",
    mic: "#F04E98",
    title: "#F4F5F5",
    rule: "#F04E98",
    venue: "rgba(244, 245, 245, 0.5)",
    ticker: "rgba(244, 245, 245, 0.38)",
    date: "#F04E98",
  },
} as const;

/** Height of one captured photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);
