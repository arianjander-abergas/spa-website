import Link from "next/link";
import { nav, site } from "@/content/site";
import { Hours } from "./Hours";

export function Footer() {
  return (
    <footer className="border-t border-line bg-sand">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-serif text-3xl">{site.name}</p>
          <p className="mt-3 max-w-xs text-sm text-stone">{site.tagline}</p>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Visit</h2>
          <address className="text-sm not-italic leading-relaxed">
            {site.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link tap mt-2 !flex w-fit">
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="link tap !flex w-fit">
              {site.email}
            </a>
          </address>
        </div>

        <div>
          <h2 className="eyebrow mb-4">Hours</h2>
          <Hours />
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="space-y-0 text-sm md:space-y-2">
            {[...nav, { href: "/book", label: "Book a treatment" }, { href: "/policies", label: "Policies" }].map(
              (item) => (
                <li key={item.href}>
                  <Link href={item.href} className="tap hover:underline underline-offset-4">
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-stone sm:flex-row sm:justify-between">
          <p>
            © {site.name} {site.descriptor}
          </p>
          <Link href="/admin" className="tap w-fit hover:underline underline-offset-4">
            Staff sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
