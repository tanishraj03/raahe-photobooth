/**
 * FRAME CONFIG
 * ----------------------------------------------------------------
 * Everything about the exported image lives here. Change a number,
 * save, and the picture changes with it — lib/compose.ts works the
 * whole layout out from these values, nothing is hard-coded.
 *
 * THE SHAPE
 * The export is **9:16, 1080 × 1920** — and the whole of it is the
 * photo strip. Not a story with a strip sitting on it: the canvas
 * edge *is* the edge of the strip.
 *
 *      ┌────────────────────────────┐ ← the canvas edge is the strip edge
 *      │        RAAHE.CO            │
 *      │ ───────────────────────────│
 *      │      ┌──────────────┐      │
 *      │  01  │   photo 1    │  R   │
 *      │      └──────────────┘  A   │
 *      │      ┌──────────────┐  A   │  the borders are quiet on
 *      │  02  │   photo 2    │  H   │  purpose — see below
 *      │      └──────────────┘  E   │
 *      │      ┌──────────────┐      │
 *      │  03  │   photo 3    │      │
 *      │      └──────────────┘      │
 *      │ ───────────────────────────│
 *      │   [LOGO] raahe open mic    │
 *      │  STARBUCKS VITTAL MALLYA   │
 *      │         22.08.2026         │
 *      └────────────────────────────┘
 *
 * THE BORDERS ARE DELIBERATELY SPARSE.
 * They carry a rule, a line of tracked type and the frame numbers,
 * and nothing else. An empty, well-set border beats a border filled
 * with small drawn objects — those read as clip art at this size, no
 * matter how they're drawn. If real illustration artwork is ever
 * commissioned, `art` below is where it goes.
 *
 * All sizes are pixels at export resolution.
 */

export const FRAME = {
  /* ---------------- Each photo ---------------- */

  /**
   * Width divided by height of a single photo.
   *
   * Square, because it's the shape that serves both ends: on the
   * strip three of them stack into a column with room to spare, and
   * on a phone a square preview fills the width and most of the
   * height, which is what makes the camera feel like the hero.
   *
   * If you change this, change `aspect-ratio` in the `.capture-box`
   * rule in app/globals.css to match, or the preview will show a
   * different crop from the one the shutter takes.
   */
  cellAspect: 1,

  /** Pixel width each photo is captured at, before it's placed. */
  photoWidth: 1080,

  /** JPEG quality of each captured photo, 0 to 1. */
  photoQuality: 0.92,

  /** JPEG quality of the finished image. */
  exportQuality: 0.94,

  /* ---------------- The strip ---------------- */

  poster: {
    /** 9:16. The whole thing is the strip. */
    width: 1080,
    height: 1920,
    /** How wide each photo is. The borders are what's left over. */
    photoWidth: 500,
    /** Space between photos. */
    photoGap: 24,
    /**
     * How the space left over above and below the photos is split.
     * The foot carries the lockup and three lines, so it gets more.
     */
    headShare: 0.33,
    photoRadius: 4,
    photoKeyline: 2,
    ruleHeight: 2,
  },

  /* ---------------- Ground ---------------- */

  ground: {
    /** A single sheet of tone. No dot fields, no texture tricks. */
    cropMarks: true,
    cropMarkLength: 26,
    cropMarkInset: 22,
    cropMarkWidth: 1.5,
  },

  /* ---------------- What's in the borders ---------------- */

  border: {
    /** The event, set on its side and running up each border. */
    sideText: true,
    sideSize: 19,
    sideTracking: 0.3,
    /** The frame numbers beside each photo. */
    numbers: true,
    numberSize: 17,
    numberTracking: 0.2,
  },

  /**
   * ILLUSTRATION SLOT
   * ----------------------------------------------------------------
   * Drop real artwork at these paths in /public and it's drawn into
   * the borders, scaled to the border width and centred on the run
   * of photos. Nothing is drawn if the files aren't there, and the
   * strip is designed to look finished without them.
   *
   * Line art on a transparent background, portrait, roughly 1:4.
   */
  art: {
    left: "/art/border-left.svg",
    right: "/art/border-right.svg",
    /** Fraction of the border width the artwork spans. */
    widthShare: 0.82,
    alpha: 0.9,
  },

  /* ---------------- The head ---------------- */

  head: {
    capSize: 19,
    capTracking: 0.3,
  },

  /* ---------------- The foot ---------------- */

  foot: {
    /**
     * The mark and the event name are one lockup, set side by side
     * and sized against each other — not a small logo floating above
     * a line of type.
     */
    logoHeight: 92,
    /** Space between the mark and the name. */
    lockupGap: 26,
    nameSize: 66,
    nameTracking: -0.04,

    /** Space under the lockup. */
    lockupGapBottom: 34,

    venueSize: 20,
    venueTracking: 0.18,
    venueLineGap: 10,
    venueGap: 18,

    dateSize: 30,
    dateTracking: 0.06,
  },

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#1A1A1A",
    photoWell: "#0E0E0E",
    photoKeyline: "rgba(244, 245, 245, 0.14)",
    rule: "rgba(244, 245, 245, 0.16)",
    cap: "rgba(244, 245, 245, 0.38)",
    sideText: "rgba(244, 245, 245, 0.22)",
    number: "rgba(240, 78, 152, 0.85)",
    cropMark: "rgba(244, 245, 245, 0.18)",
    title: "#F4F5F5",
    venue: "rgba(244, 245, 245, 0.5)",
    date: "#F04E98",
  },
} as const;

/** Height of one captured photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);
