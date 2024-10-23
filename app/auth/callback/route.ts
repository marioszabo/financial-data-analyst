import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@supabase/supabase-js'

/**
 * OAuth Callback Route Handler
 * 
 * Handles the OAuth 2.0 callback from third-party providers (e.g., Google)
 * This route is called after a user authenticates with the provider
 * and exchanges the authorization code for a session.
 * 
 * @param request - Incoming request object containing the OAuth code
 * @returns Redirects to dashboard on success or login page with error on failure
 */
export async function GET(request: Request) {
  try {
    // Extract and validate the OAuth code from the callback URL
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Log callback details for debugging
    console.log('Auth callback route hit:', {
      hasCode: !!code,
      url: requestUrl.toString(),
    })

    if (code) {
      // Initialize Supabase client with route handler specific configuration
      const supabase = createRouteHandlerClient({ cookies })
      
      try {
        // Exchange the OAuth code for a session
        // This step completes the PKCE flow and establishes the user session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Error exchanging code for session:', error)
          throw error
        }

        // Log successful session creation for debugging
        console.log('Session created successfully:', {
          hasSession: !!data.session,
          userId: data.session?.user?.id
        })

        // Redirect to dashboard on successful authentication
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (error) {
        // Handle specific Supabase authentication errors
        console.error('Error in code exchange:', error)
        const errorMessage = error instanceof AuthError 
          ? error.message // Use Supabase's error message for auth-specific errors
          : 'An unexpected error occurred' // Generic message for unknown errors
          
        // Redirect to login with error details
        return NextResponse.redirect(
          new URL(`/auth/login?error=session_error&details=${encodeURIComponent(errorMessage)}`, request.url)
        )
      }
    }

    // Handle case where no OAuth code is present in the callback
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  } catch (error) {
    // Handle any unexpected errors in the callback process
    console.error('Callback route error:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred'
      
    // Redirect to login with generic error details
    return NextResponse.redirect(new URL(`/auth/login?error=callback_error&details=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
