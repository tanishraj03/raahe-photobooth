/**
 * FRAME CONFIG
 * ----------------------------------------------------------------
 * Everything about the exported image lives here. Change a number,
 * save, and the picture changes with it — lib/compose.ts works the
 * whole layout out from these values, nothing is hard-coded.
 *
 * THE SHAPE
 * The export is 4:5 (1080 × 1350), the ratio Instagram gives the most
 * room to. A three-photo strip is about 1:3, so it can never fill a
 * 4:5 frame on its own — instead the strip runs down the left as a
 * film card, and the event sits beside it in the right-hand column.
 * That's what turns a strip into something worth posting.
 *
 *      ┌──────────────────────────────┐
 *      │ ┌────────┐                   │
 *      │ │ photo  │   [logo]          │
 *      │ ├────────┤                   │
 *      │ │ photo  │   raahe           │
 *      │ ├────────┤   open            │
 *      │ │ photo  │   mic             │
 *      │ └────────┘   ─────────       │
 *      │              VENUE           │
 *      │              22.08.2026      │
 *      └──────────────────────────────┘
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
    /** 4:5. Instagram's tallest feed crop. */
    width: 1080,
    height: 1350,
    /** Space between the poster edge and everything in it. */
    margin: 54,
    /** Space between the strip card and the event column. */
    columnGap: 46,
    /** Faint dot field over the background. Set to 0 to remove. */
    dotSize: 2.5,
    dotSpacing: 46,
    /** Little printer's crop marks in the corners. */
    cropMarks: true,
    cropMarkLength: 26,
    cropMarkInset: 22,
    cropMarkWidth: 2,
  },

  /* ---------------- The strip card ---------------- */

  strip: {
    /** Space inside the card. Also the lane the sprockets run down. */
    pad: 30,
    /** Space between photos. */
    photoGap: 14,
    /** Corner rounding on each photo. */
    photoRadius: 10,
    /** Corner rounding on the card. */
    radius: 22,
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

  /* ---------------- The event column ---------------- */

  brand: {
    /**
     * The column has two anchors and air in between: the date sits
     * on the top edge of the strip, and the mark, name, rule and
     * venue hang together off its bottom edge. Those two shared
     * edges are what make the two columns read as one picture.
     */

    /** Height of the logo. Its width follows its own proportions. */
    logoHeight: 58,
    /** Space between the logo and the event name. */
    logoGap: 30,

    /**
     * Event name. Starts here and shrinks until the longest word
     * fits the column, so the type is always set to the measure.
     */
    nameSize: 200,
    nameTracking: -0.045,
    nameLineHeight: 0.86,

    /** The pink rule under the name. */
    ruleGapTop: 34,
    ruleHeight: 3,
    ruleGapBottom: 30,

    /** Venue. Wraps by word. Its last line sits on the card's baseline. */
    venueSize: 22,
    venueTracking: 0.16,
    venueLineGap: 13,

    /** Date, at the top of the column. */
    dateSize: 30,
    dateTracking: 0.02,
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
    title: "#F4F5F5",
    rule: "#F04E98",
    venue: "rgba(244, 245, 245, 0.5)",
    date: "#F04E98",
  },
} as const;

/** Height of one captured photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);
