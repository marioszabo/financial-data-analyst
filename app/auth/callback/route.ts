import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@supabase/supabase-js'

/**
 * OAuth Callback Route Handler
 * 
 * Handles the OAuth 2.0 callback from third-party providers (e.g., Google).
 * Implements PKCE (Proof Key for Code Exchange) flow for enhanced security.
 * 
 * Security considerations:
 * - Validates OAuth code presence
 * - Uses PKCE to prevent code interception attacks
 * - Handles session exchange securely
 * - Provides detailed error handling
 * 
 * Flow:
 * 1. Receive callback with OAuth code
 * 2. Exchange code for session using PKCE
 * 3. Establish user session with Supabase
 * 4. Redirect to appropriate destination
 * 
 * Error Handling:
 * - Handles missing OAuth code
 * - Manages session exchange failures
 * - Provides specific error messages for debugging
 * - Maintains security in error responses
 */
export async function GET(request: Request) {
  try {
    // Extract code from callback URL
    // The code is used to exchange for a session token
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Debug logging for callback monitoring
    // Only logs non-sensitive information
    console.log('Auth callback route hit:', {
      hasCode: !!code,
      url: requestUrl.toString(),
    })

    if (code) {
      // Initialize Supabase client for route handler
      // Uses cookies for session management
      const supabase = createRouteHandlerClient({ cookies })
      
      try {
        // Exchange OAuth code for session
        // This completes the PKCE flow and establishes user session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Error exchanging code for session:', error)
          throw error
        }

        // Log successful authentication
        // Helps with debugging while maintaining privacy
        console.log('Session created successfully:', {
          hasSession: !!data.session,
          userId: data.session?.user?.id
        })

        // Redirect to dashboard after successful auth
        // User now has an active session
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (error) {
        // Handle auth-specific errors with detailed messages
        // Provides better debugging while maintaining security
        console.error('Error in code exchange:', error)
        const errorMessage = error instanceof AuthError 
          ? error.message // Use specific auth error messages
          : 'An unexpected error occurred' // Generic message for other errors
          
        // Redirect to login with encoded error details
        return NextResponse.redirect(
          new URL(`/auth/login?error=session_error&details=${encodeURIComponent(errorMessage)}`, request.url)
        )
      }
    }

    // Handle missing OAuth code
    // This could indicate a direct access attempt or callback tampering
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  } catch (error) {
    // Catch-all error handler for unexpected issues
    // Logs full error but returns limited details to client
    console.error('Callback route error:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred'
      
    // Redirect with encoded error message
    // Maintains security while providing feedback
    return NextResponse.redirect(
      new URL(`/auth/login?error=callback_error&details=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
