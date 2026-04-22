/**
 * OpportunityIntakeForm — Sprint 7 P0-T6.
 *
 * Pure render. Modal that opens from the "New Opportunity" button on the
 * Portfolio page. Collects title + problem + scope + proposedProjectType
 * and submits via OPP_SUBMIT_INTAKE.
 *
 * UI copy for the ProjectType help text comes from GLOSSARY §2.
 *
 * Events:
 *   OPP_SUBMIT_INTAKE   — form submit with {userId}
 *   OPP_CANCEL_INTAKE   — "Discard" button / backdrop close
 *
 * Validation: client-side min/max shown in counters. Service re-validates
 * on create() so the UI is convenience, not authority.
 */

import { esc } from '../mount.js';
import { ProjectType } from '../../domain/types.js';
import {
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  PROBLEM_MIN_LENGTH,
  PROBLEM_MAX_LENGTH,
  SCOPE_MAX_LENGTH
} from '../../services/OpportunityService.js';

/**
 * Help-text one-liners per project type. Derived from GLOSSARY §2.
 */
export const PROJECT_TYPE_HELP = Object.freeze({
  DMAIC: 'Six Sigma 5-phase improvement. Pick when the problem is complex and variation needs to be reduced with data.',
  KAIZEN_EVENT: 'Focused 1-5 day burst with a cross-functional team. Pick for tactical, scoped wins.',
  KAIZEN_EVENT_90D: '90-day Kaizen event: Pre-Event, Event, Post-Event, Sustain. Pick for enterprise-scale changes needing sustainment.',
  KAIZEN_ACCELERATOR_30D: '30-day structured sprint across 5 phases. Pick when you want a fast, phased path from signal to Control.',
  AD_HOC: 'Lightweight, un-phased improvement. Pick when you just need a PDCA loop with a target close date.'
});

/**
 * @param {{
 *   title?: string,
 *   problemStatement?: string,
 *   scope?: string,
 *   proposedProjectType?: string,
 *   errorName?: string|null,
 *   errorMessage?: string|null
 * }} props
 * @returns {string}
 */
export function OpportunityIntakeForm(props = {}) {
  const title = typeof props.title === 'string' ? props.title : '';
  const problemStatement =
    typeof props.problemStatement === 'string' ? props.problemStatement : '';
  const scope = typeof props.scope === 'string' ? props.scope : '';
  const proposedProjectType =
    typeof props.proposedProjectType === 'string'
      ? props.proposedProjectType
      : ProjectType.AD_HOC;
  const errorName = props.errorName ?? null;
  const errorMessage = props.errorMessage ?? null;

  const titleOk = title.length >= TITLE_MIN_LENGTH && title.length <= TITLE_MAX_LENGTH;
  const problemOk =
    problemStatement.length >= PROBLEM_MIN_LENGTH &&
    problemStatement.length <= PROBLEM_MAX_LENGTH;
  const scopeOk = scope.length <= SCOPE_MAX_LENGTH;
  const submitDisabled =
    !titleOk || !problemOk || !scopeOk ? 'disabled aria-disabled="true"' : '';

  const errorBlock = errorName
    ? `<p class="oif-error" role="alert">${esc(errorName)}: ${esc(errorMessage ?? '')}</p>`
    : '';

  const projectTypeOptions = Object.values(ProjectType)
    .map((pt) => {
      const selected = pt === proposedProjectType ? 'selected' : '';
      return `<option value="${esc(pt)}" ${selected}>${esc(pt)}</option>`;
    })
    .join('\n');

  const helpText = PROJECT_TYPE_HELP[proposedProjectType] ?? '';

  return `<section class="oif-modal" role="dialog" aria-modal="true" data-dialog="opportunity-intake">
  <form class="oif-form" data-action="OPP_SUBMIT_INTAKE" data-payload='{}'>
    <header class="oif-header">
      <h2 class="oif-title">Capture an opportunity</h2>
      <p class="oif-subhead">A 60-second intake. Title, problem, optional scope, and the project type you think fits.</p>
    </header>
    ${errorBlock}
    <label class="oif-label">Title
      <input type="text" class="oif-input" name="title" minlength="${TITLE_MIN_LENGTH}" maxlength="${TITLE_MAX_LENGTH}" placeholder="What's the headline?" value="${esc(title)}" required />
      <span class="oif-counter ${titleOk ? 'oif-counter-ok' : 'oif-counter-bad'}">${esc(String(title.length))} / ${esc(String(TITLE_MAX_LENGTH))}</span>
    </label>
    <label class="oif-label">Problem statement
      <textarea class="oif-textarea" name="problemStatement" minlength="${PROBLEM_MIN_LENGTH}" maxlength="${PROBLEM_MAX_LENGTH}" rows="4" placeholder="Describe the gap or pain. Specific is better than vague." required>${esc(problemStatement)}</textarea>
      <span class="oif-counter ${problemOk ? 'oif-counter-ok' : 'oif-counter-bad'}">${esc(String(problemStatement.length))} / ${esc(String(PROBLEM_MAX_LENGTH))}</span>
    </label>
    <label class="oif-label">Scope (optional)
      <textarea class="oif-textarea" name="scope" maxlength="${SCOPE_MAX_LENGTH}" rows="2" placeholder="What's in-scope? What's explicitly out-of-scope?">${esc(scope)}</textarea>
      <span class="oif-counter ${scopeOk ? 'oif-counter-ok' : 'oif-counter-bad'}">${esc(String(scope.length))} / ${esc(String(SCOPE_MAX_LENGTH))}</span>
    </label>
    <label class="oif-label">Proposed project type
      <select class="oif-select" name="proposedProjectType" required>
        ${projectTypeOptions}
      </select>
      <span class="oif-help">${esc(helpText)}</span>
    </label>
    <footer class="oif-footer">
      <button type="button" class="oif-cancel" data-action="OPP_CANCEL_INTAKE" data-payload='{}'>Discard</button>
      <button type="submit" class="oif-submit" ${submitDisabled}>Capture Opportunity</button>
    </footer>
  </form>
</section>`;
}

export default OpportunityIntakeForm;
