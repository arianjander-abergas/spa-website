import { fetchBooking } from "@/lib/availability";
import { bookingIcs } from "@/lib/ics";
import { hasSupabase } from "@/lib/supabase/public";

/** Downloads an "Add to calendar" (.ics) file for a booking. */
export async function GET(_request: Request, { params }: RouteContext<"/booking/[token]/calendar">) {
  const { token } = await params;
  const booking = hasSupabase ? await fetchBooking(token) : null;
  if (!booking || booking.status === "cancelled") return new Response("Not found", { status: 404 });

  return new Response(bookingIcs(booking, new Date()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="spa-booking.ics"',
      "Cache-Control": "no-store",
    },
  });
}
