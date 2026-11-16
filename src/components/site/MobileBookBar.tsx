"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";

/** Fixed "Book" bar at the bottom of the screen on phones. */
export function MobileBookBar() {
  const pathname = usePathname();
  // Hidden where it would get in the way: the booking flow itself, a guest's
  // own booking, and the staff admin.
  if (/^\/(book|booking|admin)(\/|$)/.test(pathname)) return null;

  return (
    <>
      <div aria-hidden className="h-[4.5rem] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur md:hidden">
        <ButtonLink href="/book" className="w-full">
          Book a treatment
        </ButtonLink>
      </div>
    </>
  );
}
