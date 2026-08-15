"use client";

import { useEffect, useRef } from "react";
import FilterLayers from "@/components/FilterLayers";
import { FILTERS, SWATCH_GRADIENT } from "@/lib/filters";

/**
 * The filter picker. Sits below the preview so it never covers a
 * face.
 *
 * Each chip shows a still lifted from the live camera a moment ago,
 * so you're choosing between fourteen versions of your own face
 * rather than fourteen abstract swatches. Before the camera is
 * ready it falls back to a light-to-dark ramp with a skin tone in
 * the middle, which reads honestly for tone if not for likeness.
 */
export default function FilterRail({
  activeId,
  onSelect,
  disabled = false,
  preview,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  /** Data URL of a recent camera frame, unfiltered. */
  preview?: string | null;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the chosen filter in view, including when picked by keyboard.
  useEffect(() => {
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    chip?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  return (
    <div
      ref={railRef}
      role="radiogroup"
      aria-label="Photo filter"
      className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pt-2 pb-2 transition-opacity duration-300 ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
    >
      {FILTERS.map((filter, index) => {
        const active = filter.id === activeId;

        return (
          <button
            key={filter.id}
            data-id={filter.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(filter.id)}
            className="animate-rise flex shrink-0 snap-center flex-col items-center gap-2"
            style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
          >
            <span
              className={`relative block isolate overflow-hidden rounded-xl transition-transform duration-200 ease-[var(--ease-spring)] ${
                active ? "scale-[1.08]" : "scale-100"
              }`}
              style={{ width: 56, height: 56 }}
            >
              {/* The picture itself, with the tone half of the filter. */}
              <span
                className="absolute inset-0 block bg-cover bg-center"
                style={{
                  background: preview ? undefined : SWATCH_GRADIENT,
                  backgroundImage: preview ? `url(${preview})` : undefined,
                  backgroundSize: preview ? "cover" : undefined,
                  filter: filter.css || undefined,
                }}
              />

              {/* The colour and texture half. */}
              <FilterLayers filter={filter} />

              {/* Selection ring, drawn inside so nothing shifts. */}
              <span
                className={`pointer-events-none absolute inset-0 rounded-xl transition-all duration-200 ${
                  active
                    ? "ring-2 ring-pink ring-inset"
                    : "ring-1 ring-paper/15 ring-inset"
                }`}
              />
            </span>

            <span
              className={`t-label transition-colors duration-200 ${
                active ? "text-pink" : "text-paper/40"
              }`}
            >
              {filter.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
