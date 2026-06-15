import { createClient } from '@supabase/supabase-js';

// Fallbacks keep createClient from throwing at import time when an env var is
// missing — that would crash any page that imports this module (e.g. tracking).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client-side Supabase (uses anon key, respects Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase admin client (bypasses RLS – use only in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: { name: string; phone: string };
        Update: { name?: string; phone?: string };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          user_phone: string;
          items: string; // JSON string
          total_amount: number;
          delivery_charge: number;
          final_amount: number;
          delivery_address: string;
          delivery_lat: number | null;
          delivery_lng: number | null;
          status: string;
          estimated_delivery_minutes: number | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          user_name: string;
          user_phone: string;
          items: string;
          total_amount: number;
          delivery_charge: number;
          final_amount: number;
          delivery_address: string;
          delivery_lat?: number;
          delivery_lng?: number;
          status?: string;
        };
        Update: {
          status?: string;
          estimated_delivery_minutes?: number;
          rejection_reason?: string;
          updated_at?: string;
        };
      };
      otp_codes: {
        Row: {
          id: string;
          phone: string;
          code: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: { phone: string; code: string; expires_at: string };
        Update: { used?: boolean };
      };
    };
  };
};
