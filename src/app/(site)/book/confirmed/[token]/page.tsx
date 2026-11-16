import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { buttonClass } from "@/components/ui/Button";
import { site } from "@/content/site";
import { fetchBooking } from "@/lib/availability";
import { hasSupabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

export default function ConfirmedPage({ params }: PageProps<"/book/confirmed/[token]">) {
  return (
    <div className="container-page py-12 md:py-20">
      <Suspense fallback={<div className="h-96 max-w-2xl animate-pulse bg-sand" aria-label="Loading your booking" />}>
        <Confirmed params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmed({ params }: Pick<PageProps<"/book/confirmed/[token]">, "params">) {
  const { token } = await params;
  const booking = hasSupabase ? await fetchBooking(token) : null;
  if (!booking) notFound();

  return (
    <div className="step-enter max-w-2xl">
      <p className="eyebrow flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="text-brass">
          <path d="M4 12.5l5.5 5.5L20 7" />
        </svg>
        Booking confirmed
      </p>
      <h1 className="display mt-5 !text-[clamp(2.25rem,5vw,3.75rem)]">
        Thank you, {booking.guest_name.split(" ")[0]}. You&rsquo;re booked.
      </h1>
      <p className="lede mt-6">
        A confirmation is on its way to <span className="text-ink">{booking.guest_email}</span>. Please arrive ten
        minutes early.
      </p>

      <div className="mt-10">
        <BookingDetails booking={booking} />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href={`/booking/${booking.manage_token}/calendar`} className={buttonClass("primary")}>
          Add to calendar
        </a>
        <Link href={`/booking/${booking.manage_token}`} className={buttonClass("outline")}>
          Move or cancel
        </Link>
      </div>

      <p className="mt-8 text-sm text-stone">
        Free to cancel or move up to {site.cancelWindowHours} hours before. Questions? Call{" "}
        <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link">
          {site.phone}
        </a>
        .
      </p>
    </div>
  );
}
