"use client";

import { useEffect, useRef } from "react";
import { FILTERS } from "@/lib/filters";

/**
 * The filter strip: names in a row, the chosen one marked. It sits
 * low over the camera and takes as little of it as possible — the
 * live picture already shows what each filter does, so a row of
 * swatches would only be saying it twice.
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
      className={`no-scrollbar flex snap-x snap-mandatory items-center gap-1 overflow-x-auto px-[42%] transition-opacity duration-300 ${
        disabled ? "pointer-events-none opacity-30" : ""
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
            className={`t-label shrink-0 snap-center rounded-full px-3.5 py-2 text-[10px] whitespace-nowrap transition-colors duration-200 lg:text-[11px] ${
              active
                ? "bg-pink/15 text-pink"
                : "text-paper/45 hover:text-paper/80"
            }`}
          >
            {filter.name}
          </button>
        );
      })}
    </div>
  );
}
