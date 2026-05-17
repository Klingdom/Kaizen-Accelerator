/**
 * UserPreferencesService — Iter 39 Luminous Constraint Phase 1.
 *
 * Pure dependency-injection service (matches Iter 24 focusTrap,
 * Iter 35 dragController pattern). No module-level side effects.
 *
 * localStorage key: bamx.userPreferences.v1
 *   - Note: uses a dot-separated key (not the bamx:v1: colon prefix)
 *     because it is a single scalar blob, not a named-entity map.
 *     The LocalStorageRepository prefix guard is bypassed by reading/
 *     writing the underlying storage directly (same pattern as
 *     PORTFOLIO_PREFS_KEY in app.js which uses 'bamx:v1:portfolioPrefs').
 *
 * AC3 — UserPreferences typedef documented in js/domain/types.js.
 * AC4 — load / save / getDefaults implemented here.
 * AC5 — localStorage key is bamx.userPreferences.v1.
 */

/** @type {string} */
export const USER_PREFS_KEY = 'bamx.userPreferences.v1';

/**
 * Return the factory-default UserPreferences.
 * themeId: 'system' — auto-detects OS preference (AC7, AC16).
 * motion: 'full'    — no suppression by default.
 *
 * @returns {{ themeId: string, motion: string, schemaVersion: string }}
 */
export function getDefaults() {
  return {
    themeId: 'system',
    motion: 'full',
    schemaVersion: 'v1'
  };
}

/**
 * Load UserPreferences from the injected repository.
 *
 * Falls back to getDefaults() when:
 *   - the key is absent (first-run user — AC16)
 *   - the stored value fails validation
 *   - the repository throws
 *
 * The `repository` parameter is any object with a `read(key)` that
 * returns the parsed value or null when absent. In production this is
 * `LocalStorageRepository`; in tests it is the in-memory mock.
 *
 * Because UserPreferences are stored at a non-standard key (dot-separated
 * rather than colon-separated), callers should use the underlying storage
 * directly or a thin wrapper. UserPreferencesService accepts either:
 *
 *   - An object with `read(key)` / `write(key, value)` — repository API.
 *   - An object with `getItem(key)` / `setItem(key, value)` — raw Storage API.
 *
 * @param {{ read?: (key: string) => any, getItem?: (key: string) => string|null }} repository
 * @returns {{ themeId: string, motion: string, schemaVersion: string }}
 */
export function load(repository) {
  const defaults = getDefaults();
  if (!repository || typeof repository !== 'object') return defaults;

  try {
    let raw = null;

    if (typeof repository.read === 'function') {
      // Repository API — but the key does NOT use the bamx:v1: prefix so
      // LocalStorageRepository._requirePrefix will throw. Fall through to
      // the getItem path if read throws.
      try {
        raw = repository.read(USER_PREFS_KEY);
      } catch {
        // LocalStorageRepository prefix guard rejects this key — use storage directly.
        if (repository._storage && typeof repository._storage.getItem === 'function') {
          const str = repository._storage.getItem(USER_PREFS_KEY);
          raw = str !== null ? JSON.parse(str) : null;
        }
      }
    } else if (typeof repository.getItem === 'function') {
      // Raw Storage API.
      const str = repository.getItem(USER_PREFS_KEY);
      raw = str !== null ? JSON.parse(str) : null;
    }

    if (!raw || typeof raw !== 'object') return defaults;

    return {
      themeId: _validTheme(raw.themeId) ? raw.themeId : defaults.themeId,
      motion: _validMotion(raw.motion) ? raw.motion : defaults.motion,
      schemaVersion: typeof raw.schemaVersion === 'string' ? raw.schemaVersion : defaults.schemaVersion
    };
  } catch {
    return defaults;
  }
}

/**
 * Persist UserPreferences to the injected repository (best-effort; never throws).
 *
 * Accepts the same repository shapes as `load()`.
 *
 * @param {{ themeId: string, motion: string, schemaVersion: string }} prefs
 * @param {{ write?: (key: string, value: any) => void, setItem?: (key: string, value: string) => void, _storage?: object }} repository
 */
export function save(prefs, repository) {
  if (!prefs || typeof prefs !== 'object') return;
  if (!repository || typeof repository !== 'object') return;

  const toStore = {
    themeId: _validTheme(prefs.themeId) ? prefs.themeId : 'system',
    motion: _validMotion(prefs.motion) ? prefs.motion : 'full',
    schemaVersion: typeof prefs.schemaVersion === 'string' ? prefs.schemaVersion : 'v1'
  };

  try {
    if (typeof repository.write === 'function') {
      // Try direct write first; if prefix guard throws, fall back to _storage.
      try {
        repository.write(USER_PREFS_KEY, toStore);
      } catch {
        if (repository._storage && typeof repository._storage.setItem === 'function') {
          repository._storage.setItem(USER_PREFS_KEY, JSON.stringify(toStore));
        }
      }
    } else if (typeof repository.setItem === 'function') {
      repository.setItem(USER_PREFS_KEY, JSON.stringify(toStore));
    }
  } catch {
    /* swallow — preferences are optional, must never break the app */
  }
}

// ---------------------------------------------------------------------------
// Internal validators
// ---------------------------------------------------------------------------

/** @param {any} v */
function _validTheme(v) {
  return v === 'system' || v === 'light' || v === 'dark';
}

/** @param {any} v */
function _validMotion(v) {
  return v === 'full' || v === 'reduced';
}

export default { load, save, getDefaults };
