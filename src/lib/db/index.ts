import "server-only";
import { MemoryStore } from "./memory-store";
import type { Store } from "./store";
import { SupabaseStore } from "./supabase-store";

export type { Scope, Store } from "./store";

let store: Store | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Supabase jika dikonfigurasi; jika tidak, penyimpanan memori (lihat /api/health). */
export function getStore(): Store {
  if (store) return store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && key ? new SupabaseStore(url, key) : new MemoryStore();
  return store;
}
