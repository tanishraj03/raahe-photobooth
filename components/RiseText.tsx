"use client";

/**
 * Display type that climbs out of its own line, one letter at a
 * time. The letters are decoration — the readable copy is the
 * screen-reader line above them.
 */
export default function RiseText({
  text,
  delay = 0,
  step = 0.035,
  className = "",
}: {
  text: string;
  /** Seconds before the first letter moves. */
  delay?: number;
  /** Seconds between letters. */
  step?: number;
  className?: string;
}) {
  return (
    <span className={`line-mask ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => (
          <span
            key={index}
            className="char"
            style={{ animationDelay: `${delay + index * step}s` }}
          >
            {character}
          </span>
        ))}
      </span>
    </span>
  );
}
