import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

export function getSupabaseClient() {
  const settings = StorageService.getSettings();
  if (settings.supabaseConfig?.enabled && settings.supabaseConfig.url && settings.supabaseConfig.anonKey) {
    try {
      return createClient(settings.supabaseConfig.url, settings.supabaseConfig.anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export const SUPABASE_SQL_SCHEMA = `-- RealityCheck Database Schema
-- Run this in your Supabase SQL Editor to enable cloud sync

CREATE TABLE IF NOT EXISTS reality_meals (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  staple_id TEXT,
  custom_meal_name TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reality_chores (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slot TEXT NOT NULL,
  estimated_seconds INT DEFAULT 60,
  completed_dates JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS reality_gestures (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gesture_type TEXT NOT NULL,
  details TEXT,
  was_prompted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS reality_audits (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  adhered_to_meal_schedule BOOLEAN NOT NULL,
  completed_chores_unprompted BOOLEAN NOT NULL,
  maintained_composure BOOLEAN NOT NULL,
  objective_observation TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (optional / customize as needed)
ALTER TABLE reality_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_audits ENABLE ROW LEVEL SECURITY;
`;
