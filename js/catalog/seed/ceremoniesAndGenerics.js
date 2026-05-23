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
  FIVE_WHYS: 'gen_5_whys',
  // Phase 2 — PM-unique + Research-unique Tier 1 additions (CATALOG_GAP_DELTA.md §10 Phase 2)
  DECISION_MEETING: 'gen_decision_meeting',
  DMAIC_CONTROL_PLAN: 'gen_dmaic_control_plan',
  PROJECT_CHARTER: 'gen_project_charter',
  STANDARD_WORK_UPDATE: 'gen_standard_work_update',
  TIME_BLOCK_PLANNING: 'gen_time_block_planning',
  CONSTRAINT_IDENTIFICATION: 'gen_constraint_identification',
  // Phase 3 — Tier 2 additions (CATALOG_GAP_DELTA.md §10 Phase 3, 10 entries consolidated from both lenses)
  // Research-authored (5):
  PRE_MEETING_PREP: 'gen_pre_meeting_prep',
  CRUCIAL_CONVERSATION_PREP: 'gen_crucial_conversation_prep',
  ASYNC_WRITTEN_UPDATE: 'gen_async_written_update',
  HABIT_STREAK_REVIEW: 'gen_habit_streak_review',
  HANSEI: 'gen_hansei',
  // PM-authored (5):
  EXTERNAL_SYNC: 'gen_external_sync',
  INCIDENT_COMMS: 'gen_incident_comms',
  LEARNING_DEBRIEF: 'gen_learning_debrief',
  PROJECT_CLOSURE: 'gen_project_closure',
  TECHNICAL_SPEC_AUTHORING: 'gen_technical_spec_authoring'
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
    // --- Phase 2: PM-unique + Research-unique Tier 1 additions (CATALOG_GAP_DELTA.md §10 Phase 2) ---
    // Source content: CATALOG_GAP_PM.md COMMUNICATION Tier 1 (RACI/RAPID decision protocol)
    {
      id: GENERIC_IDS.DECISION_MEETING,
      activityNumber: null,
      name: 'Decision Meeting (Gate / Sign-off)',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 45,
      cadence: 'EVENT_DRIVEN', // SW-Q? — Phil to confirm: PM artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (no 'ad_hoc' in Cadence enum)
      trigger: 'A decision, approval, or escalation cannot be resolved asynchronously',
      inputs: [
        'Pre-read document (1–2 pages max) distributed 24h in advance',
        'Decision options with trade-offs stated',
        'RACI or decision authority identified'
      ],
      outputArtifact: {
        name: 'Decision Record',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Decision Owner', 'Project Lead', 'Required RACI stakeholders'],
      procedure: [
        'a. Distribute the pre-read 24 hours before; cancel the meeting if pre-read is not ready.',
        'b. Open with a 5-minute framing: what decision is needed, what are the options, what is the deadline.',
        'c. Each stakeholder states their position and key concern — time-boxed to 2 minutes per person.',
        'd. Decision Owner makes the call; document the decision and its rationale in the meeting.',
        'e. Record dissenting views if material; assign any follow-up actions with owners and dates.',
        'f. Publish the Decision Record to the project record within 24 hours of the meeting.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [], // Phase 5: add dependsOn edges per CATALOG_GAP_DELTA.md §8
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'CHAMPION', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'RACI matrix discipline: Smith & Erwin (2011); Decisive (Heath & Heath) — decision framing'
    },
    // Source content: CATALOG_GAP_PM.md PROJECT Tier 1 (DMAIC Control Phase completion)
    {
      id: GENERIC_IDS.DMAIC_CONTROL_PLAN,
      activityNumber: null,
      name: 'DMAIC Control Plan',
      focusArea: 'DMAIC',
      defaultDurationMinutes: 60,
      cadence: 'EVENT_DRIVEN', // SW-Q? — Phil to confirm: PM artifact listed 'per_project'; mapped to EVENT_DRIVEN (no 'PER_PROJECT' in Cadence enum)
      trigger: 'DMAIC Improve phase complete; before closing to Control phase',
      inputs: [
        'Implemented Improvements (cat_40_dmaic_implemented_improvements)',
        'FMEA (cat_37_dmaic_failure_modes_effects_analysis)',
        'Baseline and post-improvement data (cat_28, cat_39)',
        'Updated SOP drafts'
      ],
      outputArtifact: {
        name: 'DMAIC Control Plan Document',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Project Lead', 'Process Owner'],
      procedure: [
        'a. List each vital X identified in the FMEA/Regression as a monitored parameter.',
        'b. For each parameter define: control method, spec limit, measurement frequency, owner.',
        'c. Define the out-of-control response rule (e.g., >2σ shift triggers recheck within 24h).',
        'd. Confirm updated SOPs are published and Process Owner has signed them.',
        'e. Link the Control Chart (cat_29) dashboard to the Control Plan as the live monitoring artifact.',
        'f. Set the 30/60/90-day check-in schedule with Process Owner.',
        'g. File Control Plan alongside Charter and Results Narrative.'
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [], // Phase 5: wire cat_37 + cat_40 dependsOn edges per DELTA §8
      projectTypeBinding: 'DMAIC',
      phaseBinding: 'PHASE_4', // Control phase — types.js comment: 'PHASE_0'..'PHASE_4' (Accelerator)
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'ASQ DMAIC Body of Knowledge — Control Phase; Lean Six Sigma Pocket Toolbook (George et al.)'
    },
    // Source content: CATALOG_GAP_PM.md PROJECT Tier 1 (generic charter for non-DMAIC/non-Kaizen projects)
    {
      id: GENERIC_IDS.PROJECT_CHARTER,
      activityNumber: null,
      name: 'Project Charter (General)',
      focusArea: 'DEEP_WORK',
      defaultDurationMinutes: 90,
      cadence: 'EVENT_DRIVEN', // SW-Q? — Phil to confirm: PM artifact listed 'per_project'; mapped to EVENT_DRIVEN (no 'PER_PROJECT' in Cadence enum)
      trigger: 'Decision to begin any non-DMAIC, non-Kaizen project or initiative',
      inputs: [
        'Problem or opportunity statement',
        'Sponsor commitment',
        'Initial scope hypothesis'
      ],
      outputArtifact: {
        name: 'Signed Project Charter',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Project Lead', 'Sponsor', 'Process Owner'],
      procedure: [
        'a. Write the problem statement in two sentences: current state pain, desired future state.',
        'b. Define in-scope and explicitly out-of-scope boundaries.',
        'c. Identify Sponsor, Project Lead, key contributors, and decision authority.',
        'd. Set the goal statement: measurable outcome + target date.',
        'e. List the top 3 risks and initial mitigation approach.',
        'f. Estimate effort in sprints or weeks with a rough milestone sequence.',
        'g. Obtain Sponsor signature and register in project portfolio.'
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null, // SW-Q8 — general projects are not yet a first-class type; Phil to confirm
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'PMBOK 7th Edition — Performance Domains: Stakeholder, Team, Planning'
    },
    // Source content: CATALOG_GAP_PM.md CI Tier 1 (meta-practice: SOP update from lessons learned)
    {
      id: GENERIC_IDS.STANDARD_WORK_UPDATE,
      activityNumber: null,
      name: 'Standard Work Creation / Update',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 30,
      cadence: 'EVENT_DRIVEN', // SW-Q? — Phil to confirm: PM artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (no 'ad_hoc' in Cadence enum). SW-Q7: trigger set also open.
      trigger: 'Kaizen close with implemented improvement OR lessons learned session identifies SOP gap',
      inputs: [
        'Implemented improvement description',
        'Lessons Learned document',
        'Existing SOP / standard work entry (if updating)'
      ],
      outputArtifact: {
        name: 'Updated or New Standard Work Procedure',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self', 'Process Owner'],
      procedure: [
        'a. Confirm the improvement is stable (held for ≥ 30 days or 30 observation cycles).',
        'b. Draft the new or revised procedure in alphabetic step format (a–g max).',
        'c. Specify the trigger, inputs, output artifact, and participants for the activity.',
        'd. Review with the Process Owner and one practitioner who performs the work.',
        'e. Publish to the standard work catalog or knowledge wiki.',
        'f. Communicate the change to all affected roles with the effective date.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [], // Phase 5: wire gen_lessons_learned dependsOn per DELTA §8; SW-Q7 open on full trigger set
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Toyota Kata (Rother) — Standardize-Then-Improve; BAM-X authored (CATALOG_GAP_PM.md Tier 1)'
    },
    // Source content: CATALOG_GAP_RESEARCH.md §3 Entry 3 (Newport "Deep Work" weekly time-block ritual)
    {
      id: GENERIC_IDS.TIME_BLOCK_PLANNING,
      activityNumber: null,
      name: 'Weekly Time-Block Plan',
      focusArea: 'DEEP_WORK',
      defaultDurationMinutes: 20,
      cadence: 'WEEKLY',
      trigger: 'Sunday evening or Monday morning before first calendar commitment',
      inputs: [
        "Upcoming week's calendar",
        'Sprint Backlog commitments',
        'Personal OKR priorities',
        'Energy forecast'
      ],
      outputArtifact: {
        name: 'Weekly Time-Block Plan',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        "a. Open the week's calendar view; identify all fixed commitments (meetings, deadlines, travel).",
        'b. Estimate remaining discretionary hours by day; account for known energy peaks and troughs.',
        'c. Assign each Sprint Backlog commitment to a specific time block on a specific day; no commitment floats unscheduled.',
        'd. Reserve at least one 90-minute deep-work block per day before 12:00; mark it as protected.',
        "e. Write a one-sentence intention for the week (\"This week's win is ___\") at the top of the plan."
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Newport, "Deep Work" (2016), Ch. 4; Newport "Time-Block Planner" companion methodology (2020)'
    },
    // Source content: CATALOG_GAP_RESEARCH.md §3 Entry 4 (Goldratt TOC Five Focusing Steps)
    {
      id: GENERIC_IDS.CONSTRAINT_IDENTIFICATION,
      activityNumber: null,
      name: 'Constraint (Bottleneck) Identification',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 60,
      cadence: 'MONTHLY',
      trigger: 'Monthly CI review or when throughput variance exceeds 20% of baseline', // SW-Q? — Phil to calibrate the 20% variance threshold
      inputs: [
        'Process map',
        'Throughput data',
        'WIP aging report',
        'Team capacity log'
      ],
      outputArtifact: {
        name: 'Constraint Register',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['CI Champion', 'Process Owner', 'Team'],
      procedure: [
        'a. Map the current end-to-end workflow from trigger to output artifact; identify all steps.',
        'b. For each step, record average cycle time and WIP queue depth from the past sprint.',
        'c. Identify the step with the longest combined cycle time plus wait time — this is the candidate constraint.',
        'd. Confirm the constraint by checking whether upstream steps are underutilized while this step is backlogged.',
        'e. Document the constraint in the Constraint Register: name, location, throughput rate, WIP depth, recommended focus.',
        'f. Decide exploitation action (maximize output of the constraint before adding capacity elsewhere); add to Improvement Backlog.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Goldratt, "The Goal" (1984), Ch. 15 (Five Focusing Steps); "Theory of Constraints Handbook" (Cox/Schleier, 2010), Ch. 2'
    },
    // --- Phase 3: Tier 2 additions (CATALOG_GAP_DELTA.md §10 Phase 3) ---
    // 5 Research-authored entries + 5 PM-authored entries (13 originally proposed → 3 dropped per delta §6).
    // Dropped: gen_weekly_project_status (superseded by gen_stakeholder_status_report, Phase 1),
    //          gen_annual_reflection (consolidated into gen_hansei below),
    //          gen_reading_for_synthesis (consolidated into gen_learning_debrief below).

    // Source: CATALOG_GAP_RESEARCH.md §3 Tier 2 Entry 6 — Lencioni "Death by Meeting" pre-meeting prep
    {
      id: GENERIC_IDS.PRE_MEETING_PREP,
      activityNumber: null,
      name: 'Pre-Meeting Preparation',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 15,
      cadence: 'EVENT_DRIVEN', // Research artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (Phase 2 precedent — no 'ad_hoc' in Cadence enum)
      trigger: 'Any scheduled meeting with duration ≥ 30 min, initiated 24 hours before',
      inputs: [
        'Meeting agenda',
        'Relevant documents and prior decisions log',
        'Attendee list'
      ],
      outputArtifact: {
        name: 'Pre-Read distributed to attendees',
        schema: 'TEXT',
        required: true
      },
      participants: ['Meeting Organizer'],
      procedure: [
        'a. Confirm the meeting has a written agenda with at least one clear decision or output stated.',
        'b. Identify the 1–2 documents attendees need to have read before arriving; distribute with 24-hour lead time.',
        'c. Write a one-sentence "desired outcome" statement at the top of the agenda.',
        'd. If no agenda or desired outcome can be written, cancel or convert the meeting to an async update.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [], // Phase 5: wire dependsOn edges from long-form ceremonies (≥60 min) per DELTA §8 pattern 2
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Lencioni "Death by Meeting" (2004), Ch. 5; Amazon 6-pager memo practice (Bezos 2018); HBR Perlow et al. (2017)'
    },
    // Source: CATALOG_GAP_RESEARCH.md §3 Tier 2 Entry 7 — Patterson et al. "Crucial Conversations" STATE model
    {
      id: GENERIC_IDS.CRUCIAL_CONVERSATION_PREP,
      activityNumber: null,
      name: 'High-Stakes Conversation Preparation',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 20,
      cadence: 'EVENT_DRIVEN', // Research artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Identified need for a conversation with meaningful disagreement, performance concern, or values conflict',
      inputs: [
        'Observable facts of the triggering event',
        'Description of the desired conversation outcome'
      ],
      outputArtifact: {
        name: 'Conversation Brief',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Write the observable facts of the triggering event in two sentences using neutral language.',
        'b. Identify your own emotional state and the story you have been telling yourself about the facts — separate these clearly.',
        'c. Write the outcome you want from this conversation; confirm it is relational and not merely transactional.',
        'd. Draft your opening sentence: "I want to talk about [observable fact]. My intent is [outcome]. Are you open to that?"',
        'e. Anticipate the other party\'s likely response; plan your listening posture, not your rebuttal.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Patterson et al., "Crucial Conversations" (4th ed., 2021), Ch. 2 and Ch. 4 — STATE model'
    },
    // Source: CATALOG_GAP_RESEARCH.md §3 Tier 2 Entry 10 — GitLab Remote Playbook async-first communication
    // SW-Q4 — Phil to confirm async-first cultural commitment; affects prioritization of this entry
    {
      id: GENERIC_IDS.ASYNC_WRITTEN_UPDATE,
      activityNumber: null,
      name: 'Async Written Project Update',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 20,
      cadence: 'WEEKLY',
      trigger: 'Any recurring team meeting that can be replaced with an async read; minimum Monday AM publication',
      inputs: [
        'Completed work since last update (task names + outcomes)',
        'Plan for the next period',
        'Any active blockers'
      ],
      outputArtifact: {
        name: 'Async Update Post',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Write the update in a shared, persistent channel (wiki, doc, or project management tool) — not email.',
        'b. Lead with what was completed since the last update; be specific (task name + outcome, not vague summaries).',
        'c. State the plan for the next period in the same specificity.',
        'd. Flag any blocker with: description, who can unblock it, and when a decision is needed.',
        'e. Close with a single explicit ask, if any — one question, one decision, one approval.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'GitLab Remote Playbook (2022 ed.); Basecamp "Shape Up" (2019) p. 12-14; GitLab employee handbook'
    },
    // Source: CATALOG_GAP_RESEARCH.md §3 Tier 2 Entry 9 — Clear "Atomic Habits" habit streak tracking
    // SW-Q5 — Phil to confirm: BAM-X has no native habit-tracking data model.
    // Default shipped: card serves as guidance text; user maintains their own external tracker.
    // DELTA §8 pattern 3: chains after gen_weekly_reflection — dependsOn wiring deferred to Phase 5.
    {
      id: GENERIC_IDS.HABIT_STREAK_REVIEW,
      activityNumber: null,
      name: 'Habit Streak Review',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 10,
      cadence: 'WEEKLY',
      trigger: 'Weekly Reflection session (runs immediately after gen_weekly_reflection)',
      inputs: [
        'Habit tracker (external tool or log)',
        'List of active habits with identity statements'
      ],
      outputArtifact: {
        name: 'Habit Streak Update',
        schema: 'TEXT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Open the habit tracker; mark each day of the past week as complete or missed for each tracked habit.',
        'b. For any habit with 2+ consecutive misses, write one sentence on the smallest action that would restore consistency.',
        'c. Confirm the identity statement behind each habit is still true for you — update it if your goals have shifted.',
        'd. Record the current streak count for each habit; celebrate any streak over 21 days explicitly.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [], // Phase 5: wire dependsOn: ['gen_weekly_reflection'] per DELTA §8 pattern 3; SW-Q5 — habit tracker data model deferred
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Clear "Atomic Habits" (2018), Ch. 16 and Ch. 2'
    },
    // Source: CATALOG_GAP_RESEARCH.md §3 Tier 2 Entry 8 — Liker "The Toyota Way" Principle 14 hansei
    // SW-Q3 — Phil to confirm: separate card vs augmenting Sprint Retro with deep-failure conditional branch.
    // Default shipped: separate card; triggered by significant failure (EVENT_DRIVEN).
    // Consolidates / absorbs PM's gen_annual_reflection per CATALOG_GAP_DELTA.md §6.
    {
      id: GENERIC_IDS.HANSEI,
      activityNumber: null,
      name: 'Hansei (Structured Failure Reflection)',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 45,
      cadence: 'EVENT_DRIVEN', // Research artifact listed 'per_project'; mapped to EVENT_DRIVEN (Phase 2 precedent). SW-Q3 — Phil to confirm boundary with Sprint Retro.
      trigger: 'Significant project failure, major missed target, or at every project close regardless of outcome',
      inputs: [
        'Specific expectation that was not met (with metric gap)',
        'Sequence of events that occurred',
        'Prior Lessons Learned document (if applicable)'
      ],
      outputArtifact: {
        name: 'Hansei Document',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self', 'Team (optional)', 'Process Owner'],
      procedure: [
        'a. State the specific expectation that was not met in one paragraph — include the metric gap, not just the sentiment.',
        'b. Describe what actually happened in the sequence it occurred; avoid characterizing individuals.',
        'c. Identify the root cause using the Five Whys protocol — ask "why" at least five times from the gap back to the systemic condition.',
        'd. Write one commitment: the specific change to prevent recurrence, with a measurement that will confirm the change worked.',
        'e. Publish the Hansei Document alongside the project record; do not file it privately.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Liker "The Toyota Way" (2004), Principle 14; Rother "Toyota Kata" (2010), Ch. 7'
    },
    // Source: CATALOG_GAP_PM.md COMMUNICATION Tier 2 — customer/vendor/partnership sync standard
    {
      id: GENERIC_IDS.EXTERNAL_SYNC,
      activityNumber: null,
      name: 'External Stakeholder Sync (Customer / Vendor / Partner)',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 30,
      cadence: 'EVENT_DRIVEN', // PM artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Scheduled check-in with external party (customer, vendor, or partner)',
      inputs: [
        'Prior meeting notes and open commitments',
        'Prepared agenda distributed in advance',
        'Any deliverables due at this meeting'
      ],
      outputArtifact: {
        name: 'External Sync Notes + Commitment Log',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Account Lead', 'External Contact'],
      procedure: [
        'a. Review prior commitments (yours and theirs) at the top of the meeting.',
        'b. Work through the agenda; time-box each topic.',
        'c. Capture any new commitments with owner, deliverable, and due date explicitly stated.',
        'd. Confirm the date and agenda of the next meeting before closing.',
        'e. Send meeting notes with commitment log to both parties within 4 hours of close.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'BAM-X authored (CATALOG_GAP_PM.md Tier 2); aligned with account management and vendor management best practices'
    },
    // Source: CATALOG_GAP_PM.md COMMUNICATION Tier 2 — crisis/incident response protocol
    {
      id: GENERIC_IDS.INCIDENT_COMMS,
      activityNumber: null,
      name: 'Incident / Crisis Communication',
      focusArea: 'COMMUNICATION',
      defaultDurationMinutes: 30,
      cadence: 'EVENT_DRIVEN', // PM artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Operational incident, quality escape, or crisis event requiring coordinated communication',
      inputs: [
        'Incident description and severity classification',
        'Affected stakeholder list',
        'Current known facts (do not include speculation)'
      ],
      outputArtifact: {
        name: 'Incident Communication Log',
        schema: 'LIST',
        required: true
      },
      participants: ['Incident Lead', 'Comms Owner', 'Sponsor'],
      procedure: [
        'a. Issue initial notification within 30 minutes of incident declaration: what is known, who is working it, next update ETA.',
        'b. Send status updates at agreed intervals (e.g., every 2 hours) until resolved — even if the update is "no change."',
        'c. Keep facts and speculation clearly separated in all communications.',
        'd. Escalate to Sponsor if resolution exceeds SLA or scope is expanding.',
        'e. Issue resolution notice: what happened, what was done, what prevents recurrence.',
        'f. Log all communications with timestamps in the incident record for post-mortem use.'
      ],
      bucket: 'COMMUNICATION',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Google SRE Handbook — Incident Management; ITIL 4 — Incident Communication; BAM-X authored (CATALOG_GAP_PM.md Tier 2)'
    },
    // Source: CATALOG_GAP_PM.md CI Tier 2 — L&D completion to knowledge application loop closer.
    // Consolidates / absorbs Research's gen_reading_for_synthesis per CATALOG_GAP_DELTA.md §6.
    // Uses PM's broader framing (course / conference / book — not reading-only).
    {
      id: GENERIC_IDS.LEARNING_DEBRIEF,
      activityNumber: null,
      name: 'Learning Debrief (Course / Conference / Book)',
      focusArea: 'CONTINUOUS_IMPROVEMENT',
      defaultDurationMinutes: 30,
      cadence: 'EVENT_DRIVEN', // PM artifact listed 'ad_hoc'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Completion of a course, attendance at a conference session, or finish of a book',
      inputs: [
        'Course / conference / book notes',
        'L&D goal that motivated the learning',
        'Current skill inventory'
      ],
      outputArtifact: {
        name: 'Learning Debrief — 1-Page Summary',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Self'],
      procedure: [
        'a. Write 3 key insights from the material — specific, actionable, not paraphrase.',
        'b. For each insight, state how it changes or confirms an existing practice.',
        'c. Identify 1 experiment to run in the next sprint to apply one insight.',
        'd. Update the L&D tracker: mark learning complete, record the skill assessed, note gaps remaining.',
        'e. Publish the 1-pager to the knowledge wiki; share with relevant teammates.'
      ],
      bucket: 'CI',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'Make It Stick (Brown et al.) — retrieval and application; BAM-X authored (CATALOG_GAP_PM.md Tier 2)'
    },
    // Source: CATALOG_GAP_PM.md PROJECT Tier 2 — closure gate for non-DMAIC/non-Kaizen projects
    {
      id: GENERIC_IDS.PROJECT_CLOSURE,
      activityNumber: null,
      name: 'Project Closure and Handoff',
      focusArea: 'DEEP_WORK',
      defaultDurationMinutes: 60,
      cadence: 'EVENT_DRIVEN', // PM artifact listed 'per_project'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Final deliverable accepted by Sponsor; project ready to close',
      inputs: [
        'Project Charter',
        'Final deliverable or artifact',
        'Open items log',
        'Lessons Learned (if applicable)'
      ],
      outputArtifact: {
        name: 'Project Closure Checklist + Handoff Note',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Project Lead', 'Sponsor', 'Process Owner'],
      procedure: [
        'a. Confirm Sponsor acceptance of final deliverable against Charter goal statement.',
        'b. Close or transfer all open action items to the appropriate owner.',
        'c. Archive project artifacts (Charter, deliverables, status updates) to the knowledge repository.',
        'd. Write a one-page handoff note: what was built, who owns it, how to maintain it.',
        'e. Capture 3 lessons learned (what worked, what didn\'t, what to try next) and add to knowledge wiki.',
        'f. Remove project from active portfolio; update pipeline view.'
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'PMBOK 7th Edition — Project Closeout; BAM-X authored (CATALOG_GAP_PM.md Tier 2)'
    },
    // Source: CATALOG_GAP_PM.md PROJECT Tier 2 — knowledge-work deliverable standard
    {
      id: GENERIC_IDS.TECHNICAL_SPEC_AUTHORING,
      activityNumber: null,
      name: 'Technical Spec / Design Brief Authoring',
      focusArea: 'DEEP_WORK',
      defaultDurationMinutes: 120,
      cadence: 'EVENT_DRIVEN', // PM artifact listed 'per_project'; mapped to EVENT_DRIVEN (Phase 2 precedent)
      trigger: 'Project or feature requires a written specification before execution begins',
      inputs: [
        'Project Charter or feature request',
        'Stakeholder requirements (VOC/VOB)',
        'Technical constraints or platform context'
      ],
      outputArtifact: {
        name: 'Technical Specification Document',
        schema: 'DOCUMENT',
        required: true
      },
      participants: ['Project Lead', 'Technical Lead'],
      procedure: [
        'a. State the problem and the proposed solution in plain language (2 paragraphs max).',
        'b. Define the success criteria: what observable behavior proves this is done.',
        'c. Enumerate the non-functional requirements (performance, security, compatibility).',
        'd. List explicitly what is out of scope.',
        'e. Draft the technical approach at the level of precision needed for implementation.',
        'f. Identify open questions; assign an owner and a resolution date to each.',
        'g. Route for review; lock the spec before sprint planning that includes the work.'
      ],
      bucket: 'PROJECT',
      isNonOptional: false,
      dependsOn: [],
      projectTypeBinding: null,
      phaseBinding: null,
      appliesToRoles: ['LEADER', 'PRACTITIONER'],
      enabledByUser: true,
      version: 1,
      sourceRef: 'BAM-X authored (CATALOG_GAP_PM.md Tier 2); aligned with RFC/ADR patterns in engineering practice'
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
