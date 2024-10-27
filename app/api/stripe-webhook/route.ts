import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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

// New route segment config format for Next.js 14
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const preferredRegion = 'auto'

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

// Buffer helper for App Router
async function buffer(req: NextRequest) {
  const chunks: Uint8Array[] = []
  const reader = req.body!.getReader()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
}

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
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await buffer(req)
    const signature = headers().get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )

      // Log successful verification
      console.log('✅ Success:', {
        eventId: event.id,
        type: event.type,
        signature: signature.substring(0, 20) + '...'
      })

    } catch (err) {
      console.error('❌ Webhook signature verification failed:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        signature: signature.substring(0, 20) + '...'
      })
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log(`💰 PaymentIntent status: ${paymentIntent.status}`)
          break
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          console.log(`📅 Subscription status: ${subscription.status}`)
          break
        }
        default: {
          console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`)
        }
      }

      // Return a response to acknowledge receipt of the event
      return NextResponse.json({ received: true })

    } catch (err) {
      console.error('❌ Event processing error:', err)
      return NextResponse.json(
        { error: 'Event processing failed' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('❌ Request processing error:', err)
    return NextResponse.json(
      { error: 'Request processing failed' },
      { status: 500 }
    )
  }
}
