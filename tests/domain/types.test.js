/**
 * Tests for /js/domain/types.js (E1-T1 + E1-T10).
 *
 * JSDoc typedefs aren't reflected at runtime, so the contract we can assert
 * is:
 *  - every entity in ARCHITECTURE §2 is listed in `ENTITIES`.
 *  - enums have exactly the spec-declared values.
 *  - the module source contains every required field name on every entity
 *    (grep-level check, per DELIVERY_PLAN §4 Sprint 1 mid-sprint demo item 4).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  ENTITIES,
  ENUMS,
  ProjectType,
  FocusArea,
  Cadence,
  Bucket,
  CycleType,
  CompositionState,
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
} from '../../js/domain/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const typesSource = readFileSync(
  resolve(here, '..', '..', 'js', 'domain', 'types.js'),
  'utf8'
);

describe('types.js — entity introspection', () => {
  test('exports the 15 ENTITIES named in ARCHITECTURE §2 + supporting types', () => {
    // 12 §2 entities + ProjectPhaseDefinition + Opportunity (Sprint 7) + InfeasibleResult = 15.
    assert.equal(ENTITIES.length, 15);
    for (const name of [
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
    ]) {
      assert.ok(ENTITIES.includes(name), `ENTITIES missing ${name}`);
    }
  });

  test('ENUMS contains every enum this module exports', () => {
    for (const k of [
      'ProjectType',
      'FocusArea',
      'Cadence',
      'Bucket',
      'CycleType',
      'CompositionState',
      'ScheduledActivityState',
      'ReasonCode',
      'SourceOfSchedule',
      'ArtifactSchema',
      'VarianceKind',
      'FrictionTag',
      'FrictionStatus',
      'KaizenState',
      'CloseKind',
      'MetricDirection',
      'ReflectionKind',
      'PdcaState',
      'PdcaClosedReason',
      'OpportunityStatus'
    ]) {
      assert.ok(ENUMS[k], `ENUMS missing ${k}`);
    }
  });
});

describe('types.js — enum values', () => {
  test('ProjectType has exactly the five spec values (v0.5: KAIZEN_EVENT_90D added)', () => {
    assert.deepEqual(Object.values(ProjectType).sort(), [
      'AD_HOC',
      'DMAIC',
      'KAIZEN_ACCELERATOR_30D',
      'KAIZEN_EVENT',
      'KAIZEN_EVENT_90D'
    ]);
  });

  test('FocusArea contains all 8 spec values', () => {
    const vals = Object.values(FocusArea);
    for (const v of [
      'DEEP_WORK',
      'COMMUNICATION',
      'CONTINUOUS_IMPROVEMENT',
      'CEREMONY',
      'DMAIC',
      'KAIZEN',
      'INNOVATION',
      'KAIZEN_ACCELERATOR_30D'
    ]) {
      assert.ok(vals.includes(v), `FocusArea missing ${v}`);
    }
  });

  test('Cadence contains all 9 spec values', () => {
    const vals = Object.values(Cadence);
    for (const v of [
      'DAILY',
      'WEEKLY',
      'SPRINT',
      'MONTHLY',
      'QUARTERLY',
      'CONTINUOUS',
      'ON_SIGNAL',
      'EVENT_DRIVEN',
      'EVERY_48H'
    ]) {
      assert.ok(vals.includes(v), `Cadence missing ${v}`);
    }
  });

  test('Bucket is the 4-2-2 triple', () => {
    assert.deepEqual(Object.values(Bucket).sort(), ['CI', 'COMMUNICATION', 'PROJECT']);
  });

  test('CycleType covers DAILY / WEEKLY / SPRINT / MONTHLY', () => {
    assert.deepEqual(Object.values(CycleType).sort(), [
      'DAILY',
      'MONTHLY',
      'SPRINT',
      'WEEKLY'
    ]);
  });

  test('CompositionState lists every §3.1 FSM state', () => {
    for (const v of [
      'PROPOSED',
      'ACCEPTED',
      'EDITED',
      'REJECTED',
      'ACTIVE',
      'CLOSED'
    ]) {
      assert.ok(Object.values(CompositionState).includes(v));
    }
  });

  test('ScheduledActivityState lists every §3.2 FSM state', () => {
    for (const v of [
      'PROPOSED',
      'SCHEDULED',
      'DROPPED',
      'IN_PROGRESS',
      'CLOSED',
      'SKIPPED'
    ]) {
      assert.ok(Object.values(ScheduledActivityState).includes(v));
    }
  });

  test('ReasonCode lists the 6 spec values', () => {
    assert.deepEqual(Object.values(ReasonCode).sort(), [
      'BLOCKED',
      'DEPRIORITIZED',
      'ESCALATION',
      'MEETING_CONFLICT',
      'OTHER',
      'SICK'
    ]);
  });

  test('SourceOfSchedule covers the 3 composer tag values', () => {
    assert.deepEqual(Object.values(SourceOfSchedule).sort(), [
      'COMPOSER_AUTO',
      'USER_ADD',
      'USER_EDIT'
    ]);
  });

  test('ArtifactSchema covers the 5 blueprint artifact shapes', () => {
    assert.deepEqual(Object.values(ArtifactSchema).sort(), [
      'CHART',
      'DOCUMENT',
      'NUMERIC',
      'TEXT',
      'TWO_LIST'
    ]);
  });

  test('VarianceKind covers the 5 kinds', () => {
    assert.deepEqual(Object.values(VarianceKind).sort(), [
      'EDITED_FROM_PROPOSAL',
      'OVERRAN',
      'RESCHEDULED',
      'SKIPPED_NON_OPTIONAL',
      'UNDERRAN'
    ]);
  });

  test('FrictionTag + FrictionStatus + KaizenState + CloseKind + ReflectionKind + PdcaState + PdcaClosedReason are all populated', () => {
    assert.ok(Object.keys(FrictionTag).length >= 6);
    assert.ok(Object.keys(FrictionStatus).length >= 4);
    assert.ok(Object.keys(KaizenState).length >= 4);
    assert.ok(Object.keys(CloseKind).length >= 3);
    assert.ok(Object.keys(ReflectionKind).length >= 2);
    assert.ok(Object.keys(PdcaState).length >= 5);
    assert.ok(Object.keys(PdcaClosedReason).length >= 3);
  });

  test('MetricDirection covers higher/lower_is_better (Sprint 8)', () => {
    assert.deepEqual(Object.values(MetricDirection).sort(), [
      'higher_is_better',
      'lower_is_better'
    ]);
  });

  test('OpportunityStatus covers the 5 funnel states', () => {
    assert.deepEqual(Object.values(OpportunityStatus).sort(), [
      'DEFERRED',
      'INTAKE',
      'PROMOTED',
      'REJECTED',
      'SCORED'
    ]);
  });

  test('every enum is frozen (immutable)', () => {
    for (const enumName of Object.keys(ENUMS)) {
      assert.ok(Object.isFrozen(ENUMS[enumName]), `${enumName} not frozen`);
    }
  });
});

/**
 * Grep-level verification. For every entity, enumerate the fields the
 * ARCHITECTURE spec names on the entity and assert the field name appears
 * in the types.js source somewhere. This catches typos and
 * accidentally-dropped fields without requiring runtime type reflection.
 *
 * Field lists are transcribed from ARCHITECTURE.md §2.2–§2.13. If a field
 * disappears from the spec, the test + the source drift together.
 */
describe('types.js — required fields appear in source', () => {
  /** @type {Record<string, string[]>} */
  const ENTITY_FIELDS = {
    CatalogEntry: [
      'id',
      'activityNumber',
      'name',
      'focusArea',
      'defaultDurationMinutes',
      'cadence',
      'trigger',
      'inputs',
      'outputArtifact',
      'participants',
      'procedure',
      'bucket',
      'isNonOptional',
      'appliesToRoles',
      'enabledByUser',
      'version',
      'sourceRef',
      'dependsOn',
      'projectTypeBinding',
      'phaseBinding'
    ],
    User: [
      'id',
      'name',
      'email',
      'role',
      'dailyCapacityMinutes',
      'workDays',
      'sprintAnchorDate',
      'timezone',
      'deepSlicePreference',
      'createdAt'
    ],
    Composition: [
      'id',
      'userId',
      'cycleType',
      'startAt',
      'endAt',
      'parentCompositionId',
      'state',
      'proposedAt',
      'decidedAt',
      'closedAt',
      'composerInputsSnapshot',
      'invariantChecks'
    ],
    ScheduledActivity: [
      'id',
      'compositionId',
      'catalogEntryId',
      'bucket',
      'plannedStartAt',
      'plannedDurationMinutes',
      'actualStartAt',
      'actualEndAt',
      'intention',
      'state',
      'outputArtifactRef',
      'reflectionId',
      'linkedKaizenId',
      'linkedDmaicStepRef',
      'linkedPdcaExperimentId',
      'reasonCodeIfSkipped',
      'sourceOfSchedule',
      'createdAt',
      'updatedAt'
    ],
    Reflection: [
      'id',
      'scheduledActivityId',
      'userId',
      'pending',
      'capturedAt',
      'planVsActualMinutes',
      'whatWentWell',
      'whatToImprove',
      'frictionFlag',
      'frictionSignalId',
      'kind',
      'dmaicDraft'
    ],
    Variance: [
      'id',
      'scheduledActivityId',
      'compositionId',
      'catalogEntryId',
      'userId',
      'kind',
      'reasonCode',
      'note',
      'loggedAt'
    ],
    FrictionSignal: [
      'id',
      'reflectionId',
      'scheduledActivityId',
      'userId',
      'summary',
      'tag',
      'status',
      'kaizenId',
      'capturedAt'
    ],
    Kaizen: [
      'id',
      'userId',
      'title',
      'problemStatement',
      'goalStatement',
      'sourceFrictionSignalIds',
      'baselineMetricId',
      'remeasurementId',
      'actions',
      'state',
      'openedAt',
      'closedAt',
      'closeKind',
      'resultsNarrativeRef',
      // E1-T10 Accelerator fields
      'projectType',
      'phase',
      'phaseDefinitions',
      'implementationCostDollars',
      'annualBenefitsDollars',
      'startDate',
      'controlPlanArtifactRef',
      // v0.5 fields folded from operating standards
      'controlPlanDraftArtifactRef',
      'implementationLeadUserId',
      'roiPassNumber',
      'roiProjections',
      'validatedRootCauseArtifactRef',
      'sustainmentCheckIns',
      'sustainmentGatePassed',
      'scopeChanges',
      // v0.6 fields from ADHOC_PDCA_STANDARD
      'targetCloseDate',
      'sourcePdcaExperimentId',
      // Sprint 7 fields from Portfolio intake
      'sourceOpportunityId',
      // Sprint 8 fields for HARD RULE close loop
      'lessonsLearned',
      'metricDirection',
      'targetImprovement',
      'abandoned',
      'abandonedAt',
      'abandonReason'
    ],
    BaselineMetric: [
      'id',
      'kaizenId',
      'metricDefinition',
      'value',
      'capturedAt',
      'capturedSampleRef',
      'locked'
    ],
    Remeasurement: [
      'id',
      'kaizenId',
      'metricDefinitionId',
      'value',
      'deltaAbsolute',
      'deltaPercent',
      'beatsBaseline',
      'capturedAt',
      'evidenceRef'
    ],
    MetricsSnapshot: [
      'id',
      'userId',
      'windowStart',
      'windowEnd',
      'adherencePercent',
      'compositionAcceptanceDaily',
      'compositionAcceptanceWeekly',
      'reflectionRatePercent',
      'activeKaizenDeltaPercent',
      'computedAt'
    ],
    PdcaExperiment: [
      'id',
      'userId',
      'hypothesis',
      'targetMetricName',
      'targetMetricUnit',
      'currentConditionBaseline',
      'targetCondition',
      'state',
      'tickActivityIds',
      'consecutiveTargetHits',
      'openedAt',
      'closedAt',
      'closedReason'
    ],
    ProjectPhaseDefinition: ['id', 'name', 'days', 'nonOptionalCatalogEntryIds'],
    Opportunity: [
      'id',
      'userId',
      'title',
      'problemStatement',
      'scope',
      'proposedProjectType',
      'status',
      'promotedKaizenId',
      'deferredUntil',
      'rejectionReason',
      'createdAt',
      'updatedAt'
    ],
    InfeasibleResult: [
      'kind',
      'totalRequiredMinutes',
      'capacityMinutes',
      'shortfallMinutes',
      'bucketShortfalls',
      'suggestedActions',
      'explain'
    ]
  };

  for (const [entity, fields] of Object.entries(ENTITY_FIELDS)) {
    test(`${entity}: every spec field name appears in types.js source`, () => {
      for (const field of fields) {
        // Match either `@property {…} fieldName` or `fieldName:` (literal shapes).
        const pattern = new RegExp(`\\b${field}\\b`);
        assert.ok(
          pattern.test(typesSource),
          `${entity}.${field} missing from types.js source`
        );
      }
    });
  }

  test('Reflection typedef includes the `pending` boolean', () => {
    assert.match(typesSource, /@property\s+\{boolean\}\s+pending/);
  });
});
