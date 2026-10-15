'use client';

import React, { useState } from 'react';
import { ProactiveGestureLog, RelationshipContact } from '@/types';
import { playSound } from '@/lib/sound';
import { getDayDifference, getTodayString } from '@/lib/date-utils';
import {
  Heart,
  Plus,
  ShieldAlert,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  PhoneCall,
  Gift
} from 'lucide-react';

interface RelationshipTrackerProps {
  contacts: RelationshipContact[];
  gestures: ProactiveGestureLog[];
  soundEnabled: boolean;
  onLogGesture: (gesture: Omit<ProactiveGestureLog, 'id' | 'timestamp'>) => {
    success: boolean;
    error?: string;
  };
  onDeleteGesture: (id: string) => void;
}

export const RelationshipTracker: React.FC<RelationshipTrackerProps> = ({
  contacts,
  gestures,
  soundEnabled,
  onLogGesture,
  onDeleteGesture,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id || 'contact-gf');
  const [gestureType, setGestureType] = useState('Unprompted Gesture / Flowers');
  const [details, setDetails] = useState('');
  
  // CRITICAL RULE ENFORCEMENT STATE
  // null = not answered yet, false = unprompted (valid), true = prompted (INVALID!)
  const [wasPrompted, setWasPrompted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = getTodayString();

  const handleOpenModal = (contactId?: string) => {
    playSound('click', soundEnabled);
    if (contactId) setSelectedContactId(contactId);
    setWasPrompted(null);
    setDetails('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (wasPrompted === null) {
      setErrorMessage('Rule Enforcement Check required: You must declare if this was prompted.');
      playSound('error', soundEnabled);
      return;
    }

    if (wasPrompted === true) {
      setErrorMessage(
        'RULE ENFORCEMENT VIOLATION: Prompted gestures do not count toward proactive discipline. Only unprompted initiative builds trust and autonomy.'
      );
      playSound('error', soundEnabled);
      return;
    }

    const contact = contacts.find((c) => c.id === selectedContactId);
    const result = onLogGesture({
      recipientId: selectedContactId,
      recipientName: contact ? contact.name : 'Contact',
      date: today,
      gestureType,
      details: details.trim() || 'Unprompted proactive gesture executed.',
      wasPrompted: false,
    });

    if (result.success) {
      playSound('execute', soundEnabled);
      setIsModalOpen(false);
      setDetails('');
      setWasPrompted(null);
      setErrorMessage(null);
    } else {
      playSound('error', soundEnabled);
      setErrorMessage(result.error || 'Failed to record gesture.');
    }
  };

  // Helper to calculate days since last unprompted gesture for a contact
  const getContactHealth = (contact: RelationshipContact) => {
    const contactGestures = gestures
      .filter((g) => g.recipientId === contact.id && !g.wasPrompted)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (contactGestures.length === 0) {
      return {
        lastGestureDate: null,
        daysAgo: 999,
        isOverdue: true,
        statusText: 'No verified initiative logged yet',
      };
    }

    const last = contactGestures[0];
    const daysAgo = getDayDifference(last.date, today);
    const isOverdue = daysAgo >= contact.cadenceDays;

    return {
      lastGestureDate: last.date,
      daysAgo,
      isOverdue,
      statusText: `${daysAgo} day${daysAgo === 1 ? '' : 's'} since last unprompted initiative`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-800 text-rose-400">
                <Heart className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-base font-bold tracking-tight text-zinc-100 uppercase">
                Proactive Relationship & Initiative Tracker
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Unprompted gestures & smart recurring cadences for Mother & Girlfriend. Strict zero-prompt enforcement.
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded font-mono text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>LOG INITIATIVE</span>
          </button>
        </div>

        {/* Philosophy Callout Banner */}
        <div className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800/80 text-xs font-mono flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-zinc-300 font-semibold uppercase tracking-wider block">
              Core Principle: Prompted Action ≠ Leadership
            </span>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              If you took action because she texted, sighed, asked, or hinted, it is reactive maintenance, not proactive initiative. The system programmatically refuses to count prompted gestures. Take the lead before anyone has to ask.
            </p>
          </div>
        </div>

        {/* Contact Cadence Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => {
            const health = getContactHealth(contact);
            const isGf = contact.relationship === 'girlfriend';

            return (
              <div
                key={contact.id}
                className={`border rounded-lg p-4 bg-zinc-950/70 ${
                  health.isOverdue
                    ? 'border-amber-900/60'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase">
                      {contact.name}
                    </h3>
                  </div>

                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                      health.isOverdue
                        ? 'bg-amber-950/60 border border-amber-800/60 text-amber-400'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {health.isOverdue ? 'ACTION DUE' : 'CADENCE NOMINAL'}
                  </span>
                </div>

                {/* Specific Cadence Details */}
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] text-zinc-500">Recurring Protocol:</span>
                    <span className="text-zinc-300 font-medium">{contact.reminderTitle}</span>
                  </div>

                  {isGf && (
                    <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50 text-[11px] text-zinc-400">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Bi-Weekly Date Night Trigger:</span>
                        <span className="text-emerald-400">Every 2 Weeks (Monday)</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Lock in Friday reservations/itinerary on Monday so she never has to ask "what are we doing?"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-zinc-400 pt-1">
                    <span className="text-[11px] text-zinc-500">Cadence Window:</span>
                    <span className="text-zinc-300">Every {contact.cadenceDays} days</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] text-zinc-500">Elapsed Status:</span>
                    <span className={health.isOverdue ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      {health.statusText}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {health.lastGestureDate ? `Last: ${health.lastGestureDate}` : 'No verified logs'}
                  </span>
                  <button
                    onClick={() => handleOpenModal(contact.id)}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    + Log Unprompted Action
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Gesture History Log */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-mono text-xs tracking-wider text-zinc-400 uppercase font-semibold">
            Verified Unprompted Gestures Log
          </h3>
          <span className="font-mono text-[11px] text-zinc-500">
            {gestures.length} total logged
          </span>
        </div>

        {gestures.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-zinc-500">
            No unprompted gestures logged yet. Take the initiative today without waiting to be asked.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-zinc-800/60 font-mono text-xs">
            {gestures.slice(0, 8).map((gesture) => (
              <div
                key={gesture.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-900/40 px-2 rounded transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                      {gesture.recipientName}
                    </span>
                    <span className="text-zinc-200 font-medium">
                      {gesture.gestureType}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-1 rounded">
                      [UNPROMPTED]
                    </span>
                  </div>
                  {gesture.details && (
                    <p className="text-zinc-400 text-[11px] pl-0.5">
                      {gesture.details}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-zinc-500 text-[11px] self-end sm:self-center">
                  <span>{gesture.date}</span>
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onDeleteGesture(gesture.id);
                    }}
                    className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                    title="Remove record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STRICT RULE ENFORCEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-2xl relative font-mono">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Record Proactive Initiative
                </h3>
              </div>
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setIsModalOpen(false);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                [ESC]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Recipient Selector */}
              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1.5 font-semibold">
                  Recipient
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {contacts.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setSelectedContactId(c.id);
                      }}
                      className={`p-2.5 rounded border text-left flex items-center justify-between ${
                        selectedContactId === c.id
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-[10px] text-zinc-500 capitalize">{c.relationship}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gesture Type */}
              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1.5 font-semibold">
                  Initiative Type
                </label>
                <select
                  value={gestureType}
                  onChange={(e) => setGestureType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="Unprompted Gesture / Flowers">Unprompted Flowers / Surprise Gift</option>
                  <option value="Plan Friday Date Night">Plan Friday Date Night (Reservations & Itinerary)</option>
                  <option value="Unprompted Call / Check-in">Unprompted Call / Check-in</option>
                  <option value="Fixed Household Issue Unprompted">Fixed Household Chore / Issue Without Asking</option>
                  <option value="Favorite Snack / Coffee Delivery">Brought Favorite Coffee / Snack Without Request</option>
                  <option value="Appreciation Note / Letter">Handwritten Appreciation Note</option>
                  <option value="Other Proactive Action">Other Independent Proactive Action</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1.5 font-semibold">
                  Action Summary / Notes
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g., Booked the Italian bistro for Friday 7:30pm and ordered her favorite flowers without asking."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* CRITICAL RULE ENFORCEMENT SECTION */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandatory Rule Verification Check</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-tight">
                  Was this gesture triggered in response to a text, hint, question, reminder, or request from her?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setWasPrompted(false);
                      setErrorMessage(null);
                    }}
                    className={`p-2 rounded border text-left transition-all ${
                      wasPrompted === false
                        ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full border ${wasPrompted === false ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600'}`} />
                      <span>NO — 100% Unprompted</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1 pl-4">
                      My independent initiative
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('error', soundEnabled);
                      setWasPrompted(true);
                      setErrorMessage(
                        'RULE ENFORCEMENT FAILED: Prompted gestures do not count toward proactive discipline. Only unprompted initiative builds trust and autonomy.'
                      );
                    }}
                    className={`p-2 rounded border text-left transition-all ${
                      wasPrompted === true
                        ? 'bg-rose-950/40 border-rose-600 text-rose-300 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full border ${wasPrompted === true ? 'bg-rose-500 border-rose-400' : 'border-zinc-600'}`} />
                      <span>YES — Prompted or Hinted</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1 pl-4">
                      She asked / reminded me
                    </span>
                  </button>
                </div>

                {/* If Prompted -> Objective Lockout Notice */}
                {wasPrompted === true && (
                  <div className="mt-2 p-2.5 rounded bg-rose-950/30 border border-rose-800/60 text-rose-400 text-[11px] leading-relaxed">
                    <strong>DISQUALIFIED FROM PROACTIVE LOG:</strong>
                    <br />
                    Prompted actions are reactive compliance, not proactive initiative. While fulfilling requests is respectful, this system only records autonomous, self-generated initiatives that surprise and protect trust.
                  </div>
                )}
              </div>

              {errorMessage && wasPrompted !== true && (
                <div className="p-2 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded">
                  {errorMessage}
                </div>
              )}

              {/* Submit Cluster */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-800 text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={wasPrompted !== false}
                  className={`px-4 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition-all ${
                    wasPrompted === false
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    wasPrompted === true
                      ? 'Action blocked by Rule Enforcement'
                      : wasPrompted === null
                      ? 'Verify rule prompt above first'
                      : 'Log Proactive Gesture'
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RECORD INITIATIVE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
