'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export function useCloudSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Detect online / offline status
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
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    if (!supabaseUrl || !supabaseKey) {
      // Offline-first IndexedDB active
      setSyncStatus('local_only');
      return;
    }

    try {
      setSyncStatus('syncing');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Push latest audits from IndexedDB to Supabase
      const localAudits = await db.audits.toArray();
      if (localAudits.length > 0) {
        await supabase.from('reality_audits').upsert(
          localAudits.map((a) => ({
            id: a.id,
            date: a.date,
            adhered_to_meal_schedule: a.adheredMeals,
            completed_chores_unprompted: a.completedChores,
            maintained_composure: a.maintainedComposure,
            objective_observation: a.observation,
            completed_at: a.completedAt,
          }))
        );
      }

      // Push meals
      const localMeals = await db.meals.toArray();
      if (localMeals.length > 0) {
        await supabase.from('reality_meals').upsert(
          localMeals.map((m) => ({
            id: m.id,
            date: m.date,
            meal_type: m.mealType,
            staple_id: m.stapleId,
            custom_meal_name: m.mealName,
            logged_at: m.loggedAt,
          }))
        );
      }

      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Cloud sync note:', err);
      setSyncStatus('local_only');
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    triggerSync();
  }, [triggerSync]);

  return {
    isOnline,
    syncStatus,
    lastSyncedAt,
    triggerSync,
  };
}
