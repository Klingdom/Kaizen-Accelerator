# Architecture Delta — E19/E20/E21 (BAM Scheduling Engine Expansion)

Owner: system-architect
Status: v0.1 — sized in response to PRD_SCHEDULING_ENGINE.md v0.1 (Phil intake 2026-04-27)
Inputs: ARCHITECTURE.md v0.6, ENGINE_DESIGN.md v0.4.1, SCHEDULING_VISION/SYSTEM/ARCHITECTURE/UX/DELIVERABLES, DELIVERY_PLAN.md v0.3.

---

## 1. Executive Summary

- **Total new entities:** 5 (Bundle, Routine, Sequence, OutputArtifactTemplate, AntiPatternFinding) + 1 deferred (Template/Kit folded into Bundle). Plus ~14 new fields on existing entities (CatalogEntry, UserPreferences-on-User, ScheduledActivity, Trigger taxonomy on CatalogEntry).
- **Total estimated engineer-days at BAM 24h/week:** ~30–35 eng-days across E19/E20/E21 — an additional 5–6 calendar weeks at 24h/week project capacity. Roughly equal in mass to all of E13–E18 combined.
- **Recommendation (§15):** **PROCEED-WITH-DESCOPE.** Ship E19 minus the 4 weakest metadata fields, defer E20 Routines/Sequences past MVP, fold E21 anti-patterns into a dormant detector that emits warnings but no UI surface until post-MVP. Net: ~14 eng-days now, ~21 deferred.

---

## 2. Entity Diff

| Entity | New / Extend | Source point | Notes |
|---|---|---|---|
| **CatalogEntry** | Extend (~17 new fields) | Point 1, 2, 7 | See §3 audit. Several fields collide with existing schema. |
| **User** | Extend (UserPreferences expansion, ~10 fields) | Point 8 | Currently single embedded User row (§2.3). Choice: extend `User` directly OR introduce sub-document `User.preferences`. Recommend nested object to keep migration cheap. |
| **ScheduledActivity** | Extend (~7 outcome fields) | Point 9 | Outcome capture; collides with existing `outputArtifactRef` + Reflection. See §4. |
| **Trigger taxonomy** | Extend on CatalogEntry | Point 11 | Today `CatalogEntry.trigger` is a free-form string (`ARCHITECTURE.md:170`). Promote to enum + secondary keyword field. |
| **Bundle** | New | Point 4, 5 | `{id, name, description, projectTypeBinding?, phaseBinding?, entries[]: {catalogEntryId, sequenceIndex, suggestedDayOffset, suggestedDurationMinutes}, version}`. Expansion creates ScheduledActivities, not stored as Composition children directly. |
| **Routine** | New `[pending PRD verdict]` | Point 4 | Recurring micro-bundle (e.g., "Monday Reset"). FSM: `DRAFT → ACTIVE → PAUSED → ARCHIVED`. Could be folded into Bundle with `cadence` field. |
| **Sequence** | New `[pending PRD verdict]` | Point 4 | Strict-order chain. Could be folded into Bundle with `enforceOrder: boolean`. |
| **Template/Kit** | Fold into Bundle | Point 4 | No distinct semantics surfaced in 14-point list; recommend collapsing. |
| **OutputArtifactTemplate** | New | Point 10 | `{id, name, schema (matches ArtifactSchema enum), defaultStructure, kaizenPhaseBinding?, projectTypeBinding?, version}`. ~13 seed rows. Distinct from `CatalogEntry.outputArtifact` which is the *required* artifact for a single entry; templates are *suggested defaults* the user can pre-fill. |
| **AntiPatternFinding** | New | Point 13 | `{id, userId, detectorId, severity: LOW/MED/HIGH, detectedAt, scopeRef: {kind: 'COMPOSITION'|'WEEK'|'KAIZEN', id}, summary, evidenceRefs[], dismissedAt?}`. Append-only; corrections via re-detection. |
| **PriorityScore** | Extend on Kaizen + ScheduledActivity | Point 7 | Composite `{score, deadlineType, decayRate, confidence, unblockValue, strategicAlignment}` — partially redundant with the existing §2.5 SCHEDULING_SYSTEM scoring formula. See §3. |
| **Constraint** | Conceptual; expressed as User.preferences + InvariantEngine rules | Point 6 | No new entity. Rules live in `validateComposition` + new `validateConstraints` pre-flight module. |

**FSM impact summary (detail in §4):** No new top-level FSMs strictly required. Bundle/Routine activation is two-state (`ACTIVE`/`ARCHIVED`); ScheduledActivity outcome fields ride the existing `CLOSED`/`SKIPPED` terminals; AntiPatternFinding is FSM-less append-only.

---

## 3. Field-Level Audit of Point 1 Metadata (most important table)

Every "scheduling metadata" field Phil proposed, audited against the actual `CatalogEntry` schema in `ARCHITECTURE.md:158-190` and `js/domain/types.js:356-377`.

| ProposedField | AlreadyOnCatalogEntry? | ExistingFieldName | Verdict | EnumValues / Type | Required | Default |
|---|---|---|---|---|---|---|
| Planning Tier | No | — | **ADD** | `'DAY'\|'WEEK'\|'SPRINT'\|'MONTH'\|'QUARTER'` | Y | derived from existing `cadence` enum (DAILY→DAY, WEEKLY→WEEK, etc.) |
| Time-of-Day Fit | No | — | **ADD** | `'EARLY_AM'\|'LATE_AM'\|'AFTER_LUNCH'\|'LATE_PM'\|'ANY'` | N | `'ANY'` |
| Energy Type | No | — | **ADD** | `'DEEP_FOCUS'\|'COLLABORATIVE'\|'ADMIN_LIGHT'\|'REFLECTIVE'` | N | derived from `bucket` (PROJECT→DEEP_FOCUS, COMM→COLLABORATIVE, CI→REFLECTIVE) |
| Cognitive Load | No | — | **ADD** | `'LOW'\|'MED'\|'HIGH'` | N | `'MED'` |
| Schedule Flexibility | Partial | `isNonOptional` covers fixed-vs-not | **MERGE** + ADD | `'FIXED'\|'PREFERRED'\|'FLEXIBLE'` | Y | `isNonOptional?'FIXED':'FLEXIBLE'` (auto-mapped at seed) |
| Can Split? | Partial | `User.deepSlicePreference` covers Deep only | **ADD** (per-entry) | boolean | Y | `bucket==='PROJECT'` → true; else false |
| Min/Preferred/Max Effective Block | Partial | `defaultDurationMinutes` is single value | **ADD** | `{min: int, preferred: int, max: int}` triple | N | `{preferred: defaultDurationMinutes, min: 15, max: defaultDurationMinutes*1.5}` |
| Dependency Type | Partial | `dependsOn[]` exists but is identity-only | **ADD** | `'NONE'\|'HARD'\|'SOFT'` | N | `dependsOn.length > 0 ? 'HARD' : 'NONE'` |
| Predecessor Tasks | **YES** | `dependsOn[]` (`ARCHITECTURE.md:181`) | **REJECT** (already present) | string[] | — | — |
| Planning Urgency | No | — | **ADD** | `'DEADLINE'\|'CADENCE'\|'OPPORTUNITY'\|'RISK'` | N | derived from `cadence` (CONTINUOUS→CADENCE, ON_SIGNAL→RISK) |
| Business Value Type | No | — | **DEFER** (post-MVP) | `'REVENUE'\|'CUSTOMER'\|'RISK'\|'CAPABILITY'\|'LEARNING'\|'COMPLIANCE'` | N | null |
| Role Owner | Partial | `appliesToRoles[]` (`ARCHITECTURE.md:177`) covers role-gating | **MERGE** | reuses `appliesToRoles[]`; no separate "owner" needed | — | — |
| Mode | No | — | **ADD** | `'SOLO'\|'PAIRED'\|'TEAM'\|'EXEC'\|'ASYNC'` | N | derived from `participants[]` length |
| Context/Tool Requirements | No | — | **DEFER** (post-MVP) | string[] | N | `[]` |
| Interruption Tolerance | No | — | **ADD** | `'LOW'\|'MED'\|'HIGH'` | N | `bucket==='PROJECT'?'LOW':'MED'` |
| Primary BAM Bucket | **YES** | `bucket` enum (`ARCHITECTURE.md:175`) | **REJECT** (already present) | — | — | — |
| Allowed Secondary Bucket | No | — | **ADD** (Point 2) | `Bucket\|null` | N | null |

**Verdict tally:** 11 ADD, 2 MERGE, 2 DEFER, 2 REJECT. **Net field count on CatalogEntry: 11 new + 2 merged-rename + 2 deferred.** Lower than the 17 Phil proposed because `bucket` and `dependsOn` are already there.

**Determinism note:** Several "derived from existing field" defaults must be applied at *seed time*, not lazily, so two readers never disagree on the energy-type of an entry.

---

## 4. FSM Impact

**No new top-level FSMs required**, but several extensions:

1. **Composition FSM** (`ARCHITECTURE.md:509-540`) — unchanged. Anti-pattern detection is a **lint** that runs after `validateComposition` returns ok and emits warnings via the event bus. It does NOT gate transitions. (Recommend over `guard` because the user can ignore patterns; over `event-only` because lints want a typed result.)
2. **ScheduledActivity FSM** (`ARCHITECTURE.md:544-578`) — **no new states**. The outcome fields (Point 9) are *additional fields on the existing `CLOSED` and `SKIPPED` terminals*, not new states. Specifically:
   - `completedKind: 'FULL' | 'PARTIAL' | 'INTERRUPTED' | null` (null while not in terminal state). PARTIAL/INTERRUPTED imply CLOSED-with-caveat, not new states — still terminal.
   - `producedIntendedOutput: boolean | null` (yes/no).
   - `neededUnexpectedCollaboration: boolean | null`.
   - `promoteToTemplate: boolean | null` (drives OutputArtifactTemplate creation suggestion).
   - `estimateCalibrationDelta: number | null` = `actualDurationMinutes - plannedDurationMinutes` (computed; redundant with existing `planVsActualMinutes` on Reflection — **MERGE candidate**).
   - `durationAccuracyPercent: number | null` (computed).
   - Recommend storing the booleans and `completedKind`; computing the rest. Adding a sub-state e.g. `PARTIAL` to the FSM is **rejected** — it doubles transition combinatorics for marginal value.
3. **Bundle / Routine activation** — two-state mini-FSM `ACTIVE → ARCHIVED`. No edits-in-place; new version replaces old. Trivial.
4. **Kaizen FSM** — unchanged. Priority-score fields (Point 7) are passive; do not gate transitions.
5. **PdcaExperiment FSM** — unchanged.

---

## 5. Composer Impact

**Signature changes:** `composeDaily(input)` and `composeWeekly(input)` already take a `ComposerInput` (`ENGINE_DESIGN.md:22`). The proposed metadata fields ride on `input.catalog[]` entries — **no signature change required**. New optional sub-fields on input:

- `input.userPreferences` (extended UserPreferences object) — Point 8 fields.
- `input.activeBundles[]` — Bundle ids the user has activated this cycle (drives pre-population).
- `input.constraintConfig` — derived from User.preferences; passed pre-flight.

**New scoring inputs (Point 1, 7):** the existing 6-term scoring formula in `SCHEDULING_SYSTEM.md §2.5` (phase_match × 3, unlock_recency × 2, urgency × 2, strategic_flag × 2, context_switch × −1, effort_mismatch × −1) is the right place to fold energy_type / cognitive_load / time_of_day_fit. Add three terms:

```
+ 1·time_of_day_fit          (1 if entry.timeOfDayFit matches current slot; 0 otherwise)
+ 1·energy_match             (1 if entry.energyType matches user.preferences.currentEnergy[slot]; 0 otherwise)
- 1·cognitive_load_overflow  (1 if running daily cognitive_load_sum > user.maxCognitiveLoad; else 0)
```

**Determinism risk:** these new terms are pure functions of inputs already on the snapshot. **Safe.** Tiebreak chain unchanged (activityNumber ASC → id ASC).

**Bundle expansion (Point 5):** dropping a Bundle into a Sprint pre-populates ScheduledActivities. Idempotency: keep a `compositionId × bundleId` join table in `bamx:v1:bundleApplications`; second drop of same bundle into same composition is a no-op. Bundle→ScheduledActivity expansion runs *before* `composeDaily`'s STEP 5 (Deep payload); already-placed bundle activities are honored as fixed inputs by the composer's existing STEP 1 (place non-optional set first) — they ride the same lane.

**Constraint engine placement:** **inside composer**, not pre-flight. Rationale: the existing INFEASIBLE flow (`ARCHITECTURE.md:902-934`) already has the right shape — `suggestedActions` ordered by remediation cost. Constraint violations slot into that same return shape with new `SuggestedAction` kinds (`RELAX_MAX_MEETINGS`, `EXTEND_DEEP_WINDOW`). New module: `js/engine/validateConstraints.js` invoked from `composeDaily` STEP 9.

---

## 6. Persistence + Migration Plan

**New `bamx:v1:*` keys:**

| Key | Shape | Notes |
|---|---|---|
| `bamx:v1:bundles` | `{ [bundleId]: Bundle }` | Seeded ~24 rows (4 starter bundles × ~6 entries each per Point 5) |
| `bamx:v1:routines` | `{ [routineId]: Routine }` | `[pending PRD verdict]` — fold into bundles if rejected |
| `bamx:v1:outputArtifactTemplates` | `{ [templateId]: OutputArtifactTemplate }` | ~13 seeded |
| `bamx:v1:antiPatternFindings` | `{ [findingId]: AntiPatternFinding }` | Append-only via `repo.appendOnly()` (`LocalStorageRepository.js:124`) |
| `bamx:v1:bundleApplications` | `{ [compId+bundleId]: { appliedAt } }` | Idempotency join table |

**schemaVersion bumps:** boot from v1 → v2. Migration script lives in `/js/persistence/migrations/v1-to-v2-scheduling-metadata.js`. Deterministic + idempotent per existing migration contract (`ARCHITECTURE.md:1142`).

**Backwards-compat strategy:** every new field on `CatalogEntry` has a deterministic default derivable from existing fields (see §3 "Default" column). Migration walks all 60+ existing entries and back-fills. **Critical:** because the catalog seed is rebuilt at app boot from `js/catalog/seed/*` modules (not stored), the migration only matters for `bamx:v1:catalog` user-overrides. Most users will get fresh seeded entries with new fields populated correctly.

**Append-only impact:** the 7 outcome fields on `ScheduledActivity` violate the implicit append-only assumption *if* the user can edit a closed activity's outcome. Recommend: outcome fields are settable exactly once (at close) and immutable thereafter. The existing `state === 'CLOSED'` is already terminal, so this is a natural extension.

**Export/import round-trip:** `exportData()/importData()` (`E12-T4` in DELIVERY_PLAN) automatically includes new keys via the prefix wildcard. **No code change needed**, but new seed rows mean the import golden-blob test (`tests/persistence/portable.test.js` if exists; otherwise add) needs a new fixture. Estimate +0.5d.

**Size budget:** existing 1.8 MB / 5 MB ceiling estimate (`ARCHITECTURE.md:1136`). Adding 7 outcome fields × every ScheduledActivity × 90 days × ~10 activities/day ≈ ~50 KB. Negligible. AntiPatternFindings capped at 100 rows ≈ 30 KB. Net: still comfortably under ceiling.

---

## 7. Event Catalog Diff

Existing 36 events in `js/events/events.js`. **3 new events proposed:**

| New Event | Payload | Subscribers |
|---|---|---|
| `BundleApplied` | `{compositionId, bundleId, expandedActivityIds[], appliedAt}` | UI (highlight), MetricsService (count bundle adoption) |
| `OutcomeCaptured` | `{scheduledActivityId, completedKind, producedIntendedOutput, promoteToTemplate}` | MetricsService (estimate-calibration leading indicator), TemplateService (if `promoteToTemplate=true`) |
| `AntiPatternDetected` | `{findingId, detectorId, severity, scopeRef}` | UI (inline warning chip), MetricsService (anti-pattern frequency) |

**Subscriber side-effects:** all three are observers, not gates. No mutation outside the emitting service.

**MetricsService recompute triggers:** add to the existing 8-event subscription list (`ARCHITECTURE.md:1054`). Net: 11-event subscription. Recompute cost stays O(n) over 14-day window.

---

## 8. Determinism Risk Audit

| New Feature | Risk | Mitigation |
|---|---|---|
| Energy-match scoring | Reads `Date.now()` to pick "current slot" | Inject clock via `ClockService` (already exists at `js/services/ClockService.js`); composer takes `now` as explicit input |
| Bundle ordering during expansion | `Object.entries()` iteration order on bundle.entries[] | Bundle.entries is an array, not object — order is stable |
| Anti-pattern detector loop | Detectors run in registration order; `Set` iteration | Use array-of-detectors with explicit `detectorId` ordering; sort by id |
| OutputArtifactTemplate selection | Could pick "first matching" non-deterministically | Sort templates by `id ASC` before pick; doc-test |
| Cognitive-load running sum | Order of activities in composition matters | Already sorted by `plannedStartAt` post-`orderDay`; safe |
| AntiPatternFinding.detectedAt | Wall clock | Use injected clock per existing pattern |

**No randomness introduced anywhere.** No locale-sensitive ops (no Intl.Collator usage proposed). **R-21 is mitigated.**

---

## 9. Test Seam Audit

Current baseline: ~2,565 tests, ~2.55s suite runtime, 27% headroom against 3.5s ceiling.

| Test surface | Existing file | New cases | New file? |
|---|---|---|---|
| CatalogEntry typedef | `tests/domain/types.test.js` | +12 (one per new field) | No |
| Catalog seed defaults | `tests/catalog/seed/*.test.js` | +20 (default-fill for new fields) | No |
| Composer scoring with new terms | `tests/engine/pickCI.test.js`, `selectDeepPayload.test.js` | +9 (3 new terms × 3 cases) | No |
| Bundle expansion | — | +15 | **Yes** `tests/services/BundleService.test.js` |
| OutputArtifactTemplate | — | +8 | **Yes** `tests/services/OutputArtifactTemplateService.test.js` |
| AntiPatternFinding detectors | — | +30 (10 detectors × 3 cases) | **Yes** `tests/anti-patterns/*.test.js` (split per detector) |
| Constraint validator | — | +12 | **Yes** `tests/engine/validateConstraints.test.js` |
| ScheduledActivity outcome fields | `tests/services/ActivityService.test.js` | +14 | No |
| UserPreferences extended | `tests/domain/types.test.js` | +10 | No |
| Migration v1→v2 | — | +6 | **Yes** `tests/persistence/migrations/v1-to-v2.test.js` |
| Event additions | `tests/events/EventBus.test.js`, similar | +6 | No |

**Estimated test count delta: +142 tests** (≈ 5.5% growth). At ~1ms/test average that's +0.14s suite runtime — well within the 27% headroom (which is ~0.95s). **R-19 mitigated for test budget.**

---

## 10. Epic Decomposition (E19 / E20 / E21)

### E19 — Scheduling Metadata Engine

- **Title:** Scheduling Metadata Engine (Points 1, 2, 7-partial)
- **MVP must-have served:** None directly — this is *infrastructure for richer composer scoring*. Indirectly serves Validated Kaizen throughput (better Deep payload selection).
- **Traces to:** PRD §1, §2, §7; SCHEDULING_SYSTEM.md §2.5; ARCHITECTURE.md §2.2.
- **Depends on:** E1 (entities), E2 (catalog seed), E3 (composer), E12 (migrations).
- **DONE definition:** 11 new fields on `CatalogEntry` + 1 new field (`allowedSecondaryBucket`) per Point 2 + 6 priority-score sub-fields on `Kaizen` and `ScheduledActivity`. v1→v2 migration ships. Composer scoring formula extended with 3 new terms. Catalog seed back-fills defaults deterministically. ~75 new tests pass.
- **Estimate:**
  - E19-T1 Add typedefs (S, 1d) `[pending PRD verdict on the 4 deferred fields]`
  - E19-T2 Migration v1→v2 + back-fill (M, 3d)
  - E19-T3 Catalog-seed default derivers (M, 2d)
  - E19-T4 Composer scoring extension (M, 3d)
  - E19-T5 Tests (M, 3d)
  - **Total: ~12 eng-days** (M-L)
- **Sequencing rationale:** No coupling to E20/E21; can ship standalone. Pure additive to existing composer.

### E20 — Planning Objects + Bundles

- **Title:** Bundles + OutputArtifactTemplates (Points 4, 5, 10)
- **MVP must-have served:** **None.** Bundles are convenience packers; users can hand-pick from CatalogPicker today.
- **Traces to:** PRD §4, §5, §10; ARCHITECTURE.md §2.x (no current section — net-new).
- **Depends on:** E2 (catalog), E3 (composer), E12.
- **DONE definition:** `Bundle` + `OutputArtifactTemplate` entities with FSMs. 4 starter bundles + 13 templates seeded. `BundleService.apply(compositionId, bundleId)` idempotent. `OutputArtifactTemplate` pre-fill UI on activity-close artifact dialog. ~50 new tests.
- **Estimate:**
  - E20-T1 Bundle entity + service (M, 4d)
  - E20-T2 Bundle expansion into ScheduledActivities (M, 3d)
  - E20-T3 Bundle seed (S, 2d) `[pending PRD verdict on 4 starter bundles]`
  - E20-T4 OutputArtifactTemplate entity + service (M, 3d)
  - E20-T5 Template seed (S, 1d)
  - E20-T6 UI for bundle picker + template pre-fill (M, 3d)
  - E20-T7 Tests (M, 3d)
  - **Total: ~19 eng-days** (L)
- **Sequencing rationale:** Sits on top of E19's metadata so bundles can carry richer per-entry hints. **Routines + Sequences deferred** — fold into Bundle with optional `enforceOrder` and `recurrenceCadence` fields if PM rules them in-scope.

### E21 — Constraints + Anti-Patterns + Outcomes

- **Title:** Constraints + Anti-Patterns + Outcomes (Points 6, 9, 11, 13)
- **MVP must-have served:** Partial — outcome fields (Point 9) feed estimate-calibration metrics that *would* validate the "60-second reflection" JTBD.
- **Traces to:** PRD §6, §9, §11, §13.
- **Depends on:** E5 (ActivityRuntime), E9 (Metrics), E11 (Coaching microcopy — for anti-pattern surfacing).
- **DONE definition:** `validateConstraints` module + 8 named constraints. 7 outcome fields on ScheduledActivity. ~13-trigger taxonomy on CatalogEntry. AntiPatternFinding entity + 10 detectors + dormant UI banner.
- **Estimate:**
  - E21-T1 ScheduledActivity outcome fields + capture UI (M, 4d)
  - E21-T2 Trigger taxonomy migration (S, 2d)
  - E21-T3 Constraint engine (M, 4d)
  - E21-T4 Anti-pattern detectors × 10 (L, 6d)
  - E21-T5 AntiPatternFinding entity + persistence (S, 2d)
  - E21-T6 Tests (M, 4d)
  - **Total: ~22 eng-days** (L+)
- **Sequencing rationale:** Heaviest epic, weakest MVP linkage. Outcome fields are most defensible piece; anti-pattern detectors are speculative without user friction signal.

---

## 11. Total Capacity Cost

| Epic | Estimate (eng-days) | At BAM 24h/week | Calendar weeks |
|---|---|---|---|
| E19 — Scheduling Metadata Engine | ~12d | 4 d/wk effective | ~3 weeks |
| E20 — Planning Objects + Bundles | ~19d | 4 d/wk effective | ~5 weeks |
| E21 — Constraints + Anti-Patterns + Outcomes | ~22d | 4 d/wk effective | ~5.5 weeks |
| **Total** | **~53d** | — | **~13.5 weeks** |
| **MVP timeline shift (sequential after E18)** | — | — | **+13.5 weeks → ~28 weeks total post-E18** |

For comparison: existing E1–E18 totals ~135 project days (DELIVERY_PLAN.md v0.3). E19–E21 adds ~40% to total mass.

**Recommended descope (see §15) cuts this to ~14 eng-days now / ~3.5 calendar weeks.**

---

## 12. Recommended Sequencing

Phil's preferred order from Point 14: metadata → fit rules → bundles → constraints → priority → outcomes. **Honored with one deviation:**

1. **E19** (metadata + fit rules + priority) — combines points 1, 2, 7 into one shippable unit because they all extend the same entity. Phil listed metadata-then-fit-rules-then-priority but the migration cost of three sequential v1→v2→v3→v4 schema bumps is high; one bump covers all three. **Deviation rationale:** persistence-side cohesion outweighs strict honor of the order.
2. **E20** (bundles, planning objects, output templates).
3. **E21** (constraints, outcomes, anti-patterns) — **outcomes promoted ahead of anti-patterns within E21** because outcomes feed metrics today; anti-patterns are speculative. Constraints are between (low-risk addition to existing INFEASIBLE flow).

If only one ships: **ship E19**. It moves composer quality without UI surface area.

---

## 13. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| **R-19** | Scope explosion (~17 + ~24 + ~38 catalog rows + ~10 detectors = high mass) | High | High | Adopt §15 descope. Reject Business-Value-Type and Context/Tool fields. Fold Routine/Sequence into Bundle. |
| **R-20** | Cohabitation with E13/E14/E18 (not yet shipped per DELIVERY_PLAN.md v0.3) | High | Med | Sequence E19/E20/E21 *after* E13/E18 ships. Do not parallelize with E17 (Kaizen 90) — both touch CatalogEntry seed. |
| **R-21** | Composer non-determinism if energy/cognitive scoring uses randomness | Low | High | Audited in §8. No randomness in proposed design. Add explicit determinism test that runs `composeDaily(input)` 100× and asserts byte-identical Composition output. |
| **R-22** | localStorage size growth from outcome fields × every block × every day | Low | Low | Audited in §6. ~50 KB additional / 90 days. Far below ceiling. |
| **R-23** | NEW — Anti-pattern detectors emit false positives → user trust erodes | Med | High | Ship detectors with `severity=LOW` only initially. Enforce 3-day burn-in dismissal-rate threshold before promoting any detector to MED. Telemetry on `AntiPatternFinding.dismissedAt`. |
| **R-24** | NEW — Bundle expansion races with `varianceQueue` rescue (R2) for the same time slot | Med | Med | Bundle expansion runs in STEP 1 of composer (before STEP 3 variance rescue); explicit ordering doc-tested. |
| **R-25** | NEW — Migration v1→v2 fails partway, leaving mixed-version catalog | Low | High | Existing migration contract (`ARCHITECTURE.md:1153`) already requires pre-migrate backup + idempotency. Re-affirmed; no new mechanism needed. |
| **R-26** | NEW — UserPreferences expansion (~10 fields) creates onboarding friction violating "zero-length setup wizard" principle (`SCHEDULING_VISION.md §1.2`) | Med | High | All new preferences MUST have deterministic defaults inferable from existing fields or role. Onboarding never asks; all surfaced via "Tune" affordance post-first-week. |

---

## 14. Open Architectural Questions

1. **Are Routine and Sequence distinct entities or Bundle variants?** Default if Phil silent: **fold into Bundle** with optional `recurrenceCadence` and `enforceOrder` fields. Saves ~6 eng-days.
2. **Does OutputArtifactTemplate replace or supplement `CatalogEntry.outputArtifact`?** Default: **supplement**. Existing field stays as the *required* schema; templates are *suggested defaults*.
3. **Should anti-pattern detectors be user-configurable or fixed?** Default: **fixed in MVP**, exposable as toggle list post-MVP. Lower surface area.
4. **Bundle versioning — semver or monotonic?** Default: **monotonic integer** matching existing `CatalogEntry.version` pattern (`ARCHITECTURE.md:179`).
5. **Where does the constraint engine emit "near-miss" warnings vs hard failures?** Default: hard fail returns INFEASIBLE; near-miss emits a `ConstraintWarning` event but the composition still proposes.
6. **Multi-lens scheduling views (Point 12) — UX or architecture?** Default: **UX-only** (no new entities). Requires query indices on CatalogEntry — but we're not on Postgres yet, so this is a future concern.
7. **Are PriorityScore sub-fields stored or computed?** Default: **stored on Kaizen** (deadline-type, decay-rate, confidence) because they're inputs, not outputs. **Computed on ScheduledActivity** (composite score) per existing §2.5 formula.
8. **Should `AntiPatternFinding` be append-only or mutable on dismiss?** Default: **append-only** (new dismissal row supersedes previous), matching existing Variance pattern (`ARCHITECTURE.md:330`).

---

## 15. Recommendation

**PROCEED-WITH-DESCOPE.** Specifically: ship **E19 only** as a v1→v2 migration covering the 11 ADD-verdict fields from §3 plus the 3-term composer scoring extension (~12 eng-days). **Defer E20 (bundles, templates) and E21 (constraints, anti-patterns, outcomes)** until E13–E18 has shipped and produced 4+ weeks of telemetry showing where users actually edit/reject the composer's proposals. That telemetry will tell us which of the proposed 14 points solve real friction vs which are speculative.

Rationale: the system already has 18 epics, of which only ~12 are shipped. Adding 3 more epics totaling ~53 eng-days extends MVP by ~13.5 calendar weeks at current capacity — pushing the Validated-Kaizen-throughput KPI window from "first measurable in 60 days" to "first measurable in 150+ days." That is too long an epistemic gap for what is fundamentally an opinionated-defaults expansion. Ship the metadata foundation now (it's pure additive infrastructure with deterministic defaults and no new UI surface), let the existing composer get smarter for free, and revisit bundles/constraints/anti-patterns with real user data in hand.

If Phil rejects descope: minimum viable order is E19 → E20 → E21 strictly sequential (parallelizing them all touches CatalogEntry seed and creates merge hell with E17 Kaizen 90). Plan for ~13.5 calendar weeks added to MVP delivery.
