# Graph Report - RealityCheck  (2026-10-15)

## Corpus Check
- 39 files · ~32,342 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 282 nodes · 744 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f042154`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- playSound
- package.json
- index.ts
- StorageService
- next
- supabase.ts
- compilerOptions
- manifest.json
- RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `StorageService` - 40 edges
2. `playSound()` - 32 edges
3. `react` - 21 edges
4. `lucide-react` - 18 edges
5. `getTodayString()` - 18 edges
6. `useCloudSync()` - 16 edges
7. `compilerOptions` - 16 edges
8. `createCustomSupabaseClient()` - 14 edges
9. `TopHeader()` - 13 edges
10. `seedDatabaseIfEmpty()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `⚡ Offline-First Architecture & Cloud Sync` --references--> `useCloudSync()`  [INFERRED]
  README.md → src/hooks/useCloudSync.ts
- `DailyRhythm()` --calls--> `playSound()`  [EXTRACTED]
  src/components/DailyRhythm.tsx → src/lib/sound.ts
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/login/page.tsx → src/hooks/useAuth.ts
- `SignupOnboardingPage()` --calls--> `applyPrerequisitesToDatabase()`  [EXTRACTED]
  src/app/signup/page.tsx → src/lib/db.ts
- `SignupOnboardingPage()` --calls--> `seedDatabaseIfEmpty()`  [EXTRACTED]
  src/app/signup/page.tsx → src/lib/db.ts

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "playSound"
Cohesion: 0.10
Nodes (44): dexie-react-hooks, lucide-react, react, ActionCategory, CATEGORY_LABELS, InitiativeHub(), RecipientTab, LoginPage() (+36 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (40): eslintConfig, dependencies, clsx, dexie, dexie-react-hooks, lucide-react, next, react (+32 more)

### Community 2 - "index.ts"
Cohesion: 0.11
Nodes (32): SignupOnboardingPage(), DailyRhythm(), DailyRhythmProps, HeaderHUDProps, HouseholdChecklistProps, OnboardingDialogProps, DEFAULT_CHORES, FOCUS_OPTIONS (+24 more)

### Community 3 - "StorageService"
Cohesion: 0.18
Nodes (6): NightlyAuditProps, OnboardingDialog(), SettingsModal(), upsertLocalUserProfile(), StorageService, NightlyAuditRecord

### Community 4 - "next"
Cohesion: 0.11
Nodes (20): nextConfig, next, @supabase/supabase-js, contentType, size, contentType, size, metadata (+12 more)

### Community 5 - "supabase.ts"
Cohesion: 0.17
Nodes (28): resolveCredentials(), useCloudSync(), getUnsyncedRecords(), markRecordsSynced(), createCustomSupabaseClient(), fetchCloudProfile(), fetchDailyAuditsSince(), fetchExecutionLogs() (+20 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 8 - "RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)"
Cohesion: 0.20
Nodes (9): 1. Today / Execution Hub (`/`), 2. Meals / Meal Engine Hub (`/meals`), 3. Relationships & Initiative Engine (`/initiative`), 4. Audit & Consistency Vault (`/vault`), 🚀 Deployment to Vercel, 🖤 Design System: Notion Dark Mode Aesthetic, ⚡ Offline-First Architecture & Cloud Sync, RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine) (+1 more)

## Knowledge Gaps
- **9 isolated node(s):** `clsx`, `react-dom`, `tailwind-merge`, `@tailwindcss/turbopack`, `@types/node` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 100 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StorageService` connect `StorageService` to `playSound`, `index.ts`, `next`, `supabase.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `clsx`, `react-dom`, `tailwind-merge` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `playSound` be split into smaller, more focused modules?**
  _Cohesion score 0.10163934426229508 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `playSound`, `package.json`, `index.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Why does `react` connect `playSound` to `package.json`, `index.ts`, `next`, `supabase.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11153846153846154 - nodes in this community are weakly interconnected._