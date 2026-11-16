import Link from "next/link";
import { Suspense } from "react";
import { AdminFallback, AdminShell } from "@/components/admin/AdminShell";
import { updateBooking } from "@/lib/admin-actions";
import { addDays, formatDate, formatPrice, formatTime, spaLocalToIso, ymdInTz } from "@/lib/format";
import type { AdminBooking } from "@/lib/types";

export default function AdminBookingsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminShell current="/admin">
        {async (supabase) => {
          const past = (await searchParams).view === "past";
          const today = ymdInTz(new Date());
          const startOfToday = spaLocalToIso(`${today}T00:00`);

          let query = supabase
            .from("bookings")
            .select(
              "id, status, payment_method, payment_status, starts_at, ends_at, price_cents, guest_name, guest_email, guest_phone, note, services(name), staff(name)",
            )
            .limit(300);
          query = past
            ? query
                .lt("starts_at", startOfToday)
                .gte("starts_at", spaLocalToIso(`${addDays(today, -60)}T00:00`))
                .order("starts_at", { ascending: false })
            : query.gte("starts_at", startOfToday).order("starts_at");

          const { data, error } = await query;
          if (error) throw new Error(error.message);
          const bookings = data as unknown as AdminBooking[];

          const byDay = new Map<string, AdminBooking[]>();
          for (const b of bookings) {
            const day = ymdInTz(b.starts_at);
            if (!byDay.has(day)) byDay.set(day, []);
            byDay.get(day)!.push(b);
          }

          return (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="heading">{past ? "Past bookings" : "Upcoming bookings"}</h1>
                <Link href={past ? "/admin" : "/admin?view=past"} className="link text-sm">
                  {past ? "Show upcoming" : "Show past 60 days"}
                </Link>
              </div>

              {bookings.length === 0 && (
                <p className="mt-10 text-stone">{past ? "No bookings in the past 60 days." : "No upcoming bookings yet."}</p>
              )}

              <div className="mt-10 space-y-12">
                {[...byDay.entries()].map(([day, list]) => (
                  <section key={day}>
                    <h2 className="subheading flex items-baseline gap-3">
                      {formatDate(list[0].starts_at)}
                      {day === today && <span className="eyebrow text-brass">Today</span>}
                    </h2>
                    <ul className="mt-4 border-t border-line">
                      {list.map((b) => (
                        <BookingRow key={b.id} booking={b} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          );
        }}
      </AdminShell>
    </Suspense>
  );
}

const statusLabel: Record<AdminBooking["status"], string> = {
  confirmed: "Confirmed",
  pending_payment: "Awaiting payment",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

function BookingRow({ booking: b }: { booking: AdminBooking }) {
  const live = b.status === "confirmed";
  const ops: [string, string][] = [];
  if (live) ops.push(["complete", "Completed"], ["no_show", "No-show"], ["cancel", "Cancel"]);
  if (b.status === "completed" || b.status === "no_show") ops.push(["restore", "Undo"]);
  if (b.status !== "cancelled") ops.push(b.payment_status === "paid" ? ["unpaid", "Mark unpaid"] : ["paid", "Mark paid"]);

  return (
    <li className={`grid gap-x-8 gap-y-3 border-b border-line py-5 md:grid-cols-[7rem_1fr_auto] ${b.status === "cancelled" ? "opacity-55" : ""}`}>
      <p className="font-serif text-xl tabular-nums">
        {formatTime(b.starts_at)}
        <span className="block font-sans text-xs text-stone">to {formatTime(b.ends_at)}</span>
      </p>
      <div className="min-w-0 text-sm">
        <p className="text-base">
          {b.services?.name} <span className="text-stone">with {b.staff?.name}</span>
        </p>
        <p className="mt-1">
          {b.guest_name} ·{" "}
          <a href={`tel:${b.guest_phone}`} className="link">
            {b.guest_phone}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${b.guest_email}`} className="link break-all">
            {b.guest_email}
          </a>
        </p>
        {b.note && <p className="mt-1 text-stone">Note: {b.note}</p>}
        <p className="mt-2 flex flex-wrap gap-x-3 text-xs uppercase tracking-widest text-stone">
          <span className={live ? "text-ink" : ""}>{statusLabel[b.status]}</span>
          <span>
            {formatPrice(b.price_cents)} {b.payment_status}
          </span>
        </p>
      </div>
      <form action={updateBooking} className="flex flex-wrap items-start gap-2 md:max-w-xs md:justify-end">
        <input type="hidden" name="id" value={b.id} />
        {ops.map(([op, label]) => (
          <button
            key={op}
            type="submit"
            name="op"
            value={op}
            className="min-h-10 rounded-sm border border-line bg-white px-3 text-xs hover:border-ink"
          >
            {label}
          </button>
        ))}
      </form>
    </li>
  );
}
