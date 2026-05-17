/**
 * Settings — Iter 39 Luminous Constraint Phase 1.
 *
 * Pure render function. No DOM access. Returns an HTML string.
 *
 * AC12: /settings route — accessible from nav gear icon.
 * AC13: Renders 3-theme radio (System / Light / Dark) + 2-motion radio.
 * AC14: Live-apply on selection (data-action="PREF_CHANGE_THEME" / PREF_CHANGE_MOTION).
 * AC15: Header gear icon links to /settings (wired in AppShell).
 * AC18: Settings accessible from day 0 (no gate).
 *
 * @param {{ themeId?: string, motion?: string }} props
 * @returns {string}
 */
export function Settings(props = {}) {
  const themeId = props.themeId ?? 'system';
  const motion = props.motion ?? 'full';

  return `<section class="settings-page" aria-labelledby="settings-h1">
  <h1 id="settings-h1">Settings</h1>
  <p class="settings-subtitle">Customize your CadencePlan experience. Changes apply immediately.</p>

  <div class="settings-section" aria-labelledby="settings-theme-heading">
    <h2 id="settings-theme-heading" class="settings-section-title">Theme</h2>
    <div class="settings-radio-group" role="radiogroup" aria-labelledby="settings-theme-heading">

      <label class="settings-radio-label">
        <input
          type="radio"
          name="settings-theme"
          value="system"
          ${themeId === 'system' ? 'checked' : ''}
          data-action="PREF_CHANGE_THEME"
          data-theme-id="system"
          aria-describedby="settings-theme-system-desc"
        />
        System
        <span id="settings-theme-system-desc" class="settings-radio-desc">Follows your operating system's light / dark setting.</span>
      </label>

      <label class="settings-radio-label">
        <input
          type="radio"
          name="settings-theme"
          value="light"
          ${themeId === 'light' ? 'checked' : ''}
          data-action="PREF_CHANGE_THEME"
          data-theme-id="light"
          aria-describedby="settings-theme-light-desc"
        />
        Light
        <span id="settings-theme-light-desc" class="settings-radio-desc">Always use the light colour scheme.</span>
      </label>

      <label class="settings-radio-label">
        <input
          type="radio"
          name="settings-theme"
          value="dark"
          ${themeId === 'dark' ? 'checked' : ''}
          data-action="PREF_CHANGE_THEME"
          data-theme-id="dark"
          aria-describedby="settings-theme-dark-desc"
        />
        Dark
        <span id="settings-theme-dark-desc" class="settings-radio-desc">Always use the dark colour scheme.</span>
      </label>

    </div>
  </div>

  <div class="settings-section" aria-labelledby="settings-motion-heading">
    <h2 id="settings-motion-heading" class="settings-section-title">Motion</h2>
    <div class="settings-radio-group" role="radiogroup" aria-labelledby="settings-motion-heading">

      <label class="settings-radio-label">
        <input
          type="radio"
          name="settings-motion"
          value="full"
          ${motion === 'full' ? 'checked' : ''}
          data-action="PREF_CHANGE_MOTION"
          data-motion="full"
          aria-describedby="settings-motion-full-desc"
        />
        Full
        <span id="settings-motion-full-desc" class="settings-radio-desc">All animations and transitions enabled.</span>
      </label>

      <label class="settings-radio-label">
        <input
          type="radio"
          name="settings-motion"
          value="reduced"
          ${motion === 'reduced' ? 'checked' : ''}
          data-action="PREF_CHANGE_MOTION"
          data-motion="reduced"
          aria-describedby="settings-motion-reduced-desc"
        />
        Reduced
        <span id="settings-motion-reduced-desc" class="settings-radio-desc">Suppresses animations. Recommended if you experience motion sensitivity.</span>
      </label>

    </div>
  </div>
</section>`;
}

export default Settings;
