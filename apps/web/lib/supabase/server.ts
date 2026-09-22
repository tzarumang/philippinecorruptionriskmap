import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { serverConfig } from '../config/server';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Uses the PUBLISHABLE key, so every query is still subject to Row Level
 * Security. That is deliberate: server-side code has no automatic right to
 * read everything, and routing public reads through the anon role means the
 * policies in the migration are exercised on every request rather than
 * quietly bypassed.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(serverConfig.supabaseUrl(), serverConfig.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Token refresh is handled in middleware, so this is safe to ignore.
        }
      },
    },
  });
}
