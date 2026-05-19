/**
 * NowJumpButton — Iter 43 Item 7 (GCal pattern, AC14-AC15).
 *
 * A sticky pill-shaped button that scrolls the now-line into the viewport.
 * Renders inside .today-grid-col (sticky bottom, right-aligned).
 *
 * Click dispatches SCROLL_TO_NOW action, handled in app.js which calls
 * document.querySelector('.cycle-now-line')?.scrollIntoView({ block: 'center', behavior: 'smooth' }).
 *
 * Pure render — returns an HTML string. No DOM access.
 *
 * CSS: .now-jump-btn in app.css (sticky bottom-right inside flex column).
 */

/**
 * Render the Jump to Now button.
 *
 * @returns {string} HTML string
 */
export function NowJumpButton() {
  // Phase 3.3 (R3): dropped the directional ↓ arrow (&#8595;).
  // A static ↓ misleads users scrolled below the now-line. Plain "Now"
  // pill is direction-neutral; red color + Geist Mono carry the temporal
  // urgency signal without an ambiguous direction indicator.
  return `<button
  class="now-jump-btn"
  data-action="SCROLL_TO_NOW"
  aria-label="Jump to current time"
  type="button"
>Now</button>`;
}

export default NowJumpButton;
