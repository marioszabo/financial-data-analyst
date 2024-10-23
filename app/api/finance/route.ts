import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * Stripe Payment Integration Route
 * 
 * Handles subscription checkout session creation with Stripe.
 * Requires environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * 
 * Security considerations:
 * - Only expose necessary product/price IDs
 * - Validate user authentication before checkout
 * - Use webhook validation for post-payment processing
 */

// Initialize Stripe with type-safe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09.30.acacia', // Lock API version for stability
})

/**
 * POST Handler for Stripe Checkout Session Creation
 * 
 * Creates a new checkout session for subscription purchase.
 * Features:
 * - Single subscription per checkout
 * - Card-only payments
 * - Automatic customer creation
 * - User tracking via client_reference_id
 * 
 * @param req - Contains userId and origin URL
 * @returns Checkout session ID for client-side redirect
 */
export async function POST(req: NextRequest) {
  const { userId } = await req.json()

  // Create checkout session with subscription configuration
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_1QCRefHV58Ez6fBugM64KfIx', // Fixed price ID for subscription
        quantity: 1,
      },
    ],
    mode: 'subscription',
    
    // Dynamic success/cancel URLs based on request origin
    // {CHECKOUT_SESSION_ID} is replaced by Stripe for session tracking
    success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/dashboard`,
    
    // Link session to user for webhook processing
    client_reference_id: userId,
    
    // Create new customer to track subscription
    customer_creation: 'always',
  })

  // Return session ID for client-side redirect to Stripe Checkout
  return NextResponse.json({ sessionId: session.id })
}
