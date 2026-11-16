import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { site } from "@/content/site";
import { getMaxDaysAhead, getServices, getStaff, getStaffServices } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Book a treatment",
  description: "Reserve your treatment online in under a minute. Instant confirmation, no account needed.",
};

export default async function BookPage() {
  const [services, staff, staffServices, maxDaysAhead] = await Promise.all([
    getServices(),
    getStaff(),
    getStaffServices(),
    getMaxDaysAhead(),
  ]);

  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="eyebrow mb-8">Book a treatment</h1>
      {hasSupabase ? (
        <Suspense fallback={<div className="h-96 animate-pulse bg-sand" aria-label="Loading booking" />}>
          <BookingFlow services={services} staff={staff} staffServices={staffServices} maxDaysAhead={maxDaysAhead} />
        </Suspense>
      ) : (
        <div className="max-w-xl border border-line bg-white p-8">
          <h2 className="subheading">Online booking is not connected yet</h2>
          <p className="mt-3 text-stone">
            To reserve a treatment, please call{" "}
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link">
              {site.phone}
            </a>
            .
          </p>
          <p className="mt-6 text-sm text-stone">
            Site owner: add the Supabase values to <code>.env.local</code> — see the README.
          </p>
        </div>
      )}
    </div>
  );
}
