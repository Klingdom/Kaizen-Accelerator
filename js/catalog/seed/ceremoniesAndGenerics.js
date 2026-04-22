/**
 * Seed: BAM ceremonies + generic CI entries (E2-T3).
 *
 * These entries are NOT numbered in `docs/Business Agility Standard Work.txt`.
 * They originate from PRODUCT_BLUEPRINT §3.4 (the DAILY_NON_OPTIONAL_SET)
 * and CATALOG_GAPS §A.3 (Quarterly Planning) + §H.2 (generics, incl. the
 * v0.3.1 Lessons Learned addition required by ARCHITECTURE §2.9 close-of-
 * Kaizen invariant).
 *
 * Six ceremonies (Quarterly Planning, Sprint Planning, Daily Standup,
 * Mid-Sprint Review, Sprint Review, Sprint Retrospective) and five
 * generics (Deep Work generic, Value-Added Communication generic,
 * End-of-Activity Reflection, Weekly Reflection, Lessons Learned).
 *
 * All cross-cutting metadata is populated HERE because these rows never
 * pass through the §A–§D fillGaps step (they aren't in the raw source).
 */

/** Stable id for each ceremony/generic — used by composer + dependsOn edges. */
export const CEREMONY_IDS = Object.freeze({
  QUARTERLY_PLANNING: 'cer_quarterly_planning',
  SPRINT_PLANNING: 'cer_sprint_planning',
  DAILY_STANDUP: 'cer_daily_standup',
  MID_SPRINT_REVIEW: 'cer_mid_sprint_review',
  SPRINT_REVIEW: 'cer_sprint_review',
  SPRINT_RETROSPECTIVE: 'cer_sprint_retrospective'
});

export const GENERIC_IDS = Object.freeze({
  DEEP_GENERIC: 'gen_deep_work_project',
  COMM_GENERIC: 'gen_value_added_communication',
  END_OF_ACTIVITY_REFLECTION: 'gen_end_of_activity_reflection',
  WEEKLY_REFLECTION: 'gen_weekly_reflection',
  LESSONS_LEARNED: 'gen_lessons_learned'
});

/**
 * Build the ceremony entries. Every field is populated — no `null`s here.
 * Sequence follows CATALOG_GAPS §A.3 / §H.1 and ENGINE_DESIGN §3.3.
 *
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
function buildCeremonies() {
  return [
    {
      id: CEREMONY_IDS.QUARTERLY_PLANNING,
      activityNumber: null,
      name: 'Quarterly Planning',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 240, // 4.0h per CATALOG_GAPS §A.3
      cadence: 'QUARTERLY',
      trigger: 'First working day of each quarter',
      inputs: [
        'Prior quarter OKR scorecard',
        'Portfolio roadmap',
        'Team capacity',
        'Kaizen pipeline'
      ],
      outputArtifact: {
        name: 'Quarter Plan',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Team', 'Agile Leader', 'CI Champion', 'Process Owner'],
      procedure: [
        'a. Review prior quarter: OKR confidence vs actual, Kaizens closed with validated benefit, sprint-goal completion rate.',
        'b. Align to org priorities and externally imposed constraints for the coming quarter.',
        'c. Draft quarterly OKRs (3–5).',
        'd. Lay out 6 sprints + 1 reset sprint (Sprint 7) on the calendar.',
        'e. Allocate Kaizen portfolio across sprints.',
        'f. Identify Sprint 7 reset scope.',
        'g. Publish to team, schedule Sprint 1 Planning.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §A.3'
    },
    {
      id: CEREMONY_IDS.SPRINT_PLANNING,
      activityNumber: null,
      name: 'Sprint Planning',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 120, // 2.0h per source
      cadence: 'SPRINT',
      trigger: 'Mon Wk1 of sprint, 09:30 local',
      inputs: ['Improvement Backlog', 'Sprint Goal', 'Team capacity'],
      outputArtifact: {
        name: 'Sprint Backlog',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Team', 'Process Owner', 'Agile Facilitator'],
      procedure: [
        'a. Phase 1 (1h): Team selects Improvement Backlog items it commits to turning into fully documented improvements.',
        'b. Phase 2 (1h): Team decomposes selected items into tasks with estimates and assignments.',
        'c. Output: Sprint Backlog that reflects mutual commitment.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'docs/Business Agility Standard Work.txt:317'
    },
    {
      id: CEREMONY_IDS.DAILY_STANDUP,
      activityNumber: null,
      name: 'Daily Standup',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 15,
      cadence: 'DAILY',
      trigger: 'Same time each work day, 09:00 local',
      inputs: ['Prior day status', 'Current Sprint Backlog'],
      outputArtifact: {
        name: 'Standup Notes',
        schema: 'TEXT',
        required: true
      },
      participants: ['Team', 'Agile Facilitator'],
      procedure: [
        'a. Each member answers three questions: what have you done, what will you do next, what impedes you?',
        'b. No side conversations; 15 minutes hard stop.',
        'c. Post-standup side-meetings scheduled for interested parties.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'docs/Business Agility Standard Work.txt:337'
    },
    {
      id: CEREMONY_IDS.MID_SPRINT_REVIEW,
      activityNumber: null,
      name: 'Mid-Sprint Review',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 30,
      cadence: 'SPRINT',
      trigger: 'Fri Wk1 of sprint, 15:00 local',
      inputs: ['Sprint Backlog progress', 'Impediments from standups'],
      outputArtifact: {
        name: 'Mid-Sprint Review Notes',
        schema: 'TEXT',
        required: true
      },
      participants: ['Team', 'Agile Facilitator'],
      procedure: [
        'a. Team reviews sprint progress vs commitment.',
        'b. Identify any items that should move out of sprint or be deferred.',
        'c. Confirm plan for Wk2.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'ENGINE_DESIGN.md §3.3'
    },
    {
      id: CEREMONY_IDS.SPRINT_REVIEW,
      activityNumber: null,
      name: 'Sprint Review',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 60,
      cadence: 'SPRINT',
      trigger: 'Fri Wk2 of sprint, 14:00 local',
      inputs: ['Sprint Backlog completed', 'Process Owner', 'Stakeholders'],
      outputArtifact: {
        name: 'Sprint Review Summary',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Team', 'Process Owner', 'Stakeholders', 'Agile Facilitator'],
      procedure: [
        'a. Team presents sprint goal, committed backlog, completed backlog.',
        'b. Members demonstrate completed improvements.',
        'c. Stakeholders polled for feedback + priority changes.',
        'd. Process Owner discusses backlog rearrangement.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'docs/Business Agility Standard Work.txt:363'
    },
    {
      id: CEREMONY_IDS.SPRINT_RETROSPECTIVE,
      activityNumber: null,
      name: 'Sprint Retrospective',
      focusArea: 'CEREMONY',
      defaultDurationMinutes: 30,
      cadence: 'SPRINT',
      trigger: 'Fri Wk2 of sprint, 15:00 local (immediately after Review)',
      inputs: ['Sprint outcomes', 'Team observations'],
      outputArtifact: {
        name: 'Retrospective Actionable Items',
        schema: 'TWO_LIST',
        required: true
      },
      participants: ['Team', 'Agile Facilitator'],
      procedure: [
        'a. Team answers: what went well; what could be improved?',
        'b. Facilitator captures in summary form.',
        'c. Prioritize improvements; add high-priority items to next sprint backlog.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'docs/Business Agility Standard Work.txt:385'
    }
  ];
}

/**
 * Build the 5 generic catalog entries. Drawn from CATALOG_GAPS §H.2 (v0.3.1).
 *
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
function buildGenerics() {
  return [
    {
      id: GENERIC_IDS.DEEP_GENERIC,
      activityNumber: null,
      name: 'Deep Work — Project Task (generic)',
      focusArea: 'DEEP_WORK',
      defaultDurationMinutes: 240, // up to 240 / day
      cadence: 'DAILY',
      trigger: 'PROJECT bucket has slack and no DMAIC/Kaizen payload eligible',
      inputs: ['Current project task', 'Intention declaration'],
      outputArtifact: {
        name: 'Deep Work Output',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Declare intention for the block.',
        'b. Work the primary project task uninterrupted.',
        'c. At close, log output and any friction.'
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §H.2'
    },
    {
      id: GENERIC_IDS.COMM_GENERIC,
      activityNumber: null,
      name: 'Value-Added Communication (generic)',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 60,
      cadence: 'DAILY',
      trigger: 'COMMUNICATION bucket has slack and no named comm entry eligible',
      inputs: ['Inbox', 'Chat threads', 'Calendar'],
      outputArtifact: {
        name: 'Comm Outcome Note',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Triage inbox / chat / calendar for value-added touchpoints.',
        'b. Respond deliberately (not reactively).',
        'c. Log a short outcome note at close.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §H.2'
    },
    {
      id: GENERIC_IDS.END_OF_ACTIVITY_REFLECTION,
      activityNumber: null,
      name: 'End-of-Activity Reflection',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 15, // meta-slot reserved per ENGINE_DESIGN §1.2
      cadence: 'DAILY',
      trigger: 'Close-of-day reflection anchor, 17:00 local',
      inputs: ['Today\'s closed activities', 'Plan-vs-actual deltas'],
      outputArtifact: {
        name: 'End-of-Activity Reflection',
        schema: 'TWO_LIST',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Scan the day\'s closed activities.',
        'b. Note what went well.',
        'c. Note what to improve.',
        'd. Flag any friction signals for the Kaizen queue.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §H.2'
    },
    {
      id: GENERIC_IDS.WEEKLY_REFLECTION,
      activityNumber: null,
      name: 'Weekly Reflection',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 20,
      cadence: 'WEEKLY',
      trigger: 'Friday afternoon, 16:30 local',
      inputs: ['Week\'s friction signals', 'Week\'s variances', 'Active Kaizen state'],
      outputArtifact: {
        name: 'Weekly Reflection (DMAIC)',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Define: what was the dominant pain pattern this week?',
        'b. Measure: baseline rough count or duration.',
        'c. Analyze: candidate causes.',
        'd. Improve: promote at most one candidate to a Kaizen.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §H.2'
    },
    {
      id: GENERIC_IDS.LESSONS_LEARNED,
      activityNumber: null,
      name: 'Lessons Learned',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 45, // 30–60 min midpoint
      cadence: 'EVENT_DRIVEN',
      trigger: 'Every Kaizen close (every projectType, every closeKind)',
      inputs: ['Closing Kaizen', 'Remeasurement', 'Action history', 'Friction signals'],
      outputArtifact: {
        name: 'Lessons Learned Document',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self', 'Kaizen Lead', 'Process Owner'],
      procedure: [
        'a. What worked — improvements that beat baseline.',
        'b. What didn\'t — improvements abandoned or reverted.',
        'c. Next to try — hypotheses for the next iteration.',
        'd. Publish alongside the Kaizen record.'
      ],
      bucket: 'CI',
      isNonOptional: true,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'CATALOG_GAPS.md §H.2 v0.3.1'
    }
  ];
}

/**
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function buildCeremoniesAndGenerics() {
  return [...buildCeremonies(), ...buildGenerics()];
}

export default buildCeremoniesAndGenerics;
