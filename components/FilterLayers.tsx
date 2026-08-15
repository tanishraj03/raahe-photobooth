"use client";

import { useSyncExternalStore } from "react";
import type { Filter } from "@/lib/filters";
import { GRAIN_REPEATS, grainTile } from "@/lib/grain";
import { washStyle } from "@/lib/washes";

/**
 * The colour and texture half of a filter, stacked over whatever
 * sits behind it — the live video, or a chip in the picker.
 *
 * lib/capture.ts paints the same layers, from the same description,
 * in the same order onto the canvas. That's the whole point: one
 * definition, two renderers, so the preview can't lie about what
 * you'll get.
 *
 * The parent must be `relative isolate` — these layers blend, and
 * isolation keeps that blending inside the frame.
 */

const noSubscribe = () => () => {};

/** False during server rendering, true once we're in the browser. */
function useIsClient() {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

export default function FilterLayers({ filter }: { filter: Filter }) {
  const isClient = useIsClient();
  // The grain tile is drawn in a canvas, so it only exists client-side.
  const tile = isClient ? grainTile() : null;

  return (
    <>
      {filter.washes?.map((wash, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={washStyle(wash)}
        />
      ))}

      {filter.grain && tile ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${tile.url})`,
            backgroundSize: `${100 / GRAIN_REPEATS}%`,
            opacity: filter.grain,
            mixBlendMode: "overlay",
          }}
        />
      ) : null}
    </>
  );
}
