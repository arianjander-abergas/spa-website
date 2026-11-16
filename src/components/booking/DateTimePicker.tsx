"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/Calendar";
import { fetchAvailableDays, fetchSlots } from "@/lib/availability";
import { addDays, formatTime, formatYmd, hourInTz, parseYmd, toYmd, ymdInTz } from "@/lib/format";

type Props = {
  serviceId: string;
  staffId: string | null;
  date: string | null;
  slot: string | null;
  maxDaysAhead: number;
  /** Change this to force a fresh look at availability. */
  refreshKey?: number;
  onDate: (ymd: string) => void;
  onSlot: (iso: string | null) => void;
};

const PERIODS = [
  { label: "Morning", test: (h: number) => h < 12 },
  { label: "Afternoon", test: (h: number) => h >= 12 && h < 17 },
  { label: "Evening", test: (h: number) => h >= 17 },
];

export function DateTimePicker({ serviceId, staffId, date, slot, maxDaysAhead, refreshKey = 0, onDate, onSlot }: Props) {
  const [today] = useState(() => ymdInTz(new Date()));
  const lastDay = addDays(today, maxDaysAhead);
  const [view, setView] = useState(() => {
    const { y, m } = parseYmd(date ?? today);
    return { y, m };
  });

  const [days, setDays] = useState<{ key: string; set: Set<string> } | null>(null);
  const [slots, setSlots] = useState<{ key: string; list: string[] } | null>(null);
  const [failed, setFailed] = useState(false);

  const daysKey = `${serviceId}|${staffId}|${view.y}-${view.m}|${refreshKey}`;
  const slotsKey = `${serviceId}|${staffId}|${date}|${refreshKey}`;

  // Which days in the visible month still have a free time.
  useEffect(() => {
    let cancelled = false;
    const first = toYmd(view.y, view.m, 1);
    const last = toYmd(view.y, view.m + 1, 0);
    const from = first < today ? today : first;
    const to = last > lastDay ? lastDay : last;
    const load = from > to ? Promise.resolve<string[]>([]) : fetchAvailableDays(serviceId, from, to, staffId);
    load
      .then((list) => {
        if (cancelled) return;
        setFailed(false);
        setDays({ key: daysKey, set: new Set(list) });
        // Save a tap: open on the first day that has availability.
        if (!date && list.length > 0) onDate(list[0]);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- daysKey covers every input
  }, [daysKey]);

  // Free times on the chosen day.
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    fetchSlots(serviceId, date, staffId)
      .then((list) => {
        if (cancelled) return;
        setFailed(false);
        setSlots({ key: slotsKey, list });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slotsKey covers every input
  }, [slotsKey]);

  const available = days?.key === daysKey ? days.set : null;
  const daySlots = date && slots?.key === slotsKey ? slots.list : null;

  const todayParts = parseYmd(today);
  const lastParts = parseYmd(lastDay);
  const canGoBack = view.y > todayParts.y || (view.y === todayParts.y && view.m > todayParts.m);
  const canGoForward = view.y < lastParts.y || (view.y === lastParts.y && view.m < lastParts.m);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <Calendar
        year={view.y}
        month={view.m}
        selected={date}
        today={today}
        available={available}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onMonthChange={(y, m) => setView({ y, m })}
        onSelect={(ymd) => {
          if (ymd !== date) onSlot(null);
          onDate(ymd);
        }}
      />

      <div aria-live="polite">
        {failed ? (
          <p role="alert" className="text-sm text-error">
            We could not load availability. Check your connection and try again.
          </p>
        ) : !date ? (
          <p className="text-sm text-stone">
            {available && available.size === 0
              ? "No times left this month. Try the next month."
              : "Choose a day to see available times."}
          </p>
        ) : (
          <>
            <h3 className="font-serif text-2xl">{formatYmd(date)}</h3>
            {daySlots === null ? (
              <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Loading times">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-sm bg-sand" />
                ))}
              </div>
            ) : daySlots.length === 0 ? (
              <p className="mt-4 text-sm text-stone">No times left on this day. Please choose another.</p>
            ) : (
              <div className="mt-5 space-y-6">
                {PERIODS.map((period) => {
                  const list = daySlots.filter((s) => period.test(hourInTz(s)));
                  if (list.length === 0) return null;
                  return (
                    <fieldset key={period.label}>
                      <legend className="eyebrow mb-3">{period.label}</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {list.map((s) => {
                          const active = s === slot;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={active}
                              onClick={() => onSlot(s)}
                              className={`min-h-12 rounded-sm border text-sm tabular-nums transition-colors ${
                                active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"
                              }`}
                            >
                              {formatTime(s)}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
