"use server";

import { z } from "zod";
import { fetchBooking, isUuid } from "@/lib/availability";
import { sendBookingEmails } from "@/lib/email";
import { hasSupabase, publicClient } from "@/lib/supabase/public";
import type { GuestBooking } from "@/lib/types";

export type BookingErrorCode =
  | "SLOT_UNAVAILABLE"
  | "INVALID_DETAILS"
  | "TOO_MANY_BOOKINGS"
  | "TOO_LATE"
  | "NOT_FOUND"
  | "ERROR";

export type FieldErrors = Partial<Record<"name" | "email" | "phone" | "note", string>>;

export type CreateResult =
  | { ok: true; token: string }
  | { ok: false; code: BookingErrorCode; fieldErrors?: FieldErrors };

export type ManageResult = { ok: true; booking: GuestBooking } | { ok: false; code: BookingErrorCode };

const detailsSchema = z.object({
  serviceId: z.uuid(),
  staffId: z.uuid().nullable(),
  start: z.iso.datetime({ offset: true }),
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "That name is too long."),
  email: z.email("Enter an email address like name@example.com.").max(120),
  phone: z
    .string()
    .trim()
    .max(30, "That phone number is too long.")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a phone number we can reach you on."),
  note: z.string().trim().max(500, "Please keep your note under 500 characters.").optional(),
  website: z.string().max(0).optional(), // honeypot: real guests never fill this
});

const KNOWN: BookingErrorCode[] = ["SLOT_UNAVAILABLE", "INVALID_DETAILS", "TOO_MANY_BOOKINGS", "TOO_LATE", "NOT_FOUND"];

function toCode(message: string | undefined): BookingErrorCode {
  return KNOWN.find((c) => message?.includes(c)) ?? "ERROR";
}

export async function createBooking(input: unknown): Promise<CreateResult> {
  if (!hasSupabase) return { ok: false, code: "ERROR" };

  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "phone" || key === "note") fieldErrors[key] ??= issue.message;
    }
    return { ok: false, code: "INVALID_DETAILS", fieldErrors };
  }
  const d = parsed.data;

  const { data, error } = await publicClient().rpc("create_booking", {
    p_service: d.serviceId,
    p_start: d.start,
    p_staff: d.staffId,
    p_name: d.name,
    p_email: d.email,
    p_phone: d.phone,
    p_note: d.note ?? null,
    p_payment_method: "at_spa",
  });
  if (error) {
    const code = toCode(error.message);
    if (code === "ERROR") console.error("[booking] create failed", error);
    return { ok: false, code };
  }

  const token = (data as { manage_token: string }).manage_token;
  const booking = await fetchBooking(token).catch(() => null);
  if (booking) await sendBookingEmails("confirmed", booking);
  return { ok: true, token };
}

export async function cancelBooking(token: string): Promise<ManageResult> {
  if (!hasSupabase || !isUuid(token)) return { ok: false, code: "NOT_FOUND" };
  const { data, error } = await publicClient().rpc("cancel_booking", { p_token: token });
  if (error) return { ok: false, code: toCode(error.message) };
  const booking = data as GuestBooking;
  await sendBookingEmails("cancelled", booking);
  return { ok: true, booking };
}

export async function rescheduleBooking(token: string, start: string): Promise<ManageResult> {
  if (!hasSupabase || !isUuid(token)) return { ok: false, code: "NOT_FOUND" };
  if (!z.iso.datetime({ offset: true }).safeParse(start).success) return { ok: false, code: "SLOT_UNAVAILABLE" };
  const { data, error } = await publicClient().rpc("reschedule_booking", { p_token: token, p_start: start });
  if (error) return { ok: false, code: toCode(error.message) };
  const booking = data as GuestBooking;
  await sendBookingEmails("moved", booking);
  return { ok: true, booking };
}
