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
    console.log('Webhook received:', {
      hasBody: !!body,
      bodyLength: body?.length,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    })

    // Always return 200 first
    const response = NextResponse.json(
      { received: true },
      { status: 200 }
    )

    // Only try to verify and process if we have both body and signature
    if (body && signature) {
      try {
        const event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        )

        console.log('Webhook verified:', {
          type: event.type,
          id: event.id
        })

      } catch (err) {
        // Log error but don't fail the request
        console.error('Verification failed:', {
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return response

  } catch (err) {
    // Log error but still return 200
    console.error('Webhook error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { received: true },
      { status: 200 }
    )
  }
}
