# Raahe Open Mic Photobooth

A mobile-first web photobooth for the Raahe Open Mic event. Someone at the venue
scans a QR code, takes 3 photos with a 5-second countdown before each, picks a
filter, and gets a branded 9:16 poster they can save and post to their story.

Live on Vercel. Deploys automatically on push to `main`.

## Commands

```bash
npm run dev     # local dev server at http://localhost:3000
npm run build   # production build — run this before pushing anything significant
npm run lint    # must pass; see "Lint rules that bite" below
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · no other runtime
dependencies.

**Do not add dependencies without asking first.** The app deliberately uses
browser-native APIs only: `getUserMedia`, Canvas, Web Share, blob downloads.
Animation is CSS keyframes, not a library. This keeps the bundle small so it
loads fast on venue wifi.

## Hard constraints

These are product requirements, not preferences:

- **No backend, no database, no authentication.** Everything runs client-side.
- **Photos never leave the device.** No uploads, no analytics, no tracking.
  This is an event photobooth and privacy is part of the promise made on screen.
- **Never redraw, recreate, or approximate the Raahe logo.** It loads from
  `/public/raahe-logo.png`. If it's missing, the layout degrades gracefully by
  omitting the mark. Do not substitute a drawn stand-in.
- **Do not use the illustrations or characters from the Raahe brand guide.**
  The photobooth has its own visual system derived from the brand.

## Architecture

```
app/
  layout.tsx              League Spartan font, viewport, metadata
  page.tsx                State machine: home → camera → result, inside .app-frame
  globals.css             Design tokens (@theme), type classes, keyframes
  screens/
    HomeScreen.tsx        Landing + CTA
    CameraScreen.tsx      Permission, countdown, capture sequence
    ResultScreen.tsx      Developing state, poster reveal, save/share
components/
  Cabinet.tsx             The booth: hood, screen, deck. Wraps every stage
  BrandMark.tsx           Logo with typographic fallback
  MicMark.tsx             The mic, as halftone SVG
  Backdrop.tsx            Fixed dot field, light sweep, grain
  Marquee.tsx             Endless tracked-caps ticker
  RiseText.tsx            Display type revealed letter by letter
  CountdownRing.tsx       Draining ring + the digit inside it
  FilterRail.tsx          Horizontal filter picker, chips lifted off the camera
  FilterLayers.tsx        Renders a filter's washes + grain over anything
  StripProgress.tsx       Three cells that fill with real thumbnails
lib/
  config/
    event.ts              Event name, venue, date, logo paths
    frame.ts              All poster geometry and colours
  camera.ts               useCamera hook: permissions, errors, device switching
  capture.ts              Video frame → filtered JPEG
  compose.ts              Three photos → branded 9:16 story (Canvas)
  mic.ts                  Mic geometry, for the halftone SVG
  motifs.ts               The marks that run down the strip's borders
  filters.ts              The 14 filters
  washes.ts               A colour layer, described once, rendered as CSS or canvas
  grain.ts                One noise tile, shared by the preview and the capture
  share.ts                Download + Web Share
```

## Config-first principle

`lib/config/event.ts` and `lib/config/frame.ts` are the single sources of truth.
Event details and every poster dimension, gap, colour, and font size live there,
and the layout in `compose.ts` computes itself from those values.

**When changing the poster's appearance, change the config, not `compose.ts`.**
Only touch `compose.ts` when adding a genuinely new element to the design.

## The exported poster

The export is **9:16, 1080 × 1920** — a full Instagram story, edge to edge, no
letterboxing.

On it sits one thing: an actual photobooth strip. Three photos in a column,
generous borders, and the event set out underneath them — mark, name, venue,
date, centred, the way a real booth prints it.

- the **side borders** carry small music-and-art motifs from `lib/motifs.ts`
- the **top border** carries a small tracked cap line
- the **margins** either side of the strip run a repeating ticker, so the space
  around it is doing something
- the event block is **reserved at full size** before the photos are measured —
  two venue lines, everything at its configured size. Text only ever shrinks
  from there, so the block can never grow into the pictures, and whatever it
  doesn't use comes back as air around it.

## Illustrations

Two families, both our own drawings, both stated once as SVG path data and
painted onto canvas through `Path2D`:

- `lib/motifs.ts` — the small marks in the strip's borders. Chunky and solid;
  they have to hold up at 30px. `FRAME.motifs.order` sets the cycle, and the
  right-hand column runs `offset` steps further through it so the two sides
  never mirror.
- `lib/mic.ts` — the vintage broadcast mic, echoing the mic on the event
  posters. `components/MicMark.tsx` renders it as a halftone behind the hero on
  the landing page. `MIC_SLOTS` punches the grille out of the head; without
  those slots it's just a lozenge.

Neither is traced from the illustrations in the Raahe brand guide, and that
distinction matters — see the hard constraints above.

## The cabinet

The booth is a piece of hardware. `components/Cabinet.tsx` is the machine and
every stage renders inside one:

    hood    speaker grille, the mark, the date
    screen  an inset well with a pink tube glow — the stage content
    deck    the controls, a row of buttons, and the spec plate

What changes between home, camera and result is the screen, not the machine. Two
props trim it where height is short: `credits={false}` drops the spec plate,
`lean` also drops the grille and the button row (the result screen shows a 9:16
picture and needs every pixel).

On the camera screen the square the camera actually captures sits in the middle
of the screen with the HUD above it and the filters below, letterboxed against
the well. Don't be tempted to make the video fill the well — the preview would
then show more than the square that gets captured, and it would be lying.

## Design language

From the Raahe brand style guide:

| Token | Value | Use |
|---|---|---|
| `ink` | `#212121` | Background. Every screen. |
| `pink` | `#F04E98` | Actions, accents, countdown. Used sparingly. |
| `paper` | `#F4F5F5` | Text |
| `violet` / `mindaro` / `orange` | `#7D55C7` / `#D4EB8E` / `#FF6A13` | Filter tints only. The guide caps these at 30% coverage. |

Typeface is League Spartan throughout. The brand's signature is a **typographic
tension**: huge tight lowercase display against tiny wide-tracked uppercase
labels. Two classes in `globals.css` carry this:

- `.t-display` — 800 weight, lowercase, `-0.045em` tracking, `0.85` line-height
- `.t-label` — 600 weight, UPPERCASE, `+0.16em` tracking, 11px

Prefer these over ad-hoc font sizing.

The booth reads as hardware, so depth is allowed — but only as steps in value,
one inset ring and the screen's pink glow. Not drop shadows on everything, and
no gradient surfaces: the grille, the dot field and the deck buttons are all
flat. The one gradient in the app is the screen's scanlines, and they are kept
faint on purpose — over the camera preview they have to be felt rather than
seen, or the preview stops telling the truth.

### The app column

Every screen renders inside `.app-frame` in `page.tsx`: one column, `--app-width`
wide, centred on the `.app-stage`. On a phone it fills the screen. On anything
larger it becomes a booth panel — capped in **both** directions, bordered and
rounded — because a phone layout stretched to the full height of a monitor is
nobody's idea of a design.

**Heights are `100svh`, never `100dvh`.** `svh` is the small viewport, the one
you get with a mobile browser's toolbars showing. Size to `dvh` and the moment a
toolbar slides back in the layout is taller than the screen and the bottom gets
cut off.

`.app-frame` is also a **container** (`container-type: inline-size`), so hero
type sizes in `cqw` against the column rather than `vw` against the viewport —
that's why the display type fills the same proportion of a phone and a laptop.

Everything on every screen aligns to `.gutter`. If you're reaching for an ad-hoc
`px-5`, you're about to break the alignment.

### Motion

Animation is CSS keyframes in `globals.css`, applied through `.animate-*`
classes and the `.delay-1` … `.delay-6` stagger helpers. There is no animation
library and there shouldn't be one.

The whole set is disabled under `prefers-reduced-motion`, so never encode
meaning in movement alone.

## Gotchas

**`cellAspect` has two homes.** If you change `FRAME.cellAspect` in
`lib/config/frame.ts`, you must also change `aspect-ratio` in the `.preview-box`
rule in `app/globals.css`, or the camera preview stops matching the output.

**A filter is described once and rendered twice.** Each entry in `filters.ts` is
a CSS filter string (`css`), a list of colour layers (`washes`) and a grain
amount. The washes are turned into CSS by `washStyle()` and into canvas paints by
`paintWash()` — both live in `lib/washes.ts`, side by side, so they can't drift.
`FilterLayers.tsx` stacks them over the video and over the picker chips;
`capture.ts` paints them onto the canvas in the same order.

Add a filter by adding an entry. Add a *kind* of layer and you must extend both
renderers in `washes.ts`, or the preview lies about what people will get.

**Wash geometry only lines up because the frame is square.** The preview box and
the captured photo share `FRAME.cellAspect`, so a gradient angle or a vignette
radius lands in the same place on both. Change the aspect and check the washes
again.

**`capture.ts` has a manual pixel fallback** for browsers where `ctx.filter`
doesn't work. It handles brightness, contrast, saturate, grayscale and sepia
only. If you add a new CSS filter function to `lib/filters.ts`, either add it to
`applyFilterByHand` or confirm it degrades acceptably.

**Avoid CSS `blur()` in filters.** Blur is measured in CSS pixels, so a value
tuned on a ~360px preview is nearly invisible on the 1080px capture. The preview
would lie. This is why there's no blur-based filter.

**Grain is sized in repeats, not pixels**, for the same reason — `GRAIN_REPEATS`
tiles across the frame whatever the frame's size. Both sides use the *same* noise
tile from `lib/grain.ts`, generated once in a canvas: the preview reads it as a
data URL, the capture uses the canvas itself as a pattern.

**`compose.ts` has a letter-spacing fallback.** Canvas letter spacing isn't
universally supported, and without it the tracked venue line collapses and the
plate looks wrong. Use the `drawText` and `measure` helpers, not raw `fillText`.

**Text auto-shrinks and wraps to fit.** `fitSize` steps the event name, venue and
date down until they fit the column, and `wrapText` breaks them into lines. Don't
remove either — they're what make the poster reusable for other events.

**The camera can be flipped at any point, including mid-countdown.** That tears
the stream down and builds a new one, so for a moment there is no frame to grab.
The capture phase in `CameraScreen` retries a few times before giving up —
`CAPTURE_RETRIES`. Don't "simplify" that back into a single attempt.

**`.line-mask` lines must sit in a flex column.** `RiseText` clips each line so
the letters rise out of it, using padding plus a matching negative margin. Flex
items don't collapse margins; plain blocks do, which quietly loosens the leading
of `.t-display`. That's why the hero `<h1>` is `flex flex-col`.

## Lint rules that bite

`npm run lint` enforces React's newer hook rules and CI-style errors, not
warnings:

- No `setState` synchronously in an effect body. Put it inside a callback
  (`setTimeout`, an event handler) or use a lazy `useState(() => ...)`
  initialiser instead.
- No writing to refs during render. Sync refs inside an effect.

Both of these already caught real bugs during the build. Fix them properly rather
than disabling the rule.

## Testing changes

The camera only opens on `localhost` or `https`. A laptop webcam at
`localhost:3000` is fine for most work. Anything involving front/rear switching,
the Web Share sheet, or real touch targets needs testing on the deployed Vercel
URL from an actual phone.

## Deploying

```bash
git add .
git commit -m "what changed"
git push
```

Vercel rebuilds and redeploys automatically. Run `npm run build` locally first —
a build failure on Vercel takes longer to diagnose than one in your terminal.