-- RealityCheck Cloud Sync Schema
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Profiles (mirrors local user_profile)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meals
CREATE TABLE IF NOT EXISTS public.meals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  staple_id TEXT,
  custom_meal_name TEXT,
  scheduled_window TEXT,
  is_outlier BOOLEAN NOT NULL DEFAULT false,
  outlier_reason TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initiative Ledger
CREATE TABLE IF NOT EXISTS public.initiative_ledger (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  scheduled_date DATE,
  is_reactive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Audits
CREATE TABLE IF NOT EXISTS public.daily_audits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals_adhered BOOLEAN NOT NULL DEFAULT false,
  chores_executed BOOLEAN NOT NULL DEFAULT false,
  composure_maintained BOOLEAN NOT NULL DEFAULT false,
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own meals" ON public.meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own initiative ledger" ON public.initiative_ledger
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own daily audits" ON public.daily_audits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for sync queries
CREATE INDEX IF NOT EXISTS idx_meals_user_updated ON public.meals (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_initiative_user_updated ON public.initiative_ledger (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_audits_user_updated ON public.daily_audits (user_id, updated_at);
