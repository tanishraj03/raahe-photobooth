"use client";

/**
 * An endless ticker of tracked capitals — the event, the venue, the
 * date, going round for as long as the booth is open.
 *
 * Two identical runs sit side by side and the track slides exactly
 * half its width, so the loop never shows a seam.
 */
export default function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const run = (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="t-label whitespace-nowrap text-paper/40">
            {item}
          </span>
          <span className="mx-5 block size-[3px] shrink-0 rounded-full bg-pink" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {run}
        {run}
      </div>
    </div>
  );
}
