"use client";

import { useEffect, useState } from "react";
import Cabinet from "@/components/Cabinet";
import Control from "@/components/Control";
import { EVENT } from "@/lib/config/event";
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
      <Cabinet lean status="Developing">
        <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
          <div className="flex gap-2.5">
            {photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={photo}
                alt=""
                className="animate-develop w-16 rounded-sm ring-1 ring-paper/15"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>

          <div className="w-44">
            <p className="t-label text-center text-[9px] text-pink">
              Developing your strip
            </p>
            <span className="relative mt-3 block h-px w-full overflow-hidden bg-paper/15">
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
        lean
        status="Fault"
        deck={
          <div className="flex gap-2.5">
            <Control lit onClick={onRetake} height={56} className="flex-1">
              Retry
            </Control>
            <Control onClick={onExit} height={56} className="flex-1">
              Home
            </Control>
          </div>
        }
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="t-display animate-rise text-[2rem] text-pink">
            the strip
            <br />
            didn&rsquo;t print
          </h1>
          <p className="t-body animate-rise delay-1 max-w-[28ch] text-[0.9rem] text-paper/60">
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
        lean
        status="Photo developed"
        deck={
          <>
            <p
              className="t-label mb-2.5 flex h-3.5 items-center justify-center text-[8.5px] text-paper/40"
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

            <Control
              lit
              onClick={save}
              height={56}
              note={saved ? undefined : "9:16 story"}
              icon={
                saved ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="animate-land"
                  >
                    <path
                      d="m5 12.5 4.5 4.5L19 7"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : undefined
              }
            >
              {saved ? "Saved" : "Download"}
            </Control>

            <div className="mt-2.5 flex gap-2.5">
              {shareable && (
                <Control
                  onClick={() => void share()}
                  height={46}
                  className="flex-1"
                >
                  Share
                </Control>
              )}
              <Control onClick={onRetake} height={46} className="flex-1">
                Retake
              </Control>
            </div>
          </>
        }
      >
        {/*
          On a phone there's no heading in here: the strip is 9:16 and
          every row of type is width it loses — the name plate says
          "Photo developed" instead. A kiosk has width to spare, so
          the strip moves off centre and the type takes the rest.
        */}
        <div className="flex h-full flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-16">
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="View the photo strip larger"
            className="flex min-h-0 flex-1 items-center justify-center px-4 py-2.5 lg:h-full lg:flex-none lg:py-8"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={strip!.url}
              alt="Your Raahe Open Mic photo strip"
              className="animate-print max-h-full max-w-full rounded-sm ring-1 ring-paper/15"
            />
          </button>

          <div className="hidden lg:block lg:max-w-[26rem]">
            <p className="t-label animate-rise flex items-center gap-2.5 text-[11px] text-pink">
              <span aria-hidden="true" className="lamp lamp-on animate-blink" />
              Photo developed
            </p>
            <h1 className="t-display animate-rise delay-1 mt-4 text-[clamp(3rem,5vw,4.5rem)] text-paper">
              your raahe
              <br />
              moment
            </h1>
            <p className="t-body animate-rise delay-2 mt-6 text-[1.15rem] text-paper/55">
              A 9:16 print, sized for a story. Tap it to see it full
              size, or take it with you.
            </p>
            <p className="t-label animate-rise delay-3 mt-8 text-[10px] text-paper/30">
              {EVENT.name} · {EVENT.venue} · {EVENT.date}
            </p>
          </div>
        </div>
      </Cabinet>

      {/* ---------------- Full size ---------------- */}
      {zoomed && (
        <div className="animate-fade fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/97">
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
