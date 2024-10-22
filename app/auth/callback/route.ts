import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Handle GET requests for authentication callback
export async function GET(request: Request) {
  // Extract the current URL from the request
  const requestUrl = new URL(request.url)
  // Retrieve the authorization code from URL parameters
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // Create a Supabase client for server-side operations
    const supabase = createRouteHandlerClient({ cookies })
    // Exchange the authorization code for a session
    // This step completes the OAuth flow
    await supabase.auth.exchangeCodeForSession(code)
    
    // Verify if the session was successfully created
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after exchange:', session ? 'exists' : 'null')
    // Note: This log is useful for debugging authentication issues
  }

  // Redirect the user to the dashboard after authentication
  // This ensures a smooth user experience post-login
  console.log('Redirecting to:', `${requestUrl.origin}/dashboard`)
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
