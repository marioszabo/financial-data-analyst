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
 * Security considerations:
 * - Uses secure cookie storage for tokens
 * - Implements PKCE flow for auth
 * - Handles token rotation automatically
 * - Prevents token exposure in localStorage
 * 
 * Usage:
 * ```tsx
 * 'use client'
 * const supabase = createClient()
 * const { data } = await supabase.from('table').select()
 * ```
 * 
 * Limitations:
 * - Must be used within 'use client' components only
 * - Not suitable for server-side operations
 * - Requires client-side JavaScript
 * - Limited to public API operations
 * 
 * @returns A configured Supabase client for client-side operations
 */
export const createClient = () => {
  return createClientComponentClient()
}
