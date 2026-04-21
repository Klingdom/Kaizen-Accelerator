/**
 * Golden-day test fixture — ENGINE_DESIGN §1.9 worked example.
 *
 * Sprint 2 uses this fixture to prove that composeDaily's STEPS 1–3 land
 * the correct bucket targets and the correct non-optional placements.
 * Sprint 3 will extend the same fixture to the full 10-row composition.
 *
 * Input per §1.9:
 *   - Practitioner role
 *   - dailyCapacityMinutes = 480
 *   - Tuesday 2026-04-21 (Execution Wk1)
 *   - externalMinutesToday = 60
 *   - activeKaizen: DMAIC project k_reduce_cycle_time, next DMAIC step = #34
 *   - varianceQueue: [#1 Personal L&D skipped yesterday, 60 min, CI]
 *   - signals: all false/empty
 *
 * Expected §1.9 outputs:
 *   - PROJECT target 240 min
 *   - COMMUNICATION target 60 min   (floor clamp after 120 − 60)
 *   - CI target 120 min
 */

export const GOLDEN_USER = Object.freeze({
  id: 'user_phil_mvp',
  name: 'Phil',
  email: 'phil@mediafier.ai',
  role: ['PRACTITIONER'],
  dailyCapacityMinutes: 480,
  workDays: [1, 2, 3, 4, 5],
  sprintAnchorDate: '2026-04-20',
  timezone: 'America/Los_Angeles',
  deepSlicePreference: '2x2h',
  createdAt: '2026-04-01T00:00:00Z'
});

export const GOLDEN_DATE = '2026-04-21';
export const GOLDEN_EXTERNAL_MIN = 60;
export const GOLDEN_SPRINT_PHASE = 'EXECUTION';

export const GOLDEN_ACTIVE_KAIZEN = Object.freeze({
  id: 'k_reduce_cycle_time',
  title: 'Reduce cycle time DMAIC',
  state: 'ACTIVE',
  projectType: 'AD_HOC',
  phase: null,
  nextStepActivityNumber: 34
});

/**
 * Minimal catalog entries the composer resolves from during Sprint-2
 * steps 1–3. Full-seed catalog is also accepted; this minimal set is
 * convenient for fast test assertions.
 */
export const GOLDEN_MIN_CATALOG = Object.freeze([
  {
    id: 'cat_1_personal_learning_and_development_l_d_tracker',
    activityNumber: 1,
    name: 'Personal Learning and Development (L&D Tracker)',
    focusArea: 'CONTINUOUS_IMPROVEMENT',
    defaultDurationMinutes: 60, // shrunk from 120 to fit CI budget on rescue
    cadence: 'CONTINUOUS',
    trigger: 'Own development goal active',
    inputs: [],
    outputArtifact: { name: '1 Pager', schema: 'DOCUMENT', required: true },
    participants: ['Self'],
    procedure: [],
    bucket: 'CI',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  }
]);

export const GOLDEN_VARIANCE_QUEUE = Object.freeze([
  {
    id: 'v_mon_skip_ld',
    scheduledActivityId: 'sa_mon_ld',
    compositionId: 'comp_mon',
    catalogEntryId: 'cat_1_personal_learning_and_development_l_d_tracker',
    userId: GOLDEN_USER.id,
    kind: 'SKIPPED_NON_OPTIONAL',
    reasonCode: 'MEETING_CONFLICT',
    note: null,
    loggedAt: '2026-04-20T17:30:00Z'
  }
]);

/**
 * The expected §1.9 targets.
 */
export const GOLDEN_EXPECTED_TARGETS = Object.freeze({
  PROJECT: 240,
  COMMUNICATION: 60,
  CI: 120
});

/**
 * Build a ready-to-feed ComposerInput for Sprint-2 composeDaily tests.
 *
 * @param {{catalog?: object[]}} [overrides]
 * @returns {object}
 */
export function buildGoldenComposerInput(overrides = {}) {
  return {
    cycleType: 'DAILY',
    userId: GOLDEN_USER.id,
    date: GOLDEN_DATE,
    role: [...GOLDEN_USER.role],
    dailyCapacityMinutes: GOLDEN_USER.dailyCapacityMinutes,
    externalMinutesToday: GOLDEN_EXTERNAL_MIN,
    sprintPhase: GOLDEN_SPRINT_PHASE,
    activeKaizen: { ...GOLDEN_ACTIVE_KAIZEN },
    varianceQueue: GOLDEN_VARIANCE_QUEUE.map((v) => ({ ...v })),
    catalog: overrides.catalog ?? GOLDEN_MIN_CATALOG.map((c) => ({ ...c })),
    priorCompositions: [],
    signals: {
      inboxOverThreshold: false,
      documentAwaitingReview: [],
      innovationStageReady: []
    }
  };
}

export default {
  GOLDEN_USER,
  GOLDEN_DATE,
  GOLDEN_EXTERNAL_MIN,
  GOLDEN_ACTIVE_KAIZEN,
  GOLDEN_MIN_CATALOG,
  GOLDEN_VARIANCE_QUEUE,
  GOLDEN_EXPECTED_TARGETS,
  buildGoldenComposerInput
};
