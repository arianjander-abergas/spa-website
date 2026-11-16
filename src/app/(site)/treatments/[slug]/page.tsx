import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TreatmentCard } from "@/components/site/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { getService, getServices } from "@/lib/data";
import { formatDuration, formatPrice } from "@/lib/format";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/treatments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.summary,
    openGraph: service.image ? { images: [service.image] } : undefined,
  };
}

export default async function TreatmentPage({ params }: PageProps<"/treatments/[slug]">) {
  const { slug } = await params;
  const [service, all] = await Promise.all([getService(slug), getServices()]);
  if (!service) notFound();

  const others = all.filter((s) => s.id !== service.id && s.category === service.category).slice(0, 3);

  return (
    <>
      <article className="container-page grid gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-20">
        <div className="bg-sand">
          {service.image && (
            <Image
              src={service.image}
              alt=""
              width={1200}
              height={1500}
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/5] w-full object-cover saturate-[0.85]"
            />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <nav aria-label="Breadcrumb" className="eyebrow">
            <Link href="/treatments" className="hover:underline underline-offset-4">
              Treatments
            </Link>
            <span className="mx-2 text-brass" aria-hidden>
              /
            </span>
            {service.category}
          </nav>
          <h1 className="display mt-5 !text-[clamp(2.25rem,4.5vw,3.75rem)]">{service.name}</h1>
          <p className="mt-6 max-w-prose text-stone">{service.description}</p>

          <dl className="mt-10 grid grid-cols-2 border-y border-line py-6">
            <div>
              <dt className="eyebrow">Duration</dt>
              <dd className="mt-2 font-serif text-2xl">{formatDuration(service.duration_min)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Price</dt>
              <dd className="mt-2 font-serif text-2xl">{formatPrice(service.price_cents)}</dd>
            </div>
          </dl>

          <ButtonLink href={`/book?service=${service.slug}`} className="mt-10 w-full sm:w-fit">
            Book this treatment
          </ButtonLink>
          <p className="mt-4 text-sm text-stone">Free to cancel or move up to 24 hours before.</p>
        </div>
      </article>

      {others.length > 0 && (
        <section className="section border-t border-line">
          <div className="container-page">
            <h2 className="heading">More {service.category.toLowerCase()}</h2>
            <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-3">
              {others.map((s) => (
                <TreatmentCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
