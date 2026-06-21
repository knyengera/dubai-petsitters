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
      ai_assistant_conversations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ai_assistant_messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
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
      advertising_plans: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      partner_subscriptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_availability: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      vet_subscriptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      reviews: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          avatar_url: string | null;
          phone: string | null;
          city: string | null;
          date_of_birth: string | null;
          gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
          id_type: "national_id" | "passport" | null;
          id_number: string | null;
          id_document_path: string | null;
          id_verification_status:
            | "pending"
            | "processing"
            | "requires_input"
            | "verified"
            | "canceled"
            | null;
          id_verified_at: string | null;
          stripe_verification_session_id: string | null;
          id_verification_error: string | null;
          profile_completed_at: string | null;
          phone_verified_at: string | null;
          terms_accepted_at: string | null;
          privacy_accepted_at: string | null;
          liability_waiver_accepted_at: string | null;
          legal_documents_version: string | null;
          signup_account_type: "client" | "host" | null;
          deactivated_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      identity_verification_sessions: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          stripe_session_id: string;
          status:
            | "pending"
            | "processing"
            | "requires_input"
            | "verified"
            | "canceled";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          stripe_session_id: string;
          status?: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          updated_at?: string;
        };
      };
      platform_fee_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      platform_auth_settings: {
        Row: {
          id: string;
          email_verification_enabled: boolean;
          phone_verification_enabled: boolean;
          google_oauth_enabled: boolean;
          apple_oauth_enabled: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          email_verification_enabled?: boolean;
          phone_verification_enabled?: boolean;
          google_oauth_enabled?: boolean;
          apple_oauth_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          email_verification_enabled?: boolean;
          phone_verification_enabled?: boolean;
          google_oauth_enabled?: boolean;
          apple_oauth_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      escrow_accounts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ledger_entries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_balances: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_payout_requests: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      host_payout_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      notification_preferences: {
        Row: {
          user_id: string;
          email_enabled: boolean;
          sms_enabled: boolean;
          booking_email: boolean;
          booking_sms: boolean;
          payment_email: boolean;
          payment_sms: boolean;
          message_email: boolean;
          message_sms: boolean;
          appointment_email: boolean;
          appointment_sms: boolean;
          reminder_email: boolean;
          reminder_sms: boolean;
          marketing_email: boolean;
          marketing_sms: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          booking_email?: boolean;
          booking_sms?: boolean;
          payment_email?: boolean;
          payment_sms?: boolean;
          message_email?: boolean;
          message_sms?: boolean;
          appointment_email?: boolean;
          appointment_sms?: boolean;
          reminder_email?: boolean;
          reminder_sms?: boolean;
          marketing_email?: boolean;
          marketing_sms?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email_enabled?: boolean;
          sms_enabled?: boolean;
          booking_email?: boolean;
          booking_sms?: boolean;
          payment_email?: boolean;
          payment_sms?: boolean;
          message_email?: boolean;
          message_sms?: boolean;
          appointment_email?: boolean;
          appointment_sms?: boolean;
          reminder_email?: boolean;
          reminder_sms?: boolean;
          marketing_email?: boolean;
          marketing_sms?: boolean;
          updated_at?: string;
        };
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          template_key: string;
          payload: Json;
          read_at: string | null;
          idempotency_key: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notification_outbox: {
        Row: {
          id: string;
          event_type: string;
          channel: string;
          recipient_user_id: string | null;
          recipient_email: string | null;
          recipient_phone: string | null;
          template_key: string;
          payload: Json;
          idempotency_key: string;
          status: string;
          attempts: number;
          last_error: string | null;
          provider_ref: string | null;
          scheduled_for: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          event_type: string;
          channel: string;
          template_key: string;
          idempotency_key: string;
          payload?: Json;
          recipient_user_id?: string | null;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          status?: string;
          scheduled_for?: string;
        };
        Update: {
          status?: string;
          attempts?: number;
          last_error?: string | null;
          provider_ref?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
        };
      };
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
      enqueue_notification: {
        Args: {
          p_event_type: string;
          p_channel: string;
          p_template_key: string;
          p_idempotency_key: string;
          p_payload?: Json;
          p_recipient_user_id?: string | null;
          p_recipient_email?: string | null;
          p_recipient_phone?: string | null;
          p_scheduled_for?: string;
        };
        Returns: string | null;
      };
      notification_enqueue_pet_health_reminders: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_auth_verification_settings: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["platform_auth_settings"]["Row"];
      };
    };
    Enums: Record<string, never>;
  };
}
