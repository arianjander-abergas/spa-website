import type { Metadata } from "next";
import { Hours } from "@/components/site/Hours";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Visit",
  description: `Address, opening hours and contact details for ${site.name} ${site.descriptor}.`,
};

export default function ContactPage() {
  const mapQuery = site.mapQuery as string;
  const directions = mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <div className="container-page section">
      <p className="eyebrow">Visit</p>
      <h1 className="display mt-5">Find us</h1>

      <div className="mt-14 grid gap-14 md:grid-cols-12">
        <div className="space-y-12 md:col-span-5">
          <section>
            <h2 className="eyebrow mb-4">Address</h2>
            <address className="not-italic leading-relaxed">
              {site.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {directions && (
              <a href={directions} target="_blank" rel="noreferrer" className="link mt-4 inline-block text-sm font-medium">
                Get directions
              </a>
            )}
          </section>

          <section>
            <h2 className="eyebrow mb-4">Contact</h2>
            <p>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link">
                {site.phone}
              </a>
            </p>
            <p className="mt-1.5">
              <a href={`mailto:${site.email}`} className="link">
                {site.email}
              </a>
            </p>
            <p className="mt-4 max-w-sm text-sm text-stone">
              The quickest way to reserve is online. For groups, gift bookings or anything else, call or email and we
              will be glad to help.
            </p>
          </section>

          <section>
            <h2 className="eyebrow mb-4">Opening hours</h2>
            <Hours />
          </section>

          <ButtonLink href="/book" className="w-full sm:w-auto">
            Book a treatment
          </ButtonLink>
        </div>

        <div className="md:col-span-7">
          {mapQuery ? (
            <iframe
              title={`Map showing ${site.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[24rem] w-full border border-line grayscale md:h-full md:min-h-[32rem]"
            />
          ) : (
            <div className="flex h-[24rem] items-center justify-center border border-line bg-sand p-8 text-center text-sm text-stone md:h-full md:min-h-[32rem]">
              The map appears here once the spa&rsquo;s address is added.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
