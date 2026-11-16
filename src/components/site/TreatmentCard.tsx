import Image from "next/image";
import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

export function TreatmentCard({ service, priority = false }: { service: Service; priority?: boolean }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/treatments/${service.slug}`} className="block overflow-hidden bg-sand" tabIndex={-1} aria-hidden>
        {service.image && (
          <Image
            src={service.image}
            alt=""
            width={800}
            height={1000}
            priority={priority}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="aspect-[4/5] w-full object-cover saturate-[0.85] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow">{service.category}</p>
        <h3 className="subheading mt-2">
          <Link href={`/treatments/${service.slug}`} className="hover:underline decoration-brass decoration-1 underline-offset-4">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm text-stone">{service.summary}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="tabular-nums">
            {formatDuration(service.duration_min)} <span className="mx-1.5 text-brass">·</span>{" "}
            {formatPrice(service.price_cents)}
          </span>
          <Link href={`/book?service=${service.slug}`} className="link font-medium">
            Book<span className="sr-only"> {service.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
