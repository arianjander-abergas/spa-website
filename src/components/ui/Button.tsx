import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "light";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-7 text-[0.8125rem] font-medium uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-[#33322e]",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  light: "bg-paper text-ink hover:bg-white",
};

export function buttonClass(variant: Variant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

type Common = { variant?: Variant; className?: string; children: ReactNode };

export function Button({
  variant,
  className,
  children,
  ...props
}: Common & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={buttonClass(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  className,
  children,
  href,
  ...props
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, "className" | "children" | "href">) {
  return (
    <Link href={href} className={buttonClass(variant, className)} {...props}>
      {children}
    </Link>
  );
}
