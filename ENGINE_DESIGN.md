# BAM-X Kaizen OS — Core Engine Design

Owner: Backend + Logic Engineer Agent
Status: Draft v0.3 — v0.3 extends the DMAIC payload selector (§4.2) with the project-type + phase-binding filter needed by the 30-Day Kaizen Accelerator (`PROJECT_TYPE_30D_KAIZEN.md §5.1`), preserves the existing priority-ranking function, and references `ARCHITECTURE.md` v0.4. v0.2 grounded in `PRODUCT_BLUEPRINT.md` v0.2, `ARCHITECTURE.md` v0.3, `CATALOG_GAPS.md` v0.1 §H, `UX_FLOWS.md` v0.2 §4. All v0.1 engine-flagged architecture gaps resolved in the architecture v0.3 bump.
Scope: implementation-ready engine spec for MVP (vanilla JS + localStorage, single-user) with forward compatibility to Next.js + PostgreSQL.

> **Terminology reconciliation (driving prompt vs blueprint).** Where the prompt says "intentions" read `ScheduledActivity.intention` (a field). Where it says "by phase" read "by bucket" (`PROJECT` / `COMMUNICATION` / `CI`). Where it says "recurring patterns" read "catalog cadence composed into Cycles". Where it says "PDCA / DMAIC / Kaizen" read the `Kaizen` entity (one active per user, MVP) with DMAIC catalog activities `#20–#41` or Kaizen catalog activities `#42–#50` as payload; PDCA is catalog entry `#12` with a 48-hour micro-cycle.
>
> All entity, state, event, and invariant names are taken verbatim from `ARCHITECTURE.md` §§2–6. No new entities are introduced. Discovered mismatches are flagged as `> **Architecture gap:** …` with a proposed resolution.

---

## 1. Scheduling Algorithm (step-by-step)

Two composers ship in MVP: **Daily composer** (`ComposerService.composeDaily`) and **Weekly composer** (`ComposerService.composeWeekly`). Both are deterministic, inspectable, and free of AI. Their output is a `Composition` in state `PROPOSED` plus a `why[]` audit trail attached to `composerInputsSnapshot.explain` so the UI can render "this block was chosen because X."

### 1.1 Composer input contract (shared)

Matches `ARCHITECTURE.md` §4.1 exactly. All fields required; no defaults at the composer boundary (defaults are applied upstream in `ComposerService`).

```js
// @typedef ComposerInput
// {
//   cycleType: 'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY',
//   userId: string,
//   date: ISODate,                         // the target day (DAILY) or Monday of week (WEEKLY)
//   role: Role[],                          // from User.role
//   dailyCapacityMinutes: integer,         // from User; default 480
//   externalMinutesToday: integer,         // 0..240; ARCHITECTURE §5.5
//   sprintPhase: SprintPhase,              // computed from User.sprintAnchorDate vs date
//   activeKaizen: Kaizen | null,
//   varianceQueue: Variance[],             // unresolved non-optional skips from prior cycle
//   catalog: CatalogEntry[],               // enabled entries for user's roles
//   priorCompositions: Composition[],      // cadence / rotation memory
//   signals: {                             // on-signal triggers live here; no guessing
//     inboxOverThreshold: boolean,         // #13 6S Email
//     documentAwaitingReview: string[],    // #4 Document Review
//     innovationStageReady: string[]       // #7–#11
//   }
// }
```

### 1.2 Daily composer — 10-step algorithm `composeDaily(input)`

The algorithm is **"place non-optionals, reserve external, pack buckets by rule, emit or INFEASIBLE."** Every placement appends to `why[]`.

```js
const composeDaily = (input) => {
  assert(input.cycleType === 'DAILY');

  // STEP 1 — Compute bucket targets from capacity + externalMinutesToday
  const targets = computeBucketTargets(input);          // §2.1
  const ceilings = computeBucketCeilings(targets);      // §2.2
  const floors = computeBucketFloors(targets);          // §2.2
  const placed = [];                                    // ScheduledActivity drafts
  const why = [];                                       // [{activityRef, rule, detail}]
  const remaining = { ...targets };                     // mutable running budget

  // STEP 2 — Place daily non-optionals (R1)
  //   Daily Standup (15, COMMUNICATION)
  //   AM High-value Communication block (60, COMMUNICATION)
  //   Post-lunch High-value Communication block (30, COMMUNICATION)
  //   End-of-Activity Reflection meta-slot (15, CI)    // generic §H.2 row
  for (const e of DAILY_NON_OPTIONAL_SET) {             // §3.4 list
    const block = materialize(e, input, { anchor: e.anchor });
    placed.push(block);
    remaining[block.bucket] -= block.plannedDurationMinutes;
    why.push({ ref: e.id, rule: 'R1_NON_OPTIONAL', detail: e.name });
  }

  // STEP 3 — Rescue yesterday's skipped non-optionals (R2)
  for (const v of input.varianceQueue) {
    if (v.kind !== 'SKIPPED_NON_OPTIONAL') continue;
    const e = input.catalog.find(c => c.id === v.catalogEntryId);
    if (!e || !fits(e, remaining)) continue;
    placed.push(materialize(e, input, { carriedOver: true }));
    remaining[e.bucket] -= e.defaultDurationMinutes;
    why.push({ ref: e.id, rule: 'R2_VARIANCE_RESCUE', detail: `carried from ${v.loggedAt}` });
  }

  // STEP 4 — Place sprint-phase ceremonies (R4.1 — phase-specific)
  //   PLANNING_DAY  → Sprint Planning (120, COMMUNICATION)
  //   MID_SPRINT_DAY → Mid-Sprint Review (30, COMMUNICATION)
  //   REVIEW_DAY    → Sprint Review (60, COMMUNICATION) + Sprint Retrospective (30, COMMUNICATION)
  //   (RETRO_DAY is the same Friday as REVIEW_DAY in the 2-week sprint; a single constant.)
  for (const e of ceremoniesForPhase(input.sprintPhase)) {
    assert(fits(e, remaining), 'PHASE_CEREMONY_OVER_CAPACITY');   // cannot skip a phase ceremony
    placed.push(materialize(e, input));
    remaining[e.bucket] -= e.defaultDurationMinutes;
    why.push({ ref: e.id, rule: 'R4_PHASE_CEREMONY', detail: input.sprintPhase });
  }

  // STEP 5 — Place Deep Work payload (R3) — the PROJECT bucket's main block(s)
  //   If activeKaizen && next DMAIC/Kaizen step fits → linked Deep block
  //   Else → "Deep Work — Project Task (generic)" from §H.2
  const deep = selectDeepPayload(input);                // §1.6
  const deepMinutes = Math.min(deep.defaultDurationMinutes, remaining.PROJECT);
  const slices = sliceDeep(deepMinutes, input);         // default 2×deepMinutes/2
  for (const s of slices) {
    placed.push(materialize(deep, input, {
      plannedDurationMinutes: s.minutes,
      plannedStartAt: s.startAt,
      linkedKaizenId: input.activeKaizen?.id ?? null,
      linkedDmaicStepRef: input.activeKaizen
        ? { kaizenId: input.activeKaizen.id, catalogEntryId: deep.id } : null
    }));
    remaining.PROJECT -= s.minutes;
  }
  why.push({ ref: deep.id, rule: 'R3_KAIZEN_LINK', detail: input.activeKaizen?.id ?? 'generic_deep' });

  // STEP 6 — Fill remaining CI bucket by deterministic rotation (§1.5)
  while (remaining.CI >= 30) {
    const next = pickCI(input, placed, remaining.CI);   // §1.5
    if (!next) break;                                    // no eligible CI — stop
    placed.push(materialize(next.entry, input, { plannedDurationMinutes: next.minutes }));
    remaining.CI -= next.minutes;
    why.push({ ref: next.entry.id, rule: 'R_CI_ROTATION', detail: next.reason });
  }

  // STEP 7 — Fill remaining COMMUNICATION bucket
  //   Wed/Thu → #16 (1:1), else #15 (team meeting), else "Value-Added Communication (generic)" §H.2
  while (remaining.COMMUNICATION >= 15) {
    const next = pickCommFiller(input, placed, remaining.COMMUNICATION);
    if (!next) break;
    placed.push(materialize(next.entry, input, { plannedDurationMinutes: next.minutes }));
    remaining.COMMUNICATION -= next.minutes;
    why.push({ ref: next.entry.id, rule: 'R_COMM_FILLER', detail: next.reason });
  }

  // STEP 8 — Order the day (§1.7). Does not change bucket totals; only plannedStartAt.
  orderDay(placed, input);                              // mutates plannedStartAt in place

  // STEP 9 — Validate against InvariantEngine (single authoritative check)
  const result = validateComposition({                  // §2.5
    cycleType: 'DAILY',
    activities: placed,
    userDailyCapacityMinutes: input.dailyCapacityMinutes,
    externalMinutesToday: input.externalMinutesToday
  });
  if (!result.ok) {
    // R8 — try to relax configurable entries once, then surface INFEASIBLE
    const relaxed = relaxConfigurable(placed, result);
    if (relaxed) return composeDaily({ ...input, _retried: true, _seed: relaxed });
    return { state: 'INFEASIBLE', reason: result.failureCode, shortfall: result.detail, why };
  }

  // STEP 10 — Build the Composition, freeze composerInputsSnapshot, return PROPOSED
  return buildComposition({
    userId: input.userId,
    cycleType: 'DAILY',
    startAt: startOfWorkday(input.date, input),
    endAt: endOfWorkday(input.date, input),
    state: 'PROPOSED',
    activities: placed.map(p => ({ ...p, state: 'PROPOSED', sourceOfSchedule: 'COMPOSER_AUTO' })),
    composerInputsSnapshot: {
      role: input.role,
      capacityMinutes: input.dailyCapacityMinutes,
      externalMinutesToday: input.externalMinutesToday,
      sprintPhase: input.sprintPhase,
      activeKaizenId: input.activeKaizen?.id ?? null,
      varianceCount: input.varianceQueue.length,
      explain: why
    },
    invariantChecks: result.detail
  });
};
```

**DAILY_NON_OPTIONAL_SET** (locked seed, per `PRODUCT_BLUEPRINT.md` §3.4 + `CATALOG_GAPS.md` §H.2):

| # | CatalogEntry | Bucket | Default min | Anchor |
|---|---|---|---|---|
| a | Daily Standup | COMMUNICATION | 15 | 09:00 local |
| b | High-value Communication Time-blocking — AM | COMMUNICATION | 60 | 09:15 local (contiguous with standup) |
| c | High-value Communication Time-blocking — Post-lunch | COMMUNICATION | 30 | 13:00 local |
| d | End-of-Activity Reflection (meta-slot) | CI | 15 | 17:00 local |

The 15-min End-of-Activity Reflection meta-slot is not an activity the user runs; it is a reserved 15-min close-of-day buffer that guarantees the 60-second reflections on every other activity actually fit inside capacity. It is itself a `ScheduledActivity` of the `End-of-Activity Reflection` generic entry (`CATALOG_GAPS.md §H.2`) so adherence math stays uniform.

> **Architecture gap:** `ARCHITECTURE.md` §4.2 lists this reserve as `"End-of-day Reflection (meta)"`. It is the same thing as the `End-of-Activity Reflection` generic from `CATALOG_GAPS.md §H.2` but named inconsistently. **Resolution:** treat the CATALOG_GAPS name as canonical; the Daily composer's meta-slot is a `ScheduledActivity` instance of the generic `End-of-Activity Reflection` catalog entry with `plannedDurationMinutes = 15`. No new entity; rename in `ARCHITECTURE.md` §4.2 in a follow-up edit.

### 1.3 Weekly composer — algorithm `composeWeekly(input)`

```js
const composeWeekly = (input) => {
  assert(input.cycleType === 'WEEKLY');
  const weeklyWhy = [];

  // STEP W1 — Determine workdays
  const workdays = datesForWorkDays(input.date, input.workDays); // Mon..Fri by default

  // STEP W2 — Compose each Daily cycle with the weekly context attached
  //            (prior-composition list accumulates as the week fills so CI rotation
  //             doesn't repeat L&D on both Mon and Tue).
  const dailies = [];
  const accumulated = [...input.priorCompositions];
  for (const d of workdays) {
    const dailyInput = {
      ...input,
      cycleType: 'DAILY',
      date: d.iso,
      sprintPhase: sprintPhaseFor(d.iso, input),
      priorCompositions: accumulated
    };
    const daily = composeDaily(dailyInput);
    if (daily.state === 'INFEASIBLE') return { state: 'INFEASIBLE', reason: daily.reason, day: d.iso };
    dailies.push(daily);
    accumulated.push(daily);
    weeklyWhy.push({ ref: daily.id, rule: 'WEEK_DAY_COMPOSED', detail: d.iso });
  }

  // STEP W3 — Attach weekly non-optionals to their anchor day
  //   Mid-Sprint Review → Fri of Wk1 of sprint (if mid-sprint)
  //   Weekly 1:1 (#16) → Wed preferred, else Thu
  //   Weekly L&D tick (#1 or #2) or Document Writing (#18) → one weekday slot in CI
  //   6S Email (#13) → Mon or the earliest weekday if inboxOverThreshold
  //   Weekly Reflection (20-min DMAIC) → Fri afternoon, bucket=CI, protected (§H.2)
  attachWeeklyAnchor(dailies, 'Mid-Sprint Review',       fridayOf(1), 'COMMUNICATION', 30, weeklyWhy, {onlyIf: isMidSprint});
  attachWeeklyAnchor(dailies, 'Connecting w/ teammates', preferred(WED, THU), 'COMMUNICATION', 20, weeklyWhy);
  attachWeeklyAnchor(dailies, 'Weekly L&D tick',         firstAvailableCI(dailies), 'CI', 60, weeklyWhy);
  if (input.signals.inboxOverThreshold)
    attachWeeklyAnchor(dailies, '6S Email Activity',     MON, 'CI', 30, weeklyWhy);
  attachWeeklyAnchor(dailies, 'Weekly Reflection',       FRI_PM, 'CI', 20, weeklyWhy, {protected: true});

  // STEP W4 — Enforce weekly cross-day invariants (§2.3)
  const weekly = validateWeekly({ dailies, userDailyCapacityMinutes: input.dailyCapacityMinutes });
  if (!weekly.ok) {
    // If PROJECT < 1200 across the week, demote a CI filler on the lowest-PROJECT day into PROJECT
    const rebalanced = rebalanceWeeklyProject(dailies, weekly);
    if (!rebalanced) return { state: 'INFEASIBLE', reason: weekly.failureCode, detail: weekly.detail };
  }

  // STEP W5 — Build the weekly Composition with parent links
  return buildComposition({
    userId: input.userId,
    cycleType: 'WEEKLY',
    startAt: workdays[0].start,
    endAt: workdays[workdays.length-1].end,
    state: 'PROPOSED',
    children: dailies.map(d => d.id),                   // FK via parentCompositionId on each Daily
    composerInputsSnapshot: { ...input, explain: weeklyWhy },
    invariantChecks: weekly.detail
  });
};
```

### 1.4 Bucket mapping — how a catalog entry lands in a bucket

Every `CatalogEntry.bucket` is seeded from `CATALOG_GAPS.md §H.1` (approved). The composer **never infers** bucket; it reads `catalogEntry.bucket` and that value is frozen onto `ScheduledActivity.bucket` at schedule time (`ARCHITECTURE.md` §2.5 invariant). DMAIC (`#20–#41`) and Kaizen (`#42–#50`) entries all have `bucket=PROJECT`; they fill the Deep payload slot when an active Kaizen is the current payload.

### 1.5 CI bucket selection heuristic `pickCI(input, placed, remainingCI)`

The CI bucket has three slots to fill on most days (≤ 120 min total). Selection is deterministic. For each candidate, compute a priority score; pick the highest. Ties break by `catalogEntry.id` ASC (stable, reproducible).

```js
const pickCI = (input, placed, remainingCI) => {
  const candidates = input.catalog.filter(c =>
    c.bucket === 'CI' &&
    c.enabledByUser &&
    appliesToRole(c, input.role) &&
    !alreadyPlacedToday(c, placed) &&
    c.defaultDurationMinutes <= remainingCI
  );

  const scored = candidates.map(c => ({
    entry: c,
    minutes: Math.min(c.defaultDurationMinutes, remainingCI),
    priority: ciPriority(c, input),
    reason: ciReason(c, input)
  }));

  scored.sort((a, b) =>
    b.priority - a.priority ||
    a.entry.id.localeCompare(b.entry.id)
  );

  return scored[0] ?? null;
};

const ciPriority = (c, input) => {
  // Highest priority (100s) = on-signal work that has a concrete trigger right now.
  if (c.name === 'Document Review'      && input.signals.documentAwaitingReview.length > 0) return 100;
  if (c.name === '6S Email Activity'    && input.signals.inboxOverThreshold)                return 95;

  // Next (80s) = the 48-hour PDCA micro-cycle if the user has an active PDCA experiment
  //              AND the last PDCA tick was >= 42h ago (buffer so we don't double-fire).
  if (c.activityNumber === 12 && pdcaActive(input) && hoursSinceLastPdca(input) >= 42)      return 80;

  // Next (60s) = the weekly-cadenced personal/team L&D tick if it has not fired yet this week.
  if ((c.activityNumber === 1 || c.activityNumber === 2) && !firedThisWeek(c, input))        return 60;

  // Default (40) = continuous CI backlog (Innovation Explore, Compliance Training if window).
  if (c.cadence === 'CONTINUOUS' || c.cadence === 'MONTHLY')                                 return 40;

  // Anchor (20) = Weekly Reflection, but only on Fri PM; otherwise 0 so it doesn't fire Tue.
  if (c.name === 'Weekly Reflection' && isFridayAfternoon(input))                            return 20;

  return 0;
};
```

**Explanation of the heuristic (for the `why` field):**
- *"Document Review was chosen because a PRFAQ arrived on Tue and reading it is time-sensitive."*
- *"6S Email was chosen because your inbox is over the threshold signal."*
- *"PDCA Cycle was chosen because you have an active experiment and your last tick was 48h ago."*
- *"Personal L&D was chosen because no L&D tick has fired this week."*

### 1.6 Deep Work payload selection `selectDeepPayload(input)`

```js
const selectDeepPayload = (input) => {
  if (input.activeKaizen) {
    const step = nextDmaicOrKaizenStep(input.activeKaizen, input.catalog);
    if (step) return step;     // DMAIC #20–#41 or Kaizen #42–#50 whichever is next
  }
  return findCatalogEntry(input.catalog, 'Deep Work — Project Task (generic)'); // §H.2
};

const nextDmaicOrKaizenStep = (kaizen, catalog) => {
  // Kaizen.state=ACTIVE and mode=DMAIC → walk DMAIC sequence (§4.2) and return the
  //   first entry whose output artifact is not yet present on any prior ScheduledActivity
  //   linked to this kaizen.
  // Kaizen.state=ACTIVE and mode=KAIZEN_EVENT → walk the #42–#50 sequence identically.
  const seq = sequenceFor(kaizen);               // [#20, #21, #22, ...] or [#42, #43, ...]
  return seq
    .map(n => catalog.find(c => c.activityNumber === n))
    .find(c => !hasOutputArtifact(kaizen.id, c.id));
};
```

### 1.7 Ordering heuristic `orderDay(placed, input)`

Anchors are fixed; everything else packs around them.

```
06:00 ────────────────────────────────────────────────────────────────
09:00  Daily Standup                (CEREMONY anchor, locked)         [R1]
09:15  AM High-value Communication  (COMMUNICATION anchor)             [R1]
10:15  Deep Work block 1            (PROJECT — "before lunch")         [R3 + ordering]
12:00  [lunch break — not scheduled, capacity-neutral]
13:00  Post-lunch High-value Comm   (COMMUNICATION anchor)             [R1]
13:30  Deep Work block 2 / DMAIC    (PROJECT)                           [R3]
15:30  CI block 1 (PDCA / L&D)      (CI — "toward close")               [CI rotation]
16:30  CI block 2 (6S Email etc.)   (CI)
17:00  End-of-Activity Reflection   (CI meta-slot)                      [R1 / reflection at end]
17:15 ────────────────────────────────────────────────────────────────
```

Rules the ordering obeys:
- **Ceremony anchors fixed.** Daily Standup at 09:00; Sprint Planning at 09:30 on Monday Wk1; Mid-Sprint Review at 15:00 Fri Wk1; Sprint Review at 14:00 Fri Wk2 followed immediately by Sprint Retrospective.
- **Deep before lunch.** The first Deep slice is placed contiguous with AM Communication end and before the 12:00 break.
- **CI toward close.** CI blocks pack into the afternoon after Deep block 2.
- **Reflection at end.** `End-of-Activity Reflection` meta-slot is always the last block.
- **Carried-over rescue blocks** (R2) take the first available slot in their bucket after the anchors, before new CI rotation entries, so a skipped yesterday-block gets priority over a new L&D tick.
- **External meetings** (`externalMinutesToday > 0`) are not individually placed in MVP — they are a capacity drain only. The COMMUNICATION bucket target is reduced accordingly in Step 1; the order of composed blocks is unchanged.

### 1.8 INFEASIBLE — what the composer returns when capacity is oversubscribed

A composition cannot be silently truncated (R8). If after Step 4 (phase ceremonies) the non-optional set plus phase ceremonies exceeds capacity, the composer returns an `InfeasibleResult` per `ARCHITECTURE.md §4.7`:

```js
{
  kind: 'INFEASIBLE',
  totalRequiredMinutes: 495,
  capacityMinutes: 420,                  // dailyCapacityMinutes - externalMinutesToday
  shortfallMinutes: 75,
  bucketShortfalls: {
    PROJECT: 0,
    COMMUNICATION: 75,                   // ceremonies overflow COMMUNICATION
    CI: 0
  },
  suggestedActions: [
    { kind: 'RAISE_CAPACITY', currentMinutes: 480, suggestedMinutes: 540 },
    { kind: 'REDUCE_EXTERNAL', currentExternalMinutes: 60, suggestedExternalMinutes: 0 },
    { kind: 'SKIP_CEREMONY_WITH_REASON',
      catalogEntryId: 'ce_mid_sprint_review', ceremonyName: 'Mid-Sprint Review',
      defaultReasonCode: 'MEETING_CONFLICT' }
  ],
  explain: [
    'Required 495 min = non-optionals (360) + phase ceremonies (135).',
    'Capacity 420 min = 480 dailyCap − 60 externalMinutesToday.',
    'Shortfall 75 min in COMMUNICATION bucket.'
  ]
}
```

The UI renders the `explain` lines and the `suggestedActions` as buttons **in order** (guided remediation flow, `ARCHITECTURE.md §4.7`). Every action mutates the relevant input and re-invokes `composeDaily()`:
- **Raise capacity** — one-day or permanent override on `User.dailyCapacityMinutes`.
- **Reduce external minutes** — edits `Composition.externalMinutesToday`.
- **Skip ceremony with reason** — atomically logs a `Variance { kind: SKIPPED_NON_OPTIONAL, reasonCode, note }` and re-composes for today only; the next day's composer will re-queue the skipped non-optional per R2.
- **Defer non-optional to next day** — logs `Variance { kind: RESCHEDULED }` and re-composes.

Emits `ComposerInfeasible` event for the UI + `MetricsService` (chronic over-schedule indicator).

### 1.9 Worked example

**Input:**
- User: Practitioner role, `dailyCapacityMinutes = 480`, `timezone = America/Los_Angeles`
- Date: Tuesday 2026-04-21 (Execution Wk1 of the sprint)
- `externalMinutesToday = 60` (a scheduled external meeting 11:00–12:00)
- `activeKaizen`: DMAIC project `k_reduce_cycle_time`, next DMAIC step = catalog `#34 Cause & Effect Matrix` (duration 120 min)
- `varianceQueue`: 1 skipped non-optional from Monday — "Personal L&D tick (#1)" 60 min
- `signals`: `{ inboxOverThreshold: false, documentAwaitingReview: [], innovationStageReady: [] }`

**Bucket targets** (§2.1):
- `PROJECT = 240`, `COMMUNICATION = max(60, 120 − 60) = 60`, `CI = 120`. Composer warns on CycleCard: "Reserved 60 min of external meetings. COMMUNICATION bucket reduced to 60 min for today's composed blocks."

**Composed day (Step 10 output):**

| Time | Activity | Bucket | Min | Source | Why |
|---|---|---|---|---|---|
| 09:00 | Daily Standup | COMMUNICATION | 15 | COMPOSER_AUTO | R1_NON_OPTIONAL |
| 09:15 | AM High-value Communication | COMMUNICATION | 45 | COMPOSER_AUTO | R1 + shrunk 60→45 to fit reduced COMM target |
| 10:00 | Deep Work — DMAIC #34 (slice 1) | PROJECT | 60 | COMPOSER_AUTO | R3_KAIZEN_LINK (linkedKaizenId=k_reduce_cycle_time) |
| 11:00 | [external meeting — capacity only] | — | 60 | external | externalMinutesToday reservation |
| 12:00 | [lunch] | — | — | — | — |
| 13:00 | Post-lunch High-value Communication | COMMUNICATION | 0 | — | SHRUNK TO 0 — see note |
| 13:00 | Deep Work — DMAIC #34 (slice 2) | PROJECT | 60 | COMPOSER_AUTO | R3 — split 120min across 2 slices |
| 14:00 | Deep Work — Project Task (generic) | PROJECT | 120 | COMPOSER_AUTO | PROJECT target top-up after DMAIC slices |
| 16:00 | Personal L&D tick (rescued) | CI | 60 | COMPOSER_AUTO | R2_VARIANCE_RESCUE (from 2026-04-20) |
| 17:00 | PDCA Cycle | CI | 30 | COMPOSER_AUTO | R_CI_ROTATION (PDCA active, ≥42h since last tick) |
| 17:30 | End-of-Activity Reflection (meta) | CI | 15 | COMPOSER_AUTO | R1_NON_OPTIONAL |

**Totals:** PROJECT 240, COMMUNICATION 60, CI 105. `COMMUNICATION floor = 30` (half of 60); OK. `CI floor = 60`; **OK at 105**. Total 405 min + 60 external = 465 min ≤ 480 cap.

> **Note on the 13:00 Post-lunch Communication shrink.** The non-optional set requires this block. COMMUNICATION target is only 60 min after external subtraction, and Daily Standup (15) + AM block (45) already consume all 60. In this situation the composer preserves the block at the minimum-viable value of **0 minutes is not allowed** — the composer falls back to a 15-minute post-lunch block and proportionally shortens AM from 45 to 30. **Corrected row:** AM 30 min, Post-lunch 15 min, total COMM 60 min. The composer always protects the *presence* of every non-optional over the *length* of any one.

Composition returned with `state='PROPOSED'`, `composerInputsSnapshot.explain = why[]` containing all 10 rule references.

---

## 2. Capacity Calculation Logic

All capacity math lives in a single pure module `CapacityEngine` (part of `InvariantEngine` in `ARCHITECTURE.md` §1.1). No side effects; no I/O; fully unit-testable.

### 2.1 `computeBucketTargets(input) → { PROJECT, COMMUNICATION, CI }`

```js
const computeBucketTargets = (input) => {
  const cap = input.dailyCapacityMinutes;              // User.dailyCapacityMinutes
  const scale = cap / 480;                              // half-day → 0.5; full day → 1.0
  const ext = Math.min(Math.max(input.externalMinutesToday ?? 0, 0), 240);

  // Proportional 4-2-2 scaling (ARCHITECTURE §5.1 — half-day = 2-1-1)
  let projectTarget       = Math.round(240 * scale);
  let commTarget          = Math.round(120 * scale);
  let ciTarget            = Math.round(120 * scale);

  // External meetings drain COMMUNICATION only (ARCHITECTURE §5.5).
  const commFloor = Math.max(60, Math.round(60 * scale));     // never below 60 min on a full day
  commTarget = Math.max(commFloor, commTarget - ext);

  return { PROJECT: projectTarget, COMMUNICATION: commTarget, CI: ciTarget, _ext: ext };
};
```

- **Half-day example:** `dailyCapacityMinutes = 240` → `scale = 0.5` → `{ PROJECT: 120, COMMUNICATION: 60, CI: 60 }` → 2-1-1 shape, not 4-2-2, but same ratios.
- **External overflow example:** `dailyCapacityMinutes = 480`, `externalMinutesToday = 90` → `{ PROJECT: 240, COMMUNICATION: 60, CI: 120 }`; composer surfaces warning "Reserved 90 min of external meetings. COMMUNICATION reduced to 60 min."
- **Floor guard:** if `ext > 120` the user is told "Reserved 150 min of external meetings exceeds today's Communication budget. Reduce external or raise capacity." COMMUNICATION is held at its 60-min floor regardless.

### 2.2 `computeBucketFloors(targets)` and `computeBucketCeilings(targets)`

```js
// Floors — minimum viable 4-2-2 guard (§5.2)
const computeBucketFloors = (targets) => ({
  PROJECT: Math.round(targets.PROJECT * 0.5),
  COMMUNICATION: Math.round(targets.COMMUNICATION * 0.5),
  CI: Math.round(targets.CI * 0.5)
});

// Ceilings — pack-to slack (§5.2; PROJECT has 10% slack, COMM/CI have 25%)
const computeBucketCeilings = (targets) => ({
  PROJECT: Math.round(targets.PROJECT * 1.10),
  COMMUNICATION: Math.round(targets.COMMUNICATION * 1.25),
  CI: Math.round(targets.CI * 1.25)
});
```

### 2.3 Weekly cross-day invariant — PROJECT ≥ 1200 min

`ARCHITECTURE.md` §5.3 states the weekly PROJECT floor is 1200 min (20h protected Deep). Individual days may be PROJECT-short if a ceremony (e.g., Sprint Review) crushes that day's Deep budget; the shortfall is recovered by raising PROJECT on other days in the same week.

```js
const validateWeekly = ({ dailies, userDailyCapacityMinutes }) => {
  const projectMinutes = dailies.reduce(
    (sum, d) => sum + bucketSum(d, 'PROJECT'), 0
  );
  if (projectMinutes < 1200) {
    return fail('WEEKLY_PROJECT_UNDER_FLOOR', {
      projectMinutes, requiredMinutes: 1200,
      shortfallBy: 1200 - projectMinutes
    });
  }

  for (const d of dailies) {
    const total = bucketSum(d, 'PROJECT') + bucketSum(d, 'COMMUNICATION') + bucketSum(d, 'CI');
    if (total > userDailyCapacityMinutes) {
      return fail('DAY_OVER_CAPACITY', { day: d.date, total, cap: userDailyCapacityMinutes });
    }
  }
  return ok({ projectMinutes, daysOk: dailies.length });
};
```

**Rebalance rule `rebalanceWeeklyProject(dailies, weekly)`:** if `projectMinutes < 1200`, the composer identifies the day with the most CI slack (actual CI > CI floor) and converts a `Deep Work — Project Task (generic)` block in for a low-priority CI block until the 1200 floor is met. If rebalance cannot find 1200 across 5 days without violating daily ceilings, the week is returned as `INFEASIBLE`.

### 2.4 Actual vs. planned tracking

Each `ScheduledActivity` carries both:
- `plannedStartAt` / `plannedDurationMinutes` — set by composer; immutable after `SCHEDULED`.
- `actualStartAt` / `actualEndAt` — set by `ActivityService.start()` / `.close()` respectively.

Derived at Reflection capture (`Reflection.planVsActualMinutes = (actualEndAt − actualStartAt) − plannedDurationMinutes`). **Over-run detection:**

```js
const computeVarianceOnClose = (sa) => {
  const actualDuration = (sa.actualEndAt - sa.actualStartAt) / 60000;
  const delta = actualDuration - sa.plannedDurationMinutes;
  if (delta >= 10) VarianceService.log({ scheduledActivityId: sa.id, kind: 'OVERRAN',  reasonCode: 'OTHER', note: `+${delta}m` });
  if (delta <= -10) VarianceService.log({ scheduledActivityId: sa.id, kind: 'UNDERRAN', reasonCode: 'OTHER', note: `${delta}m` });
};
```

10-minute hysteresis prevents noise.

### 2.5 `validateComposition()` — full signature

Extends `ARCHITECTURE.md` §5.6 to cover every `UX_FLOWS.md §4.3` message. Pure function, returns `{ ok, failureCode, detail }`.

```js
const validateComposition = ({
  cycleType,
  activities,                       // ScheduledActivity[]
  userDailyCapacityMinutes,
  externalMinutesToday = 0
}) => {
  const total = activities.reduce((s, a) => s + a.plannedDurationMinutes, 0);
  const effectiveCap = userDailyCapacityMinutes - externalMinutesToday;
  if (total > effectiveCap) {
    return fail('OVER_CAPACITY', { total, cap: effectiveCap, overBy: total - effectiveCap });
  }

  if (cycleType === 'DAILY') {
    const targets  = computeBucketTargets({ dailyCapacityMinutes: userDailyCapacityMinutes, externalMinutesToday });
    const floors   = computeBucketFloors(targets);
    const ceilings = computeBucketCeilings(targets);

    const p = sumBucket(activities, 'PROJECT');
    const m = sumBucket(activities, 'COMMUNICATION');
    const i = sumBucket(activities, 'CI');

    if (p < floors.PROJECT)       return fail('DEEP_UNDER_FLOOR',     { actual: p, floor: floors.PROJECT });
    if (m < floors.COMMUNICATION) return fail('COMM_UNDER_FLOOR',     { actual: m, floor: floors.COMMUNICATION });
    if (i < floors.CI)            return fail('CI_UNDER_FLOOR',       { actual: i, floor: floors.CI });
    if (p > ceilings.PROJECT)     return fail('PROJECT_OVERPACKED',   { actual: p, ceiling: ceilings.PROJECT });
    if (m > ceilings.COMMUNICATION) return fail('COMM_OVERPACKED',    { actual: m, ceiling: ceilings.COMMUNICATION });
    if (i > ceilings.CI)          return fail('CI_OVERPACKED',        { actual: i, ceiling: ceilings.CI });

    const missing = requiredNonOptionals('DAILY', activities);
    if (missing.length) return fail('NON_OPTIONAL_MISSING', { missing });
  }

  if (cycleType === 'WEEKLY') {
    return validateWeekly({ dailies: activities, userDailyCapacityMinutes });
  }

  return ok({
    shape_4_2_2: { ok: true, projectMin: p, commMin: m, ciMin: i },
    nonOptionalPresent: { ok: true, missing: [] },
    overAllocated: { ok: true, totalMin: total, capacityMin: effectiveCap }
  });
};
```

**Failure-code to UI-message mapping** (matches `UX_FLOWS.md §4.3`):

| failureCode | UX message |
|---|---|
| `DEEP_UNDER_FLOOR` | "PROJECT bucket is {actual} min, needs ≥ {floor}. Move an activity to PROJECT or replace a Communication block." |
| `COMM_UNDER_FLOOR` | "COMMUNICATION bucket is {actual} min, needs ≥ {floor}. Add a 1:1 or a team meeting." |
| `CI_UNDER_FLOOR` | "CI bucket is {actual} min, needs ≥ {floor}. Add a PDCA tick or L&D block." |
| `PROJECT_OVERPACKED` | "PROJECT is {actual} min, ceiling is {ceiling}. Remove a block or shorten one." |
| `COMM_OVERPACKED` | "COMMUNICATION is {actual} min, ceiling is {ceiling}. Remove a meeting or shorten one." |
| `CI_OVERPACKED` | "CI is {actual} min, ceiling is {ceiling}. Remove a CI block or shorten one." |
| `NON_OPTIONAL_MISSING` | "Missing: [{missing}]. The day can't save without it. Re-add from Catalog." |
| `OVER_CAPACITY` | "Day totals {total} min, your capacity is {cap}. Remove {overBy}." |
| `WEEKLY_PROJECT_UNDER_FLOOR` | "Week has {projectMinutes} PROJECT min, needs ≥ 1200. Add {shortfallBy} min of Deep to the week." |

### 2.6 Drag-to-rebucket drop rule (engine side)

`UX_FLOWS.md §4.2` says a drag may only commit if both source and destination buckets still pass floor/ceiling after the drop. The engine exposes:

```js
const canRebucket = (composition, activityId, newBucket) => {
  const clone = composition.activities.map(a =>
    a.id === activityId ? { ...a, bucket: newBucket } : a
  );
  return validateComposition({
    cycleType: composition.cycleType,
    activities: clone,
    userDailyCapacityMinutes: composition.composerInputsSnapshot.capacityMinutes,
    externalMinutesToday: composition.composerInputsSnapshot.externalMinutesToday
  });
};
```

The UI calls this on dragover; if `!ok` the drop target renders red and the block snaps back.

---

## 3. Standard Work Representation Model

### 3.1 `CatalogEntry` shape (canonical)

Matches `ARCHITECTURE.md` §2.2 exactly. Every field has a named source of truth.

| Field | Type | Source of truth |
|---|---|---|
| `id` | string (uuid) | Generated at seed time; stable across versions |
| `activityNumber` | integer \| null | `docs/Business Agility Standard Work.txt` row # (1–50); `null` for ceremonies and generics |
| `name` | string | `Business Agility Standard Work.txt` or `CATALOG_GAPS.md §A–D` fill, or `§H.2` for generics |
| `focusArea` | enum | `CATALOG_GAPS.md §E.1` rule (see classifier below) |
| `defaultDurationMinutes` | integer | `Business Agility Standard Work.txt` hrs/sprint × 60 / cadence multiplier, or `§A–D` default |
| `cadence` | enum | `CATALOG_GAPS.md §E.1` |
| `trigger` | string | `CATALOG_GAPS.md §E.5` |
| `inputs` | string[] | `CATALOG_GAPS.md §E.2` |
| `outputArtifact` | `{name, schema, required}` | `CATALOG_GAPS.md §E.3`; schema ∈ {TEXT, TWO_LIST, NUMERIC, DOCUMENT, CHART} per `UX_FLOWS.md §4.5` |
| `participants` | string[] | `CATALOG_GAPS.md §E.4` |
| `procedure` | string[] | `Business Agility Standard Work.txt` or `§A–D` fill |
| `bucket` | enum | **`CATALOG_GAPS.md §H.1` (APPROVED)** — single source of truth |
| `isNonOptional` | boolean | `PRODUCT_BLUEPRINT.md §3.4` locked list (see §3.4 of this doc) |
| `appliesToRoles` | string[] | `CATALOG_GAPS.md §E.4` + ceremony-specific (Sprint Planning → FACILITATOR) |
| `enabledByUser` | boolean | User preference; defaults true; ignored for non-optionals |
| `version` | integer | Bumped when `procedure` or `outputArtifact.schema` changes |
| `sourceRef` | string | Traceability to origin row |

Total seed size: 50 source rows + 6 BAM ceremonies + 4 generics (`§H.2`) = **60 `CatalogEntry` rows**.

### 3.2 Cadence-to-placement mapping

Defines, for each `cadence` enum value, which cycle composer claims the entry and where it anchors.

| `cadence` | Composer that places it | Anchor rule | Example entries |
|---|---|---|---|
| `DAILY` | Daily composer, every workday | Fixed time anchor (`09:00`, `09:15`, `13:00`, `17:00`) | Daily Standup; High-value Comm AM; High-value Comm Post-lunch; End-of-Activity Reflection |
| `WEEKLY` | Weekly composer, on specified anchor day | `§3.3` below (day-of-week table) | 1:1 (#16), Team meetings (#15), Document Writing (#18), 6S Email (#13, if signal), Weekly Reflection |
| `SPRINT` | Weekly composer when `sprintPhase` matches; Sprint composer in Next | Sprint-phase-specific day (Mon Wk1, Fri Wk1, Fri Wk2) | Sprint Planning, Mid-Sprint Review, Sprint Review, Sprint Retrospective, #19 |
| `MONTHLY` | Weekly composer, first workday of month (MVP fallback) | First workday of month; if already occupied, next Mon | #3 Compliance Training, #5 Team Introductions |
| `QUARTERLY` | Not composed in MVP (manually placed) | First workday of quarter | Quarterly Planning |
| `CONTINUOUS` | Daily composer CI rotation (§1.5) | CI bucket, any day with slack | #1 Personal L&D, #2 Team L&D, #6 Innovation Explore |
| `ON_SIGNAL` | Daily composer when `input.signals` trips | Earliest day/slot with signal active | #4 Document Review, #13 6S Email, #7–#11 Innovation stages |
| `EVENT_DRIVEN` | Daily composer as Deep payload (§1.6) when `activeKaizen` is active | PROJECT bucket slices | All DMAIC #20–#41, all Kaizen #42–#50 |
| `EVERY_48H` | Daily composer CI rotation, eligible if `hoursSinceLastTick ≥ 42` | CI bucket | #12 PDCA Cycle |

### 3.3 Weekly anchor day table (for `cadence=WEEKLY` and ceremonies)

| CatalogEntry | Anchor day (within week) | Anchor time | Bucket |
|---|---|---|---|
| Connecting w/ teammates (#16) | Wed (preferred), else Thu | 14:00 | COMMUNICATION |
| High-value team meetings (#15) | Tue or Thu | 15:00 | COMMUNICATION |
| Document Writing (#18) | any weekday with Deep slack | during Deep block | PROJECT |
| 6S Email (#13) | Mon (when signal trips) | 16:30 | CI |
| Weekly L&D tick (#1 or #2) | first weekday with CI slack | 15:30 | CI |
| Weekly Reflection | **Fri** | 16:30 | CI |
| Mid-Sprint Review | **Fri Wk1 of sprint** | 15:00 | COMMUNICATION |
| Sprint Planning | **Mon Wk1 of sprint** | 09:30 | COMMUNICATION |
| Sprint Review | **Fri Wk2 of sprint** | 14:00 | COMMUNICATION |
| Sprint Retrospective | **Fri Wk2 of sprint** | 15:00 | COMMUNICATION |

### 3.4 Non-optional enforcement — per cycle type

**Daily non-optional set** (checked by `validateComposition` via `requiredNonOptionals('DAILY', ...)`):
1. Daily Standup
2. AM High-value Communication block
3. Post-lunch High-value Communication block
4. Deep Work (aggregate ≥ `floors.PROJECT`; any single PROJECT-bucket entry satisfies the named activity requirement)
5. End-of-Activity Reflection (meta-slot)

**Weekly non-optional set:**
1. Five daily compositions (one per workday in `User.workDays`)
2. Weekly 1:1 (#16) on Wed or Thu
3. Weekly Reflection (Fri PM)
4. Mid-Sprint Review (Fri Wk1), **if** `sprintPhase` intersects this week and `isMidSprint` is true

**Sprint non-optional set** (declared here; Sprint composer ships Next):
1. Sprint Planning (Mon Wk1)
2. Sprint Review (Fri Wk2)
3. Sprint Retrospective (Fri Wk2, immediately after Review)

These are seeded into `CatalogEntry.isNonOptional = true`. `CatalogService.delete(entryId)` rejects on `isNonOptional === true` (`ARCHITECTURE.md` §8 cross-ref).

### 3.5 Recurrence materialization

No activity instances are pre-materialized months ahead. The composer creates `ScheduledActivity` rows **only** at cycle boundaries:
- Daily composer runs at start-of-day (or user-triggered from `/today`) and produces the day's `ScheduledActivity` rows.
- Weekly composer runs at start-of-week (Sun evening or Monday morning first-login) and produces the week's rows — delegating to Daily composer for each day.
- When a cycle is not composed, no rows exist for it. An empty day in localStorage means no plan yet; the dashboard's adherence denominator for that day is 0.

This keeps `ScheduledActivity` row counts bounded (≤ ~50/week per user = ~2600/year) and plays cleanly with the localStorage size budget (`ARCHITECTURE.md` §7.1).

### 3.6 Role-gating

```js
const appliesToRole = (catalogEntry, userRoles) =>
  catalogEntry.appliesToRoles.length === 0 ||                      // no gate → applies to all
  userRoles.some(r => catalogEntry.appliesToRoles.includes(r));

// Composer filter in every bucket pick:
const eligiblePool = input.catalog
  .filter(c => c.enabledByUser || c.isNonOptional)                 // non-optional always eligible
  .filter(c => appliesToRole(c, input.role));
```

- **Practitioner** sees: all personal CI, all communications, Daily Standup, Deep Work generic, PDCA.
- **Facilitator** additionally sees: Sprint Planning facilitation (owner), Retrospective facilitation, Mid-Sprint Review owner.
- **Leader** additionally sees: Quarterly Planning, Strategic DMAIC payloads.
- **Champion** additionally sees: all Kaizen (#42–#50) and DMAIC project management entries.

### 3.7 Handling the 4 generic catalog entries (`§H.2`)

| Generic | When scheduled | Fallback role |
|---|---|---|
| **Deep Work — Project Task (generic)** | PROJECT bucket when `activeKaizen == null` OR DMAIC payload is smaller than remaining PROJECT target (`§1.6`) | Always eligible |
| **Value-Added Communication (generic)** | COMMUNICATION bucket filler when no named #14–#16 / ceremony fits the remaining slot (`§1.7` Step 7) | Always eligible |
| **End-of-Activity Reflection** | Materialized as the closing CI meta-slot **and** on-demand by `ReflectionService` at every activity close (as a `Reflection` row, not a new ScheduledActivity) | Always eligible |
| **Weekly Reflection (20-min DMAIC)** | Weekly composer's `attachWeeklyAnchor('Weekly Reflection', FRI_PM, 'CI', 20, …, {protected: true})` | Always eligible |

---

## 4. CI Workflow Models

### 4.1 PDCA (catalog `#12`) — 48-hour micro-cycle

**State machine.** PDCA is modeled as a mini-FSM on the `PdcaExperiment` entity (`ARCHITECTURE.md §2.13`). A single user may have one open experiment at a time (MVP invariant). Each tick is a `ScheduledActivity` instance of `CatalogEntry #12` with `linkedPdcaExperimentId` set, scheduled by the Daily composer CI rotation (§1.5, `EVERY_48H`).

```
                 PDCA FSM (within a single experiment run)
   PLAN ──→ DO ──→ CHECK ──→ ACT ──→ (next cycle or close)
    ↑                                       │
    └───────── if ACT outcome = iterate ────┘
```

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (none) | PLAN | User declares PDCA experiment in settings or Weekly Reflection | hypothesis + `targetMetricName` + `currentConditionBaseline` + `targetCondition` captured | creates `PdcaExperiment` row in `bamx:v1:pdca`; emits `PdcaExperimentOpened` |
| PLAN | DO | User starts the first scheduled #12 tick | composer placed a #12 `ScheduledActivity` with `linkedPdcaExperimentId`; `ActivityStarted` fires | — |
| DO | CHECK | User closes #12 with `outputArtifactRef.schema='NUMERIC'` (current-condition measurement per `.txt` procedure) | measurement value present | `Reflection` captured; `PdcaTickCommitted` emitted with `consecutiveTargetHits` recomputed |
| CHECK | ACT | Next scheduled #12 tick (≈ 48h later) starts | `hoursSinceLastPdca >= 42` | — |
| ACT | PLAN (iterate) | User sets outcome = "iterate" in the ReflectionSheet DMAIC-lite prompt | experiment still open | appends tick id to `tickActivityIds` |
| ACT | CLOSED (graduated) | `consecutiveTargetHits >= 3` (3 consecutive ticks met target) | measurements recorded | `PdcaExperiment.closedReason='GRADUATED'`; emits `PdcaExperimentClosed` |
| ANY | CLOSED (abandoned) | User taps "Abandon experiment" | — | `closedReason='ABANDONED'`; emits `PdcaExperimentClosed` |
| ANY | CLOSED (promoted) | User promotes to Kaizen from Weekly Reflection | a `Kaizen.sourceFrictionSignalIds` references this experiment's measurements | `closedReason='SUPERSEDED_BY_KAIZEN'`; emits `PdcaExperimentClosed` |

**Measurement obligation.** Every PDCA close requires `CatalogEntry #12.outputArtifact = { name: "Current-condition measurement", schema: "NUMERIC", required: true }`. The engine refuses `IN_PROGRESS → CLOSED` without it (`ScheduledActivity` invariant in `ARCHITECTURE.md` §2.5).

**Scheduling.** Handled by `pickCI()` priority 80 (§1.5). Guarded by `hoursSinceLastPdca(input) >= 42` AND `PdcaExperiment.state !== 'CLOSED'`.

**Orphan tick protection.** `ActivityService.start()` rejects a #12 tick without `linkedPdcaExperimentId` when the user has an open experiment (per `ARCHITECTURE.md §2.13` invariant).

### 4.2 DMAIC project — multi-sprint composition

A DMAIC project is a `Kaizen` record with `mode = DMAIC` whose payload is a walk through catalog entries `#20–#41`. Each sprint's Deep Work slices fill one or more DMAIC steps. The project phase is derived from the highest-activity-number step whose output artifact has been captured.

**Phase derivation:**

| Phase | Catalog range | Phase output artifacts |
|---|---|---|
| DEFINE | #20 Charter, #21 SIPOC | Charter, SIPOC |
| MEASURE | #22–#30 (DCP, Baseline, Control Chart, Capability, MSA) | Baseline Output Performance Data (#28), Control Chart (#29), Capability Report (#30), MSA Report (#31) |
| ANALYZE | #31–#37 (Process Maps, C&E Matrix, Correlation, FMEA) | C&E Matrix (#34), Correlation & Regression (#36), FMEA (#37) |
| IMPROVE | #38–#40 (Backlog, Financial Benefit Translator, Implemented Improvements) | Process Improvement Backlog (#38), Financial Benefit (#39), Implemented Improvements (#40) |
| CONTROL | #41 Project Results Narrative | Project Results Narrative |

```js
const phaseFor = (kaizen, catalog, scheduledActivities) => {
  const saForKaizen = scheduledActivities.filter(s => s.linkedKaizenId === kaizen.id && s.state === 'CLOSED');
  const maxStep = saForKaizen
    .map(s => catalog.find(c => c.id === s.catalogEntryId)?.activityNumber ?? 0)
    .reduce((a, b) => Math.max(a, b), 20);
  if (maxStep >= 41) return 'CONTROL';
  if (maxStep >= 38) return 'IMPROVE';
  if (maxStep >= 31) return 'ANALYZE';
  if (maxStep >= 22) return 'MEASURE';
  return 'DEFINE';
};
```

**Payload selection (`selectDeepPayload` for DMAIC / KAIZEN_EVENT / KAIZEN_ACCELERATOR_30D).** Eligibility is **DAG-based** per `ARCHITECTURE.md §2.2` `CatalogEntry.dependsOn` and §4.5 R9, AND filtered by project-type + phase binding per `ARCHITECTURE.md §2.2` invariants + `PROJECT_TYPE_30D_KAIZEN.md §5.1`. An entry is eligible iff (a) `c.projectTypeBinding === kaizen.projectType` (so a DMAIC Kaizen only sees #20–#41 + bound generics; a Kaizen-Event Kaizen only sees #42–#50; a 30-Day Accelerator only sees its 31 bound entries) AND (b) if `c.phaseBinding !== null`, `c.phaseBinding === kaizen.phase` (so a Phase 3 accelerator task never appears while the Kaizen is in Phase 1) AND (c) every id in its `dependsOn` has a `CLOSED` `ScheduledActivity` within the same `Kaizen.id` scope AND (d) no `CLOSED` `ScheduledActivity` for this same entry already exists in this Kaizen (don't redo done steps).

For `projectType === 'KAIZEN_ACCELERATOR_30D'`, the eligible set is filtered by `Kaizen.phase` too — a Phase 3 task (e.g., `30d_3_3_execute_improvements`) never appears as payload while `kaizen.phase === 'PHASE_1'`. When the user advances phase via `KaizenService.advancePhase()`, the `ProjectPhaseAdvanced` event fires and the composer re-filters on the next `composeDaily()` invocation. This is the phase-binding filter that powers the Accelerator's 5-phase walk.

Multiple eligible entries may fire in parallel across the sprint's Deep blocks — this is the "async tasks OK" resolution from the coordinator's decisions log (`ARCHITECTURE.md §9` item 12). For example: once `#20 Charter` closes, `#21 SIPOC` becomes eligible; once `#21 SIPOC` closes, `#23 Stakeholder Analysis` and `#24 Communication Plan` both become eligible and can be placed on different Deep blocks in the same sprint.

**Priority among eligible entries** (deterministic tiebreak chain — unchanged from v0.2):
1. Phase match — entries whose phase matches the project's current `phaseFor()` rank first.
2. `dependsOn`-satisfied-most-recently — entries unlocked by the most recently closed step rank next (preserves momentum).
3. `activityNumber` ASC (or `id` ASC for Accelerator entries without activity numbers) — final stable tiebreak, so the same inputs always produce the same selection.

```js
const eligibleDmaicPayloadSteps = (kaizen, catalog, scheduledActivities) => {
  const closedInKaizen = new Set(
    scheduledActivities
      .filter(s => s.linkedKaizenId === kaizen.id && s.state === 'CLOSED')
      .map(s => s.catalogEntryId)
  );
  // Project-type + phase binding — ARCHITECTURE.md §2.2 invariants.
  const rangeForType = catalog.filter(c =>
    c.projectTypeBinding === kaizen.projectType &&
    (c.phaseBinding === null || c.phaseBinding === kaizen.phase)
  );
  return rangeForType.filter(step =>
    !closedInKaizen.has(step.id) &&                      // not already done
    step.dependsOn.every(dep => closedInKaizen.has(dep)) // all prerequisites closed
  );
};

const pickHighestPriority = (eligible, projectPhase, scheduledActivities) => {
  const mostRecentClosedId = scheduledActivities
    .filter(s => s.state === 'CLOSED')
    .sort((a, b) => b.actualEndAt - a.actualEndAt)[0]?.catalogEntryId;
  return eligible
    .map(e => ({
      e,
      phaseMatch: phaseOf(e) === projectPhase ? 0 : 1,
      unlockedBy: e.dependsOn.includes(mostRecentClosedId) ? 0 : 1,
      order: e.activityNumber,
    }))
    .sort((a, b) =>
      (a.phaseMatch - b.phaseMatch) ||
      (a.unlockedBy - b.unlockedBy) ||
      (a.order - b.order)
    )[0]?.e;
};
```

No step is silently skipped; no step is done twice; the DAG guarantees prerequisites. If all eligible entries are empty (everything complete or nothing unlocked), the composer falls back to `Deep Work — Project Task (generic)` with `linkedKaizenId` still set so the block counts as Kaizen work.

**State machine** — uses the existing `Kaizen` FSM (`ARCHITECTURE.md` §3.3). No new states. The DMAIC phase is a *derived* property, not a stored one.

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| DRAFT | ACTIVE | `KaizenService.lockBaseline()` | `baselineMetricId !== null` AND `baseline.locked === true` AND `goalStatement` set | emit `KaizenBaselineLocked` |
| ACTIVE | IN_REMEASUREMENT | `KaizenService.startRemeasurement()` | `phaseFor() === 'CONTROL'` (derived) AND all actions complete | — |
| IN_REMEASUREMENT | CLOSED | `KaizenService.close()` | `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId` | emit `KaizenClosed` |
| DRAFT | DRAFT (abandoned) | `KaizenService.abandon()` | `actions.length === 0` OR user confirms | sets `abandoned=true`; never transitions to CLOSED |

### 4.3 Kaizen event — time-boxed composition

Uses catalog `#42–#50`. Same `Kaizen` FSM as DMAIC, with `mode = KAIZEN_EVENT`. The Kaizen-event sequence is:

| Step | Catalog | Purpose |
|---|---|---|
| #42 | Kaizen Charter | Problem + scope |
| #43 | Output Data Collection Plan | Measurement method |
| #44 | Event Scheduling | Pick event window |
| #45 | Event SIPOC | Process map |
| #46 | Prioritized Inputs | Leverage inputs |
| #47 | FMEA | Failure modes |
| #48 | Implemented Improvements | Actions run during event |
| #49 | Results Narrative 3-Pager | Output of close (`schema: DOCUMENT`) |
| #50 | Process Owner Transition | Handoff |

**State machine transitions (same entity, `Kaizen`):**

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| DRAFT | ACTIVE | Kaizen promoted from Weekly Reflection cluster; user locks baseline | as §3.3 general rule | `KaizenPromoted` + `KaizenBaselineLocked` |
| ACTIVE | IN_REMEASUREMENT | Event closes (all #42–#48 closed); user calls `startRemeasurement()` | all prior steps have closed ScheduledActivity | — |
| IN_REMEASUREMENT | CLOSED | `KaizenService.close()` | **remeasurement required** — HARD RULE (`ARCHITECTURE.md` §3.3) | `KaizenClosed` with `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}` |
| — | abandoned | `KaizenService.abandon()` during DRAFT | — | never CLOSED without remeasurement |

**The "refuse close without remeasurement" guard** lives in `KaizenService.close()`:

```js
const closeKaizen = (kaizenId) => {
  const k = repo.get('kaizens', kaizenId);
  assert(k.state === 'IN_REMEASUREMENT', 'INVALID_TRANSITION');
  assert(k.remeasurementId !== null, 'REMEASUREMENT_REQUIRED');           // HARD RULE
  const r = repo.get('remeasurements', k.remeasurementId);
  const b = repo.get('baselines', k.baselineMetricId);
  assert(sameMetric(r.metricDefinitionId, b.metricDefinition), 'METRIC_MISMATCH');

  const closeKind = r.beatsBaseline ? 'SUCCESS'
                  : r.deltaPercent > 0 ? 'PARTIAL'
                  : 'FAILED_HONEST';
  repo.upsert('kaizens', kaizenId, { ...k, state: 'CLOSED', closedAt: now(), closeKind });
  EventBus.publish('KaizenClosed', { kaizenId, closeKind });
};
```

Future DB backing: `CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL)` (`ARCHITECTURE.md` §7.3).

### 4.4 Friction-signal → Kaizen promotion pipeline

**Capture path:** `ReflectionService.capture()` with `frictionFlag=true` creates a `FrictionSignal` row (`ARCHITECTURE.md` §2.8), emits `FrictionSignalCaptured`. `status='OPEN'`.

**Clustering algorithm** (`KaizenCandidateQueue`, triggered every `FrictionSignalCaptured`):

```js
const clusterFrictionSignals = (userId, windowDays = 7) => {
  const signals = repo.list('frictions', { userId, status: 'OPEN',
    capturedAt: { gte: daysAgo(windowDays) }
  });

  // Group by tag
  const byTag = groupBy(signals, s => s.tag ?? 'UNTAGGED');

  // Score each cluster
  const clusters = Object.entries(byTag).map(([tag, group]) => ({
    tag,
    count: group.length,
    recencyWeight: recencyScore(group),          // mean hours-ago, inverted
    signalIds: group.map(s => s.id),
    score: group.length * 10 + recencyScore(group)   // simple but deterministic
  }));

  clusters.sort((a, b) =>
    b.score - a.score ||                         // high score first
    a.tag.localeCompare(b.tag)                   // stable tiebreaker
  );
  return clusters;
};

const recencyScore = (group) => {
  const avgHours = mean(group.map(s => hoursAgo(s.capturedAt)));
  return Math.max(0, 168 - avgHours);            // 0..168 (favor this week)
};
```

**Pre-selection for Weekly Reflection Step 4.** The Weekly Reflection wizard shows the top 3 clusters (`clusters.slice(0, 3)`). The user picks at most one to promote to a `Kaizen` (MVP single-active cap). Promotion path:

```js
const promoteCluster = (userId, cluster) => {
  assert(activeKaizenCount(userId) === 0, 'KAIZEN_CAP_REACHED_MVP');   // ARCHITECTURE §2.9
  const kaizen = {
    id: uuid(), userId, state: 'DRAFT',
    title: proposeTitle(cluster),                // e.g., "Reduce MEETING_LOAD"
    sourceFrictionSignalIds: cluster.signalIds,
    openedAt: now()
  };
  repo.upsert('kaizens', kaizen.id, kaizen);
  cluster.signalIds.forEach(id => {
    const fs = repo.get('frictions', id);
    repo.upsert('frictions', id, { ...fs, status: 'PROMOTED_TO_KAIZEN', kaizenId: kaizen.id });
  });
  EventBus.publish('KaizenPromoted', { kaizenId: kaizen.id, fromFrictionSignalIds: cluster.signalIds });
};
```

**Dismissed-cluster history retention.** `ARCHITECTURE.md` §6.2 says `KaizenCandidateQueue` tracks dismissed clusters per tag for re-surfacing callouts. Implementation:

```js
const dismissCluster = (userId, cluster) => {
  cluster.signalIds.forEach(id => {
    const fs = repo.get('frictions', id);
    repo.upsert('frictions', id, { ...fs, status: 'DISMISSED' });
  });
  // Remember: append to a per-user dismissed log
  const dismissedLog = repo.read('bamx:v1:clusterDismissals') ?? {};
  const userLog = dismissedLog[userId] ?? [];
  userLog.push({ tag: cluster.tag, signalCount: cluster.count, dismissedAt: now() });
  dismissedLog[userId] = userLog.slice(-50);      // cap retention at last 50
  repo.write('bamx:v1:clusterDismissals', dismissedLog);
};
```

The Weekly Reflection wizard queries this log for the currently-top-ranked cluster's tag; if a matching dismissal exists within the last 8 weeks, the wizard surfaces "Similar cluster (`MEETING_LOAD`) was dismissed 3 weeks ago" above the promotion button.

`bamx:v1:clusterDismissals` is added to the `ARCHITECTURE.md §7.1` key table (v0.3). Bounded (≤ 50 tags per user) and derivable from `FrictionSignal.status='DISMISSED'` history if the log is lost.

### 4.5 Event wiring

Every CI workflow ties to events already defined in `ARCHITECTURE.md` §6.1. No new events are required.

| Workflow moment | Emits | Subscribers |
|---|---|---|
| User promotes cluster in Weekly Reflection | `KaizenPromoted`, `WeeklyReflectionCompleted` | UI (show active Kaizen), `ComposerService` (link next Deep payload), `MetricsService` |
| User locks baseline | `KaizenBaselineLocked` | UI (DRAFT → ACTIVE state card refresh) |
| User captures remeasurement | `KaizenRemeasured` | `MetricsService` (computes `activeKaizenDeltaPercent`) |
| User closes Kaizen | `KaizenClosed` (with `closeKind`) | `MetricsService` (Kaizen throughput), UI |
| PDCA tick closes with measurement | `ActivityCompleted`, `ReflectionCaptured` | `MetricsService`; pdcaExperiment FSM advances PLAN→DO→CHECK→ACT |
| DMAIC step closes | `ActivityCompleted` | phase derivation on next read (no stored state change) |
| Friction flag set on reflection | `FrictionSignalCaptured` | `KaizenCandidateQueue` (cluster + score) |
| Late activity start detected | `ActivityStartedLate` | `MetricsService` (leading indicator per blueprint §7.3) |

---

## 5. State Transitions (consolidated reference)

For each entity with a state machine, a full transition table. Guards and side effects are authoritative — they are what `InvariantEngine` and the owning service enforce.

### 5.1 `Composition` FSM

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (new) | PROPOSED | `ComposerService.composeDaily/Weekly()` returns | `validateComposition().ok === true` | persist composition + child activities (state=PROPOSED); emit `CycleProposed` |
| PROPOSED | ACCEPTED | `ComposerService.accept(id)` (user taps Accept) | all child `ScheduledActivity` in PROPOSED; `validateComposition().ok` | atomically flip composition + all children to ACCEPTED / SCHEDULED; emit `CycleAccepted` (edited=false) |
| PROPOSED | ACCEPTED (edited=true) | `ComposerService.acceptEdited(id, edits)` | same as ACCEPTED; plus every touched child flipped with `sourceOfSchedule=USER_EDIT` | emit `CycleEdited`, then `CycleAccepted` (edited=true); append `Variance` rows with `kind=EDITED_FROM_PROPOSAL` per removed activity |
| PROPOSED | REJECTED | `ComposerService.reject(id, reason)` | — | emit `CycleRejected`; terminal (re-propose requires new composition) |
| ACCEPTED | ACTIVE | `ComposerService.tickClock()` scheduler wakes | clock ≥ `startAt` | emit `CompositionStarted` |
| ACTIVE | CLOSED | `ComposerService.tickClock()` | clock ≥ `endAt` AND every child `ScheduledActivity` in CLOSED / SKIPPED / DROPPED | emit `CompositionClosed`; enqueues next-cycle composition (via subscriber in `ComposerService`) |

Owner: `ComposerService` (`compose*`, `accept`, `acceptEdited`, `reject`), plus `ClockService.tickClock()` for time-driven transitions.

### 5.2 `ScheduledActivity` FSM

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (new) | PROPOSED | child created during `composeDaily`/`composeWeekly` | parent Composition in PROPOSED | — |
| PROPOSED | SCHEDULED | parent Composition transitions PROPOSED → ACCEPTED | — | sourceOfSchedule locked |
| PROPOSED | DROPPED | user removed it during Edit | parent still PROPOSED | emit `Variance` with `kind=EDITED_FROM_PROPOSAL` |
| SCHEDULED | IN_PROGRESS | `ActivityService.start(id)` | `actualStartAt === null`; parent Composition in ACTIVE | set `actualStartAt=now()`; emit `ActivityStarted`; **if `now() − plannedStartAt > 5 min`, also emit `ActivityStartedLate`** (same transaction) |
| IN_PROGRESS | CLOSED | `ActivityService.close(id, {outputArtifactRef, reflection})` | `outputArtifactRef !== null` AND schema matches; if `catalogEntry.isNonOptional`, Reflection row provided (may be `pending=true` auto-stub) | set `actualEndAt=now()`; auto-stub `Reflection` (`pending=true`) via `ReflectionService`; emit `ActivityCompleted`, `ReflectionStubbed`; compute overrun/underrun variance via `computeVarianceOnClose()` |
| SCHEDULED | SKIPPED | `ActivityService.skip(id, {reasonCode, note})` (non-optional only) | `reasonCode !== null`; if `reasonCode === 'OTHER'`, `note !== null AND note.length > 0` | atomically insert `Variance` row (`kind=SKIPPED_NON_OPTIONAL`); emit `VarianceLogged` |
| IN_PROGRESS | SKIPPED | **disallowed** | — | throw; user must close with partial output or accept OVERRAN variance |
| SCHEDULED | (auto) SKIPPED | `ClockService.tickClock()` sees composition closing with un-started SCHEDULED child | only for non-optional; requires user to supply reasonCode via modal at day-close | same as manual skip |

Owner: `ActivityService` (`start`, `close`, `skip`). Reflection auto-stub owned by `ReflectionService.stubOnClose()` (subscriber of `ActivityCompleted`).

### 5.3 `Kaizen` FSM

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (new) | DRAFT | `KaizenService.promote(fromCluster)` | activeKaizenCount === 0 (MVP cap) | emit `KaizenPromoted`; friction signals flipped to PROMOTED_TO_KAIZEN |
| DRAFT | ACTIVE | `KaizenService.lockBaseline(id, baselineMetric)` | `baselineMetric.locked === true`; `goalStatement !== null`; `actions.length >= 1` | lock baseline row; emit `KaizenBaselineLocked` |
| DRAFT | DRAFT (abandoned) | `KaizenService.abandon(id)` | — | flag `abandoned=true`; never transitions to CLOSED (preserves "no close without remeasurement" rule) |
| ACTIVE | IN_REMEASUREMENT | `KaizenService.startRemeasurement(id)` | — (`readyToRemeasure` computed property is a hint, not a guard) | — |
| IN_REMEASUREMENT | CLOSED | `KaizenService.close(id, remeasurement)` | `remeasurementId !== null` AND `r.metricDefinitionId === b.metricDefinitionId` **(HARD RULE)** | compute `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`; emit `KaizenClosed` |

Owner: `KaizenService`.

### 5.4 `FrictionSignal` FSM

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (new) | OPEN | `ReflectionService.capture()` with `frictionFlag=true` | parent Reflection `pending=false` | emit `FrictionSignalCaptured` |
| OPEN | CLUSTERED | `KaizenCandidateQueue.cluster()` at Weekly Reflection open | signal is in a cluster of `count >= 2` | — (status update) |
| OPEN / CLUSTERED | PROMOTED_TO_KAIZEN | `KaizenService.promote()` includes this signalId | membership in promoted cluster | immutable thereafter (`ARCHITECTURE.md` §2.8) |
| OPEN / CLUSTERED | DISMISSED | `WeeklyReflectionWizard.dismiss(clusterId)` | — | append to `bamx:v1:clusterDismissals` |

Owner: `ReflectionService` (capture), `KaizenCandidateQueue` (cluster/dismiss), `KaizenService` (promote).

### 5.5 `Reflection` FSM (new in v0.2)

`Reflection` is not modeled as a full FSM in `ARCHITECTURE.md` §3 — it uses a `pending` boolean. Consolidated here for completeness.

| FROM | TO | trigger | guard | side effects |
|---|---|---|---|---|
| (new) | `pending=true` | `ReflectionService.stubOnClose(scheduledActivityId)` — subscribes to `ActivityCompleted` | parent activity `catalogEntry.isNonOptional === true` | emit `ReflectionStubbed` |
| `pending=true` | `pending=false` | `ReflectionService.capture(id, {whatWentWell, whatToImprove, frictionFlag})` | at least one of `whatWentWell` / `whatToImprove` has non-empty text | set `capturedAt = now()`; emit `ReflectionCaptured` with `onTime = (capturedAt − actualEndAt ≤ 15 min)`; if `frictionFlag`, create `FrictionSignal` |
| (none — terminal at `pending=false`) | — | — | — | — |

Owner: `ReflectionService`.

**Cross-reference to new v0.2 transitions:**
- `Reflection.pending=true → pending=false` on capture — owner `ReflectionService.capture()`.
- `ActivityStartedLate` emission within `ActivityService.start()` when `now − plannedStartAt > 5 min` — same transaction as `ActivityStarted`.

### 5.6 `Variance` — no FSM

`Variance` rows are append-only; born terminal (`ARCHITECTURE.md` §3.4). No transitions. Corrections are new rows. Owner: `VarianceService.log()`.

### 5.7 Side-effect-to-service-method cheat sheet

| Side effect | Service method |
|---|---|
| Emit `CycleProposed` | `ComposerService.composeDaily() / composeWeekly()` |
| Emit `CycleAccepted`, flip children SCHEDULED | `ComposerService.accept()` / `.acceptEdited()` |
| Emit `ActivityStarted` + (conditionally) `ActivityStartedLate` | `ActivityService.start()` |
| Emit `ActivityCompleted` + compute overrun/underrun | `ActivityService.close()` + `VarianceService.log()` |
| Auto-stub `Reflection` with `pending=true` | `ReflectionService.stubOnClose()` (subscriber of `ActivityCompleted`) |
| Emit `ReflectionCaptured` | `ReflectionService.capture()` |
| Emit `VarianceLogged` on skip | `ActivityService.skip()` (atomic with `VarianceService.log()`) |
| Emit `FrictionSignalCaptured` | `ReflectionService.capture()` when `frictionFlag=true` |
| Emit `KaizenPromoted` | `KaizenService.promote()` |
| Emit `KaizenBaselineLocked` | `KaizenService.lockBaseline()` |
| Emit `KaizenRemeasured` | `KaizenService.captureRemeasurement()` |
| Emit `KaizenClosed` | `KaizenService.close()` |
| Recompute `MetricsSnapshot` | `MetricsService.recompute()` (subscriber of most events above) |

---

## Appendix — Architecture Gap Resolution Log

All three v0.1 engine-flagged gaps resolved in `ARCHITECTURE.md` v0.3 + this engine design v0.2:

1. **Reflection naming canonicalization — RESOLVED.** "End-of-Activity Reflection" is canonical (matches `CATALOG_GAPS.md §H.2`). `ARCHITECTURE.md §4.2` pseudo-code and all engine references updated.
2. **`PdcaExperiment` entity — RESOLVED.** Added as `ARCHITECTURE.md §2.13` with full field spec, state machine (PLAN/DO/CHECK/ACT/CLOSED), and events (`PdcaExperimentOpened`, `PdcaTickCommitted`, `PdcaExperimentClosed`). Persistence key `bamx:v1:pdca` added to §7.1. `ScheduledActivity` now carries `linkedPdcaExperimentId`. Engine design §4.1 PDCA FSM updated to reflect the new entity.
3. **`bamx:v1:clusterDismissals` persistence key — RESOLVED.** Added to `ARCHITECTURE.md §7.1` key table, keyed by `FrictionSignal.tag`.

Coordinator decisions (logged in `ARCHITECTURE.md §9` items 10–14) that shape this engine:
- **DMAIC payload is a DAG** (`CatalogEntry.dependsOn`), not a strict numeric walk. Async tasks across Deep blocks are expected and supported. Engine §4.2 updated.
- **INFEASIBLE is a guided resolution flow**, not a silent fallback. Engine §1.8 updated with the `InfeasibleResult` shape and the four `suggestedActions`. New event `ComposerInfeasible`.
- **Deep slice preference** persists on `User.deepSlicePreference` with default `'2x2h'`.
