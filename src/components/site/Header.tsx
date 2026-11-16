import Link from "next/link";
import { nav, site } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-baseline gap-2" aria-label={`${site.name} home`}>
          <span className="font-serif text-2xl tracking-wide md:text-[1.75rem]">{site.name}</span>
          <span className="eyebrow hidden sm:inline">{site.descriptor}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-10 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink underline-offset-8 decoration-brass decoration-1 hover:underline"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/book" className="min-h-11 px-6">
            Book
          </ButtonLink>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
