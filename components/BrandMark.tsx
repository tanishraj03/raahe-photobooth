"use client";

import { useState } from "react";
import { LOGO_SOURCES, LOGO_FALLBACK_TEXT } from "@/lib/config/event";

/**
 * Renders the real Raahe logo from /public.
 *
 * Until a logo file is added, it falls back to the brand name set in
 * League Spartan so nothing looks broken. It never draws a made-up
 * version of the mark.
 */
export default function BrandMark({
  height = 34,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`t-display text-paper ${className}`}
        style={{ fontSize: height * 0.86, lineHeight: 1 }}
      >
        {LOGO_FALLBACK_TEXT}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SOURCES[index]}
      alt="Raahe"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      onError={() => {
        if (index < LOGO_SOURCES.length - 1) setIndex(index + 1);
        else setFailed(true);
      }}
    />
  );
}