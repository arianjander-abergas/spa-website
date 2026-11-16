import type { Metadata } from "next";
import Link from "next/link";
import { getServices, groupByCategory } from "@/lib/data";
import { formatDuration, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Treatments",
  description: "Our full menu of massage, facials and body rituals, with durations and prices. Book any treatment online.",
};

export default async function TreatmentsPage() {
  const groups = groupByCategory(await getServices());

  return (
    <div className="container-page section">
      <header className="max-w-3xl">
        <p className="eyebrow">Treatment menu</p>
        <h1 className="display mt-5">Treatments</h1>
        <p className="lede mt-6">
          A short menu, done well. Every price is the full price — there are no add-on fees, and gratuity is at your
          discretion.
        </p>
      </header>

      {groups.length > 1 && (
        <nav aria-label="Categories" className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-y border-line py-4 text-sm">
          {groups.map(([category]) => (
            <a key={category} href={`#${slugify(category)}`} className="tap hover:underline underline-offset-4">
              {category}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-16 space-y-20">
        {groups.map(([category, services]) => (
          <section key={category} id={slugify(category)} className="grid scroll-mt-28 gap-8 md:grid-cols-12">
            <h2 className="heading md:col-span-4">{category}</h2>
            <ul className="border-t border-line md:col-span-8">
              {services.map((s) => (
                <li key={s.id} className="grid gap-x-8 gap-y-3 border-b border-line py-7 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h3 className="subheading">
                      <Link
                        href={`/treatments/${s.slug}`}
                        className="hover:underline decoration-brass decoration-1 underline-offset-4"
                      >
                        {s.name}
                      </Link>
                    </h3>
                    <p className="mt-2 max-w-prose text-sm text-stone">{s.summary}</p>
                  </div>
                  <div className="flex items-center justify-between gap-8 sm:flex-col sm:items-end sm:justify-start sm:gap-3">
                    <p className="whitespace-nowrap text-sm tabular-nums">
                      {formatDuration(s.duration_min)} <span className="mx-1.5 text-brass">·</span>{" "}
                      {formatPrice(s.price_cents)}
                    </p>
                    <Link href={`/book?service=${s.slug}`} className="link tap text-sm font-medium">
                      Book<span className="sr-only"> {s.name}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
