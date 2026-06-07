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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
