'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isSubscriptionActive } from '@/lib/utils'
import Script from 'next/script'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

/**
 * UserDetails Interface
 * Defines the structure of user data retrieved from Supabase Auth
 * Optional fields account for incomplete social provider data
 */
interface UserDetails {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * DashboardPage Component
 * 
 * Protected route that displays user profile, subscription status, and app features.
 * Handles session verification, user data fetching, and subscription management.
 * Integrates with Stripe for payment processing and subscription handling.
 */
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('inactive')
  const supabase = createClient()

  /**
   * User Data and Subscription Fetching Effect
   * 
   * 1. Verifies active session
   * 2. Fetches user details from Supabase Auth
   * 3. Checks subscription status
   * 4. Redirects to login if session is invalid
   */
  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        // Session verification - must happen before any data fetching
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          router.push('/auth/login')
          return
        }

        // Fetch authenticated user details
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (authUser) {
          // Transform auth data into UserDetails format
          setUser({
            id: authUser.id,
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name,
            avatar_url: authUser.user_metadata?.avatar_url
          })

          // Check subscription status from external utility
          const isActive = await isSubscriptionActive(authUser.id)
          setSubscriptionStatus(isActive ? 'active' : 'inactive')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndSubscription()
  }, [router, supabase])

  /**
   * Logout Handler
   * Signs out user and clears session
   * Redirects to home page on success
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Add this function
  const handleSubscribe = async () => {
    try {
      setIsProcessing(true)
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const { sessionId } = await response.json()
      
      // Get Stripe instance
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize')
      }

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Subscription error:', error)
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state with centered spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Main dashboard layout
  return (
    <div className="container mx-auto p-4">
      {/* Stripe Script for payment processing */}
      <Script src="https://js.stripe.com/v3/buy-button.js" />
      
      {/* Dashboard header with logout button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
      
      {/* Dashboard grid layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card - Displays user information and avatar */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold">{user?.full_name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {subscriptionStatus === 'active' 
                ? 'Manage your active subscription'
                : 'Subscribe to access all features'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${
                  subscriptionStatus === 'active' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </p>
              {subscriptionStatus === 'inactive' && (
                <p className="text-sm text-gray-500">
                  Subscribe to unlock all features including AI-powered financial analysis
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {subscriptionStatus === 'inactive' ? (
              <Button 
                onClick={handleSubscribe} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⭮</span>
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://billing.stripe.com/p/login/test_28o5kQ3Yf2Xf2CAbII')}
              >
                Manage Subscription
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Financial Analysis Feature Card */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Analysis</CardTitle>
            <CardDescription>Access your financial assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Get insights and analyze your financial data</p>
          </CardContent>
          <CardFooter>
            {/* Access control based on subscription status */}
            {subscriptionStatus === 'active' ? (
              <Button onClick={() => router.push('/finance')}>Go to Finance Page</Button>
            ) : (
              <Button disabled>Subscribe to Access</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
