import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * Stripe Checkout Session Creation Handler
 * 
 * Creates a new Stripe checkout session for subscription purchases.
 * This endpoint handles the initial payment flow and subscription setup.
 * 
 * Key features:
 * - Single subscription per checkout
 * - Card-only payment method
 * - Automatic customer creation
 * - User tracking via metadata
 * - Promotion code support
 * 
 * Security measures:
 * - Requires valid user ID
 * - Uses server-side session creation
 * - Environment variable validation
 * - Error handling and logging
 * 
 * Flow:
 * 1. Validate user ID from request
 * 2. Create Stripe checkout session
 * 3. Return session ID for client-side redirect
 * 4. Webhook handles post-payment processing
 */

// Initialize Stripe with API version lock for stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
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
  // Extract and validate user ID from request body
  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Create Stripe checkout session with subscription configuration
    const session = await stripe.checkout.sessions.create({
      // Limit payment methods to cards for simplicity and reliability
      payment_method_types: ['card'],
      
      // Configure subscription product with fixed price
      line_items: [
        {
          price: 'price_1QDLFgHV58Ez6fBuBiIuGy70', // Monthly subscription price ID
          quantity: 1,
        },
      ],
      
      // Set mode to subscription for recurring billing
      mode: 'subscription',
      
      // Define redirect URLs for success/failure
      // Uses origin header to support multiple environments
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      
      // Add user tracking to both session and subscription
      metadata: {
        userId: userId, // Used for webhook processing
      },
      subscription_data: {
        metadata: {
          userId: userId, // Enables user identification in webhook events
        },
      },
      
      // Enable promotion codes for marketing campaigns
      allow_promotion_codes: true,
    })

    // Return session ID for client-side redirect to Stripe Checkout
    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    // Log error for debugging and monitoring
    console.error('Stripe session creation error:', error)
    
    // Return generic error to client for security
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
