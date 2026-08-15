"use client";

import { useEffect, useState } from "react";
import { composeStrip, type Strip } from "@/lib/compose";
import {
  canShareFiles,
  downloadImage,
  shareImage,
  stripFilename,
} from "@/lib/share";

const MIN_DEVELOP_MS = 600;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ResultScreen({
  photos,
  onRetake,
  onExit,
}: {
  photos: string[];
  onRetake: () => void;
  onExit: () => void;
}) {
  const [strip, setStrip] = useState<Strip | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Worked out once on mount. canShareFiles() already guards against
  // running where there is no navigator.
  const [shareable] = useState(() => canShareFiles());

  /* ---------------- Build the strip ---------------- */

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    (async () => {
      try {
        // The floor keeps the reveal feeling deliberate rather than
        // flashing past on a fast phone.
        const [result] = await Promise.all([
          composeStrip(photos),
          delay(MIN_DEVELOP_MS),
        ]);

        if (cancelled) {
          URL.revokeObjectURL(result.url);
          return;
        }
        created = result.url;
        setStrip(result);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [photos]);

  /* ---------------- Toast ---------------- */

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------------- Actions ---------------- */

  const save = () => {
    if (!strip) return;
    const outcome = downloadImage(strip.blob, stripFilename());
    if (outcome === "saved") setToast("Saved to your device");
    else if (outcome === "opened") setToast("Press and hold the image to save");
    else setToast("Couldn't save. Press and hold the strip instead.");
  };

  const share = async () => {
    if (!strip) return;
    const outcome = await shareImage(strip.blob, stripFilename());
    if (outcome === "unsupported" || outcome === "failed") save();
  };

  /* ---------------- Developing ---------------- */

  if (!strip && !failed) {
    return (
      <div className="h-screen-safe flex flex-col items-center justify-center gap-9 px-8">
        <div className="flex gap-2">
          {photos.map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo}
              alt=""
              className="w-16 rounded-md border border-hairline sm:w-20"
              style={{
                animation: `rise-in .55s var(--ease-out-soft) ${i * 0.1}s both`,
              }}
            />
          ))}
        </div>
        <p className="t-label animate-pulse text-pink">Developing your strip</p>
      </div>
    );
  }

  /* ---------------- Something went wrong ---------------- */

  if (failed) {
    return (
      <div className="h-screen-safe flex flex-col items-center justify-center gap-6 px-8 text-center">
        <h1 className="t-display text-[2.6rem] text-pink">
          the strip
          <br />
          didn&rsquo;t print
        </h1>
        <p className="t-body max-w-[28ch] text-paper/60">
          We couldn&rsquo;t put the photos together on this device. Running the
          three shots again usually fixes it.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="t-display rounded-2xl bg-pink px-7 py-3.5 text-[1.3rem] text-ink"
          >
            try again
          </button>
          <button
            type="button"
            onClick={onExit}
            className="t-label rounded-2xl border border-hairline px-6 py-4 text-paper/70"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- The strip ---------------- */

  return (
    <div className="h-screen-safe flex flex-col overflow-hidden">
      <header className="pt-safe shrink-0 px-6 pt-3 pb-3 text-center">
        <p className="t-label animate-rise text-pink">Photo strip ready</p>
        <h1 className="t-display animate-rise delay-1 mt-2 text-[2.1rem] text-paper sm:text-[2.6rem]">
          your raahe moment{" "}
          <span className="text-[0.7em] leading-none">✨</span>
        </h1>
      </header>

      <main className="relative min-h-0 flex-1">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View the photo strip larger"
          className="animate-reveal absolute inset-0 flex items-center justify-center px-6 py-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={strip!.url}
            alt="Your Raahe Open Mic photo strip"
            className="h-full w-full object-contain"
          />
        </button>
      </main>

      <footer className="pb-safe shrink-0 px-5 pt-3 pb-4">
        <p
          className="t-label mb-3 h-4 text-center text-paper/45 transition-opacity"
          aria-live="polite"
        >
          {toast ?? (shareable ? "Tap the strip to see it bigger" : "")}
        </p>

        <button
          type="button"
          onClick={save}
          className="t-display flex w-full items-center justify-center rounded-2xl bg-pink text-[1.8rem] text-ink transition-transform active:scale-[0.985]"
          style={{ minHeight: 62 }}
        >
          save photo
        </button>

        <div className="mt-3 flex gap-3">
          {shareable && (
            <button
              type="button"
              onClick={() => void share()}
              className="t-display flex flex-1 items-center justify-center rounded-2xl border border-hairline text-[1.35rem] text-paper/85 transition-transform active:scale-[0.985]"
              style={{ minHeight: 56 }}
            >
              share
            </button>
          )}
          <button
            type="button"
            onClick={onRetake}
            className="t-display flex flex-1 items-center justify-center rounded-2xl border border-hairline text-[1.35rem] text-paper/85 transition-transform active:scale-[0.985]"
            style={{ minHeight: 56 }}
          >
            retake
          </button>
        </div>
      </footer>

      {/* ---------------- Full size ---------------- */}
      {zoomed && (
        <div className="animate-fade fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink">
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="pt-safe sticky top-0 z-10 ml-auto grid size-14 place-items-center text-paper/70"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={strip!.url}
            alt="Your Raahe Open Mic photo strip"
            className="mx-auto block w-full max-w-[560px] px-4 pb-10"
          />
        </div>
      )}
    </div>
  );
}