import Image from "next/image";
import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

// On phones the card is a compact row (small photo beside the text) so several
// treatments fit on one screen; from tablet width up it is a tall photo card.
export function TreatmentCard({ service, priority = false }: { service: Service; priority?: boolean }) {
  return (
    <article className="group grid grid-cols-[6.5rem_1fr] gap-4 md:flex md:flex-col md:gap-0">
      <Link href={`/treatments/${service.slug}`} className="block self-start overflow-hidden bg-sand" tabIndex={-1} aria-hidden>
        {service.image && (
          <Image
            src={service.image}
            alt=""
            width={800}
            height={1000}
            priority={priority}
            sizes="(min-width: 768px) 33vw, 7rem"
            className="aspect-[4/5] w-full object-cover saturate-[0.85] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col md:pt-5">
        <p className="eyebrow">{service.category}</p>
        <h3 className="subheading mt-1 md:mt-2">
          <Link href={`/treatments/${service.slug}`} className="hover:underline decoration-brass decoration-1 underline-offset-4">
            {service.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-stone md:mt-2 md:line-clamp-none">{service.summary}</p>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-1 text-sm md:mt-5 md:pt-4">
          <span className="tabular-nums">
            {formatDuration(service.duration_min)} <span className="mx-1.5 text-brass">·</span>{" "}
            {formatPrice(service.price_cents)}
          </span>
          <Link href={`/book?service=${service.slug}`} className="link tap font-medium">
            Book<span className="sr-only"> {service.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
