# PRD — BAM Scheduling Engine Expansion

Owner: product-manager
Status: v0.1 — Define-phase intake of 14-point proposal (Phil, 2026-04-27)
Inputs: PRODUCT_BLUEPRINT v0.3, ARCHITECTURE v0.6, ENGINE_DESIGN v0.4.1, SCHEDULING_VISION/SYSTEM/ARCHITECTURE/UX/DELIVERABLES, DELIVERY_PLAN v0.3, CATALOG_GAPS v0.3.1.

---

## 1. Problem Statement

The existing engine is a purpose-built, deterministic scheduler that composes a 4-2-2 Day from a fixed catalog of ~60 vetted entries. It knows *which* catalog entry to place (via DAG + phase binding), *when* to place it (via the 10-step `composeDaily` algorithm), and *whether* it fits (via `InvariantEngine`). What it does not know is *why* one eligible catalog entry is better than another when multiple candidates tie in the scoring formula, nor does it have enough per-entry metadata to auto-select the right block size, time-of-day slot, or energy-appropriate moment without Phil doing that judgment manually during Edit.

Phil's 14-point proposal surfaces a real gap: the scoring formula (`SCHEDULING_VISION §2.5`) carries only six terms (phase_match, unlock_recency, urgency, strategic_flag, context_switch, effort_mismatch), none of which encode time-of-day fit, cognitive load, or interruption tolerance. As a result, two ANALYZE-phase DMAIC steps with identical DAG status score identically, and the tiebreak falls to `activityNumber ASC` — which is stable but not optimal. Users editing the composer output more than necessary is measurable: composition acceptance rate is a launch metric (target ≥ 60% daily, ≥ 50% weekly per `PRODUCT_BLUEPRINT §7.2`).

This matters now because E10 and E11 (UI Shell and Coaching Microcopy) are shipped or near-shipped, the catalog seed is complete, and the engine is running in production. The team is at the stage where incremental metadata enrichment on existing catalog entries has the highest leverage per engineering day: the schema, the DAG, the FSMs, and the composer algorithm are in place. Adding a small set of scheduler-hint fields to `CatalogEntry` (Point 1, filtered) and encoding BAM-bucket fit as a first-class field (Point 2) will improve auto-placement accuracy without touching the engine's deterministic core. Everything else in the 14-point proposal is either already covered, belongs in a post-MVP backlog, or requires a coordinator decision before it can be scoped.

---

## 2. Triage Matrix — All 14 Points

| # | Point | Verdict | Rationale | Already-covered-by | Conflicts |
|---|---|---|---|---|---|
| 1 | Scheduling metadata fields (~17 fields) | IN-SCOPE-POST-MVP (4 fields), ALREADY-COVERED (7 fields), DEFERRED (6 fields) | See §4 for per-field rulings. 4 new scheduler-hint fields (timeOfDayFit, cognitiveLoad, minEffectiveBlockMinutes, interruptionTolerance) are not covered and improve composer accuracy. The others are either already on `CatalogEntry`, redundant with existing scoring terms, or require team-level data. | `ARCHITECTURE §2.2` CatalogEntry fields; `SCHEDULING_VISION §2.5` scoring formula | Adding fields to `CatalogEntry` touches E2 (catalog seed) and E3 (composer). System-architect must confirm migration path. |
| 2 | BAM fit rules — Primary + Allowed Secondary Bucket | IN-SCOPE-POST-MVP | `CatalogEntry.bucket` already enforces the primary BAM bucket (PROJECT/COMMUNICATION/CI) per `ARCHITECTURE §2.2`. The "allowed secondary" concept is new and enables cross-bucket flexibility without violating the 4-2-2 invariant. Not in any existing artifact. | `ARCHITECTURE §2.2` (bucket field, primary only) | Must not allow `allowedSecondaryBucket` to become a backdoor to violate `InvariantEngine` 4-2-2 checks. System-architect must confirm the invariant guard still holds. |
| 3 | 38 new schedulable activity types | IN-SCOPE-POST-MVP | The catalog is documented as ~50 entries + generics; `CATALOG_GAPS §H.2` defines a generic set but does not cover these 38 specific named types. These extend the catalog in three areas where coverage is thin: cross-functional communication activities, structured CI rituals, and project-work sub-types not captured in DMAIC/Kaizen sequences. | `CATALOG_GAPS §H.2` (covers generic fillers, not these named entries) | Adding 38 entries requires procedure-text authoring (CATALOG_GAPS precedent from §I: this was a build-start blocker for E13). Cannot ship without Phil-authored procedures. |
| 4 | Planning objects beyond tasks | DEFERRED | `SCHEDULING_VISION §2.3` explicitly maps every user-facing concept (Project, Phase, Bundle, Routine, Sequence) onto existing entities with no new stored entities required. Phases are `Kaizen.phase`, Sequences are the DAG walk, Templates are catalog seed patterns. Free-form Blocks and custom Bundles are excluded per `PRODUCT_BLUEPRINT §4.3` ("no general-purpose task management"). | `SCHEDULING_VISION §2.3`, `PRODUCT_BLUEPRINT §4.3` | Re-opens §4.3 exclusion. Trigger to revisit: multi-user team planning ships in Next. |
| 5 | Default scheduling bundles (DMAIC Define Starter, etc.) | IN-SCOPE-POST-MVP | The concept of a pre-wired task bundle is not in any existing artifact. It is functionally similar to `projectTypeBinding` seeds for a new project type, but scoped to "starter packs" at phase open. Directly supports Phil's JTBD of reducing blank-calendar paralysis at phase boundaries. Not §4.3-excluded. | None | Needs to interop with `eligibleDmaicPayloadSteps` in `ENGINE_DESIGN §4.2`. Bundles must not bypass DAG prerequisite checks. |
| 6 | Constraints and guardrails | ALREADY-COVERED (partially) / DEFERRED (remainder) | Max deep-work hours, protected windows, CI floor ≥ 60 min, and the non-optional set are enforced by `InvariantEngine` and `ENGINE_DESIGN §2.1–§2.3`. Max active projects per user (1 in MVP, 3 in Next) is in `ARCHITECTURE §2.9`. No-fly zones and per-user configurable max-meeting/day are new; defer to Next when team-scheduling ships. | `ENGINE_DESIGN §2.1–§2.3`, `ARCHITECTURE §2.9`, `PRODUCT_BLUEPRINT §3.4` | No-fly zones require User-preference storage not currently in `ARCHITECTURE §2.3 User` fields. |
| 7 | Real scheduling priorities — decay rate, confidence, deadline type | ALREADY-COVERED (partially) / DEFERRED (remainder) | Priority Score composite and Urgency are modeled in `SCHEDULING_VISION §2.5` scoring formula. `Kaizen.targetCloseDate` provides hard deadline for AD_HOC. Decay Rate and Confidence Level are new; defer to Next when multi-Kaizen portfolio ships (they add value only across competing Kaizens). Unblock Value = `unlock_recency` term already present. Strategic Alignment Score = `strategic_flag` already present. | `SCHEDULING_VISION §2.5`, `ARCHITECTURE §2.9 targetCloseDate` | Decay Rate requires a time-series store not in MVP (localStorage append-only, no query by time delta). |
| 8 | Personal and team scheduling preferences | ALREADY-COVERED (partially) / DEFERRED (remainder) | `User.deepSlicePreference`, `User.dailyCapacityMinutes`, `User.timezone`, `User.workDays`, `User.sprintAnchorDate`, `User.roles` are all in `ARCHITECTURE §2.3`. Best deep-work hours and maker-vs-manager weighting are new User fields. Team scheduling (collaboration overlap, team timezone) is deferred to the Next team-rollup feature (`PRODUCT_BLUEPRINT §4.2`). | `ARCHITECTURE §2.3 User` | Adding User fields is low-migration-cost but requires `/settings` UX additions (`SCHEDULING_UX §3.10`). |
| 9 | Schedule outcome tracking | ALREADY-COVERED | `ScheduledActivity` carries `actualStartAt`, `actualEndAt`, `reasonCodeIfSkipped`; `Reflection` carries plan-vs-actual + friction signal; `Variance` is append-only. Whether a block should become a template is the Weekly Reflection → Kaizen promotion pipeline. Duration accuracy feeds the `MetricsSnapshot`. All per `ARCHITECTURE §2.5, §2.6, §2.7, §2.12`. | `ARCHITECTURE §2.5, §2.6, §2.7, §2.12`; `ENGINE_DESIGN §5.7` | None |
| 10 | Library of standard output templates | DEFERRED | `CatalogEntry.outputArtifact` already defines the required output schema per activity. The 5 schemas (TEXT/TWO_LIST/NUMERIC/DOCUMENT/CHART) cover the output types. Rich document templates (charter PDFs, SOP docs) are document-generation features excluded by `PRODUCT_BLUEPRINT §4.3` ("no generic AI document generation outside composer/reflection/DMAIC moments"). Revisit trigger: Next "Catalog editor for Champions" (`PRODUCT_BLUEPRINT §5.2`). | `ARCHITECTURE §2.2 outputArtifact`; `PRODUCT_BLUEPRINT §4.3` | Nears §4.3 exclusion on document generation. |
| 11 | Trigger types beyond cadence | ALREADY-COVERED (partially) / IN-SCOPE-POST-MVP (new signals) | Cadence, deadline, phase-completed, capacity-available, and calendar-opening-detected triggers are already modeled in `CatalogEntry.cadence` enum (DAILY/WEEKLY/SPRINT/ON_SIGNAL/EVENT_DRIVEN) and `ComposerInput.signals` object (`ENGINE_DESIGN §1.1`). Risk-threshold-breached, KPI-below-threshold, stalled-work-item, and new-learning-captured are new ON_SIGNAL subtypes that would enrich `ComposerInput.signals`. These are Post-MVP. | `ARCHITECTURE §2.2 cadence`; `ENGINE_DESIGN §1.1 signals` | Must extend `ComposerInput.signals` shape without breaking the existing 3-field contract. |
| 12 | Planning views (by project, phase, role, duration, etc.) | DEFERRED | Current routes (`/today`, `/week`, `/catalog`, `/kaizen`, `/insights`) cover the primary scheduling surfaces. Multi-dimensional views (by role, by BAM bucket, by energy) require the metadata from Point 1 to be in place first and are UI features not engine features. These belong to Next's team-rollup view (`PRODUCT_BLUEPRINT §4.2`). | `SCHEDULING_UX §3.1–§3.2`; `PRODUCT_BLUEPRINT §4.2` | Depends on Point 1 fields existing first. Not blocking MVP. |
| 13 | Anti-pattern detection | IN-SCOPE-POST-MVP | No existing artifact covers this. Anti-pattern detection is a natural next layer above the `MetricsService` + `InvariantEngine` combination. Several patterns ("no CI scheduled", "too many 30-min fragments", "deep work in meeting-heavy periods") can be derived from existing `MetricsSnapshot` + `Composition` data with no new storage. Valuable; not MVP-blocking. | `ENGINE_DESIGN §5.7 MetricsService`; `ARCHITECTURE §2.12` | A new `AntiPatternEngine` service would need to subscribe to existing events without modifying the InvariantEngine invariant chain. |
| 14 | Phil's preferred rollout sequencing | IN-SCOPE-MVP (as sequencing guidance only) | Phil's order (metadata → BAM fit → bundles → constraints → priority scoring → completion feedback) is directionally correct and consistent with existing epic dependency order. §7 of this PRD adjusts for existing artifact constraints. | `DELIVERY_PLAN.md §1 epic dependency graph` | None |

**Verdict counts:** ALREADY-COVERED: 3 (points 9, and partial coverage in 6/7/8/11); IN-SCOPE-MVP: 0 new features (point 14 is sequencing guidance, not a new feature); IN-SCOPE-POST-MVP: 5 (points 1-filtered, 2, 3, 5, 11-new-signals, 13); DEFERRED: 4 (points 4, 10, 12, and remainder of 6/7/8).

Simplified count for summary: ALREADY-COVERED: 3 | IN-SCOPE-MVP: 0 | IN-SCOPE-POST-MVP: 6 | DEFERRED: 5 | EXCLUDED: 0

---

## 3. Conflict Map

| Point | Touches Epic(s) | Field duplication risk | Nearness to §4.3 | FSM/invariant risk |
|---|---|---|---|---|
| 1 (4 new fields) | E2 (catalog seed), E3 (composer), E4 (capacity/invariant engine) | `defaultDurationMinutes` already covers Preferred Block Size; do NOT add a duplicate duration field. `bucket` already covers primary BAM bucket. | None — these are read hints for the composer, not new scheduling modes. | None if fields are read-only hints that do not override bucket or invariant checks. |
| 2 (allowedSecondaryBucket) | E3 (composer), E4 (invariant engine) | `CatalogEntry.bucket` is the primary. `allowedSecondaryBucket` must be stored separately. | Nears §4.3 "no calendar product" if it enables arbitrary cross-bucket moves. | HIGH: The 4-2-2 invariant freezes `ScheduledActivity.bucket` at schedule time from `CatalogEntry.bucket`. A secondary bucket must be opt-in at placement time, not a silent override. Invariant guard must still validate against the chosen bucket. |
| 3 (38 new entries) | E2 (catalog seed) | None — all are new entries. Bucket assignment required per `CATALOG_GAPS §H.1` precedent. | None | Phase-gate entries must carry `projectTypeBinding` or remain cross-project. DAG edges must be cycle-free (validated at seed). |
| 5 (scheduling bundles) | E2 (catalog seed), E3 (composer) | Bundles overlap with `projectTypeBinding` seeding pattern from E13. Must NOT re-implement project-type binding as a bundle. | None | DAG prerequisite checks in `eligibleDmaicPayloadSteps` must still fire before a bundle entry is placed. |
| 11 (new ON_SIGNAL subtypes) | E3 (composer), E5 (activity runtime) | `ComposerInput.signals` has 3 fields (`inboxOverThreshold`, `documentAwaitingReview`, `innovationStageReady`). New signals extend this shape — must not rename existing fields. | None | New signal types must be additive to `ComposerInput` shape per `ENGINE_DESIGN §1.1`. |
| 13 (anti-pattern detection) | E9 (metrics), new E19 service | None | None | Must not mutate `InvariantEngine` checks. Must subscribe to existing events as a new subscriber, not modify existing handlers. |

---

## 4. Field-by-Field Decisions for Point 1 (scheduling metadata)

| Proposed field | On CatalogEntry already? | Verdict | Default | Who writes | Who reads | Migration cost |
|---|---|---|---|---|---|---|
| Planning Tier (Day/Week/Sprint/Month/Quarter) | YES — `CatalogEntry.cadence` enum covers this (`DAILY`, `WEEKLY`, `SPRINT`, `MONTHLY`, `QUARTERLY`). | ALREADY-COVERED | — | — | — | — |
| Time-of-Day Fit (early day / late morning / after lunch / late afternoon) | NO | IN-SCOPE-POST-MVP | `ANY` (null = no preference) | Catalog seed author (Phil) | `orderDay` in `ENGINE_DESIGN §1.7` to bias placement within the existing ordering heuristic | S — one nullable enum field on `CatalogEntry` |
| Energy Type (deep focus / collaborative / admin-light / reflective) | PARTIAL — `bucket` (PROJECT/COMMUNICATION/CI) approximates this. Energy Type is more granular. | DEFERRED | `bucket` mapping is sufficient for MVP. Revisit when team scheduling ships. | — | — | — |
| Cognitive Load (low/medium/high) | NO | IN-SCOPE-POST-MVP | `MEDIUM` | Catalog seed author | `orderDay` to avoid back-to-back HIGH-load blocks | S — one enum field on `CatalogEntry` |
| Schedule Flexibility (fixed/preferred/flexible) | PARTIAL — `isNonOptional` covers the fixed end. Flexible configurable blocks are the default. | ALREADY-COVERED | — | — | — | — |
| Can Split? (y/n) | PARTIAL — `USER.deepSlicePreference` + `ENGINE_DESIGN §1.6 sliceDeep` handles Deep-block splitting. Split eligibility per entry is not stored. | IN-SCOPE-POST-MVP | `true` for PROJECT-bucket entries, `false` for others | Catalog seed author | `sliceDeep` to determine split eligibility | S — one boolean on `CatalogEntry` |
| Minimum Effective Block (15/30/45/60/90/120 min) | NO | IN-SCOPE-POST-MVP | 30 min | Catalog seed author | `ENGINE_DESIGN §2.2` resize ceilings (currently uses `entry.minDuration ?? 15`) — replaces the `?? 15` fallback | S — one integer field, already referenced as `entry.minDuration` in `UX_FLOWS §4.3`; this formalizes it |
| Preferred Block Size | ALREADY-COVERED by `defaultDurationMinutes` | ALREADY-COVERED | — | — | — | — |
| Maximum Useful Block | ALREADY-COVERED — `ENGINE_DESIGN §2.2` computes ceiling as `min(entry.defaultDurationMinutes + 30, remainingBucketMin)`. A separate max-useful field would conflict. | ALREADY-COVERED | — | — | — | — |
| Dependency Type (none/hard/soft) | PARTIAL — `CatalogEntry.dependsOn[]` encodes hard prerequisites for DMAIC DAG. Soft dependencies are not modeled. | DEFERRED | Hard DAG covers MVP need. Soft dependencies require UI surfacing not scoped. | — | — | — |
| Predecessor Tasks | ALREADY-COVERED by `CatalogEntry.dependsOn[]` (`ARCHITECTURE §2.2`) | ALREADY-COVERED | — | — | — | — |
| Planning Urgency (deadline/cadence/opportunity/risk-driven) | PARTIAL — `urgency` term in scoring formula + `Kaizen.targetCloseDate` + `CatalogEntry.cadence` cover this. A standalone field would duplicate existing terms. | ALREADY-COVERED | — | — | — | — |
| Business Value Type (revenue/customer/risk/capability/learning/compliance) | NO — exists on Kaizen actions as informal tags but not on `CatalogEntry`. | DEFERRED | Valuable for portfolio reporting; requires multi-Kaizen portfolio (`PRODUCT_BLUEPRINT §5.2`) to be meaningful. | — | — | — |
| Role Owner (IC/lead/exec/analyst/sponsor) | PARTIAL — `CatalogEntry.appliesToRoles` carries BAM roles. Phil's role-owner taxonomy (IC/lead/exec) differs. | DEFERRED | Map IC→PRACTITIONER, lead→FACILITATOR, exec→LEADER at integration time. | — | — | — |
| Mode (solo/paired/team/exec/async) | NO | DEFERRED | Useful for team scheduling (Next). Single-user MVP does not benefit. | — | — | — |
| Context/Tool Requirements (Miro, Excel, etc.) | NO | DEFERRED | `CatalogEntry.inputs[]` partially covers this as named artifact sources. A tool enum is tooling-catalog work for Next. | — | — | — |
| Interruption Tolerance (low/med/high) | NO | IN-SCOPE-POST-MVP | `LOW` for PROJECT-bucket entries (protects Deep blocks), `HIGH` for CI-bucket entries | Catalog seed author | Anti-pattern detector (Point 13) and future no-fly zone enforcement | S — one enum on `CatalogEntry` |

**Net-new fields surviving triage (4 fields):** `timeOfDayFit` (enum, nullable), `cognitiveLoad` (enum, default MEDIUM), `canSplit` (boolean), `interruptionTolerance` (enum). `minEffectiveBlockMinutes` is also new but already referenced as `entry.minDuration` in `UX_FLOWS §4.3` — this formalizes an existing informal field.

**Total new fields on `CatalogEntry`: 5.** System-architect confirms schema and migration. PM does not propose a migration approach.

---

## 5. Acceptance Criteria for IN-SCOPE Items

### Point 1 — New CatalogEntry scheduler-hint fields (Post-MVP)

- Given a `CatalogEntry` with `timeOfDayFit = 'EARLY_DAY'`, when `orderDay` places it, then its `plannedStartAt` is set earlier in the day than an entry with `timeOfDayFit = 'LATE_AFTERNOON'` in the same bucket, all else equal.
- Given a `CatalogEntry` with `cognitiveLoad = 'HIGH'`, when the composer produces a Daily composition, then no two HIGH-cognitiveLoad blocks are placed back-to-back without at least one non-HIGH block between them.
- Given a `CatalogEntry` with `canSplit = false`, when `sliceDeep` is called, then it emits exactly one block of the full `defaultDurationMinutes` rather than splitting into multiple slices.
- Given a `CatalogEntry` with `minEffectiveBlockMinutes = 60`, when a user resizes the block in Edit mode, then the minimum selectable size is 60 min (not 15 min per the current `?? 15` fallback in `UX_FLOWS §4.3`).
- Given a `CatalogEntry` with `interruptionTolerance = 'LOW'`, when the anti-pattern detector (Point 13) evaluates a day with that block placed in a meeting-heavy window, then it emits an `AntiPattern{kind: 'LOW_TOLERANCE_IN_HIGH_INTERRUPT_WINDOW'}` signal.
- Given the catalog seed, when any entry lacks one of the 5 new fields, then the seed validator applies the documented default and does not reject the entry.

### Point 2 — allowedSecondaryBucket (Post-MVP)

- Given a `CatalogEntry` with `bucket = 'PROJECT'` and `allowedSecondaryBucket = 'CI'`, when a user drags the block to the CI zone in Edit mode, then the rebucket is permitted and `ScheduledActivity.bucket` is frozen as `'CI'` at placement time.
- Given the above rebucket, when `InvariantEngine.validateComposition` runs, then it validates against the placed `bucket` value (`'CI'`), not the entry's primary `bucket` (`'PROJECT'`), and the 4-2-2 shape check still applies.
- Given a `CatalogEntry` with `allowedSecondaryBucket = null`, when a user attempts to drag it to any bucket other than its primary `bucket`, then the drag snap-back fires with the existing "bucket is frozen" tooltip per `UX_FLOWS §4.2`.
- Given any composition save, when a block is placed in its `allowedSecondaryBucket`, then `ScheduledActivity.sourceOfSchedule = 'USER_EDIT'` is recorded (not `COMPOSER_AUTO`), preserving the composition-acceptance metric accuracy.

### Point 3 — 38 new catalog activity types (Post-MVP)

- Given the 38 new entries proposed, when each entry is seeded, then it carries all 9 required fields from `PRODUCT_BLUEPRINT §3.1` (name, focusArea, defaultDurationMinutes, cadence, inputs, outputArtifact, participants, trigger, procedure) — no null or empty required field is permitted.
- Given an entry in the "Communication additions" group, when it is seeded, then `bucket = 'COMMUNICATION'` and `projectTypeBinding = null` (cross-project eligible).
- Given an entry in the "Continuous Improvement additions" group, when it is seeded, then `bucket = 'CI'` and it passes `CatalogService.validateDag()` (no new DAG cycles introduced).
- Given procedure text is missing from any of the 38 entries at seed time, then the seeder rejects the entry and surfaces it as a `CATALOG_GAP` flag — it does not silently insert an empty procedure.

### Point 5 — Default scheduling bundles (Post-MVP)

- Given a user starts a new DMAIC Kaizen in the DEFINE phase, when the composer runs, then the "DMAIC Define Starter" bundle is offered as a pre-selected payload group that places all bundle entries into eligible Deep slots across the next 5 days, subject to DAG prerequisite checks.
- Given a bundle entry whose DAG prerequisites are not yet met, when the bundle is applied, then that entry is excluded from the current composition and queued for the next eligible day — the bundle does not bypass `eligibleDmaicPayloadSteps`.
- Given a bundle, when it is applied, then each placed entry carries `sourceOfSchedule = 'COMPOSER_AUTO'` and a why-trail entry citing `{rule: 'BUNDLE', bundleId: '...'}`.
- Given the "Weekly BAM Operating" bundle, when invoked at week-open, then it does not conflict with the existing weekly non-optional set — it supplements configurable slots only.

### Point 11 — New ON_SIGNAL trigger subtypes (Post-MVP)

- Given `ComposerInput.signals` is extended with `riskThresholdBreached: boolean` and `stalledWorkItem: string[]`, when `riskThresholdBreached = true`, then the composer promotes a risk-review catalog entry (from Point 3 Communication additions) to the top of the COMMUNICATION-bucket filler queue for that day.
- Given `ComposerInput.signals` shape is extended, when existing code reads only the original 3 fields (`inboxOverThreshold`, `documentAwaitingReview`, `innovationStageReady`), then it continues to function without modification — the extension is additive.

### Point 13 — Anti-pattern detection (Post-MVP)

- Given a completed `MetricsSnapshot`, when the `AntiPatternEngine` evaluates it, then it returns a typed list of `AntiPatternSignal{kind, severity, evidence[]}` — not a free-text string.
- Given a day with `COMMUNICATION` bucket minutes > 180, when anti-pattern detection runs, then it emits `AntiPattern{kind: 'COMMUNICATION_HEAVY', severity: 'WARN'}`.
- Given no CI activity scheduled for 2 consecutive days, when anti-pattern detection runs, then it emits `AntiPattern{kind: 'CI_SKIPPED', severity: 'WARN'}`.
- Given `AntiPatternEngine` emits a signal, then it does so by subscribing to existing events on the `EventBus` — it does NOT call `InvariantEngine` methods or mutate `Composition` state.
- Given an anti-pattern signal, when it surfaces in the UI, then it appears as an inline coaching string (≤ 20 words, no emoji, non-blocking) consistent with the E11 coaching microcopy system style.

---

## 6. Proposed Epic Decomposition

**E19 — Catalog Scheduler-Hint Fields + allowedSecondaryBucket**
Adds 5 new fields to `CatalogEntry` (timeOfDayFit, cognitiveLoad, canSplit, interruptionTolerance, minEffectiveBlockMinutes) and `allowedSecondaryBucket`. Seeds all existing 60+ entries with defaults. Updates `orderDay`, `sliceDeep`, and the resize guard to read the new hints. Updates `InvariantEngine` to validate rebucketed blocks against placed bucket. Depends on E2 (catalog seed), E3 (composer), E4 (invariant engine).

**E20 — Extended Catalog: 38 New Named Activity Types + Scheduling Bundles**
Authors procedure text for all 38 new activities (Phil-gated blocker), seeds them with bucket + projectTypeBinding assignments, and implements the bundle concept as a pre-selected payload group that respects DAG checks. Adds the 4 new ON_SIGNAL subtypes to `ComposerInput.signals`. Depends on E19 (new fields must exist for full seed), E3 (composer signals extension).

**E21 — Anti-Pattern Detection Engine**
New `AntiPatternEngine` service subscribing to the existing EventBus. Evaluates `MetricsSnapshot` + `Composition` data to emit typed `AntiPatternSignal` list. Surfaces signals via the E11 coaching microcopy system. Depends on E9 (MetricsService), E11 (coaching system), E19 (interruptionTolerance field).

**Dependency order:** E19 → E20 → E21. All three are Post-MVP.

---

## 7. Sequencing Recommendation

Phil's stated order from Point 14: metadata → BAM fit → bundles → constraints → priority scoring → completion feedback.

Adjusted order given existing artifacts:

1. **E19 first** — Metadata (Point 1 filtered fields) + BAM secondary-bucket fit (Point 2). These are a single schema bump to `CatalogEntry`. Constraints (Point 6) are already covered by the existing engine; no new work needed for the covered subset.
2. **E20 second** — New activity types (Point 3) + Bundles (Point 5) + New signal triggers (Point 11). Bundles cannot be authored before the new fields exist (they reference `timeOfDayFit` and `cognitiveLoad`). Procedure text for Point 3 is Phil-gated and must be resolved before E20 starts.
3. **E21 third** — Anti-pattern detection (Point 13). Requires MetricsService data to be rich enough (needs activity volume from E20 entries) to fire meaningfully.
4. **Priority scoring enhancements** (Point 7 decay rate, confidence) — post-E21, conditioned on multi-Kaizen portfolio shipping (Next). Not in E19–E21.
5. **Planning views** (Point 12) — post-E21, requires E19 fields to filter by. Not in E19–E21.
6. **Completion feedback** (Point 9) — already covered. No new epic needed.

**Adjustment from Phil's order:** "Constraints/guardrails" (Point 6) moves out of the critical path because most of it is already enforced by `InvariantEngine`. The unshipped subset (per-user no-fly zones) is deferred to Next with team scheduling. This avoids adding User-preference fields before the core metadata fields are stable.

---

## 8. Open Questions (Phil-decisions-required)

1. **Procedure text for 38 new catalog entries (Point 3).** Decision needed: will Phil author the procedure text for all 38 entries, or is a subset (e.g., the 12 CI additions) sufficient for E20? Default if no decision: E20 ships with only the CI-addition subset (12 entries) where procedures can be inferred from existing DMAIC/Kaizen standards. What blocks: E20 cannot start seeding until the in-scope entry list is locked with procedures.

2. **allowedSecondaryBucket invariant ruling (Point 2).** Decision needed: should the `InvariantEngine` treat a block placed in its secondary bucket as a "configurable rebucket" (existing drop-rule #2 in `SCHEDULING_VISION §2.7`) or as a new class of placement? Default if no decision: treat as a configurable rebucket — no new invariant class, existing drop-rule #2 logic extended. What blocks: system-architect cannot finalize E19 schema until this is resolved.

3. **timeOfDayFit values for existing 60+ catalog entries.** Decision needed: Phil must review and approve the default `timeOfDayFit` values for existing entries before E19 ships — `orderDay` will change block placement when this field is populated. Default if no decision: `timeOfDayFit = null` (no preference) for all existing entries, which preserves current `orderDay` behavior exactly. What blocks: if defaults are null, the field ships but has no scheduling effect until Phil fills values.

4. **Bundle triggering rule for non-DMAIC project types (Point 5).** Decision needed: should "DMAIC Define Starter" bundles auto-trigger on Kaizen phase entry, or should the user invoke them manually from a UI picker? Default if no decision: manual invocation only — consistent with `PRODUCT_BLUEPRINT §2` principle "auto-compose, not hand-build" but keeps the user in control of bundle activation. What blocks: E20 composer integration cannot be specified without this.

5. **Anti-pattern severity thresholds (Point 13).** Decision needed: what numeric thresholds define "too much communication" (minutes/day) and "too many active projects" (count)? Default if no decision: use `InvariantEngine` ceiling values as thresholds (COMMUNICATION > 180 min/day = WARN; active projects > 1 in MVP = N/A). What blocks: E21 `AntiPatternEngine` cannot be tested without agreed thresholds.

---

## 9. Out of Scope (Explicit)

| Item | Verdict | Rationale | Trigger to re-open |
|---|---|---|---|
| Point 4 — Planning objects (Phases, Bundles as entities, Sequences, Kits) | DEFERRED | `SCHEDULING_VISION §2.3` maps all these to existing entities. New entity types conflict with the no-new-entities principle. | Multi-user team planning ships in Next; revisit then. |
| Point 6 — No-fly zones, per-user max-meeting cap | DEFERRED | Not in `ARCHITECTURE §2.3 User`; requires UX additions to `/settings`. | Team scheduling (Next) requires this; add as User fields then. |
| Point 7 — Decay rate, Confidence Level | DEFERRED | Meaningful only across competing Kaizens; single-Kaizen MVP has no scoring benefit. | Multi-Kaizen portfolio (`PRODUCT_BLUEPRINT §5.2`) ships in Next. |
| Point 7 — Strategic Alignment Score as new field | ALREADY-COVERED | `strategic_flag` in `SCHEDULING_VISION §2.5` scoring formula and `Kaizen.actions[].strategic` already cover this. | No trigger needed. |
| Point 8 — Team preferences (collaboration overlap, team TZ) | DEFERRED | Single-user MVP; team rollup is `PRODUCT_BLUEPRINT §4.2 Should-wait`. | Team rollup ships in Next. |
| Point 8 — Maker vs manager weighting | DEFERRED | `User.roles` + `User.deepSlicePreference` approximate this. Explicit weight adds complexity without clear MVP metric improvement. | Revisit after 90-day adherence data shows role-split pattern. |
| Point 10 — Output template library (charter PDFs, SOP docs) | DEFERRED | `PRODUCT_BLUEPRINT §4.3` excludes generic document generation. `CatalogEntry.outputArtifact` schema is sufficient for MVP evidence capture. | Catalog editor for Champions (`PRODUCT_BLUEPRINT §5.2`) is the trigger. |
| Point 12 — Multi-dimensional planning views | DEFERRED | Requires Point 1 fields first (E19), then team-rollup UX (Next). Current routes cover MVP scheduling surfaces. | Re-open after E19 ships and team-rollup is scoped. |
| Energy Type (from Point 1) | DEFERRED | `bucket` approximates it; granular Energy Type adds a field that is redundant at single-user scale. | Multi-user scheduling — energy alignment matters for meeting scheduling. |
| Mode (solo/paired/team/exec/async) from Point 1 | DEFERRED | Team scheduling is Next. Single-user MVP has no use for this field. | Team rollup ships. |
| Context/Tool Requirements from Point 1 | DEFERRED | `CatalogEntry.inputs[]` partially covers this. A tool enum is catalog-editor scope. | Catalog editor for Champions. |

---

## 10. Success Metrics

These metrics define "this PRD shipped successfully." All tie to `PRODUCT_BLUEPRINT §7.x`.

| Metric | Baseline | Target | Source tie | When measured |
|---|---|---|---|---|
| Daily composition acceptance rate (Accept without edit) | Current baseline unknown — instrument on E19 deploy | ≥ 60% (matches `PRODUCT_BLUEPRINT §7.2`) | `PRODUCT_BLUEPRINT §7.2`; `SCHEDULING_VISION §1.6 #3` | 30 days after E19 ships |
| Composition edit rate attributable to time-of-day placement changes | Not measured pre-E19 | ≤ 10% of edit sessions cite block-placement as reason (proxy: Edit sessions where only `plannedStartAt` changes) | `ARCHITECTURE §2.5 sourceOfSchedule` variance log | 30 days after E19 ships |
| Catalog coverage: schedulable named activities | 60 entries today | ≥ 90 entries after E20 (38 new + existing) | `CATALOG_GAPS §H` count | At E20 ship |
| Anti-pattern signal rate per active user per week | 0 (no detector today) | ≥ 1 signal surfaced per user per week (proves detector is firing) | New `AntiPatternSignal` event count | 14 days after E21 ships |
| Anti-pattern resolution rate | 0 | ≥ 40% of surfaced signals resolved within 2 compositions (user either changes behavior or dismisses with reason) | New dismissal event on `AntiPatternSignal` | 30 days after E21 ships |
| Validated Kaizen throughput | ≥ 1 per user per month (`PRODUCT_BLUEPRINT §7.5`) | No regression — E19/E20/E21 must not reduce this metric | `PRODUCT_BLUEPRINT §7.5` | Ongoing; check at 90 days post-E19 |

**If any of the above cannot be measured after ship, the requirement that generated it is incomplete.** Specifically: if `timeOfDayFit` values are left null for all existing entries (open question #3 default), the "composition edit rate attributable to placement" metric will not move and the metric is vacuous. Phil must decide on timeOfDayFit values before E19 ships for this metric to be meaningful.
