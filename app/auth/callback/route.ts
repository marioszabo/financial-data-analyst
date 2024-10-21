import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    
    // Log the session after exchange
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after exchange:', session ? 'exists' : 'null')
  }

  // Redirect to the chatbot interface page after sign in
  console.log('Redirecting to:', `${requestUrl.origin}/finance`)
  return NextResponse.redirect(`${requestUrl.origin}/finance`)
}
