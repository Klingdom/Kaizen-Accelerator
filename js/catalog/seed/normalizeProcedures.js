/**
 * Seed: normalize procedure step numbering + fill in missing procedures
 * (user request 2026-04-23).
 *
 * Two responsibilities:
 *
 * 1. **Renumber existing procedures.** The source document (`docs/Business
 *    Agility Standard Work.txt`) uses a mixed letter/roman-numeral scheme
 *    (`a.`, `b.`, `i.`, `ii.`, `vii.`, `1.`) with embedded sub-steps and
 *    occasional duplicate prefixes. The user wants a flat, sequentially
 *    numbered list (`1. 2. 3.`). Every procedure is re-prefixed regardless
 *    of its original scheme so the whole catalog reads consistently.
 *
 * 2. **Fill in procedures for 11 entries that the parser couldn't capture.**
 *    The SIPOC / C&E / FMEA / Control Chart entries (#21, #29, #34, #37,
 *    #45, #46, #47) use asterisk-prefixed facilitator-guide steps that
 *    `source50.js` skips. The Communication entries (#14, #15, #16, #18)
 *    never had procedure steps in the source document. We author
 *    procedures inline here so every card has actionable steps.
 *
 * Pure function; no I/O.
 */

/**
 * Strip any existing leading prefix (letter, roman numeral, or digit +
 * punctuation) from a procedure line. Preserves everything after the
 * first whitespace that follows the prefix.
 *
 * @param {string} raw
 * @returns {string}
 */
export function stripPrefix(raw) {
  if (typeof raw !== 'string') return '';
  // Letter or roman numeral (i, ii, iii, iv, v, vi, vii, viii, ix, x) or
  // plain digit, followed by . or ) and whitespace. Case-insensitive.
  return raw.replace(/^\s*(?:[a-z]+|\d+)[.)]\s*/i, '').trim();
}

/**
 * Rewrite in-body references like `step d` or `step D.` to the ordinal
 * number (`step 4`). The source document used letter-prefixed steps, so a
 * handful of procedure lines cross-reference earlier steps by letter. After
 * the top-level renumbering those letter references no longer match
 * anything visible in the UI.
 *
 * Mapping is a=1, b=2, c=3, d=4, ... which matches the position of a
 * top-level letter prefix because sub-lettered/roman sub-steps in the
 * source never appear before a top-level letter they reference.
 *
 * Only single-letter references are rewritten. Multi-character tokens
 * like `step iii` or `stepchild` are left alone (the `(?![a-z])` lookahead
 * and `\bstep\s+` anchor prevent those matches).
 *
 * @param {string} line
 * @returns {string}
 */
export function rewriteBodyLetterRefs(line) {
  if (typeof line !== 'string') return '';
  return line.replace(/\bstep\s+([a-z])\b(?![a-z])/gi, (_m, letter) => {
    const ord = letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    return `step ${ord}`;
  });
}

/**
 * Re-prefix a list of procedure steps with sequential `N. ` numbering,
 * and rewrite any in-body `step [letter]` references to ordinals.
 * Empty strings are dropped.
 *
 * @param {string[]} steps
 * @returns {string[]}
 */
export function renumber(steps) {
  if (!Array.isArray(steps)) return [];
  const cleaned = steps
    .map((s) => rewriteBodyLetterRefs(stripPrefix(s)))
    .filter((s) => s.length > 0);
  return cleaned.map((s, i) => `${i + 1}. ${s}`);
}

/**
 * Fill-in procedures for the 11 catalog entries that lacked steps in the
 * parsed source. Keyed by activityNumber. Each value is the pre-number
 * list; the pipeline below runs it through `renumber()` so the output is
 * `1. `, `2. `, ... automatically.
 *
 * @type {Record<number, string[]>}
 */
export const PROCEDURE_FILL_INS = Object.freeze({
  // --- Communications entries (#14-#16, #18) --------------------------------
  14: [
    'Block 60 minutes in the morning (09:00-10:00) and 30 minutes post-lunch (13:00-13:30) for high-value communication.',
    'Identify priority stakeholder messages and draft responses deliberately (not reactively).',
    'Work key project-related threads in email, Slack, and chat tools that require thoughtful reply.',
    'Close outstanding requests and confirm explicit follow-up dates.',
    'Log a short outcome note summarizing decisions made or blockers surfaced.'
  ],
  15: [
    'Identify recurring team and project meetings that require attendance this sprint.',
    'For each meeting, confirm the agenda and desired outcomes are published in advance.',
    'Target 20-minute or 50-minute meetings (respect natural break boundaries).',
    'Attend meetings prepared with the relevant context and reference documents.',
    'Capture decisions, action items, and owner / due-date assignments in real time.',
    'Publish notes to the team within 24 hours and follow up on open commitments.'
  ],
  16: [
    'Identify key stakeholders and peers needing one-on-one engagement this sprint.',
    'Schedule 20-minute 1:1 meetings, preferring Wednesdays and Thursdays.',
    'Prepare an agenda with 2-3 topics and an explicit desired outcome for the meeting.',
    'Conduct the meeting focused on relationship building and information exchange.',
    'Capture any action items and commit to a follow-up cadence.',
    'Track 1:1 effectiveness: cancellation rate, agenda completeness, outcome clarity.'
  ],
  18: [
    'Identify the document type (Backlog entry, Status Update, Blurb, Narrative, PRFAQ, MBR).',
    'Review the template and instructions specific to that document type.',
    'Draft the document in a single focused writing block — no switching.',
    'Self-review for clarity, completeness, and data accuracy.',
    'Circulate for peer review and incorporate feedback.',
    'Publish to the canonical location (Wiki, Tracker, shared drive) and notify stakeholders.'
  ],

  // --- DMAIC facilitator-led tools (#21, #29, #34, #37) ---------------------
  21: [
    'Type participant names into the SIPOC template.',
    'Instruct participants to list 3-7 high-level steps of the process based on their experience.',
    'Give participants 10-13 minutes to fill in their responses.',
    'Review each step with the team and translate responses into high-level steps (verb + noun).',
    'Group similar responses under consolidated process steps.',
    'Highlight the final 3-7 process steps on the canvas.',
    'Brainstorm Outputs for each process step (1-3 per step in 5-8 minutes).',
    'Brainstorm Inputs for each process step (3-7 per step in 5-8 minutes).',
    'Brainstorm Suppliers for each input (1-3 per input in 5-8 minutes).',
    'Consolidate the unique Suppliers, Inputs, Process Steps, Outputs, and Customers into the Final SIPOC.'
  ],
  29: [
    'Open the statistical tool (Minitab, JMP, or equivalent).',
    'Navigate to Stat > Control Charts > Variables Charts for Subgroups > Xbar.',
    'Complete the dialog box with the subgroup data and column references.',
    'Click Xbar Options, then open the Tests tab.',
    'Select "1 point > K standard deviations from center line" and enter 2.5.',
    'Select "K points in a row on same side of center line" and "K points in a row within 1 standard deviation of center line (either side)".',
    'Click OK in each dialog box to generate the Xbar chart with 2.5σ control limits.',
    'Review the chart for out-of-control points and document findings in the DMAIC workbook.'
  ],
  34: [
    'List every unique Input from the SIPOC down the Cause & Effect matrix rows.',
    'List every unique Output from the SIPOC across the matrix columns.',
    'Explain the purpose of Cause & Effect Analysis to the project team.',
    'Rate each Input against each Output on a 0, 1, 4, 9 scale.',
    'Review and align with the team on the final input-to-output ratings.',
    'Rate the importance of each Output to the customer on a 1-10 scale.',
    'Compute the weighted score for each Input (sum of rating × output-importance).',
    'Prioritize Inputs by weighted score; the top-ranked Inputs flow into the FMEA.'
  ],
  37: [
    'Bring the prioritized Inputs from the Cause & Effect Analysis into the FMEA template.',
    'Explain the purpose and scoring rules of each FMEA column to the team.',
    'Give participants 15-20 minutes to identify failure modes, effects, root causes, and recommended actions for each Input in their own tab.',
    'As a team, review Column B (failure modes) for each Input and remove duplicates.',
    'Discuss Column C (customer impact) for each failure mode and capture responses.',
    'Review Column D (root causes), remove duplicates, and clarify as needed.',
    'Identify Column E (current controls) preventing each failure.',
    'Review Column F (improvement actions); bold the ones the team commits to work.',
    'Transfer the bolded improvement actions to the Improvement Backlog.'
  ],

  // --- Kaizen facilitator-led tools (#45, #46, #47) -------------------------
  // These mirror the DMAIC versions but are authored standalone so each row
  // is self-contained for Kaizen-90 / 30-Day Accelerator teams.
  45: [
    'Type participant names into the Kaizen SIPOC template.',
    'Instruct participants to list 3-7 high-level steps of the process being kaizened.',
    'Give participants 10-13 minutes to respond.',
    'Translate responses into consolidated high-level steps (verb + noun).',
    'Highlight the final 3-7 process steps.',
    'Brainstorm Outputs for each process step (1-3 per step in 5-8 minutes).',
    'Brainstorm Inputs for each process step (3-7 per step in 5-8 minutes).',
    'Brainstorm Suppliers for each Input.',
    'Consolidate Suppliers, Inputs, Steps, Outputs, and Customers into the Final SIPOC.'
  ],
  46: [
    'List every unique Input from the Kaizen SIPOC as rows.',
    'List every unique Output from the Kaizen SIPOC as columns.',
    'Explain Cause & Effect scoring (0, 1, 4, 9) to the team.',
    'Rate each Input against each Output and align as a team.',
    'Rate each Output\'s importance to the customer on a 1-10 scale.',
    'Compute the weighted score per Input.',
    'Select the top-priority Inputs to move into the Kaizen FMEA.'
  ],
  47: [
    'Carry the prioritized Inputs from the Prioritized Inputs step into the Kaizen FMEA template.',
    'Explain the FMEA column scoring rules to the team.',
    'Give participants 15-20 minutes to identify failure modes, effects, root causes, and recommended actions per Input.',
    'Consolidate duplicate failure modes as a team.',
    'Capture customer impact for each failure mode.',
    'Review and consolidate root causes.',
    'List current controls that prevent each failure.',
    'Bold the improvement actions the team commits to executing during the event.',
    'Transfer committed actions to the Kaizen Improvement Backlog.'
  ]
});

/**
 * Apply procedure normalization to every draft:
 *   - If the entry has an activityNumber in `PROCEDURE_FILL_INS`, replace
 *     its procedure with the fill-in.
 *   - Otherwise, renumber whatever is already there.
 *
 * Either way, the output is sequentially numbered `1. ... 2. ... 3. ...`.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyProcedureNormalization(drafts) {
  return drafts.map((d) => {
    const fill = PROCEDURE_FILL_INS[d.activityNumber];
    const source = fill ?? (Array.isArray(d.procedure) ? d.procedure : []);
    return { ...d, procedure: renumber(source) };
  });
}

export default applyProcedureNormalization;
