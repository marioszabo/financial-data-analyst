import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Supabase Client Factory for Server Components
 * 
 * Creates a Supabase client instance specifically configured for server-side operations.
 * This client:
 * - Uses Next.js server-side cookie handling
 * - Maintains session state without client-side JavaScript
 * - Supports Server Components and API routes
 * - Handles authentication in SSR context
 * 
 * Important: This client must only be used in:
 * - Server Components (not marked with 'use client')
 * - API routes
 * - Server-side operations (getServerSideProps, etc.)
 * 
 * For client components, use supabase-browser.ts instead
 * 
 * @returns A configured Supabase client for server-side operations
 */
export const createClient = () => {
  // Access cookies from Next.js server context
  const cookieStore = cookies()
  
  // Create client with server-specific cookie handling
  return createServerComponentClient({ 
    cookies: () => cookieStore 
  })
}

// Add this export to use a singleton instance
export const supabase = createClient()
