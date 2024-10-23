import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

/**
 * Utility function for merging Tailwind CSS classes
 * 
 * Combines clsx and tailwind-merge to:
 * - Handle conditional classes
 * - Resolve conflicting Tailwind classes
 * - Maintain proper order of utility classes
 * - Support dynamic class generation
 * 
 * Example usage:
 * cn('px-2 py-1', isActive && 'bg-blue-500', ['hover:bg-blue-600'])
 *
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Optimized class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Subscription Status Checker
 * 
 * Verifies if a user has an active subscription by:
 * 1. Querying the subscriptions table
 * 2. Checking subscription status
 * 3. Validating expiration date
 * 
 * Edge cases handled:
 * - Missing subscription record
 * - Database query errors
 * - Expired subscriptions
 * - Invalid status values
 *
 * @param userId - Supabase user ID to check
 * @returns Promise<boolean> - true if subscription is active and valid
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  // Query subscription data with error handling
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .single()

  // Return false for any database errors to prevent unauthorized access
  if (error) {
    console.error('Error checking subscription:', error)
    return false
  }

  // No subscription record found
  if (!data) return false

  // Verify both active status and non-expired period
  const isActive = data.status === 'active' && new Date(data.current_period_end) > new Date()
  return isActive
}
