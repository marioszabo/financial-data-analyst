import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

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
  const supabase = createServerComponentClient<Database>({ cookies })
  
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('💰 Payment successful:', paymentIntent.id)
      break
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      if (userId) {
        const { error: createError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString() 
              : null,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })

        if (createError) {
          console.error('❌ Subscription creation failed:', createError)
        }
      }
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      console.log('📅 Subscription updated:', subscription.status)

      if (userId) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .match({ user_id: userId })

        if (updateError) {
          console.error('❌ Subscription update failed:', updateError)
        }
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      
      if (userId) {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .match({ user_id: userId })

        if (deleteError) {
          console.error('❌ Subscription deletion failed:', deleteError)
        }
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscription = invoice.subscription as string
      const customerId = invoice.customer as string
      
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subData?.user_id) {
        const paymentIntent = typeof invoice.payment_intent === 'string' 
          ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
          : invoice.payment_intent

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            payment_error: paymentIntent?.last_payment_error?.message,
          })
          .match({ user_id: subData.user_id })

        if (updateError) {
          console.error('❌ Payment failure update failed:', updateError)
        }
      }
      break
    }
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
