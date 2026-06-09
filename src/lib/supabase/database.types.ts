export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      pet_hosts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      user_pets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      vet_clinics: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      hosting_bookings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      appointments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      conversations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_threads: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_comments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_boards: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_topics: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_replies: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_reactions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_reports: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_subscriptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_bookmarks: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_read_state: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      forum_user_stats: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      blog_posts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      blog_comments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      lost_pets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      medical_records: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      vaccinations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      adoption_requests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      payments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      partner_deals: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      partner_inquiries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_availability: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      vet_subscriptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      reviews: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      platform_fee_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      escrow_accounts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ledger_entries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_balances: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_payout_requests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: {
      monetisation_quote_booking: {
        Args: {
          p_host_id: string;
          p_service_type: string;
          p_start_date: string;
          p_end_date?: string | null;
          p_currency?: string;
        };
        Returns: Json;
      };
      monetisation_create_hosting_booking: {
        Args: {
          p_host_id: string;
          p_service_type: string;
          p_start_date: string;
          p_end_date?: string | null;
          p_pet_name: string;
          p_pet_type: string;
          p_owner_name: string;
          p_owner_email: string;
          p_owner_phone?: string | null;
          p_city?: string | null;
          p_special_instructions?: string | null;
          p_payment_provider?: string;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      monetisation_capture_booking_payment: {
        Args: {
          p_booking_id: string;
          p_provider_payment_id?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      monetisation_mark_booking_completed: {
        Args: { p_booking_id: string };
        Returns: Json;
      };
      monetisation_release_escrow: {
        Args: { p_booking_id: string };
        Returns: Json;
      };
      monetisation_request_host_payout: {
        Args: {
          p_host_id: string;
          p_gross_amount: number;
          p_payment_provider?: string;
          p_notes?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      monetisation_admin_update_payout_status: {
        Args: {
          p_payout_id: string;
          p_status: string;
          p_admin_notes?: string | null;
          p_provider_payout_id?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}
