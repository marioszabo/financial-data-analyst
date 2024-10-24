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
  apiVersion: '2024-09-30.acacia', // Fixed the version string format
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

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1QDLFgHV58Ez6fBuBiIuGy70', // Your recurring price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId, // Add userId to subscription metadata
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
