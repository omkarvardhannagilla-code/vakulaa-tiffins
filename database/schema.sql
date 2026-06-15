-- ============================================================
-- VAKULAA TIFFINS — Supabase Database Schema
-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste & Run
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT UNIQUE NOT NULL,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Safety: add email column if upgrading an existing project
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- ── OTP CODES table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_codes(expires_at);

-- ── ORDERS table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name                   TEXT NOT NULL,
  user_phone                  TEXT NOT NULL,
  items                       JSONB NOT NULL,   -- Array of PlateItem objects
  total_amount                NUMERIC(10,2) NOT NULL,
  delivery_charge             NUMERIC(10,2) NOT NULL DEFAULT 30,
  final_amount                NUMERIC(10,2) NOT NULL,
  delivery_address            TEXT NOT NULL,
  delivery_lat                DECIMAL(10,8),
  delivery_lng                DECIMAL(11,8),
  status                      TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending', 'accepted', 'preparing',
                                'out_for_delivery', 'delivered', 'rejected'
                              )),
  estimated_delivery_minutes  INTEGER,
  rejection_reason            TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id  ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone     ON public.orders(user_phone);

-- Auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- (Supabase RLS — using service role key bypasses these in API routes)

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;

-- Allow anon to read/write OTPs (handled by backend only)
-- In production, all these use the service_role key so RLS is bypassed

-- Public read for orders (needed for Realtime subscriptions by client)
CREATE POLICY "orders_realtime_read" ON public.orders
  FOR SELECT
  USING (true);  -- Row-level filtering is done in our API routes

-- ── REALTIME ──────────────────────────────────────────────────
-- Enable Realtime for live order updates
-- (Do this in Supabase Dashboard → Database → Replication → Add table)
-- Alternatively run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ── CLEANUP FUNCTION (optional cron) ──────────────────────────
-- Auto-delete expired OTP codes older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ── SAMPLE DATA (for testing) ─────────────────────────────────
-- Remove these in production!

INSERT INTO public.users (id, name, phone, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test User', '9876543210', 'test@example.com')
ON CONFLICT (phone) DO NOTHING;

-- ============================================================
-- SETUP COMPLETE!
-- 
-- Next steps:
-- 1. Copy your Supabase URL and anon/service keys to .env.local
-- 2. Enable Realtime for the orders table in the dashboard
-- 3. Run the app: npm run dev
-- ============================================================
