"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/admin-actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="mx-auto mt-10 max-w-sm space-y-5">
      {error && (
        <p role="alert" className="border-l-2 border-error bg-white px-4 py-3 text-sm">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
