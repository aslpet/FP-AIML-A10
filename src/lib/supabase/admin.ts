import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

let _admin: SupabaseClient | null = null;

/**
 * Supabase client dengan SERVICE_ROLE_KEY — bypass RLS.
 * HANYA untuk operasi server-side: pipeline cron, penilaian, streak.
 * JANGAN diekspos ke client.
 *
 * Lazy-initialized agar tidak crash saat build time.
 */
export function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return _admin;
}
