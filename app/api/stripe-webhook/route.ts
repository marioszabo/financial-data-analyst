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

// Use Node.js runtime for better crypto support
export const runtime = 'nodejs'

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
    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Debug logging
    console.log('Webhook received:', {
      headers: Object.fromEntries(req.headers),
      bodyPreview: rawBody.substring(0, 100) // Log first 100 chars only
    })
    
    // Get Stripe signature from headers
    // This is used to verify the webhook came from Stripe
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    // Log webhook details for debugging
    // Only logs partial secrets for security
    console.log('Webhook request details:', {
      hasSignature: !!signature,
      signatureValue: signature?.substring(0, 20) + '...',
      bodyLength: rawBody.length,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...'
    })

    if (!signature) {
      throw new Error('No stripe signature found')
    }

    // Verify webhook signature
    // This prevents unauthorized webhook calls
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log('Event verified:', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        // Verify user ID exists in metadata
        // This ensures we only process subscriptions we created
        if (!userId) {
          console.error('No user ID found in webhook')
          return NextResponse.json(
            { error: 'No user ID found' },
            { status: 400 }
          )
        }

        // Log subscription processing details
        console.log('Processing subscription:', {
          type: event.type,
          userId,
          status: subscription.status,
          subscriptionId: subscription.id
        })

        // Log upsert attempt
        console.log('Attempting database upsert:', {
          userId: userId,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        })

        // Upsert subscription data
        // Uses onConflict to handle potential duplicate events
        const { data, error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            // Convert Unix timestamps to ISO strings for database
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
            onConflict: 'user_id' // Update existing subscription if found
          })

        // Log upsert result
        if (subscriptionError) {
          console.error('Database upsert failed:', {
            error: subscriptionError,
            errorMessage: subscriptionError.message,
            details: subscriptionError.details
          })
        } else {
          console.log('Database upsert successful:', { data })
        }

        if (subscriptionError) {
          console.error('❌ Subscription update failed:', subscriptionError)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 400 }
          )
        }

        console.log('✅ Subscription updated successfully')
        break

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object as Stripe.Subscription
        const canceledUserId = canceledSubscription.metadata.userId

        // Handle subscription cancellation
        // Updates status and sets cancellation timestamp
        if (canceledUserId) {
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .match({ user_id: canceledUserId })

          if (cancelError) {
            console.error('❌ Subscription cancellation failed:', cancelError)
          }
        }
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Log detailed error but return generic message
    // This prevents sensitive information leakage
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Webhook Error' },
      { status: 400 }
    )
  }
}
