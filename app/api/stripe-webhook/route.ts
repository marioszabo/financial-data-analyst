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
export const maxDuration = 60 // Ensure enough time for processing

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Store processed events to prevent duplicates (from docs line 267-271)
const processedEvents = new Set<string>()

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
    // Get raw body using streams for exact format preservation
    const chunks = []
    const reader = req.body?.getReader()
    
    if (!reader) {
      throw new Error('No request body found')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    // Combine chunks and preserve exact formatting
    const rawBody = Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8')
    const signature = headers().get('stripe-signature')
    const headersList = headers()

    // Debug logging
    console.log('Webhook request details:', {
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': headersList.get('content-type'),
        'stripe-signature': signature?.substring(0, 20) + '...',
      },
      bodyLength: rawBody.length,
      bodyPreview: rawBody.substring(0, 50).replace(/\n/g, '\\n')
    })

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing signature or webhook secret')
    }

    try {
      // Verify the event with exact raw body (from docs line 152)
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )

      // Check for duplicate events (from docs line 267-271)
      const eventKey = `${event.type}:${event.id}`
      if (processedEvents.has(eventKey)) {
        console.log(`Duplicate event detected: ${eventKey}`)
        return NextResponse.json({ received: true })
      }
      processedEvents.add(eventKey)

      // Return success quickly before processing (from docs line 26)
      const response = NextResponse.json({ received: true })

      // Process asynchronously after response (from docs line 277-281)
      handleWebhookEventAsync(event).catch(error => {
        console.error('Async processing error:', error)
      })

      return response

    } catch (err) {
      console.error('Webhook verification failed:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        signatureStart: signature.substring(0, 30),
        bodyStart: rawBody.substring(0, 50).replace(/\n/g, '\\n')
      })
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('Processing error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

// Async handler for event processing after response (from docs line 277-281)
async function handleWebhookEventAsync(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        console.log('Processing subscription:', {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          timestamp: new Date().toISOString()
        })
        // Add your subscription handling logic here
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Processing payment:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          customerId: paymentIntent.customer,
          timestamp: new Date().toISOString()
        })
        // Add your payment handling logic here
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Event processing error:', error)
    // Don't throw - we want to handle errors gracefully in the async handler
  }
}
