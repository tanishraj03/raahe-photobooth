"use client";

import type { ReactNode } from "react";

/**
 * A key on the machine. It stands on its own shadow and travels
 * down by exactly that much when you press it, which is the whole
 * trick — see `.control` in globals.css.
 *
 * `lit` marks the one control that's illuminated. There should only
 * ever be one of those on a screen.
 */
export default function Control({
  children,
  note,
  icon,
  lit = false,
  disabled = false,
  onClick,
  height = 60,
  className = "",
  ariaLabel,
}: {
  /** The word stencilled on the key. */
  children: ReactNode;
  /** Small print beside it. */
  note?: string;
  icon?: ReactNode;
  lit?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`control ${lit ? "control-lit" : ""} group relative w-full overflow-hidden px-5 ${className}`}
      style={{ minHeight: height }}
    >
      {lit && !disabled && <span className="sheen" aria-hidden="true" />}

      <span className="relative flex items-center justify-between gap-3">
        <span className="flex items-baseline gap-2.5">
          <span className="t-machine text-[1.3rem]">{children}</span>
          {note && (
            <span
              className={`t-label text-[9px] ${lit ? "text-ink/55" : "text-paper/35"}`}
            >
              {note}
            </span>
          )}
        </span>
        {icon}
      </span>
    </button>
  );
}
