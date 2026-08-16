"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
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
  const [shareable] = useState(() => canShareFiles());

  /* ---------------- Build the strip ---------------- */

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;

    (async () => {
      try {
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
      <Cabinet>
        <div className="flex h-full flex-col items-center justify-center gap-9 px-8">
          <div className="flex gap-2.5">
            {photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={photo}
                alt=""
                className="animate-develop w-20 rounded-sm ring-1 ring-paper/12 lg:w-28"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>

          <div className="w-44">
            <p className="t-label text-center text-[9px] text-paper/50">
              Developing
            </p>
            <span className="relative mt-3 block h-px w-full overflow-hidden bg-paper/12">
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
        bottom={
          <div className="mx-auto flex w-full max-w-[30rem] gap-3 px-6 pb-6">
            <Control lit onClick={onRetake} height={58} className="flex-1">
              Retry
            </Control>
            <Control onClick={onExit} height={58} className="flex-1">
              Home
            </Control>
          </div>
        }
      >
        <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
          <h1 className="t-display text-[2.4rem] text-pink lg:text-[3.4rem]">
            the strip
            <br />
            didn&rsquo;t print
          </h1>
          <p className="t-body max-w-[30ch] text-paper/55">
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
        top={
          <div className="flex items-center justify-center px-6 pt-4 lg:hidden">
            <BrandMark height={24} className="opacity-90" />
          </div>
        }
        bottom={
          <div className="mx-auto w-full max-w-[30rem] px-6 pb-5 lg:max-w-[26rem] lg:pb-8">
            <p
              className="t-label mb-3 flex h-3.5 items-center justify-center text-[9px] text-paper/40"
              aria-live="polite"
            >
              {toast && (
                <span key={toast} className="animate-toast">
                  {toast}
                </span>
              )}
            </p>

            <Control lit onClick={save} height={60}>
              {saved ? "Saved" : "Download"}
            </Control>

            <div className="mt-3 flex gap-3">
              {shareable && (
                <Control
                  onClick={() => void share()}
                  height={50}
                  className="flex-1"
                >
                  Share
                </Control>
              )}
              <Control onClick={onRetake} height={50} className="flex-1">
                Retake
              </Control>
            </div>
          </div>
        }
      >
        {/*
          Phone: the strip fills the stage. Kiosk: it moves off centre
          and the type takes the rest, because a 9:16 print alone in
          the middle of a monitor is a lot of empty screen.
        */}
        <div className="flex h-full items-center justify-center gap-16 px-6 lg:px-20">
          <div className="hidden max-w-[26rem] lg:block">
            <BrandMark height={54} className="opacity-90" />
            <h1 className="t-display mt-8 text-[clamp(3rem,4.5vw,4.5rem)] text-paper">
              your raahe
              <br />
              moment
            </h1>
            <p className="t-body mt-6 text-[1.15rem] text-paper/50">
              A 9:16 print, sized for a story. Tap it to see it full size, or
              take it with you.
            </p>
            <p className="t-label mt-8 text-[10px] text-paper/30">
              {EVENT.venue} · {EVENT.date}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="View the photo strip larger"
            className="flex h-full min-h-0 items-center justify-center py-3 lg:py-10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={strip!.url}
              alt="Your Raahe Open Mic photo strip"
              className="animate-print max-h-full max-w-full rounded-sm ring-1 ring-paper/12"
            />
          </button>
        </div>
      </Cabinet>

      {/* ---------------- Full size ---------------- */}
      {zoomed && (
        <div className="animate-fade fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/95">
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
