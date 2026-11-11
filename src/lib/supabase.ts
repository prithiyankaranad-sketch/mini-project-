import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
function validHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" ||
      (import.meta.env.DEV &&
        ["localhost", "127.0.0.1"].includes(u.hostname) &&
        u.protocol === "http:")
    );
  } catch {
    return false;
  }
}
export const configurationReady =
  validHttpsUrl(projectUrl) && Boolean(publishableKey);
// Deliberately no placeholder client and no fake data fallback.
export const supabase = configurationReady
  ? createClient<Database>(projectUrl!, publishableKey!, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Set the real project URL and publishable key.",
    );
  return supabase;
}
export const authRedirect = (path: "/auth/callback" | "/reset-password") =>
  `${window.location.origin}${path}`;
