import { site } from "@/content/site";
import type { GuestBooking } from "@/lib/types";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** An "Add to calendar" file for a booking. */
export function bookingIcs(b: GuestBooking, now: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Booking//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@${new URL(site.url).hostname}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(new Date(b.starts_at))}`,
    `DTEND:${stamp(new Date(b.ends_at))}`,
    `SUMMARY:${esc(`${b.service_name} at ${site.name}`)}`,
    `LOCATION:${esc(site.addressLines.join(", "))}`,
    `DESCRIPTION:${esc(`Please arrive 10 minutes early.\nManage your booking: ${site.url}/booking/${b.manage_token}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
