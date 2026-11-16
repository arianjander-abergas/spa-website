import { publicClient } from "@/lib/supabase/public";
import type { GuestBooking } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** Free start times (ISO strings) for a treatment on one day. */
export async function fetchSlots(serviceId: string, date: string, staffId: string | null): Promise<string[]> {
  const { data, error } = await publicClient().rpc("get_available_slots", {
    p_service: serviceId,
    p_date: date,
    p_staff: staffId,
  });
  if (error) throw new Error(error.message);
  return (data as { slot: string }[]).map((r) => r.slot);
}

/** Days between two dates that still have at least one free time. */
export async function fetchAvailableDays(
  serviceId: string,
  from: string,
  to: string,
  staffId: string | null,
): Promise<string[]> {
  const { data, error } = await publicClient().rpc("get_available_days", {
    p_service: serviceId,
    p_from: from,
    p_to: to,
    p_staff: staffId,
  });
  if (error) throw new Error(error.message);
  return data as string[];
}

/** A guest's booking, found by the private token from their email. */
export async function fetchBooking(token: string): Promise<GuestBooking | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await publicClient().rpc("get_booking", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as GuestBooking | null) ?? null;
}
