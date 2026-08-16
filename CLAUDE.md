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
  Cabinet.tsx             The shell: a ground, and bars over or around a stage
  CameraControls.tsx      Shutter, timer, flash — phone-camera logic
  Control.tsx             A key. `lit` marks the one that glows
  SegmentDigit.tsx        One seven-segment numeral
  Countdown.tsx           The segment display + its draining gauge
  BrandMark.tsx           Logo with typographic fallback
  Backdrop.tsx            The ground: one fall of tone
  RiseText.tsx            Display type revealed letter by letter
  FilterRail.tsx          Filter names in a row, low over the picture
  FilterLayers.tsx        Renders a filter's washes + grain over anything
  StripProgress.tsx       Three cells that fill with real thumbnails
lib/
  config/
    event.ts              Event name, venue, date, logo paths
    frame.ts              All poster geometry and colours
  camera.ts               useCamera hook: permissions, errors, device switching
  capture.ts              Video frame → filtered JPEG
  compose.ts              Three photos → the 9:16 strip (Canvas)
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

    head    RAAHE.CO, a hairline
    photos  three squares, centred
    borders the event set on its side, and the frame numbers
    foot    a hairline, then [mark] raahe open mic — one lockup —
            with the venue and the date under it

**The mark and the name are one lockup**, set side by side and sized against
each other. Not a small logo floating above a line of type.

**The photos are square**, which is the shape that serves both ends: three of
them stack into the strip with room to spare, and on a phone a square preview
fills the width and most of the height. At 500px they're as large as the head
and the foot allow — if you want them bigger, that height has to come from
`headShare` or the foot, not from nowhere.

## Illustrations — read this before drawing anything

**There are none, and that was a decision.**

Three attempts were made to hand-author editorial illustrations as SVG path
data: small musical objects, then bigger ones with wobbled outlines and
hatching, then a hand. Every one came out as clip art. Line-art of the density
the brief asks for — hands working a mixer, a room full of gear, objects
overlapping — is not something you can write coordinate by coordinate.

So the borders carry type and nothing else, and they look better for it. A
sparse, well-set border beats a border full of small drawn objects at any size.

**If you are tempted to add drawings back, don't hand-author them.**
`FRAME.art` points at `/public/art/border-left.svg` and `border-right.svg`.
Drop real commissioned artwork there — line art, transparent, portrait, roughly
1:4 — and `compose.ts` draws it into the borders automatically, replacing the
side type. Nothing is drawn if the files aren't there, and the strip is designed
to look finished without them.

## The camera stage

The app is a camera first and a photobooth second. On every size the video
fills the whole stage and the bars float over it — nothing above and below
squeezing it into a letterbox.

**`.capture-box` is the honest bit.** The square it marks is exactly what the
shutter keeps; everything outside it is dimmed by that one element's
`box-shadow`, the way a camera app shows its crop. That's what lets the preview
be the size of the screen while still telling the truth. Its size comes from
`--camera-chrome`, which is the top and bottom bars added up — add a row to a
bar and add it there too.

Controls follow phone-camera logic, not website logic: shutter big and central
under the thumb, timer and flash small either side of it, filters a row of names
low over the picture. If a control is growing into a card, it's going the wrong
way.

Two compositions, not one scaled:

- **phone** — one column, bars stacked over the camera.
- **≥48rem** — the app takes the whole viewport. The camera is the room. The
  idle and result stages split into two columns; the camera stage stays single
  because the picture is the point. Reach for the `lg:` classes — never make the
  phone layout bigger and call it desktop.

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

**Pink is the one light in the room** — the shutter, the active filter, the
countdown, the date on the print. Everything else is paper, grey and dark. If
two things on a screen are pink, one of them is wrong.

**Restraint is the brief.** Roughly 80% plain working camera, 20% Raahe. The
booth reads as a machine through its type, its one accent and what it leaves
out — not through drawn hardware. An earlier pass had speaker grilles, screws,
lamps, vents, a tube glow and a scanline overlay; all of it came out, and the
app is better for it. **Don't fill empty space.** Whitespace is the design.

### The app column

Every screen renders inside `.app-frame` in `page.tsx`. On a phone it's one
column filling the viewport; past 48rem it takes the whole viewport instead.

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
`lib/config/frame.ts` — it's square — you must also change `aspect-ratio` in the
`.capture-box` rule in `app/globals.css`, or the frame on screen stops matching
the crop the shutter takes.

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
