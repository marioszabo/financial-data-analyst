import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

/**
* Stripe Webhook Handler
* 
* Processes subscription events from Stripe and updates Supabase database.
* Uses Edge runtime for improved performance and reliability.
* 
* Security considerations:
* - Validates webhook signatures
* - Handles race conditions in subscription updates
* - Provides detailed error logging
* 
* Required environment variables:
* - STRIPE_SECRET_KEY
* - STRIPE_WEBHOOK_SECRET
*/

// This tells Next.js to use the Edge runtime for this route
export const runtime = 'edge'

// Initialize Stripe with version lock for API stability
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: '2024-09-30.acacia',
})

/**
* Webhook Event Handler
* 
* Processes Stripe subscription events and syncs with Supabase.
* Currently handles:
* - customer.subscription.created
* 
* Future events to consider:
* - customer.subscription.updated
* - customer.subscription.deleted
* - payment_intent.succeeded
*/
export async function POST(req: NextRequest) {
const body = await req.text()
const sig = req.headers.get('stripe-signature') as string

let event: Stripe.Event

try {
event = await stripe.webhooks.constructEventAsync(
body,
sig,
process.env.STRIPE_WEBHOOK_SECRET!
)
} catch (err: any) {
console.error('🚨 Webhook signature verification failed:', err.message)
return NextResponse.json(
{ error: `Webhook Error: ${err.message}` },
{ status: 400 }
)
}

try {
switch (event.type) {
case 'customer.subscription.created':
case 'customer.subscription.updated':
const subscription = event.data.object as Stripe.Subscription
const userId = subscription.metadata.userId

if (!userId) {
console.error('No user ID found in webhook')
return NextResponse.json(
{ error: 'No user ID found' },
{ status: 400 }
)
}

console.log('Processing subscription for user:', userId)

const { error: subscriptionError } = await supabase
.from('subscriptions')
.upsert({
user_id: userId,
stripe_subscription_id: subscription.id,
stripe_customer_id: subscription.customer as string,
status: subscription.status,
price_id: subscription.items.data[0].price.id,
current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
})

if (subscriptionError) {
console.error('❌ Subscription update failed:', subscriptionError)
return NextResponse.json(
{ error: 'Failed to update subscription' },
{ status: 400 }
)
}

console.log('✅ Subscription updated successfully')
break

case 'customer.subscription.deleted':
const canceledSubscription = event.data.object as Stripe.Subscription
const canceledUserId = canceledSubscription.metadata.userId

if (canceledUserId) {
const { error: cancelError } = await supabase
.from('subscriptions')
.update({ status: 'canceled' })
.match({ user_id: canceledUserId })

if (cancelError) {
console.error('❌ Subscription cancellation failed:', cancelError)
}
}
break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({ 
            status: updatedSubscription.status,
            // Update other relevant fields
          })
          .eq('stripe_subscription_id', updatedSubscription.id);
        break
}

return NextResponse.json({ received: true })
} catch (error) {
console.error('Webhook processing error:', error)
return NextResponse.json(
{ error: 'Webhook processing failed' },
{ status: 500 }
)
}
}