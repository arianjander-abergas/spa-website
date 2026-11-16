"use client";

import { usePathname } from "next/navigation";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { site } from "@/content/site";

/** Fixed bar at the bottom of the screen on phones: call the spa, or book. */
export function MobileBookBar() {
  const pathname = usePathname();
  // Hidden where it would get in the way: the booking flow itself, a guest's
  // own booking, and the staff admin.
  if (/^\/(book|booking|admin)(\/|$)/.test(pathname)) return null;

  return (
    <>
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-paper/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <a href={`tel:${site.phone.replace(/\s/g, "")}`} className={buttonClass("outline", "px-5")}>
          <PhoneIcon />
          Call
        </a>
        <ButtonLink href="/book" className="flex-1 px-4">
          Book a treatment
        </ButtonLink>
      </div>
    </>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}
