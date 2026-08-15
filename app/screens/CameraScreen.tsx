"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CountdownRing from "@/components/CountdownRing";
import FilterLayers from "@/components/FilterLayers";
import FilterRail from "@/components/FilterRail";
import StripProgress from "@/components/StripProgress";
import { captureFrame } from "@/lib/capture";
import { CAMERA_MESSAGES, useCamera } from "@/lib/camera";
import { DEFAULT_FILTER_ID, getFilter } from "@/lib/filters";

const TOTAL_SHOTS = 3;
const COUNT_FROM = 5;

/** Size of the still used to draw the filter chips. */
const SAMPLE_SIZE = 96;
/** How often that still is refreshed while you're choosing. */
const SAMPLE_EVERY_MS = 2600;

/**
 * Flipping the camera tears the stream down and builds a new one, so
 * for a moment there's no frame to grab. If the shutter lands in that
 * window we wait and try again rather than losing the photo.
 */
const CAPTURE_RETRIES = 6;
const CAPTURE_RETRY_MS = 130;

/** Where we are in the shoot. */
type Phase =
  | { kind: "ready" }
  | { kind: "counting"; shot: number; n: number }
  | { kind: "capture"; shot: number }
  | { kind: "between"; shot: number }
  | { kind: "done" };

/** The four corners of the viewfinder. */
const BRACKETS = [
  "top-0 left-0 rounded-tl-md border-t-2 border-l-2",
  "top-0 right-0 rounded-tr-md border-t-2 border-r-2",
  "bottom-0 left-0 rounded-bl-md border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-md border-r-2 border-b-2",
];

export default function CameraScreen({
  onComplete,
  onExit,
}: {
  onComplete: (photos: string[]) => void;
  onExit: () => void;
}) {
  const { videoRef, status, problem, mirrored, canFlip, open, stop, flip } =
    useCamera();

  const [gate, setGate] = useState<"checking" | "ask" | "open">("checking");
  const [filterId, setFilterId] = useState(DEFAULT_FILTER_ID);
  const [photos, setPhotos] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const [flash, setFlash] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sample, setSample] = useState<string | null>(null);

  const filter = getFilter(filterId);
  const running = phase.kind !== "ready" && phase.kind !== "done";

  // Refs let the countdown read current values without restarting itself
  // every time a filter is tapped.
  const filterRef = useRef(filter);
  const mirroredRef = useRef(mirrored);
  const phaseRef = useRef(phase);
  const takenRef = useRef<Set<number>>(new Set());

  // Declared before the countdown effect so the refs are fresh by the
  // time it reads them.
  useEffect(() => {
    filterRef.current = filter;
    mirroredRef.current = mirrored;
    phaseRef.current = phase;
  });

  /* ---------------- Permission ---------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const permissions = navigator.permissions;
        if (permissions?.query) {
          const result = await permissions.query({
            name: "camera" as PermissionName,
          });
          if (!cancelled && result.state === "granted") {
            setGate("open");
            void open();
            return;
          }
        }
      } catch {
        // Safari can't be asked this. Falling through to the intro is fine.
      }
      if (!cancelled) setGate("ask");
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /* ---------------- Live filter chips ---------------- */

  // A small square lifted off the camera every couple of seconds, so
  // every chip in the rail shows your own face wearing that filter.
  useEffect(() => {
    if (status !== "ready" || running) return;

    const grab = () => {
      const video = videoRef.current;
      if (!video?.videoWidth) return;

      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      // Centre crop, mirrored to match what's on screen.
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;
      if (mirrored) {
        ctx.translate(SAMPLE_SIZE, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, sx, sy, side, side, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      setSample(canvas.toDataURL("image/jpeg", 0.7));
    };

    const first = setTimeout(grab, 400);
    const repeat = setInterval(grab, SAMPLE_EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(repeat);
    };
  }, [status, running, mirrored, videoRef]);

  /* ---------------- The shoot ---------------- */

  const resetSession = useCallback(() => {
    takenRef.current.clear();
    setPhotos([]);
    setFlash(false);
    setPhase({ kind: "ready" });
  }, []);

  const start = useCallback(() => {
    takenRef.current.clear();
    setNotice(null);
    setPhotos([]);
    setFlash(false);
    setPhase({ kind: "counting", shot: 0, n: COUNT_FROM });
  }, []);

  useEffect(() => {
    if (phase.kind === "counting") {
      const timer = setTimeout(() => {
        setPhase(
          phase.n > 1
            ? { kind: "counting", shot: phase.shot, n: phase.n - 1 }
            : { kind: "capture", shot: phase.shot },
        );
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (phase.kind === "capture") {
      // Guards against React running this effect twice in development.
      if (takenRef.current.has(phase.shot)) return;
      takenRef.current.add(phase.shot);

      const timers: ReturnType<typeof setTimeout>[] = [];
      let tries = 0;

      const attempt = () => {
        const video = videoRef.current;
        const shot = video
          ? captureFrame(video, filterRef.current, mirroredRef.current)
          : null;

        // No frame yet — the camera is probably still coming back up
        // after a flip. Give it a moment.
        if (!shot && tries < CAPTURE_RETRIES) {
          tries++;
          timers.push(setTimeout(attempt, CAPTURE_RETRY_MS));
          return;
        }

        setFlash(true);
        if (shot) setPhotos((previous) => [...previous, shot]);

        timers.push(setTimeout(() => setFlash(false), 380));
        timers.push(
          setTimeout(() => {
            setPhase(
              phase.shot < TOTAL_SHOTS - 1
                ? { kind: "between", shot: phase.shot + 1 }
                : { kind: "done" },
            );
          }, 560),
        );
      };

      attempt();

      return () => timers.forEach(clearTimeout);
    }

    if (phase.kind === "between") {
      const timer = setTimeout(
        () => setPhase({ kind: "counting", shot: phase.shot, n: COUNT_FROM }),
        1200,
      );
      return () => clearTimeout(timer);
    }
  }, [phase, videoRef]);

  // Hand the finished strip over.
  useEffect(() => {
    if (phase.kind !== "done") return;

    const timer = setTimeout(() => {
      if (photos.length === TOTAL_SHOTS) {
        stop();
        onComplete(photos);
      } else {
        setNotice("One of the photos didn't come through. Let's run it again.");
        resetSession();
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [phase, photos, onComplete, stop, resetSession]);

  // If someone switches apps mid-countdown, end the session cleanly
  // rather than leaving a timer running behind a black screen.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      const kind = phaseRef.current.kind;
      if (kind === "counting" || kind === "capture" || kind === "between") {
        resetSession();
        setNotice("Session stopped when you left. Start again when ready.");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [resetSession]);

  /* ---------------- Derived UI state ---------------- */

  const activeShot =
    phase.kind === "counting" ||
    phase.kind === "capture" ||
    phase.kind === "between"
      ? phase.shot
      : photos.length;

  const statusLine = running
    ? `Photo ${Math.min(activeShot + 1, TOTAL_SHOTS)} of ${TOTAL_SHOTS}`
    : "Ready when you are";

  /* ---------------- Render ---------------- */

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ---------- Header ---------- */}
      <header className="pt-safe shrink-0">
        {/* px-3 lines the icons up with the gutter: 12px here plus the
            12px inside each 44px hit area lands on the same edge. */}
        <div className="flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={() => {
              stop();
              onExit();
            }}
            aria-label="Leave the photobooth"
            className="grid size-11 place-items-center rounded-full text-paper/70 transition-colors active:text-paper"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <p
            className="t-label flex items-center gap-2 text-paper/55"
            aria-live="polite"
          >
            {running && (
              <span
                aria-hidden="true"
                className="animate-blink block size-[6px] rounded-full bg-pink"
              />
            )}
            {statusLine}
          </p>

          {/* Balances the close button so the status line stays centred.
              Flipping lives on the preview now. */}
          <span className="size-11" aria-hidden="true" />
        </div>
      </header>

      {/* ---------- Strip building up ---------- */}
      <div className="shrink-0 pt-1 pb-4">
        <StripProgress photos={photos} activeIndex={activeShot} />
      </div>

      {/* ---------- Live preview ---------- */}
      <main className="gutter grid min-h-0 flex-1 place-items-center">
        <div className="preview-box relative isolate overflow-hidden rounded-2xl bg-ink-deep">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="size-full object-cover"
            style={{
              filter: filter.css || undefined,
              transform: mirrored ? "scaleX(-1)" : undefined,
            }}
          />

          {/* Colour and grain, exactly as capture will bake them in. */}
          <FilterLayers filter={filter} />

          {/* Viewfinder */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-3 ${
              phase.kind === "counting" ? "animate-brackets" : "opacity-30"
            }`}
          >
            {BRACKETS.map((corner) => (
              <span
                key={corner}
                className={`absolute size-7 border-pink ${corner}`}
              />
            ))}
          </span>

          {/* Countdown */}
          {phase.kind === "counting" && (
            <>
              <span
                aria-hidden="true"
                className="animate-fade pointer-events-none absolute inset-0 bg-ink/35"
              />
              <CountdownRing
                n={phase.n}
                seconds={COUNT_FROM}
                shot={phase.shot}
              />
            </>
          )}

          {/* Breath between photos */}
          {phase.kind === "between" && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="t-label animate-toast rounded-full bg-ink/80 px-5 py-2.5 text-paper">
                Next up
              </span>
            </span>
          )}

          {/* Shutter */}
          {flash && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-white"
              style={{ animation: "flash-pop 380ms ease-out forwards" }}
            />
          )}

          {/* Flip — on the preview, thumb-high, and live for the whole
              shoot. Turning round between photos is the point of a
              photobooth, so nothing about it is locked. */}
          {canFlip && (
            <button
              type="button"
              onClick={() => void flip()}
              aria-label="Switch camera"
              className="group animate-fade absolute right-3 bottom-3 grid size-14 place-items-center rounded-full bg-ink/75 text-pink ring-1 ring-paper/25 transition-transform duration-300 active:scale-90 active:ring-pink"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-active:rotate-180"
              >
                <path
                  d="M4 8a8 8 0 0 1 13.5-5.5M20 16A8 8 0 0 1 6.5 21.5"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                <path
                  d="M4 3v5h5M20 21v-5h-5"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* ---------- Overlays: permission, loading, failure ---------- */}
          {gate === "ask" && status === "idle" && (
            <div className="animate-fade absolute inset-0 grid place-items-center bg-ink p-6 text-center">
              <div>
                <p className="t-label text-pink">Camera</p>
                <h2 className="t-display mt-3 text-[2.6rem] text-paper">
                  step into
                  <br />
                  the booth
                </h2>
                <p className="t-body mx-auto mt-4 max-w-[26ch] text-paper/60">
                  We need your camera to take the three photos. They stay on
                  your phone — nothing is uploaded.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGate("open");
                    void open();
                  }}
                  className="t-display relative mt-7 overflow-hidden rounded-2xl bg-pink px-8 py-4 text-[1.5rem] text-ink transition-transform active:scale-[0.98]"
                >
                  <span className="sheen" aria-hidden="true" />
                  <span className="relative">turn on camera</span>
                </button>
              </div>
            </div>
          )}

          {status === "starting" && (
            <div className="animate-fade absolute inset-0 grid place-items-center bg-ink">
              <div className="w-40 text-center">
                <p className="t-label text-paper/50">Opening camera</p>
                <span className="relative mt-3 block h-px w-full overflow-hidden bg-hairline">
                  <span className="animate-track absolute inset-y-0 left-0 w-1/4 bg-pink" />
                </span>
              </div>
            </div>
          )}

          {status === "error" && problem && (
            <div className="animate-fade absolute inset-0 grid place-items-center bg-ink p-6 text-center">
              <div>
                <h2 className="t-display text-[2.4rem] text-pink">
                  {CAMERA_MESSAGES[problem].title}
                </h2>
                <p className="t-body mx-auto mt-4 max-w-[30ch] text-paper/60">
                  {CAMERA_MESSAGES[problem].body}
                </p>
                <div className="mt-7 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => void open()}
                    className="t-display rounded-2xl bg-pink px-7 py-3.5 text-[1.3rem] text-ink"
                  >
                    try again
                  </button>
                  <button
                    type="button"
                    onClick={onExit}
                    className="t-label rounded-2xl border border-hairline px-6 py-4 text-paper/70"
                  >
                    Go back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ---------- Filters ---------- */}
      <div className="shrink-0 pt-4">
        <FilterRail
          activeId={filterId}
          onSelect={setFilterId}
          disabled={running || status !== "ready"}
          preview={sample}
        />
      </div>

      {/* ---------- Action ---------- */}
      <footer className="pb-safe gutter shrink-0 pt-3 pb-4">
        {notice && (
          <p className="t-body animate-toast mb-3 text-center text-[0.9rem] text-paper/55">
            {notice}
          </p>
        )}

        {running ? (
          <button
            type="button"
            onClick={resetSession}
            className="t-display flex w-full items-center justify-center rounded-2xl border border-hairline text-[1.6rem] text-paper/80 transition-transform active:scale-[0.985]"
            style={{ minHeight: 62 }}
          >
            stop
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={status !== "ready"}
            className="t-display relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-pink text-[1.9rem] text-ink transition-transform active:scale-[0.985] disabled:opacity-30"
            style={{ minHeight: 62 }}
          >
            {status === "ready" && <span className="sheen" aria-hidden="true" />}
            <span className="relative">start</span>
          </button>
        )}
      </footer>
    </div>
  );
}
