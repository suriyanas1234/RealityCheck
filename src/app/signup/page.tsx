'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  StorageService,
  DEFAULT_USER_PROFILE,
  DEFAULT_SCHEDULE_BLOCKS,
  DEFAULT_STAPLES,
  DEFAULT_CHORES,
  DEFAULT_CONTACTS,
} from '@/lib/storage';
import { applyPrerequisitesToDatabase, seedDatabaseIfEmpty, clearAllHistoricalDataFromDatabase } from '@/lib/db';
import { savePrerequisitesToCloud } from '@/lib/supabase';
import { playSound } from '@/lib/sound';
import {
  PrerequisitesPayload,
  UserProfile,
  ScheduleBlock,
  StapleMeal,
  ChoreItem,
  MealType,
  RelationshipContact,
} from '@/types';
import {
  ShieldCheck,
  Check,
  AlertCircle,
  Clock,
  Utensils,
  HeartHandshake,
  CheckSquare,
  Cloud,
  Copy,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function SignupOnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'staples' | 'chores' | 'account'>('profile');

  // Form State
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(DEFAULT_SCHEDULE_BLOCKS);
  const [staples, setStaples] = useState<Record<MealType, StapleMeal[]>>(DEFAULT_STAPLES);
  const [chores, setChores] = useState<ChoreItem[]>(DEFAULT_CHORES);
  const [contacts, setContacts] = useState<RelationshipContact[]>(DEFAULT_CONTACTS);
  const [militaryTime, setMilitaryTime] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New chore input
  const [newChoreTitle, setNewChoreTitle] = useState('');
  const [newChoreSlot, setNewChoreSlot] = useState<'morning' | 'midday' | 'evening'>('morning');

  useEffect(() => {
    seedDatabaseIfEmpty();
    const existing = StorageService.getPrerequisitesPayload();
    if (existing.profile) {
      setUserProfile(existing.profile);
    }
    if (existing.schedule && existing.schedule.length > 0) {
      setSchedule(existing.schedule);
    }
    if (existing.staples) {
      setStaples(existing.staples);
    }
    if (existing.chores && existing.chores.length > 0) {
      setChores(existing.chores);
    }
    if (existing.contacts && existing.contacts.length > 0) {
      setContacts(existing.contacts);
    }
    if (existing.militaryTime !== undefined) {
      setMilitaryTime(existing.militaryTime);
    }
    if (existing.soundEnabled !== undefined) {
      setSoundEnabled(existing.soundEnabled);
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center text-xs text-[#838383]">
        <RefreshCw className="w-4 h-4 animate-spin text-[#337EA9] mr-2" />
        Loading Prerequisite Engine...
      </div>
    );
  }

  const handleAddChore = () => {
    if (!newChoreTitle.trim()) return;
    const newChore: ChoreItem = {
      id: `chore-${Date.now()}`,
      title: newChoreTitle.trim(),
      slot: newChoreSlot,
      estimatedSeconds: 60,
      completedDates: {},
      isDefault: false,
    };
    setChores([...chores, newChore]);
    setNewChoreTitle('');
    playSound('click', soundEnabled);
  };

  const handleDeleteChore = (id: string) => {
    setChores(chores.filter((c) => c.id !== id));
    playSound('click', soundEnabled);
  };

  const handleSaveAll = async () => {
    if (!userProfile.name.trim()) {
      setActiveTab('profile');
      setSaveFeedback({ type: 'error', message: 'Please provide your name or operator call sign.' });
      playSound('error', soundEnabled);
      return;
    }

    setIsSaving(true);
    setSaveFeedback(null);
    playSound('click', soundEnabled);

    // Sync relationship contacts with userProfile fields
    const updatedContacts: RelationshipContact[] = [
      {
        id: 'contact-partner',
        name: userProfile.partnerName || 'Partner',
        relationship: 'girlfriend',
        cadenceDays: Number(userProfile.partnerCadenceDays) || 14,
        reminderTitle: userProfile.partnerReminderNotes || 'Unprompted Care & Date Planning',
      },
      {
        id: 'contact-mom',
        name: userProfile.motherName || 'Mother',
        relationship: 'mother',
        cadenceDays: Number(userProfile.motherCadenceDays) || 3,
        reminderTitle: userProfile.motherReminderNotes || 'Unprompted Check-in Call',
      },
    ];

    const payload: PrerequisitesPayload = {
      profile: {
        ...userProfile,
        email: userProfile.email || 'suriya.thittani@gmail.com',
        onboarded: true,
        onboardedAt: new Date().toISOString(),
      },
      schedule,
      staples,
      chores,
      contacts: updatedContacts,
      militaryTime,
      soundEnabled,
    };

    try {
      // 1. Save locally to StorageService (localStorage)
      StorageService.savePrerequisites(payload);

      // 2. Sync to IndexedDB (Dexie)
      await applyPrerequisitesToDatabase(
        chores.map((c) => ({ id: c.id, title: c.title, slot: c.slot, isDefault: c.isDefault })),
        userProfile.partnerName,
        userProfile.partnerCadenceDays,
        userProfile.motherName,
        userProfile.motherCadenceDays
      );

      // 3. Sync to Cloud for this account
      let cloudMsg = '';
      const email = userProfile.email || 'suriya.thittani@gmail.com';
      try {
        const cloudRes = await savePrerequisitesToCloud(payload, email);
        if (cloudRes.success) {
          cloudMsg = ' and synchronized to your account!';
        }
      } catch {
        // Local-first
      }

      playSound('execute', soundEnabled);
      setSaveFeedback({
        type: 'success',
        message: `Prerequisites locked in for ${email}${cloudMsg}`,
      });

            // Navigate to Today Execution Hub after brief moment
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: unknown) {
      console.error('Error saving prerequisites:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save prerequisites';
      setSaveFeedback({ type: 'error', message: msg });
      playSound('error', soundEnabled);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3] font-sans pb-28">
      {/* Top Banner Header */}
      <header className="border-b border-[#373737] bg-[#202020] px-4 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 rounded hover:bg-[#2c2c2c] text-[#838383] hover:text-[#E3E3E3] transition-colors"
              title="Return to Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#337EA9] uppercase tracking-wider">
                  REALITYCHECK // ONBOARDING
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2B593F]/40 text-[#446B5E] border border-[#2B593F] font-mono">
                  ONE-TIME SETUP
                </span>
              </div>
              <h1 className="text-sm font-semibold text-[#E3E3E3]">Prerequisite Configuration</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#373737] bg-[#252525] text-[11px] text-[#838383]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#446B5E]" />
            <span className="font-mono text-[#E3E3E3]">{userProfile.email || 'suriya.thittani@gmail.com'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro Callout */}
        <div className="notion-callout bg-[#202020] border-[#373737]">
          <span className="text-xl select-none">🎯</span>
          <div className="text-xs space-y-1">
            <div className="font-semibold text-[#E3E3E3]">Non-Negotiable Baseline Registration</div>
            <p className="text-[#838383] leading-relaxed">
              RealityCheck operates on friction elimination. By registering your baseline anchors, decision-free staples,
              core chores, and relationship frequencies once, you remove daily willpower depletion. Everything is stored
              locally and mirrored to your cloud table for permanent accessibility.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#373737] overflow-x-auto no-scrollbar gap-1 text-xs">
          {[
            { id: 'profile', label: '1. Identity & Contacts', icon: HeartHandshake },
            { id: 'schedule', label: '2. Daily Anchors', icon: Clock },
            { id: 'staples', label: '3. Staple Meals', icon: Utensils },
            { id: 'chores', label: '4. Household Chores', icon: CheckSquare },
            { id: 'account', label: '5. Account & Sync', icon: Cloud },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'border-[#337EA9] text-[#E3E3E3] bg-[#252525]/60'
                    : 'border-transparent text-[#838383] hover:text-[#E3E3E3] hover:bg-[#202020]/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#337EA9]' : 'text-[#838383]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: IDENTITY & CONTACTS */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="notion-panel p-4 space-y-4">
              <div className="border-b border-[#373737] pb-2">
                <h2 className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider">
                  Operator Identity
                </h2>
                <p className="text-[11px] text-[#838383]">
                  Your identifier used across execution summaries and nightly consistency audits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[#838383] mb-1">
                    Your Name / Call Sign <span className="text-[#D9730D]">*</span>
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    placeholder="e.g. Suriya"
                    className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-2 text-xs text-[#E3E3E3] focus:outline-none focus:border-[#337EA9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#838383] mb-1">
                    Email (Cloud Record Identifier)
                  </label>
                  <input
                    type="email"
                    value={userProfile.email || ''}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    placeholder="e.g. commander@realitycheck.app"
                    className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-2 text-xs text-[#E3E3E3] focus:outline-none focus:border-[#337EA9]"
                  />
                </div>
              </div>
            </div>

            {/* Partner Contact Card */}
            <div className="notion-panel p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#373737] pb-2">
                <div>
                  <span className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider block">
                    Partner / Significant Other Anchor
                  </span>
                  <span className="text-[11px] text-[#838383]">
                    Proactive initiative cadence. Drives unprompted date planning and thoughtful gestures.
                  </span>
                </div>
                <span className="text-base select-none">💐</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-[#838383] mb-1">Partner Name</label>
                  <input
                    type="text"
                    value={userProfile.partnerName}
                    onChange={(e) => setUserProfile({ ...userProfile, partnerName: e.target.value })}
                    placeholder="e.g. Maya or Girlfriend"
                    className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#E3E3E3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#838383] mb-1">Cadence (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={userProfile.partnerCadenceDays}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, partnerCadenceDays: parseInt(e.target.value) || 14 })
                    }
                    className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#E3E3E3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#838383] mb-1">Default Cadence Cycle</label>
                  <div className="py-1.5 px-2.5 rounded bg-[#191919] border border-[#373737] text-[11px] text-[#838383]">
                    Every {userProfile.partnerCadenceDays} days (Bi-weekly)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#838383] mb-1">
                  Focus Reminder Instructions
                </label>
                <input
                  type="text"
                  value={userProfile.partnerReminderNotes || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, partnerReminderNotes: e.target.value })}
                  placeholder="Plan complete Friday Date Night on Monday morning; deliver fresh flowers unprompted"
                  className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#838383]"
                />
              </div>
            </div>

            {/* Mother / Family Card */}
            <div className="notion-panel p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#373737] pb-2">
                <div>
                  <span className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider block">
                    Mother / Family Anchor
                  </span>
                  <span className="text-[11px] text-[#838383]">
                    Frequent proactive check-in cadence to maintain bond without requiring reminders.
                  </span>
                </div>
                <span className="text-base select-none">📞</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-[#838383] mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={userProfile.motherName}
                    onChange={(e) => setUserProfile({ ...userProfile, motherName: e.target.value })}
                    placeholder="e.g. Mom"
                    className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#E3E3E3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#838383] mb-1">Cadence (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={userProfile.motherCadenceDays}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, motherCadenceDays: parseInt(e.target.value) || 3 })
                    }
                    className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#E3E3E3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#838383] mb-1">
                  Focus Reminder Instructions
                </label>
                <input
                  type="text"
                  value={userProfile.motherReminderNotes || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, motherReminderNotes: e.target.value })}
                  placeholder="Unprompted 20-minute call before she needs to ping you"
                  className="w-full bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#838383]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('schedule');
                }}
                className="px-4 py-2 bg-[#252525] hover:bg-[#2c2c2c] border border-[#373737] rounded text-xs font-semibold text-[#E3E3E3] flex items-center gap-1.5"
              >
                <span>Proceed to Daily Anchors</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#337EA9]" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE ANCHORS */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="notion-callout">
              <Clock className="w-4 h-4 text-[#337EA9] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#838383]">
                <strong className="text-[#E3E3E3]">Non-Negotiable Temporal Anchors:</strong> Out-of-window eating (e.g.
                cooking an erratic breakfast at 11 AM) breaks cognitive flow and leads to missed audits. Lock in your
                target anchors.
              </div>
            </div>

            <div className="notion-panel p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider border-b border-[#373737] pb-2">
                Anchor Blocks Configuration
              </h3>

              <div className="space-y-2.5">
                {schedule.map((block, idx) => (
                  <div
                    key={block.id}
                    className="p-3 rounded bg-[#191919] border border-[#373737] grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#E3E3E3] block">{block.title}</span>
                      <span className="text-[10px] text-[#838383] uppercase tracking-tight">{block.category}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#838383] mb-0.5">24-hr Time (HH:MM)</label>
                      <input
                        type="time"
                        value={block.time}
                        onChange={(e) => {
                          const copy = [...schedule];
                          copy[idx].time = e.target.value;
                          // Convert 24hr to friendly display
                          const [h, m] = e.target.value.split(':').map(Number);
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const displayH = h % 12 || 12;
                          copy[idx].displayTime = `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
                          setSchedule(copy);
                        }}
                        className="bg-[#202020] border border-[#373737] rounded px-2 py-1 text-xs text-[#E3E3E3] w-full"
                      />
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-xs font-mono font-semibold text-[#337EA9]">{block.displayTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Preferences */}
            <div className="notion-panel p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider border-b border-[#373737] pb-2">
                Interface Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-[#191919] border border-[#373737]">
                  <div>
                    <span className="font-medium text-[#E3E3E3] block">Tactile Audio Feedback</span>
                    <span className="text-[10px] text-[#838383]">Mechanical synthetic sound cues</span>
                  </div>
                  <button
                    onClick={() => {
                      playSound('click', !soundEnabled);
                      setSoundEnabled(!soundEnabled);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                      soundEnabled
                        ? 'bg-[#2B593F] border-[#446B5E] text-white'
                        : 'bg-[#191919] border-[#373737] text-[#838383]'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-[#191919] border border-[#373737]">
                  <div>
                    <span className="font-medium text-[#E3E3E3] block">24-Hour Military Format</span>
                    <span className="text-[10px] text-[#838383]">Displays 18:30 instead of 6:30 PM</span>
                  </div>
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setMilitaryTime(!militaryTime);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                      militaryTime
                        ? 'bg-[#337EA9] border-[#337EA9] text-white'
                        : 'bg-[#191919] border-[#373737] text-[#838383]'
                    }`}
                  >
                    {militaryTime ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1.5 rounded border border-[#373737] text-xs text-[#838383] hover:text-[#E3E3E3]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('staples');
                }}
                className="px-4 py-2 bg-[#252525] hover:bg-[#2c2c2c] border border-[#373737] rounded text-xs font-semibold text-[#E3E3E3] flex items-center gap-1.5"
              >
                <span>Proceed to Staple Meals</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#337EA9]" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: STAPLE MEALS */}
        {activeTab === 'staples' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="notion-callout">
              <Utensils className="w-4 h-4 text-[#446B5E] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#838383]">
                <strong className="text-[#E3E3E3]">3x3 Friction-Killer Staples:</strong> Lock in 3 effortless meals for
                Breakfast, Lunch, and Dinner. These are your "zero-negotiation" choices. You do not wonder what to eat;
                you tap one and consume it.
              </div>
            </div>

            {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealSlot) => (
              <div key={mealSlot} className="notion-panel p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#373737] pb-2">
                  <h3 className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#446B5E]" />
                    <span>{mealSlot} Staples</span>
                  </h3>
                  <span className="text-[10px] text-[#838383] font-mono">3 Frictionless Options</span>
                </div>

                <div className="space-y-2.5">
                  {staples[mealSlot]?.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-[#191919] border border-[#373737] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#838383] font-semibold w-4">#{idx + 1}</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const copy = { ...staples };
                            copy[mealSlot][idx].name = e.target.value;
                            setStaples(copy);
                          }}
                          className="flex-1 bg-[#202020] border border-[#373737] rounded px-2 py-1 text-xs text-[#E3E3E3] font-medium"
                          placeholder="Staple name"
                        />
                        <div className="flex items-center gap-1 text-[11px] text-[#838383]">
                          <span>Prep:</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={item.preparationMinutes || 4}
                            onChange={(e) => {
                              const copy = { ...staples };
                              copy[mealSlot][idx].preparationMinutes = parseInt(e.target.value) || 4;
                              setStaples(copy);
                            }}
                            className="w-12 bg-[#202020] border border-[#373737] rounded px-1.5 py-1 text-xs text-center text-[#E3E3E3]"
                          />
                          <span>min</span>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const copy = { ...staples };
                          copy[mealSlot][idx].description = e.target.value;
                          setStaples(copy);
                        }}
                        className="w-full bg-[#202020] border border-[#373737] rounded px-2 py-1 text-[11px] text-[#838383]"
                        placeholder="Quick ingredients & execution notes..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-3 py-1.5 rounded border border-[#373737] text-xs text-[#838383] hover:text-[#E3E3E3]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('chores');
                }}
                className="px-4 py-2 bg-[#252525] hover:bg-[#2c2c2c] border border-[#373737] rounded text-xs font-semibold text-[#E3E3E3] flex items-center gap-1.5"
              >
                <span>Proceed to Household Chores</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#337EA9]" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: HOUSEHOLD CHORES */}
        {activeTab === 'chores' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="notion-callout">
              <CheckSquare className="w-4 h-4 text-[#D9730D] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#838383]">
                <strong className="text-[#E3E3E3]">Household Maintenance Anchors:</strong> Unprompted chores eliminate
                domestic friction. The core non-negotiable standard is: <em>Zero dirty dishes left in the sink overnight</em>,
                counters wiped, and tomorrow staged.
              </div>
            </div>

            {/* List of Chores grouped by slot */}
            <div className="notion-panel p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#373737] pb-2">
                <h3 className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider">
                  Configured Daily Chores ({chores.length})
                </h3>
              </div>

              {(['morning', 'midday', 'evening'] as const).map((slot) => {
                const slotChores = chores.filter((c) => c.slot === slot);
                return (
                  <div key={slot} className="space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#838383] block">
                      {slot} Slot
                    </span>
                    <div className="space-y-1.5">
                      {slotChores.length === 0 ? (
                        <div className="text-[11px] text-[#838383]/60 italic p-2 border border-dashed border-[#373737] rounded">
                          No chores configured for {slot}.
                        </div>
                      ) : (
                        slotChores.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded bg-[#191919] border border-[#373737] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D9730D]" />
                              <span className="text-[#E3E3E3] font-medium">{c.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#838383] font-mono">
                                ~{c.estimatedSeconds || 60}s
                              </span>
                              <button
                                onClick={() => handleDeleteChore(c.id)}
                                className="text-[#838383] hover:text-[#D9730D] p-1 transition-colors"
                                title="Remove Chore"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Custom Chore Bar */}
              <div className="border-t border-[#373737] pt-3 space-y-2">
                <span className="text-[11px] font-semibold text-[#E3E3E3] block">Add Custom Habit Chore</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    value={newChoreTitle}
                    onChange={(e) => setNewChoreTitle(e.target.value)}
                    placeholder="e.g. Wipe bathroom sink & mirror"
                    className="sm:col-span-2 bg-[#191919] border border-[#373737] rounded px-2.5 py-1.5 text-xs text-[#E3E3E3]"
                  />
                  <select
                    value={newChoreSlot}
                    onChange={(e) => setNewChoreSlot(e.target.value as any)}
                    className="bg-[#191919] border border-[#373737] rounded px-2 py-1.5 text-xs text-[#E3E3E3]"
                  >
                    <option value="morning">Morning</option>
                    <option value="midday">Midday</option>
                    <option value="evening">Evening</option>
                  </select>
                  <button
                    onClick={handleAddChore}
                    className="px-3 py-1.5 bg-[#252525] hover:bg-[#2e2e2e] border border-[#373737] rounded text-xs font-semibold text-[#E3E3E3] flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#446B5E]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setActiveTab('staples')}
                className="px-3 py-1.5 rounded border border-[#373737] text-xs text-[#838383] hover:text-[#E3E3E3]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('account');
                }}
                className="px-4 py-2 bg-[#252525] hover:bg-[#2c2c2c] border border-[#373737] rounded text-xs font-semibold text-[#E3E3E3] flex items-center gap-1.5"
              >
                <span>Proceed to Account & Sync</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#337EA9]" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNT & SYNC */}
        {activeTab === 'account' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="notion-callout">
              <Cloud className="w-4 h-4 text-[#337EA9] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#838383]">
                <strong className="text-[#E3E3E3]">Google Account Synchronization:</strong> All prerequisites,
                daily meal logs, chores, proactive gestures, and nightly audits are automatically tied to your Google
                account. No manual database setup, project URLs, or API keys are required.
              </div>
            </div>

            <div className="notion-panel p-4 space-y-4">
              <div className="border-b border-[#373737] pb-3">
                <span className="text-xs font-semibold text-[#E3E3E3] uppercase tracking-wider block">
                  Active Operator Account
                </span>
                <span className="text-[11px] text-[#838383]">
                  Connected via Google Sign-In
                </span>
              </div>

              <div className="p-3 rounded bg-[#191919] border border-[#373737] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#838383]">Email:</span>
                  <span className="font-mono text-[#E3E3E3]">{userProfile.email || 'suriya.thittani@gmail.com'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#838383]">Operator:</span>
                  <span className="font-medium text-[#E3E3E3]">{userProfile.name || 'Suriya'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#838383]">Data Architecture:</span>
                  <span className="text-[#446B5E] font-medium">Local-First (Dexie IndexedDB) + Auto-Sync</span>
                </div>
              </div>

              {/* Reset / Clean Historical Data Section */}
              <div className="border-t border-[#373737] pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#E3E3E3] block">
                      Historical Ledger Clean Slate
                    </span>
                    <span className="text-[11px] text-[#838383]">
                      Purge previous test entries, meal logs, audits, and gestures to start with an empty history.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Clear all historical meal logs, audits, chores history, and gestures? Baseline prerequisites will be preserved.')) {
                        StorageService.clearAllHistoricalData();
                        await clearAllHistoricalDataFromDatabase();
                        playSound('execute', soundEnabled);
                        setSaveFeedback({ type: 'success', message: 'Historical ledger cleared! Fresh start ready.' });
                      }
                    }}
                    className="px-3 py-1.5 bg-[#252525] hover:bg-[#2b1f1f] hover:border-[#8b2e2e] border border-[#373737] rounded text-xs text-[#D9730D] flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe Historical Data</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('chores')}
                className="px-3 py-1.5 rounded border border-[#373737] text-xs text-[#838383] hover:text-[#E3E3E3]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Save &amp; Lock In Prerequisites</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Status Feedback */}
        {saveFeedback && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              saveFeedback.type === 'success'
                ? 'bg-[#2B593F]/20 border-[#2B593F] text-[#446B5E]'
                : 'bg-[#D9730D]/20 border-[#D9730D] text-[#D9730D]'
            }`}
          >
            {saveFeedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
        )}

        {/* Final Execution / Save Action Bar */}
        <div className="p-4 rounded-lg bg-[#202020] border border-[#373737] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#E3E3E3] block">
                Lock In Baseline Prerequisites
              </span>
              <span className="text-[11px] text-[#838383]">
                Stores your profile, anchors, staples, chores & cloud keys permanently.
              </span>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#446B5E] hover:bg-[#3b5d52] disabled:opacity-50 text-white rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Locking In Prerequisites...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>Save & Lock In All Prerequisites</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
