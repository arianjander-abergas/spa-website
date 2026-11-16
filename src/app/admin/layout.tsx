import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
