/**
 * PlaceholderPage — stub rendered for routes that haven't shipped yet.
 *
 * Per Sprint 4 scope: only `#today` renders real content. The other 5
 * MVP routes (`#week`, `#catalog`, `#kaizen`, `#insights`, `#settings`)
 * each render a "Ships in Sprint N" stub.
 *
 * Pure render. Returns an HTML string.
 */

import { esc } from '../mount.js';

/**
 * Which sprint each MVP route is planned for.
 * (Values are advisory — the user can update as delivery shifts.)
 */
export const PLACEHOLDER_SPRINTS = Object.freeze({
  week: 'Sprint 5',
  catalog: 'Sprint 5',
  kaizen: 'Sprint 6',
  insights: 'Sprint 6',
  settings: 'Sprint 6'
});

/**
 * @param {{route: string}} props
 * @returns {string}
 */
export function PlaceholderPage(props = {}) {
  const route = props.route ?? 'unknown';
  const ships = PLACEHOLDER_SPRINTS[route] ?? 'a later sprint';
  const label = route.charAt(0).toUpperCase() + route.slice(1);
  return `<section class="placeholder-page" data-route="${esc(route)}">
  <h1>${esc(label)}</h1>
  <p class="placeholder-copy">Ships in ${esc(ships)}.</p>
  <p class="placeholder-sub">This page is a stub. Today is the only wired screen in Sprint 4.</p>
</section>`;
}

export default PlaceholderPage;
