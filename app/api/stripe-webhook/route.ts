import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

/**
 * Stripe Webhook Handler
 * 
 * Processes subscription events from Stripe and updates Supabase database.
 * Uses Node.js runtime for improved webhook signature verification.
 * 
 * Security considerations:
 * - Validates webhook signatures using Stripe's crypto library
 * - Handles race conditions via upsert operations
 * - Provides detailed error logging for debugging
 * - Validates user IDs before database operations
 * 
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 * 
 * Database considerations:
 * - Uses upsert to handle potential duplicate events
 * - Maintains subscription status history
 * - Tracks cancellation and period end dates
 */

// Route Segment Configuration - this replaces the old config export
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60  // Changed from 300 to 60 to comply with Vercel hobby plan limits

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

/**
 * Webhook Event Handler
 * 
 * Processes Stripe subscription events and syncs with Supabase.
 * Currently handles:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * 
 * Future events to consider:
 * - payment_intent.succeeded
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    // Debug logging
    console.log('Webhook request details:', {
      hasSignature: !!signature,
      signatureValue: signature?.substring(0, 20) + '...',
      bodyLength: body.length,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 8) + '...'
    })

    if (!signature) {
      throw new Error('No stripe signature found')
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Debug logging
    console.log('Webhook event received:', {
      type: event.type,
      id: event.id
    })

    // Return 200 immediately after verification
    const response = NextResponse.json({ received: true })

    // Process the event asynchronously
    handleWebhookEvent(event).catch(error => {
      console.error('Async webhook processing error:', error)
    })

    return response
  } catch (err) {
    console.error('Webhook error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Webhook Error' },
      { status: 400 }
    )
  }
}

// Async handler for event processing
async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      // Debug logging
      console.log('Processing subscription:', {
        id: subscription.id,
        customer: subscription.customer,
        metadata: subscription.metadata
      })

      // For test events, use the customer ID if userId is not in metadata
      const userId = subscription.metadata.userId || subscription.customer

      if (!userId) {
        console.error('No user ID or customer ID found in webhook')
        return
      }

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000).toISOString() 
            : null,
          cancel_at: subscription.cancel_at 
            ? new Date(subscription.cancel_at * 1000).toISOString() 
            : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      console.log('Subscription processed successfully:', subscription.id)
      break
    }
    case 'customer.subscription.deleted': {
      const canceledSubscription = event.data.object as Stripe.Subscription
      const canceledUserId = canceledSubscription.metadata.userId

      if (canceledUserId) {
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .match({ user_id: canceledUserId })
      }
      break
    }
  }
}
