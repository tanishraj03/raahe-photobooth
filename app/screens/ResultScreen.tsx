"use client";

import { useEffect, useState } from "react";
import Cabinet from "@/components/Cabinet";
import { composeStrip, type Strip } from "@/lib/compose";
import {
  canShareFiles,
  downloadImage,
  shareImage,
  stripFilename,
} from "@/lib/share";

const MIN_DEVELOP_MS = 900;

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
  const [saved, setSaved] = useState(false);
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

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(timer);
  }, [saved]);

  /* ---------------- Actions ---------------- */

  const save = () => {
    if (!strip) return;
    const outcome = downloadImage(strip.blob, stripFilename());
    if (outcome === "saved") {
      setSaved(true);
      setToast("Saved to your device");
    } else if (outcome === "opened") {
      setToast("Press and hold the image to save");
    } else {
      setToast("Couldn't save. Press and hold the strip instead.");
    }
  };

  const share = async () => {
    if (!strip) return;
    const outcome = await shareImage(strip.blob, stripFilename());
    if (outcome === "unsupported" || outcome === "failed") save();
  };

  /* ---------------- Developing ---------------- */

  if (!strip && !failed) {
    return (
      <Cabinet credits={false}>
        <div className="flex h-full flex-col items-center justify-center gap-9 px-6">
          <div className="flex gap-2.5">
            {photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={photo}
                alt=""
                className="animate-develop w-16 rounded-md border border-hairline"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>

          <div className="w-44">
            <p className="t-label text-center text-pink">
              Developing your strip
            </p>
            <span className="relative mt-3 block h-px w-full overflow-hidden bg-hairline">
              <span className="animate-track absolute inset-y-0 left-0 w-1/3 bg-pink" />
            </span>
          </div>
        </div>
      </Cabinet>
    );
  }

  /* ---------------- Something went wrong ---------------- */

  if (failed) {
    return (
      <Cabinet
        credits={false}
        deck={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRetake}
              className="t-display flex flex-1 items-center justify-center rounded-2xl bg-pink text-[1.3rem] text-ink"
              style={{ minHeight: 56 }}
            >
              try again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="t-label flex flex-1 items-center justify-center rounded-2xl border border-hairline text-paper/70"
              style={{ minHeight: 56 }}
            >
              Go home
            </button>
          </div>
        }
      >
        <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <h1 className="t-display animate-rise text-[2.2rem] text-pink">
            the strip
            <br />
            didn&rsquo;t print
          </h1>
          <p className="t-body animate-rise delay-1 max-w-[28ch] text-[0.95rem] text-paper/60">
            We couldn&rsquo;t put the photos together on this device. Running
            the three shots again usually fixes it.
          </p>
        </div>
      </Cabinet>
    );
  }

  /* ---------------- The strip ---------------- */

  return (
    <>
      <Cabinet
        credits={false}
        lean
        deck={
          <>
            <p
              className="t-label mb-2.5 flex h-4 items-center justify-center text-paper/45"
              aria-live="polite"
            >
              {toast ? (
                <span key={toast} className="animate-toast">
                  {toast}
                </span>
              ) : (
                "Tap the strip to see it bigger"
              )}
            </p>

            <button
              type="button"
              onClick={save}
              className="t-display relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-pink text-[1.65rem] text-ink transition-transform active:scale-[0.985]"
              style={{ minHeight: 58 }}
            >
              <span className="sheen" aria-hidden="true" />
              {saved && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="animate-land relative"
                >
                  <path
                    d="m5 12.5 4.5 4.5L19 7"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="relative">{saved ? "saved" : "save photo"}</span>
            </button>

            <div className="mt-2.5 flex gap-3">
              {shareable && (
                <button
                  type="button"
                  onClick={() => void share()}
                  className="t-display flex flex-1 items-center justify-center rounded-2xl border border-hairline text-[1.25rem] text-paper/85 transition-colors duration-200 hover:border-pink/60 active:scale-[0.985]"
                  style={{ minHeight: 50 }}
                >
                  share
                </button>
              )}
              <button
                type="button"
                onClick={onRetake}
                className="t-display flex flex-1 items-center justify-center rounded-2xl border border-hairline text-[1.25rem] text-paper/85 transition-colors duration-200 hover:border-pink/60 active:scale-[0.985]"
                style={{ minHeight: 50 }}
              >
                retake
              </button>
            </div>
          </>
        }
      >
        <div className="flex h-full flex-col">
          <p className="t-label animate-rise flex shrink-0 items-center gap-2.5 px-4 pt-3 text-pink">
            <span
              aria-hidden="true"
              className="animate-blink block size-[7px] rounded-full bg-pink"
            />
            Photo strip ready
          </p>

          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="View the photo strip larger"
            className="flex min-h-0 flex-1 items-center justify-center px-4 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={strip!.url}
              alt="Your Raahe Open Mic photo strip"
              className="animate-print max-h-full max-w-full rounded-md"
            />
          </button>
        </div>
      </Cabinet>

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
            className="animate-fade mx-auto block w-full max-w-[440px] px-4 pb-10"
          />
        </div>
      )}
    </>
  );
}
