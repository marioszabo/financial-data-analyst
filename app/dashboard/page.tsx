/// <reference path="../../types/stripe-elements.d.ts" />
// This reference is necessary for TypeScript to recognize the custom Stripe elements

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isSubscriptionActive } from '@/lib/utils'
import Script from 'next/script'

// Define the structure of user details
interface UserDetails {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('inactive')

  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      // Check for an active session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Redirect to login if no active session
        router.push('/auth/login')
        return
      }

      // Fetch user details
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Set user details in state
        setUser({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url
        })

        // Check subscription status
        const isActive = await isSubscriptionActive(user.id)
        setSubscriptionStatus(isActive ? 'active' : 'inactive')
      }

      setLoading(false)
    }

    fetchUserAndSubscription()
  }, [router])

  // Handle user logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/') // Redirect to the landing page after logout
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Show loading state while fetching user data
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      {/* Load Stripe script for buy button */}
      <Script src="https://js.stripe.com/v3/buy-button.js" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
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

        {/* Subscription Card */}
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
            {subscriptionStatus === 'inactive' && (
              // Stripe buy button for inactive subscriptions
              <stripe-buy-button
                buy-button-id="buy_btn_1QCResHV58Ez6fBuVAn9eDpX"
                publishable-key="pk_live_51QBZP7HV58Ez6fBu8EwTkh16sFW5xX1uS1yOpLdDyEvEvJQm9ISLWmx2VpuqUXgeXvjxQT3RKIiGjx7mRxqRDerz00dae7QHXY"
              >
              </stripe-buy-button>
            )}
            {subscriptionStatus === 'active' && (
              // Placeholder for subscription management
              <Button variant="outline" onClick={() => {/* Add logic to manage subscription */}}>
                Manage Subscription
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Financial Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Analysis</CardTitle>
            <CardDescription>Access your financial assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Get insights and analyze your financial data</p>
          </CardContent>
          <CardFooter>
            {subscriptionStatus === 'active' ? (
              // Allow access to finance page for active subscriptions
              <Button onClick={() => router.push('/finance')}>Go to Finance Page</Button>
            ) : (
              // Disable access for inactive subscriptions
              <Button disabled>Subscribe to Access</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
