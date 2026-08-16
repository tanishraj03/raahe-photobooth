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
  Cabinet.tsx             The booth: hood, bezel, tube, deck, base
  Control.tsx             A key on the deck. `lit` marks the one that glows
  Selector.tsx            A bank of switches: the timer, the flash
  SegmentDigit.tsx        One seven-segment numeral
  Countdown.tsx           The segment display + its draining gauge
  BrandMark.tsx           Logo with typographic fallback
  Drawing.tsx             One of the strip's illustrations, as SVG
  Backdrop.tsx            The room: dot field and grain
  Marquee.tsx             Endless tracked-caps ticker
  RiseText.tsx            Display type revealed letter by letter
  FilterRail.tsx          The filter bank: numbered keys, lit when selected
  FilterLayers.tsx        Renders a filter's washes + grain over anything
  StripProgress.tsx       Three cells that fill with real thumbnails
lib/
  config/
    event.ts              Event name, venue, date, logo paths
    frame.ts              All poster geometry and colours
  camera.ts               useCamera hook: permissions, errors, device switching
  capture.ts              Video frame → filtered JPEG
  compose.ts              Three photos → the 9:16 strip (Canvas)
  illustrations.ts        The drawings and the cable, as path data
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

## The exported strip

The export is **9:16, 1080 × 1920, and the whole of it is the strip.** Not a
story with a strip sitting on it: the trim of the image is the trim of the
print, the borders either side of the photos are the strip's own borders, and
the artwork in them runs to the edge.

That distinction is the whole design. If you ever find yourself drawing a
background and then placing a smaller strip on it, stop.

    head    a camera going off, RAAHE.CO, a pink rule
    photos  three of them, full width bar the borders
    borders the cable, and three drawings down each side
    foot    a rule, then mark, name, venue, date, centred

**The photos are 16:9 because of arithmetic, not taste.** Three photos across
the full width of a 1080 × 1920 strip, with room left at the head and the foot,
only fits at about that shape — squares would need 2760px of height and there
are 1920. `FRAME.poster.border` is the dial: widen it for a richer border,
narrow it for bigger photos.

## Illustrations

`lib/illustrations.ts` holds the artwork, authored as SVG path data and painted
through `Path2D` — so the same drawings serve the print and the screen.

**These are drawings, not icons, and the difference is the point.** Three things
keep them on the right side of that line:

- **Line first.** Nearly every part is a stroke, not a fill. A stroke with a
  round cap reads as a hand; a filled shape reads as a symbol.
- **Wobble.** The outlines are gently curved rather than straight — a rectangle
  drawn with four `C` segments that drift a pixel or two looks drawn, and the
  same rectangle drawn with `L` looks printed by a machine.
- **Hatching.** A few parallel strokes for shade, the way a screen print does it.

`paintCable` draws the lead that ties a border's drawings together, so they read
as a scene rather than a column of objects.

**You can look at them.** Node runs the TypeScript directly, so the real path
data can be dumped to JSON and rasterised — that's how the hand got drawn. Don't
author illustrations blind; render them and look.

None of it is traced from the illustrations in the Raahe brand guide, and that
distinction matters — see the hard constraints above.

## The machine

The app is a photobooth — a physical object with a screen in it, not a website
with a camera. `components/Cabinet.tsx` is that object and every stage renders
inside one:

    hood    speaker grilles, the lens, the flash bulb, the name plate
    bezel   a raised frame with the tube sunk into it
    deck    the controls, indicator lamps, the unit plate
    base    the slot the strip prints out of, vents, markings

What changes between home, camera and result is what's on the screen — never
the machine around it. `lean` trims the base to its slot where the screen needs
the height. `flash` fires the bulb on the hood, so the machine reacts when a
photo is taken. `status` is the two or three words on the name plate.

**It is the same object at every size**, and that's the point — see
**Proportion** below for how its width is derived. Three bands, all one
composition:

- **phone** — the casing runs to all four edges and the screen is most of what
  you see.
- **≥34rem** — the object pulls in, gains its corner radius and its outer
  shadow, and stands in the room.
- **≥64rem** — same object, taller, with the hood carrying the mark and the name
  plate beside the lens and the deck laying its controls out in a row. Reach for
  the `lg:` classes in `Cabinet.tsx` and the screens.

Its markings live in `MACHINE` in `lib/config/event.ts`, not in the component.

## Materials

None of this is a photorealistic render. It's the handful of cues in
`globals.css` that make a flat panel read as a solid one:

| Class | Is |
|---|---|
| `.panel` / `.machine` | painted metal, lit from above |
| `.inset` | anything sunk into the casing |
| `.bezel` / `.tube` | the frame and the glass |
| `.control` | a key standing on its own shadow |
| `.grain` | fine noise over a surface, so nothing is perfectly clean |
| `.screw` `.grille` `.vents` `.lens` `.bulb` `.lamp` `.slot` `.plate` | the fittings |

The rule behind all of it: **a light top edge, a dark bottom edge, and a shadow
where something is recessed.** That's what sells an edge. `--key-throw` is how
far a control travels when pressed, and `.control:active` moves it down by
exactly the shadow it was standing on — change one and change the other.

Gradients are for material only — the lit face of a panel, the curve of a key.
Not for decoration.

**Keep the tube's effects off the content.** Scanlines, vignette and flicker all
live on `.tube::after`, above the screen and faint. The flicker in particular
must never go on `.tube` itself: that would dim the camera preview with it, and
a preview that pulses is a preview you don't trust.

On the camera screen the square the camera actually captures sits in the middle
of the tube with the HUD above it and the filter bank below, letterboxed against
the glass. Don't be tempted to make the video fill the tube — the preview would
then show more than the square that gets captured, and it would be lying.

**`.preview-box` gets its size from `--machine-chrome`.** See **Proportion**.

## Proportion

This is where the layout goes wrong if it goes wrong, so it's worth stating.

**The machine's height is the viewport. Its width is worked back from its
screen.** The preview inside the tube is square, so the casing only ever needs
to be that square plus its own sides — which is what stops the tube stretching
into a letterbox on a monitor while the picture sits small in the middle of it.
Two custom properties carry it, both in `globals.css`:

    --machine-chrome   everything above and below the preview
    --machine-sides    everything either side of it

`.app-frame` sets its `max-width` from those, and `.preview-box` sets its width
from the same `--machine-chrome`, so the two can't drift. **Add a row to the
hood, the deck, the HUD or the filter bank and add its height to
`--machine-chrome` too**, or the square grows past its space and the tube clips
the bottom off it.

A floor — `max(46rem, …)` — keeps the machine from going gaunt on a short, wide
monitor, at the cost of a little empty glass either side of the preview there.

**Never fix a proportion with `transform: scale()` on the interface.** Every
size here comes from `min()`, `max()`, `clamp()`, `aspect-ratio` and viewport
units, and it should stay that way.

**There is one composition, not two.** The machine is a portrait object at every
size; it gets bigger, never wider. Stages that split into two columns don't fit
inside it and were removed. Sizes were checked at 375×812 through 1920×1080 — if
you change a chrome height, check them again.

## Typography

Three voices, and the tension between them is the whole design:

- `.t-display` — huge, tight, lowercase. The brand.
- `.t-label` — tiny, wide-tracked caps. What's printed on the panels.
- `.t-machine` — bold upright caps. What the display shouts and what's
  stencilled on the keys.

Prefer these over ad-hoc font sizing.

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
- `.t-machine` — 800 weight, UPPERCASE, upright, for the machine's own voice

The pink is the machine's light: the one lit key, the lamps, the countdown, the
glow inside the tube. Everything else is painted metal and glass. If a second
thing on a screen is glowing pink, one of them is wrong.

See **Materials** above for how the surfaces are built.

### The app column

Every screen renders inside `.app-frame` in `page.tsx`: one column, `--app-width`
wide, centred on the `.app-stage`. On a phone the machine fills it. On anything
larger it is capped in **both** directions, because a phone layout stretched to
the full height of a monitor is nobody's idea of a design.

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
`lib/config/frame.ts` — it's 16:9 — you must also change `aspect-ratio` in the
`.preview-box` rule in `app/globals.css`, or the camera preview stops matching
the output. `.preview-box` also multiplies by the aspect in its `width` calc,
so that needs changing too.

**A filter is described once and rendered twice.** Each entry in `filters.ts` is
a CSS filter string (`css`), a list of colour layers (`washes`) and a grain
amount. The washes are turned into CSS by `washStyle()` and into canvas paints by
`paintWash()` — both live in `lib/washes.ts`, side by side, so they can't drift.
`FilterLayers.tsx` stacks them over the video and over the picker chips;
`capture.ts` paints them onto the canvas in the same order.

Add a filter by adding an entry. Add a *kind* of layer and you must extend both
renderers in `washes.ts`, or the preview lies about what people will get.

**Wash geometry only lines up because both frames share one aspect.** The
preview box and the captured photo are both `FRAME.cellAspect`, so a gradient
angle or a vignette radius lands in the same place on each. Change the aspect
and check the washes again.

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

**The flash is two things, and only one of them always works.** The screen flash
is a white overlay and is guaranteed. The camera's own lamp is an optional
constraint on the live track: `useCamera` asks the track whether it has one —
freshly on every open, because a phone's front camera usually hasn't even when
its back camera has — and `setTorch` resolves to what actually happened. Never
show the lamp as available without asking, and never let its absence break a
shoot. It's lit one second before the shutter, because a lamp takes a moment to
come up to brightness.

**The timer is 3, 5 or 10 seconds and lives in a ref.** The countdown effect
reads `timerRef`, not the state, so changing the switch mid-shoot can't restart
the run. Ten needs two digits — `Countdown` splits the number, so don't assume
one.

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