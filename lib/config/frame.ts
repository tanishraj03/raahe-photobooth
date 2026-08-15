/**
 * FRAME CONFIG
 * ----------------------------------------------------------------
 * Everything about the exported image lives here. Change a number,
 * save, and the picture changes with it — lib/compose.ts works the
 * whole layout out from these values, nothing is hard-coded.
 *
 * THE SHAPE
 * The export is **9:16, 1080 × 1920** — a full Instagram story.
 *
 * On it sits one thing: an actual photobooth strip. Three photos in
 * a column, generous borders, and the event set out underneath them
 * — mark, name, venue, date, centred, the way a real booth prints
 * it. The borders carry small music-and-art motifs, and the empty
 * margins either side run a repeating ticker.
 *
 *      ┌───────────────────────────┐
 *      │ ·  ┌───────────────────┐  ·│
 *      │ R  │     RAAHE.CO      │  R│
 *      │ A  │ ♪ ┌─────────────┐ ★ │ A│
 *      │ A  │   │    photo    │   │ A│
 *      │ H  │ ◎ ├─────────────┤ ▮ │ H│
 *      │ E  │   │    photo    │   │ E│
 *      │ ·  │ ⌇ ├─────────────┤ ♪ │ ·│
 *      │    │   │    photo    │   │  │
 *      │    │   └─────────────┘   │  │
 *      │    │       [logo]        │  │
 *      │    │   raahe open mic    │  │
 *      │    │ STARBUCKS VITTAL…   │  │
 *      │    │     22.08.2026      │  │
 *      │    └───────────────────┘  │
 *      └───────────────────────────┘
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
    /** Space between the poster edge and the strip. */
    margin: 56,
    /** Faint dot field over the background. Set size to 0 to remove. */
    dotSize: 2.5,
    dotSpacing: 46,
    /** Little printer's crop marks in the corners. */
    cropMarks: true,
    cropMarkLength: 26,
    cropMarkInset: 22,
    cropMarkWidth: 2,
  },

  /* ---------------- The margins either side ---------------- */

  margins: {
    /** A repeating line of tracked capitals running up each side. */
    ticker: true,
    size: 17,
    tracking: 0.22,
    /** Space between one repeat and the next. */
    gap: 44,
  },

  /* ---------------- The strip ---------------- */

  strip: {
    /** The side borders — where the motifs live. */
    borderX: 56,
    /** The top border, which carries the small cap line. */
    borderTop: 58,
    /** Below the date. */
    borderBottom: 46,
    /** Space between photos. A real strip leaves a clear border. */
    photoGap: 26,
    /** Corner rounding on each photo. Real booths print them square. */
    photoRadius: 4,
    /** Corner rounding on the strip itself. */
    radius: 20,
    /** The pink keyline around the strip. Set to 0 to remove it. */
    keyline: 3,
    /** A hairline drawn tight around the block of photos. */
    innerKeyline: 1,
    /** Space between the last photo and the event block. */
    footerGap: 46,
    /** The small tracked line along the top border. */
    capSize: 17,
    capTracking: 0.22,
  },

  /* ---------------- Border motifs ---------------- */

  motifs: {
    /** Set false for plain borders. */
    enabled: true,
    size: 30,
    /** Distance between one motif and the next, down a border. */
    step: 152,
    alpha: 0.6,
    /** The cycle, top to bottom. Names come from lib/motifs.ts. */
    order: ["spark", "note", "disc", "mic", "bars", "squiggle"],
    /** How far the right-hand column is shifted through the cycle. */
    offset: 3,
  },

  /* ---------------- The event, under the photos ---------------- */

  footer: {
    /** The mark. Its width follows its own proportions. */
    logoHeight: 70,
    logoGap: 26,

    /** Event name, fitted to one line across the strip. */
    nameSize: 80,
    nameTracking: -0.04,
    nameLineHeight: 0.9,
    nameGap: 22,

    /** Venue. Wraps if it has to. */
    venueSize: 20,
    venueTracking: 0.16,
    venueLineGap: 10,
    venueGap: 18,

    /** Date. */
    dateSize: 27,
    dateTracking: 0.04,
  },

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#1A1A1A",
    dot: "rgba(240, 78, 152, 0.10)",
    marginTicker: "rgba(244, 245, 245, 0.09)",
    strip: "#242424",
    keyline: "#F04E98",
    innerKeyline: "rgba(244, 245, 245, 0.12)",
    photoWell: "#111111",
    cap: "rgba(244, 245, 245, 0.4)",
    motif: "#F04E98",
    cropMark: "rgba(240, 78, 152, 0.4)",
    title: "#F4F5F5",
    venue: "rgba(244, 245, 245, 0.55)",
    date: "#F04E98",
  },
} as const;

/** Height of one captured photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);
