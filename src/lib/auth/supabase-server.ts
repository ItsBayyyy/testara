import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Klien Supabase Auth untuk petugas, memakai kunci publishable (SUPABASE_ANON_KEY)
// dan cookie sesi. Pola getAll/setAll mengikuti dokumentasi @supabase/ssr.

export function authConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export async function createAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) jar.set(name, value, options);
        } catch {
          // Dipanggil dari Server Component: penyegaran sesi ditangani proxy.ts.
        }
      },
    },
  });
}
