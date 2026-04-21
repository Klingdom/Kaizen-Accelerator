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

/**
 * Sprint-3 full catalog fixture — extended set used for the §1.9 end-to-end
 * test. Includes:
 *   - #1 L&D (for the varianceQueue rescue)
 *   - #12 PDCA (eligible for CI rotation priority 80 if pdcaExperiment set)
 *   - #15 Team meetings (COMM filler candidate)
 *   - #16 1:1 (COMM filler — Wed/Thu)
 *   - #34 DMAIC Cause & Effect Matrix (Deep payload, linked to activeKaizen)
 *   - gen_deep_work_project, gen_value_added_communication,
 *     gen_end_of_activity_reflection (§H.2 generics)
 */
export const GOLDEN_FULL_CATALOG = Object.freeze([
  ...GOLDEN_MIN_CATALOG,
  {
    id: 'cat_12_pdca_cycle',
    activityNumber: 12,
    name: 'PDCA Cycle',
    focusArea: 'CONTINUOUS_IMPROVEMENT',
    defaultDurationMinutes: 30,
    cadence: 'EVERY_48H',
    trigger: '48h micro-cycle',
    inputs: [],
    outputArtifact: { name: 'Current-condition measurement', schema: 'NUMERIC', required: true },
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
  },
  {
    id: 'cat_15_high_value_team_meetings',
    activityNumber: 15,
    name: 'High-value team meetings',
    focusArea: 'COMMUNICATION',
    defaultDurationMinutes: 45,
    cadence: 'WEEKLY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: 'Meeting notes', schema: 'TEXT', required: true },
    participants: ['Team'],
    procedure: [],
    bucket: 'COMMUNICATION',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  },
  {
    id: 'cat_16_connecting_w_teammates',
    activityNumber: 16,
    name: 'Connecting w/ teammates',
    focusArea: 'COMMUNICATION',
    defaultDurationMinutes: 20,
    cadence: 'WEEKLY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: '1:1 notes', schema: 'TEXT', required: true },
    participants: ['Self', 'Teammate'],
    procedure: [],
    bucket: 'COMMUNICATION',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  },
  {
    id: 'cat_34_cause_and_effect_matrix',
    activityNumber: 34,
    name: 'Cause & Effect Matrix',
    focusArea: 'DMAIC',
    defaultDurationMinutes: 120,
    cadence: 'EVENT_DRIVEN',
    trigger: 'DMAIC sprint Analyze phase',
    inputs: [],
    outputArtifact: { name: 'C&E Matrix', schema: 'DOCUMENT', required: true },
    participants: ['Team'],
    procedure: [],
    bucket: 'PROJECT',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: 'DMAIC',
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  },
  {
    id: 'gen_deep_work_project',
    activityNumber: null,
    name: 'Deep Work — Project Task (generic)',
    focusArea: 'DEEP_WORK',
    defaultDurationMinutes: 240,
    cadence: 'DAILY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: 'Deep Work Output', schema: 'TEXT', required: true },
    participants: ['Self'],
    procedure: [],
    bucket: 'PROJECT',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  },
  {
    id: 'gen_value_added_communication',
    activityNumber: null,
    name: 'Value-Added Communication (generic)',
    focusArea: 'COMMUNICATION',
    defaultDurationMinutes: 60,
    cadence: 'DAILY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: 'Comm Outcome Note', schema: 'TEXT', required: true },
    participants: ['Self'],
    procedure: [],
    bucket: 'COMMUNICATION',
    isNonOptional: false,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'fixture:goldenDay'
  },
  {
    id: 'gen_end_of_activity_reflection',
    activityNumber: null,
    name: 'End-of-Activity Reflection',
    focusArea: 'CONTINUOUS_IMPROVEMENT',
    defaultDurationMinutes: 15,
    cadence: 'DAILY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: 'End-of-Activity Reflection', schema: 'TWO_LIST', required: true },
    participants: ['Self'],
    procedure: [],
    bucket: 'CI',
    isNonOptional: true,
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
    sprintAnchorDate: GOLDEN_USER.sprintAnchorDate,
    user: { deepSlicePreference: GOLDEN_USER.deepSlicePreference, sprintAnchorDate: GOLDEN_USER.sprintAnchorDate },
    activeKaizen: {
      ...GOLDEN_ACTIVE_KAIZEN,
      projectType: overrides.activeKaizenProjectType ?? 'DMAIC'
    },
    varianceQueue: GOLDEN_VARIANCE_QUEUE.map((v) => ({ ...v })),
    catalog: overrides.catalog ?? GOLDEN_MIN_CATALOG.map((c) => ({ ...c })),
    priorCompositions: [],
    signals: {
      inboxOverThreshold: false,
      documentAwaitingReview: [],
      innovationStageReady: []
    },
    // §1.9 narrative: PDCA experiment is active with last tick > 42h ago,
    // so the CI rotation picks #12 PDCA at priority 80.
    pdcaExperiment: overrides.pdcaExperiment ?? {
      id: 'pdca_mon',
      state: 'DO',
      lastTickAt: '2026-04-19T10:00:00Z'
    },
    _now: overrides._now ?? '2026-04-21T12:00:00Z'
  };
}

export default {
  GOLDEN_USER,
  GOLDEN_DATE,
  GOLDEN_EXTERNAL_MIN,
  GOLDEN_ACTIVE_KAIZEN,
  GOLDEN_MIN_CATALOG,
  GOLDEN_FULL_CATALOG,
  GOLDEN_VARIANCE_QUEUE,
  GOLDEN_EXPECTED_TARGETS,
  buildGoldenComposerInput
};
