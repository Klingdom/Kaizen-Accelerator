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
  LESSONS_LEARNED: 'gen_lessons_learned',
  LUNCH: 'recovery_lunch',
  // Phase 1 — Convergent Tier 1 additions (CATALOG_GAP_DELTA.md §10)
  STRUCTURED_ONE_ON_ONE: 'gen_structured_one_on_one',
  STAKEHOLDER_STATUS_REPORT: 'gen_stakeholder_status_report',
  MONTHLY_CI_REVIEW: 'gen_monthly_ci_review',
  FIVE_WHYS: 'gen_5_whys'
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
    },
    // --- Phase 1: Convergent Tier 1 additions (CATALOG_GAP_DELTA.md §10 Phase 1) ---
    // Source content: CATALOG_GAP_RESEARCH.md §3 Entry 1 (Horstman SBI model)
    {
      id: GENERIC_IDS.STRUCTURED_ONE_ON_ONE,
      activityNumber: null,
      name: 'Structured 1:1 Meeting',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 30,
      cadence: 'WEEKLY',
      trigger: 'Recurring calendar hold, same day/time each week per direct report',
      inputs: [
        'Prior 1:1 notes',
        'Open action items from last meeting',
        'Performance signals and any emerging blockers',
        "Team member's agenda"
      ],
      outputArtifact: {
        name: '1:1 Notes with Action Items',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Manager', 'Direct Report'],
      procedure: [
        'a. Open the shared 1:1 document; both parties review outstanding action items from the prior meeting (5 min).',
        "b. Give the report the floor first — ask \"What's on your agenda?\" and take notes on their priorities and blockers (10 min).",
        'c. Deliver any prepared feedback using the Manager Tools SBI model: Situation, Behavior, Impact; pause for response (5 min).',
        'd. Manager shares any context, org updates, or coaching points the report needs (5 min).',
        'e. Confirm action items with owners and due dates; record in shared document before the meeting closes (5 min).'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'], // SW-Q1 — Phil to confirm primary persona (manager vs IC)
      enabledByUser: true,
      version: 1,
      sourceRef: 'Horstman, The Effective Manager (2016), Ch. 4-5; Manager Tools podcast "One-on-Ones" series'
    },
    // Source content: CATALOG_GAP_RESEARCH.md §3 Entry 5 (RAG framework, Friday-before-16:00)
    {
      id: GENERIC_IDS.STAKEHOLDER_STATUS_REPORT,
      activityNumber: null,
      name: 'Stakeholder Status Report',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 30,
      cadence: 'WEEKLY',
      trigger: 'Every Friday before end-of-day (16:00), covering the completed sprint week',
      inputs: [
        'Sprint Backlog status',
        'OKR confidence snapshot',
        'Open risks and blockers log',
        'Any decisions needed from stakeholders'
      ],
      outputArtifact: {
        name: 'Weekly Status Report',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Open the status report template; set the reporting period and RAG (Red/Amber/Green) status for each workstream.',
        "b. Write a two-sentence summary of the week's accomplishments — only completed items, no in-flight descriptions.",
        'c. List the top 1–3 risks or blockers with owner, mitigation, and target resolution date.',
        'd. Identify any decisions needed from stakeholders this week; frame each as a clear yes/no or option-select question.',
        'e. Distribute via the agreed channel (email, wiki, or async thread) by 16:00 Friday; do not send on Monday morning.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Manager Tools + PMBOK 7th Ed. Performance Domain: Stakeholders p. 29 + GitLab Remote Playbook "Async Status Updates"'
    },
    // Source content: CATALOG_GAP_PM.md CI Tier 1 (broad framing per DELTA §3 C-3)
    {
      id: GENERIC_IDS.MONTHLY_CI_REVIEW,
      activityNumber: null,
      name: 'Monthly CI Review',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 45,
      cadence: 'MONTHLY',
      trigger: 'Last Friday of each month (or first working day of new month)',
      inputs: [
        'Past 2 weekly reflections',
        'Active Kaizen portfolio state',
        'OKR progress snapshot',
        'Sprint velocity trend (last 2 sprints)'
      ],
      outputArtifact: {
        name: 'Monthly CI Review Summary',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self', 'CI Champion'], // SW-Q3 — Phil to confirm: self-only for solo practitioners vs CI Champion required
      procedure: [
        'a. Review past 2 sprints: goal achievement rate, velocity trend, recurring impediment patterns.',
        'b. Check Kaizen portfolio: how many open, how many closed with validated benefit, how many stalled.',
        'c. Review OKR trajectory: on track, at risk, or off track — with a one-line cause for each at-risk key result.',
        'd. Identify one systemic improvement to the CI process itself (meta-kaizen candidate).',
        'e. Set 1–2 priority shifts for the coming month.',
        'f. Publish summary to the team and file in the quarterly planning archive.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: ['gen_weekly_reflection'],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Lean Management Review discipline; BAM-X authored (CATALOG_GAP_PM.md Tier 1)'
    },
    // Source content: CATALOG_GAP_PM.md CI Tier 1 (canonical 5 Whys ritual; Toyota Production System)
    {
      id: GENERIC_IDS.FIVE_WHYS,
      activityNumber: null,
      name: '5 Whys Root-Cause Analysis',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 30,
      cadence: 'EVENT_DRIVEN',
      trigger: 'Recurring friction signal, process defect, or unexpected variance in EoAR or weekly reflection',
      inputs: [
        'Problem statement (one sentence)',
        'Observable evidence of the problem',
        'Relevant process or system context'
      ],
      outputArtifact: {
        name: '5 Whys Analysis Document',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self', 'Process Owner'],
      procedure: [
        'a. Write the problem statement in one sentence using observable facts, not interpretations.',
        'b. Ask "Why did this happen?" and write the most direct cause.',
        'c. Repeat the question on each answer until 5 levels are reached or a root cause is confirmed (controllable factor you can act on).',
        'd. Confirm the root cause by working back up the chain: "If we fix X, do all upstream Whys resolve?"',
        'e. Define at most 2 countermeasures: one short-term containment, one systemic fix.',
        'f. Assign owner, due date, and success measure to each countermeasure.',
        'g. Log in friction tracker; promote systemic fix to Kaizen queue if effort > 2 days.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Toyota Production System — Taiichi Ohno; Lean Thinking (Womack & Jones)'
    },
    // --- Iter 26: Lunch block as editable ScheduledActivity (ARCHITECTURE_DELTA_LUNCH_BLOCK.md) ---
    // bucket: null is INTENTIONAL — this entry is capacity-neutral.
    // validateComposition filters bucket===null rows out of all bucket sums.
    // bucketMap.js allow-lists this id so it does not throw BUCKET_UNRESOLVABLE.
    {
      id: GENERIC_IDS.LUNCH,
      activityNumber: null,
      name: 'Lunch',
      focusArea: 'CONTINUOUS_IMPROVEMENT', // OQ-1: reuse CI — no types.js touch required
      defaultDurationMinutes: 30,           // Phil's directive: 30 min (not architect's 60)
      cadence: 'DAILY',
      trigger: 'Default lunch window 12:00 local',
      inputs: [],
      outputArtifact: {
        name: 'Lunch (no artifact)',
        schema: 'TEXT',
        required: false                     // OQ-2: lunch produces no artifact
      },
      participants: ['Self'],
      procedure: [
        'a. Step away from work.',
        'b. Eat.',
        'c. Return at the planned end time.'
      ],
      bucket: null,                         // SENTINEL: capacity-neutral (not PROJECT/COMMUNICATION/CI)
      isNonOptional: false,                 // AC8: user can skip per day
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'ARCHITECTURE_DELTA_LUNCH_BLOCK.md §5',
      // Non-standard fields read by the composer at emit time.
      defaultStart: '12:00',
      slotKind: 'LUNCH'
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
