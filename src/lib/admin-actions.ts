"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { fetchBooking } from "@/lib/availability";
import { sendBookingEmails } from "@/lib/email";
import { spaLocalToIso } from "@/lib/format";
import { getAdmin, serverClient } from "@/lib/supabase/server";

/** Every action below starts here: no staff session, no access. */
async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin");
  return admin.supabase;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------- session */

export async function signIn(_prev: string | null, fd: FormData): Promise<string | null> {
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(fd, "email"),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return "That email and password do not match a staff account.";
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return "This account does not have staff access.";
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

/* ------------------------------------------------------------ bookings */

export async function updateBooking(fd: FormData) {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const op = str(fd, "op");

  const changes: Record<string, Record<string, string>> = {
    cancel: { status: "cancelled" },
    complete: { status: "completed" },
    no_show: { status: "no_show" },
    restore: { status: "confirmed" },
    paid: { payment_status: "paid" },
    unpaid: { payment_status: "unpaid" },
  };
  const change = changes[op];
  if (!id || !change) return;

  const { data, error } = await supabase.from("bookings").update(change).eq("id", id).select("manage_token").single();
  if (error) throw new Error(error.message);

  if (op === "cancel") {
    const booking = await fetchBooking(data.manage_token).catch(() => null);
    if (booking) await sendBookingEmails("cancelled", booking);
  }
  refresh();
}

/* ------------------------------------------------------------ time off */

export async function addTimeOff(fd: FormData) {
  const supabase = await requireAdmin();
  const from = str(fd, "from");
  const to = str(fd, "to");
  if (!from || !to || to <= from) return;
  const { error } = await supabase.from("time_off").insert({
    staff_id: str(fd, "staff_id") || null,
    starts_at: spaLocalToIso(from),
    ends_at: spaLocalToIso(to),
    reason: str(fd, "reason") || null,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteTimeOff(fd: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("time_off").delete().eq("id", str(fd, "id"));
  if (error) throw new Error(error.message);
  refresh();
}

/* ------------------------------------------------------- opening hours */

export async function saveHours(fd: FormData) {
  const supabase = await requireAdmin();
  const rows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opens: str(fd, `opens-${weekday}`) || "10:00",
    closes: str(fd, `closes-${weekday}`) || "20:00",
    closed: fd.get(`closed-${weekday}`) === "on",
  }));
  if (rows.some((r) => r.closes <= r.opens)) return;
  const { error } = await supabase.from("opening_hours").upsert(rows);
  if (error) throw new Error(error.message);
  updateTag("catalog");
}

/* ---------------------------------------------------------- treatments */

export async function saveService(fd: FormData) {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const duration = Number(str(fd, "duration_min"));
  const price = Math.round(Number(str(fd, "price")) * 100);
  if (!name || !Number.isFinite(duration) || duration < 5 || !Number.isFinite(price) || price < 0) return;

  const fields = {
    name,
    category: str(fd, "category") || "Treatments",
    summary: str(fd, "summary"),
    description: str(fd, "description"),
    duration_min: duration,
    price_cents: price,
    active: fd.get("active") === "on",
  };

  if (id) {
    const { error } = await supabase.from("services").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("services")
      .insert({ ...fields, active: true, slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`, sort: 1000 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // A new treatment can be given by every therapist until changed.
    const { data: staff } = await supabase.from("staff").select("id");
    if (staff?.length) {
      await supabase.from("staff_services").insert(staff.map((s) => ({ staff_id: s.id, service_id: data.id })));
    }
  }
  updateTag("catalog");
}

/* --------------------------------------------------------------- team */

export async function saveStaff(fd: FormData) {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return;

  if (id) {
    const { error } = await supabase.from("staff").update({ name, active: fd.get("active") === "on" }).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("staff").insert({ name }).select("id").single();
    if (error) throw new Error(error.message);
    const { data: services } = await supabase.from("services").select("id");
    if (services?.length) {
      await supabase.from("staff_services").insert(services.map((s) => ({ staff_id: data.id, service_id: s.id })));
    }
  }
  updateTag("catalog");
}
