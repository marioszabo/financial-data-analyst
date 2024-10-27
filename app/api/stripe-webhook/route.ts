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

export async function POST(request: NextRequest) {
  try {
    // Request Body.
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    let event: Stripe.Event

    // Verify the webhook signature
    try {
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!stripeWebhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not set')
      }

      const sig = headers().get('stripe-signature')
      if (!sig) {
        throw new Error('Stripe Signature missing')
      }

      event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret)
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error')
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    const webhookResponse = await handleStripeWebhook(event)
    
    return NextResponse.json(
      webhookResponse?.body || { received: true },
      { status: webhookResponse?.status || 200 }
    )
  } catch (error) {
    console.error('Error in Stripe webhook handler:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed.' },
      { status: 500 }
    )
  }
}

// Correct GET handler for App Router
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
