import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Configuration and Client Initialization
 * 
 * This module sets up the base Supabase client with authentication configuration.
 * Environment variables must be set in .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your public anon key
 */

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Initialize Supabase client with authentication configuration
 * 
 * Configuration details:
 * - persistSession: Maintains session across page reloads
 * - autoRefreshToken: Automatically refreshes JWT before expiry
 * - detectSessionInUrl: Handles OAuth callbacks
 * - flowType: Uses PKCE flow for enhanced security
 * - storage: Uses localStorage in browser, undefined in SSR
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Keep user logged in after page refresh
    autoRefreshToken: true,    // Refresh JWT before session expiry
    detectSessionInUrl: true,  // Required for OAuth login
    flowType: 'pkce',         // Proof Key for Code Exchange (more secure than implicit flow)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

/**
 * Global error handler for unhandled promise rejections
 * Only attached in browser environment to prevent SSR issues
 * Helps debug authentication and API call failures
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}
