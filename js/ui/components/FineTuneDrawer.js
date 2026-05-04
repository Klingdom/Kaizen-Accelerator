/**
 * FineTuneDrawer — Sprint 5 P1-T2.
 *
 * Pure render. Right-side drawer with 3 sliders:
 *   - Capacity today (240/360/480/600 min; default = User.dailyCapacityMinutes)
 *   - External meetings (0/30/60/90/120 min; default = 0)
 *   - Active project focus (select from current ACTIVE Kaizens; default = latest or "No focus")
 *
 * Per METHODOLOGY_RECOMMENDATION Q2: Fine-tune does NOT fire CycleEdited.
 * The drawer's changes are folded back as ComposerInput parameters and
 * `ComposerService.composeDaily()` is re-run; any in-progress PROPOSED
 * Composition is discarded and replaced.
 *
 * All interactions flow through data-action delegation:
 *   - CAPACITY_CHANGE           payload {minutes}
 *   - EXTERNAL_MEETINGS_CHANGE  payload {minutes}
 *   - PROJECT_FOCUS_CHANGE      payload {kaizenId | null}
 *   - FINE_TUNE_CANCEL          restore pre-drawer state
 *   - FINE_TUNE_APPLY           run composeDaily with new inputs
 *   - FINE_TUNE_TOGGLE          open/close the drawer
 */

import { esc } from '../mount.js';

export const CAPACITY_OPTIONS = Object.freeze([240, 360, 480, 600]);
export const EXTERNAL_OPTIONS = Object.freeze([0, 30, 60, 90, 120]);

/**
 * @param {{
 *   capacityMinutes: number,
 *   externalMinutesToday: number,
 *   activeKaizenId: string | null,
 *   availableKaizens?: Array<{id: string, title: string}>,
 *   open?: boolean
 * }} props
 * @returns {string}
 */
export function FineTuneDrawer(props = {}) {
  const capacity = Number(props.capacityMinutes ?? 480);
  const external = Number(props.externalMinutesToday ?? 0);
  const activeKaizenId = props.activeKaizenId ?? null;
  const available = Array.isArray(props.availableKaizens) ? props.availableKaizens : [];
  const open = !!props.open;

  const capacityRadios = CAPACITY_OPTIONS
    .map((m) => {
      const checked = m === capacity ? ' checked' : '';
      return `<label class="ftd-option">
        <input type="radio" name="capacity" value="${m}" data-action="CAPACITY_CHANGE" data-payload='${esc(JSON.stringify({ minutes: m }))}' ${checked} />
        ${m} min
      </label>`;
    })
    .join('\n');

  const externalRadios = EXTERNAL_OPTIONS
    .map((m) => {
      const checked = m === external ? ' checked' : '';
      return `<label class="ftd-option">
        <input type="radio" name="external" value="${m}" data-action="EXTERNAL_MEETINGS_CHANGE" data-payload='${esc(JSON.stringify({ minutes: m }))}' ${checked} />
        ${m} min
      </label>`;
    })
    .join('\n');

  // Project focus: render a <select>; default empty = "No focus".
  const noFocusSelected = activeKaizenId ? '' : ' selected';
  const kaizenOptions = available
    .map((k) => {
      const sel = k.id === activeKaizenId ? ' selected' : '';
      return `<option value="${esc(k.id)}"${sel}>${esc(k.title ?? k.id)}</option>`;
    })
    .join('\n');

  const classes = `ftd-drawer${open ? ' ftd-open' : ''}`;

  return `<aside class="${classes}" data-drawer="fine-tune" aria-hidden="${open ? 'false' : 'true'}" role="dialog"${open ? ' aria-modal="true"' : ''} aria-label="Fine-tune day capacity">
  <header class="ftd-header">
    <h2 class="ftd-title">Fine-tune today</h2>
    <button type="button" class="ftd-close" data-action="FINE_TUNE_TOGGLE" aria-label="Close">&times;</button>
  </header>
  <section class="ftd-section" aria-label="Capacity today">
    <h3>Capacity today</h3>
    <div class="ftd-radios">
${capacityRadios}
    </div>
  </section>
  <section class="ftd-section" aria-label="External meetings">
    <h3>External meetings</h3>
    <div class="ftd-radios">
${externalRadios}
    </div>
  </section>
  <section class="ftd-section" aria-label="Active project focus">
    <h3>Active project focus</h3>
    <select class="ftd-focus" data-action="PROJECT_FOCUS_CHANGE">
      <option value=""${noFocusSelected}>No focus</option>
${kaizenOptions}
    </select>
  </section>
  <footer class="ftd-footer">
    <button type="button" class="ftd-cancel" data-action="FINE_TUNE_CANCEL">Cancel</button>
    <button type="button" class="ftd-apply" data-action="FINE_TUNE_APPLY">Apply &amp; recompose</button>
  </footer>
</aside>`;
}

/**
 * FineTuneButton — small trigger rendered on Today to open the drawer.
 *
 * @returns {string}
 */
export function FineTuneButton() {
  return `<button type="button" class="fine-tune-btn" data-action="FINE_TUNE_TOGGLE">Fine-tune</button>`;
}

export default FineTuneDrawer;
