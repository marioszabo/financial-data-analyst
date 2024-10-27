import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Configure as Edge Function
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Keep webhook handler in one region
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
})

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
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Try local processing first
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      
      // Process locally
      handleWebhookEvent(event).catch(console.error)
      
    } catch (err) {
      // If local processing fails, forward to microservice
      console.log('Forwarding to microservice...')
      await forwardToService(payload, sig)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}

// Correct GET handler for App Router
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
