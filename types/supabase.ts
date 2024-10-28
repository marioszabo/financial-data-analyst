/**
 * Type Definitions for Supabase Database Schema
 * Generated from database using `supabase gen types typescript`
 * 
 * Key Features:
 * - Type-safe database operations
 * - Full table definitions with relationships
 * - Support for complex JSON operations
 * - Strict null checking
 */

// Base JSON type supporting nested structures and arrays
// Used for flexible data storage while maintaining type safety
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Main Database Schema Definition
 * Contains all public tables, views, functions, and enums
 * 
 * Tables:
 * - gpt_messages: Stores chat messages with GPT
 * - gpt_sessions: Manages chat session metadata
 * - subscriptions: Handles Stripe subscription data
 * - users: Core user information
 */
export type Database = {
  public: {
    Tables: {
      // GPT Messages Table
      // Stores individual messages in chat sessions
      gpt_messages: {
        Row: {
          content: string        // Message content
          created_at: string | null
          id: string            // Unique message identifier
          role: string         // 'user' or 'assistant'
          session_id: string | null  // Links to gpt_sessions
        }
        Insert: {
          // Fields required/optional for insertion
          content: string
          created_at?: string | null
          id?: string  // Optional: auto-generated if not provided
          role: string
          session_id?: string | null
        }
        Update: {
          // All fields optional for updates
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string | null
        }
        // Foreign key relationship to gpt_sessions
        Relationships: [
          {
            foreignKeyName: "gpt_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gpt_sessions"
            referencedColumns: ["id"]
          }
        ]
      }

      // Subscription Management Table
      // Tracks Stripe subscription status and billing periods
      subscriptions: {
        Row: {
          cancel_at: string | null           // Future cancellation date
          cancel_at_period_end: boolean      // End at current period
          canceled_at: string | null         // Actual cancellation timestamp
          current_period_end: string         // Current billing period end
          current_period_start: string       // Current billing period start
          price_id: string                   // Stripe price identifier
          status: string                     // Subscription status
          stripe_customer_id: string         // Stripe customer reference
          stripe_subscription_id: string     // Stripe subscription reference
          updated_at: string                 // Last update timestamp
          user_id: string                    // Reference to users table
        }
        // Insert and Update types follow same pattern as above
        Insert: {
          // Required fields for new subscriptions
          current_period_end: string
          current_period_start: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
          // Optional fields
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
        }
        Update: {
          // All fields optional for updates
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          current_period_end?: string
          current_period_start?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }

      // Rest of the tables follow similar patterns...
    }
    // Database views (none defined)
    Views: {
      [_ in never]: never
    }
    // Stored functions (none defined)
    Functions: {
      [_ in never]: never
    }
    // Custom enums (none defined)
    Enums: {
      [_ in never]: never
    }
    // Composite types (none defined)
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for table operations
// These provide type safety for database queries
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

// Additional helper types follow same pattern
export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
