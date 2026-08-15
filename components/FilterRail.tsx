"use client";

import { useEffect, useRef } from "react";
import { FILTERS, SWATCH_GRADIENT } from "@/lib/filters";

/**
 * The filter picker. Sits below the preview so it never covers a face.
 * Each swatch is a light-to-dark ramp with a skin tone in it, so the
 * effect you see on the chip is the effect you get on the photo.
 */
export default function FilterRail({
  activeId,
  onSelect,
  disabled = false,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the chosen filter in view, including when picked by keyboard.
  useEffect(() => {
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    chip?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <div
      ref={railRef}
      role="radiogroup"
      aria-label="Photo filter"
      className={`no-scrollbar flex gap-3 overflow-x-auto px-5 py-1 transition-opacity ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
    >
      {FILTERS.map((filter) => {
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
            className="flex shrink-0 flex-col items-center gap-2 pt-1"
          >
            <span
              className={`relative block overflow-hidden rounded-xl transition-all duration-200 ${
                active
                  ? "ring-2 ring-pink ring-offset-2 ring-offset-ink"
                  : "ring-1 ring-hairline"
              }`}
              style={{ width: 52, height: 52 }}
            >
              <span
                className="absolute inset-0 block"
                style={{
                  background: SWATCH_GRADIENT,
                  filter: filter.css || undefined,
                }}
              />
              {filter.tint && (
                <span
                  className="absolute inset-0 block"
                  style={{
                    backgroundColor: filter.tint.color,
                    opacity: filter.tint.alpha,
                    mixBlendMode: filter.tint.blend,
                  }}
                />
              )}
            </span>

            <span
              className={`t-label transition-colors ${
                active ? "text-pink" : "text-paper/45"
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