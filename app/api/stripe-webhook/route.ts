import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

/**
 * Stripe Webhook Handler
 * 
 * Processes subscription events from Stripe and updates Supabase database.
 * Uses Node.js runtime for improved performance and reliability.
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

// Change to Node.js runtime
export const runtime = 'nodejs'

// Initialize Stripe
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
    // Get the raw body
    const rawBody = await req.text()
    
    // Get headers using next/headers
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    console.log('Webhook request details:', {
      hasSignature: !!signature,
      signatureValue: signature?.substring(0, 20) + '...',
      bodyLength: rawBody.length,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...'
    })

    if (!signature) {
      throw new Error('No stripe signature found')
    }

    // Verify the event
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

        if (!userId) {
          console.error('No user ID found in webhook')
          return NextResponse.json(
            { error: 'No user ID found' },
            { status: 400 }
          )
        }

        console.log('Processing subscription:', {
          type: event.type,
          userId,
          status: subscription.status,
          subscriptionId: subscription.id
        })

        const { error: subscriptionError } = await supabase
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
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Webhook Error' },
      { status: 400 }
    )
  }
}
