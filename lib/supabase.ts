import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Configuration and Client Initialization
 * 
 * This module sets up the base Supabase client with authentication configuration.
 * Environment variables must be set in .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your public anon key
 * 
 * Security considerations:
 * - Uses PKCE flow for enhanced OAuth security
 * - Implements automatic token refresh
 * - Handles session persistence safely
 * - Manages storage based on environment
 * 
 * Usage restrictions:
 * - Anon key must have limited RLS policies
 * - Only public tables should be accessible
 * - Sensitive operations require server-side key
 */

// Validate required environment variables at startup
// This prevents runtime errors from missing configuration
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
 * 
 * Environment handling:
 * - Browser: Uses localStorage for session persistence
 * - Server: Disables storage to prevent SSR issues
 * - Edge: Compatible with Edge runtime restrictions
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
 * 
 * Purpose:
 * - Catches authentication failures
 * - Logs API call errors
 * - Helps debug session issues
 * - Prevents silent failures
 * 
 * Note: Only logs to console in development
 * Production should use proper error tracking
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}
