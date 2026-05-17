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
import { VISIBLE_ROUTE_NAMES } from './router.js';

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
 * Render the top nav. Iterates `VISIBLE_ROUTE_NAMES` (Sprint 11 P0-T1) so
 * unimplemented placeholder routes (`insights`) don't appear in the
 * user-facing navigation. Direct URL access to hidden routes still works.
 *
 * Iter 39: gear icon links to /settings (AC15). The settings route is NOT
 * in VISIBLE_ROUTE_NAMES — it is accessed exclusively via the gear icon.
 *
 * @param {string} currentRoute
 * @returns {string}
 */
function renderNav(currentRoute) {
  const items = VISIBLE_ROUTE_NAMES.map((r) => {
    const active = r === currentRoute;
    const cls = active ? 'nav-item active' : 'nav-item';
    const ariaCurrent = active ? 'aria-current="page"' : '';
    return `<a href="#${esc(r)}" class="${esc(cls)}" ${ariaCurrent}>${esc(NAV_LABELS[r] ?? r)}</a>`;
  }).join('\n    ');

  // Gear icon — AC15. Active when on settings route.
  const gearActive = currentRoute === 'settings';
  const gearAria = gearActive ? 'aria-current="page"' : '';
  const gearLabel = gearActive ? 'Settings (current page)' : 'Settings';
  const gearIcon = `<a href="#settings" class="nav-gear" ${gearAria} aria-label="${esc(gearLabel)}" title="${esc(gearLabel)}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </a>`;

  return `<nav class="app-nav" role="navigation" aria-label="Primary">
    <span class="nav-brand">CadencePlan</span>
    ${items}
    ${gearIcon}
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
