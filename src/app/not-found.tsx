import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-start justify-center py-32">
      <p className="eyebrow">Page not found</p>
      <h1 className="display mt-5">Nothing here.</h1>
      <p className="lede mt-6">The page you were looking for has moved or no longer exists.</p>
      <ButtonLink href="/" className="mt-10">
        Back to home
      </ButtonLink>
    </main>
  );
}
