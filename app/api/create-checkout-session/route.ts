import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia', // Update this line
})

export async function POST(req: NextRequest) {
  const { userId } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_1QCRefHV58Ez6fBugM64KfIx', // Your actual price ID
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/dashboard`,
    client_reference_id: userId,
    customer_creation: 'always',
  })

  return NextResponse.json({ sessionId: session.id })
}
