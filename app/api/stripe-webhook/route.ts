import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// Use Edge runtime for improved performance and reduced cold starts
export const runtime = 'edge'

// Initialize Stripe with the secret key and specify API version
// Note: Using non-null assertion (!) assumes the env variable is always set
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
})

// Handle POST requests for Stripe webhook events
export async function POST(req: NextRequest) {
  // Extract the raw body and Stripe signature from the request
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    // Verify and construct the Stripe event
    // This step ensures the webhook is genuinely from Stripe
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    // If verification fails, return an error response
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the 'customer.subscription.created' event
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    // Fetch the user associated with this Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    // If user is not found or there's an error, log and return an error response
    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Update the subscriptions table in Supabase with the new subscription data
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userData.id,
        status: subscription.status,
        // Use the price nickname as the plan type, or 'default' if not available
        plan_type: subscription.items.data[0].price.nickname || 'default',
        // Convert Unix timestamps to ISO strings for database storage
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })

    // If there's an error updating the subscription, log and return an error response
    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 400 })
    }

    // Return a success response if everything went well
    return NextResponse.json({ received: true })
  }

  // For all other event types, acknowledge receipt without taking action
  return NextResponse.json({ received: true })
}
