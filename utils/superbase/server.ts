import { auth } from "@clerk/nextjs/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createAuthenticatedClient() {
  const session = await auth()
  if (!session.userId) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and publishable key must be configured.")
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    accessToken: async () => {
      const token = await session.getToken()
      if (!token) {
        throw new Error("Clerk did not provide an access token for Supabase.")
      }
      return token
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  return { supabase, userId: session.userId }
}
