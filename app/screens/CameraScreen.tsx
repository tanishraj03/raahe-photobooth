"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import Countdown from "@/components/Countdown";
import FilterLayers from "@/components/FilterLayers";
import FilterRail from "@/components/FilterRail";
import Selector from "@/components/Selector";
import StripProgress from "@/components/StripProgress";
import { captureFrame } from "@/lib/capture";
import { CAMERA_MESSAGES, useCamera } from "@/lib/camera";
import { DEFAULT_FILTER_ID, getFilter } from "@/lib/filters";

const TOTAL_SHOTS = 3;

/** What the timer switch offers, and where it starts. */
const TIMERS = [
  { value: 5, label: "5s" },
  { value: 3, label: "3s" },
  { value: 10, label: "10s" },
] as const;
const DEFAULT_TIMER = 5;

const FLASH_OPTIONS = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
] as const;

/** Size of the still used to draw the filter keys. */
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

/**
 * How long the white overlay stays up. The keyframe holds at full
 * white for a third of this, so it lands as a flash rather than a
 * glow — change one and change `flash-pop` in globals.css with it.
 */
const FLASH_MS = 520;

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
  const {
    videoRef,
    status,
    problem,
    mirrored,
    canFlip,
    hasTorch,
    open,
    stop,
    flip,
    setTorch,
  } = useCamera();

  const [gate, setGate] = useState<"checking" | "ask" | "open">("checking");
  const [filterId, setFilterId] = useState(DEFAULT_FILTER_ID);
  const [timer, setTimer] = useState<number>(DEFAULT_TIMER);
  const [flashOn, setFlashOn] = useState(true);
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
  const timerRef = useRef(timer);
  const torchRef = useRef(false);
  /**
   * Whether the camera's own lamp actually came on for this shot.
   * `setTorch` resolves to what really happened, so this is the truth
   * rather than what we hoped for — and the screen flash keys off it.
   */
  const torchLitRef = useRef(false);

  // Declared before the countdown effect so the refs are fresh by the
  // time it reads them.
  useEffect(() => {
    filterRef.current = filter;
    mirroredRef.current = mirrored;
    phaseRef.current = phase;
    timerRef.current = timer;
    // Attempt the lamp whenever the switch is on. `setTorch` asks the
    // live track and resolves false if there's no light, so we don't
    // gate on `hasTorch` here — that's React state, and after a flip to
    // the rear camera it can still be reporting the front camera's
    // answer at the moment the countdown reaches one.
    torchRef.current = flashOn;
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

  /* ---------------- Live filter keys ---------------- */

  // A small square lifted off the camera every couple of seconds, so
  // every key in the bank shows your own face wearing that filter.
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
    setPhase({ kind: "counting", shot: 0, n: timerRef.current });
  }, []);

  useEffect(() => {
    if (phase.kind === "counting") {
      // Two to go: light the camera's own lamp. A phone lamp takes a
      // few hundred milliseconds to reach full brightness, so one
      // second of lead was cutting it fine — the shutter could land
      // while it was still ramping and the photo came out unlit.
      if (phase.n === 2) {
        torchLitRef.current = false;
        if (torchRef.current) {
          void setTorch(true).then((lit) => {
            torchLitRef.current = lit;
          });
        }
      }

      const tick = setTimeout(() => {
        setPhase(
          phase.n > 1
            ? { kind: "counting", shot: phase.shot, n: phase.n - 1 }
            : { kind: "capture", shot: phase.shot },
        );
      }, 1000);
      return () => clearTimeout(tick);
    }

    if (phase.kind === "capture") {
      // Guards against React running this effect twice in development.
      if (takenRef.current.has(phase.shot)) return;
      takenRef.current.add(phase.shot);

      const timers: ReturnType<typeof setTimeout>[] = [];
      let tries = 0;

      const attempt = () => {
        // Assert the lamp again. If the countdown's attempt failed —
        // a flip mid-count rebuilds the track, and the new one starts
        // dark — this is the last chance to light it.
        if (torchRef.current && !torchLitRef.current) {
          void setTorch(true).then((lit) => {
            torchLitRef.current = lit;
          });
        }

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

        // The screen only flashes when the camera's own lamp didn't.
        // On the rear camera with a working lamp, the light comes from
        // the phone's flash where it belongs — blasting the screen
        // white as well would just blind the person holding it, and
        // the screen is behind them anyway.
        if (!torchLitRef.current) setFlash(true);

        if (shot) setPhotos((previous) => [...previous, shot]);

        // The lamp goes out whether it ever came on or not.
        void setTorch(false);
        torchLitRef.current = false;

        timers.push(setTimeout(() => setFlash(false), FLASH_MS));
        timers.push(
          setTimeout(() => {
            setPhase(
              phase.shot < TOTAL_SHOTS - 1
                ? { kind: "between", shot: phase.shot + 1 }
                : { kind: "done" },
            );
          }, FLASH_MS + 180),
        );
      };

      attempt();

      return () => timers.forEach(clearTimeout);
    }

    if (phase.kind === "between") {
      const wait = setTimeout(
        () =>
          setPhase({ kind: "counting", shot: phase.shot, n: timerRef.current }),
        1200,
      );
      return () => clearTimeout(wait);
    }
  }, [phase, videoRef, setTorch]);

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

  const machineStatus = running
    ? `Shot ${Math.min(activeShot + 1, TOTAL_SHOTS)} of ${TOTAL_SHOTS}`
    : status === "ready"
      ? "Standing by"
      : "Warming up";

  /* ---------------- Render ---------------- */

  return (
    <Cabinet
      lean
      flash={flash}
      status={machineStatus}
      deck={
        <>
          {notice && (
            <p className="t-body animate-toast mb-2.5 text-center text-[0.8rem] text-paper/55">
              {notice}
            </p>
          )}

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:gap-5">
            <div className="flex gap-2.5 lg:flex-1">
              <div className="flex-1 lg:max-w-[15rem]">
                <Selector
                  label="Timer"
                  options={TIMERS}
                  value={timer}
                  onChange={setTimer}
                  disabled={running}
                />
              </div>
              <div className="flex-1 lg:max-w-[12rem]">
                <Selector
                  label="Flash"
                  options={FLASH_OPTIONS}
                  value={flashOn ? "on" : "off"}
                  onChange={(next) => setFlashOn(next === "on")}
                  disabled={running}
                  note={hasTorch ? "Lamp" : "Screen"}
                />
              </div>
            </div>

            <div className="lg:w-[22rem]">
              {running ? (
                <Control
                  onClick={resetSession}
                  note="Cancel the run"
                  height={58}
                >
                  Stop
                </Control>
              ) : (
                <Control
                  lit
                  onClick={start}
                  disabled={status !== "ready"}
                  note={`3 shots · ${timer}s`}
                  height={58}
                >
                  Start
                </Control>
              )}
            </div>
          </div>
        </>
      }
    >
      {/* The shutter, over everything.
          `fixed`, not `absolute`: a flash that lights only the little
          preview box reads as a white rectangle on a dark screen. The
          whole phone going off is what a real booth does, and it's
          what makes people blink and laugh. */}
      {flash && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] bg-white"
          style={{ animation: `flash-pop ${FLASH_MS}ms ease-out forwards` }}
        />
      )}

      {/* The tube: a HUD across the top, the frame the camera
          actually captures in the middle, the filter bank below. */}
      <div className="flex h-full flex-col">
        {/* ---------- HUD ---------- */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pt-2 pb-1">
          <button
            type="button"
            onClick={() => {
              stop();
              onExit();
            }}
            aria-label="Leave the photobooth"
            className="grid size-7 place-items-center rounded-full text-paper/50 transition-colors active:text-paper"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <StripProgress photos={photos} activeIndex={activeShot} />

          <span
            className="t-label w-8 shrink-0 text-right text-[8px] text-paper/40"
            aria-hidden="true"
          >
            {String(Math.min(activeShot + 1, TOTAL_SHOTS)).padStart(2, "0")}/
            {String(TOTAL_SHOTS).padStart(2, "0")}
          </span>
        </div>

        {/* ---------- Live preview ---------- */}
        <main className="grid min-h-0 flex-1 place-items-center px-2.5">
          <div className="preview-box relative isolate overflow-hidden rounded-lg bg-black">
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
              className={`pointer-events-none absolute inset-2 ${
                phase.kind === "counting" ? "animate-brackets" : "opacity-30"
              }`}
            >
              {BRACKETS.map((corner) => (
                <span
                  key={corner}
                  className={`absolute size-6 border-pink ${corner}`}
                />
              ))}
            </span>

            {/* Countdown */}
            {phase.kind === "counting" && (
              <>
                <span
                  aria-hidden="true"
                  className="animate-fade pointer-events-none absolute inset-0 bg-ink/45"
                />
                <Countdown n={phase.n} seconds={timer} shot={phase.shot} />
              </>
            )}

            {/* The moment itself */}
            {phase.kind === "capture" && (
              <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <span className="t-machine animate-slam text-[2.4rem] text-paper">
                  Flash
                </span>
              </span>
            )}

            {/* Breath between photos */}
            {phase.kind === "between" && (
              <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <span className="t-label animate-toast rounded-full bg-ink/85 px-5 py-2.5 text-paper">
                  Next up
                </span>
              </span>
            )}

            {/* Flip — thumb-high and live for the whole shoot. Turning
                round between photos is the point of a photobooth. */}
            {canFlip && (
              <button
                type="button"
                onClick={() => void flip()}
                aria-label="Switch camera"
                className="group animate-fade absolute right-2 bottom-2 z-10 grid size-11 place-items-center rounded-full bg-ink/80 text-pink ring-1 ring-paper/25 transition-transform duration-300 active:scale-90 active:ring-pink"
              >
                <svg
                  width="21"
                  height="21"
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
              <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-black/95 p-5 text-center">
                <div>
                  <p className="t-label text-pink">Camera</p>
                  <h2 className="t-display mt-3 text-[2rem] text-paper">
                    step into
                    <br />
                    the booth
                  </h2>
                  <p className="t-body mx-auto mt-3 max-w-[26ch] text-[0.9rem] text-paper/60">
                    We need your camera to take the three photos. They stay on
                    your phone — nothing is uploaded.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGate("open");
                      void open();
                    }}
                    className="control control-lit t-machine relative mt-6 overflow-hidden px-6 py-3.5 text-[1.1rem]"
                  >
                    <span className="sheen" aria-hidden="true" />
                    <span className="relative">Turn on camera</span>
                  </button>
                </div>
              </div>
            )}

            {status === "starting" && (
              <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-black/95">
                <div className="w-40 text-center">
                  <p className="t-label text-paper/50">Opening camera</p>
                  <span className="relative mt-3 block h-px w-full overflow-hidden bg-paper/15">
                    <span className="animate-track absolute inset-y-0 left-0 w-1/4 bg-pink" />
                  </span>
                </div>
              </div>
            )}

            {status === "error" && problem && (
              <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-black/95 p-5 text-center">
                <div>
                  <h2 className="t-display text-[1.9rem] text-pink">
                    {CAMERA_MESSAGES[problem].title}
                  </h2>
                  <p className="t-body mx-auto mt-3 max-w-[30ch] text-[0.85rem] text-paper/60">
                    {CAMERA_MESSAGES[problem].body}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void open()}
                      className="control control-lit t-machine px-5 py-3 text-[1rem]"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={onExit}
                      className="control t-machine px-5 py-3 text-[1rem]"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ---------- Filter bank ---------- */}
        <div className="shrink-0 pt-1">
          <FilterRail
            activeId={filterId}
            onSelect={setFilterId}
            disabled={running || status !== "ready"}
            preview={sample}
          />
        </div>
      </div>
    </Cabinet>
  );
}