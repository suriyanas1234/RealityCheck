'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTodayString } from '@/lib/date-utils';
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
      const day = now.getDay(); // 0 = Sunday

      // Morning Reset 08:00
      if (hh === 8 && mm >= 0 && mm < 2 && !firedRef.has(`mr-${today}`)) {
        firedRef.add(`mr-${today}`);
        showNotification(
          'Grounding Routine Active',
          'Check off hair oil / hygiene baseline.'
        );
      }

      // Meal windows (15 min prior): 08:15, 12:45, 18:15
      if (hh === 8 && mm >= 15 && mm < 17 && !firedRef.has(`bf-${today}`)) {
        firedRef.add(`bf-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple meal.');
      }
      if (hh === 12 && mm >= 45 && mm < 47 && !firedRef.has(`ln-${today}`)) {
        firedRef.add(`ln-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple meal.');
      }
      if (hh === 18 && mm >= 15 && mm < 17 && !firedRef.has(`dn-${today}`)) {
        firedRef.add(`dn-${today}`);
        showNotification('Fuel Anchor Approaching', 'Lock in staple meal.');
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
          showNotification('Initiative Engine', 'Text Mom about your day.');
        }
      }

      // Day Closure / Evening Reset 22:30
      if (hh === 22 && mm >= 30 && mm < 32 && !firedRef.has(`dc-${today}`)) {
        firedRef.add(`dc-${today}`);
        showNotification('Kitchen Reset & 2-Minute Audit', 'Day Closure time.');
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [enabled, permission, showNotification]);
}
