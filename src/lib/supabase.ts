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
  PushupLogRecord,
  GymSessionRecord,
  ChoreRecordCloud,
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
    // Light read against the profiles table (created by 001_init.sql)
    const { error } = await client.from('profiles').select('id').limit(1);

    if (!error) {
      return {
        success: true,
        tableReady: true,
        message: 'Successfully connected! Profiles schema table is active and verified.',
      };
    }

    // 42P01 means the table does not exist yet, but credentials & network are valid.
    if (error.code === '42P01' || error.message?.includes('relation "profiles" does not exist')) {
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
  userId: string,
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
    const id = userId || payload.profile.email?.trim() || 'default_profile';
    const { error } = await client.from('profiles').upsert({
      id,
      user_id: userId || null,
      data: payload,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Table profiles not found in Supabase. Run the SQL schema (001_init.sql) in the Supabase SQL editor first.',
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
  userId: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; payload?: PrerequisitesPayload; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'Supabase URL and Anon Key are required.' };
  }

  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) {
    return { success: false, error: 'Could not initialize Supabase client.' };
  }

  try {
    const id = userId || 'default_profile';
    const { data, error } = await client
      .from('profiles')
      .select('data')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !data.data) {
      return { success: false, error: 'No prerequisite data found for your account in Supabase.' };
    }

    const stored = data.data as PrerequisitesPayload;
    return { success: true, payload: stored };
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

export async function upsertPushupLogs(
  records: PushupLogRecord[],
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
    const { error } = await client.from('pushup_logs').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        date: r.date,
        target_count: r.target_count,
        completed_count: r.completed_count,
        sets: r.sets,
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

export async function upsertGymSessions(
  records: GymSessionRecord[],
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
    const { error } = await client.from('gym_sessions').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        date: r.date,
        workout_type: r.workout_type,
        completed: r.completed,
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

export async function fetchPushupLogsSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: PushupLogRecord[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };
  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };
  try {
    const { data, error } = await client
      .from('pushup_logs')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as PushupLogRecord[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchGymSessionsSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: GymSessionRecord[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };
  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };
  try {
    const { data, error } = await client
      .from('gym_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as GymSessionRecord[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function upsertChoreRecords(
  records: ChoreRecordCloud[],
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
    const { error } = await client.from('chores').upsert(
      records.map((r) => ({
        id: r.id,
        user_id: r.user_id || null,
        title: r.title,
        slot: r.slot,
        is_default: r.is_default,
        completed_dates: r.completed_dates,
        updated_at: r.updated_at,
      }))
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fetchChoresSince(
  userId: string,
  sinceIso: string,
  urlOverride?: string,
  keyOverride?: string
): Promise<{ success: boolean; records?: ChoreRecordCloud[]; error?: string }> {
  const settings = StorageService.getSettings();
  const url = urlOverride || settings.supabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = keyOverride || settings.supabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { success: false, error: 'No Supabase credentials provided.' };
  const client = createCustomSupabaseClient(url.trim(), anonKey.trim());
  if (!client) return { success: false, error: 'Could not initialize Supabase client.' };
  try {
    const { data, error } = await client
      .from('chores')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso);
    if (error) return { success: false, error: error.message };
    return { success: true, records: (data || []) as ChoreRecordCloud[] };
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

ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own execution logs" ON public.execution_logs
  FOR ALL USING (auth.uid() = user_id);

-- Profiles (mirrors local user_profile)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT '{}'::jsonb,
  meal_staples JSONB DEFAULT '{}'::jsonb,
  targets JSONB DEFAULT '{}'::jsonb,
  is_onboarded BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chores (mirrors local chores & completion dates)
CREATE TABLE IF NOT EXISTS public.chores (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slot TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  completed_dates JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chores" ON public.chores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Pushup Logs (daily physical discipline telemetry)
CREATE TABLE IF NOT EXISTS public.pushup_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 100,
  completed_count INTEGER NOT NULL DEFAULT 0,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gym Sessions (daily attendance telemetry)
CREATE TABLE IF NOT EXISTS public.gym_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pushup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pushup logs" ON public.pushup_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own gym sessions" ON public.gym_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pushups_user_updated ON public.pushup_logs (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_gym_user_updated ON public.gym_sessions (user_id, updated_at);
`;

