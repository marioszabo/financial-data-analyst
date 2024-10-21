import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log('Middleware - Current path:', req.nextUrl.pathname)
    console.log('Middleware - Session:', session ? 'exists' : 'null')
    if (session) {
      console.log('Middleware - User ID:', session.user.id)
    } else {
      console.log('Middleware - No session found')
    }

    // ... rest of the middleware function
  } catch (e) {
    console.error('Middleware error:', e)
    return res
  }
}

// ... rest of the file