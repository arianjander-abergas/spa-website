"use client";

import { formatYmd, toYmd } from "@/lib/format";

type Props = {
  year: number;
  month: number; // 1-12
  selected: string | null;
  today: string;
  /** Days that can be picked. null = still loading. */
  available: Set<string> | null;
  canGoBack: boolean;
  canGoForward: boolean;
  onMonthChange: (year: number, month: number) => void;
  onSelect: (ymd: string) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({
  year,
  month,
  selected,
  today,
  available,
  canGoBack,
  canGoForward,
  onMonthChange,
  onSelect,
}: Props) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toYmd(year, month, i + 1)),
  ];
  const title = formatYmd(toYmd(year, month, 1), { weekday: undefined, day: undefined, month: "long", year: "numeric" });

  const step = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    onMonthChange(d.getUTCFullYear(), d.getUTCMonth() + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl" aria-live="polite">
          {title}
        </h3>
        <div className="flex gap-1">
          <NavButton label="Previous month" disabled={!canGoBack} onClick={() => step(-1)} flip />
          <NavButton label="Next month" disabled={!canGoForward} onClick={() => step(1)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center" role="group" aria-label={title} aria-busy={available === null}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-stone" aria-hidden>
            {d}
          </div>
        ))}
        {cells.map((ymd, i) => {
          if (!ymd) return <div key={`blank-${i}`} />;
          const enabled = available?.has(ymd) ?? false;
          const isSelected = ymd === selected;
          const isToday = ymd === today;
          return (
            <div key={ymd} className="flex aspect-square items-center justify-center p-0.5">
              <button
                type="button"
                disabled={!enabled}
                aria-pressed={isSelected}
                aria-label={`${formatYmd(ymd)}${enabled ? "" : ", unavailable"}`}
                onClick={() => onSelect(ymd)}
                className={[
                  "relative flex h-full max-h-12 min-h-10 w-full max-w-12 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                  isSelected
                    ? "bg-ink text-paper"
                    : enabled
                      ? "hover:bg-sand"
                      : available === null
                        ? "animate-pulse text-mist"
                        : "text-mist line-through decoration-line",
                ].join(" ")}
              >
                {Number(ymd.slice(8))}
                {isToday && !isSelected && (
                  <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-brass" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  flip,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-sand disabled:opacity-25 disabled:hover:bg-transparent"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        aria-hidden
        className={flip ? "rotate-180" : ""}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
