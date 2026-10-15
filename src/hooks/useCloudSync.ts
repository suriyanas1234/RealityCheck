'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { StorageService } from '@/lib/storage';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export function useCloudSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

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

    const settings = StorageService.getSettings();
    const config = settings.supabaseConfig;
    const supabaseUrl = (config?.enabled && config?.url ? config.url : process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
    const supabaseKey = (config?.enabled && config?.anonKey ? config.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

    if (!supabaseUrl || !supabaseKey) {
      // Offline-first IndexedDB active
      setSyncStatus('local_only');
      return;
    }

    try {
      setSyncStatus('syncing');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Sync Audits
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

      // 2. Sync Meals
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

      // 3. Sync Chores
      const localChores = await db.chores.toArray();
      if (localChores.length > 0) {
        await supabase.from('reality_chores').upsert(
          localChores.map((c) => ({
            id: c.id,
            title: c.title,
            slot: c.slot,
            completed_dates: c.completedDates || {},
            is_default: c.isDefault ?? false,
          }))
        );
      }

      // 4. Sync Gestures
      const localGestures = await db.gestures.toArray();
      if (localGestures.length > 0) {
        await supabase.from('reality_gestures').upsert(
          localGestures.map((g) => ({
            id: g.id,
            recipient_id: g.recipient,
            recipient_name: g.recipientName,
            date: g.date,
            timestamp: g.timestamp,
            gesture_type: g.action,
            details: g.details,
            was_prompted: g.wasPrompted,
          }))
        );
      }

      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Cloud sync note:', err);
      setSyncStatus('local_only');
    }
  }, []);

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
