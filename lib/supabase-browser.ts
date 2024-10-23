'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Supabase Client Factory for Client Components
 * 
 * Creates a Supabase client instance specifically configured for client-side usage.
 * This client automatically:
 * - Handles cookie-based authentication
 * - Manages refresh tokens
 * - Maintains session state across page navigation
 * - Provides real-time subscription capabilities
 * 
 * Note: This client should only be used in components marked with 'use client'
 * For server components, use supabase-server.ts instead
 * 
 * @returns A configured Supabase client for client-side operations
 */
export const createClient = () => {
  return createClientComponentClient()
}
