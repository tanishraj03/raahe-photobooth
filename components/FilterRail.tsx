"use client";

import { useEffect, useRef } from "react";
import FilterLayers from "@/components/FilterLayers";
import { FILTERS, SWATCH_GRADIENT } from "@/lib/filters";

/**
 * The filter bank: a recessed strip of numbered keys along the
 * bottom of the screen, the way a machine would lay out its
 * presets. The selected key is illuminated and its lamp is lit.
 *
 * Each key shows a still lifted from the live camera a moment ago,
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
      className={`inset mx-2 mb-1.5 rounded-xl transition-opacity duration-300 ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
    >
      <div
        ref={railRef}
        role="radiogroup"
        aria-label="Photo filter"
        className="no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto p-1"
      >
        {FILTERS.map((filter, index) => {
          const active = filter.id === activeId;
          const number = String(index + 1).padStart(2, "0");

          return (
            <button
              key={filter.id}
              data-id={filter.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(filter.id)}
              className={`relative flex shrink-0 snap-center flex-col items-stretch gap-0.5 rounded-lg px-1.5 pt-1 pb-1 transition-all duration-200 ${
                active
                  ? "bg-pink/12 ring-1 ring-pink/70"
                  : "ring-1 ring-paper/8 hover:ring-paper/20"
              }`}
              style={{ width: 58 }}
            >
              {/* Number and lamp */}
              <span className="flex items-center justify-between px-px">
                <span
                  className={`t-label text-[8px] ${
                    active ? "text-pink" : "text-paper/35"
                  }`}
                >
                  {number}
                </span>
                <span
                  aria-hidden="true"
                  className={`lamp ${active ? "lamp-on" : ""}`}
                  style={{ width: 5, height: 5 }}
                />
              </span>

              {/* What it does to your face */}
              <span
                className="relative block isolate h-9 w-full overflow-hidden rounded-[5px]"
                style={{
                  boxShadow: active
                    ? "inset 0 0 0 1px rgba(240,78,152,0.5)"
                    : "inset 0 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                <span
                  className="absolute inset-0 block bg-cover bg-center"
                  style={{
                    background: preview ? undefined : SWATCH_GRADIENT,
                    backgroundImage: preview ? `url(${preview})` : undefined,
                    backgroundSize: preview ? "cover" : undefined,
                    filter: filter.css || undefined,
                  }}
                />
                <FilterLayers filter={filter} />
              </span>

              <span
                className={`t-label truncate text-[8px] transition-colors duration-200 ${
                  active ? "text-pink" : "text-paper/40"
                }`}
              >
                {filter.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
