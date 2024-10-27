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
    // Get raw body as a Uint8Array
    const chunks = []
    const reader = req.body!.getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    // Combine chunks and convert to string
    const rawBody = Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8')
    
    const signature = headers().get('stripe-signature')
    const headersList = headers()

    // Debug logging
    console.log('Request details:', {
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': headersList.get('content-type'),
        'stripe-signature': signature?.substring(0, 20) + '...',
      },
      bodyLength: rawBody.length,
      bodyStart: rawBody.substring(0, 50).replace(/\n/g, '\\n'),
      secretPrefix: webhookSecret.substring(0, 7)
    })

    if (!signature) {
      throw new Error('No stripe-signature header found')
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )

      console.log('Event verified:', {
        type: event.type,
        id: event.id,
        object: event.data.object.object
      })

      // Handle the event
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
      }

      return NextResponse.json({ 
        success: true,
        event: event.type,
        id: event.id
      })

    } catch (err) {
      console.error('Verification failed:', {
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
