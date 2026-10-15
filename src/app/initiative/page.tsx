'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbGesture, DbCadence, seedDatabaseIfEmpty } from '@/lib/db';
import { getTodayString, getDayDifference } from '@/lib/date-utils';
import { TopHeader } from '@/components/TopHeader';
import { playSound } from '@/lib/sound';
import {
  HeartHandshake,
  ShieldAlert,
  Calendar,
  Check,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function InitiativeHub() {
  const [mounted, setMounted] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  
  // Modal / Entry Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipient, setRecipient] = useState<'partner' | 'mother' | 'custom'>('partner');
  const [recipientName, setRecipientName] = useState('Partner');
  const [actionTitle, setActionTitle] = useState('Complete Date Planned (Activity + Food + Logistics)');
  const [details, setDetails] = useState('');
  
  // Mandatory Binary Check: Was this prompted?
  // null = unanswered, false = unprompted (valid), true = prompted (reactive!)
  const [wasPrompted, setWasPrompted] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    seedDatabaseIfEmpty();
    setTodayDate(getTodayString());
    setMounted(true);
  }, []);

  const cadences = useLiveQuery(() => db.cadences.toArray(), []);
  const gestures = useLiveQuery(
    () => db.gestures.orderBy('timestamp').reverse().toArray(),
    []
  );

  const proactiveCount = gestures?.filter((g) => g.isProactive).length || 0;
  const reactiveCount = gestures?.filter((g) => !g.isProactive).length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wasPrompted === null) {
      setErrorMsg('Mandatory Initiative Check: You must declare if this was prompted.');
      playSound('error', true);
      return;
    }

    const isProactive = !wasPrompted;
    const now = new Date();

    await db.gestures.put({
      id: `gesture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: todayDate,
      timestamp: now.toISOString(),
      recipient,
      recipientName: recipient === 'partner' ? 'Partner' : recipient === 'mother' ? 'Mother' : recipientName,
      action: actionTitle,
      details: details.trim() || undefined,
      wasPrompted,
      isProactive,
    });

    // Update cadence lastCompletedDate if applicable
    if (recipient === 'partner') {
      const match = cadences?.find((c) => c.recipient === 'Partner');
      if (match) {
        await db.cadences.update(match.id, { lastCompletedDate: todayDate });
      }
    } else if (recipient === 'mother') {
      const match = cadences?.find((c) => c.recipient === 'Mother');
      if (match) {
        await db.cadences.update(match.id, { lastCompletedDate: todayDate });
      }
    }

    playSound(isProactive ? 'execute' : 'click', true);
    setIsModalOpen(false);
    setDetails('');
    setWasPrompted(null);
    setErrorMsg(null);
  };

  const handleDeleteGesture = async (id: string) => {
    playSound('click', true);
    await db.gestures.delete(id);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#838383] flex items-center justify-center text-xs">
        <span>Loading Initiative Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3]">
      <TopHeader pageTitle="Initiative Engine" icon="🤝" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Notion Page Header */}
        <div>
          <div className="text-4xl mb-2 select-none">🤝</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E3E3E3]">
            Relationships &amp; Initiative Engine
          </h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            Proactive Ledger • Zero-Prompt Leadership Cadences
          </p>
          <div className="h-px bg-[#373737] w-full mt-4" />
        </div>

        {/* Notion Callout Box */}
        <div className="notion-callout">
          <span className="text-base select-none">🛡️</span>
          <div className="text-xs leading-relaxed text-[#CCCCCC]">
            <span className="font-semibold text-[#E3E3E3] block mb-0.5">
              The Initiative Rule
            </span>
            If you took action because she texted, sighed, asked, or hinted, it is reactive maintenance, not leadership. Only 100% unprompted, proactive initiative counts toward trust and autonomy metrics.
          </div>
        </div>

        {/* Cadence Cards (Bi-Weekly Partner Date & Gestures, Mom Check-in) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
              Automated Cadence Prompts
            </h3>
            <button
              onClick={() => {
                setWasPrompted(null);
                setDetails('');
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1 bg-[#202020] hover:bg-[#282828] border border-[#373737] rounded text-xs text-[#337EA9] font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Action</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cadences?.map((cadence) => {
              const daysAgo = cadence.lastCompletedDate
                ? getDayDifference(cadence.lastCompletedDate, todayDate)
                : 999;
              const isDue = daysAgo >= cadence.cadenceDays;

              return (
                <div
                  key={cadence.id}
                  className={`notion-panel p-4 transition-all ${
                    isDue ? 'border-l-4 border-l-[#D9730D]' : 'border-l-4 border-l-[#2B593F]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#191919] border border-[#373737] text-[#838383]">
                          {cadence.recipient}
                        </span>
                        <h4 className="text-sm font-semibold text-[#E3E3E3]">{cadence.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#838383] mt-1.5 leading-snug">
                        {cadence.instructions}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold shrink-0 ${
                        isDue
                          ? 'bg-[#291f15] border border-[#523215] text-[#D9730D]'
                          : 'bg-[#1e2f26] border border-[#2B593F] text-[#446B5E]'
                      }`}
                    >
                      {isDue ? 'Action Due' : 'Nominal'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#373737] flex items-center justify-between text-[11px] font-mono text-[#838383]">
                    <span>Cadence: Every {cadence.cadenceDays} days</span>
                    <span>
                      {cadence.lastCompletedDate
                        ? `Last: ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
                        : 'No logs yet'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proactive Ledger (Log of Proactive vs Reactive actions) */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#373737]">
            <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
              Initiative Ledger
            </h3>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#446B5E]">{proactiveCount} Proactive</span>
              <span className="text-[#4D4D4D]">•</span>
              <span className="text-[#838383]">{reactiveCount} Reactive</span>
            </div>
          </div>

          {gestures?.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#838383]">
              No initiative records yet. Log your first unprompted gesture.
            </div>
          ) : (
            <div className="divide-y divide-[#373737] text-xs">
              {gestures?.map((g) => (
                <div key={g.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#202020] border border-[#373737] text-[#838383]">
                        {g.recipientName}
                      </span>
                      <span className="font-medium text-[#E3E3E3]">{g.action}</span>
                      
                      {/* Proactive vs Reactive Badge */}
                      {g.isProactive ? (
                        <span className="text-[10px] font-mono text-[#446B5E] bg-[#1e2f26] border border-[#2B593F] px-1.5 rounded">
                          Proactive
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#838383] bg-[#252525] border border-[#373737] px-1.5 rounded line-through">
                          Reactive (Prompted)
                        </span>
                      )}
                    </div>

                    {g.details && (
                      <p className="text-[11px] text-[#838383] mt-1 pl-0.5 leading-snug">
                        {g.details}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#838383] self-end sm:self-center">
                    <span>{g.date}</span>
                    <button
                      onClick={() => handleDeleteGesture(g.id)}
                      className="text-[#838383] hover:text-[#EB5757] transition-colors p-1"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Mandatory Initiative Check Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="notion-panel bg-[#202020] border border-[#373737] rounded-lg max-w-lg w-full p-5 shadow-2xl relative text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#373737]">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#337EA9]" />
                <h3 className="text-sm font-semibold text-[#E3E3E3]">
                  Record Action in Ledger
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#838383] hover:text-[#E3E3E3]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-[#838383] text-[10px] uppercase font-semibold mb-1">
                  Recipient
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipient('partner');
                      setRecipientName('Partner');
                      setActionTitle('Complete Date Planned (Activity + Food + Logistics)');
                    }}
                    className={`p-2 rounded border text-left ${
                      recipient === 'partner'
                        ? 'bg-[#252525] border-[#838383] text-[#E3E3E3]'
                        : 'bg-[#191919] border-[#373737] text-[#838383]'
                    }`}
                  >
                    <span className="font-medium block">Partner</span>
                    <span className="text-[10px] text-[#838383]">Date / Gestures / Chores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipient('mother');
                      setRecipientName('Mother');
                      setActionTitle('Unprompted Check-in Call');
                    }}
                    className={`p-2 rounded border text-left ${
                      recipient === 'mother'
                        ? 'bg-[#252525] border-[#838383] text-[#E3E3E3]'
                        : 'bg-[#191919] border-[#373737] text-[#838383]'
                    }`}
                  >
                    <span className="font-medium block">Mother</span>
                    <span className="text-[10px] text-[#838383]">Call / Check-in</span>
                  </button>
                </div>
              </div>

              {/* Action Description */}
              <div>
                <label className="block text-[#838383] text-[10px] uppercase font-semibold mb-1">
                  Action Title
                </label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] focus:outline-none focus:border-[#337EA9]"
                  required
                />
              </div>

              {/* Details */}
              <div>
                <label className="block text-[#838383] text-[10px] uppercase font-semibold mb-1">
                  Execution Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Booked table at 7:30pm and ordered her favorite flowers without asking."
                  className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
                />
              </div>

              {/* MANDATORY BINARY TOGGLE: Was this prompted? */}
              <div className="p-3.5 rounded bg-[#191919] border border-[#373737] space-y-2">
                <span className="text-[11px] font-semibold text-[#E3E3E3] block">
                  Mandatory Initiative Verification Check:
                </span>
                <p className="text-[11px] text-[#838383] leading-snug">
                  Was this requested or prompted by a text, hint, sigh, or reminder beforehand?
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', true);
                      setWasPrompted(false);
                      setErrorMsg(null);
                    }}
                    className={`p-2 rounded border text-left transition-colors ${
                      wasPrompted === false
                        ? 'bg-[#1e2f26] border-[#2B593F] text-[#446B5E] font-semibold'
                        : 'bg-[#202020] border-[#373737] text-[#838383]'
                    }`}
                  >
                    <span>NO — 100% Unprompted</span>
                    <span className="text-[10px] block opacity-80">Proactive Initiative</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', true);
                      setWasPrompted(true);
                      setErrorMsg(null);
                    }}
                    className={`p-2 rounded border text-left transition-colors ${
                      wasPrompted === true
                        ? 'bg-[#252525] border-[#838383] text-[#E3E3E3] font-semibold'
                        : 'bg-[#202020] border-[#373737] text-[#838383]'
                    }`}
                  >
                    <span>YES — She Asked / Hinted</span>
                    <span className="text-[10px] block opacity-80">Mark as Reactive</span>
                  </button>
                </div>

                {wasPrompted === true && (
                  <p className="text-[10px] text-[#D9730D] pt-1">
                    Note: Prompted gestures will be categorized as "Reactive Maintenance" rather than "Proactive Initiative."
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="text-[11px] text-[#D9730D]">{errorMsg}</div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#373737]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-[#838383] hover:text-[#E3E3E3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={wasPrompted === null}
                  className={`px-4 py-1.5 rounded font-medium text-white transition-colors ${
                    wasPrompted !== null
                      ? 'bg-[#337EA9] hover:bg-[#286a91]'
                      : 'bg-[#252525] text-[#838383] cursor-not-allowed'
                  }`}
                >
                  Record in Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
