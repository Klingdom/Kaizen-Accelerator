/**
 * Seed: apply CATALOG_GAPS §E bulk-fill defaults (E2-T5).
 *
 * Input: draft catalog after fillGaps. Every draft still has nulls on the
 * cross-cutting fields (cadence, trigger, inputs, outputArtifact,
 * participants) for rows that weren't covered by §A–§D. This step applies
 * the §E rule-based defaults so EVERY entry lands with all 9 required
 * PRODUCT_BLUEPRINT §3.1 fields populated.
 *
 * Rules (verbatim from CATALOG_GAPS §E.1–§E.5):
 *
 *   §E.1 Cadence — by row family
 *     #1, #2, #6                 → CONTINUOUS
 *     #3, #5                     → MONTHLY
 *     #4                         → ON_SIGNAL
 *     #7..#11                    → ON_SIGNAL (stage-gate)
 *     #12                        → EVERY_48H
 *     #13                        → WEEKLY (or on-threshold ON_SIGNAL if signal present)
 *     #14                        → DAILY
 *     #15, #16                   → WEEKLY
 *     #18                        → WEEKLY
 *     #20..#41 (DMAIC)           → EVENT_DRIVEN
 *     #42..#50 (Kaizen)          → EVENT_DRIVEN
 *
 *   §E.2 Inputs defaults — by focus-area family
 *   §E.3 Output artifact defaults — by focus-area family
 *   §E.4 Participants defaults — by focus-area family
 *   §E.5 Trigger defaults — by cadence
 *
 * The fillGaps step may have already populated these fields for §A–§D
 * rows; in that case the draft value wins (§E only fills nulls).
 *
 * Pure function; no I/O.
 */

/** §E.1 Cadence rule map, keyed by activityNumber. */
const CADENCE_BY_NUMBER = Object.freeze({
  1: 'CONTINUOUS',
  2: 'CONTINUOUS',
  3: 'MONTHLY',
  4: 'ON_SIGNAL',
  5: 'MONTHLY',
  6: 'CONTINUOUS',
  7: 'ON_SIGNAL',
  8: 'ON_SIGNAL',
  9: 'ON_SIGNAL',
  10: 'ON_SIGNAL',
  11: 'ON_SIGNAL',
  12: 'EVERY_48H',
  13: 'WEEKLY',
  14: 'DAILY',
  15: 'WEEKLY',
  16: 'WEEKLY',
  18: 'WEEKLY'
});

/**
 * §E.5 Trigger defaults — by cadence enum value.
 * Used when fillGaps hasn't already provided a trigger.
 */
const DEFAULT_TRIGGER_BY_CADENCE = Object.freeze({
  CONTINUOUS: 'Own development goal active OR weekly anchor day',
  DAILY: 'Same time each work day',
  EVERY_48H: 'Prior PDCA cycle measurement recorded',
  WEEKLY: 'Fixed anchor day in the week',
  SPRINT: 'Mapped to specific sprint day',
  MONTHLY: 'First working day of month',
  QUARTERLY: 'First working day of quarter',
  ON_SIGNAL: 'Named signal fires (document arrived, opportunity assigned, inbox threshold, variance logged)',
  EVENT_DRIVEN: 'Prior step in project / event chain complete'
});

/**
 * §E.2 Default inputs — by focus area + activityNumber family.
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {string[]}
 */
function defaultInputs(entry) {
  const fa = entry.focusArea;
  const n = entry.activityNumber;
  if (fa === 'CONTINUOUS_IMPROVEMENT') {
    if (n === 1 || n === 12 || n === 13) {
      return ['L&D Tracker state', 'Personal quarterly development goal'];
    }
    if (n === 2) {
      return ['Team L&D Tracker', 'Team quarterly goal', 'Team charter'];
    }
    if (n >= 6 && n <= 11) {
      return ['Opportunity Tracker row', 'Prior-stage output artifact'];
    }
    return ['Development goal', 'Prior reflection notes'];
  }
  if (fa === 'INNOVATION') {
    return ['Opportunity Tracker row', 'Prior-stage output artifact'];
  }
  if (fa === 'COMMUNICATION') {
    return ['Calendar', 'Inbox / chat threads', 'Stakeholder list'];
  }
  if (fa === 'CEREMONY') {
    return ['Improvement Backlog', 'Sprint Backlog'];
  }
  if (fa === 'DMAIC') {
    return ['DMAIC Charter (#20)', 'Prior DMAIC step outputs'];
  }
  if (fa === 'KAIZEN') {
    return ['Kaizen Charter (#42)', 'Prior Kaizen step outputs'];
  }
  if (fa === 'DEEP_WORK') {
    return ['Current project task', 'Intention declaration'];
  }
  return ['Prior activity outputs'];
}

/**
 * §E.3 Default output artifact — by focus area + activityNumber family.
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {{name: string, schema: string, required: true}}
 */
function defaultOutputArtifact(entry) {
  const fa = entry.focusArea;
  const n = entry.activityNumber;
  if (fa === 'CONTINUOUS_IMPROVEMENT') {
    if (n === 1) return { name: 'Knowledge Sharing 1 Pager', schema: 'DOCUMENT', required: true };
    if (n === 2) return { name: 'Team Retrospective Notes', schema: 'DOCUMENT', required: true };
    if (n === 3) return { name: 'Compliance Completion Record', schema: 'TEXT', required: true };
    if (n === 4) return { name: 'Document Review Feedback', schema: 'DOCUMENT', required: true };
    if (n === 12) return { name: 'PDCA Tick Measurement', schema: 'NUMERIC', required: true };
    if (n === 13) return { name: '6S Email Hygiene Log', schema: 'TEXT', required: true };
    return { name: 'CI Completion Note', schema: 'TEXT', required: true };
  }
  if (fa === 'INNOVATION') {
    const perStage = {
      6: 'Opportunity Tracker Entry',
      7: 'Opportunity Evaluation Document',
      8: 'PRFAQ Document',
      9: 'Prototype Plan + Results',
      10: 'Product Assessment Document',
      11: 'Initiated Product Record'
    };
    return {
      name: perStage[n] ?? 'Innovation Stage Output',
      schema: 'DOCUMENT',
      required: true
    };
  }
  if (fa === 'COMMUNICATION') {
    if (n === 14) return { name: 'Time-block Completion Log', schema: 'TEXT', required: true };
    if (n === 15) return { name: 'Meeting Notes', schema: 'TEXT', required: true };
    if (n === 16) return { name: '1:1 Notes', schema: 'TEXT', required: true };
    if (n === 18) return { name: 'Published Document', schema: 'DOCUMENT', required: true };
    if (n === 5) return { name: 'Team Engagement Record', schema: 'TEXT', required: true };
    return { name: 'Communication Outcome Note', schema: 'TEXT', required: true };
  }
  if (fa === 'CEREMONY') {
    return { name: 'Ceremony Summary', schema: 'DOCUMENT', required: true };
  }
  if (fa === 'DMAIC') {
    return { name: `DMAIC Step ${n} Artifact`, schema: 'DOCUMENT', required: true };
  }
  if (fa === 'KAIZEN') {
    return { name: `Kaizen Step ${n} Artifact`, schema: 'DOCUMENT', required: true };
  }
  return { name: 'Activity Output', schema: 'TEXT', required: true };
}

/**
 * §E.4 Default participants — by focus area + cadence.
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {string[]}
 */
function defaultParticipants(entry) {
  const fa = entry.focusArea;
  const n = entry.activityNumber;
  if (fa === 'CONTINUOUS_IMPROVEMENT') {
    if (n === 1 || n === 12 || n === 13) return ['Self'];
    if (n === 2 || n === 4 || n === 5) return ['Self', 'Team', 'Agile Facilitator'];
    return ['Self'];
  }
  if (fa === 'INNOVATION') {
    return ['Owner / Driver', 'Executive Sponsor'];
  }
  if (fa === 'COMMUNICATION') {
    if (n === 14 || n === 18) return ['Self'];
    if (n === 15) return ['Self', 'Team'];
    if (n === 16) return ['Self', 'Counterpart'];
    return ['Self'];
  }
  if (fa === 'CEREMONY') {
    return ['Team', 'Agile Facilitator'];
  }
  if (fa === 'DMAIC') {
    return ['Project Lead', 'Team'];
  }
  if (fa === 'KAIZEN') {
    return ['Kaizen Lead', 'Event Team', 'Process Owner'];
  }
  return ['Self'];
}

/**
 * §E.1 Default cadence for entries where the activityNumber-map doesn't
 * cover them (DMAIC, Kaizen, skeletons, ceremonies).
 */
function defaultCadence(entry) {
  if (entry.focusArea === 'DMAIC' || entry.focusArea === 'KAIZEN') return 'EVENT_DRIVEN';
  if (entry.focusArea === 'CEREMONY') return 'SPRINT';
  if (entry.focusArea === 'INNOVATION') return 'ON_SIGNAL';
  return 'WEEKLY';
}

/**
 * Apply §E bulk-fill defaults to all drafts. Fills only fields that are
 * `null` on the draft — preserves §A–§D content from fillGaps and any
 * catalog-author overrides.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyBulkFill(drafts) {
  return drafts.map((d) => {
    const out = { ...d };

    if (out.cadence === null || out.cadence === undefined) {
      out.cadence = CADENCE_BY_NUMBER[out.activityNumber] ?? defaultCadence(out);
    }

    if (out.trigger === null || out.trigger === undefined) {
      out.trigger = DEFAULT_TRIGGER_BY_CADENCE[out.cadence] ?? 'Prior activity complete';
    }

    if (out.inputs === null || out.inputs === undefined) {
      out.inputs = defaultInputs(out);
    }

    if (out.outputArtifact === null || out.outputArtifact === undefined) {
      out.outputArtifact = defaultOutputArtifact(out);
    }

    if (out.participants === null || out.participants === undefined) {
      out.participants = defaultParticipants(out);
    }

    // appliesToRoles bulk default: all roles unless ceremony (Facilitator-led).
    if (out.appliesToRoles === null || out.appliesToRoles === undefined) {
      out.appliesToRoles =
        out.focusArea === 'CEREMONY'
          ? ['FACILITATOR', 'LEADER', 'PRACTITIONER']
          : ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'];
    }

    // dependsOn / projectTypeBinding / phaseBinding: initialize empty/null.
    if (out.dependsOn === null || out.dependsOn === undefined) out.dependsOn = [];
    if (out.projectTypeBinding === undefined) out.projectTypeBinding = null;
    if (out.phaseBinding === undefined) out.phaseBinding = null;

    // isNonOptional defaults to false (markNonOptional flips the locked set).
    if (out.isNonOptional === null || out.isNonOptional === undefined) {
      out.isNonOptional = false;
    }

    return out;
  });
}

/** Exposed for tests. */
export const _CADENCE_BY_NUMBER = CADENCE_BY_NUMBER;
export const _DEFAULT_TRIGGER_BY_CADENCE = DEFAULT_TRIGGER_BY_CADENCE;

export default applyBulkFill;
