"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cancelBooking, rescheduleBooking, type BookingErrorCode } from "@/lib/booking";
import { formatTime, formatYmd, ymdInTz } from "@/lib/format";
import type { GuestBooking } from "@/lib/types";
import { BookingDetails } from "./BookingDetails";
import { DateTimePicker } from "./DateTimePicker";

type Mode = "view" | "move" | "cancel";

const phoneHref = `tel:${site.phone.replace(/\s/g, "")}`;

export function ManageBooking({ initial, maxDaysAhead }: { initial: GuestBooking; maxDaysAhead: number }) {
  const [booking, setBooking] = useState(initial);
  const [mode, setMode] = useState<Mode>("view");
  const [date, setDate] = useState<string | null>(() => ymdInTz(initial.starts_at));
  const [slot, setSlot] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fail = (code: BookingErrorCode) => {
    const text: Partial<Record<BookingErrorCode, string>> = {
      SLOT_UNAVAILABLE: "Sorry — that time has just been taken. Please choose another.",
      TOO_LATE: `This booking can no longer be changed online. Please call us on ${site.phone}.`,
    };
    if (code === "SLOT_UNAVAILABLE") {
      setSlot(null);
      setRefreshKey((k) => k + 1);
    }
    setMessage({ tone: "error", text: text[code] ?? `Something went wrong. Please try again, or call us on ${site.phone}.` });
  };

  const doCancel = () =>
    startTransition(async () => {
      const result = await cancelBooking(booking.manage_token).catch(() => ({ ok: false as const, code: "ERROR" as const }));
      if (!result.ok) return fail(result.code);
      setBooking(result.booking);
      setMode("view");
      setMessage(null);
    });

  const doMove = () => {
    if (!slot) return;
    startTransition(async () => {
      const result = await rescheduleBooking(booking.manage_token, slot).catch(() => ({
        ok: false as const,
        code: "ERROR" as const,
      }));
      if (!result.ok) return fail(result.code);
      setBooking(result.booking);
      setMode("view");
      setSlot(null);
      setMessage({ tone: "ok", text: "Your booking has been moved. A new confirmation is on its way." });
    });
  };

  const cancelled = booking.status === "cancelled";
  const heading = cancelled
    ? "This booking is cancelled."
    : booking.status === "confirmed"
      ? "Your booking"
      : booking.status === "completed"
        ? "Thank you for visiting."
        : "Your booking";

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{cancelled ? "Cancelled" : `Booked for ${booking.guest_name}`}</p>
      <h1 className="display mt-5 !text-[clamp(2.25rem,5vw,3.75rem)]">{heading}</h1>

      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mt-8 border-l-2 bg-white px-4 py-3 text-sm ${message.tone === "error" ? "border-error" : "border-brass"}`}
        >
          {message.text}
        </p>
      )}

      {mode !== "move" && (
        <div className={`mt-10 max-w-2xl ${cancelled ? "opacity-60" : ""}`}>
          <BookingDetails booking={booking} />
        </div>
      )}

      {/* View */}
      {mode === "view" && (
        <div className="mt-8 max-w-2xl">
          {cancelled ? (
            <Link href={`/book?service=${booking.service_slug}`} className={buttonClass("primary")}>
              Book again
            </Link>
          ) : booking.can_change ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => {
                    setMessage(null);
                    setMode("move");
                  }}
                >
                  Move booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMessage(null);
                    setMode("cancel");
                  }}
                >
                  Cancel booking
                </Button>
              </div>
              <p className="mt-6 text-sm text-stone">
                <a href={`/booking/${booking.manage_token}/calendar`} className="link">
                  Add to calendar
                </a>
              </p>
            </>
          ) : booking.status === "confirmed" ? (
            <p className="text-sm text-stone">
              It is now less than {site.cancelWindowHours} hours before your appointment, so it can no longer be
              changed online. Please call{" "}
              <a href={phoneHref} className="link">
                {site.phone}
              </a>{" "}
              and we will do our best to help.
            </p>
          ) : null}
        </div>
      )}

      {/* Cancel confirmation */}
      {mode === "cancel" && (
        <div className="step-enter mt-8 max-w-2xl border border-line bg-white p-6" role="group" aria-labelledby="cancel-title">
          <h2 id="cancel-title" className="subheading">
            Cancel this booking?
          </h2>
          <p className="mt-2 text-sm text-stone">Your time will be released for other guests. This cannot be undone.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={doCancel} disabled={pending}>
              {pending ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={pending}>
              Keep booking
            </Button>
          </div>
        </div>
      )}

      {/* Move */}
      {mode === "move" && (
        <div className="step-enter mt-10">
          <h2 className="heading">Choose a new time</h2>
          <p className="mt-3 text-sm text-stone">
            {booking.service_name} · currently {formatYmd(ymdInTz(booking.starts_at), { weekday: "short", month: "short" })},{" "}
            {formatTime(booking.starts_at)}
          </p>
          <div className="mt-8">
            <DateTimePicker
              serviceId={booking.service_id}
              staffId={null}
              date={date}
              slot={slot}
              maxDaysAhead={maxDaysAhead}
              refreshKey={refreshKey}
              onDate={setDate}
              onSlot={setSlot}
            />
          </div>
          <div className="mt-10 flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="link min-h-11 self-start text-sm disabled:opacity-40"
              disabled={pending}
              onClick={() => {
                setMode("view");
                setSlot(null);
                setMessage(null);
              }}
            >
              Keep current time
            </button>
            <Button onClick={doMove} disabled={!slot || pending} className="w-full sm:w-auto">
              {pending ? "Moving…" : slot ? `Move to ${formatTime(slot)}` : "Select a time"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
