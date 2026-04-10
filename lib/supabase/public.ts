import { createClient } from '@supabase/supabase-js'

/**
 * A lightweight Supabase client that uses the anon key without any
 * cookie/session handling. Use this for public server-side pages
 * (e.g. the embeddable widget) that must work for unauthenticated
 * visitors without triggering session-based RLS policies.
 *
 * NOTE: For this to work, your Supabase RLS policy on the `chatbots`
 * table must allow `anon` role SELECT access (at least on the columns
 * id, name, welcome_message). You can add a policy in the Supabase
 * dashboard:
 *   Table: chatbots
 *   Operation: SELECT
 *   Role: anon
 *   Using expression: true
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
