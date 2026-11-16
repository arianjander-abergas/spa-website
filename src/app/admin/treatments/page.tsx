import { Suspense } from "react";
import { AdminFallback, AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { saveService, saveStaff } from "@/lib/admin-actions";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service, StaffMember } from "@/lib/types";

export default function AdminTreatmentsPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminShell current="/admin/treatments">
        {async (supabase) => {
          const [servicesRes, staffRes] = await Promise.all([
            supabase.from("services").select("*").order("sort"),
            supabase.from("staff").select("id, name, active").order("name"),
          ]);
          const services = (servicesRes.data ?? []) as Service[];
          const staff = (staffRes.data ?? []) as StaffMember[];

          return (
            <div className="grid gap-16 lg:grid-cols-[1fr_20rem]">
              <section>
                <h1 className="heading">Treatments</h1>
                <p className="mt-3 text-sm text-stone">
                  Changes appear on the website straight away. Untick &ldquo;Shown&rdquo; to hide a treatment without
                  deleting it.
                </p>
                <div className="mt-8 border-t border-line">
                  {services.map((s) => (
                    <details key={s.id} className="group border-b border-line">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3">
                        <span className={s.active ? "" : "text-mist line-through"}>{s.name}</span>
                        <span className="text-sm tabular-nums text-stone">
                          {formatDuration(s.duration_min)} · {formatPrice(s.price_cents)}
                          <span className="ml-3 link group-open:hidden">Edit</span>
                        </span>
                      </summary>
                      <ServiceForm service={s} />
                    </details>
                  ))}
                </div>

                <h2 className="subheading mt-14">Add a treatment</h2>
                <ServiceForm />
              </section>

              <section>
                <h2 className="heading">Team</h2>
                <p className="mt-3 text-sm text-stone">Guests see these names when choosing a therapist.</p>
                <div className="mt-8 border-t border-line">
                  {staff.map((t) => (
                    <form key={t.id} action={saveStaff} className="flex items-center gap-3 border-b border-line py-3">
                      <input type="hidden" name="id" value={t.id} />
                      <input name="name" defaultValue={t.name} aria-label="Name" required className="field" />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="active" defaultChecked={t.active} className="h-4 w-4 accent-ink" />
                        Active
                      </label>
                      <button type="submit" className="link min-h-11 text-sm">
                        Save
                      </button>
                    </form>
                  ))}
                </div>
                <form action={saveStaff} className="mt-6 flex items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor="new-staff" className="field-label">
                      Add a therapist
                    </label>
                    <input id="new-staff" name="name" required className="field" />
                  </div>
                  <Button type="submit" variant="outline" className="px-5">
                    Add
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

function ServiceForm({ service }: { service?: Service }) {
  const id = service?.id ?? "new";
  return (
    <form action={saveService} className="grid gap-4 pb-6 pt-2 sm:grid-cols-4">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="sm:col-span-2">
        <label htmlFor={`name-${id}`} className="field-label">
          Name
        </label>
        <input id={`name-${id}`} name="name" defaultValue={service?.name} required className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`category-${id}`} className="field-label">
          Category
        </label>
        <input id={`category-${id}`} name="category" defaultValue={service?.category} required className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`duration-${id}`} className="field-label">
          Duration (minutes)
        </label>
        <input
          id={`duration-${id}`}
          name="duration_min"
          type="number"
          min={5}
          step={5}
          defaultValue={service?.duration_min ?? 60}
          required
          className="field"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`price-${id}`} className="field-label">
          Price ({site.currency})
        </label>
        <input
          id={`price-${id}`}
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={service ? service.price_cents / 100 : undefined}
          required
          className="field"
        />
      </div>
      <div className="sm:col-span-4">
        <label htmlFor={`summary-${id}`} className="field-label">
          One-line summary
        </label>
        <input id={`summary-${id}`} name="summary" defaultValue={service?.summary} maxLength={160} className="field" />
      </div>
      <div className="sm:col-span-4">
        <label htmlFor={`description-${id}`} className="field-label">
          Full description
        </label>
        <textarea id={`description-${id}`} name="description" rows={3} defaultValue={service?.description} className="field" />
      </div>
      <div className="flex items-center justify-between sm:col-span-4">
        {service ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={service.active} className="h-4 w-4 accent-ink" />
            Shown on website
          </label>
        ) : (
          <span />
        )}
        <Button type="submit" variant={service ? "primary" : "outline"}>
          {service ? "Save" : "Add treatment"}
        </Button>
      </div>
    </form>
  );
}
