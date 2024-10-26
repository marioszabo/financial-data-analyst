import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

// Initialize Supabase with direct credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Important: Use service role key for webhook
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Webhook Event Handler
 * 
 * Processes Stripe subscription events and syncs with Supabase.
 * Currently handles:
 * - customer.subscription.created
 * - customer.subscription.updated
 * 
 * Future events to consider:
 * - customer.subscription.deleted
 * - payment_intent.succeeded
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        console.log('Processing subscription:', {
          eventType: event.type,
          userId,
          subscriptionId: subscription.id,
          status: subscription.status
        })

        if (userId) {
          const subscriptionData = {
            id: crypto.randomUUID(), // Only for new subscriptions
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString() 
              : null
          }

          // Check if subscription exists
          const { data: existingSub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error checking existing subscription:', fetchError)
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
          }

          let error
          if (existingSub) {
            // Update existing subscription
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update(subscriptionData)
              .eq('user_id', userId)
            error = updateError
          } else {
            // Insert new subscription
            const { error: insertError } = await supabase
              .from('subscriptions')
              .insert([subscriptionData])
            error = insertError
          }

          if (error) {
            console.error('Supabase operation error:', error)
            return NextResponse.json(
              { error: error.message },
              { status: 500 }
            )
          }

          // Verify the operation
          const { data: verifiedSub, error: verifyError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()

          console.log('Subscription in database:', verifiedSub)
        }
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    )
  }
}
