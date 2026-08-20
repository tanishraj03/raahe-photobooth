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
 * edge *is* the edge of the strip, and the pink bands either side
 * run to the trim.
 *
 *      ┌──┬──────────────────────┬──┐ ← canvas edge = strip edge
 *      │▓▓│  [ RAAHE.CO · BOOTH ]│▓▓│   head: the booth's plate
 *      │▓▓├──────────────────────┤▓▓│
 *      │R │ ╭──────────────────╮ │ E│   scalloped photos, and the
 *      │A │ │      photo 1     │ │ C│   bands carry the wordmark
 *      │A │ ╰──────────────────╯ │ I│   repeated down each side
 *      │H │ ╭──────────────────╮ │ M│
 *      │E │ │      photo 2     │ │  │
 *      │  │ ╰──────────────────╯ │ N│
 *      │O │ ╭──────────────────╮ │ E│
 *      │P │ │      photo 3     │ │ P│
 *      │E │ ╰──────────────────╯ │ O│
 *      │▓▓├───▪▫▪▫▪▫▪▫▪▫▪▫▪▫▪▫───┤▓▓│   checker rule
 *      │▓▓│      [ raahe logo ]  │▓▓│
 *      │▓▓│     RAAHE OPEN MIC   │▓▓│
 *      │▓▓│   STARBUCKS VITTAL…  │▓▓│
 *      │▓▓│       22.08.2026     │▓▓│
 *      └──┴──────────────────────┴──┘
 *
 * All sizes are pixels at export resolution.
 */

export const FRAME = {
  /* ---------------- Each photo ---------------- */

  /**
   * Width divided by height of a single photo.
   *
   * 16:9, and it is arithmetic rather than taste. Three photos have
   * to stack down a 1080 × 1920 strip with a head and a foot still
   * fitting, and the borders have to stay thin enough to read as
   * bands rather than margins. At a 110px border the photos are
   * 860 wide; anything squarer than 16:9 makes them 570+ tall and
   * there is no foot left to put the mark in.
   *
   * If you change this, change `aspect-ratio` in the .preview-box
   * rule in app/globals.css — and the `* 16 / 9` in its `width`
   * calc — or the camera will show a different crop from the one
   * it takes.
   */
  cellAspect: 16 / 9,

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
     * The strip's own border, left and right. These are the pink
     * bands, and they run the full height of the strip to the trim.
     * Wide enough to carry the wordmark on its side, no wider —
     * every pixel here is a pixel off the photos.
     */
    border: 110,
    /** Space between photos. */
    photoGap: 22,
    /**
     * How the space left over above and below the photos is split.
     * The foot carries four lines of type, so it gets most of it.
     */
    headShare: 0.12,
    /** Corner rounding on each photo, inside the scallop. */
    photoRadius: 4,
    /** A hairline drawn tight around each photo. */
    photoKeyline: 2,
    /** Rule under the head. */
    ruleHeight: 3,
  },

  /* ---------------- The bands ----------------
     The pink runs down both edges with the wordmark repeated on its
     side, the way a printed strip carries the booth's name. This is
     where most of the pink coverage lives. */

  band: {
    enabled: true,
    /** Cycled down the band, one after another, forever. */
    words: ["RAAHE", "OPEN MIC"],
    /** Type size for a word in `words`, index for index. */
    sizes: [44, 20],
    weights: [800, 600],
    trackings: [-0.02, 0.18],
    /** Space between one word and the next. */
    wordGap: 34,
    /** A dot set between words. Set to 0 to drop them. */
    dotSize: 5,
  },

  /* ---------------- Grain and ground ---------------- */

  ground: {
    /** Faint dot field over the inner column. Set size to 0 to drop. */
    dotSize: 2.4,
    dotSpacing: 44,
    /**
     * Printer's crop marks. Off, because the pink bands bleed to the
     * trim and a crop mark drawn on one is invisible.
     */
    cropMarks: false,
    cropMarkLength: 30,
    cropMarkInset: 20,
    cropMarkWidth: 2,
  },

  /* ---------------- The photo frames ----------------
     A wavy edge, cut the way a photo-booth sticker is cut. The photo
     is clipped to it, so the scallop is the photo's own edge rather
     than a frame sitting on top of one. */

  scallop: {
    enabled: true,
    /** How far the wave swings out from the straight edge. */
    amplitude: 7,
    /** Roughly how long one bump is. Rounded to fit each edge evenly. */
    period: 46,
    /** The line drawn around the cut. */
    strokeWidth: 5,
  },

  /* ---------------- The checker rule ----------------
     One row of alternating squares between the photos and the foot. */

  checker: {
    enabled: true,
    size: 18,
    /** Gap above and below the row. */
    gap: 12,
  },

  /* ---------------- The artwork ---------------- */

  art: {
    /**
     * The corner stickers. Off: the bands, the scalloped cuts and the
     * checker rule carry the strip on their own, and a drawing sat on
     * someone's face is a drawing in the way. Set true to bring them
     * back — everything below is still wired up.
     */
    enabled: false,
    /**
     * How much ink bleeds around the pink and white line work. This
     * is signage glow, not neon — keep it in single figures.
     */
    glow: 8,
    /**
     * How far a sticker's *centre* sits in from the photo's corner.
     * Centre, not edge: a tilted drawing needs more room than its
     * upright size suggests, and anchoring by edge tips it onto the
     * band. Raise these if you make the stickers bigger.
     */
    stickerInset: { x: 100, y: 88 },
    /**
     * Stickers, sat in the corner of a photo the way a booth slaps
     * a badge on the print. `photo` is which frame (0-2), `corner`
     * which of its corners, `turn` the tilt in degrees.
     */
    stickers: [
      { name: "cassette", photo: 0, corner: "topRight", height: 96, turn: -14 },
      { name: "jackPlug", photo: 1, corner: "bottomLeft", height: 104, turn: 12 },
      { name: "headphones", photo: 2, corner: "topRight", height: 92, turn: 10 },
    ],
  },

  /* ---------------- The foot ---------------- */

  foot: {
    /** The mark. Its width follows its own proportions. */
    logoHeight: 96,
    logoGap: 22,

    /** Event name, fitted to one line across the inner column. */
    nameSize: 96,
    nameTracking: -0.045,
    nameLineHeight: 0.9,
    nameGap: 16,

    /** Venue. Wraps if it has to. */
    venueSize: 21,
    venueTracking: 0.16,
    venueLineGap: 10,
    venueGap: 12,

    /** Date. */
    dateSize: 28,
    dateTracking: 0.04,

    /** Breathing room under the checker rule and above the trim. */
    padTop: 10,
    padBottom: 26,
  },

  /* ---------------- Colours ---------------- */

  colors: {
    background: "#191919",
    dot: "rgba(240, 78, 152, 0.09)",
    photoWell: "#101010",
    photoKeyline: "rgba(244, 245, 245, 0.16)",
    rule: "#F04E98",
    /** The bands, and the type sitting on them. */
    band: "#F04E98",
    bandInk: "#191919",
    /** The scalloped cut around each photo. */
    scallop: "#F4F5F5",
    cap: "#191919",
    index: "rgba(240, 78, 152, 0.75)",
    checkerA: "#F04E98",
    checkerB: "rgba(244, 245, 245, 0.78)",
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