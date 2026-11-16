"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { nav, site } from "@/content/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-mr-2 flex h-11 w-11 items-center justify-center"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden className="relative block h-3 w-6">
          <span
            className={`absolute left-0 block h-px w-6 bg-ink transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 block h-px w-6 bg-ink transition-transform ${open ? "top-1.5 -rotate-45" : "top-3"}`}
          />
        </span>
      </button>

      {/* Rendered into <body>: the header's blur effect would otherwise trap
          this full-screen panel inside the header's own box. */}
      {open &&
        createPortal(
        <div
          id="mobile-menu"
          className="step-enter fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col justify-between overflow-y-auto bg-paper px-5 pb-10 pt-4 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {[...nav, { href: "/book", label: "Book a treatment" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-5 font-serif text-3xl"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-8 text-sm text-stone">
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link tap">
              Call {site.phone}
            </a>
          </p>
        </div>,
          document.body,
        )}
    </div>
  );
}
