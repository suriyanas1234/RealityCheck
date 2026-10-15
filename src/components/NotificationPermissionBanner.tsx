'use client';

import React from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationPermissionBanner: React.FC = () => {
  const { permission, enabled, requestPermission, setEnabled } = useNotifications();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  // Only show if permission hasn't been granted (default/denied) and not explicitly enabled
  if (permission === 'granted' && enabled) return null;

  const handleEnable = async () => {
    if (permission !== 'granted') {
      const ok = await requestPermission();
      if (!ok) return;
    }
    setEnabled(true);
  };

  return (
    <div className="px-4 py-2.5 bg-[#D9730D]/15 border-b border-[#D9730D]/30 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs">
        <Bell className="w-4 h-4 text-[#D9730D] shrink-0" />
        <div>
          <span className="font-semibold text-[#E3E3E3] block leading-tight">
            High-Priority Alerts are {enabled ? 'on' : 'off'}
          </span>
          <span className="text-[#838383] text-[11px]">
            Get grounding, meal-window, pushup, hygiene and Mom-text reminders.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!enabled ? (
          <button
            onClick={handleEnable}
            className="px-3 py-1.5 rounded bg-[#D9730D] hover:bg-[#c3650a] text-white text-xs font-semibold transition-colors"
          >
            Enable High-Priority Alerts
          </button>
        ) : (
          <button
            onClick={() => setEnabled(false)}
            className="p-1.5 rounded border border-[#373737] text-[#838383] hover:text-[#E3E3E3]"
            title="Disable notifications"
          >
            <BellOff className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded text-[#838383] hover:text-[#E3E3E3]"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
