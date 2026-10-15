import {
  AppSettings,
  ChoreItem,
  MealLog,
  MealType,
  NightlyAuditRecord,
  PrerequisitesPayload,
  ProactiveGestureLog,
  RelationshipContact,
  ScheduleBlock,
  StapleMeal,
  UserProfile,
} from '@/types';
import { getTodayString } from './date-utils';
import { upsertLocalUserProfile } from './db';

export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  {
    id: 'block-wake',
    title: 'WAKE UP ANCHOR',
    time: '08:00',
    displayTime: '8:00 AM',
    category: 'wake',
    description: 'Feet on floor immediately. No phone in bed. 500ml water + morning light.',
    actionPrompt: 'Execute morning sink check & hydrate.',
  },
  {
    id: 'block-breakfast',
    title: 'BREAKFAST ANCHOR',
    time: '08:30',
    displayTime: '8:30 AM',
    category: 'meal',
    description: 'Fuel within 30 min of wake. Zero negotiation, 1-tap staple plate.',
    actionPrompt: 'Select 1-tap staple breakfast & consume without delay.',
    isMealAnchor: true,
    mealType: 'breakfast',
  },
  {
    id: 'block-lunch',
    title: 'LUNCH ANCHOR',
    time: '13:00',
    displayTime: '1:00 PM',
    category: 'meal',
    description: 'Midday reset. Complete physical separation from workstation for 30 minutes.',
    actionPrompt: 'Step away from screen. Eat staple lunch.',
    isMealAnchor: true,
    mealType: 'lunch',
  },
  {
    id: 'block-dinner',
    title: 'DINNER ANCHOR',
    time: '18:30',
    displayTime: '6:30 PM',
    category: 'meal',
    description: 'Evening fuel & cognitive cutoff. Mark conclusion of reactive work.',
    actionPrompt: 'Eat staple dinner. Transition to evening scan.',
    isMealAnchor: true,
    mealType: 'dinner',
  },
  {
    id: 'block-winddown',
    title: 'WIND-DOWN ANCHOR',
    time: '22:30',
    displayTime: '10:30 PM',
    category: 'sleep',
    description: 'Screens dimmed. Environment reset. Complete 2-minute nightly objective audit.',
    actionPrompt: 'Run 2-minute audit & execute evening reset.',
  },
];

export const DEFAULT_STAPLES: Record<MealType, StapleMeal[]> = {
  breakfast: [
    {
      id: 'bf-1',
      name: 'Quick Plate',
      description: '3 Scrambled eggs + sliced avocado + pinch of salt/pepper',
      proteinGrams: 22,
      preparationMinutes: 4,
    },
    {
      id: 'bf-2',
      name: 'Protein / Toast',
      description: 'Greek yogurt cup + 2 whole grain sourdough toasts w/ peanut butter',
      proteinGrams: 28,
      preparationMinutes: 2,
    },
    {
      id: 'bf-3',
      name: 'Simple Rice / Dal',
      description: 'Pre-steamed jasmine rice + spiced yellow lentil dal + chili oil',
      proteinGrams: 16,
      preparationMinutes: 3,
    },
  ],
  lunch: [
    {
      id: 'lu-1',
      name: 'Quick Plate',
      description: 'Pre-cooked roasted chicken breast + pre-washed baby spinach + olive oil',
      proteinGrams: 35,
      preparationMinutes: 3,
    },
    {
      id: 'lu-2',
      name: 'Protein & Toast / Wrap',
      description: 'Tuna or turkey salad wrap with greens & mustard',
      proteinGrams: 32,
      preparationMinutes: 5,
    },
    {
      id: 'lu-3',
      name: 'Simple Rice / Dal',
      description: 'Warm basmati rice bowl + dal + fermented kimchi or steamed broccoli',
      proteinGrams: 18,
      preparationMinutes: 4,
    },
  ],
  dinner: [
    {
      id: 'di-1',
      name: 'Quick Plate',
      description: 'Pan-seared salmon fillet or beef patty + steamed broccoli florets',
      proteinGrams: 36,
      preparationMinutes: 7,
    },
    {
      id: 'di-2',
      name: 'Protein / Toast Bowl',
      description: 'Cottage cheese or bone broth bowl + toasted rustic bread + seeds',
      proteinGrams: 30,
      preparationMinutes: 3,
    },
    {
      id: 'di-3',
      name: 'Simple Rice / Dal',
      description: 'Hearty lentil dal + warm rice + pickled onion & cilantro',
      proteinGrams: 20,
      preparationMinutes: 4,
    },
  ],
};

export const DEFAULT_CHORES: ChoreItem[] = [
  {
    id: 'chore-morning-sink',
    title: 'Morning Sink Check',
    slot: 'morning',
    estimatedSeconds: 60,
    completedDates: {},
    isDefault: true,
  },
  {
    id: 'chore-morning-hydrate',
    title: '500ml Water + Morning Daylight',
    slot: 'morning',
    estimatedSeconds: 30,
    completedDates: {},
    isDefault: true,
  },
  {
    id: 'chore-midday-counter',
    title: 'Kitchen Counter Wipe',
    slot: 'midday',
    estimatedSeconds: 90,
    completedDates: {},
    isDefault: true,
  },
  {
    id: 'chore-midday-desk',
    title: 'Desk & Workspace Sweep (Zero Trash/Cups)',
    slot: 'midday',
    estimatedSeconds: 60,
    completedDates: {},
    isDefault: true,
  },
  {
    id: 'chore-evening-sink',
    title: 'Evening Sink Zero (Zero Dishes Before Sleep)',
    slot: 'evening',
    estimatedSeconds: 180,
    completedDates: {},
    isDefault: true,
  },
  {
    id: 'chore-evening-reset',
    title: 'Tomorrow Staged (Clothes & Water Ready)',
    slot: 'evening',
    estimatedSeconds: 120,
    completedDates: {},
    isDefault: true,
  },
];

export const DEFAULT_CONTACTS: RelationshipContact[] = [
  {
    id: 'contact-gf',
    name: 'Girlfriend',
    relationship: 'girlfriend',
    cadenceDays: 14,
    reminderTitle: 'Unprompted Gesture / Flowers & Date Planning',
    recurringDay: 'Monday', // Plan Friday Date Night every 2 weeks on Monday
  },
  {
    id: 'contact-mom',
    name: 'Mother',
    relationship: 'mother',
    cadenceDays: 3,
    reminderTitle: 'Unprompted Call / Check-in',
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  email: '',
  focusAreas: [],
  isOfflineOnly: false,
  partnerName: 'Partner',
  partnerCadenceDays: 14,
  partnerReminderNotes: 'Plan Friday Date Night every 2 weeks on Monday; surprise flowers & care',
  motherName: 'Mom',
  motherCadenceDays: 3,
  motherReminderNotes: 'Unprompted 20-min check-in call before she needs to remind you',
  anchors: {
    morningReset: '08:00',
    breakfast: '08:30',
    lunch: '13:00',
    eveningReset: '18:30',
    dayClosure: '22:30',
  },
  cadences: {
    partnerName: 'Partner',
    momName: 'Mom',
    dateIntervalDays: 14,
    gestureIntervalDays: 14,
    momCheckinIntervalDays: 3,
  },
  chores: [
    'Morning Sink Clear & Dry',
    'Kitchen Counter Sanitized',
    'Desk & Workspace Reset',
    'Evening Sink Zero',
  ],
  createdAt: new Date().toISOString(),
  onboarded: false,
  onboardingCompleted: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  militaryTime: false,
  staples: DEFAULT_STAPLES,
  contacts: DEFAULT_CONTACTS,
  scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
  userProfile: DEFAULT_USER_PROFILE,
};

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'reality_check_settings_v1',
  PROFILE: 'reality_check_profile_v1',
  MEAL_LOGS: 'reality_check_meals_v1',
  CHORES: 'reality_check_chores_v1',
  GESTURES: 'reality_check_gestures_v1',
  AUDITS: 'reality_check_audits_v1',
  INITIALIZED: 'reality_check_seeded_v1',
  ONBOARDED: 'reality_check_onboarded_v1',
};

export class StorageService {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Initial seed with 30-day realistic historical data if first load
  public static init(): void {
    if (!this.isBrowser()) return;
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.saveSettings(DEFAULT_SETTINGS);
      this.saveChores(DEFAULT_CHORES);

      // Generate realistic past 25 days of disciplined records for visual momentum
      const pastAudits: NightlyAuditRecord[] = [];
      const pastMeals: MealLog[] = [];
      const pastGestures: ProactiveGestureLog[] = [];
      const today = new Date();

      for (let i = 28; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getTodayString(d);

        // High compliance rate with occasional realistic miss
        const mealPass = i !== 12 && i !== 22;
        const chorePass = i !== 7;
        const composurePass = i !== 15 && i !== 3;

        pastAudits.push({
          id: `audit-${dateStr}`,
          date: dateStr,
          adheredToMealSchedule: mealPass,
          completedChoresUnprompted: chorePass,
          maintainedComposure: composurePass,
          objectiveObservation: !composurePass
            ? 'Noticed frustration spike during deadline rush. Paused instead of reacting verbally.'
            : undefined,
          completedAt: new Date(d.setHours(22, 45, 0, 0)).toISOString(),
        });

        // Seed meals
        pastMeals.push(
          {
            id: `meal-bf-${dateStr}`,
            date: dateStr,
            mealType: 'breakfast',
            stapleId: 'bf-1',
            loggedAt: new Date(d.setHours(8, 34, 0, 0)).toISOString(),
          },
          {
            id: `meal-lu-${dateStr}`,
            date: dateStr,
            mealType: 'lunch',
            stapleId: 'lu-1',
            loggedAt: new Date(d.setHours(13, 10, 0, 0)).toISOString(),
          },
          {
            id: `meal-di-${dateStr}`,
            date: dateStr,
            mealType: 'dinner',
            stapleId: 'di-3',
            loggedAt: new Date(d.setHours(18, 42, 0, 0)).toISOString(),
          }
        );
      }

      // Seed unprompted gestures
      pastGestures.push(
        {
          id: 'gesture-seed-1',
          recipientId: 'contact-gf',
          recipientName: 'Girlfriend',
          date: getTodayString(new Date(Date.now() - 4 * 86400000)),
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
          gestureType: 'Flowers / Favorite Treat',
          details: 'Brought home her favorite lilies and matcha without being prompted.',
          wasPrompted: false,
        },
        {
          id: 'gesture-seed-2',
          recipientId: 'contact-gf',
          recipientName: 'Girlfriend',
          date: getTodayString(new Date(Date.now() - 11 * 86400000)),
          timestamp: new Date(Date.now() - 11 * 86400000).toISOString(),
          gestureType: 'Planned Friday Date Night',
          details: 'Booked dinner table and pottery workshop in advance on Monday morning.',
          wasPrompted: false,
        },
        {
          id: 'gesture-seed-3',
          recipientId: 'contact-mom',
          recipientName: 'Mother',
          date: getTodayString(new Date(Date.now() - 2 * 86400000)),
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          gestureType: 'Unprompted Call',
          details: 'Called during evening walk just to ask how her garden is doing.',
          wasPrompted: false,
        }
      );

      this.saveAudits(pastAudits);
      this.saveMeals(pastMeals);
      this.saveGestures(pastGestures);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }

    // Ensure the Dexie user_profile mirror exists for cloud sync
    void upsertLocalUserProfile(
      this.getUserProfile() as unknown as Record<string, unknown>
    );
  }

  // Profile & Onboarding
  public static getUserProfile(): UserProfile {
    if (!this.isBrowser()) return DEFAULT_USER_PROFILE;
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      try {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    const settings = this.getSettings();
    if (settings.userProfile) {
      return settings.userProfile;
    }
    return DEFAULT_USER_PROFILE;
  }

  public static saveUserProfile(profile: UserProfile): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    const settings = this.getSettings();
    this.saveSettings({ ...settings, userProfile: profile });
    // Mirror into Dexie so the profile participates in cloud sync
    void upsertLocalUserProfile(profile as unknown as Record<string, unknown>);
  }

  public static isOnboarded(): boolean {
    if (!this.isBrowser()) return true;
    const onboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDED);
    if (onboarded === 'true') return true;
    const profile = this.getUserProfile();
    return !!profile.onboarded || !!profile.onboardingCompleted;
  }

  public static saveOnboardingProfile(profile: UserProfile): void {
    if (!this.isBrowser()) return;
    const completed: UserProfile = {
      ...profile,
      onboarded: true,
      onboardingCompleted: true,
      onboardedAt: profile.onboardedAt || new Date().toISOString(),
      createdAt: profile.createdAt || new Date().toISOString(),
    };
    this.saveUserProfile(completed);
    this.setOnboarded(true);
    void upsertLocalUserProfile(completed as unknown as Record<string, unknown>);
  }

  public static setOnboarded(val: boolean = true): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, val ? 'true' : 'false');
    const profile = this.getUserProfile();
    this.saveUserProfile({ ...profile, onboarded: val });
    void upsertLocalUserProfile({ ...profile, onboarded: val } as unknown as Record<string, unknown>);
  }

  public static getPrerequisitesPayload(): PrerequisitesPayload {
    const settings = this.getSettings();
    const profile = this.getUserProfile();
    const chores = this.getChores();
    return {
      profile,
      schedule: settings.scheduleBlocks,
      staples: settings.staples,
      chores,
      contacts: settings.contacts,
      militaryTime: settings.militaryTime,
      soundEnabled: settings.soundEnabled,
      supabaseConfig: settings.supabaseConfig,
    };
  }

  public static savePrerequisites(payload: PrerequisitesPayload): void {
    if (!this.isBrowser()) return;
    const updatedProfile: UserProfile = {
      ...payload.profile,
      onboarded: true,
      onboardedAt: payload.profile.onboardedAt || new Date().toISOString(),
    };
    this.saveUserProfile(updatedProfile);
    this.setOnboarded(true);
    void upsertLocalUserProfile(updatedProfile as unknown as Record<string, unknown>);

    const currentSettings = this.getSettings();
    const updatedSettings: AppSettings = {
      ...currentSettings,
      scheduleBlocks: payload.schedule || currentSettings.scheduleBlocks,
      staples: payload.staples || currentSettings.staples,
      contacts: payload.contacts || currentSettings.contacts,
      militaryTime: payload.militaryTime ?? currentSettings.militaryTime,
      soundEnabled: payload.soundEnabled ?? currentSettings.soundEnabled,
      supabaseConfig: payload.supabaseConfig ?? currentSettings.supabaseConfig,
      userProfile: updatedProfile,
    };
    this.saveSettings(updatedSettings);

    if (payload.chores && payload.chores.length > 0) {
      this.saveChores(payload.chores);
    }
  }

  // Settings
  public static getSettings(): AppSettings {
    if (!this.isBrowser()) return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: AppSettings): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // Meals
  public static getMeals(): MealLog[] {
    if (!this.isBrowser()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.MEAL_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveMeals(meals: MealLog[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.MEAL_LOGS, JSON.stringify(meals));
  }

  public static logMeal(date: string, mealType: MealType, stapleId?: string, customMealName?: string): MealLog {
    const meals = this.getMeals();
    // Check if meal already logged today for this type
    const existingIdx = meals.findIndex((m) => m.date === date && m.mealType === mealType);
    const newEntry: MealLog = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      mealType,
      stapleId,
      customMealName,
      loggedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      meals[existingIdx] = newEntry;
    } else {
      meals.push(newEntry);
    }

    this.saveMeals(meals);
    return newEntry;
  }

  public static removeMealLog(id: string): void {
    const meals = this.getMeals().filter((m) => m.id !== id);
    this.saveMeals(meals);
  }

  // Chores
  public static getChores(): ChoreItem[] {
    if (!this.isBrowser()) return DEFAULT_CHORES;
    const raw = localStorage.getItem(STORAGE_KEYS.CHORES);
    if (!raw) return DEFAULT_CHORES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CHORES;
    }
  }

  public static saveChores(chores: ChoreItem[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify(chores));
  }

  public static toggleChore(choreId: string, date: string): boolean {
    const chores = this.getChores();
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return false;

    if (!chore.completedDates) {
      chore.completedDates = {};
    }

    const wasCompleted = !!chore.completedDates[date];
    if (wasCompleted) {
      delete chore.completedDates[date];
    } else {
      chore.completedDates[date] = new Date().toISOString();
    }

    this.saveChores(chores);
    return !wasCompleted;
  }

  public static addChore(title: string, slot: 'morning' | 'midday' | 'evening'): ChoreItem {
    const chores = this.getChores();
    const newChore: ChoreItem = {
      id: `chore-${Date.now()}`,
      title,
      slot,
      estimatedSeconds: 60,
      completedDates: {},
      isDefault: false,
    };
    chores.push(newChore);
    this.saveChores(chores);
    return newChore;
  }

  public static deleteChore(id: string): void {
    const chores = this.getChores().filter((c) => c.id !== id);
    this.saveChores(chores);
  }

  // Gestures
  public static getGestures(): ProactiveGestureLog[] {
    if (!this.isBrowser()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.GESTURES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveGestures(gestures: ProactiveGestureLog[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.GESTURES, JSON.stringify(gestures));
  }

  public static logGesture(gesture: Omit<ProactiveGestureLog, 'id' | 'timestamp'>): {
    success: boolean;
    gesture?: ProactiveGestureLog;
    error?: string;
  } {
    // STRICT RULE ENFORCEMENT: Prompted gestures CANNOT be recorded as proactive
    if (gesture.wasPrompted) {
      return {
        success: false,
        error:
          'RULE VIOLATION: Gesture was prompted or requested. Only 100% unprompted, proactive initiatives count toward discipline metrics.',
      };
    }

    const gestures = this.getGestures();
    const newGesture: ProactiveGestureLog = {
      ...gesture,
      id: `gesture-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    gestures.unshift(newGesture);
    this.saveGestures(gestures);
    return { success: true, gesture: newGesture };
  }

  public static deleteGesture(id: string): void {
    const gestures = this.getGestures().filter((g) => g.id !== id);
    this.saveGestures(gestures);
  }

  // Audits
  public static getAudits(): NightlyAuditRecord[] {
    if (!this.isBrowser()) return [];
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveAudits(audits: NightlyAuditRecord[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
  }

  public static recordAudit(audit: Omit<NightlyAuditRecord, 'id' | 'completedAt'>): NightlyAuditRecord {
    const audits = this.getAudits();
    const existingIdx = audits.findIndex((a) => a.date === audit.date);
    const newRecord: NightlyAuditRecord = {
      ...audit,
      id: `audit-${audit.date}`,
      completedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      audits[existingIdx] = newRecord;
    } else {
      audits.push(newRecord);
    }

    this.saveAudits(audits);
    return newRecord;
  }

  // Export / Import
  public static exportAllData(): string {
    if (!this.isBrowser()) return '{}';
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      meals: this.getMeals(),
      chores: this.getChores(),
      gestures: this.getGestures(),
      audits: this.getAudits(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public static importData(jsonString: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.meals) this.saveMeals(data.meals);
      if (data.chores) this.saveChores(data.chores);
      if (data.gestures) this.saveGestures(data.gestures);
      if (data.audits) this.saveAudits(data.audits);
      return true;
    } catch {
      return false;
    }
  }

  public static resetToFactory(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.MEAL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CHORES);
    localStorage.removeItem(STORAGE_KEYS.GESTURES);
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
    this.init();
  }
}
