'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db, getUnsyncedRecords, markRecordsSynced } from '@/lib/db';
import { StorageService } from '@/lib/storage';
import {
  upsertUserProfileRecord,
  upsertMealRecords,
  upsertInitiativeLedger,
  upsertDailyAudits,
  fetchMealsSince,
  fetchInitiativeLedgerSince,
  fetchDailyAuditsSince,
  upsertPushupLogs,
  upsertGymSessions,
  fetchPushupLogsSince,
  fetchGymSessionsSince,
} from '@/lib/supabase';
import {
  SyncStatus,
  SyncResult,
  UserProfileRecord,
  MealRecordCloud,
  InitiativeLedgerEntry,
  DailyAuditRecordCloud,
  PushupLogRecord,
  GymSessionRecord,
} from '@/types';

const LAST_SYNC_KEY = 'realitycheck_last_sync_at';

function resolveCredentials(): { url: string; anonKey: string } | null {
  const settings = StorageService.getSettings();
  const config = settings.supabaseConfig;
  const url = (config?.enabled && config?.url ? config.url : process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const anonKey = (config?.enabled && config?.anonKey ? config.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function useCloudSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const clientRef = useRef<SupabaseClient | null>(null);
  const syncingRef = useRef<boolean>(false);

  // Load last sync timestamp from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d.getTime())) setLastSyncedAt(d);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const unsynced = await getUnsyncedRecords();
      const total =
        unsynced.meals.length +
        unsynced.chores.length +
        unsynced.gestures.length +
        unsynced.audits.length +
        unsynced.user_profile.length +
        unsynced.pushup_logs.length +
        unsynced.gym_sessions.length;
      setPendingCount(total);
    } catch {
      // ignore
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (typeof window === 'undefined') return { pushed: 0, pulled: 0 };
    if (syncingRef.current) return { pushed: 0, pulled: 0 };

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return { pushed: 0, pulled: 0 };
    }

    const creds = resolveCredentials();
    if (!creds) {
      setSyncStatus('local_only');
      setLastError('No Supabase credentials found. Add them in Settings or .env.local.');
      return { pushed: 0, pulled: 0, error: 'No Supabase credentials found.' };
    }

    syncingRef.current = true;
    setSyncStatus('syncing');
    setLastError(null);

    try {
      if (!clientRef.current) {
        clientRef.current = createClient(creds.url, creds.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true },
        });
      }
      const supabase = clientRef.current;

      // Require an authenticated session for RLS-scoped sync
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setSyncStatus('error');
        setLastError(`Auth session error: ${sessionError.message}`);
        syncingRef.current = false;
        return { pushed: 0, pulled: 0, error: sessionError.message };
      }
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setSyncStatus('local_only');
        setLastError('Not signed in. Sign in with Google to enable cloud sync.');
        syncingRef.current = false;
        return { pushed: 0, pulled: 0, error: 'Not signed in.' };
      }

      const lastSyncIso =
        lastSyncedAt?.toISOString() || new Date(0).toISOString();

      // ---------- PUSH (Local -> Cloud) ----------
      const unsynced = await getUnsyncedRecords();
      let pushed = 0;

      if (unsynced.user_profile.length) {
        for (const p of unsynced.user_profile) {
          const record: UserProfileRecord = {
            id: p.id,
            user_id: userId,
            data: p.data as unknown as UserProfileRecord['data'],
            updated_at: p.updatedAt,
          };
          const res = await upsertUserProfileRecord(record, creds.url, creds.anonKey);
          if (res.success) {
            pushed++;
          } else {
            setLastError(`Profile push failed: ${res.error}`);
          }
        }
        await markRecordsSynced({ user_profile: unsynced.user_profile.map((p) => p.id) });
      }

      if (unsynced.meals.length) {
        const records: MealRecordCloud[] = unsynced.meals.map((m) => ({
          id: m.id,
          user_id: userId,
          date: m.date,
          meal_type: m.mealType,
          staple_id: m.stapleId,
          custom_meal_name: m.mealName,
          is_outlier: m.isOutlier,
          outlier_reason: m.outlierReason,
          logged_at: m.loggedAt,
          updated_at: m.updatedAt,
        }));
        const res = await upsertMealRecords(records, creds.url, creds.anonKey);
        if (res.success) {
          pushed += records.length;
          await markRecordsSynced({ meals: unsynced.meals.map((m) => m.id) });
        } else {
          setLastError(`Meals push failed: ${res.error}`);
        }
      }

      if (unsynced.gestures.length) {
        const records: InitiativeLedgerEntry[] = unsynced.gestures.map((g) => ({
          id: g.id,
          user_id: userId,
          recipient: g.recipient,
          recipient_name: g.recipientName,
          action_type: g.actionType || 'gesture',
          description: g.action,
          details: g.details,
          scheduled_date: g.scheduledDate,
          is_reactive: g.wasPrompted,
          created_at: g.timestamp,
          updated_at: g.updatedAt,
        }));
        const res = await upsertInitiativeLedger(records, creds.url, creds.anonKey);
        if (res.success) {
          pushed += records.length;
          await markRecordsSynced({ gestures: unsynced.gestures.map((g) => g.id) });
        } else {
          setLastError(`Initiative ledger push failed: ${res.error}`);
        }
      }

      if (unsynced.audits.length) {
        const records: DailyAuditRecordCloud[] = unsynced.audits.map((a) => ({
          id: a.id,
          user_id: userId,
          date: a.date,
          meals_adhered: a.adheredMeals,
          chores_executed: a.completedChores,
          composure_maintained: a.maintainedComposure,
          observation: a.observation,
          created_at: a.completedAt,
          updated_at: a.updatedAt,
        }));
        const res = await upsertDailyAudits(records, creds.url, creds.anonKey);
        if (res.success) {
          pushed += records.length;
          await markRecordsSynced({ audits: unsynced.audits.map((a) => a.id) });
        } else {
          setLastError(`Daily audits push failed: ${res.error}`);
        }
      }

      if (unsynced.pushup_logs.length) {
        const records: PushupLogRecord[] = unsynced.pushup_logs.map((p) => ({
          id: p.id,
          user_id: userId,
          date: p.date,
          target_count: p.targetCount,
          completed_count: p.completedCount,
          sets: p.sets,
          logged_at: p.loggedAt,
          updated_at: p.updatedAt,
        }));
        const res = await upsertPushupLogs(records, creds.url, creds.anonKey);
        if (res.success) {
          pushed += records.length;
          await markRecordsSynced({ pushup_logs: unsynced.pushup_logs.map((p) => p.id) });
        } else {
          setLastError(`Pushup logs push failed: ${res.error}`);
        }
      }

      if (unsynced.gym_sessions.length) {
        const records: GymSessionRecord[] = unsynced.gym_sessions.map((g) => ({
          id: g.id,
          user_id: userId,
          date: g.date,
          workout_type: g.workoutType,
          completed: g.completed,
          logged_at: g.loggedAt,
          updated_at: g.updatedAt,
        }));
        const res = await upsertGymSessions(records, creds.url, creds.anonKey);
        if (res.success) {
          pushed += records.length;
          await markRecordsSynced({ gym_sessions: unsynced.gym_sessions.map((g) => g.id) });
        } else {
          setLastError(`Gym sessions push failed: ${res.error}`);
        }
      }

      // ---------- PULL (Cloud -> Local) ----------
      let pulled = 0;

      const mealsRes = await fetchMealsSince(userId, lastSyncIso, creds.url, creds.anonKey);
      if (mealsRes.success && mealsRes.records?.length) {
        await db.meals.bulkPut(
          mealsRes.records.map((r) => ({
            id: r.id,
            date: r.date,
            mealType: r.meal_type,
            stapleId: r.staple_id,
            mealName: r.custom_meal_name || '',
            loggedAt: r.logged_at,
            isOutlier: r.is_outlier,
            outlierReason: r.outlier_reason,
            updatedAt: r.updated_at,
            syncedAt: new Date().toISOString(),
          }))
        );
        pulled += mealsRes.records.length;
      }

      const ledgerRes = await fetchInitiativeLedgerSince(userId, lastSyncIso, creds.url, creds.anonKey);
      if (ledgerRes.success && ledgerRes.records?.length) {
        await db.gestures.bulkPut(
          ledgerRes.records.map((r) => ({
            id: r.id,
            date: r.created_at.slice(0, 10),
            timestamp: r.created_at,
            recipient: r.recipient,
            recipientName: r.recipient_name,
            action: r.description,
            actionType: r.action_type,
            details: r.details,
            scheduledDate: r.scheduled_date,
            wasPrompted: r.is_reactive,
            isProactive: !r.is_reactive,
            updatedAt: r.updated_at,
            syncedAt: new Date().toISOString(),
          }))
        );
        pulled += ledgerRes.records.length;
      }

      const auditsRes = await fetchDailyAuditsSince(userId, lastSyncIso, creds.url, creds.anonKey);
      if (auditsRes.success && auditsRes.records?.length) {
        await db.audits.bulkPut(
          auditsRes.records.map((r) => ({
            id: r.id,
            date: r.date,
            adheredMeals: r.meals_adhered,
            completedChores: r.chores_executed,
            maintainedComposure: r.composure_maintained,
            observation: r.observation,
            completedAt: r.created_at,
            updatedAt: r.updated_at,
            syncedAt: new Date().toISOString(),
          }))
        );
        pulled += auditsRes.records.length;
      }

      const pushupsRes = await fetchPushupLogsSince(userId, lastSyncIso, creds.url, creds.anonKey);
      if (pushupsRes.success && pushupsRes.records?.length) {
        await db.pushup_logs.bulkPut(
          pushupsRes.records.map((r) => ({
            id: r.id,
            date: r.date,
            targetCount: r.target_count,
            completedCount: r.completed_count,
            sets: r.sets || [],
            loggedAt: r.logged_at,
            updatedAt: r.updated_at,
            syncedAt: new Date().toISOString(),
          }))
        );
        pulled += pushupsRes.records.length;
      }

      const gymRes = await fetchGymSessionsSince(userId, lastSyncIso, creds.url, creds.anonKey);
      if (gymRes.success && gymRes.records?.length) {
        await db.gym_sessions.bulkPut(
          gymRes.records.map((r) => ({
            id: r.id,
            date: r.date,
            workoutType: r.workout_type,
            completed: r.completed,
            loggedAt: r.logged_at,
            updatedAt: r.updated_at,
            syncedAt: new Date().toISOString(),
          }))
        );
        pulled += gymRes.records.length;
      }

      const now = new Date();
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      setLastSyncedAt(now);
      setSyncStatus('synced');
      await refreshPendingCount();
      syncingRef.current = false;
      return { pushed, pulled };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      console.error('Cloud sync error:', err);
      setSyncStatus('error');
      setLastError(msg);
      syncingRef.current = false;
      return { pushed: 0, pulled: 0, error: msg };
    }
  }, [lastSyncedAt, refreshPendingCount]);

  // Online/offline monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  useEffect(() => {
    refreshPendingCount();
    triggerSync();
  }, [triggerSync, refreshPendingCount]);

  return {
    isOnline,
    syncStatus,
    lastSyncedAt,
    pendingCount,
    lastError,
    triggerSync,
  };
}
