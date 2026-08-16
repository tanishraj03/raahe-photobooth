"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandMark from "@/components/BrandMark";
import Cabinet from "@/components/Cabinet";
import {
  FlashControl,
  Shutter,
  TimerControl,
} from "@/components/CameraControls";
import Countdown from "@/components/Countdown";
import FilterLayers from "@/components/FilterLayers";
import FilterRail from "@/components/FilterRail";
import StripProgress from "@/components/StripProgress";
import { captureFrame } from "@/lib/capture";
import { CAMERA_MESSAGES, useCamera } from "@/lib/camera";
import { DEFAULT_FILTER_ID, getFilter } from "@/lib/filters";

const TOTAL_SHOTS = 3;
const DEFAULT_TIMER = 5;

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

/** The four corners of the capture frame. */
const CORNERS = [
  "top-0 left-0 rounded-tl-[10px] border-t-2 border-l-2",
  "top-0 right-0 rounded-tr-[10px] border-t-2 border-r-2",
  "bottom-0 left-0 rounded-bl-[10px] border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-[10px] border-r-2 border-b-2",
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

  const filter = getFilter(filterId);
  const running = phase.kind !== "ready" && phase.kind !== "done";

  // Refs let the countdown read current values without restarting
  // itself every time a control is touched.
  const filterRef = useRef(filter);
  const mirroredRef = useRef(mirrored);
  const phaseRef = useRef(phase);
  const takenRef = useRef<Set<number>>(new Set());
  const timerRef = useRef(timer);
  const torchRef = useRef(false);

  useEffect(() => {
    filterRef.current = filter;
    mirroredRef.current = mirrored;
    phaseRef.current = phase;
    timerRef.current = timer;
    // Only worth trying if the switch is on *and* this camera has a
    // lamp. On everything else the screen does the work.
    torchRef.current = flashOn && hasTorch;
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
    setPhase({ kind: "counting", shot: 0, n: timerRef.current });
  }, []);

  useEffect(() => {
    if (phase.kind === "counting") {
      // One to go: light the camera's own lamp, if it has one and the
      // switch is on. It needs a moment to come up to brightness.
      if (phase.n === 1 && torchRef.current) void setTorch(true);

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

        // The lamp goes out whether it ever came on or not.
        void setTorch(false);

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

  const blocked = gate === "ask" || status === "starting" || status === "error";

  /* ---------------- Render ---------------- */

  return (
    <Cabinet
      overlay
      className="camera-stage"
      top={
        <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
          <button
            type="button"
            onClick={() => {
              stop();
              onExit();
            }}
            aria-label="Leave the photobooth"
            className="grid size-10 place-items-center rounded-full bg-ink/40 text-paper/70 transition-colors active:text-paper"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <BrandMark height={26} className="opacity-90 lg:h-9" />

          <button
            type="button"
            onClick={() => void flip()}
            disabled={!canFlip}
            aria-label="Switch camera"
            className="group grid size-10 place-items-center rounded-full bg-ink/40 text-paper/70 transition-colors active:text-paper disabled:opacity-25"
          >
            <svg
              width="19"
              height="19"
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
        </div>
      }
      bottom={
        <div className="px-4 pb-4 lg:px-8 lg:pb-7">
          {notice && (
            <p className="t-body animate-toast mb-3 text-center text-[0.8rem] text-paper/60">
              {notice}
            </p>
          )}

          <StripProgress photos={photos} activeIndex={activeShot} />

          <div className="mt-3 lg:mt-5">
            <FilterRail
              activeId={filterId}
              onSelect={setFilterId}
              disabled={running || status !== "ready"}
            />
          </div>

          <div className="mx-auto mt-3 flex max-w-[34rem] items-center justify-between gap-4 lg:mt-5">
            <TimerControl
              value={timer}
              onChange={setTimer}
              disabled={running}
            />

            <Shutter
              onClick={running ? resetSession : start}
              disabled={status !== "ready"}
              running={running}
            />

            <FlashControl
              on={flashOn}
              onChange={setFlashOn}
              hasLamp={hasTorch}
              disabled={running}
            />
          </div>
        </div>
      }
    >
      {/* ---------- The camera, full bleed ---------- */}
      <div className="relative size-full overflow-hidden bg-black">
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

        {/* Colour and grain, exactly as capture will bake them in.
            Over the whole preview, since the whole preview is live. */}
        <FilterLayers filter={filter} />

        {/* The frame: what the shutter will actually keep. Everything
            outside it is dimmed by the box's own shadow. */}
        {!blocked && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="capture-box">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 ${
                  phase.kind === "counting" ? "animate-brackets" : "opacity-45"
                }`}
              >
                {CORNERS.map((corner) => (
                  <span
                    key={corner}
                    className={`absolute size-7 border-paper/80 ${corner}`}
                  />
                ))}
              </span>

              {phase.kind === "counting" && (
                <Countdown n={phase.n} seconds={timer} shot={phase.shot} />
              )}

              {phase.kind === "capture" && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="t-machine animate-slam text-[2.2rem] text-paper lg:text-[3rem]">
                    Flash
                  </span>
                </span>
              )}

              {phase.kind === "between" && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="t-label animate-toast rounded-full bg-ink/80 px-5 py-2.5 text-paper">
                    Next up
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Shutter */}
        {flash && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 bg-white"
            style={{ animation: "flash-pop 380ms ease-out forwards" }}
          />
        )}

        {/* ---------- Permission, loading, failure ---------- */}
        {gate === "ask" && status === "idle" && (
          <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-ink/95 px-8 text-center">
            <div>
              <h2 className="t-display text-[2.4rem] text-paper lg:text-[3.5rem]">
                step into
                <br />
                the booth
              </h2>
              <p className="t-body mx-auto mt-4 max-w-[28ch] text-paper/55 lg:text-[1.15rem]">
                We need your camera to take the three photos. They stay on your
                phone — nothing is uploaded.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGate("open");
                  void open();
                }}
                className="control control-lit t-machine mt-8 px-8 py-4 text-[1.15rem]"
              >
                Turn on camera
              </button>
            </div>
          </div>
        )}

        {status === "starting" && (
          <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-ink/95">
            <div className="w-44 text-center">
              <p className="t-label text-paper/50">Opening camera</p>
              <span className="relative mt-3 block h-px w-full overflow-hidden bg-paper/15">
                <span className="animate-track absolute inset-y-0 left-0 w-1/4 bg-pink" />
              </span>
            </div>
          </div>
        )}

        {status === "error" && problem && (
          <div className="animate-fade absolute inset-0 z-30 grid place-items-center bg-ink/95 px-8 text-center">
            <div>
              <h2 className="t-display text-[2.1rem] text-pink lg:text-[3rem]">
                {CAMERA_MESSAGES[problem].title}
              </h2>
              <p className="t-body mx-auto mt-4 max-w-[32ch] text-paper/55">
                {CAMERA_MESSAGES[problem].body}
              </p>
              <div className="mt-7 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void open()}
                  className="control control-lit t-machine px-6 py-3.5 text-[1rem]"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="control t-machine px-6 py-3.5 text-[1rem]"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Cabinet>
  );
}
