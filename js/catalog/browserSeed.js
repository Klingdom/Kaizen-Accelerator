/**
 * Browser-friendly catalog seed.
 *
 * The full 60-entry seed (`js/catalog/seed/index.js`) reads from a Node
 * file via `node:fs`, so it can't be imported in the browser. This
 * module exports a minimal but functional set that keeps the daily
 * composer happy:
 *   - #1 L&D (CI)
 *   - #12 PDCA (CI rotation candidate)
 *   - #15 Team meetings (COMM filler)
 *   - #16 1:1 (COMM filler alt)
 *   - #34 DMAIC C&E Matrix (Deep payload for a DMAIC project)
 *   - gen_deep_work_project (generic PROJECT top-up)
 *   - gen_value_added_communication (COMMUNICATION non-optional slots)
 *   - gen_end_of_activity_reflection (CI non-optional)
 *
 * All entries mirror the fixture set `GOLDEN_FULL_CATALOG` in
 * `tests/fixtures/goldenDay.js`. When the full-seed pipeline becomes
 * available in the browser (Sprint 5+), this module is replaced.
 *
 * Pure ES module. Zero runtime deps. No Node-only imports.
 */

export const BROWSER_CATALOG = Object.freeze([
  {
    id: 'cat_1_personal_learning_and_development_l_d_tracker',
    activityNumber: 1,
    name: 'Personal Learning and Development (L&D Tracker)',
    focusArea: 'CONTINUOUS_IMPROVEMENT',
    defaultDurationMinutes: 60,
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
    sourceRef: 'browserSeed'
  },
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
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
    sourceRef: 'browserSeed'
  },
  // Ceremonies (referenced by DAILY_NON_OPTIONAL_SET in the composer).
  {
    id: 'cer_daily_standup',
    activityNumber: null,
    name: 'Daily Standup',
    focusArea: 'CEREMONY',
    defaultDurationMinutes: 15,
    cadence: 'DAILY',
    trigger: 'daily 09:00',
    inputs: [],
    outputArtifact: { name: 'Standup notes', schema: 'TEXT', required: true },
    participants: ['Team'],
    procedure: [],
    bucket: 'COMMUNICATION',
    isNonOptional: true,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: 'browserSeed'
  }
]);

export default BROWSER_CATALOG;
