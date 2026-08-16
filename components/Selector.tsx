"use client";

/**
 * A labelled bank of switches on the control panel — the timer, the
 * flash. One option is always down, and the one that's down is lit.
 */
export default function Selector<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  note,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Small print under the bank — why a switch is doing nothing. */
  note?: string;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-40" : ""}>
      <div className="flex items-center gap-2">
        <span className="t-label text-[8px] text-paper/35">{label}</span>
        {note && (
          <span className="t-label text-[8px] text-paper/25">{note}</span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label={label}
        className="inset mt-1.5 flex gap-1 rounded-lg p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`t-machine flex-1 rounded-md px-2.5 py-1.5 text-[0.7rem] transition-all duration-150 lg:text-[0.8rem] ${
                active
                  ? "bg-pink text-ink shadow-[0_0_14px_rgba(240,78,152,0.45)]"
                  : "text-paper/50 hover:text-paper/80"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
