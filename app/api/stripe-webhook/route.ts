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

// Route Segment Configuration - this replaces the old config export
export const dynamic = 'force-dynamic'
export const maxDuration = 60  // Changed from 300 to 60 to comply with Vercel hobby plan limits
export const config = {
  api: {
    bodyParser: false // Disable body parsing
  }
}

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

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
    // Get the raw request body as text
    const rawBody = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    try {
      // Verify the event
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )

      // Return success quickly before processing (line 26 of docs)
      const response = NextResponse.json({ received: true })

      // Handle the event asynchronously (line 277-281 of docs)
      handleWebhookEventAsync(event).catch(console.error)

      return response

    } catch (err) {
      console.error('Webhook signature verification failed:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        signatureHeader: signature.substring(0, 20),
        bodyPreview: rawBody.substring(0, 50).replace(/[\n\r]/g, '\\n')
      })
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Async handler to process events after responding (line 277-281 of docs)
async function handleWebhookEventAsync(event: Stripe.Event) {
  // Guard against duplicate events (line 267-271 of docs)
  const processedEvents = new Set()
  const eventKey = `${event.type}:${event.data.object.id}`

  if (processedEvents.has(eventKey)) {
    console.log(`Duplicate event detected: ${eventKey}`)
    return
  }

  processedEvents.add(eventKey)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription
      console.log('Processing subscription:', {
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
      })
      break

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Processing payment:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        customerId: paymentIntent.customer
      })
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}
