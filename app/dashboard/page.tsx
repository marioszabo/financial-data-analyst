'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isSubscriptionActive } from '@/lib/utils'
import Script from 'next/script'

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

  // Loading state with centered spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Current Plan: {subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
          <CardFooter>
            {/* Conditional rendering based on subscription status */}
            {subscriptionStatus === 'inactive' && (
              <stripe-buy-button
                buy-button-id="buy_btn_1QCResHV58Ez6fBuVAn9eDpX"
                publishable-key="pk_live_51QBZP7HV58Ez6fBu8EwTkh16sFW5xX1uS1yOpLdDyEvEvJQm9ISLWmx2VpuqUXgeXvjxQT3RKIiGjx7mRxqRDerz00dae7QHXY"
              >
              </stripe-buy-button>
            )}
            {subscriptionStatus === 'active' && (
              <Button variant="outline" onClick={() => {/* Add subscription management logic */}}>
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
