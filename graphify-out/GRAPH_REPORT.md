# Graph Report - RealityCheck  (2026-10-20)

## Corpus Check
- 47 files · ~36,507 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 323 nodes · 872 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `773e44ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- package.json
- index.ts
- StorageService
- next
- supabase.ts
- compilerOptions
- manifest.json
- RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)
- AGENTS.md
- tasks/page.tsx
- useNotifications.ts
- sw.js
- getTodayString
- react
- playSound

## God Nodes (most connected - your core abstractions)
1. `StorageService` - 42 edges
2. `playSound()` - 36 edges
3. `react` - 27 edges
4. `lucide-react` - 22 edges
5. `useCloudSync()` - 20 edges
6. `getTodayString()` - 20 edges
7. `createCustomSupabaseClient()` - 18 edges
8. `compilerOptions` - 16 edges
9. `TopHeader()` - 15 edges
10. `TodayExecutionHub()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `⚡ Offline-First Architecture & Cloud Sync` --references--> `useCloudSync()`  [INFERRED]
  README.md → src/hooks/useCloudSync.ts
- `DailyRhythm()` --calls--> `playSound()`  [EXTRACTED]
  src/components/DailyRhythm.tsx → src/lib/sound.ts
- `HouseholdChecklist()` --calls--> `playSound()`  [EXTRACTED]
  src/components/HouseholdChecklist.tsx → src/lib/sound.ts
- `InitiativeHub()` --calls--> `getDayDifference()`  [EXTRACTED]
  src/app/initiative/page.tsx → src/lib/date-utils.ts
- `InitiativeHub()` --calls--> `getTodayString()`  [EXTRACTED]
  src/app/initiative/page.tsx → src/lib/date-utils.ts

## Import Cycles
- None detected.

## Communities (16 total, 2 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.14
Nodes (18): MealsEngineHub(), QUICK_ADD, db, DbAudit, DbCadence, DbChore, DbGesture, DbGymSession (+10 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (40): eslintConfig, dependencies, clsx, dexie, dexie-react-hooks, lucide-react, next, react (+32 more)

### Community 2 - "index.ts"
Cohesion: 0.09
Nodes (38): SignupOnboardingPage(), DailyRhythm(), DailyRhythmProps, HeaderHUDProps, HouseholdChecklist(), HouseholdChecklistProps, OnboardingDialogProps, DEFAULT_CHORES (+30 more)

### Community 3 - "StorageService"
Cohesion: 0.18
Nodes (7): NightlyAuditProps, OnboardingDialog(), upsertLocalUserProfile(), StorageService, MealLog, NightlyAuditRecord, ProactiveGestureLog

### Community 4 - "next"
Cohesion: 0.10
Nodes (22): nextConfig, next, @supabase/supabase-js, contentType, size, contentType, size, metadata (+14 more)

### Community 5 - "supabase.ts"
Cohesion: 0.18
Nodes (29): resolveCredentials(), useCloudSync(), markRecordsSynced(), createCustomSupabaseClient(), fetchCloudProfile(), fetchDailyAuditsSince(), fetchExecutionLogs(), fetchGymSessionsSince() (+21 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 8 - "RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)"
Cohesion: 0.20
Nodes (9): 1. Today / Execution Hub (`/`), 2. Meals / Meal Engine Hub (`/meals`), 3. Relationships & Initiative Engine (`/initiative`), 4. Audit & Consistency Vault (`/vault`), 🚀 Deployment to Vercel, 🖤 Design System: Notion Dark Mode Aesthetic, ⚡ Offline-First Architecture & Cloud Sync, RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine) (+1 more)

### Community 10 - "tasks/page.tsx"
Cohesion: 0.20
Nodes (9): GROCERY_CATEGORIES, PRIORITY_LABELS, QUICK_STAPLES, TasksHub(), ViewTab, DbGroceryItem, DbTask, GroceryCategory (+1 more)

### Community 11 - "useNotifications.ts"
Cohesion: 0.27
Nodes (9): dexie-react-hooks, NotificationPermissionBanner(), NotificationScheduler(), canNotify(), isBrowser(), NotificationPermissionState, useNotifications(), firedRef (+1 more)

### Community 13 - "getTodayString"
Cohesion: 0.67
Nodes (5): VaultHub(), NightlyAudit(), formatFriendlyDate(), getPastNDays(), getTodayString()

### Community 15 - "react"
Cohesion: 0.21
Nodes (10): lucide-react, react, ActionCategory, CATEGORY_LABELS, InitiativeHub(), RecipientTab, FrictionKillerModal(), FrictionKillerModalProps (+2 more)

### Community 17 - "playSound"
Cohesion: 0.25
Nodes (12): SCHEDULE_ANCHORS, TodayExecutionHub(), HeaderHUD(), OnboardingModal(), PushupEngine(), RelationshipTracker(), formatMinutesCountdown(), getCurrentAndNextBlock() (+4 more)

## Knowledge Gaps
- **9 isolated node(s):** `clsx`, `react-dom`, `tailwind-merge`, `@tailwindcss/turbopack`, `@types/node` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 113 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StorageService` connect `StorageService` to `index.ts`, `next`, `supabase.ts`, `react`, `playSound`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `clsx`, `react-dom`, `tailwind-merge` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `db.ts`, `package.json`, `index.ts`, `next`, `supabase.ts`, `tasks/page.tsx`, `useNotifications.ts`, `getTodayString`, `playSound`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `package.json`, `index.ts`, `playSound`, `react`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08603145235892692 - nodes in this community are weakly interconnected._