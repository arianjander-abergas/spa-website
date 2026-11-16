import Image from "next/image";
import Link from "next/link";
import { Hours } from "@/components/site/Hours";
import { TreatmentCard } from "@/components/site/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";
import { getOpeningHours, getServices } from "@/lib/data";

const steps = [
  {
    title: "Reserve in a minute",
    body: "Choose a treatment and a time that suits you. No account, no phone call — your booking is confirmed straight away.",
  },
  {
    title: "Arrive ten minutes early",
    body: "Settle in with tea, tell your therapist what you need today, and leave the rest of the day at the door.",
  },
  {
    title: "Take your time",
    body: "After your treatment the lounge is yours for as long as you like. There is never a rush to leave.",
  },
];

export default async function HomePage() {
  const [services, hours] = await Promise.all([getServices(), getOpeningHours()]);
  const featured = services.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DaySpa",
    name: `${site.name} ${site.descriptor}`,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: `${site.url}/images/hero.jpg`,
    address: { "@type": "PostalAddress", streetAddress: site.addressLines.join(", ") },
    openingHoursSpecification: hours
      .filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.weekday],
        opens: h.opens.slice(0, 5),
        closes: h.closes.slice(0, 5),
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-8.5rem)] items-end md:min-h-[calc(100svh-5rem)]">
        <Image
          src="/images/hero.jpg"
          alt="A stone bathtub in a quiet, softly lit room"
          fill
          priority
          sizes="100vw"
          className="object-cover saturate-[0.8]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="container-page relative pb-10 pt-40 text-paper md:pb-24">
          <p className="eyebrow !text-paper/80">
            {site.name} {site.descriptor}
          </p>
          <h1 className="display mt-5 max-w-3xl">{site.tagline}</h1>
          <p className="mt-6 max-w-md text-paper/85">
            Massage, facials and body rituals in a calm, unhurried space. Reserve online in under a minute.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href="/book" variant="light">
              Book a treatment
            </ButtonLink>
            <Link
              href="/treatments"
              className="tap text-sm underline decoration-paper/50 decoration-1 underline-offset-[6px] hover:decoration-paper"
            >
              View all treatments
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="section">
        <div className="container-page grid gap-10 md:grid-cols-12">
          <p className="eyebrow md:col-span-3 md:pt-3">The spa</p>
          <div className="reveal md:col-span-9">
            <p className="heading max-w-4xl">
              A small, quiet place where treatments are never rushed and every detail has been thought about, so you do
              not have to.
            </p>
            <p className="lede mt-8">
              We keep our menu short and our appointments generous. Each treatment is given by an experienced therapist
              in a private room, with time before and after to simply be still.
            </p>
            <Link href="/about" className="link tap mt-6 text-sm font-medium md:mt-8">
              About {site.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured treatments */}
      <section className="section border-t border-line">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Treatments</p>
              <h2 className="heading mt-4">Most loved</h2>
            </div>
            <Link href="/treatments" className="link tap text-sm font-medium">
              Full treatment menu
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-8 md:mt-12 md:gap-y-14 md:grid-cols-3">
            {featured.map((s) => (
              <div key={s.id} className="reveal">
                <TreatmentCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atmosphere */}
      <section className="bg-sand">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[22rem] md:min-h-[38rem]">
            <Image
              src="/images/lounge.jpg"
              alt="The lounge, with rattan chairs beside a small garden pool"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover saturate-[0.8]"
            />
          </div>
          <div className="flex items-center px-5 py-16 md:px-16 lg:px-24">
            <div className="reveal max-w-md">
              <p className="eyebrow">Your visit</p>
              <h2 className="heading mt-4">What to expect</h2>
              <ol className="mt-10 space-y-8">
                {steps.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-2">
                    <span className="font-serif text-2xl text-brass" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-stone">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className="section">
        <div className="container-page grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Visit</p>
            <h2 className="heading mt-4">Find us</h2>
            <address className="mt-8 not-italic leading-relaxed">
              {site.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <Link href="/contact" className="link tap mt-4 text-sm font-medium md:mt-6">
              Directions and contact
            </Link>
          </div>
          <div className="md:col-span-4">
            <h3 className="eyebrow mb-5 md:mt-1">Opening hours</h3>
            <Hours />
          </div>
          <div className="flex items-start md:col-span-3 md:justify-end md:pt-8">
            <ButtonLink href="/book" className="w-full md:w-auto">
              Book a treatment
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
