/**
 * AdherenceDial — three KPI numbers (E10-T8 placeholder).
 *
 * Per UX_FLOWS §3.9 + SCHEDULING_UX Today wireframe:
 *   (a) standard-work adherence % over last 14 days
 *   (b) composition acceptance %
 *   (c) Kaizen delta vs baseline on the active Kaizen
 *
 * Sprint 4 scope: PLACEHOLDER only. Real metric wiring lands in Sprint 6
 * (E9 Metrics). For now, shows three em-dashes with the "Building your
 * baseline" microcopy when stats are unavailable.
 *
 * Props:
 *   adherencePct:     number | null
 *   acceptancePct:    number | null
 *   kaizenDeltaPct:   number | null
 *   daysSinceSignup:  number  — used to gate the "day 7" empty state
 */

import { esc } from '../mount.js';

/**
 * Format a percent value. Returns '—' for null/undefined.
 */
function pct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const n = Math.round(v);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

/**
 * @param {{
 *   adherencePct?: number | null,
 *   acceptancePct?: number | null,
 *   kaizenDeltaPct?: number | null,
 *   daysSinceSignup?: number
 * }} [props]
 * @returns {string}
 */
export function AdherenceDial(props = {}) {
  const adh = props.adherencePct ?? null;
  const acc = props.acceptancePct ?? null;
  const kai = props.kaizenDeltaPct ?? null;
  const days = typeof props.daysSinceSignup === 'number' ? props.daysSinceSignup : 0;

  const preBaseline = days < 7;
  const showEmpty = preBaseline && adh === null && acc === null && kai === null;

  if (showEmpty) {
    // Empty state copy per SCHEDULING_UX §6.5.2.
    return `<section class="adherence-dial empty" aria-label="Adherence">
  <div class="dial-number">—</div>
  <div class="dial-number">—%</div>
  <div class="dial-number">—</div>
  <p class="dial-empty-copy">Building your baseline. Numbers populate after day 7.</p>
</section>`;
  }

  return `<section class="adherence-dial" aria-label="Adherence" role="group">
  <div class="dial-cell">
    <span class="dial-label">Adherence</span>
    <span class="dial-number">${esc(adh === null ? '—' : `${Math.round(adh)}%`)}</span>
  </div>
  <div class="dial-cell">
    <span class="dial-label">Acceptance</span>
    <span class="dial-number">${esc(acc === null ? '—' : `${Math.round(acc)}%`)}</span>
  </div>
  <div class="dial-cell">
    <span class="dial-label">Kaizen delta</span>
    <span class="dial-number">${esc(pct(kai))}</span>
  </div>
</section>`;
}

export default AdherenceDial;
