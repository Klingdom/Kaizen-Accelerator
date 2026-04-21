/**
 * Seed: apply CATALOG_GAPS §A–§D content fills (E2-T4).
 *
 * Input: the 49 draft entries from `parseSource50` (rows 1..16, 18, 19, 20,
 * 21..50). Rows 19 and 20 arrive as skeletons (`defaultDurationMinutes=null`
 * + `procedure=null`); rows 23–28, 30–31, 33, 35–36, 38–43, 49–50 arrive
 * with empty / shallow procedures. This step applies the §A–§D approved
 * content to fill those gaps.
 *
 * Fields set here:
 *   - defaultDurationMinutes  (when missing)
 *   - procedure               (ordered step list)
 *   - cadence / trigger       (approved per §A–§D where specified)
 *   - inputs                  (approved defaults)
 *   - outputArtifact          (approved artifact)
 *   - participants            (approved)
 *
 * Rows NOT in §A–§D are returned unchanged; §E bulkFill covers the rest.
 *
 * Pure function; no I/O.
 */

/**
 * Fill-map keyed by `activityNumber`. Each value is a partial entry that
 * supersedes the draft's corresponding fields. An explicit `null` in the
 * draft overrides with the mapped value; absent fields in the map are left
 * untouched.
 */
const FILLS = Object.freeze({
  // -- §A (missing hours AND procedure) -------------------------------------
  19: {
    defaultDurationMinutes: 120, // 2.0h, matches sibling #18
    cadence: 'SPRINT',
    trigger: 'Mid-Sprint Review (Fri Wk1) OR program-plan-drift signal',
    inputs: [
      'Current Program Plan',
      'Sprint backlog',
      'Stakeholder feedback',
      'Latest OKR snapshot'
    ],
    outputArtifact: {
      name: 'Updated Program Plan',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Program Manager', 'Product Owner'],
    procedure: [
      'a. Open current Program Plan and latest sprint outcomes.',
      'b. Identify gaps: slipped milestones, changed scope, new dependencies, resource shifts.',
      'c. Incorporate stakeholder feedback from last week\'s 1:1s and reviews.',
      'd. Update milestone dates, owners, and dependency links.',
      'e. Note the diff in a short changelog block.',
      'f. Publish updated plan to team channel.'
    ]
  },
  20: {
    defaultDurationMinutes: 120, // 2.0h per §A.4
    cadence: 'EVENT_DRIVEN',
    trigger: 'Decision to launch a DMAIC project after Kaizen / variance analysis',
    inputs: [
      'Opportunity or problem statement',
      'Sponsor commitment',
      'Proposed process owner'
    ],
    outputArtifact: {
      name: 'Signed DMAIC Charter',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Process Owner', 'Sponsor', 'CI Champion'],
    procedure: [
      'a. Write the problem statement in one paragraph.',
      'b. Document the business case (current cost / risk, expected benefit).',
      'c. Define in-scope and out-of-scope process boundaries.',
      'd. Identify Process Owner, Sponsor, Project Lead, and team members.',
      'e. Set goal statement: baseline X → target Y by date Z.',
      'f. Estimate sprint count (typical DMAIC: 6–8 sprints).',
      'g. Identify top 3 risks and initial mitigations.',
      'h. Obtain Sponsor signature.',
      'i. Register Charter in project portfolio.'
    ]
  },

  // -- §B (procedure says "Missing") ----------------------------------------
  23: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'DMAIC Charter signed',
    inputs: ['DMAIC Charter (#20)', 'Org chart', 'Process partner list'],
    outputArtifact: {
      name: 'Stakeholder Map (2x2 Influence × Interest)',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', '1–2 senior team members'],
    procedure: [
      'a. List all stakeholders impacted by or influencing the project.',
      'b. For each, rate Influence (H/M/L) and Interest (H/M/L).',
      'c. Plot on 2x2 grid; assign quadrant engagement approach.',
      'd. Assign owner per quadrant.',
      'e. Document in Stakeholder Analysis template; feed into Communication Plan.'
    ]
  },
  24: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Stakeholder Analysis complete',
    inputs: ['Stakeholder Analysis (#23)', 'DMAIC Charter (#20)'],
    outputArtifact: {
      name: 'Communication Plan Matrix',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead'],
    procedure: [
      'a. Copy the four Stakeholder Analysis quadrants into the Comm Plan matrix.',
      'b. For each row define cadence, channel, format, owner.',
      'c. Write an acceptance criterion per row.',
      'd. Book recurring calendar holds for every synchronous touchpoint.',
      'e. Publish and revisit at each Sprint Retrospective.'
    ]
  },
  25: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-Charter; refresh at each Sprint Retrospective',
    inputs: ['DMAIC Charter (#20)', 'SIPOC (#21)'],
    outputArtifact: {
      name: 'Risk Register',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Team'],
    procedure: [
      'a. Brainstorm risks in four buckets: technical, organizational, timeline, resource.',
      'b. For each risk rate Probability (1–5) × Impact (1–5).',
      'c. For score ≥ 12 write a mitigation plan and assign a risk owner.',
      'd. For score 6–11 write a monitoring plan.',
      'e. Record in Risk Register template.',
      'f. Review at every Sprint Retrospective.'
    ]
  },
  26: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-Charter',
    inputs: ['Stakeholder Analysis (#23)', 'Customer data sources'],
    outputArtifact: {
      name: 'VOC / VOB / VOA Document with CTQs',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Customers', 'Business leaders', 'Associates'],
    procedure: [
      'a. Voice of Customer: interview 3–5 customers.',
      'b. Voice of Business: interview 2–3 business leaders.',
      'c. Voice of Associate: interview 3–5 associates.',
      'd. Translate each raw voice into a CTQ requirement.',
      'e. Prioritize CTQs by frequency, severity, strategic fit.',
      'f. Document and feed into Output DCP (#22) and C&E Matrix (#34).'
    ]
  },
  42: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Kaizen candidate approved for event',
    inputs: ['Promoted Kaizen candidate', 'Process owner commitment'],
    outputArtifact: {
      name: 'Signed Kaizen Charter',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Kaizen Lead', 'Process Owner', 'Sponsor'],
    procedure: [
      'a. State problem in one paragraph with scope and pain observed.',
      'b. Document business case.',
      'c. Define event scope.',
      'd. Set goal statement: baseline X → target Y by event end + 30 days.',
      'e. Identify event team: Lead, Process Owner, SMEs, Sponsor.',
      'f. Schedule event window.',
      'g. Identify top 3 risks.',
      'h. Obtain Sponsor signature.'
    ]
  },
  50: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Kaizen Results Narrative complete AND remeasured metric captured',
    inputs: [
      'Kaizen Results Narrative (#49)',
      'Implemented Improvements (#48)',
      'Control Chart (#29 pattern)'
    ],
    outputArtifact: {
      name: 'Signed Transition Document',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Kaizen Lead', 'Process Owner'],
    procedure: [
      'a. Walk Process Owner through each implemented improvement and its performance vs baseline.',
      'b. Confirm control measures: updated SOP, Control Chart thresholds, rollback plan.',
      'c. Transfer ownership of ongoing monitoring.',
      'd. Schedule 30/60/90-day Process Owner check-ins.',
      'e. Both parties sign; file with Kaizen record.',
      'f. Kaizen Lead steps back.'
    ]
  },

  // -- §C (template-link-only rows) -----------------------------------------
  22: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-SIPOC, before Baseline (#28)',
    inputs: ['DMAIC SIPOC (#21)', 'VOC/VOB/VOA with CTQs (#26)'],
    outputArtifact: {
      name: 'Output Data Collection Plan',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Team'],
    procedure: [
      'a. List CTQ output metrics (Y\'s) from VOC/VOB/VOA.',
      'b. For each metric document: operational definition, unit, method, sampling plan, owner, tool, storage.',
      'c. If measurement risk exists, run MSA (#31) before locking.',
      'd. Pilot DCP for one cycle.',
      'e. Lock DCP and proceed to Baseline (#28).'
    ]
  },
  27: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-Baseline (#28)',
    inputs: ['Output DCP data (#22)', 'Financial Benefit Translator (#39)'],
    outputArtifact: {
      name: 'Reporting Dashboard Link',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Analytics partner'],
    procedure: [
      'a. Define reporting cadence (weekly or monthly).',
      'b. Select metrics: baseline, current, target, delta, trend, sigma, financial.',
      'c. Build dashboard linked to DCP data source.',
      'd. Assign owner and monthly review slot.',
      'e. Publish link per Communication Plan (#24).'
    ]
  },
  28: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Output DCP locked',
    inputs: ['Locked Output DCP (#22)', 'MSA report (#31) if applicable'],
    outputArtifact: {
      name: 'Baseline Dataset + Summary Statistics',
      schema: 'NUMERIC',
      required: true
    },
    participants: ['Project Lead'],
    procedure: [
      'a. Execute DCP for baseline period (30 working days or 30 samples).',
      'b. Collect data per plan; log deviations.',
      'c. If manual measurement, verify with MSA (#31).',
      'd. Compute summary statistics: n, mean, median, stdev, min, max, Cp/Cpk, sigma.',
      'e. Build baseline Control Chart (#29).',
      'f. Record baseline value in Charter as locked reference.'
    ]
  },
  39: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Baseline complete (projection) OR post-improvement (actual)',
    inputs: ['Baseline data (#28)', 'Projected or actual post-improvement performance', 'Unit cost data'],
    outputArtifact: {
      name: 'Financial Benefit Document',
      schema: 'NUMERIC',
      required: true
    },
    participants: ['Project Lead', 'Finance partner'],
    procedure: [
      'a. Identify benefit categories: hard-dollar, revenue lift, quality/rework, risk avoidance.',
      'b. Quantify current cost / loss per period at baseline.',
      'c. Project post-improvement cost / loss at target.',
      'd. Compute annualized net benefit = 12 × monthly delta.',
      'e. Apply confidence rating: Hard / Soft / Cost Avoidance.',
      'f. Obtain Finance-partner sign-off.',
      'g. Register in portfolio benefits ledger.'
    ]
  },
  43: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Event start',
    inputs: ['Kaizen Charter (#42)', 'Event SIPOC (#45)'],
    outputArtifact: {
      name: 'Kaizen DCP Document',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Kaizen Lead', 'Team'],
    procedure: [
      'a. List the 1–3 CTQ output metrics from the Kaizen Charter goal.',
      'b. For each metric document: operational definition, method, pre/post sampling plan, owner, tool.',
      'c. If measurement is subjective, run a quick 3-appraiser MSA on 5 samples.',
      'd. Execute pre-event collection on Day 1.',
      'e. Schedule post-event collection at event end + 30 days.',
      'f. Store DCP alongside Charter.'
    ]
  },
  49: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-remeasurement (event + 30 days)',
    inputs: ['Baseline (#43)', 'Implemented improvements (#48)', 'Remeasurement', 'Financial Benefit'],
    outputArtifact: {
      name: '3-Page Kaizen Results Narrative',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Kaizen Lead'],
    procedure: [
      'a. Page 1 — Problem & Goal: statement, baseline, goal, team, dates, owner.',
      'b. Page 2 — What Was Done: improvements, before/after diagrams, C&E/FMEA insights.',
      'c. Page 3 — Results: remeasured metric, delta, secondary metrics, financial benefit, lessons.',
      'd. Publish to Kaizen portfolio.'
    ]
  },

  // -- §D (hours present, procedure blank) ----------------------------------
  30: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Baseline data locked',
    inputs: ['Baseline data (#28)', 'USL / LSL from CTQ'],
    outputArtifact: {
      name: 'Capability Report (Cp/Cpk/Pp/Ppk)',
      schema: 'NUMERIC',
      required: true
    },
    participants: ['Project Lead'],
    procedure: [
      'a. Verify data normality (histogram + Anderson-Darling).',
      'b. Define spec limits (USL / LSL).',
      'c. Calculate short-term capability: Cp, Cpk.',
      'd. Calculate long-term performance: Pp, Ppk.',
      'e. Compute DPMO and process sigma.',
      'f. Flag if Cpk < 1.33.'
    ]
  },
  31: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Output DCP drafted; before locking',
    inputs: ['Measurement system definition', '10 samples', '2–3 appraisers'],
    outputArtifact: {
      name: 'MSA Report with Gage R&R',
      schema: 'NUMERIC',
      required: true
    },
    participants: ['Project Lead', '2–3 appraisers'],
    procedure: [
      'a. Select 10 samples covering the expected process range.',
      'b. 2–3 appraisers measure each sample 2–3 times randomized.',
      'c. Compute Gage R&R (repeatability + reproducibility).',
      'd. Acceptance: <10% excellent; 10–30% marginal; >30% unacceptable.',
      'e. If unacceptable, fix and re-run MSA.',
      'f. Document results and decision.'
    ]
  },
  33: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Quick-win candidate identified (lead < 1w, cost < $1K, effort < 2 person-days)',
    inputs: ['Process Maps (#32)', 'VOC insights (#26)', 'Team observations'],
    outputArtifact: {
      name: 'Quick Wins Log with before/after',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Team', 'Process Owner'],
    procedure: [
      'a. Filter: lead < 1 week AND cost < $1K AND effort < 2 pd AND reversible.',
      'b. Get Process Owner approval.',
      'c. Implement change.',
      'd. Measure impact before and after (≥ 5 observations each).',
      'e. Log: name, hypothesis, delta, decision.',
      'f. Feed kept wins into Improvement Backlog (#38).'
    ]
  },
  35: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Post-C&E Matrix, before Correlation / Regression (#36)',
    inputs: ['C&E Matrix (#34)', 'Prioritized X variables'],
    outputArtifact: {
      name: 'Input DCP Filled',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Team'],
    procedure: [
      'a. Take top-scored X variables from C&E Matrix (4–6 inputs).',
      'b. For each X document: operational definition, method, sampling plan, owner, tool.',
      'c. For each X-Y pair confirm the time-stamp join key.',
      'd. If any X is subjective/manual, run MSA (#31) for that X.',
      'e. Pilot for one cycle; fix and re-pilot if n < 80%.',
      'f. Lock the Input DCP.',
      'g. Execute for min 30 paired X-Y observations.'
    ]
  },
  36: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Input DCP data collected (min 30 paired observations)',
    inputs: ['Input DCP data (#35)', 'Output DCP data (#22)'],
    outputArtifact: {
      name: 'Correlation + Regression Report',
      schema: 'NUMERIC',
      required: true
    },
    participants: ['Project Lead', 'Analytics partner'],
    procedure: [
      'a. Load paired X and Y data.',
      'b. Pairwise correlation matrix; note |r| > 0.4.',
      'c. Fit regression; escalate as diagnostics warrant.',
      'd. Check R² (> 0.7), p-values (< 0.05), residual plots.',
      'e. Identify vital few X\'s.',
      'f. Document model and leverage points.',
      'g. Feed vital X\'s into FMEA (#37).'
    ]
  },
  38: {
    cadence: 'SPRINT',
    trigger: 'Post-FMEA or at each sprint boundary',
    inputs: ['FMEA (#37)', 'Quick Wins pending (#33)', 'VOC gaps (#26)', 'Retro action items'],
    outputArtifact: {
      name: 'Prioritized Improvement Backlog',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead', 'Process Owner'],
    procedure: [
      'a. Aggregate improvement candidates from FMEA, Quick Wins pending, VOC gaps, retro actions.',
      'b. For each: name, one-sentence description, Day-2-Done criteria, effort, impact.',
      'c. Score priority (RICE / WSJF / Impact × Confidence ÷ Effort).',
      'd. Publish prioritized list to Sprint Planning.',
      'e. Carry unfinished items forward.'
    ]
  },
  41: {
    cadence: 'EVENT_DRIVEN',
    trigger: 'Control phase complete, Financial Benefit signed off',
    inputs: [
      'Baseline data (#28)',
      'Implemented improvements (#40)',
      'Remeasured data',
      'Control Chart (#29)',
      'Financial Benefit (#39)'
    ],
    outputArtifact: {
      name: 'DMAIC Project Results Narrative',
      schema: 'DOCUMENT',
      required: true
    },
    participants: ['Project Lead'],
    procedure: [
      'a. Executive summary: problem → result → annualized benefit.',
      'b. Background: business case, scope, goal.',
      'c. Results: baseline vs remeasured, Control Chart before/after.',
      'd. Root cause findings: vital X\'s, FMEA failure modes addressed.',
      'e. Implemented improvements with before/after.',
      'f. Financial benefit with confidence.',
      'g. Control plan: ongoing monitoring, SOPs, Process Owner.',
      'h. Lessons learned.',
      'i. Review with Sponsor and file in portfolio.'
    ]
  }
});

/**
 * Deep-merge the fill into the draft. Array + object values overwrite wholesale
 * (no nested merging). Primitive fields only replace when the draft value is
 * null (so existing parser-derived fields like `procedure` or
 * `defaultDurationMinutes` are not clobbered unless the draft left them null).
 *
 * @param {object} draft
 * @param {object} fill
 * @returns {object}
 */
function applyFill(draft, fill) {
  const out = { ...draft };
  for (const [k, v] of Object.entries(fill)) {
    if (out[k] === null || out[k] === undefined) {
      out[k] = v;
    } else if (Array.isArray(out[k]) && out[k].length === 0) {
      out[k] = v;
    } else if (k === 'procedure' && Array.isArray(out[k]) && out[k].length === 0) {
      out[k] = v;
    } else {
      // If the draft already has a non-empty value (e.g. parser-extracted
      // procedure for rows that had steps in source), keep it.
      // But for the non-content metadata fields (cadence, trigger, inputs,
      // outputArtifact, participants), the draft is always null from the
      // parser — so fills land for those.
    }
  }
  return out;
}

/**
 * Apply §A–§D fills to the draft list. Drafts not in FILLS pass through
 * unchanged. The output has all content-gap rows populated to the
 * standard required by PRODUCT_BLUEPRINT §3.1 (9-field minimum).
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyFillGaps(drafts) {
  return drafts.map((d) => {
    const fill = FILLS[d.activityNumber];
    return fill ? applyFill(d, fill) : d;
  });
}

/** List of activityNumbers that have fills applied (for test introspection). */
export const FILLED_ACTIVITY_NUMBERS = Object.freeze(
  Object.keys(FILLS)
    .map((n) => Number.parseInt(n, 10))
    .sort((a, b) => a - b)
);

export default applyFillGaps;
