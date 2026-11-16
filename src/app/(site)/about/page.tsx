import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: `The thinking behind ${site.name}: a short menu, generous appointments and experienced therapists.`,
};

const principles = [
  {
    title: "Fewer treatments, done well",
    body: "We would rather offer eight treatments we are proud of than forty we are not. Every one has been refined over hundreds of appointments.",
  },
  {
    title: "Time is part of the treatment",
    body: "Sixty minutes means sixty minutes on the table. Consultation, changing and tea afterwards are never taken out of your time.",
  },
  {
    title: "Honest, simple pricing",
    body: "The price on the menu is the price you pay. No memberships to decline, no products pushed at the door.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="container-page section !pb-12">
        <p className="eyebrow">About</p>
        <h1 className="display mt-5 max-w-4xl">A quieter kind of spa.</h1>
        <p className="lede mt-8">
          {site.name} was opened with a simple idea: that rest should feel effortless. From booking to the walk home,
          we have tried to remove everything that gets in the way of it.
        </p>
      </div>

      <div className="container-page">
        <Image
          src="/images/aromatherapy.jpg"
          alt="Essential oil being dropped into an open palm"
          width={1400}
          height={933}
          sizes="(min-width: 1216px) 1136px, 100vw"
          className="aspect-[16/9] w-full object-cover saturate-[0.85]"
        />
      </div>

      <section className="container-page section">
        <div className="grid gap-12 md:grid-cols-3">
          {principles.map((p, i) => (
            <div key={p.title} className="reveal border-t border-ink pt-6">
              <p className="font-serif text-2xl text-brass" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="subheading mt-3">{p.title}</h2>
              <p className="mt-3 text-sm text-stone">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start gap-6 border-t border-line pt-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="heading max-w-xl">Come and see for yourself.</p>
          <ButtonLink href="/book">Book a treatment</ButtonLink>
        </div>
      </section>
    </>
  );
}
