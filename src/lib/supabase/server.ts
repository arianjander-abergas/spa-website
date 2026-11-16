import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cookie-based client for the staff admin. Carries the signed-in session. */
export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) cookieStore.set(name, value, options);
          } catch {
            // Called while rendering a page, where cookies are read-only.
            // The proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/** Returns the signed-in staff user, or null. Checks the admins table. */
export async function getAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? { supabase, user: data.user } : null;
}
