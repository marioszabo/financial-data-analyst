import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protect /finance routes
    if (req.nextUrl.pathname.startsWith('/finance')) {
      if (!session) {
        console.log('Middleware: No session, redirecting to login')
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      try {
        // Check subscription
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .single()

        if (error) throw error

        if (!subscription || subscription.status !== 'active') {
          console.log('Middleware: No active subscription, redirecting to dashboard')
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } catch (error) {
        console.error('Middleware subscription check error:', error)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // If user is signed in and the current path is /auth/login redirect to /dashboard
    if (session && req.nextUrl.pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: ['/auth/login', '/auth/callback', '/dashboard/:path*', '/finance/:path*']
}
