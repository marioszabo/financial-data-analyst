import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// App Router config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const preferredRegion = 'auto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

// Buffer helper adapted for App Router
async function buffer(req: NextRequest) {
  const chunks: Uint8Array[] = []
  const reader = req.body!.getReader()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
  } catch (e) {
    console.error('Buffer reading error:', e instanceof Error ? e.message : 'Unknown error')
    throw e
  }
}

export async function POST(req: NextRequest) {
  try {
    const sig = headers().get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!sig || !webhookSecret) {
      console.log('❌ Error: Missing signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      const body = await buffer(req)
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.log(`❌ Error message: ${errorMessage}`)
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      )
    }

    // Successfully constructed event
    console.log('✅ Success:', event.id)

    // Cast event data to Stripe object
    if (event.type === 'payment_intent.succeeded') {
      const stripeObject: Stripe.PaymentIntent = event.data
        .object as Stripe.PaymentIntent
      console.log(`💰 PaymentIntent status: ${stripeObject.status}`)
    } else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge
      console.log(`💵 Charge id: ${charge.id}`)
    } else if (event.type === 'customer.subscription.created' || 
               event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      console.log(`📅 Subscription status: ${subscription.status}`)
    } else {
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`)
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Request processing error:', errorMessage)
    return NextResponse.json(
      { error: 'Request processing failed' },
      { status: 500 }
    )
  }
}
