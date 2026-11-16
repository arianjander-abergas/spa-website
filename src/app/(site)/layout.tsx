import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileBookBar } from "@/components/site/MobileBookBar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <Suspense>
        <MobileBookBar />
      </Suspense>
    </>
  );
}
