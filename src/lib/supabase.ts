import { createClient } from '@supabase/supabase-js';
import { StorageService, DEFAULT_USER_PROFILE } from './storage';
import {
  PrerequisitesPayload,
  CloudProfile,
  ExecutionLogPayload,
  ExecutionLogType,
  InitiativeLedgerEntry,
  DailyAuditRecordCloud,
  MealRecordCloud,
  UserProfileRecord,
} from '@/types';

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
        ...DEFAULT_USER_PROFILE,
        name: data.user_name || 'Operator',
        email: data.email || '',
        partnerName: data.partner_name || 'Partner',
        partnerCadenceDays: data.partner_cadence_days || 14,
        partnerReminderNotes: data.partner_reminder_notes || '',
        motherName: data.mother_name || 'Mother',
        motherCadenceDays: data.mother_cadence_days || 3,
        motherReminderNotes: data.mother_reminder_notes || '',
        onboarded: true,
        onboardingCompleted: true,
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

export async function upsertCloudProfile(
  userId: string,
  profile: Omit<CloudProfile, 'id' | 'updated_at'>,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const { error } = await client.from('profiles').upsert({
      id: userId,
      schedule: profile.schedule,
      meal_staples: profile.meal_staples,
      targets: profile.targets,
      is_onboarded: profile.is_onboarded,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Table profiles not found. Run the SQL schema in Supabase SQL editor first.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error upserting cloud profile';
    return { success: false, error: msg };
  }
}

export async function fetchCloudProfile(
  userId: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; profile?: CloudProfile; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No cloud profile found for this user.' };
    }

    return { success: true, profile: data as CloudProfile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error fetching cloud profile';
    return { success: false, error: msg };
  }
}

export async function pushExecutionLogs(
  logs: ExecutionLogPayload[],
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  if (!logs.length) return { success: true };

  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const { error } = await client.from('execution_logs').upsert(logs, {
      onConflict: 'id',
    });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Table execution_logs not found. Run the SQL schema in Supabase SQL editor first.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error pushing execution logs';
    return { success: false, error: msg };
  }
}

export async function fetchExecutionLogs(
  userId: string,
  type?: ExecutionLogType,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; logs?: ExecutionLogPayload[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    let query = client
      .from('execution_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, logs: (data || []) as ExecutionLogPayload[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error fetching execution logs';
    return { success: false, error: msg };
  }
}

// ============================================================
// Cloud Sync Engine — Push/Pull helpers for the new schema
// ============================================================

export async function upsertUserProfileRecord(
  record: UserProfileRecord,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { error } = await client.from('profiles').upsert({
      id: record.id,
      user_id: record.user_id || null,
      data: record.data,
      updated_at: record.updated_at,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function upsertMealRecords(
  records: MealRecordCloud[],
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  if (!records.length) return { success: true };
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { error } = await client.from('meals').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        date: r.date,
        meal_type: r.meal_type,
        staple_id: r.staple_id || null,
        custom_meal_name: r.custom_meal_name || null,
        scheduled_window: r.scheduled_window || null,
        is_outlier: r.is_outlier,
        outlier_reason: r.outlier_reason || null,
        logged_at: r.logged_at,
        updated_at: r.updated_at,
      }))
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function upsertInitiativeLedger(
  records: InitiativeLedgerEntry[],
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  if (!records.length) return { success: true };
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { error } = await client.from('initiative_ledger').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        recipient: r.recipient,
        recipient_name: r.recipient_name,
        action_type: r.action_type,
        description: r.description,
        details: r.details || null,
        scheduled_date: r.scheduled_date || null,
        is_reactive: r.is_reactive,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }))
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function upsertDailyAudits(
  records: DailyAuditRecordCloud[],
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; error?: string }> {
  if (!records.length) return { success: true };
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { error } = await client.from('daily_audits').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        date: r.date,
        meals_adhered: r.meals_adhered,
        chores_executed: r.chores_executed,
        composure_maintained: r.composure_maintained,
        observation: r.observation || null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }))
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchMealsSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: MealRecordCloud[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { data, error } = await client
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as MealRecordCloud[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchInitiativeLedgerSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: InitiativeLedgerEntry[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { data, error } = await client
      .from('initiative_ledger')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as InitiativeLedgerEntry[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchDailyAuditsSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: DailyAuditRecordCloud[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };

  try {
    const { data, error } = await client
      .from('daily_audits')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as DailyAuditRecordCloud[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
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

-- ============================================================
-- 3. Cloud Sync Engine Tables (auth-scoped, RLS enforced)
-- ============================================================

-- Profiles Table (Stores user onboarding schedule & preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL DEFAULT '{"wakeTime":"08:00","breakfastTime":"08:30","lunchTime":"13:00","dinnerTime":"18:30","nightResetTime":"22:30"}',
  meal_staples JSONB NOT NULL DEFAULT '{"staple1":"Rice, Dal, Yogurt","staple2":"3 Eggs, Toast, Fruit","staple3":"Curd Rice"}',
  targets JSONB NOT NULL DEFAULT '{"relationships":["Mother","Partner"],"dailyChores":["Sink Clear","Kitchen Counters","Desk Reset"]}',
  is_onboarded BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Execution Logs Table (Stores offline/online activity entries)
CREATE TABLE IF NOT EXISTS public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meal', 'chore', 'initiative', 'audit')),
  title TEXT NOT NULL,
  is_unprompted BOOLEAN DEFAULT true,
  is_outlier BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own execution logs" ON public.execution_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. Cloud Sync Engine Tables (auth-scoped, RLS enforced)
-- ============================================================

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
`;

