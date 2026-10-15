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
} from '@/lib/supabase';
import {
  SyncStatus,
  SyncResult,
  UserProfileRecord,
  MealRecordCloud,
  InitiativeLedgerEntry,
  DailyAuditRecordCloud,
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
        unsynced.user_profile.length;
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
      return { pushed: 0, pulled: 0 };
    }

    syncingRef.current = true;
    setSyncStatus('syncing');

    try {
      if (!clientRef.current) {
        clientRef.current = createClient(creds.url, creds.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true },
        });
      }
      const supabase = clientRef.current;

      // Require an authenticated session for RLS-scoped sync
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setSyncStatus('local_only');
        syncingRef.current = false;
        return { pushed: 0, pulled: 0 };
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
          if (res.success) pushed++;
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

      const now = new Date();
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      setLastSyncedAt(now);
      setSyncStatus('synced');
      await refreshPendingCount();
      syncingRef.current = false;
      return { pushed, pulled };
    } catch (err) {
      console.warn('Cloud sync note:', err);
      setSyncStatus('error');
      syncingRef.current = false;
      return { pushed: 0, pulled: 0, error: err instanceof Error ? err.message : 'Sync failed' };
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
    triggerSync,
  };
}
