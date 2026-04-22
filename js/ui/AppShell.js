/**
 * AppShell — layout + nav container (E10-T1).
 *
 * Pure function. Takes a {route, pageHtml} and returns the full shell
 * HTML string, including a top nav with anchors to each hash route.
 *
 * Nav highlights the active route. Nav items are anchor tags, so hash
 * changes flow through the browser's native `hashchange` event and the
 * router handles the re-render.
 *
 * No DOM access.
 */

import { esc } from './mount.js';
import { ROUTE_NAMES } from './router.js';

const NAV_LABELS = Object.freeze({
  today: 'Today',
  portfolio: 'Portfolio',
  week: 'Week',
  catalog: 'Catalog',
  kaizen: 'Kaizen',
  insights: 'Insights',
  settings: 'Settings'
});

/**
 * Render the top nav.
 *
 * @param {string} currentRoute
 * @returns {string}
 */
function renderNav(currentRoute) {
  const items = ROUTE_NAMES.map((r) => {
    const active = r === currentRoute;
    const cls = active ? 'nav-item active' : 'nav-item';
    const ariaCurrent = active ? 'aria-current="page"' : '';
    return `<a href="#${esc(r)}" class="${esc(cls)}" ${ariaCurrent}>${esc(NAV_LABELS[r] ?? r)}</a>`;
  }).join('\n    ');
  return `<nav class="app-nav" role="navigation" aria-label="Primary">
    <span class="nav-brand">CadencePlan</span>
    ${items}
  </nav>`;
}

/**
 * @param {{route: string, pageHtml: string}} props
 * @returns {string}
 */
export function AppShell(props = {}) {
  const route = props.route ?? 'today';
  const pageHtml = props.pageHtml ?? '';
  return `<div class="app-shell" data-route="${esc(route)}">
  ${renderNav(route)}
  <div class="app-content">
    ${pageHtml}
  </div>
</div>`;
}

export default AppShell;
