/**
 * WeeklyReflectionWizard — Sprint 6 P1-T1.
 *
 * Pure render. A four-step wizard that walks the user through promoting a
 * friction cluster into a DRAFT Kaizen.
 *
 *   STEP 1 — Pre-read: top OPEN+CLUSTERED signals from this week, grouped
 *            by tag, sorted by count desc.
 *   STEP 2 — Pick a cluster (auto-highlight highest). User may choose
 *            "none" to dismiss the wizard.
 *   STEP 3 — Write problem statement, title, goal statement.
 *   STEP 4 — Confirm + submit → KaizenService.promote().
 *
 * Delegated actions:
 *   WRW_NEXT               advance to next step
 *   WRW_BACK               go back
 *   WRW_PICK_CLUSTER       payload {tag}
 *   WRW_SUBMIT             form submit on step 3 (inputs) → promote
 *   WRW_CLOSE              dismiss the wizard
 */

import { esc } from '../mount.js';
import { FRICTION_TAG_LABELS } from './ReflectionSheet.js';

/** Lookup tag label by code (falls back to the code). */
function labelForTag(code) {
  const hit = FRICTION_TAG_LABELS.find((t) => t.code === code);
  return hit ? hit.label : code ?? '';
}

/**
 * @param {{
 *   step?: 1|2|3|4,
 *   clusters?: {tag: string, count: number, signalIds: string[]}[],
 *   selectedTag?: string|null,
 *   title?: string,
 *   problemStatement?: string,
 *   goalStatement?: string,
 *   errorName?: string|null
 * }} props
 * @returns {string}
 */
export function WeeklyReflectionWizard(props = {}) {
  const step = Number.isInteger(props.step) ? props.step : 1;
  const clusters = Array.isArray(props.clusters) ? props.clusters : [];
  const selectedTag = props.selectedTag ?? null;
  const title = props.title ?? '';
  const problemStatement = props.problemStatement ?? '';
  const goalStatement = props.goalStatement ?? '';
  const errorName = props.errorName ?? null;

  const payload = esc(
    JSON.stringify({ step, selectedTag: selectedTag ?? null })
  );

  let body;
  if (step === 1) body = renderStep1(clusters);
  else if (step === 2) body = renderStep2(clusters, selectedTag);
  else if (step === 3)
    body = renderStep3({ title, problemStatement, goalStatement, selectedTag });
  else body = renderStep4({ selectedTag, clusters, title, problemStatement, goalStatement });

  const errorBanner = errorName
    ? `<p class="wrw-error" role="alert">Could not promote: ${esc(errorName)}</p>`
    : '';

  return `<section class="wrw-modal" role="dialog" aria-modal="true" data-dialog="weekly-reflection-wizard" data-step="${esc(String(step))}">
  <header class="wrw-header">
    <h2 class="wrw-title">Weekly Reflection · Step ${esc(String(step))} of 4</h2>
    <button type="button" class="wrw-close" data-action="WRW_CLOSE" aria-label="Close">×</button>
  </header>
  ${errorBanner}
  <div class="wrw-body">
    ${body}
  </div>
  <footer class="wrw-footer">
    ${step > 1 ? `<button type="button" class="wrw-back" data-action="WRW_BACK" data-payload='${payload}'>Back</button>` : ''}
    ${step < 4 ? `<button type="button" class="wrw-next" data-action="WRW_NEXT" data-payload='${payload}'>Next</button>` : ''}
    ${step === 4 ? `<button type="button" class="wrw-submit" data-action="WRW_SUBMIT" data-payload='${payload}'>Promote to Kaizen</button>` : ''}
  </footer>
</section>`;
}

/** Step 1 — pre-read. */
function renderStep1(clusters) {
  if (!clusters.length) {
    return `<p class="wrw-empty">No friction signals in the last 7 days. Nothing to cluster.</p>`;
  }
  const items = clusters
    .slice(0, 5)
    .map(
      (c) => `<li class="wrw-cluster-item">
        <span class="wrw-cluster-tag">${esc(labelForTag(c.tag))}</span>
        <span class="wrw-cluster-count">${esc(String(c.count))}</span>
      </li>`
    )
    .join('');
  return `<section class="wrw-step1">
    <h3>Top friction clusters this week</h3>
    <ul class="wrw-cluster-list">${items}</ul>
  </section>`;
}

/** Step 2 — pick cluster. */
function renderStep2(clusters, selectedTag) {
  if (!clusters.length) {
    return `<p class="wrw-empty">No clusters to pick. Close the wizard.</p>`;
  }
  const auto = clusters[0]?.tag ?? null;
  const pick = selectedTag ?? auto;
  const items = clusters
    .map((c) => {
      const selected = pick === c.tag ? 'aria-selected="true" class="wrw-cluster-option wrw-selected"' : 'class="wrw-cluster-option"';
      const rowPayload = esc(JSON.stringify({ tag: c.tag }));
      return `<li ${selected}>
        <button type="button" data-action="WRW_PICK_CLUSTER" data-payload='${rowPayload}'>
          <strong>${esc(labelForTag(c.tag))}</strong>
          <span class="wrw-cluster-count">${esc(String(c.count))}</span>
        </button>
      </li>`;
    })
    .join('');
  return `<section class="wrw-step2">
    <h3>Pick a cluster to promote</h3>
    <ul class="wrw-cluster-pick">${items}</ul>
    <p class="wrw-hint">Selected: <strong>${esc(pick ? labelForTag(pick) : 'none')}</strong></p>
  </section>`;
}

/** Step 3 — write problem + title + goal. */
function renderStep3({ title, problemStatement, goalStatement, selectedTag }) {
  return `<section class="wrw-step3">
    <h3>Describe the improvement</h3>
    <p class="wrw-hint">Cluster: <strong>${esc(selectedTag ? labelForTag(selectedTag) : 'none')}</strong></p>
    <form class="wrw-form" data-action="WRW_NEXT">
      <label class="wrw-label">Title
        <input type="text" class="wrw-input" name="title" value="${esc(title)}" placeholder="Short headline" required />
      </label>
      <label class="wrw-label">Problem statement (min 10 chars)
        <textarea class="wrw-text" name="problemStatement" rows="3" minlength="10" required>${esc(problemStatement)}</textarea>
      </label>
      <label class="wrw-label">Goal statement
        <textarea class="wrw-text" name="goalStatement" rows="2" placeholder="Baseline X → target Y by date Z">${esc(goalStatement)}</textarea>
      </label>
    </form>
  </section>`;
}

/** Step 4 — confirm. */
function renderStep4({ selectedTag, clusters, title, problemStatement, goalStatement }) {
  const cluster = clusters.find((c) => c.tag === selectedTag) ?? clusters[0];
  return `<section class="wrw-step4">
    <h3>Confirm</h3>
    <dl class="wrw-confirm">
      <dt>Cluster</dt><dd>${esc(cluster ? `${labelForTag(cluster.tag)} (${cluster.count} signals)` : '—')}</dd>
      <dt>Title</dt><dd>${esc(title)}</dd>
      <dt>Problem</dt><dd>${esc(problemStatement)}</dd>
      <dt>Goal</dt><dd>${esc(goalStatement || '(can be filled after baseline)')}</dd>
    </dl>
    <p class="wrw-confirm-hint">Submitting will create a DRAFT Kaizen and flip the ${cluster?.count ?? 0} friction signal${(cluster?.count ?? 0) === 1 ? '' : 's'} to PROMOTED.</p>
  </section>`;
}

export default WeeklyReflectionWizard;
