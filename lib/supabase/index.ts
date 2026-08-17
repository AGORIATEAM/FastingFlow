import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Expo inlines EXPO_PUBLIC_* at bundle time; process.env is untyped here
const env = process.env as Record<string, string | undefined>;
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** True when the Supabase env vars are configured (see .env.example). */
export function isAuthConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Lazily-created Supabase client. Returns null when the project env vars are
 * missing — the app must keep working fully offline in guest mode.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
