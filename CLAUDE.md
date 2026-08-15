# Raahe Open Mic Photobooth

A mobile-first web photobooth for the Raahe Open Mic event. Someone at the venue
scans a QR code, takes 3 photos with a 5-second countdown before each, picks a
filter, and gets a branded 4:5 poster they can save and post.

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
  BrandMark.tsx           Logo with typographic fallback
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
  compose.ts              Three photos → branded 4:5 poster (Canvas)
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

The export is **4:5, 1080 × 1350** — the tallest crop Instagram gives a feed
post. (Stories are 9:16 and will letterbox it, which is fine.)

A three-photo strip is about 1:3, so it can't fill a 4:5 frame on its own.
Instead the strip runs down the left as a film card with sprocket perforations,
and the event sits in the column beside it:

- the **date** sits on the top edge of the card
- the **mark, name, rule and venue** hang together off its bottom edge
- the name is set to the measure — `nameSize` is a starting point that shrinks
  until the longest word fits the column

Those two shared edges are what make the two columns read as one picture. The
air between them is deliberate.

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

Prefer these over ad-hoc font sizing. No cards, no gradients, no shadows.

### The app column

Every screen renders inside `.app-frame` in `page.tsx`: one column, `--app-width`
wide, centred, with hairlines down both sides on anything larger than a phone.
Without it the layout stretches across a monitor and falls apart, which is what
it used to do.

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