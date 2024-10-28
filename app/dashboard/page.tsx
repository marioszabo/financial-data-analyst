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
import { ChartBar, MessageSquare, Brain, ArrowRight, Settings, CreditCard, LogOut } from 'lucide-react'

// Initialize Stripe outside component to prevent multiple instances
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

/**
 * Core interfaces for user and subscription management
 * Used throughout the dashboard for type safety and data consistency
 */
interface UserDetails {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface SubscriptionDetails {
  status: 'active' | 'inactive'
  start_date?: string
  end_date?: string
  current_period_end?: string
  cancel_at_period_end?: boolean  // Add this property
}

/**
 * Dashboard Page Component
 * 
 * Core features:
 * - User profile display and management
 * - Subscription status tracking
 * - Feature access control based on subscription
 * - Stripe integration for payments
 * 
 * Security considerations:
 * - Client-side session validation
 * - Protected route access
 * - Secure payment handling
 * 
 * State management:
 * - User details
 * - Subscription status
 * - Loading states
 * - Processing states for actions
 */
export default function DashboardPage() {
  // Initialize router and state management
  const router = useRouter()
  const supabase = createClient()
  
  // State for user details and loading states
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // State for subscription management
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('inactive')
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails>({
    status: 'inactive',
    cancel_at_period_end: false  // Add default value
  })

  /**
   * Effect hook to fetch user data and subscription status
   * Performs session verification and redirects if unauthorized
   * Retrieves user details and subscription information from Supabase
   */
  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        // Verify session before any data fetching
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push('/auth/login')
          return
        }

        // Fetch and transform user details
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !authUser) throw userError

        // Set user details in state
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name,
          avatar_url: authUser.user_metadata?.avatar_url
        })

        // Fetch subscription status from database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, created_at, current_period_end, cancel_at_period_end')
          .eq('user_id', authUser.id)
          .single()

        // Update subscription details if found
        if (subscription) {
          setSubscriptionDetails({
            status: subscription.cancel_at_period_end ? 'canceled' : subscription.status,
            start_date: subscription.created_at,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end  // Now TypeScript knows about this property
          })
        }

        // Verify subscription status with external service
        const isActive = await isSubscriptionActive(authUser.id)
        setSubscriptionStatus(isActive ? 'active' : 'inactive')
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
   * Handles user logout
   * Signs out user from Supabase and redirects to home page
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  /**
   * Subscription Handler
   * Initiates Stripe checkout flow with error handling
   * Maintains UI state during processing
   * 
   * Security:
   * - Server-side session creation
   * - Client-side redirect handling
   * - Error state management
   */
  const handleSubscribe = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const { sessionId, error } = await response.json()
      if (error) throw new Error(error)
      
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to initialize')

      // Redirect to Stripe's hosted checkout
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) throw error
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Subscription Management Handler
   * Creates and redirects to Stripe Customer Portal
   * Enables subscription management and cancellation
   * 
   * Features:
   * - Billing history access
   * - Payment method updates
   * - Plan changes
   * - Cancellation handling
   */
  const handleManageSubscription = async () => {
    try {
      setIsProcessing(true)
      
      // Create portal session with user context
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })

      if (!response.ok) throw new Error('Failed to create portal session')

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error accessing customer portal:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add skeleton loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Main dashboard layout with three main sections:
  // 1. Profile information
  // 2. Subscription status and management
  // 3. Financial analysis features access
  return (
    <div className="min-h-screen bg-gray-50">
      <Script src="https://js.stripe.com/v3/buy-button.js" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <ChartBar className="h-8 w-8 text-black" />
              <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-black hover:text-black">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-black hover:text-black">
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">Welcome back, {user?.full_name || 'User'}!</h2>
          <p className="text-black">Here's an overview of your account and features.</p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-black">
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-gray-200">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-gray-900 text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold text-black">{user?.full_name || 'N/A'}</p>
                <p className="text-sm text-black">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-black">
                <CreditCard className="h-5 w-5" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription className="text-black">
                {subscriptionDetails.cancel_at_period_end 
                  ? 'Your subscription has been canceled'
                  : subscriptionDetails.status === 'active' 
                    ? 'Your subscription is active'
                    : 'Upgrade to access all features'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    subscriptionDetails.cancel_at_period_end ? 'bg-yellow-500' :
                    subscriptionDetails.status === 'active' ? 'bg-green-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="font-medium text-black">
                    {subscriptionDetails.cancel_at_period_end ? 'Canceled' :
                     subscriptionDetails.status === 'active' ? 'Active' : 
                     'Inactive'}
                  </span>
                </div>

                {(subscriptionDetails.status === 'active' || subscriptionDetails.cancel_at_period_end) && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="space-y-1">
                      <div className="text-sm text-black">Subscribed on</div>
                      <div className="font-medium text-black">
                        {new Date(subscriptionDetails.start_date!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-black">
                        {subscriptionDetails.cancel_at_period_end ? 'Access until' : 'Next billing date'}
                      </div>
                      <div className="font-medium text-black">
                        {new Date(subscriptionDetails.current_period_end!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-black mt-2">
                      {subscriptionDetails.cancel_at_period_end 
                        ? 'Your subscription has been canceled and will not renew. You have access until the end date above.'
                        : 'Your subscription will automatically renew on the next billing date'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {subscriptionDetails.status === 'inactive' ? (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isProcessing}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      <span className="text-white">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white">Subscribe Now</span>
                      <ArrowRight className="ml-2 h-4 w-4 text-white" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Financial Analysis Card */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-black">
                <Brain className="h-5 w-5" />
                <span>Financial Analysis</span>
              </CardTitle>
              <CardDescription className="text-black">AI-Powered Financial Assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-black">
                  Upload your financial data and get instant insights through natural conversation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 text-sm text-black">
                    <ChartBar className="h-4 w-4" />
                    <span>Data Visualization</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-black">
                    <MessageSquare className="h-4 w-4" />
                    <span>AI Chat</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {subscriptionStatus === 'active' ? (
                <Button 
                  onClick={() => router.push('/finance')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <span className="text-white">Start Analysis</span>
                  <ArrowRight className="ml-2 h-4 w-4 text-white" />
                </Button>
              ) : (
                <Button disabled className="w-full">
                  Subscribe to Access
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
