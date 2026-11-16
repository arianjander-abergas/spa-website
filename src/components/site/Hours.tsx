import { getOpeningHours } from "@/lib/data";
import { formatClock, weekdayName } from "@/lib/format";

/** Opening hours, Monday first. */
export async function Hours({ className = "" }: { className?: string }) {
  const hours = await getOpeningHours();
  const ordered = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => hours.find((h) => h.weekday === d))
    .filter((h) => h !== undefined);

  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-sm ${className}`}>
      {ordered.map((h) => (
        <div key={h.weekday} className="contents">
          <dt className="text-stone">{weekdayName(h.weekday)}</dt>
          <dd className="tabular-nums">
            {h.closed ? "Closed" : `${formatClock(h.opens)} – ${formatClock(h.closes)}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}
