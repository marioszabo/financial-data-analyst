import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

/**
 * Stripe Webhook Handler
 * 
 * Processes subscription events from Stripe and updates Supabase database.
 * Uses Edge runtime for improved performance and reliability.
 * 
 * Security considerations:
 * - Validates webhook signatures
 * - Handles race conditions in subscription updates
 * - Provides detailed error logging
 * 
 * Required environment variables:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 */

// This tells Next.js to use the Edge runtime for this route
export const runtime = 'edge'

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
})

/**
 * Webhook Event Handler
 * 
 * Processes Stripe subscription events and syncs with Supabase.
 * Currently handles:
 * - customer.subscription.created
 * 
 * Future events to consider:
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - payment_intent.succeeded
 */
export async function POST(req: NextRequest) {
  // Raw body needed for signature verification
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    // Cryptographic verification of webhook authenticity
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('🚨 Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle new subscription creation
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    // Note: This assumes 1:1 mapping between customers and users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError || !userData) {
      console.error('❌ User lookup failed:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    /**
     * Update subscription record with upsert to handle:
     * - New subscriptions
     * - Reactivated subscriptions
     * - Subscription updates
     * 
     * Converts Unix timestamps to ISO strings for PostgreSQL compatibility
     */
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userData.id,
        status: subscription.status,
        plan_type: subscription.items.data[0].price.nickname || 'default',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })

    if (subscriptionError) {
      console.error('❌ Subscription update failed:', subscriptionError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 400 })
    }

    // Acknowledge successful processing
    return NextResponse.json({ received: true })
  }

  // Acknowledge unhandled event types
  // This prevents Stripe from retrying webhooks for events we don't process
  return NextResponse.json({ received: true })
}
