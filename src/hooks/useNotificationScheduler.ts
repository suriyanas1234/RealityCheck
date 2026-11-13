'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTodayString, parseMinutesFromTimeString } from '@/lib/date-utils';
import { StorageService } from '@/lib/storage';
import { useNotifications } from './useNotifications';

// Track which notification keys we've already fired today (per session).
const firedRef = new Set<string>();

/**
 * Drives the high-priority local notification trigger matrix.
 * Runs a 30s polling loop; fires each notification at most once per session
 * when the clock crosses its trigger window.
 */
export function useNotificationScheduler() {
  const { enabled, permission, showNotification } = useNotifications();
  const pushups = useLiveQuery(() => db.pushup_logs.get(getTodayString()), []);
  const momTexts = useLiveQuery(
    () => db.gestures.where('actionType').equals('day_update_text').toArray(),
    []
  );
  const stateRef = useRef({ pushups, momTexts, enabled, permission });
  stateRef.current = { pushups, momTexts, enabled, permission };

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;

    const check = () => {
      const now = new Date();
      const today = getTodayString(now);
      const hh = now.getHours();
      const mm = now.getMinutes();
      const nowMin = hh * 60 + mm;
      const day = now.getDay(); // 0 = Sunday

      const settings = StorageService.getSettings();
      const profile = StorageService.getUserProfile();
      const blocks = settings.scheduleBlocks || [];

      const wakeTime =
        blocks.find((b) => b.category === 'wake' || b.id === 'block-wake')?.time ||
        profile.anchors?.morningReset ||
        '08:00';
      const bfTime =
        blocks.find((b) => b.mealType === 'breakfast' || b.id === 'block-breakfast')?.time ||
        profile.anchors?.breakfast ||
        '08:30';
      const lnTime =
        blocks.find((b) => b.mealType === 'lunch' || b.id === 'block-lunch')?.time ||
        profile.anchors?.lunch ||
        '13:00';
      const dnTime =
        blocks.find((b) => b.mealType === 'dinner' || b.id === 'block-dinner')?.time ||
        profile.anchors?.eveningReset ||
        '18:30';
      const dcTime =
        blocks.find((b) => b.category === 'sleep' || b.id === 'block-winddown')?.time ||
        profile.anchors?.dayClosure ||
        '22:30';

      const wakeMin = parseMinutesFromTimeString(wakeTime);
      const bfAlertMin = Math.max(0, parseMinutesFromTimeString(bfTime) - 15);
      const lnAlertMin = Math.max(0, parseMinutesFromTimeString(lnTime) - 15);
      const dnAlertMin = Math.max(0, parseMinutesFromTimeString(dnTime) - 15);
      const dcMin = parseMinutesFromTimeString(dcTime);

      // Morning Reset
      if (nowMin >= wakeMin && nowMin < wakeMin + 2 && !firedRef.has(`mr-${today}`)) {
        firedRef.add(`mr-${today}`);
        showNotification(
          'Grounding Routine Active',
          'Check off hair oil / hygiene baseline.'
        );
      }

      // Meal windows (15 min prior to configured meal anchors)
      if (nowMin >= bfAlertMin && nowMin < bfAlertMin + 2 && !firedRef.has(`bf-${today}`)) {
        firedRef.add(`bf-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple breakfast.');
      }
      if (nowMin >= lnAlertMin && nowMin < lnAlertMin + 2 && !firedRef.has(`ln-${today}`)) {
        firedRef.add(`ln-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple lunch.');
      }
      if (nowMin >= dnAlertMin && nowMin < dnAlertMin + 2 && !firedRef.has(`dn-${today}`)) {
        firedRef.add(`dn-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple dinner.');
      }

      // Pushup Check-In 15:00
      if (hh === 15 && mm >= 0 && mm < 2 && !firedRef.has(`pu-${today}`)) {
        firedRef.add(`pu-${today}`);
        const done = stateRef.current.pushups?.completedCount ?? 0;
        const target = stateRef.current.pushups?.targetCount ?? 100;
        showNotification(
          'Pushup Check',
          `${done}/${target} complete. Clear your remaining reps.`
        );
      }

      // Weekly Hygiene Alert (Sunday 09:00)
      if (day === 0 && hh === 9 && mm >= 0 && mm < 2 && !firedRef.has(`hy-${today}`)) {
        firedRef.add(`hy-${today}`);
        showNotification('Mandatory Weekly Maintenance', 'Shaving routine due.');
      }

      // Mother Text Reminder 17:00 (if not logged today)
      if (hh === 17 && mm >= 0 && mm < 2 && !firedRef.has(`mom-${today}`)) {
        const loggedToday = stateRef.current.momTexts?.some(
          (g) => g.date === today
        );
        if (!loggedToday) {
          firedRef.add(`mom-${today}`);
          showNotification(
            'Initiative Engine',
            `Text ${profile.motherName || 'Mom'} about your day.`
          );
        }
      }

      // Day Closure / Evening Reset
      if (nowMin >= dcMin && nowMin < dcMin + 2 && !firedRef.has(`dc-${today}`)) {
        firedRef.add(`dc-${today}`);
        showNotification('Kitchen Reset & 2-Minute Audit', 'Day Closure time.');
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [enabled, permission, showNotification]);
}
