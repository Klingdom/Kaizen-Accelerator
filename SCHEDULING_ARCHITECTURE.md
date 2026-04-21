# SCHEDULING_ARCHITECTURE.md

**CadencePlan Scheduling Design — Phases 4 & 5**
**Version:** 0.1 (2026-04-18)
**Owner:** Phil K (phil@mediafier.ai)
**Scope:** Technical architecture and build plan for the CadencePlan composer subsystem inside BAM OS. Phase 6 deliverables (PRD, schema, types, seed, build prompt) are in `SCHEDULING_DELIVERABLES.md`.

**Companion documents:**
- `ARCHITECTURE.md` v0.6 — system architecture, §7.1 localStorage keys, §7.3 Postgres sketch, §7.4 REST API
- `DELIVERY_PLAN.md` v0.3 — 18 epics, 30/60/90/120/150-day plan
- `ENGINE_DESIGN.md` v0.4.1 — composer algorithm, performance targets
- `SCHEDULING_BLUEPRINT.md` — Phases 1–3 (problem framing, domain model, UX)

**Canonical vocabulary:** CadencePlan, BAM OS, Standard Work Catalog, Cadence Day / Week / Sprint / Month.

---

## Part 4 — Technical Architecture

### 4.1 Tech Stack

Two tiers: **MVP-now** (shipping; vanilla) and **V1-future** (React stack). No stack changes between them are reactive — every MVP module is built behind an interface that the V1 stack adopts without rewrite.

| Layer | MVP (shipped) | V1 (6-month target) | Rationale |
|---|---|---|---|
| Language | ES2022 modules | TypeScript 5.5 strict | MVP avoids build step; V1 needs schema strictness |
| Runtime (client) | Browser `<script type="module">` | Next.js 14+ App Router, React 19 | RSC at route edges, Client Components for drag-drop composer |
| Runtime (server) | None (static) | Node 22 LTS | Same runtime as MVP test harness |
| Persistence | `localStorage` (keyed under `bamx:v1:*`) | Postgres 16 | See ARCH §7.1 → §7.3 migration |
| ORM | None (repo pattern hand-rolled) | Drizzle ORM | Type-safe SQL, codegen from schema |
| Validation | Hand-written guards in `js/domain/*` | Zod v3 | Shared schema for REST + domain + form |
| Server state | In-memory caches + EventBus | TanStack Query v5 | Background refetch, optimistic writes |
| UI state | DOM state + event listeners | Zustand | Minimal boilerplate, selectors |
| Components | Hand-authored HTML fragments | shadcn/ui (Radix primitives) | a11y-correct, owned source |
| Styling | Single `styles.css` | Tailwind + CSS Modules | Utility + component scope |
| Test | Node 22 built-in test runner | Vitest + Playwright | Node runner already deployed |
| HTTP server | Caddy v2 (static) | Next.js edge + Node API routes | Caddy already runs |
| Bundler | None | Next.js (Turbopack) | Zero-config path |
| Auth | None | Clerk or Lucia | Defer; single-user MVP |

**Zero dependencies today.** The Sprint 1 codebase (`js/domain`, `js/events`, `js/persistence`, `js/boot.js`) ships with no `node_modules` on the client. Test runner uses Node built-ins only.

**Migration sequencing — MVP to V1 stack is additive, never destructive:**

| Step | Order | Effort | Risk |
|---|---|---|---|
| Add TypeScript config, migrate `js/domain/*` to `packages/domain/*` with `.ts` | 1 | ~2 days | Low — domain is already pure |
| Introduce Next.js shell alongside static `index.html`; flag-toggle root | 2 | ~3 days | Low — parallel routes |
| Wrap `LocalStorageRepository` behind `IRepository`; stand up `PostgresRepository` behind identical interface | 3 | ~4 days | Med — data parity tests required |
| Dual-write during cutover (both repos); read from Postgres; compare | 4 | ~3 days | Med |
| Cut over reads to Postgres; keep localStorage as cache for speed | 5 | ~1 day | Low |
| Delete legacy `boot.js` after 14 days stable | 6 | ~1 day | Low |

**Upstream dependency policy:** no build step for MVP; V1 pins exact versions with lockfile; `renovate` auto-PRs patch + minor with green CI required before merge. Critical dependencies (Next.js, React, Drizzle, Zod) pinned to major+minor with manual upgrade.

**Explicit NO decisions:**

| Option | Why not |
|---|---|
| MongoDB / document stores | Schema is fundamentally relational (FK from Activity→Cycle→Kaizen, Composition→Block→CatalogEntry). Joins dominate. |
| GraphQL | REST per ARCH §7.4 is sufficient; single client; composer queries are write-dominant, not over-fetch-sensitive. |
| Full SSR of `/today` | Composer output is personal, non-cacheable, client-interactive. RSC used only for static chrome. |
| Redux / RxJS | EventBus pattern already serves observer needs. Zustand slice-per-domain sufficient for UI. |
| tRPC | Zod schemas shared across REST boundary serve same purpose; REST survives without TS clients. |
| Prisma | Drizzle wins on SQL transparency, composer tuning requires hand-crafted queries. |
| Service workers / PWA in MVP | Offline is post-MVP. localStorage is already offline-capable for MVP. |

### 4.2 Frontend

**MVP (shipped):**
- Entry: `index.html` loads `js/boot.js` as `type="module"`.
- One-file-per-component under `js/components/` (e.g., `CycleCard.js`, `BucketStrip.js`, `TodayView.js`).
- Components export pure `render(container, props)` + `bind(eventBus)` functions. No framework.
- No router in MVP — `/today` is the only route. Hash-based navigation for `#/reflect`, `#/kaizen/new` added in E5.
- CSS: single `styles.css`, BEM-flavoured class names. Cycle/Block theming via CSS custom properties (`--bucket-project`, `--bucket-comm`, `--bucket-ci`).

**Future (V1):**
- Next.js App Router. Folder = route. Layouts shared via `layout.tsx`.
- Server Components: read-only chrome (nav, stats tiles rendered from Postgres).
- Client Components: `TodayBoard`, `CycleCard`, `BucketStrip`, `ReflectionSheet`, `KaizenComposer` — anything with drag-drop, input, or live timers.
- Suspense boundaries per section; `loading.tsx` siblings per route.

| MVP route (hash) | Next.js route | Component type | Notes |
|---|---|---|---|
| `/` | `/app/page.tsx` → redirect `/today` | RSC | Default |
| `#/today` | `/app/today/page.tsx` | RSC shell + `TodayBoard` (Client) | Composer lives here |
| `#/reflect` | `/app/reflect/[cycleId]/page.tsx` | Client | Mid-cycle + EoD reflection |
| `#/catalog` | `/app/catalog/page.tsx` | RSC | Read mostly |
| `#/kaizen/[id]` | `/app/kaizen/[id]/page.tsx` | RSC + Client tabs | DMAIC navigator |
| `#/kaizen/new` | `/app/kaizen/new/page.tsx` | Client form | Zod-validated |
| `#/variance/[id]` | `/app/variance/[id]/page.tsx` | Client | VarianceLog editor |
| `#/history` | `/app/history/page.tsx` | RSC | Paginated cycles |
| `#/admin` | `/app/admin/layout.tsx` + children | RSC | Admin-only |

**Styling migration:** Each MVP `*.css` selector maps to a Tailwind utility class set OR a CSS-Module class. Custom properties (`--bucket-*`) become Tailwind theme tokens.

**Drag-drop:** MVP uses HTML5 DnD + pointer-events fallback. V1 uses `@dnd-kit/core` for keyboard + touch. ARIA roles (`role="list"` on BucketStrip, `role="listitem"` on Block) identical across tiers.

**Component contracts (MVP):**

| Component | Inputs | Events emitted | a11y |
|---|---|---|---|
| `TodayBoard` | `{forDate}` | delegates | `<main role="main">` landmark |
| `CycleCard` | `{cycle, composition}` | `cycle.accepted`, `cycle.edited`, `cycle.rejected` | `<article>` with labelled heading |
| `BucketStrip` | `{bucket, blocks, targetMinutes}` | `block.dragstart`, `block.drop` | `role="list"`, `aria-label="<bucket>"` |
| `BlockTile` | `{block, state}` | `block.started`, `block.completed`, `block.rebucketed` | `role="listitem"`, `aria-describedby` for why |
| `ReflectionSheet` | `{cycle, kind}` where kind ∈ {`mid`,`eod`} | `reflection.saved` | Modal `<dialog>` with focus trap |
| `KaizenNavigator` | `{kaizen}` | `dmaic.advanced`, `kaizen.closed` | Tabpanel pattern |
| `VarianceLogView` | `{range}` | filter-only (read-mostly) | Table with sortable headers |
| `CatalogBrowser` | `{query}` | `catalog.entryOpened`, `catalog.entryUpserted` | Combobox pattern for search |

**Rendering pipeline (MVP):** `render(container, props)` is synchronous, idempotent, and returns a `teardown()` function. Re-render is cheap (full DOM replace within a component scope). No virtual DOM — diffing is per-component manual when hot paths (timer tick, drag preview) demand it.

### 4.3 Backend

**MVP:** pure browser. Caddy serves static. No backend logic. Repository writes go to localStorage only.

**V1:** Next.js API routes. REST per ARCH §7.4. Handlers are thin — they parse, call a service, return DTO.

**Services (9 — all framework-agnostic; each exports pure functions over Repository interface):**

| Service | Purpose | Reads | Writes | Emits |
|---|---|---|---|---|
| **CatalogService** | Standard Work Catalog CRUD, search, versioning | `catalog_entries` | `catalog_entries`, `catalog_versions` | `CatalogEntryUpserted`, `CatalogEntryRetired` |
| **ComposerService** | `composeDaily` / `composeWeekly`, snapshot inputs, score candidates | catalog, activities, cycles, varianceLog | `compositions` | `CompositionProposed`, `CompositionAccepted`, `CompositionEdited`, `CompositionRejected` |
| **ActivityService** | Start/stop/complete Blocks; bucket reclassification; rebucket validation | compositions, activities, catalog | `activities` | `ActivityStarted`, `ActivityCompleted`, `ActivityRebucketed` |
| **ReflectionService** | Mid-cycle prompts, EoD reflection, sentiment + friction logs | cycles, activities | `reflections`, `cycles` (state) | `ReflectionSaved`, `CycleClosed` |
| **VarianceService** | VarianceLog entries; diff current vs accepted composition; SIPOC-lite capture | compositions, activities | `variance_log` | `VarianceRecorded`, `VarianceResolved` |
| **KaizenService** | Kaizen lifecycle (D→M→A→I→C), DMAIC payload step registration, PICK matrix position | kaizens, activities, catalog | `kaizens`, `dmaic_steps` | `KaizenOpened`, `DmaicAdvanced`, `KaizenClosed` |
| **PdcaService** | PDCA cycles nested in kaizens; experiment tracking; SDCA conversion | kaizens, pdcas | `pdcas` | `PdcaStarted`, `PdcaResulted`, `SdcaPromoted` |
| **MetricsService** | Operational KPIs (takt attainment, variance ratio, Kaizen cycle time), OEE-lite | all | `metrics_snapshots` | `MetricSnapshotComputed` |
| **InvariantEngine** | Runtime guard: validates every composition, transition, and state change against invariants I-1…I-18 | every domain object | none (throws/returns `InfeasibleResult`) | `InvariantViolated` |

**Repository pattern:**

```text
interface IRepository<T, ID=string> {
  get(id: ID): Promise<T|null>
  list(query: QuerySpec): Promise<T[]>
  save(entity: T): Promise<T>
  delete(id: ID): Promise<void>
}
```

| Implementation | Target | Status |
|---|---|---|
| `LocalStorageRepository` | `bamx:v1:*` keys | MVP — shipped Sprint 1 |
| `InMemoryRepository` | Unit tests | MVP — shipped Sprint 1 |
| `PostgresRepository` | Drizzle over Postgres 16 | V1 |
| `CachedPostgresRepository` | Postgres + TanStack Query | V1 |

**API shape (per ARCH §7.4):** verbs match service method names. All payloads Zod-validated. `422 Unprocessable Entity` carries `{ failureCode, detail, invariant? }`.

**REST endpoints → service method mapping (V1):**

| Method + path | Service.method | Request | Response |
|---|---|---|---|
| `GET /api/catalog` | `CatalogService.list` | query | `CatalogEntry[]` |
| `POST /api/catalog` | `CatalogService.upsert` | `CatalogEntry` | `CatalogEntry` |
| `POST /api/catalog/:id/retire` | `CatalogService.retire` | `{reason}` | `CatalogEntry` |
| `GET /api/composition/:date` | `ComposerService.getForDate` | — | `Composition?` |
| `POST /api/composition/:date/propose` | `ComposerService.composeDaily` | `{policy?}` | `Composition \| InfeasibleResult` |
| `POST /api/composition/:id/accept` | `ComposerService.accept` | — | `Composition` |
| `POST /api/composition/:id/edit` | `ComposerService.edit` | `{diff}` | `Composition` |
| `POST /api/composition/:id/reject` | `ComposerService.reject` | `{reason}` | `{ok:true}` |
| `POST /api/activities/:id/start` | `ActivityService.start` | — | `Activity` |
| `POST /api/activities/:id/complete` | `ActivityService.complete` | `{actualMinutes}` | `Activity` |
| `POST /api/activities/:id/rebucket` | `ActivityService.rebucket` | `{to, reason}` | `Activity` |
| `GET /api/cycles/:id/reflection` | `ReflectionService.get` | — | `Reflection?` |
| `POST /api/cycles/:id/reflection` | `ReflectionService.save` | `Reflection` | `Reflection` |
| `GET /api/variance?range=` | `VarianceService.list` | query | `VarianceLogEntry[]` |
| `POST /api/kaizen` | `KaizenService.open` | `{title, hypothesis}` | `Kaizen` |
| `POST /api/kaizen/:id/advance` | `KaizenService.advance` | `{to}` | `Kaizen` |
| `POST /api/kaizen/:id/close` | `KaizenService.close` | `{outcome}` | `Kaizen` |
| `GET /api/metrics/today` | `MetricsService.today` | — | `MetricsSnapshot` |
| `GET /api/metrics/kaizen` | `MetricsService.kaizen` | — | `MetricsSnapshot` |

**Data-flow walkthrough — "User accepts a proposed cycle":**

| Step | Actor | Module | Effect |
|---|---|---|---|
| 1 | User | `TodayBoard` click "Accept" | `cycle.acceptRequested` event |
| 2 | Client | `ComposerService.accept(compId)` | Call |
| 3 | Service | `InvariantEngine.validate(composition)` | Guard |
| 4 | Service | Repository.save(composition state=ACCEPTED) | Persist |
| 5 | Service | Derive `Activity[]` from `Block[]`; Repository.save | Persist |
| 6 | Service | `CycleService.transition(PROPOSED→ACTIVE)` | State |
| 7 | EventBus | emit `CompositionAccepted`, `CycleAccepted`, `ActivitiesCreated` | Fan-out |
| 8 | Subscribers | MetricsService recomputes; UI re-renders; Variance primes empty log | Side-effects |
| 9 | UI | TodayBoard swaps card to active mode; timer ready | Visible |

### 4.4 Scheduling Engine

Composer module `js/domain/composer/` (MVP) → `packages/composer/` (V1 monorepo). Framework-agnostic. Pure functions. No IO — Repository is injected.

**Core signatures (TypeScript-style JSDoc):**

```js
/**
 * @param {ComposerInput} input
 * @returns {Composition | InfeasibleResult}
 */
function composeDaily(input) { /* … */ }

/**
 * @typedef {Object} ComposerInput
 * @property {User} user
 * @property {Date} forDate
 * @property {CadenceDay} cadenceDay           // targets, buckets, block length
 * @property {CatalogEntry[]} catalog           // active entries only
 * @property {Activity[]} recentActivities      // last 14d for balance checks
 * @property {Kaizen[]} openKaizens             // DMAIC state drives eligibility
 * @property {VarianceLog[]} recentVariances    // last 7d to bias picks
 * @property {number} externalMinutesToday      // calendar + meetings
 * @property {ComposerPolicy} policy            // see below
 */

/** @typedef {Object} ComposerPolicy
 *  @property {'balanced'|'project-heavy'|'ci-heavy'} profile
 *  @property {number} ciFloorMinutesPerDay        // invariant I-7
 *  @property {number} communicationCeilingPct     // invariant I-8
 *  @property {boolean} enforceRotation            // variety guard
 */

function composeWeekly(input /* WeeklyComposerInput */) { /* … */ }
function validateComposition(c /* Composition */) { /* { ok, failureCode?, detail? } */ }
function eligibleDmaicPayloadSteps(kaizen, catalog, activities) { /* CatalogEntry[] */ }
function canRebucket(activity, from, to, composition) { /* boolean */ }
function computeBucketTargets(user, externalMinutesToday) { /* { PROJECT, COMMUNICATION, CI } */ }
function pickCI(candidateSet, context) { /* CatalogEntry */ }
```

**Composer phases (composeDaily):**

| Phase | Name | Input | Output | Invariants checked |
|---|---|---|---|---|
| 1 | Capacity | user, forDate, externalMinutesToday | `{availableMinutes}` | I-1 (total ≤ workday) |
| 2 | BucketTargets | availableMinutes, policy | `{PROJECT, COMMUNICATION, CI}` minute floors/ceilings | I-7, I-8 |
| 3 | Eligibility filter | catalog, openKaizens, recentActivities | `CatalogEntry[]` | I-3 (DMAIC precondition), I-11 (retired) |
| 4 | Candidate scoring | eligible, varianceLog, rotation history | `ScoredCandidate[]` | — |
| 5 | Bucket fill | scored, targets | `Block[]` per bucket | I-7, I-8, I-10 |
| 6 | Ordering | blocks, user rhythm (chronotype) | `Block[]` sequenced | I-12 |
| 7 | Validation | Composition | ok / `InfeasibleResult` | I-1…I-18 |
| 8 | Snapshot | all inputs | `composerInputsSnapshot` w/ `explain[]` | — |

**Deterministic output:** given identical `ComposerInput`, `composeDaily` is pure. The `explain[]` array carries `{ blockId, reason, ruleId, evidence }` entries — one per placement decision — so that any accepted Composition can be replayed/audited.

**Invariant register cross-reference (composer-touched subset):**

| ID | Rule | Enforced by |
|---|---|---|
| I-1 | Total scheduled minutes ≤ workday capacity | Composer phase 1; validate |
| I-2 | Exactly one ACTIVE cycle per user per date | CycleService transitions |
| I-3 | DMAIC payload step requires upstream step complete | Eligibility filter |
| I-4 | Kaizen cannot close without outcome + metric delta OR explicit no-impact | KaizenService.close |
| I-5 | CatalogEntry.bucket must be PROJECT, COMMUNICATION, or CI | Schema + validator |
| I-6 | Activity.blockId must reference a Block in the accepted Composition | ActivityService |
| I-7 | CI minutes/day ≥ `policy.ciFloorMinutesPerDay` | Composer phase 2, 5 |
| I-8 | Communication minutes/day ≤ `policy.communicationCeilingPct × capacity` | Composer phase 2, 5 |
| I-9 | Rebucket target bucket must be valid for the catalog entry's tags | canRebucket |
| I-10 | Block.durationMinutes is multiple of cadenceDay.blockGranularity | Composer phase 5 |
| I-11 | Retired catalog entries are not eligible for new placements | Eligibility filter |
| I-12 | Chronotype-sensitive ordering: high-focus blocks before user's declared slump window | Composer phase 6 |
| I-13 | Reflection exists for each CLOSED cycle | CycleService.close |
| I-14 | externalMinutesToday is honoured (Composer never schedules into meetings) | Composer phase 1 |
| I-15 | Kaizen DMAIC state progresses monotonically D→M→A→I→C (or CANCELLED) | KaizenService.advance |
| I-16 | Weekly composition's daily windows sum ≤ weekly capacity | composeWeekly |
| I-17 | Weekly CI floor aggregated across days | composeWeekly |
| I-18 | Every CompositionAccepted has a non-empty composerInputsSnapshot | ComposerService.accept |

**Infeasibility:** returned as a structured object, never throws.

```js
/** @typedef {Object} InfeasibleResult
 *  @property {'infeasible'} status
 *  @property {FailureCode} failureCode          // e.g. 'CI_FLOOR_UNREACHABLE'
 *  @property {string} detail
 *  @property {Array<{invariant: string, evidence: any}>} diagnostics
 *  @property {Array<RelaxationSuggestion>} suggestions   // which policy knob to loosen
 */
```

**Failure codes (scheduling-specific; extend ARCH §7 table):**

| Code | Meaning | Typical fix |
|---|---|---|
| `CAPACITY_EXCEEDED` | externalMinutes + floor > workday | Reduce meetings |
| `CI_FLOOR_UNREACHABLE` | CI entries insufficient | Extend catalog, unfreeze retired |
| `DMAIC_PRECONDITION_UNMET` | Kaizen step lacks upstream | Advance prior step |
| `NO_ELIGIBLE_CANDIDATES` | All filtered | Review catalog health |
| `ROTATION_VIOLATION` | Repeats > threshold | Relax `enforceRotation` |
| `BUCKET_TARGETS_INCONSISTENT` | policy conflict | Reconcile profile |

**Performance targets (from ENGINE_DESIGN §4):**

| Metric | MVP (localStorage, 80 catalog entries, 30d history) | V1 (Postgres, 200+ entries, 365d history) |
|---|---|---|
| `composeDaily` p50 | ≤ 40 ms | ≤ 120 ms |
| `composeDaily` p95 | ≤ 100 ms | ≤ 300 ms |
| `composeDaily` p99 | ≤ 180 ms | ≤ 500 ms |
| `composeWeekly` p95 | ≤ 250 ms | ≤ 800 ms |
| `validateComposition` | ≤ 10 ms | ≤ 25 ms |
| `canRebucket` | ≤ 3 ms | ≤ 8 ms |
| Memory per compose | ≤ 4 MB transient | ≤ 12 MB |

Measured in `bench/composer.bench.js` on commodity laptop (M-class or equivalent). Regression fails CI if p95 exceeds threshold by >15%.

### 4.5 State Management

**MVP layering:**

| Layer | Implementation | Owns |
|---|---|---|
| Persisted domain | `LocalStorageRepository` + `bamx:v1:*` keys | User, CatalogEntry, Cycle, Activity, Composition, Kaizen, Reflection, VarianceLog |
| In-memory cache | Per-service `Map`, rebuilt on boot | Index by id, by state, by date |
| Event stream | `EventBus` (synchronous, pub/sub) | All domain events |
| UI state | DOM + small component-local objects | Drag targets, expansion, modals |

**V1 layering:**

| Layer | Implementation | Owns |
|---|---|---|
| Server state | TanStack Query v5 | Query keys match REST resources |
| Optimistic mutations | TanStack `useMutation` + onMutate | Composer accept, rebucket, reflection |
| UI state | Zustand slices (`todaySlice`, `composerSlice`, `kaizenSlice`) | Local-only state |
| Persisted UI prefs | `localStorage` under `bamx:v1:ui:*` | Theme, last viewed tab |
| Event stream | Still `EventBus` for client-side broadcast; server emits via SSE endpoint post-mutation | Cross-tab sync via BroadcastChannel |

**Cache invalidation matrix (key rule: event → invalidate queries):**

| Event | Invalidate (query keys) | Rationale |
|---|---|---|
| `CompositionProposed` | `['composition', forDate]` | Freshly proposed |
| `CompositionAccepted` | `['composition', forDate]`, `['cycle', cycleId]`, `['activities', forDate]` | Activities hydrate from blocks |
| `CompositionEdited` | same as Accepted | |
| `CompositionRejected` | `['composition', forDate]` | Return to empty |
| `CycleAccepted` | `['composition', forDate]`, `['metrics', 'today']` | Metrics roll up cycle start |
| `ActivityStarted` | `['activities', forDate]` | Timer state |
| `ActivityCompleted` | `['activities', forDate]`, `['metrics', 'today']`, `['variance', forDate]` | Variance may be logged |
| `ActivityRebucketed` | `['composition', forDate]`, `['activities', forDate]` | Bucket totals shift |
| `VarianceRecorded` | `['variance', forDate]`, `['metrics', 'today']` | |
| `KaizenOpened` | `['kaizens']` | |
| `DmaicAdvanced` | `['kaizen', id]`, `['catalog', 'eligible']` | Eligibility recomputes |
| `KaizenClosed` | `['kaizens']`, `['metrics', 'kaizen']`, `['catalog', 'eligible']` | |
| `ReflectionSaved` | `['reflection', cycleId]`, `['metrics', 'today']` | |
| `CatalogEntryUpserted` | `['catalog']`, `['catalog', 'eligible']` | |

### 4.6 Performance

| Target | MVP | V1 | Enforcement |
|---|---|---|---|
| `composeDaily` p95 | ≤ 100 ms | ≤ 300 ms | CI bench |
| `composeWeekly` p95 | ≤ 250 ms | ≤ 800 ms | CI bench |
| First meaningful paint `/today` | ≤ 1.0 s | ≤ 1.2 s | Lighthouse |
| Time-to-interactive `/today` | ≤ 1.5 s | ≤ 2.0 s | Lighthouse |
| Lighthouse Performance | ≥ 90 | ≥ 90 | CI |
| Lighthouse Accessibility | ≥ 95 | ≥ 95 | CI |
| JS bundle initial (gzipped) | N/A (no bundler; target ≤ 80 KB hand-served) | ≤ 100 KB | Size-limit |
| Composer rerun on rebucket | ≤ 50 ms | ≤ 120 ms | Bench |
| p95 `GET /composition/:date` | N/A | ≤ 150 ms TTFB | k6 |
| Postgres query p95 | N/A | ≤ 30 ms | `pg_stat_statements` |

**Postgres index plan (V1):**

| Table | Index | Purpose |
|---|---|---|
| `compositions` | `(user_id, for_date DESC)` | Today/history lookup |
| `compositions` | `(user_id, computed_at DESC)` | Recency scan for rollback |
| `compositions` | partial `WHERE state='PROPOSED'` on `(user_id)` | Hot path during decision |
| `activities` | `(user_id, for_date, bucket)` | Bucket rollups |
| `activities` | `(cycle_id)` | Cycle detail |
| `kaizens` | `(user_id, state)` partial `WHERE state IN ('D','M','A','I','C')` | Open only |
| `dmaic_steps` | `(kaizen_id, step_index)` | Stage nav |
| `variance_log` | `(user_id, logged_at DESC)` | Recent-window composer input |
| `catalog_entries` | `(user_id)` + full-text on `(title, tags)` | Search |
| `metrics_snapshots` | `(user_id, metric_key, computed_at DESC)` | Dashboards |

**localStorage budget (MVP):**
- Ceiling: 5 MB (browser minimum).
- Today's composition + 90 days history + catalog + 30 kaizens ≈ 1.2 MB typical.
- At 4 MB watermark: archive compositions older than 90 days to `bamx:v1:archive:YYYYQQ` (single compressed JSON) — migration handler in `js/persistence/archiver.js`.
- At 4.5 MB hard warn: block non-essential writes, surface `StorageNearFullWarning` in UI.

### 4.7 Extensibility & Integration

**Plugin points (designed-in, wired in V1):**

| Hook | Contract | MVP | V1 |
|---|---|---|---|
| Catalog entry provider | `(context) => CatalogEntry[]` | Single local provider | Multi-provider (local + team + imported templates) |
| Composer ranking function | `(candidate, context) => number` | Single default `scoreCandidate` | Registry of named scorers; policy picks one |
| Invariant rule | `(composition) => InvariantResult` | Hard-coded 18 | Registry; user-custom invariants |
| AI agent | `registerAgent({name, role, handler})` | Stubbed | Handlers for compose-explain, reflection-summariser, kaizen-coach |
| Event subscriber | `EventBus.on(name, fn)` | Yes | Yes (+ server-side via webhooks) |
| Persistence backend | `IRepository` | `LocalStorageRepository` | `PostgresRepository` |
| Time provider | `Clock` interface | `SystemClock` | `SystemClock` + `FrozenClock` for tests |

**Schema versioning:**

| Mechanism | MVP | V1 |
|---|---|---|
| Client schema version | `bamx:v1:meta.schemaVersion` integer | Same + server check |
| Migration | `js/persistence/migrations/*.js`, idempotent, run on boot | Drizzle migrations in `drizzle/*.sql` |
| Breaking change | Namespace bump: `bamx:v1:*` → `bamx:v2:*` | Parallel schema + dual-write |

**Event catalog as public API:**
- Event name + payload shape = contract surface.
- Additive fields only within a version.
- Breaking changes bump the event name: `ActivityCompleted` → `ActivityCompletedV2`.
- Registry in `js/events/catalog.js` emits typed payload at runtime.

**Future integrations (all via `IntegrationAdapter` interface):**

| Integration | Direction | Purpose |
|---|---|---|
| Google Calendar | Read | `externalMinutesToday` feed to composer |
| Microsoft 365 Calendar | Read | Same |
| Slack | Write | Cycle-start / EoD reflection prompts |
| Microsoft Teams | Write | Same |
| GitHub | Read | Activity enrichment (PRs closed during block) |
| Linear / Jira | Read/Write | Project bucket activity source |
| Toggl / Timely | Read | Ground-truth time for VarianceLog |
| Notion / Obsidian | Write | Reflection export |
| Apple HealthKit | Read | Chronotype + energy signal for ordering |

Adapters expose `fetch(window) => ExternalEvent[]` and/or `emit(event) => Promise<void>`. They never write domain state directly — they push events onto the bus, which services consume.

**Event catalog snapshot (v1 — scheduling-relevant subset):**

| Event | Payload fields | Breaking-change rule |
|---|---|---|
| `CompositionProposed` | `{compositionId, forDate, blockCount, candidateCount, latencyMs}` | Add-only |
| `CompositionAccepted` | `{compositionId, cycleId, byUserId, at}` | Add-only |
| `CompositionEdited` | `{compositionId, diff, at}` | `diff` shape version-gated |
| `CompositionRejected` | `{compositionId, reason, at}` | Add-only |
| `CycleAccepted` | `{cycleId, compositionId, at}` | Add-only |
| `CycleClosed` | `{cycleId, closedAt, outcome}` | Add-only |
| `ActivityStarted` | `{activityId, startedAt}` | Add-only |
| `ActivityCompleted` | `{activityId, completedAt, actualMinutes, variance}` | Add-only |
| `ActivityRebucketed` | `{activityId, from, to, reason, at}` | Add-only |
| `ReflectionSaved` | `{reflectionId, cycleId, kind, savedAt}` | Add-only |
| `KaizenOpened` | `{kaizenId, by, at}` | Add-only |
| `DmaicAdvanced` | `{kaizenId, from, to, at}` | Add-only |
| `KaizenClosed` | `{kaizenId, outcome, metricDelta?, at}` | Add-only |
| `VarianceRecorded` | `{entryId, activityId, kind, at}` | Add-only |
| `CatalogEntryUpserted` | `{entryId, version, at}` | Add-only |
| `CatalogEntryRetired` | `{entryId, reason, at}` | Add-only |
| `MetricSnapshotComputed` | `{metricKey, value, computedAt}` | Add-only |
| `InvariantViolated` | `{invariantId, context, at}` | Add-only |

**Postgres table enumeration (V1 target; per ARCH §7.3):**

| Table | Primary key | Notable columns |
|---|---|---|
| `users` | `id` | `email`, `chronotype`, `policy` (jsonb) |
| `catalog_entries` | `id` | `user_id`, `title`, `bucket`, `tags[]`, `dmaic_stage?`, `typical_minutes`, `state`, `version` |
| `catalog_versions` | `(entry_id, version)` | `snapshot` (jsonb) |
| `cycles` | `id` | `user_id`, `for_date`, `state`, `composition_id` |
| `compositions` | `id` | `user_id`, `for_date`, `state`, `blocks` (jsonb), `composer_inputs_snapshot` (jsonb), `computed_at` |
| `activities` | `id` | `user_id`, `cycle_id`, `block_id`, `catalog_entry_id`, `planned_minutes`, `actual_minutes`, `bucket`, `state` |
| `reflections` | `id` | `cycle_id`, `kind`, `sentiment`, `friction_tags[]`, `notes` |
| `variance_log` | `id` | `user_id`, `activity_id?`, `kind`, `delta`, `reason`, `logged_at` |
| `kaizens` | `id` | `user_id`, `title`, `state`, `hypothesis`, `outcome?`, `metric_key?`, `metric_delta?` |
| `dmaic_steps` | `(kaizen_id, step_index)` | `stage`, `catalog_entry_id`, `completed_at?` |
| `pdcas` | `id` | `kaizen_id`, `plan`, `do`, `check`, `act`, `state` |
| `metrics_snapshots` | `(user_id, metric_key, computed_at)` | `value`, `window` |
| `telemetry_events` | `id` | `user_id`, `service`, `method`, `duration_ms`, `result`, `at` |
| `schema_migrations` | `version` | Drizzle-managed |

---

## Part 5 — Build Plan

### 5.1 MVP Scope

**Non-negotiable from SCHEDULING_BLUEPRINT §4.1 — six must-haves:**

| # | Must-have | Scheduling call-out |
|---|---|---|
| 1 | Standard Work Catalog | Seed with 40+ entries across PROJECT/COMM/CI; DMAIC tags mandatory on CI |
| 2 | CadencePlan composer `/today` | `composeDaily` only; weekly preview read-only |
| 3 | Cycle accept/edit/reject | Snapshot inputs on accept; edits diff against proposal |
| 4 | Activity logging + bucket reclassification | Rebucket gated by `canRebucket`; writes VarianceLog |
| 5 | Mid-cycle + EoD reflection | Prompts tied to cycle state transitions |
| 6 | Kaizen DMAIC navigator | Payload steps eligible only when upstream step complete |

**Must-have acceptance criteria (MVP GA gate):**

| # | Acceptance criterion | Measurement |
|---|---|---|
| 1 | Seed catalog ≥ 40 entries, balanced across buckets | count ≥ 14 per bucket |
| 2 | `composeDaily` p95 ≤ 100ms on catalog + 30d history | `bench/composer.bench.js` |
| 3 | Accept/Edit/Reject round-trip persists across reload | Playwright-equivalent manual test |
| 4 | Rebucket always writes a VarianceLog entry with reason | Event-log replay |
| 5 | Mid-cycle reflection triggers exactly once per cycle between 40–60% elapsed | State-machine test |
| 6 | DMAIC payload step eligibility reflects real catalog entries | Integration test |
| 7 | All 18 invariants enforced at service entry points | Coverage report |
| 8 | Lighthouse ≥ 90 on `/today` desktop | CI run |

**Five new epics (E14–E18) scheduling-layered:**

| Epic | Title | Scheduling hook |
|---|---|---|
| E14 | VarianceLog v1 | Captured at every `ActivityRebucketed` / `ActivityCompleted` with deviation; feeds composer's next-day bias |
| E15 | Composer telemetry | Record `composerInputsSnapshot` + decision latency; feed MetricsService |
| E16 | InvariantEngine | Runtime guard I-1…I-18; blocks `CompositionAccepted` on violation |
| E17 | Reflection-to-Kaizen hand-off | EoD reflection "friction" tag can open a Kaizen skeleton (D stage) |
| E18 | Catalog health report | Weekly: retired-candidate list, unused entries, CI gaps |

**Out of MVP:** Team mode, Sprint composer, Monthly composer, calendar read, LLM prompts, mobile layout, offline sync, multi-device, auth.

### 5.2 V1 Scope (Post-MVP, first 6 months)

| Feature | Why | Depends on |
|---|---|---|
| Team mode (shared catalog, per-member compose) | Pilot partner org | Auth, Postgres |
| `composeWeekly` — interactive | Anchors Sprint ceremony | Composer stabilised |
| `composeSprint` + `composeMonthly` | Review cadences | Weekly stable |
| Google/MS calendar adapter | True external-minute feed | IntegrationAdapter |
| LLM AI layer (compose-explain, reflection-summariser, kaizen-coach) | Accelerates reflection + kaizen authorship | Telemetry + data |
| Mobile companion (read + quick-log) | Capture from off-desk | API complete |
| PWA / offline | Same codebase, SW cache | V1 stack shipped |

**V1 non-goals (explicitly punted beyond 6 months):** native mobile apps, video reflection capture, full multi-tenancy with RBAC, white-label deploys, compliance certifications (SOC2/ISO), custom on-prem installers, real-time co-editing of compositions, AI auto-acceptance of cycles without user review.

### 5.3 Phased Roadmap

Start date **2026-04-20 (Mon)**. Windows from DELIVERY_PLAN §7.

| Window | Calendar range | Theme | Exit criterion |
|---|---|---|---|
| Day 0–14 | 2026-04-20 → 2026-05-03 | Sprint 1 wrap + composer spike | `composeDaily` against seed runs end-to-end in browser |
| Day 15–30 | 2026-05-04 → 2026-05-17 | MVP alpha — composer + accept/edit/reject | TodayBoard renders real composition; cycle state machine alive |
| Day 31–60 | 2026-05-18 → 2026-06-16 | MVP beta — reflection, kaizen navigator, variance | Full day-in-life loop works for 5 consecutive days on dogfood |
| Day 61–90 | 2026-06-17 → 2026-07-16 | MVP GA + hardening | Invariants ≥95% coverage; Lighthouse ≥90; 14-day self-host |
| Day 91–120 | 2026-07-17 → 2026-08-15 | V1 foundation — Postgres migrate, Next.js shell | Feature parity on V1 stack behind flag |
| Day 121–150 | 2026-08-16 → 2026-09-14 | V1 expansion — weekly composer, calendar adapter | Pilot partner onboarded |

**Milestones (date / deliverable / invariant to hold):**

| Day | Date | Milestone | Invariant gate |
|---|---|---|---|
| 14 | 2026-05-03 | Composer spike on `/today` (seed data) | I-1 (capacity), I-7 (CI floor) hold on seed |
| 28 | 2026-05-17 | Accept/Edit/Reject wired; Activity timer | I-2 (one active cycle), I-6 (Activity⊆Block) |
| 45 | 2026-06-03 | Reflection + Kaizen navigator | I-3 (DMAIC precondition), I-13 (Reflection ties to cycle) |
| 60 | 2026-06-18 | MVP beta dogfood | All 18 invariants enforced at write |
| 90 | 2026-07-18 | MVP GA | p95 composer ≤100ms; Lighthouse ≥90 |
| 120 | 2026-08-17 | V1 stack feature-flagged | Postgres parity with localStorage |
| 135 | 2026-09-01 | Calendar adapter + weekly composer | I-14 (externalMinutes honoured), weekly-specific I-16/I-17 |

**Per-window cadence (what gets built vs. what gets demoed each window):**

| Window | Build focus | Demoable artefact | Dogfood state |
|---|---|---|---|
| Day 0–14 | Composer core + seed | Composer JSON output in console | Internal only |
| Day 15–30 | TodayBoard + accept flow | Screen-recording of one cycle | Phil uses daily |
| Day 31–60 | Reflection + kaizen nav + variance | 5-day dogfood log posted publicly | Phil full-time |
| Day 61–90 | Hardening + metrics | Metrics dashboard + 30d data | Phil + 1 alpha user |
| Day 91–120 | Stack port | V1 behind feature flag | Phil dual-stack |
| Day 121–150 | Weekly + calendar | Pilot partner live | Pilot + Phil |

### 5.4 Implementation Order

Execution order for the 18 epics. Rationale is **unblocks** — each builds the scaffold the next needs.

| # | Epic | Why now |
|---|---|---|
| 1 | E1 Domain types + EventBus | Every downstream file imports types; events define cross-module API |
| 2 | E2 Persistence (LocalStorageRepository + migrations) | Services need a home before they can be written |
| 3 | E4 Standard Work Catalog (CRUD + seed) | Composer requires entries to select from |
| 4 | E3 Cycle state machine | Composer output flows into Cycle; state rules drive UI |
| 5 | E5 ComposerService (`composeDaily`) | Core value; unblocks TodayBoard |
| 6 | E6 TodayBoard (CycleCard + BucketStrip render) | First user-visible surface |
| 7 | E8 Accept/Edit/Reject flow | Closes composer → cycle loop |
| 8 | E7 Activity timer + log | Cycle in motion; rebucket needs this |
| 9 | E9 Rebucket + `canRebucket` + VarianceLog writes (E14 folded) | Honest variance from day one |
| 10 | E10 Mid-cycle reflection | Hooks into cycle transitions |
| 11 | E11 EoD reflection + friction log | Closes day |
| 12 | E12 Kaizen navigator (D→M→A→I→C) | Friction → kaizen path |
| 13 | E14 VarianceLog consumer surface (read/filter) | Data has been written since step 9; expose it |
| 14 | E18 Catalog health report | Needs enough history; easy win |
| 15 | E13 MetricsService + dashboard | Rollups from accumulated activity |
| 16 | E15 Composer telemetry | Perf regression guard ongoing |
| 17 | E16 InvariantEngine hardening | Tighten from assertions to runtime gate |
| 18 | E17 Reflection→Kaizen hand-off | Polish; closes flywheel |

### 5.5 Repo Structure (MVP)

```text
kaizen/
  index.html
  styles.css
  Caddyfile
  ARCHITECTURE.md
  DELIVERY_PLAN.md
  ENGINE_DESIGN.md
  SCHEDULING_BLUEPRINT.md
  SCHEDULING_ARCHITECTURE.md     (this file)
  SCHEDULING_DELIVERABLES.md     (Phase 6)
  package.json                   (devDeps only: none; test runner built-in)
  js/
    boot.js
    domain/
      types.js
      invariants.js
      composer/
        composeDaily.js
        composeWeekly.js
        validate.js
        score.js
        buckets.js
        eligibility.js
        explain.js
      cycle/
        stateMachine.js
      kaizen/
        dmaic.js
        pdca.js
    events/
      events.js                  (EventBus)
      catalog.js                 (event name + payload registry)
    persistence/
      LocalStorageRepository.js
      InMemoryRepository.js
      migrations/
        001-init.js
        002-variance-log.js
      archiver.js
    services/
      CatalogService.js
      ComposerService.js
      ActivityService.js
      ReflectionService.js
      VarianceService.js
      KaizenService.js
      PdcaService.js
      MetricsService.js
      InvariantEngine.js
    components/
      TodayBoard.js
      CycleCard.js
      BucketStrip.js
      BlockTile.js
      ReflectionSheet.js
      KaizenNavigator.js
      VarianceLogView.js
      CatalogBrowser.js
    ui/
      dnd.js
      timer.js
      router.js                  (hash-based)
  seed/
    catalog.json
    user.json
  test/
    domain/
      composeDaily.test.js
      invariants.test.js
      canRebucket.test.js
    services/
      ComposerService.test.js
      KaizenService.test.js
    persistence/
      LocalStorageRepository.test.js
  bench/
    composer.bench.js
```

### 5.6 Key Services / Modules — Dependency Graph

```text
                          InvariantEngine
                                ^
                                | validates
                                |
              +---------+   +------------+   +---------+
              | Catalog |<--| Composer   |-->| Activity|
              | Service |   | Service    |   | Service |
              +---------+   +------------+   +---------+
                   ^              ^   ^            ^
                   |              |   |            |
                   |       +------+   +-----+      |
                   |       |                |      |
              +----+----+  |  +----------+  |  +---+----+
              | Kaizen  |<-+  | Variance |<-+  | Reflect|
              | Service |     | Service  |     | Service|
              +---------+     +----------+     +--------+
                   ^               ^               ^
                   |               |               |
                   +------+--------+-------+-------+
                          |                |
                    +-----+-----+   +------+------+
                    | Pdca      |   | Metrics     |
                    | Service   |   | Service     |
                    +-----------+   +-------------+
                          |                |
                          v                v
                  +-----------------------------+
                  |   EventBus + Repository     |
                  +-----------------------------+
```

| Dependency edge | Nature |
|---|---|
| Composer → Catalog | read eligible entries |
| Composer → Activity | read recent history for balance |
| Composer → Kaizen | DMAIC-eligibility |
| Composer → Variance | recent-variance bias |
| Activity → Composer | rebucket validation |
| Activity → Variance | emit on rebucket/complete |
| Reflection → Kaizen | friction → D-stage skeleton |
| Kaizen → Pdca | nested experiments |
| Kaizen → Catalog | promote SDCA → new entry |
| Metrics → all | read-only aggregation |
| All → InvariantEngine | pre-commit validation |

### 5.7 Engineering Milestones (demoable)

| # | Date | Demoable surface | Invariant(s) that must hold |
|---|---|---|---|
| M1 | 2026-05-03 | `composeDaily` over seed returns a Composition; rendered as plain JSON in console | I-1, I-7, I-8 |
| M2 | 2026-05-17 | TodayBoard shows proposed CycleCard; Accept persists to localStorage; reload hydrates | I-2, I-6, I-11 |
| M3 | 2026-06-03 | Drag-rebucket works; VarianceLog entry appears; Mid-cycle reflection prompts | I-6, I-9, I-13 |
| M4 | 2026-06-18 | Kaizen D→M→A→I→C walkthrough; catalog step eligibility updates | I-3, I-4, I-15 |
| M5 | 2026-07-03 | Metrics dashboard with takt attainment, variance ratio, kaizen cycle time | Metrics computed deterministically from event log |
| M6 | 2026-07-18 | MVP GA: 14-day self-host on dogfood; p95 composer ≤100 ms in prod env | All I-1..I-18 |
| M7 | 2026-08-17 | V1 stack flagged-on: same demo on Next.js + Postgres | Parity invariant set + Postgres-specific |
| M8 | 2026-09-01 | Weekly composer + calendar adapter; pilot partner onboarded | Weekly invariants + I-14 (external-minute honour) |

### 5.8 Risks + What to Prototype First

**Carry-over from DELIVERY_PLAN §8 (top 5 only):** R1 scope-creep, R2 single-developer, R3 vague domain model, R4 data migration, R5 invariant coverage.

**Scheduling-specific risks:**

| # | Risk | Severity | Likelihood | Mitigation | Trigger-to-act |
|---|---|---|---|---|---|
| S1 | `composeDaily` p95 exceeds 100ms on realistic catalog | High | Med | CI bench on every PR; profile hotspots; pre-index catalog by bucket+tag | p95 >80ms in bench |
| S2 | Drag-rebucket unreliable on touch devices | Med | High | Defer touch to V1; keyboard-first ARIA DnD; treat mobile as read-only MVP | Any failed touch test |
| S3 | Rebalance edge cases (accept → edit → reject → re-propose) corrupt cycle state | High | Med | State machine covered by property tests; event-sourced reconstruct helper | Any reported stuck cycle |
| S4 | localStorage ceiling hit before V1 | Med | Low-Med | Archiver at 4MB; compress composition history; move to IndexedDB if needed | 3MB watermark reached |
| S5 | Invariant violations discovered late (after data is dirty) | High | Med | InvariantEngine at every write; boot-time full-store audit; quarantine flag on dirty rows | Any violation in audit |
| S6 | Composer output feels arbitrary (users reject every day) | High | Med | `explain[]` surfaced in UI; allow user to pin/avoid entries; weekly calibration from VarianceLog | Reject rate >30% for 5 days |
| S7 | DMAIC eligibility too strict — user stuck unable to advance kaizen | Med | Med | Override path with reason logged; periodic review of precondition strictness | Any user override |
| S8 | External-minute feed unavailable or wrong | Med | High (V1) | Manual input fallback; calendar adapter runs async and non-blocking | Adapter error rate >1% |
| S9 | Kaizen closure without measurable impact (vanity kaizen) | Med | High | Metrics-gated KaizenClosed: require a metric delta or explicit "no-impact" reason | >40% no-impact closures |
| S10 | Catalog inflation (users add but never retire) | Low | High | Weekly CatalogHealthReport; auto-retire after 90d inactivity | Catalog >200 entries |

**Prototype priority (Sprint 2, week 1):**

| Order | Prototype | Why first | Success signal |
|---|---|---|---|
| 1 | `composeDaily` over static seed | De-risks core algorithm; pure function; testable in Node | Returns valid Composition in <50ms on seed |
| 2 | `validateComposition` against all 18 invariants | Proves invariant set is enforceable; catches conflicts | All seed compositions pass; hand-crafted bad ones fail with the right code |
| 3 | CycleCard + BucketStrip render a Composition | First visible output; unblocks UX feedback | Renders at 60fps; all fields from Composition shown |
| 4 | Accept / Edit / Reject wired to LocalStorageRepository | Proves the event loop end-to-end | Reload restores accepted cycle; reject clears; edit persists diff |

These four deliverables together constitute the Day-14 milestone (M1) and de-risk the remainder of the MVP. Every later epic extends them — none replaces them.

**Prototype kill-criteria (when to stop and rethink):**

| Prototype | Kill if | Pivot option |
|---|---|---|
| `composeDaily` | p95 > 250ms after optimisation attempts | Split composer into candidate-cache + per-day assembly; denormalise eligibility into a precomputed view |
| `validateComposition` | Any pair of invariants mutually unsatisfiable on realistic data | Demote one to advisory; document the relaxation |
| CycleCard render | Design review shows users can't identify bucket totals in <3s | Bring in focused UX iteration; fall back to vertical list layout |
| Accept/Edit/Reject | State machine needs >6 states or has unreachable transitions | Flatten to command-pattern with explicit log; delete edit flow from MVP |

**Observability from day one:** every service entry point records `{service, method, durationMs, result}` into a ring buffer in-memory (MVP) or to a `telemetry_events` table (V1). Composer telemetry additionally captures `composerInputsSnapshot.size`, `candidateCount`, `blocksPlaced`, `invariantChecks`, `explainEntries`. Ring buffer drains to console on boot and to `bamx:v1:telemetry:recent` on every write.

**Exit criteria for "done":** MVP is done when Phil has self-hosted for 14 consecutive days with zero manual data edits, zero invariant violations in the audit log, and composer accept-rate ≥ 70%.

---

---

## Appendix A — Glossary (scheduling-local)

| Term | Definition |
|---|---|
| CadencePlan | The daily/weekly plan composed from Standard Work Catalog entries, subject to invariants |
| Cycle | A single focus unit (default 90 min) covering one or more Blocks |
| Block | An atomic placement of a Catalog entry into a Cycle with planned minutes |
| Bucket | Classification of work: PROJECT, COMMUNICATION, or CI |
| CI | Continuous Improvement — kaizen, learning, skill-build, tool-build |
| Composition | Composer output: ordered `Block[]` with metadata + snapshot |
| InfeasibleResult | Structured non-error signalling composer couldn't satisfy constraints |
| composerInputsSnapshot | Deep-copy of every input used to produce a Composition (for replay) |
| explain[] | Per-placement `{reason, ruleId, evidence}` array for auditability |
| Rebucket | Re-classifying an Activity into a different Bucket at completion time |
| VarianceLog | Append-only record of deviation between plan and actual |
| DMAIC | Kaizen lifecycle stages: Define, Measure, Analyze, Improve, Control |
| Payload step | A CatalogEntry registered as the concrete work for a DMAIC stage |
| PICK matrix | Possible / Implement / Challenge / Kill prioritization used on Kaizens |
| SDCA | Standardize-Do-Check-Act — conversion of proven kaizen into standard work |

## Appendix B — Cross-reference summary

| Subject | Primary source | This doc section |
|---|---|---|
| localStorage key layout | ARCH §7.1 | 4.5, 4.6 |
| Postgres schema sketch | ARCH §7.3 | 4.3, 4.7, Appendix B-table |
| REST API sketch | ARCH §7.4 | 4.3 (endpoint table) |
| Composer algorithm detail | ENGINE_DESIGN §2–4 | 4.4 (signatures, phases) |
| Performance targets | ENGINE_DESIGN §4 | 4.4, 4.6 |
| 18-epic catalogue | DELIVERY_PLAN §5 | 5.4 (ordering rationale) |
| 30/60/90/120/150 windows | DELIVERY_PLAN §7 | 5.3 (calendar mapping) |
| 18 risks (carry-over) | DELIVERY_PLAN §8 | 5.8 (plus 10 new) |
| Invariants I-1..I-18 | SCHEDULING_BLUEPRINT §3 | 4.4, Invariant register |
| Phase 6 artefacts | SCHEDULING_DELIVERABLES.md | — (not here) |

---

**End of Phases 4 & 5.** Phase 6 (PRD, schema, types, seed, build prompt) continues in `SCHEDULING_DELIVERABLES.md`.
