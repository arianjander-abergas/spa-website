import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/content/site";
import { signOut } from "@/lib/admin-actions";
import { hasSupabase } from "@/lib/supabase/public";
import { getAdmin } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

const tabs = [
  { href: "/admin", label: "Bookings" },
  { href: "/admin/hours", label: "Hours & time off" },
  { href: "/admin/treatments", label: "Treatments & team" },
];

type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/**
 * Wraps every admin page: shows the sign-in form to anyone who is not staff,
 * otherwise the navigation and the page.
 */
export async function AdminShell({
  current,
  children,
}: {
  current: string;
  children: (supabase: Admin["supabase"]) => ReactNode | Promise<ReactNode>;
}) {
  if (!hasSupabase) {
    return (
      <div className="container-page py-20">
        <h1 className="heading">Staff admin</h1>
        <p className="lede mt-4">The database is not connected yet. Add the Supabase values to .env.local first.</p>
      </div>
    );
  }

  const admin = await getAdmin();
  if (!admin) {
    return (
      <div className="container-page py-20">
        <h1 className="heading text-center">Staff sign in</h1>
        <LoginForm />
        <p className="mt-10 text-center text-sm">
          <Link href="/" className="link">
            Back to website
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4">
          <Link href="/" className="font-serif text-2xl">
            {site.name} <span className="eyebrow ml-1">Staff</span>
          </Link>
          <form action={signOut} className="flex items-center gap-4 text-sm">
            <span className="hidden text-stone sm:inline">{admin.user.email}</span>
            <button type="submit" className="link">
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Admin" className="container-page flex gap-6 overflow-x-auto text-sm">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.href === current ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 py-3 ${
                tab.href === current ? "border-ink" : "border-transparent text-stone hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page flex-1 py-10">{await children(admin.supabase)}</main>
    </>
  );
}

export function AdminFallback() {
  return <div className="container-page py-20 text-sm text-stone">Loading…</div>;
}
