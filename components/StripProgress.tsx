"use client";

/**
 * Three cells across the top of the camera screen. Each one fills
 * with the actual photo the moment it's taken, so you watch your
 * strip building itself while you're still shooting.
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
    <div className="flex items-center justify-center gap-2.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const shot = photos[i];
        const isNext = !shot && i === activeIndex;

        return (
          <span
            key={i}
            className={`block size-9 overflow-hidden rounded-md border transition-all duration-300 ${
              shot
                ? "border-pink"
                : isNext
                  ? "border-pink/70"
                  : "border-hairline"
            }`}
            style={
              isNext
                ? { animation: "cell-pulse 1.6s var(--ease-out-soft) infinite" }
                : undefined
            }
          >
            {shot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot}
                alt=""
                className="animate-fade size-full object-cover"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}