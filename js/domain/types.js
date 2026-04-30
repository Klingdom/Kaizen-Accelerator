/**
 * BAM-X Kaizen OS — Domain typedefs (E1-T1 + E1-T10).
 *
 * Every typedef below is an exact transcription of the entity tables in
 * ARCHITECTURE.md §2.1–§2.13 and §4.7 (InfeasibleResult). Field names,
 * optionality, and union shapes match the docs verbatim. No fields invented.
 *
 * ES-module file. No runtime deps. Pure JSDoc — these typedefs exist only
 * for tooling (editors, type-checkers) and the ENTITIES introspection array.
 *
 * IMPORTANT: We re-declare each typedef as `const` exports holding `null`
 * objects. This is a technique for making typedefs importable cheaply: the
 * value is inert but the symbol exists so other modules can `import` the
 * names without pulling in a separate types registry.
 */

// ---------------------------------------------------------------------------
// Enums (exported as frozen objects — `as const`-equivalent in vanilla JS)
// ---------------------------------------------------------------------------

/**
 * ProjectType (ARCHITECTURE §2.9). v0.5 adds KAIZEN_EVENT_90D as the 5th
 * value — the 90-day Kaizen Event project per Option B recommendation in
 * KAIZEN_EVENT_STANDARD v1.0. KAIZEN_EVENT remains the standalone 1–5 day
 * burst semantics from ENGINE_DESIGN §4.3.
 *
 * @typedef {'DMAIC' | 'KAIZEN_EVENT' | 'KAIZEN_EVENT_90D' | 'KAIZEN_ACCELERATOR_30D' | 'AD_HOC'} ProjectType
 */
export const ProjectType = Object.freeze({
  DMAIC: 'DMAIC',
  KAIZEN_EVENT: 'KAIZEN_EVENT',
  KAIZEN_EVENT_90D: 'KAIZEN_EVENT_90D',
  KAIZEN_ACCELERATOR_30D: 'KAIZEN_ACCELERATOR_30D',
  AD_HOC: 'AD_HOC'
});

/**
 * CatalogEntry.focusArea values (ARCHITECTURE §2.2).
 * @typedef {'DEEP_WORK' | 'COMMUNICATION' | 'CONTINUOUS_IMPROVEMENT' | 'CEREMONY' | 'DMAIC' | 'KAIZEN' | 'INNOVATION' | 'KAIZEN_ACCELERATOR_30D'} FocusArea
 */
export const FocusArea = Object.freeze({
  DEEP_WORK: 'DEEP_WORK',
  COMMUNICATION: 'COMMUNICATION',
  CONTINUOUS_IMPROVEMENT: 'CONTINUOUS_IMPROVEMENT',
  CEREMONY: 'CEREMONY',
  DMAIC: 'DMAIC',
  KAIZEN: 'KAIZEN',
  INNOVATION: 'INNOVATION',
  KAIZEN_ACCELERATOR_30D: 'KAIZEN_ACCELERATOR_30D'
});

/**
 * CatalogEntry.cadence values (ARCHITECTURE §2.2).
 * @typedef {'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY' | 'QUARTERLY' | 'CONTINUOUS' | 'ON_SIGNAL' | 'EVENT_DRIVEN' | 'EVERY_48H'} Cadence
 */
export const Cadence = Object.freeze({
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  SPRINT: 'SPRINT',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  CONTINUOUS: 'CONTINUOUS',
  ON_SIGNAL: 'ON_SIGNAL',
  EVENT_DRIVEN: 'EVENT_DRIVEN',
  EVERY_48H: 'EVERY_48H'
});

/**
 * Bucket values — the 4-2-2 daily bucket a CatalogEntry counts against.
 * @typedef {'PROJECT' | 'COMMUNICATION' | 'CI'} Bucket
 */
export const Bucket = Object.freeze({
  PROJECT: 'PROJECT',
  COMMUNICATION: 'COMMUNICATION',
  CI: 'CI'
});

/**
 * Composition.cycleType values.
 * @typedef {'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY'} CycleType
 */
export const CycleType = Object.freeze({
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  SPRINT: 'SPRINT',
  MONTHLY: 'MONTHLY'
});

/**
 * WeeklyComposition.state values (Sprint 9). Mirrors CompositionState but
 * scoped to the weekly envelope. A WeeklyComposition is PROPOSED after the
 * pure `composeWeekly()` runs; moves to ACCEPTED when the user accepts the
 * week; REJECTED terminal on reject. Per-day `Composition` rows each carry
 * their own `CompositionState`.
 *
 * @typedef {'PROPOSED' | 'ACCEPTED' | 'REJECTED'} WeeklyCompositionStatus
 */
export const WeeklyCompositionStatus = Object.freeze({
  PROPOSED: 'PROPOSED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
});

/**
 * Composition.state values (ARCHITECTURE §2.4 + §3.1 FSM).
 * @typedef {'PROPOSED' | 'ACCEPTED' | 'EDITED' | 'REJECTED' | 'ACTIVE' | 'CLOSED'} CompositionState
 */
export const CompositionState = Object.freeze({
  PROPOSED: 'PROPOSED',
  ACCEPTED: 'ACCEPTED',
  EDITED: 'EDITED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED'
});

/**
 * ScheduledActivity.state values (ARCHITECTURE §3.2 FSM).
 * @typedef {'PROPOSED' | 'SCHEDULED' | 'DROPPED' | 'IN_PROGRESS' | 'CLOSED' | 'SKIPPED'} ScheduledActivityState
 */
export const ScheduledActivityState = Object.freeze({
  PROPOSED: 'PROPOSED',
  SCHEDULED: 'SCHEDULED',
  DROPPED: 'DROPPED',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  SKIPPED: 'SKIPPED'
});

/**
 * ScheduledActivity.reasonCodeIfSkipped + Variance.reasonCode values.
 * @typedef {'ESCALATION' | 'MEETING_CONFLICT' | 'SICK' | 'BLOCKED' | 'DEPRIORITIZED' | 'OTHER'} ReasonCode
 */
export const ReasonCode = Object.freeze({
  ESCALATION: 'ESCALATION',
  MEETING_CONFLICT: 'MEETING_CONFLICT',
  SICK: 'SICK',
  BLOCKED: 'BLOCKED',
  DEPRIORITIZED: 'DEPRIORITIZED',
  OTHER: 'OTHER'
});

/**
 * ScheduledActivity.sourceOfSchedule values.
 * @typedef {'COMPOSER_AUTO' | 'USER_EDIT' | 'USER_ADD'} SourceOfSchedule
 */
export const SourceOfSchedule = Object.freeze({
  COMPOSER_AUTO: 'COMPOSER_AUTO',
  USER_EDIT: 'USER_EDIT',
  USER_ADD: 'USER_ADD'
});

/**
 * OutputArtifact schema values.
 * @typedef {'TEXT' | 'TWO_LIST' | 'NUMERIC' | 'DOCUMENT' | 'CHART'} ArtifactSchema
 */
export const ArtifactSchema = Object.freeze({
  TEXT: 'TEXT',
  TWO_LIST: 'TWO_LIST',
  NUMERIC: 'NUMERIC',
  DOCUMENT: 'DOCUMENT',
  CHART: 'CHART'
});

/**
 * Variance.kind values (ARCHITECTURE §2.7).
 * @typedef {'SKIPPED_NON_OPTIONAL' | 'OVERRAN' | 'UNDERRAN' | 'RESCHEDULED' | 'EDITED_FROM_PROPOSAL'} VarianceKind
 */
export const VarianceKind = Object.freeze({
  SKIPPED_NON_OPTIONAL: 'SKIPPED_NON_OPTIONAL',
  OVERRAN: 'OVERRAN',
  UNDERRAN: 'UNDERRAN',
  RESCHEDULED: 'RESCHEDULED',
  EDITED_FROM_PROPOSAL: 'EDITED_FROM_PROPOSAL'
});

/**
 * FrictionSignal.tag values.
 * @typedef {'MEETING_LOAD' | 'CONTEXT_SWITCH' | 'BLOCKED_DEP' | 'TOOL_FRICTION' | 'PRIORITY_INVERSION' | 'OTHER'} FrictionTag
 */
export const FrictionTag = Object.freeze({
  MEETING_LOAD: 'MEETING_LOAD',
  CONTEXT_SWITCH: 'CONTEXT_SWITCH',
  BLOCKED_DEP: 'BLOCKED_DEP',
  TOOL_FRICTION: 'TOOL_FRICTION',
  PRIORITY_INVERSION: 'PRIORITY_INVERSION',
  OTHER: 'OTHER'
});

/**
 * FrictionSignal.status values.
 * @typedef {'OPEN' | 'CLUSTERED' | 'PROMOTED_TO_KAIZEN' | 'DISMISSED'} FrictionStatus
 */
export const FrictionStatus = Object.freeze({
  OPEN: 'OPEN',
  CLUSTERED: 'CLUSTERED',
  PROMOTED_TO_KAIZEN: 'PROMOTED_TO_KAIZEN',
  DISMISSED: 'DISMISSED'
});

/**
 * Kaizen.state values (ARCHITECTURE §3.3 FSM).
 * @typedef {'DRAFT' | 'ACTIVE' | 'IN_REMEASUREMENT' | 'CLOSED'} KaizenState
 */
export const KaizenState = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  IN_REMEASUREMENT: 'IN_REMEASUREMENT',
  CLOSED: 'CLOSED'
});

/**
 * Kaizen.closeKind values.
 * @typedef {'SUCCESS' | 'PARTIAL' | 'FAILED_HONEST'} CloseKind
 */
export const CloseKind = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED_HONEST: 'FAILED_HONEST'
});

/**
 * Kaizen.metricDirection values (Sprint 8). Controls how `beatsBaseline` is
 * computed on Remeasurement: 'higher_is_better' counts a positive delta as
 * improvement; 'lower_is_better' flips the sign. Default 'higher_is_better'.
 *
 * @typedef {'higher_is_better' | 'lower_is_better'} MetricDirection
 */
export const MetricDirection = Object.freeze({
  HIGHER_IS_BETTER: 'higher_is_better',
  LOWER_IS_BETTER: 'lower_is_better'
});

/**
 * Reflection.kind values.
 * @typedef {'END_OF_ACTIVITY' | 'WEEKLY'} ReflectionKind
 */
export const ReflectionKind = Object.freeze({
  END_OF_ACTIVITY: 'END_OF_ACTIVITY',
  WEEKLY: 'WEEKLY'
});

/**
 * PdcaExperiment.state values (ARCHITECTURE §2.13 FSM).
 * @typedef {'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'CLOSED'} PdcaState
 */
export const PdcaState = Object.freeze({
  PLAN: 'PLAN',
  DO: 'DO',
  CHECK: 'CHECK',
  ACT: 'ACT',
  CLOSED: 'CLOSED'
});

/**
 * PdcaExperiment.closedReason values.
 * @typedef {'GRADUATED' | 'ABANDONED' | 'SUPERSEDED_BY_KAIZEN'} PdcaClosedReason
 */
export const PdcaClosedReason = Object.freeze({
  GRADUATED: 'GRADUATED',
  ABANDONED: 'ABANDONED',
  SUPERSEDED_BY_KAIZEN: 'SUPERSEDED_BY_KAIZEN'
});

/**
 * Opportunity.status values (Sprint 7 §2.14). FSM:
 *   INTAKE → SCORED → (PROMOTED | DEFERRED | REJECTED)
 *   INTAKE → (PROMOTED | DEFERRED | REJECTED)
 * The three PROMOTED / DEFERRED / REJECTED states are TERMINAL — the row is
 * immutable except for `updatedAt`.
 *
 * @typedef {'INTAKE' | 'SCORED' | 'PROMOTED' | 'DEFERRED' | 'REJECTED'} OpportunityStatus
 */
export const OpportunityStatus = Object.freeze({
  INTAKE: 'INTAKE',
  SCORED: 'SCORED',
  PROMOTED: 'PROMOTED',
  DEFERRED: 'DEFERRED',
  REJECTED: 'REJECTED'
});

// ---------------------------------------------------------------------------
// Supporting structure typedefs
// ---------------------------------------------------------------------------

/**
 * OutputArtifact shape on a CatalogEntry.
 * @typedef {object} OutputArtifactDef
 * @property {string} name
 * @property {ArtifactSchema} schema
 * @property {true} required
 */

/**
 * OutputArtifactRef stored on a ScheduledActivity at close (§2.5).
 * @typedef {object} OutputArtifactRef
 * @property {ArtifactSchema} schema
 * @property {*} value
 */

/**
 * Metric definition embedded on BaselineMetric / referenced on Remeasurement.
 * @typedef {object} MetricDefinition
 * @property {string} name
 * @property {string} unit
 * @property {string} operationalDefinition
 * @property {number} sampleSize
 * @property {string} method
 */

/**
 * Kaizen action row (§2.9). `strategic` flag (v0.5) weights the Accelerator
 * Phase 3→4 advancement guard: strategic items veto the advance regardless of
 * overall action-count completion. Optional; absent = false.
 *
 * @typedef {object} KaizenAction
 * @property {string} name
 * @property {string} ownerRef
 * @property {string} dueDate   // ISO date
 * @property {string|null} doneAt
 * @property {boolean} [strategic]   // Accelerator Phase 3→4 weighted guard
 */

/**
 * Frozen-at-start snapshot of Accelerator phase structure (§2.9).
 * @typedef {object} ProjectPhaseDefinition
 * @property {string} id                       // e.g. 'PHASE_0'
 * @property {string} name
 * @property {number} days                     // target working-days
 * @property {string[]} nonOptionalCatalogEntryIds
 */

/**
 * Composer input snapshot frozen on Composition at proposal time (§2.4).
 * @typedef {object} ComposerInputsSnapshot
 * @property {string} role
 * @property {number} capacityMinutes
 * @property {string} sprintPhase
 * @property {string|null} activeKaizenId
 * @property {number} varianceCount
 */

/**
 * Composition.invariantChecks (§2.4.1) last-validation shape.
 * @typedef {object} InvariantChecks
 * @property {{ok: boolean, projectMin: number, commMin: number, ciMin: number}} shape_4_2_2
 * @property {{ok: boolean, missing: string[]}} nonOptionalPresent
 * @property {{ok: boolean, totalMin: number, capacityMin: number}} overAllocated
 */

// ---------------------------------------------------------------------------
// 2.2 CatalogEntry (+ E1-T10 projectTypeBinding / phaseBinding)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} CatalogEntry
 * @property {string} id
 * @property {number|null} activityNumber                // Source row 1–50; null for ceremonies
 * @property {string} name
 * @property {FocusArea} focusArea
 * @property {number} defaultDurationMinutes
 * @property {Cadence} cadence
 * @property {string} trigger
 * @property {string[]} inputs
 * @property {OutputArtifactDef} outputArtifact
 * @property {string[]} participants
 * @property {string[]} procedure
 * @property {Bucket} bucket
 * @property {boolean} isNonOptional
 * @property {string[]} appliesToRoles                   // 'PRACTITIONER' | 'FACILITATOR' | 'LEADER' | 'CHAMPION'
 * @property {boolean} enabledByUser
 * @property {number} version
 * @property {string} sourceRef
 * @property {string[]} dependsOn                        // DMAIC DAG parent CatalogEntry ids
 * @property {ProjectType|ProjectType[]|null} projectTypeBinding   // v0.5: set-valued when an entry serves multiple project types (e.g. #42–#50 bind to KAIZEN_EVENT and KAIZEN_EVENT_90D per CATALOG_GAPS §K)
 * @property {string|null} phaseBinding                  // E1-T10 — e.g. 'PHASE_0'..'PHASE_4' (Accelerator) or 'PRE_EVENT'|'EVENT'|'POST_EVENT'|'SUSTAIN' (Kaizen 90)
 */
export const CatalogEntry = null;

// ---------------------------------------------------------------------------
// 2.3 User
// ---------------------------------------------------------------------------

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string[]} role
 * @property {number} dailyCapacityMinutes
 * @property {number[]} workDays                         // ISO day numbers; default [1..5]
 * @property {string} sprintAnchorDate                   // ISO date
 * @property {string} timezone                           // IANA TZ string
 * @property {'2x2h' | '4x1h'} deepSlicePreference
 * @property {string} createdAt                          // ISO timestamp
 */
export const User = null;

// ---------------------------------------------------------------------------
// 2.4 Composition
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Composition
 * @property {string} id
 * @property {string} userId
 * @property {CycleType} cycleType
 * @property {string} startAt                            // ISO timestamp (inclusive)
 * @property {string} endAt                              // ISO timestamp (exclusive)
 * @property {string|null} parentCompositionId
 * @property {CompositionState} state
 * @property {string} proposedAt
 * @property {string|null} decidedAt
 * @property {string|null} closedAt
 * @property {ComposerInputsSnapshot} composerInputsSnapshot
 * @property {InvariantChecks} invariantChecks
 * @property {string} date                                   // ISO date 'YYYY-MM-DD' — the working day this composition plans for
 */
export const Composition = null;

// ---------------------------------------------------------------------------
// Sprint 9 — WeeklyComposition (5-day envelope around 5 Composition days)
// ---------------------------------------------------------------------------

/**
 * WeeklyComposition — a Monday–Friday envelope around 5 Compositions.
 *
 * Produced by the pure `composeWeekly()` composer (Pass 9b) and wrapped for
 * persistence/events by `WeeklyComposerService` (Pass 9c). The 5 `days`
 * entries are Composition-shaped objects (same fields composeDaily
 * produces, including `activities`) so downstream accept/reject flows
 * work unchanged once they're persisted via ComposerService.
 *
 * @typedef {object} WeeklyComposition
 * @property {string} id
 * @property {string} userId
 * @property {string} weekStart                 // Monday ISO date (YYYY-MM-DD)
 * @property {string} weekEnd                   // Friday ISO date (YYYY-MM-DD)
 * @property {WeeklyCompositionStatus} state
 * @property {string} proposedAt                // ISO timestamp
 * @property {string|null} decidedAt
 * @property {Composition[]} days               // length 5 (Mon..Fri)
 * @property {object} composerInputsSnapshot    // frozen-in composer inputs
 * @property {number} version
 */
export const WeeklyComposition = null;

// ---------------------------------------------------------------------------
// 2.5 ScheduledActivity
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ScheduledActivity
 * @property {string} id
 * @property {string} compositionId
 * @property {string} catalogEntryId
 * @property {Bucket} bucket                             // frozen at schedule time
 * @property {string} plannedStartAt
 * @property {number} plannedDurationMinutes
 * @property {string|null} actualStartAt
 * @property {string|null} actualEndAt
 * @property {string} intention                          // declared outcome (fka "Intentions")
 * @property {ScheduledActivityState} state
 * @property {OutputArtifactRef|null} outputArtifactRef
 * @property {string|null} reflectionId
 * @property {string|null} linkedKaizenId
 * @property {{kaizenId: string, catalogEntryId: string}|null} linkedDmaicStepRef
 * @property {string|null} linkedPdcaExperimentId
 * @property {ReasonCode|null} reasonCodeIfSkipped
 * @property {SourceOfSchedule} sourceOfSchedule
 * @property {string} createdAt
 * @property {string} updatedAt
 */
export const ScheduledActivity = null;

// ---------------------------------------------------------------------------
// 2.6 Reflection
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Reflection
 * @property {string} id
 * @property {string} scheduledActivityId                // required
 * @property {string} userId
 * @property {boolean} pending                           // auto-stubbed true at close; flips false on capture
 * @property {string|null} capturedAt
 * @property {number} planVsActualMinutes
 * @property {string|null} whatWentWell
 * @property {string|null} whatToImprove
 * @property {boolean} frictionFlag
 * @property {string|null} frictionSignalId
 * @property {ReflectionKind} kind
 * @property {{define: string, measure: string, analyze: string, improveSuggested: string}|null} dmaicDraft
 */
export const Reflection = null;

// ---------------------------------------------------------------------------
// 2.7 Variance (append-only)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Variance
 * @property {string} id
 * @property {string} scheduledActivityId
 * @property {string} compositionId
 * @property {string} catalogEntryId
 * @property {string} userId
 * @property {VarianceKind} kind
 * @property {ReasonCode} reasonCode
 * @property {string|null} note
 * @property {string} loggedAt
 */
export const Variance = null;

// ---------------------------------------------------------------------------
// 2.8 FrictionSignal
// ---------------------------------------------------------------------------

/**
 * @typedef {object} FrictionSignal
 * @property {string} id
 * @property {string} reflectionId
 * @property {string} scheduledActivityId
 * @property {string} userId
 * @property {string} summary                            // ≤ 140 chars
 * @property {FrictionTag|null} tag
 * @property {FrictionStatus} status
 * @property {string|null} kaizenId
 * @property {string} capturedAt
 */
export const FrictionSignal = null;

// ---------------------------------------------------------------------------
// 2.9 Kaizen (+ E1-T10 Accelerator fields)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Kaizen
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} problemStatement
 * @property {string} goalStatement                      // Baseline X → target Y by Z
 * @property {string[]} sourceFrictionSignalIds
 * @property {string} baselineMetricId
 * @property {string|null} remeasurementId
 * @property {KaizenAction[]} actions
 * @property {KaizenState} state
 * @property {string} openedAt
 * @property {string|null} closedAt
 * @property {CloseKind|null} closeKind
 * @property {object|null} resultsNarrativeRef
 *
 * // ---- E1-T10 / §2.9 Accelerator project-type fields ----
 * @property {ProjectType} projectType                   // default 'AD_HOC' on legacy migration
 * @property {string|null} phase                         // 'PHASE_0'..'PHASE_4' for Accelerator; 'PRE_EVENT'|'EVENT'|'POST_EVENT'|'SUSTAIN' for Kaizen 90; null otherwise
 * @property {ProjectPhaseDefinition[]|null} phaseDefinitions
 * @property {number|null} implementationCostDollars
 * @property {number|null} annualBenefitsDollars
 * @property {string} startDate                          // ISO date; required on create
 * @property {object|null} controlPlanArtifactRef        // signed Control Plan output artifact ref
 *
 * // ---- v0.5: folded from ACCELERATOR / DMAIC / KAIZEN_EVENT_90D standards ----
 * @property {object|null} controlPlanDraftArtifactRef   // Accelerator: Phase 2 draft output of 30d_2_5. DMAIC: Improve-phase draft. Null for other types.
 * @property {string|null} implementationLeadUserId      // FK User. Required non-null for projectType='KAIZEN_EVENT_90D'. Null otherwise.
 * @property {number|null} roiPassNumber                 // DMAIC two-pass: 1 (projected at Improve) or 2 (actual at Control). Null for single-pass types.
 * @property {object[]|null} roiProjections              // DMAIC audit trail: [{passNumber, implementationCostDollars, annualBenefitsDollars, confidenceTier, financePartnerUserId, capturedAt}]. Null for single-pass.
 * @property {object|null} validatedRootCauseArtifactRef // DMAIC: {schema, value, confoundCheckPassed, validatedBy, validatedAt}. Required before Analyze→Improve.
 * @property {object[]|null} sustainmentCheckIns         // Post-CLOSED 30/60/90 day check-ins: [{dueDate, kind, completedAt, observedMetricValue, adherenceOk, notes}]. Null for FAILED_HONEST / abandoned.
 * @property {boolean|null} sustainmentGatePassed        // Kaizen 90: Facilitator attestation at Day 70 (adoption ≥80% × 2 consecutive weeks, no rollbacks). Required true before ACTIVE→IN_REMEASUREMENT for KAIZEN_EVENT_90D.
 * @property {object[]} scopeChanges                     // Append-only audit log: [{changeRequestedAt, reason, impactAssessment, approved, approvedBy, approvedAt}]. Populated from ScopeChangeRequested events.
 *
 * // ---- v0.6: folded from ADHOC_PDCA_STANDARD v1.0 ----
 * @property {string|null} targetCloseDate               // ISO date. Required non-null for projectType='AD_HOC'. Drives ProjectPaceWarning(kind='AD_HOC_OVERRUN') emission.
 * @property {string|null} sourcePdcaExperimentId        // FK PdcaExperiment. Set when promoted from PDCA via closedReason='SUPERSEDED_BY_KAIZEN'. Distinct from sourceFrictionSignalIds.
 *
 * // ---- Sprint 7: folded from Portfolio intake (P0-T3 + P1-T2) ----
 * @property {string|null} sourceOpportunityId           // FK Opportunity. Set when promoted from the Portfolio intake funnel via OpportunityService.promote(). Distinct from sourceFrictionSignalIds / sourcePdcaExperimentId.
 *
 * // ---- Sprint 8: HARD RULE close loop ----
 * @property {string|null} lessonsLearned                // Required at close(), min 20 chars. Enforces learning capture per CATALOG_GAPS §H.2.
 * @property {MetricDirection} [metricDirection]         // Sign convention for beatsBaseline computation. Default 'higher_is_better'.
 * @property {number|null} [targetImprovement]           // Optional absolute delta target. When set, closeKind=SUCCESS requires |deltaAbsolute| >= |targetImprovement|.
 * @property {boolean} [abandoned]                       // DRAFT-only terminal flag. Set by abandon(). Once true, locked (cannot un-abandon or promote/edit).
 * @property {string|null} [abandonedAt]                 // ISO timestamp when abandoned=true.
 * @property {string|null} [abandonReason]               // Reason string captured at abandon time. Min 10 chars.
 *
 * // ---- Sprint 11 P1-T1: richer intake context copied from Opportunity ----
 * @property {string|null} [currentState]                // optional, 10-500 chars when provided; copied from Opportunity at promote.
 * @property {string|null} [desiredState]                // optional, 10-500 chars when provided; copied from Opportunity at promote.
 * @property {string|null} [primaryStakeholder]          // optional, 3-120 chars when provided; copied from Opportunity at promote.
 */
export const Kaizen = null;

// ---------------------------------------------------------------------------
// 2.10 BaselineMetric
// ---------------------------------------------------------------------------

/**
 * @typedef {object} BaselineMetric
 * @property {string} id
 * @property {string} kaizenId
 * @property {MetricDefinition} metricDefinition
 * @property {number} value
 * @property {string} capturedAt
 * @property {object|null} capturedSampleRef
 * @property {boolean} locked
 */
export const BaselineMetric = null;

// ---------------------------------------------------------------------------
// 2.11 Remeasurement
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Remeasurement
 * @property {string} id
 * @property {string} kaizenId
 * @property {string} metricDefinitionId                 // must match baseline metric identity
 * @property {number} value
 * @property {number} deltaAbsolute                      // value − baseline.value
 * @property {number} deltaPercent
 * @property {boolean} beatsBaseline
 * @property {string} capturedAt
 * @property {object|null} evidenceRef
 */
export const Remeasurement = null;

// ---------------------------------------------------------------------------
// 2.12 MetricsSnapshot
// ---------------------------------------------------------------------------

/**
 * @typedef {object} MetricsSnapshot
 * @property {string} id
 * @property {string} userId
 * @property {string} windowStart
 * @property {string} windowEnd
 * @property {number} adherencePercent
 * @property {number} compositionAcceptanceDaily
 * @property {number} compositionAcceptanceWeekly
 * @property {number} reflectionRatePercent
 * @property {number|null} activeKaizenDeltaPercent
 * @property {string} computedAt
 */
export const MetricsSnapshot = null;

// ---------------------------------------------------------------------------
// 2.13 PdcaExperiment
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PdcaExperiment
 * @property {string} id
 * @property {string} userId
 * @property {string} hypothesis
 * @property {string} targetMetricName
 * @property {string} targetMetricUnit
 * @property {number} currentConditionBaseline
 * @property {number} targetCondition
 * @property {PdcaState} state
 * @property {string[]} tickActivityIds                  // append-only
 * @property {number} consecutiveTargetHits
 * @property {string} openedAt
 * @property {string|null} closedAt
 * @property {PdcaClosedReason|null} closedReason
 */
export const PdcaExperiment = null;

// ---------------------------------------------------------------------------
// 2.14 Opportunity (Sprint 7 — Project Portfolio intake)
// ---------------------------------------------------------------------------

/**
 * A captured improvement opportunity. Lives in the Portfolio intake funnel
 * and either gets PROMOTED to a Kaizen (DRAFT), DEFERRED for later, or
 * REJECTED with a reason. Terminal statuses are immutable except for
 * `updatedAt`.
 *
 * @typedef {object} Opportunity
 * @property {string} id
 * @property {string} userId
 * @property {string} title                     // 3-80 chars, required
 * @property {string} problemStatement          // 10-500 chars, required
 * @property {string|null} scope                // 0-300 chars, optional
 * @property {ProjectType} proposedProjectType
 * @property {OpportunityStatus} status
 * @property {string|null} promotedKaizenId     // FK Kaizen set when status=PROMOTED
 * @property {string|null} deferredUntil        // ISO date; set when status=DEFERRED
 * @property {string|null} rejectionReason      // set when status=REJECTED, min 5 chars
 * @property {string} createdAt                 // ISO timestamp
 * @property {string} updatedAt                 // ISO timestamp
 *
 * // ---- Sprint 11 P1-T1: richer intake fields ----
 * @property {string|null} [currentState]       // optional, 10-500 chars when provided
 * @property {string|null} [desiredState]       // optional, 10-500 chars when provided
 * @property {string|null} [primaryStakeholder] // optional, 3-120 chars when provided
 */
export const Opportunity = null;

// ---------------------------------------------------------------------------
// 4.7 InfeasibleResult (supporting type for composer — kept for Sprint 2 use)
// ---------------------------------------------------------------------------

/**
 * Entries the composer returns when capacity is oversubscribed. Full resolution
 * flow in ARCHITECTURE §4.7 and ENGINE_DESIGN §1.8. Sprint 1 exports the shape
 * so Sprint 2's composer can plug in.
 *
 * @typedef {object} SuggestedActionRaiseCapacity
 * @property {'RAISE_CAPACITY'} kind
 * @property {number} currentMinutes
 * @property {number} suggestedMinutes
 *
 * @typedef {object} SuggestedActionReduceExternal
 * @property {'REDUCE_EXTERNAL'} kind
 * @property {number} currentExternalMinutes
 * @property {number} suggestedExternalMinutes
 *
 * @typedef {object} SuggestedActionSkipCeremony
 * @property {'SKIP_CEREMONY_WITH_REASON'} kind
 * @property {string} catalogEntryId
 * @property {string} ceremonyName
 * @property {ReasonCode} defaultReasonCode
 *
 * @typedef {object} SuggestedActionDeferNonOptional
 * @property {'DEFER_NON_OPTIONAL_TO_NEXT_DAY'} kind
 * @property {string} catalogEntryId
 * @property {string} rationale
 *
 * @typedef {SuggestedActionRaiseCapacity
 *         | SuggestedActionReduceExternal
 *         | SuggestedActionSkipCeremony
 *         | SuggestedActionDeferNonOptional} SuggestedAction
 *
 * @typedef {object} InfeasibleResult
 * @property {'INFEASIBLE'} kind
 * @property {number} totalRequiredMinutes
 * @property {number} capacityMinutes
 * @property {number} shortfallMinutes
 * @property {{PROJECT: number, COMMUNICATION: number, CI: number}} bucketShortfalls
 * @property {SuggestedAction[]} suggestedActions
 * @property {string[]} explain
 */
export const InfeasibleResult = null;

// ---------------------------------------------------------------------------
// Introspection — the full entity name list, for tests
// ---------------------------------------------------------------------------

/**
 * Every entity typedef this module exports. Ordered by §2.x.
 * Tests import this to grep-verify completeness.
 */
export const ENTITIES = Object.freeze([
  'CatalogEntry',
  'User',
  'Composition',
  'ScheduledActivity',
  'Reflection',
  'Variance',
  'FrictionSignal',
  'Kaizen',
  'BaselineMetric',
  'Remeasurement',
  'MetricsSnapshot',
  'PdcaExperiment',
  'ProjectPhaseDefinition',
  'Opportunity',
  'InfeasibleResult'
]);

/**
 * Every enum this module exports. Useful for introspection and tests.
 */
export const ENUMS = Object.freeze({
  ProjectType,
  FocusArea,
  Cadence,
  Bucket,
  CycleType,
  CompositionState,
  WeeklyCompositionStatus,
  ScheduledActivityState,
  ReasonCode,
  SourceOfSchedule,
  ArtifactSchema,
  VarianceKind,
  FrictionTag,
  FrictionStatus,
  KaizenState,
  CloseKind,
  MetricDirection,
  ReflectionKind,
  PdcaState,
  PdcaClosedReason,
  OpportunityStatus
});
