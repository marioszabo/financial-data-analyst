import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET() {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get subscription data with full details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      return NextResponse.json({ 
        error: 'Subscription query error',
        details: subError
      }, { status: 500 })
    }

    // Return detailed debug information
    return NextResponse.json({
      subscription,
      debug: {
        userId: user.id,
        hasSubscription: !!subscription,
        status: subscription?.status,
        periodEnd: subscription?.current_period_end,
        currentTime: new Date().toISOString(),
        isActive: subscription?.status === 'active' && 
                 new Date(subscription.current_period_end) > new Date()
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
