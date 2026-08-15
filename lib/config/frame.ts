/**
 * FRAME CONFIG
 * ----------------------------------------------------------------
 * Everything about the printed photo strip lives here. Change a
 * number, save, and the exported image changes with it — the layout
 * works itself out from these values, nothing is hard-coded.
 *
 * All sizes are in pixels at the export resolution (photoWidth).
 */

export const FRAME = {
  /* ---------------- Photo shape ---------------- */

  /**
   * Width divided by height of each photo.
   *   1     = square       (fills a phone screen, frames faces well)
   *   0.8   = 4:5 portrait (taller, narrower strip)
   *   1.25  = 5:4 landscape
   *
   * If you change this, also change `aspect-ratio` in the
   * .preview-box rule in app/globals.css so the camera matches.
   */
  cellAspect: 1,

  /** Pixel width of the exported strip. 1080 is plenty for Instagram. */
  photoWidth: 1080,

  /** JPEG quality of each captured photo, 0 to 1. */
  photoQuality: 0.92,

  /** JPEG quality of the finished strip. */
  exportQuality: 0.95,

  /* ---------------- Strip ---------------- */

  /** Space between the strip edge and its contents. */
  padding: 56,
  /** Space between the three photos. */
  photoGap: 18,
  /** Corner rounding on each photo. */
  photoRadius: 14,
  /** Corner rounding on the strip itself. */
  cornerRadius: 36,
  /** The pink keyline around the whole strip. Set to 0 to remove it. */
  borderWidth: 8,

  /* ---------------- Event plate ---------------- */

  /** Space between the last photo and the pink rule. */
  ruleGapTop: 46,
  ruleHeight: 3,
  /** Space between the pink rule and the event name. */
  ruleGapBottom: 42,

  /** Height of the logo. Its width follows from its own proportions. */
  logoHeight: 78,
  /** Space between the logo and the event name. */
  logoGap: 26,

  /** Event name. Shrinks automatically if the name is long. */
  titleSize: 82,
  /** Letter spacing as a fraction of the font size. Negative = tighter. */
  titleTracking: -0.045,

  /** Space between the event name and the venue line. */
  metaGap: 34,
  venueSize: 26,
  venueTracking: 0.16,
  dateSize: 34,

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#212121",
    border: "#F04E98",
    rule: "#F04E98",
    photoWell: "#151515",
    title: "#F4F5F5",
    venue: "rgba(244, 245, 245, 0.55)",
    date: "#F04E98",
  },
} as const;

/** Height of one photo, worked out from the settings above. */
export const PHOTO_HEIGHT = Math.round(FRAME.photoWidth / FRAME.cellAspect);