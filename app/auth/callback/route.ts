import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    console.log('Auth callback route hit:', {
      hasCode: !!code,
      url: requestUrl.toString(),
    })

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Error exchanging code for session:', error)
          throw error
        }

        console.log('Session created successfully:', {
          hasSession: !!data.session,
          userId: data.session?.user?.id
        })

        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (error) {
        console.error('Error in code exchange:', error)
        const errorMessage = error instanceof AuthError 
          ? error.message 
          : 'An unexpected error occurred'
          
        return NextResponse.redirect(
          new URL(`/auth/login?error=session_error&details=${encodeURIComponent(errorMessage)}`, request.url)
        )
      }
    }

    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  } catch (error) {
    console.error('Callback route error:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred'
      
    return NextResponse.redirect(new URL(`/auth/login?error=callback_error&details=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
