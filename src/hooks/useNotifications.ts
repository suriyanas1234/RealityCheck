'use client';

import { useEffect, useCallback, useState } from 'react';

type NotificationPermissionState = 'default' | 'granted' | 'denied';

const SW_PATH = '/sw.js';
const PERMISSION_KEY = 'realitycheck_notifications_enabled';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function canNotify(): boolean {
  return isBrowser() && 'Notification' in window;
}

/**
 * High-priority local notification engine.
 *
 * Schedules reminder checks in-app via a polling interval. When the PWA's
 * service worker is active it can also dispatch notifications while the app
 * is backgrounded on supporting platforms.
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    isBrowser() && canNotify() ? Notification.permission : 'denied'
  );
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!isBrowser()) return;
    const stored = localStorage.getItem(PERMISSION_KEY);
    setEnabled(stored === 'true');
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!canNotify()) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        localStorage.setItem(PERMISSION_KEY, 'true');
        setEnabled(true);
        await registerServiceWorker();
        return true;
      }
      localStorage.setItem(PERMISSION_KEY, 'false');
      setEnabled(false);
      return false;
    } catch {
      return false;
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!isBrowser() || !('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register(SW_PATH);
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }, []);

  const showNotification = useCallback((title: string, body?: string) => {
    if (!canNotify() || Notification.permission !== 'granted') return;
    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
        });
      } else {
        // Fallback to the web Notification API
        new Notification(title, { body });
      }
    } catch {
      try {
        new Notification(title, { body });
      } catch {
        /* noop */
      }
    }
  }, []);

  // Persist enabled toggle
  const setEnabledPersist = useCallback(
    (value: boolean) => {
      localStorage.setItem(PERMISSION_KEY, value ? 'true' : 'false');
      setEnabled(value);
    },
    []
  );

  return {
    permission,
    enabled,
    requestPermission,
    showNotification,
    registerServiceWorker,
    setEnabled: setEnabledPersist,
  };
}
