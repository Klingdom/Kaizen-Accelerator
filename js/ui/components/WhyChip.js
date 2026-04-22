/**
 * WhyChip — pure render for the "why this activity?" popover chevron
 * on PROPOSED ScheduledActivityBlock rows (Sprint 5 P1-T3).
 *
 * Per SCHEDULING_UX §3.5 and METHODOLOGY_RECOMMENDATION §8 auto-
 * population methodology: each composer `why[]` entry has
 *   { ref, rule, detail }
 * where `ref` is a catalogEntryId and `detail` is the reason text.
 *
 * The chip is passive — tapping it shows a tooltip via the `title` and
 * `aria-label` attributes (no JS state). Full disclosure UI ships with
 * a dedicated popover component in a later sprint.
 *
 * Read-only; hidden on ACCEPTED / ACTIVE composition states (caller's
 * responsibility).
 */

import { esc } from '../mount.js';

/**
 * Build a short summary string from a composer `why` entry. Kept short
 * enough to fit in a chip tooltip (≤140 chars).
 *
 * @param {{ref: string, rule: string, detail: string}} entry
 * @returns {string}
 */
export function summarizeWhy(entry) {
  if (!entry || typeof entry !== 'object') return '';
  const rule = entry.rule ?? '';
  const detail = entry.detail ?? '';
  if (rule && detail) return `${rule} — ${detail}`;
  if (detail) return detail;
  if (rule) return rule;
  return '';
}

/**
 * WhyChip component.
 *
 * @param {{entry: {ref: string, rule: string, detail: string} | null}} props
 * @returns {string}
 */
export function WhyChip(props = {}) {
  const entry = props.entry;
  if (!entry || typeof entry !== 'object') return '';
  const summary = summarizeWhy(entry);
  if (!summary) return '';
  return `<span class="why-chip" role="note" aria-label="why: ${esc(summary)}" title="${esc(summary)}" data-ref="${esc(entry.ref ?? '')}" data-rule="${esc(entry.rule ?? '')}">&#x24d8;</span>`;
}

export default WhyChip;
