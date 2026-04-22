/**
 * InfeasibleBanner — Sprint 5 P2-T1.
 *
 * Simple fallback banner when ComposerService.composeDaily returns an
 * InfeasibleResult. Full 4-action INFEASIBLE state (UX_FLOWS §6.5 /
 * SCHEDULING_UX §3.5) ships in Sprint 6; for MVP this banner keeps
 * the user unblocked by surfacing the Fine-tune path.
 */

import { esc } from '../mount.js';
import { FineTuneButton } from './FineTuneDrawer.js';

export const INFEASIBLE_COPY = Object.freeze({
  HEADLINE: "Can't fit today at current capacity.",
  BODY: 'Open Fine-tune to raise capacity or reduce external meetings.'
});

/**
 * @param {{infeasible?: {explain?: string[]}}} props
 * @returns {string}
 */
export function InfeasibleBanner(props = {}) {
  const explain = props.infeasible?.explain ?? [];
  const bullets = explain
    .slice(0, 3)
    .map((line) => `<li>${esc(line)}</li>`)
    .join('\n');

  return `<section class="infeasible-banner" role="alert" data-state="INFEASIBLE">
  <p class="ib-headline">${esc(INFEASIBLE_COPY.HEADLINE)}</p>
  <p class="ib-body">${esc(INFEASIBLE_COPY.BODY)}</p>
${bullets ? `  <ul class="ib-explain">\n${bullets}\n  </ul>` : ''}
  ${FineTuneButton()}
</section>`;
}

export default InfeasibleBanner;
