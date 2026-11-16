import { site } from "@/content/site";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { GuestBooking } from "@/lib/types";

/** The facts of a booking, as a quiet definition list. */
export function BookingDetails({ booking }: { booking: GuestBooking }) {
  const rows: [string, React.ReactNode][] = [
    [
      "Treatment",
      <>
        {booking.service_name}
        <span className="block text-sm text-stone">{formatDuration(booking.duration_min)}</span>
      </>,
    ],
    [
      "When",
      <>
        {formatDate(booking.starts_at)}
        <span className="block text-sm text-stone">
          {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
        </span>
      </>,
    ],
    ["Therapist", booking.staff_name],
    [
      "Price",
      <>
        {formatPrice(booking.price_cents)}
        <span className="block text-sm text-stone">
          {booking.payment_status === "paid" ? "Paid" : "Pay at the spa after your treatment"}
        </span>
      </>,
    ],
    [
      "Where",
      <>
        {site.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </>,
    ],
  ];

  return (
    <dl className="border-t border-line">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4">
          <dt className="eyebrow pt-1">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
