import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// New way to configure route segments in App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize Supabase client for Node.js environment
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook endpoint handler for Stripe events
 * Verifies webhook signatures and processes various subscription events
 * Implements async event processing to minimize webhook timeout risks
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    // Add these debug logs
    console.log('Webhook Debug:', {
      secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 6),
      secretLength: process.env.STRIPE_WEBHOOK_SECRET?.length,
      sigPrefix: sig.slice(0, 6),
      sigLength: sig.length
    })

    // Use standard constructEvent for Node.js runtime
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Process event synchronously in Node.js environment
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 400 }
    )
  }
}

/**
 * Main webhook event processor
 * Handles various Stripe subscription lifecycle events:
 * - Subscription creation
 * - Subscription updates
 * - Subscription cancellation
 * - Payment failures
 * 
 * Updates Supabase database to maintain subscription state
 * @param event - Verified Stripe webhook event
 */
async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('💰 Payment successful:', paymentIntent.id)
      break
    }

    case 'customer.subscription.created': {
      // Handle new subscription creation
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      if (userId) {
        // Create or update subscription record in Supabase
        // Includes all relevant subscription data and timestamps
        const { error: createError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
            // Handle optional cancellation dates
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString() 
              : null,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })

        if (createError) {
          console.error('❌ Subscription creation failed:', createError)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      console.log('📅 Subscription updated:', subscription.status)

      if (userId) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .match({ user_id: userId })

        if (updateError) {
          console.error('❌ Subscription update failed:', updateError)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      if (userId) {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .match({ user_id: userId })

        if (deleteError) {
          console.error('❌ Subscription deletion failed:', deleteError)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscription = invoice.subscription as string
      const customerId = invoice.customer as string
      
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subData?.user_id) {
        const paymentIntent = typeof invoice.payment_intent === 'string' 
          ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
          : invoice.payment_intent

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            payment_error: paymentIntent?.last_payment_error?.message,
          })
          .match({ user_id: subData.user_id })

        if (updateError) {
          console.error('❌ Payment failure update failed:', updateError)
        }
      }
      break
    }
    default:
      console.log('📌 Unhandled event:', event.type)
  }
}

/**
 * GET method handler - blocks unauthorized access
 * Stripe webhooks should only use POST
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
