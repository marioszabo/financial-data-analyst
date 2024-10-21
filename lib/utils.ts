import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error checking subscription:', error)
    return false
  }

  if (!data) return false

  const isActive = data.status === 'active' && new Date(data.current_period_end) > new Date()
  return isActive
}
