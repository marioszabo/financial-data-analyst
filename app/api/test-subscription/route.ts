import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get subscription data
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      console.error('Subscription query error:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    // Return detailed subscription info for debugging
    return NextResponse.json({
      subscription,
      isActive: subscription?.status === 'active' && 
                new Date(subscription.current_period_end) > new Date(),
      currentTime: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
