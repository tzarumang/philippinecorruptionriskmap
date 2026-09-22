import 'server-only';

/**
 * Validated server-side configuration.
 *
 * `import 'server-only'` makes this module a build error if it is ever
 * imported into a Client Component, which is the guardrail that keeps the
 * service-role key out of the browser bundle by construction rather than by
 * discipline.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Copy .env.example to .env.local and fill it in.',
    );
  }
  return value;
}

export const serverConfig = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /**
   * Bypasses RLS. Only ever read here, never passed to a Client Component,
   * and never prefixed NEXT_PUBLIC_.
   */
  supabaseServiceRoleKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
};
