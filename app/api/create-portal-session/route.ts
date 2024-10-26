import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * Stripe Customer Portal Session Handler
 * 
 * Creates a session URL for the Stripe Customer Portal, allowing users to:
 * - Manage their subscription
 * - Update payment methods
 * - View billing history
 * - Cancel/upgrade subscription
 * 
 * Security considerations:
 * - Requires valid user ID
 * - Verifies subscription existence
 * - Uses server-side session creation
 * 
 * Flow:
 * 1. Validate user has active subscription
 * 2. Retrieve Stripe customer ID
 * 3. Create portal session
 * 4. Return session URL for client redirect
 */

// Initialize Stripe with API version lock for stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    
    // Query Supabase for existing subscription
    // This verifies the user has an active subscription before creating portal session
    const supabase = createClient()
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    // Handle case where user has no subscription
    // This prevents unauthorized access to billing portal
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create Stripe portal session with return URL
    // This allows users to manage their subscription and return to the dashboard
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, // Ensures user returns to dashboard after portal actions
    })

    // Return portal URL for client-side redirect
    return NextResponse.json({ url: session.url })
  } catch (error) {
    // Log error for debugging but return generic message for security
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
