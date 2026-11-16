import { Suspense } from "react";
import { AdminFallback, AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { addTimeOff, deleteTimeOff, saveHours } from "@/lib/admin-actions";
import { formatDateShort, formatTime, weekdayName } from "@/lib/format";
import type { OpeningHours, StaffMember, TimeOff } from "@/lib/types";

export default function AdminHoursPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminShell current="/admin/hours">
        {async (supabase) => {
          const [hoursRes, offRes, staffRes] = await Promise.all([
            supabase.from("opening_hours").select("*").order("weekday"),
            supabase
              .from("time_off")
              .select("id, staff_id, starts_at, ends_at, reason, staff(name)")
              .gte("ends_at", new Date().toISOString())
              .order("starts_at"),
            supabase.from("staff").select("id, name, active").eq("active", true).order("name"),
          ]);
          const hours = (hoursRes.data ?? []) as OpeningHours[];
          const timeOff = (offRes.data ?? []) as unknown as TimeOff[];
          const staff = (staffRes.data ?? []) as StaffMember[];
          const ordered = [1, 2, 3, 4, 5, 6, 0].map(
            (d) => hours.find((h) => h.weekday === d) ?? { weekday: d, opens: "10:00:00", closes: "20:00:00", closed: true },
          );

          return (
            <div className="grid gap-16 lg:grid-cols-2">
              <section>
                <h1 className="heading">Opening hours</h1>
                <p className="mt-3 text-sm text-stone">Treatments can only be booked if they finish by closing time.</p>
                <form action={saveHours} className="mt-8">
                  <div className="border-t border-line">
                    {ordered.map((h) => (
                      <fieldset key={h.weekday} className="grid grid-cols-[6rem_1fr_1fr_auto] items-center gap-3 border-b border-line py-3">
                        <legend className="sr-only">{weekdayName(h.weekday)}</legend>
                        <span aria-hidden className="text-sm">
                          {weekdayName(h.weekday)}
                        </span>
                        <input
                          type="time"
                          name={`opens-${h.weekday}`}
                          defaultValue={h.opens.slice(0, 5)}
                          aria-label="Opens"
                          className="field"
                        />
                        <input
                          type="time"
                          name={`closes-${h.weekday}`}
                          defaultValue={h.closes.slice(0, 5)}
                          aria-label="Closes"
                          className="field"
                        />
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input type="checkbox" name={`closed-${h.weekday}`} defaultChecked={h.closed} className="h-4 w-4 accent-ink" />
                          Closed
                        </label>
                      </fieldset>
                    ))}
                  </div>
                  <Button type="submit" className="mt-6">
                    Save hours
                  </Button>
                </form>
              </section>

              <section>
                <h2 className="heading">Time off</h2>
                <p className="mt-3 text-sm text-stone">
                  Block out holidays, closures or a therapist&rsquo;s leave. Existing bookings in that time are not
                  cancelled automatically.
                </p>

                <ul className="mt-8 border-t border-line">
                  {timeOff.length === 0 && <li className="border-b border-line py-4 text-sm text-stone">Nothing blocked.</li>}
                  {timeOff.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-4 border-b border-line py-4 text-sm">
                      <div>
                        <p>{t.staff?.name ?? "Whole spa closed"}</p>
                        <p className="text-stone">
                          {formatDateShort(t.starts_at)} {formatTime(t.starts_at)} → {formatDateShort(t.ends_at)}{" "}
                          {formatTime(t.ends_at)}
                          {t.reason ? ` · ${t.reason}` : ""}
                        </p>
                      </div>
                      <form action={deleteTimeOff}>
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className="link min-h-11 text-sm">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>

                <form action={addTimeOff} className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="staff_id" className="field-label">
                      Who
                    </label>
                    <select id="staff_id" name="staff_id" className="field">
                      <option value="">Whole spa closed</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="from" className="field-label">
                      From
                    </label>
                    <input id="from" name="from" type="datetime-local" required className="field" />
                  </div>
                  <div>
                    <label htmlFor="to" className="field-label">
                      Until
                    </label>
                    <input id="to" name="to" type="datetime-local" required className="field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="reason" className="field-label">
                      Reason <span className="font-normal text-stone">(optional)</span>
                    </label>
                    <input id="reason" name="reason" maxLength={120} className="field" />
                  </div>
                  <Button type="submit" variant="outline" className="sm:col-span-2 sm:w-fit">
                    Block this time
                  </Button>
                </form>
              </section>
            </div>
          );
        }}
      </AdminShell>
    </Suspense>
  );
}
