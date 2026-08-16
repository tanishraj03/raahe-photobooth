"use client";

/**
 * The three frames, filling as they're taken. Small and centred
 * under the camera — a status line, not a feature.
 */
export default function StripProgress({
  photos,
  activeIndex,
  total = 3,
}: {
  photos: string[];
  activeIndex: number;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const shot = photos[i];
        const isNext = !shot && i === activeIndex;

        return (
          <span
            key={i}
            className={`block size-8 overflow-hidden rounded-[5px] bg-ink/60 ring-1 transition-all duration-300 lg:size-10 ${
              shot
                ? "ring-paper/50"
                : isNext
                  ? "ring-pink"
                  : "ring-paper/15"
            }`}
          >
            {shot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot}
                alt=""
                className="animate-land size-full object-cover"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
