import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

/**
 * Merges class names using clsx and tailwind-merge.
 * This function is useful for combining Tailwind CSS classes dynamically
 * while avoiding conflicts and optimizing the final class string.
 *
 * @param inputs - An array of class values (strings, objects, or arrays)
 * @returns A merged and optimized class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a user's subscription is active.
 * This function queries the 'subscriptions' table in Supabase to determine
 * if the user has an active subscription that hasn't expired.
 *
 * @param userId - The ID of the user to check
 * @returns A promise that resolves to a boolean indicating if the subscription is active
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  // Query the subscriptions table for the given user
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .single()

  // Handle any errors that occur during the query
  if (error) {
    console.error('Error checking subscription:', error)
    return false
  }

  // If no data is returned, assume the subscription is not active
  if (!data) return false

  // Check if the subscription is active and not expired
  const isActive = data.status === 'active' && new Date(data.current_period_end) > new Date()
  return isActive
}
