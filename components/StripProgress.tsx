"use client";

/**
 * Three cells across the top of the camera screen, strung on a rail
 * like frames on a reel. Each one fills with the actual photo the
 * moment it's taken, so you watch your strip building itself while
 * you're still shooting.
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
    <div className="relative flex items-center justify-center" aria-hidden="true">
      {/* The rail the frames sit on. */}
      <span className="absolute h-px w-36 bg-hairline" />

      <div className="relative flex items-center gap-2.5">
        {Array.from({ length: total }, (_, i) => {
          const shot = photos[i];
          const isNext = !shot && i === activeIndex;

          return (
            <span key={i} className="relative block">
              <span
                className={`block h-9 w-16 overflow-hidden rounded-lg border bg-ink transition-colors duration-300 ${
                  shot
                    ? "border-pink"
                    : isNext
                      ? "border-pink/70"
                      : "border-hairline"
                }`}
                style={
                  isNext
                    ? {
                        animation:
                          "cell-pulse 1.6s var(--ease-out-soft) infinite",
                      }
                    : undefined
                }
              >
                {shot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shot}
                    alt=""
                    className="animate-land size-full object-cover"
                  />
                ) : (
                  <span className="t-label grid size-full place-items-center text-[9px] text-paper/30">
                    {`0${i + 1}`}
                  </span>
                )}
              </span>

              {/* A tick under the frame we're shooting now. */}
              {isNext && (
                <span className="animate-fade absolute -bottom-2 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-pink" />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}