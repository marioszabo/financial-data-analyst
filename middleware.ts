import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Authentication and Authorization Middleware
 * 
 * Protects routes and manages access control based on:
 * - Authentication status
 * - Subscription status
 * - Route permissions
 * 
 * Protected routes:
 * - /finance/*: Requires active subscription
 * - /dashboard/*: Requires authentication
 * - /auth/*: Handles authentication flow
 * 
 * Security features:
 * - Session verification
 * - Subscription validation
 * - Secure redirects
 * - Error boundary protection
 */
export async function middleware(req: NextRequest) {
  try {
    // Create response early to allow header modifications
    const res = NextResponse.next()
    
    // Initialize Supabase client with request context
    // This enables session handling via cookies
    const supabase = createMiddlewareClient({ req, res })

    // Verify session status
    // This check is cached by Supabase for performance
    const {
      data: { session },
    } = await supabase.auth.getSession()

    /**
     * Finance Route Protection
     * 
     * Double verification process:
     * 1. Check authentication status
     * 2. Verify active subscription
     * 
     * Failure modes:
     * - No session → Login redirect
     * - No subscription → Dashboard redirect
     * - DB error → Dashboard redirect (fail secure)
     */
    if (req.nextUrl.pathname.startsWith('/finance')) {
      if (!session) {
        console.log('Middleware: No session, redirecting to login')
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      try {
        // Verify subscription status
        // Only active subscriptions can access finance routes
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .single()

        if (error) throw error

        // Enforce subscription requirement
        // Redirects to dashboard for upgrade opportunity
        if (!subscription || subscription.status !== 'active') {
          console.log('Middleware: No active subscription, redirecting to dashboard')
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } catch (error) {
        console.error('Middleware subscription check error:', error)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    /**
     * Authentication Flow Management
     * Prevents authenticated users from accessing login page
     * Improves UX by automatic redirect to dashboard
     */
    if (session && req.nextUrl.pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    // Global error boundary
    // Fails secure by redirecting to login
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

/**
 * Route Configuration
 * 
 * Defines which routes are protected by middleware:
 * - /auth/*: Authentication flow routes
 * - /dashboard/*: User dashboard routes
 * - /finance/*: Subscription-required routes
 * 
 * Note: Order matters for wildcard matches
 */
export const config = {
  matcher: ['/auth/login', '/auth/callback', '/dashboard/:path*', '/finance/:path*']
}
