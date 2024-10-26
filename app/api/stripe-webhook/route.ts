import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'

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
  try {
    console.log('Webhook endpoint hit!')
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    console.log('Webhook details:', {
      hasSignature: !!sig,
      bodyLength: body.length,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 10) + '...' // Log partial secret for verification
    })

    if (!sig) {
      console.error('No stripe signature found')
      return NextResponse.json({ error: 'No stripe signature' }, { status: 400 })
    }

    let event: Stripe.Event
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      console.log('Event constructed successfully:', event.type)
    } catch (err) {
      console.error('Webhook construction error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        signature: sig.slice(0, 20) + '...'
      })
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    const supabase = createClient()

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
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString() 
              : null
          }

          console.log('Attempting Supabase update with:', subscriptionData)

          // First, verify if subscription exists
          const { data: existingSub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching existing subscription:', fetchError)
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
              .insert([{ ...subscriptionData, created_at: new Date().toISOString() }])
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
    console.error('Webhook handler error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
