import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase-server'

// New config format for Next.js 14
export const runtime = 'edge'
export const preferredRegion = ['iad1'] // US East (N. Virginia)

// Forward webhook to microservice
async function forwardToService(payload: string, signature: string) {
  return fetch(process.env.WEBHOOK_SERVICE_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signature,
    },
    body: payload,
  })
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle event asynchronously
    handleWebhookEvent(event).catch(console.error)

    // Return success immediately
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 400 }
    )
  }
}

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('💰 Payment successful:', paymentIntent.id)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('📅 Subscription:', subscription.status)
      break
    }
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription
      const updatedUserId = updatedSubscription.metadata.userId

      if (updatedUserId) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: updatedSubscription.status,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
          })
          .match({ user_id: updatedUserId })

        if (updateError) {
          console.error('❌ Subscription update failed:', updateError)
        }
      }
      break
    default:
      console.log('📌 Unhandled event:', event.type)
  }
}

// Correct GET handler for App Router
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
