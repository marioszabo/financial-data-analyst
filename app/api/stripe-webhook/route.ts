import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// This tells Next.js to use the Edge runtime for this route
export const runtime = 'edge'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    // Fetch the user associated with this Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Update the subscriptions table
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userData.id,
        status: subscription.status,
        plan_type: subscription.items.data[0].price.nickname || 'default',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 400 })
    }

    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
