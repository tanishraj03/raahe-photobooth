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
 * edge *is* the edge of the strip, the borders are the strip's own
 * borders, and the artwork in them runs to the trim.
 *
 *      ┌────────────────────────────┐ ← the canvas edge is the strip edge
 *      │ ✦ camera        RAAHE.CO   │
 *      │ ────────────────────────── │
 *      │ ┃ ┌──────────────────────┐ │
 *      │ ┃ │       photo 1        │ │
 *      │ ┃ └──────────────────────┘ │  the borders carry the
 *      │ ┃ ┌──────────────────────┐ │  cable and the drawings
 *      │ ┃ │       photo 2        │ │
 *      │ ┃ └──────────────────────┘ │
 *      │ ┃ ┌──────────────────────┐ │
 *      │ ┃ │       photo 3        │ │
 *      │ ┃ └──────────────────────┘ │
 *      │ ────────────────────────── │
 *      │        [ raahe logo ]      │
 *      │       RAAHE OPEN MIC       │
 *      │   STARBUCKS VITTAL MALLYA  │
 *      │         22.08.2026         │
 *      └────────────────────────────┘
 *
 * All sizes are pixels at export resolution.
 */

export const FRAME = {
  /* ---------------- Each photo ---------------- */

  /**
   * Width divided by height of a single photo.
   *
   * Square. It's the shape that serves both ends: a square preview
   * fills the width of a phone and gives someone room to stand in
   * the frame, and three squares stack into the strip with the head
   * and the foot still fitting. The borders are what's left over,
   * and at 310px they're wide enough for the drawings to be drawings.
   *
   * If you change this, change `aspect-ratio` in the .preview-box
   * rule in app/globals.css to match, or the camera will show a
   * different crop from the one it takes.
   */
  cellAspect: 1,

  /** Pixel width each photo is captured at, before it's placed. */
  photoWidth: 1280,

  /** JPEG quality of each captured photo, 0 to 1. */
  photoQuality: 0.92,

  /** JPEG quality of the finished image. */
  exportQuality: 0.94,

  /* ---------------- The strip ---------------- */

  poster: {
    /** 9:16. The whole thing is the strip. */
    width: 1080,
    height: 1920,
    /**
     * The strip's own border, left and right. This is where the
     * cable and the drawings live, so it has to be worth looking at
     * — wide enough for a drawing to be a drawing rather than a
     * mark, and no wider.
     */
    border: 310,
    /** Space between photos. */
    photoGap: 26,
    /**
     * How the space left over above and below the photos is split.
     * The foot carries four lines of type, so it gets more.
     */
    headShare: 0.28,
    /** Corner rounding on each photo. Real booths print them square. */
    photoRadius: 5,
    /** A hairline drawn tight around each photo. */
    photoKeyline: 2,
    /** Rule under the head and over the foot. */
    ruleHeight: 3,
  },

  /* ---------------- Grain and ground ---------------- */

  ground: {
    /** Faint dot field over the whole strip. Set size to 0 to drop. */
    dotSize: 2.4,
    dotSpacing: 44,
    /** Printer's crop marks at the trim. */
    cropMarks: true,
    cropMarkLength: 30,
    cropMarkInset: 20,
    cropMarkWidth: 2,
  },

  /* ---------------- The artwork ---------------- */

  art: {
    /** Set false for a plain strip. */
    enabled: true,
    /**
     * How much ink bleeds around the pink and white line work. This
     * is signage glow, not neon — keep it in single figures.
     */
    glow: 9,
    /** The lead that ties the drawings on a border together. */
    cable: { width: 5, sway: 20, alpha: 0.55 },
    /**
     * Drawings down each border, top to bottom, spread evenly over
     * the run of photos. `height` is the visual height on the strip;
     * `turn` rotates a wide object onto its side so it can fill a
     * narrow lane instead of shrinking to nothing in it.
     */
    leftBorder: [
      { name: "micStand", height: 320 },
      { name: "cassette", height: 250, turn: -90 },
      { name: "jackPlug", height: 275 },
    ],
    rightBorder: [
      { name: "speakerCab", height: 260 },
      { name: "handButton", height: 240, turn: 90 },
      { name: "headphones", height: 215 },
    ],
    /** In the head, beside the cap line. */
    head: { name: "flashCam", height: 150 },
  },

  /* ---------------- The head ---------------- */

  head: {
    capSize: 20,
    capTracking: 0.24,
    /** The small numbers beside each photo. */
    indexSize: 17,
    indexTracking: 0.18,
  },

  /* ---------------- The foot ---------------- */

  foot: {
    /** The mark. Its width follows its own proportions. */
    logoHeight: 62,
    logoGap: 24,

    /** Event name, fitted to one line across the strip. */
    nameSize: 84,
    nameTracking: -0.04,
    nameLineHeight: 0.9,
    nameGap: 20,

    /** Venue. Wraps if it has to. */
    venueSize: 21,
    venueTracking: 0.16,
    venueLineGap: 10,
    venueGap: 16,

    /** Date. */
    dateSize: 28,
    dateTracking: 0.04,
  },

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#191919",
    dot: "rgba(240, 78, 152, 0.09)",
    photoWell: "#101010",
    photoKeyline: "rgba(244, 245, 245, 0.16)",
    rule: "#F04E98",
    cap: "rgba(244, 245, 245, 0.42)",
    index: "rgba(240, 78, 152, 0.75)",
    cropMark: "rgba(240, 78, 152, 0.35)",
    title: "#F4F5F5",
    venue: "rgba(244, 245, 245, 0.55)",
    date: "#F04E98",
    /** The three inks the drawings are made of. */
    ink: {
      pink: "#F04E98",
      paper: "#F4F5F5",
      grey: "#7E7E7E",
    },
  },
} as const;

/** Height of one captured photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);
