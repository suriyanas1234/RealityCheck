'use client';

import React, { useState } from 'react';
import { AppSettings, MealType, StapleMeal } from '@/types';
import { playSound } from '@/lib/sound';
import { StorageService } from '@/lib/storage';
import { SUPABASE_SQL_SCHEMA } from '@/lib/supabase';
import {
  Settings,
  X,
  Download,
  Upload,
  RefreshCw,
  Database,
  Clock,
  Utensils,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  soundEnabled: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  soundEnabled,
  onClose,
  onUpdateSettings,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'staples' | 'schedule' | 'supabase' | 'data'>('general');
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseConfig?.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseConfig?.anonKey || '');
  const [supabaseEnabled, setSupabaseEnabled] = useState(settings.supabaseConfig?.enabled || false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Editable staples local copy
  const [editableStaples, setEditableStaples] = useState<Record<MealType, StapleMeal[]>>(settings.staples);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    playSound('execute', soundEnabled);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportData = () => {
    playSound('execute', soundEnabled);
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reality-check-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importData(content);
        if (success) {
          playSound('execute', soundEnabled);
          onDataImported();
          setSaveStatus('Data imported successfully!');
          setTimeout(() => setSaveStatus(null), 3000);
        } else {
          playSound('error', soundEnabled);
          alert('Invalid backup file JSON format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (confirm('Are you sure you want to reset all discipline data to defaults? This cannot be undone.')) {
      playSound('error', soundEnabled);
      StorageService.resetToFactory();
      onDataImported();
      onClose();
    }
  };

  const handleSaveSupabase = () => {
    const updated = {
      ...settings,
      supabaseConfig: {
        enabled: supabaseEnabled,
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
      },
    };
    onUpdateSettings(updated);
    playSound('execute', soundEnabled);
    setSaveStatus('Supabase settings saved!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleSaveStaples = () => {
    const updated = {
      ...settings,
      staples: editableStaples,
    };
    onUpdateSettings(updated);
    playSound('execute', soundEnabled);
    setSaveStatus('Staple meals updated!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative text-zinc-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Protocol Configuration & Data
            </h3>
          </div>
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            [ESC]
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 border-b border-zinc-800/80 shrink-0 overflow-x-auto text-xs">
          {[
            { id: 'general', label: 'General' },
            { id: 'staples', label: 'Staple Meals' },
            { id: 'supabase', label: 'Supabase Cloud' },
            { id: 'data', label: 'Export / Backup' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playSound('click', soundEnabled);
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {saveStatus && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-200 block">Military Time (24h)</span>
                  <span className="text-[11px] text-zinc-500">
                    Switch between standard (8:30 AM) and operational (08:30)
                  </span>
                </div>
                <button
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onUpdateSettings({ ...settings, militaryTime: !settings.militaryTime });
                  }}
                  className={`px-3 py-1 rounded border font-semibold ${
                    settings.militaryTime
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {settings.militaryTime ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-200 block">Mechanical Tactile Audio</span>
                  <span className="text-[11px] text-zinc-500">
                    Subtle synthetic audio cues on click, execution, and rule rejection
                  </span>
                </div>
                <button
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
                  }}
                  className={`px-3 py-1 rounded border font-semibold ${
                    settings.soundEnabled
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {settings.soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <span className="font-semibold text-zinc-200 block mb-1">Fixed Schedule Blocks</span>
                <p className="text-[11px] text-zinc-400 mb-3">
                  Default non-negotiable anchor times:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {settings.scheduleBlocks.map((b) => (
                    <div key={b.id} className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-300 font-medium">{b.title}</span>
                      <span className="text-emerald-400 font-semibold">{b.displayTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAPLE MEALS TAB */}
          {activeTab === 'staples' && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-[11px]">
                Customize your "Fridge Decision Killer" staples. Keep them effortless with &lt; 5 minutes prep so you never stumble into meal skippage or indecision.
              </p>

              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => (
                <div key={mealType} className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/40 space-y-2">
                  <h4 className="uppercase font-bold text-zinc-300 text-[11px] tracking-wider">
                    {mealType} Staples
                  </h4>
                  <div className="space-y-2">
                    {editableStaples[mealType]?.map((st, idx) => (
                      <div key={st.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-950 p-2 rounded border border-zinc-800/80">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => {
                            const copy = { ...editableStaples };
                            copy[mealType][idx].name = e.target.value;
                            setEditableStaples(copy);
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                          placeholder="Meal name"
                        />
                        <input
                          type="text"
                          value={st.description}
                          onChange={(e) => {
                            const copy = { ...editableStaples };
                            copy[mealType][idx].description = e.target.value;
                            setEditableStaples(copy);
                          }}
                          className="sm:col-span-2 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                          placeholder="Quick ingredients description"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSaveStaples}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors"
              >
                SAVE STAPLE MEAL UPDATES
              </button>
            </div>
          )}

          {/* SUPABASE TAB */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-200 block">Optional Supabase Sync</span>
                    <span className="text-[11px] text-zinc-500">
                      Sync discipline data securely across desktop and mobile devices
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={supabaseEnabled}
                    onChange={(e) => setSupabaseEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                      Anon Public Key
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
                    />
                  </div>

                  <button
                    onClick={handleSaveSupabase}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 font-semibold"
                  >
                    Save Supabase Credentials
                  </button>
                </div>
              </div>

              {/* SQL Schema Copy Button */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Supabase SQL Schema</span>
                  <button
                    onClick={handleCopySql}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded border border-zinc-700 flex items-center gap-1"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied SQL' : 'Copy SQL Script'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Run this in your Supabase SQL Editor to create tables for meals, chores, gestures, and nightly audits.
                </p>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                <span className="font-semibold text-zinc-200 block">Export Discipline History</span>
                <p className="text-[11px] text-zinc-400">
                  Download a complete JSON backup containing all audit records, meal history, and verified gestures.
                </p>
                <button
                  onClick={handleExportData}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                <span className="font-semibold text-zinc-200 block">Restore / Import Backup</span>
                <p className="text-[11px] text-zinc-400">
                  Import a previously exported JSON backup file to restore records.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/20 space-y-2">
                <span className="font-semibold text-rose-300 block">Factory Reset</span>
                <p className="text-[11px] text-rose-400/80">
                  Wipes all local logs and resets default schedule and staple meals.
                </p>
                <button
                  onClick={handleFactoryReset}
                  className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/60 text-rose-300 rounded font-semibold"
                >
                  Reset All Data to Defaults
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
