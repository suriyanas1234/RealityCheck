import { ScheduleBlock } from '@/types';

export function getTodayString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(d: Date, military: boolean = false): string {
  return d.toLocaleTimeString([], {
    hour12: !military,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTimeShort(d: Date, military: boolean = false): string {
  return d.toLocaleTimeString([], {
    hour12: !military,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseMinutesFromTimeString(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function getCurrentAndNextBlock(
  blocks: ScheduleBlock[],
  now: Date = new Date()
): {
  currentBlock: ScheduleBlock;
  nextBlock: ScheduleBlock;
  minutesRemainingInBlock: number;
  minutesToNext: number;
} {
  if (!blocks || blocks.length === 0) {
    const fallback: ScheduleBlock = {
      id: 'fallback',
      title: 'Active Operating Block',
      time: '08:00',
      displayTime: '8:00 AM',
      category: 'wake',
      description: 'Standard protocol block.',
      actionPrompt: 'Focus on current objective.',
    };
    return {
      currentBlock: fallback,
      nextBlock: fallback,
      minutesRemainingInBlock: 0,
      minutesToNext: 0,
    };
  }

  // Sort blocks by time ascending
  const sorted = [...blocks].sort((a, b) => parseMinutesFromTimeString(a.time) - parseMinutesFromTimeString(b.time));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let activeIdx = 0;

  for (let i = 0; i < sorted.length; i++) {
    const blockMin = parseMinutesFromTimeString(sorted[i].time);
    if (currentMinutes >= blockMin) {
      activeIdx = i;
    } else {
      break;
    }
  }

  // If before the first block of the day, current is the last block of previous cycle (night)
  if (currentMinutes < parseMinutesFromTimeString(sorted[0].time)) {
    activeIdx = sorted.length - 1;
  }

  const currentBlock = sorted[activeIdx];
  const nextIdx = (activeIdx + 1) % sorted.length;
  const nextBlock = sorted[nextIdx];

  const nextBlockMinutes = parseMinutesFromTimeString(nextBlock.time);
  let minutesToNext: number;
  if (nextIdx > activeIdx) {
    minutesToNext = nextBlockMinutes - currentMinutes;
  } else {
    // Next block is tomorrow
    minutesToNext = 24 * 60 - currentMinutes + nextBlockMinutes;
  }

  return {
    currentBlock,
    nextBlock,
    minutesRemainingInBlock: Math.max(0, minutesToNext),
    minutesToNext: Math.max(0, minutesToNext),
  };
}

export function formatMinutesCountdown(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${mins}m`;
}

export function getPastNDays(n: number = 30): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(getTodayString(d));
  }
  return dates;
}

export function formatFriendlyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getDayDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffTime = Math.abs(b.getTime() - a.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
