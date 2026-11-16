import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { fetchBooking } from "@/lib/availability";
import { getMaxDaysAhead } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

export default function ManagePage({ params }: PageProps<"/booking/[token]">) {
  return (
    <div className="container-page py-12 md:py-20">
      <Suspense fallback={<div className="h-96 max-w-2xl animate-pulse bg-sand" aria-label="Loading your booking" />}>
        <Manage params={params} />
      </Suspense>
    </div>
  );
}

async function Manage({ params }: Pick<PageProps<"/booking/[token]">, "params">) {
  const { token } = await params;
  const [booking, maxDaysAhead] = await Promise.all([hasSupabase ? fetchBooking(token) : null, getMaxDaysAhead()]);
  if (!booking) notFound();
  return <ManageBooking initial={booking} maxDaysAhead={maxDaysAhead} />;
}
