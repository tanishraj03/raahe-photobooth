"use client";

/**
 * The controls that live over the camera: a shutter, a timer, a
 * flash switch. Sized and placed the way a phone camera does it —
 * the shutter big and central under the thumb, the settings small
 * and either side of it.
 */

const TIMERS = [3, 5, 10] as const;

export function Shutter({
  onClick,
  disabled,
  running,
}: {
  onClick: () => void;
  disabled?: boolean;
  running?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={running ? "Stop the session" : "Start the session"}
      className="group relative grid size-[74px] shrink-0 place-items-center rounded-full ring-2 ring-paper/70 transition-transform duration-150 active:scale-95 disabled:opacity-30 lg:size-[86px]"
    >
      <span
        className={`block transition-all duration-200 ease-[var(--ease-spring)] ${
          running
            ? "size-7 rounded-[6px] bg-paper lg:size-8"
            : "size-[58px] rounded-full bg-pink group-active:size-[52px] lg:size-[68px]"
        }`}
      />
    </button>
  );
}

export function TimerControl({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Timer"
      className={`flex items-center gap-0.5 rounded-full bg-paper/8 p-1 ${
        disabled ? "pointer-events-none opacity-30" : ""
      }`}
    >
      {TIMERS.map((seconds) => {
        const active = seconds === value;
        return (
          <button
            key={seconds}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(seconds)}
            className={`t-label rounded-full px-2.5 py-1.5 text-[10px] transition-colors duration-150 lg:px-3 lg:text-[11px] ${
              active ? "bg-paper text-ink" : "text-paper/55"
            }`}
          >
            {seconds}s
          </button>
        );
      })}
    </div>
  );
}

export function FlashControl({
  on,
  onChange,
  hasLamp,
  disabled,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  /** Whether this camera has a light we're allowed to switch on. */
  hasLamp: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
      aria-label={`Flash ${on ? "on" : "off"}${hasLamp ? "" : " (screen only)"}`}
      title={hasLamp ? "Camera lamp" : "Screen flash — no lamp on this camera"}
      className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 disabled:opacity-30 lg:size-12 ${
        on ? "bg-pink text-ink" : "bg-paper/8 text-paper/55"
      }`}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {!on && (
          <path
            d="M4 3.5 20 20.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
