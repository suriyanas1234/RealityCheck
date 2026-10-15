import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage';
import { PrerequisitesPayload } from '@/types';

export function getSupabaseClient() {
  const settings = StorageService.getSettings();
  const config = settings.supabaseConfig;
  const url = config?.enabled && config?.url ? config.url : process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.enabled && config?.anonKey ? config.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      return createClient(url, anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function createCustomSupabaseClient(url: string, anonKey: string) {
  try {
    return createClient(url, anonKey);
  } catch (e) {
    console.error('Invalid Supabase configuration:', e);
    return null;
  }
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableReady?: boolean }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, message: 'URL must start with https://' };
    }

    const client = createClient(cleanUrl, cleanKey);
    // Attempt a light read to verify network & anon key validity
    const { error } = await client.from('reality_prerequisites').select('id').limit(1);

    if (!error) {
      return {
        success: true,
        tableReady: true,
        message: 'Successfully connected! Prerequisite schema table is active and verified.',
      };
    }

    // Code 42P01 means table does not exist yet, but credentials & network are 100% valid!
    if (error.code === '42P01' || error.message?.includes('relation "reality_prerequisites" does not exist')) {
      return {
        success: true,
        tableReady: false,
        message: 'Connected to Supabase! (Note: Run the SQL Schema in your Supabase editor to activate cloud tables).',
      };
    }

    return {
      success: false,
      message: error.message || 'Could not connect to Supabase. Check your URL and Key.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error testing Supabase connection';
    return { success: false, message };
  }
}

export async function savePrerequisitesToCloud(
  payload: PrerequisitesPayload,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || payload.supabaseConfig?.url || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || payload.supabaseConfig?.anonKey || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const recordId = payload.profile.email?.trim() || 'default_profile';
    const { error } = await client.from('reality_prerequisites').upsert({
      id: recordId,
      user_name: payload.profile.name,
      email: payload.profile.email || null,
      partner_name: payload.profile.partnerName,
      partner_cadence_days: payload.profile.partnerCadenceDays,
      partner_reminder_notes: payload.profile.partnerReminderNotes || null,
      mother_name: payload.profile.motherName,
      mother_cadence_days: payload.profile.motherCadenceDays,
      mother_reminder_notes: payload.profile.motherReminderNotes || null,
      schedule: payload.schedule,
      staples: payload.staples,
      chores: payload.chores,
      contacts: payload.contacts,
      settings: {
        militaryTime: payload.militaryTime,
        soundEnabled: payload.soundEnabled,
      },
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Table reality_prerequisites not found in Supabase. Please run the SQL schema in Supabase SQL editor first.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error saving to cloud';
    return { success: false, error: msg };
  }
}

export async function fetchPrerequisitesFromCloud(
  url: string,
  anonKey: string
): Promise<{ success: boolean; payload?: PrerequisitesPayload; error?: string }> {
  if (!url || !anonKey) {
    return { success: false, error: 'URL and Anon Key are required.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const { data, error } = await client
      .from('reality_prerequisites')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No prerequisite data found in this Supabase database.' };
    }

    const payload: PrerequisitesPayload = {
      profile: {
        name: data.user_name || 'Operator',
        email: data.email || '',
        partnerName: data.partner_name || 'Partner',
        partnerCadenceDays: data.partner_cadence_days || 14,
        partnerReminderNotes: data.partner_reminder_notes || '',
        motherName: data.mother_name || 'Mother',
        motherCadenceDays: data.mother_cadence_days || 3,
        motherReminderNotes: data.mother_reminder_notes || '',
        onboarded: true,
        onboardedAt: data.updated_at,
      },
      schedule: Array.isArray(data.schedule) ? data.schedule : [],
      staples: data.staples && typeof data.staples === 'object' ? data.staples : ({} as any),
      chores: Array.isArray(data.chores) ? data.chores : [],
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
      militaryTime: data.settings?.militaryTime ?? false,
      soundEnabled: data.settings?.soundEnabled ?? true,
      supabaseConfig: {
        enabled: true,
        url: url.trim(),
        anonKey: anonKey.trim(),
      },
    };

    return { success: true, payload };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error fetching from cloud';
    return { success: false, error: msg };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- RealityCheck Complete Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Prerequisites & User Profile Table (Permanent Anchor Storage)
CREATE TABLE IF NOT EXISTS reality_prerequisites (
  id TEXT PRIMARY KEY DEFAULT 'default_profile',
  user_name TEXT NOT NULL,
  email TEXT,
  partner_name TEXT,
  partner_cadence_days INT DEFAULT 14,
  partner_reminder_notes TEXT,
  mother_name TEXT,
  mother_cadence_days INT DEFAULT 3,
  mother_reminder_notes TEXT,
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  staples JSONB NOT NULL DEFAULT '{}'::jsonb,
  chores JSONB NOT NULL DEFAULT '[]'::jsonb,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Daily Execution Logs
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

-- Enable RLS and public access for personal use
ALTER TABLE reality_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on prerequisites" ON reality_prerequisites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meals" ON reality_meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chores" ON reality_chores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on gestures" ON reality_gestures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audits" ON reality_audits FOR ALL USING (true) WITH CHECK (true);
`;

