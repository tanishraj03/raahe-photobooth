"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FilterRail from "@/components/FilterRail";
import StripProgress from "@/components/StripProgress";
import { captureFrame } from "@/lib/capture";
import { CAMERA_MESSAGES, useCamera } from "@/lib/camera";
import { DEFAULT_FILTER_ID, getFilter } from "@/lib/filters";

const TOTAL_SHOTS = 3;
const COUNT_FROM = 5;

/** Where we are in the shoot. */
type Phase =
  | { kind: "ready" }
  | { kind: "counting"; shot: number; n: number }
  | { kind: "capture"; shot: number }
  | { kind: "between"; shot: number }
  | { kind: "done" };

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

  const filter = getFilter(filterId);

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

      const video = videoRef.current;
      const shot = video
        ? captureFrame(video, filterRef.current, mirroredRef.current)
        : null;

      setFlash(true);
      if (shot) setPhotos((previous) => [...previous, shot]);

      const clearFlash = setTimeout(() => setFlash(false), 380);
      const advance = setTimeout(() => {
        setPhase(
          phase.shot < TOTAL_SHOTS - 1
            ? { kind: "between", shot: phase.shot + 1 }
            : { kind: "done" },
        );
      }, 560);

      return () => {
        clearTimeout(clearFlash);
        clearTimeout(advance);
      };
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

  const running = phase.kind !== "ready" && phase.kind !== "done";
  const activeShot =
    phase.kind === "counting" || phase.kind === "capture"
      ? phase.shot
      : phase.kind === "between"
        ? phase.shot
        : photos.length;

  const statusLine = running
    ? `Photo ${Math.min(activeShot + 1, TOTAL_SHOTS)} of ${TOTAL_SHOTS}`
    : "Ready when you are";

  /* ---------------- Render ---------------- */

  return (
    <div className="h-screen-safe relative flex flex-col overflow-hidden">
      {/* ---------- Header ---------- */}
      <header className="pt-safe shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
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

          <p className="t-label text-paper/55" aria-live="polite">
            {statusLine}
          </p>

          <button
            type="button"
            onClick={() => void flip()}
            disabled={!canFlip || running}
            aria-label="Switch camera"
            className="grid size-11 place-items-center rounded-full text-paper/70 transition-colors active:text-paper disabled:opacity-25"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
        </div>
      </header>

      {/* ---------- Strip building up ---------- */}
      <div className="shrink-0 pb-3">
        <StripProgress photos={photos} activeIndex={activeShot} />
      </div>

      {/* ---------- Live preview ---------- */}
      <main className="grid min-h-0 flex-1 place-items-center px-4">
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

          {/* Live colour wash, matching what capture will bake in. */}
          {filter.tint && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: filter.tint.color,
                opacity: filter.tint.alpha,
                mixBlendMode: filter.tint.blend,
              }}
            />
          )}

          {/* Countdown */}
          {phase.kind === "counting" && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-ink/30"
              />
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  key={phase.n}
                  className="t-display animate-count block text-[7rem] text-paper tabular-nums sm:text-[9rem]"
                  style={{ textShadow: "0 6px 40px rgba(0,0,0,.45)" }}
                >
                  {phase.n}
                </span>
              </span>
              <span
                key={`bar-${phase.shot}`}
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1.5 origin-left bg-pink"
                style={{ animation: "shutter-bar 5s linear forwards" }}
              />
            </>
          )}

          {/* Breath between photos */}
          {phase.kind === "between" && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="t-label animate-fade rounded-full bg-ink/75 px-5 py-2.5 text-paper">
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
                  className="t-display mt-7 rounded-2xl bg-pink px-8 py-4 text-[1.5rem] text-ink transition-transform active:scale-[0.98]"
                >
                  turn on camera
                </button>
              </div>
            </div>
          )}

          {status === "starting" && (
            <div className="animate-fade absolute inset-0 grid place-items-center bg-ink">
              <p className="t-label animate-pulse text-paper/50">
                Opening camera
              </p>
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
        />
      </div>

      {/* ---------- Action ---------- */}
      <footer className="pb-safe shrink-0 px-5 pt-3 pb-4">
        {notice && (
          <p className="t-body animate-fade mb-3 text-center text-[0.9rem] text-paper/55">
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
          <>
            <button
              type="button"
              onClick={start}
              disabled={status !== "ready"}
              className="t-display flex w-full items-center justify-center rounded-2xl bg-pink text-[1.9rem] text-ink transition-transform active:scale-[0.985] disabled:opacity-30"
              style={{ minHeight: 62 }}
            >
              start
            </button>
            <p className="t-label mt-3 text-center text-paper/35">
              3 photos · 5 second countdown
            </p>
          </>
        )}
      </footer>
    </div>
  );
}