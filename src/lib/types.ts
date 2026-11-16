export type Service = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  duration_min: number;
  price_cents: number;
  image: string | null;
  sort: number;
  active: boolean;
};

export type StaffMember = {
  id: string;
  name: string;
  active: boolean;
};

export type OpeningHours = {
  weekday: number; // 0 = Sunday … 6 = Saturday
  opens: string; // "10:00:00"
  closes: string;
  closed: boolean;
};

export type BookingStatus =
  | "confirmed"
  | "pending_payment"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

/** What a guest sees about their own booking (returned by get_booking). */
export type GuestBooking = {
  id: string;
  manage_token: string;
  status: BookingStatus;
  payment_method: "at_spa" | "online";
  payment_status: PaymentStatus;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  note: string | null;
  service_id: string;
  service_name: string;
  service_slug: string;
  duration_min: number;
  staff_id: string;
  staff_name: string;
  can_change: boolean;
};

/** Full row as staff see it in the admin. */
export type AdminBooking = {
  id: string;
  status: BookingStatus;
  payment_method: "at_spa" | "online";
  payment_status: PaymentStatus;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  note: string | null;
  services: { name: string } | null;
  staff: { name: string } | null;
};

export type TimeOff = {
  id: string;
  staff_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  staff: { name: string } | null;
};
