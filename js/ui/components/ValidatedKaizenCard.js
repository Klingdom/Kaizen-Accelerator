/**
 * ValidatedKaizenCard — Sprint 8 P1-T4.
 *
 * Compact row for a CLOSED Kaizen in the Portfolio "Validated Kaizens"
 * section. Click-to-expand / navigate wiring ships when Kaizen detail view
 * lands (Sprint 9+).
 */

import { esc } from '../mount.js';

const CLOSE_KIND_LABEL = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED_HONEST: 'FAILED HONEST'
});

/**
 * @param {{
 *   kaizen: object,
 *   remeasurement?: object|null
 * }} props
 * @returns {string}
 */
export function ValidatedKaizenCard(props = {}) {
  const k = props.kaizen;
  if (!k || typeof k !== 'object') return '';
  const closeKind = typeof k.closeKind === 'string' ? k.closeKind : 'UNKNOWN';
  const label = CLOSE_KIND_LABEL[closeKind] ?? closeKind;
  const badgeClass = `vk-badge vk-close-${esc(closeKind.toLowerCase())}`;
  const rm = props.remeasurement ?? null;
  const pctCell =
    rm && typeof rm.deltaPercent === 'number'
      ? `${rm.deltaPercent >= 0 ? '+' : ''}${roundish(rm.deltaPercent)}%`
      : rm && rm.deltaPercent === null
        ? 'N/A'
        : '—';

  const payload = esc(JSON.stringify({ kaizenId: k.id }));
  return `<li class="vk-row" data-kaizen-id="${esc(k.id)}" data-close-kind="${esc(closeKind)}" data-action="VK_OPEN" data-payload='${payload}'>
    <h3 class="vk-title">${esc(k.title || 'Untitled Kaizen')}</h3>
    <span class="${badgeClass}">${esc(label)}</span>
    <span class="vk-delta">${esc(pctCell)}</span>
    <time class="vk-closed-at" datetime="${esc(k.closedAt ?? '')}">${esc(k.closedAt ?? '')}</time>
  </li>`;
}

function roundish(n) {
  if (!Number.isFinite(Number(n))) return String(n);
  return String(Math.round(Number(n) * 100) / 100);
}

export default ValidatedKaizenCard;
