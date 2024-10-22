import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with the secret key from environment variables
// Note: The '!' asserts that the environment variable is defined
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia', // Specify the Stripe API version to use
})

// POST handler for creating a Stripe checkout session
export async function POST(req: NextRequest) {
  // Extract the userId from the request body
  const { userId } = await req.json()

  // Create a new Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Allow card payments only
    line_items: [
      {
        price: 'price_1QCRefHV58Ez6fBugM64KfIx', // Specific price ID for the subscription
        quantity: 1, // One subscription per checkout
      },
    ],
    mode: 'subscription', // Set mode to subscription for recurring payments
    // Redirect URLs after successful payment or cancellation
    // Note: {CHECKOUT_SESSION_ID} is a placeholder that Stripe will replace
    success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/dashboard`,
    client_reference_id: userId, // Associate this session with the user
    customer_creation: 'always', // Create a new customer for each session
  })

  // Return the session ID to the client
  // This ID will be used to redirect the user to Stripe's checkout page
  return NextResponse.json({ sessionId: session.id })
}
