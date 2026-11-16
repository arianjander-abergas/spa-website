import { site } from "@/content/site";

const tz = site.timezone;
const locale = site.locale;

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: site.currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "9:30 AM" in the spa's time zone. */
export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

/** "Saturday, 21 November 2026" in the spa's time zone. */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(new Date(iso));
}

export function formatDateShort(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: tz,
  }).format(new Date(iso));
}

/** Hour of day (0-23) in the spa's time zone. */
export function hourInTz(iso: string | Date): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(new Date(iso));
  return Number(h) % 24;
}

/** Calendar date ("2026-11-21") of an instant, in the spa's time zone. */
export function ymdInTz(d: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(new Date(d));
}

/**
 * Turns a wall-clock time at the spa ("2026-11-21T14:30") into the exact
 * instant it refers to, as an ISO string.
 */
export function spaLocalToIso(local: string): string {
  const [datePart, timePart = "00:00"] = local.split("T");
  const { y, m, d } = parseYmd(datePart);
  const [hh, mm] = timePart.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  // How far the spa's clock is from UTC at that moment.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(asUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(asUtc - (shown - asUtc)).toISOString();
}

/* ---- Plain calendar-date helpers. These work on "YYYY-MM-DD" strings and
        never touch time zones, so a date is the same date everywhere. ---- */

export function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

export function toYmd(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  const { y, m, d } = parseYmd(ymd);
  return toYmd(y, m, d + days);
}

export function weekdayOf(ymd: string): number {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "Saturday, 21 November" for a plain calendar date. */
export function formatYmd(ymd: string, opts?: Intl.DateTimeFormatOptions): string {
  const { y, m, d } = parseYmd(ymd);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...opts,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdayName = (i: number) => WEEKDAYS[i];

/** "10:00:00" -> "10 AM", "17:30:00" -> "5:30 PM" */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}
