# ARCHITECTURE DELTA — Today Futuristic (Customization + Theme System)

Owner: System Architect
Date: 2026-04-30
Status: Proposed (pre-build)
Upstream: Phil's directive — "Make Today page futuristic, modern, innovative, customizable."
Downstream: frontend-engineer, qa-engineer

---

## 1. Goal + non-goals

**Goal.** Introduce the minimum architectural surface required to make the
Today page customizable per-user without breaking any existing flow. The
two foundational pieces are: (a) a `UserPreferences` entity persisted in
localStorage, and (b) a runtime theme system that swaps coordinated CSS
custom-property sets via a `data-theme` attribute on the document root.
Together these unlock theme switching (light/dark/futuristic), accent
choice, density, motion preferences, and per-bucket palette overrides
without code changes downstream of the renderer.

**Non-goals.** This delta does NOT design specific themes (visual
designer's job), does NOT implement layout customization (drag-to-reorder
modules — Phase 2), does NOT touch composer/engine/event behavior, and
does NOT introduce a server-side preferences sync. It also does NOT
change the canonical Phil color identity for the default state — green /
yellow / purple remain the defaults; users opt in to alternatives.

---

## 2. Current state inventory

### CSS variables (file:line)

All live in a single `:root {}` block in `app.css`:

| Token group | Lines | Notes |
|---|---|---|
| `--font-display`, `--font-body`, `--font-mono`, `--font-stack` | `app.css:16-21` | Iter 33 type trio |
| `--surface-0..3` | `app.css:24-27` | Warm off-white hierarchy |
| `--ink-100..900` | `app.css:30-35` | Text + hairline palette |
| `--project-fill-top/base`, `--comm-fill-top/base`, `--ci-fill-top/base` | `app.css:38-43` | Bucket gradient stops |
| `--now-red` | `app.css:46` | Now-line marker |
| Legacy `--bg`, `--fg`, `--muted`, `--border`, etc. | `app.css:49-58` | Aliased to surface/ink |
| `--project-bg/fg/fill/block-text` | `app.css:61-64` | Green identity (PROJECT) |
| `--communication-bg/fg/fill/block-text` | `app.css:67-70` | Yellow identity (COMMUNICATION) |
| `--ci-bg/fg/fill/block-text` | `app.css:73-76` | Purple identity (CI) |
| `--radius`, `--shadow` | `app.css:78-79` | Geometry |

Total: ~39 CSS custom properties, all flat (no namespacing layer).

### Theme switcher
**NONE exists today.** No JS reads or writes any theme state. No
`data-theme` attribute is set. The single `:root {}` block defines one
fixed palette.

### User preferences entity
**NONE exists today.** `User` (typedef in `js/domain/types.js:385-397`)
holds operational fields only — `dailyCapacityMinutes`, `workDays`,
`sprintAnchorDate`, `timezone`, `deepSlicePreference`. No display
preferences. No `js/services/PreferencesService.js`. No localStorage key
for prefs.

The closest analog is `bamx:v1:portfolio:filter` (Sprint 11 P1-T3,
referenced in `js/app.js:446`) — a single namespaced localStorage key for
Portfolio filter/sort. That pattern is what we will generalize.

### Settings page
**NONE exists today.** The route `#settings` exists in
`js/ui/router.js:34`, is listed in `ROUTE_NAMES` (`router.js:38-46`), is
in `PLACEHOLDER_ROUTE_NAMES` (`router.js:69-72`), and is NOT in
`VISIBLE_ROUTE_NAMES` (`router.js:56-62`). It currently renders
`PlaceholderPage` ("Ships next"). The nav label `'Settings'` exists in
`AppShell.js:24` but is hidden because Settings is not in
`VISIBLE_ROUTE_NAMES`.

So the route slot is reserved but the page is empty. We can land Settings
without inventing a route.

---

## 3. Proposed UserPreferences entity

### Typedef (lives in `js/domain/types.js` — §6.5 hit, see §8)

```js
/**
 * UserPreferences — display + customization layer (Sprint TBD).
 *
 * Distinct from User (§2.3) which holds operational fields. Prefs are
 * 100% display/UX; engine + composer must not read them.
 *
 * Persistence: bamx:v1:userPreferences (single object, not a map — MVP
 * is single-user). Migration: absence => DEFAULT_PREFERENCES; first read
 * does NOT auto-write (lazy persistence on first user change).
 *
 * @typedef {object} UserPreferences
 * @property {string} userId
 * @property {ThemeId} theme                       // 'default' | 'dark' | 'futuristic-neon' | ...
 * @property {AccentId} accent                     // 'phil' | 'mono' | 'sunset' | ...
 * @property {Density} density                     // 'comfortable' | 'compact'
 * @property {MotionPreference} motion             // 'full' | 'reduced'
 * @property {TodayLayout} todayLayout             // 'grid' | 'list' | 'rail'
 * @property {BucketPaletteOverrides|null} bucketPaletteOverrides
 * @property {boolean} showWhyThisPlan
 * @property {boolean} showMorningRecap
 * @property {boolean} showUpNextRail
 * @property {string} updatedAt                    // ISO timestamp
 * @property {number} schemaVersion                // 1
 */

/** @typedef {'default' | 'dark' | 'futuristic-neon' | 'paper' | 'high-contrast'} ThemeId */
/** @typedef {'phil' | 'mono' | 'sunset' | 'ocean'} AccentId */
/** @typedef {'comfortable' | 'compact'} Density */
/** @typedef {'full' | 'reduced'} MotionPreference */
/** @typedef {'grid' | 'list' | 'rail'} TodayLayout */

/**
 * @typedef {object} BucketPaletteOverrides
 * @property {string|null} projectFill        // hex; null = use theme default
 * @property {string|null} communicationFill
 * @property {string|null} ciFill
 */
```

### Default values (must reproduce current Iter 38 appearance exactly)

```js
export const DEFAULT_PREFERENCES = Object.freeze({
  userId: 'default',
  theme: 'default',
  accent: 'phil',
  density: 'comfortable',
  motion: 'full',
  todayLayout: 'grid',
  bucketPaletteOverrides: null,
  showWhyThisPlan: true,
  showMorningRecap: true,
  showUpNextRail: false,        // matches Phase A simplification
  updatedAt: '1970-01-01T00:00:00.000Z',
  schemaVersion: 1
});
```

`DEFAULT_PREFERENCES.theme === 'default'` MUST resolve to the
exact-current `:root {}` palette. This is enforced by the theme system
(§4): theme `'default'` is identity (no overrides applied).

### Persistence path

| Concern | Choice |
|---|---|
| Storage | localStorage (consistent with rest of app) |
| Key | `bamx:v1:userPreferences` (singular, single-user MVP) |
| Service | NEW `js/services/PreferencesService.js` |
| Surface | `loadPreferences()`, `savePreferences(partial)`, `resetPreferences()`, `subscribe(fn)` |
| Subscribe | Implemented over `EventBus` event `'PreferencesChanged'` |
| Reads | Boot reads once; any subsequent change re-emits |
| Writes | Merge-on-write: `savePreferences({theme: 'dark'})` patches the stored object, stamps `updatedAt`, emits `PreferencesChanged` |

`PreferencesService` lives under `js/services/` and is **NOT** in §6.5
(only the typedef in `js/domain/types.js` is). See §8.

---

## 4. Theme system architecture

### Mechanism: data-theme attribute on document root + scoped CSS variable sets

Themes are CSS-variable-only. Themes are NOT separate stylesheets, and
they do NOT swap class names on individual components. Switching is
"flip one attribute, browser repaints":

```css
/* In app.css, after the existing :root {} */

[data-theme='dark'] {
  --surface-0: #0c0a09;
  --surface-1: #1c1917;
  --surface-2: #292524;
  --surface-3: #44403c;
  --ink-900: #fafaf9;
  --ink-700: #e7e5e4;
  --ink-600: #a8a29e;
  /* etc — theme overrides only the variables that change */
}

[data-theme='futuristic-neon'] {
  --surface-0: #050714;
  --surface-1: #0a0e2a;
  /* glassmorphism + neon palette — designed by UX designer */
}
```

Boot sets `document.documentElement.dataset.theme = prefs.theme`. The
default theme `'default'` sets NOTHING — no `[data-theme='default']` rule
exists. The bare `:root {}` block IS the default theme. This guarantees
backward compatibility (§9): users with no prefs see the literal current
stylesheet untouched.

### Why a single file with attribute selectors (vs. separate stylesheets)

- One HTTP/file load. No FOUC on theme switch.
- Cascade is deterministic: `[data-theme='X']` has a higher specificity
  than `:root` (one attribute vs. zero), so overrides win without
  `!important`.
- Theme switch is one `setAttribute` call — no stylesheet swap, no
  re-layout, no flash.
- All themes are colocated, so audits ("does dark theme cover every var
  the default sets?") are mechanical — grep the file.

### Where theme stylesheets live

Single file, `app.css`. Optionally, if theme blocks grow >300 LOC each,
extract to `themes.css` and link both. For MVP: one file.

### Accent layering (independent of theme)

Accent is a separate axis from theme. Same mechanism, different
attribute:

```css
[data-accent='mono'] {
  --project-fill: #475569;
  --communication-fill: #64748b;
  --ci-fill: #334155;
  /* monochrome — for users who hate the green/yellow/purple */
}
```

Phil's identity is `data-accent='phil'` (the default — empty rule for
backward compat).

### Per-bucket palette overrides

When `prefs.bucketPaletteOverrides.projectFill` is non-null, write it
inline to `documentElement.style`:

```js
document.documentElement.style.setProperty('--project-fill', overrides.projectFill);
```

Inline style on `:root` beats both `:root {}` block AND
`[data-theme='X']` block (inline > attribute selector). Restoring
default = `removeProperty('--project-fill')`.

### Dark mode + Phil's color identity interaction

Phil's identity is `phil` accent applied on top of any theme. In dark
themes, the green/yellow/purple `--*-fill` values are NOT inverted —
they stay saturated (green-500 / yellow-500 / purple-500 area). What
changes is the `--*-bg` (the soft tint behind labels) — those rotate
toward green-900/yellow-900/purple-900 to remain readable on dark
surfaces. The block-text stays white (already AA on saturated mid).

Concretely the dark theme defines:

```css
[data-theme='dark'] {
  /* Surfaces and ink invert */
  --surface-0: #0c0a09;
  --ink-900: #fafaf9;
  /* Bucket fills stay saturated — Phil identity preserved */
  /* (no override; inherits :root values) */
  /* Bucket bgs rotate to dark tints */
  --project-bg: #052e16;
  --communication-bg: #422006;
  --ci-bg: #2e1065;
  /* Block text and fg stay legible */
  --project-fg: #86efac;
  --communication-fg: #fde047;
  --ci-fg: #d8b4fe;
}
```

This rule — "fills are identity, surfaces and tints adapt" — is the
single design contract that every theme MUST honor.

---

## 5. Customization storage

### localStorage key shape

| Key | Shape | Notes |
|---|---|---|
| `bamx:v1:userPreferences` | `UserPreferences` object (singular) | Single-user MVP |

For multi-user evolution: `bamx:v1:userPreferences:{userId}`. Trivial to
swap when the time comes.

### Schema versioning

`schemaVersion: 1` field is present from day one. Future migrations:
`PreferencesService.loadPreferences()` reads, checks `schemaVersion`, and
runs registered upgraders before returning. MVP has only v1.

### Migration plan

**None required.** First-run users have no key written. Read returns
`null` → service returns `DEFAULT_PREFERENCES` (frozen). No write on
read. First `savePreferences()` materializes the key with patched fields
+ updated `updatedAt`. Existing localStorage compositions, kaizens,
opportunities are completely untouched.

---

## 6. Settings UI architecture

### Recommended pattern: dedicated `/settings` route + lightweight header trigger

**Choice: dedicated `/settings` page**, with a small gear icon in the
header (top-right of `AppShell`) that links to `#settings`. Promote
`'settings'` into `VISIBLE_ROUTE_NAMES` only AFTER the page ships
(don't ship a half-built nav link).

**Why a page, not a modal or in-context popovers:**

1. Settings is rarely-used. Modals over Today add weight to the most-used
   surface for the rarest action.
2. A page route is bookmarkable, deep-linkable from a CTA ("Try dark
   mode → opens `#settings/theme`"), and survives refresh.
3. Future expansion (export data, danger zone, integrations) needs more
   real estate than a popover.
4. The router slot already exists (`router.js:34`). Cost to land = LOW.

**In-context customization** is reserved for two specific gestures:

- A **theme picker dropdown** in the header gear menu (one-click swap
  without leaving Today).
- A **"Customize this card"** affordance on the CycleCard (Phase 2).

### Component hierarchy

```
js/ui/pages/Settings.js                  NEW (page container)
  └── SettingsSection (inline helper)    NEW (visual grouping)
      ├── ThemePicker.js                 NEW (radio cards, live-preview on hover)
      ├── AccentPicker.js                NEW (color swatches)
      ├── DensityToggle.js               NEW (segmented control)
      ├── MotionToggle.js                NEW (respects prefers-reduced-motion)
      ├── TodayLayoutPicker.js           NEW (radio cards w/ thumbnails)
      ├── BucketPaletteEditor.js         NEW (3 color inputs + reset)
      └── TodayModulesToggle.js          NEW (checkboxes for show* flags)

js/ui/components/HeaderGearMenu.js        NEW (small popover from AppShell)
  └── ThemeQuickSwitch                    NEW (3-4 themes, one-click)
```

All components are pure render functions returning HTML strings, matching
the existing pattern (e.g. `CycleCard`, `BucketStrip`).

### How settings updates propagate to render

Two propagation paths, used together:

**Path A — CSS variable mutation (instant, no rerender).** Theme,
accent, bucket overrides. Handler calls
`PreferencesService.savePreferences({theme: 'dark'})`, which:
1. Writes to localStorage
2. Sets `document.documentElement.dataset.theme = 'dark'`
3. Emits `PreferencesChanged`

The DOM re-paints from the CSS variable change. NO `mount()` rerender
needed. Fast, flicker-free.

**Path B — State slice + rerender (for structural prefs).** Density,
todayLayout, show* flags. These change which components render or with
which classes. Handler:
1. `PreferencesService.savePreferences(...)` (writes + emits)
2. `app.js` listens for `PreferencesChanged` and triggers a `rerender()`

The boot layer in `js/app.js` already owns the rerender pattern. We add
one subscription line.

### State source of truth

Single source: `PreferencesService.loadPreferences()`. Page render
reads it synchronously. No separate React-style state slice — the
service IS the slice.

---

## 7. Component changes table

| File | Change | LOC est. | §6.5 hit |
|---|---|---|---|
| `js/domain/types.js` | NEW typedefs: `UserPreferences`, `ThemeId`, `AccentId`, `Density`, `MotionPreference`, `TodayLayout`, `BucketPaletteOverrides`; add to `ENTITIES` | +90 | **YES** |
| `js/services/PreferencesService.js` | NEW service: load/save/reset/subscribe + `DEFAULT_PREFERENCES` | +180 | no |
| `js/ui/pages/Settings.js` | REPLACE placeholder with real Settings page | +160 | no |
| `js/ui/components/ThemePicker.js` | NEW radio-card picker | +90 | no |
| `js/ui/components/AccentPicker.js` | NEW swatch picker | +70 | no |
| `js/ui/components/DensityToggle.js` | NEW segmented control | +50 | no |
| `js/ui/components/MotionToggle.js` | NEW toggle | +50 | no |
| `js/ui/components/TodayLayoutPicker.js` | NEW radio-card picker | +80 | no |
| `js/ui/components/BucketPaletteEditor.js` | NEW 3-color editor + reset | +100 | no |
| `js/ui/components/TodayModulesToggle.js` | NEW checkbox group | +70 | no |
| `js/ui/components/HeaderGearMenu.js` | NEW popover from AppShell | +110 | no |
| `js/ui/AppShell.js` | Add gear icon trigger; wire `data-theme` + `data-accent` to root if needed | +20 | no |
| `js/ui/router.js` | Add `'settings'` to `VISIBLE_ROUTE_NAMES` (after page ships) | +1 | no |
| `js/app.js` | Boot: load prefs, set `data-theme`/`data-accent`, subscribe `PreferencesChanged` → rerender | +30 | no |
| `app.css` | Add `[data-theme='dark']`, `[data-theme='futuristic-neon']`, etc. blocks; add `[data-accent='X']` blocks; add density modifier rules | +400 | no |
| `js/ui/pages/Today.js` | Read prefs (passed in via app.js) for `todayLayout`, `show*` flags; conditionally render WhyThisPlan / MorningRecap | +20 | no |
| `js/events/events.js` | Register `PreferencesChanged` event constant | +5 | no |
| `tests/services/PreferencesService.test.js` | NEW test suite | +220 | no |
| `tests/ui/components/ThemePicker.test.js` | NEW | +80 | no |
| `tests/ui/themeSwitching.test.js` | NEW integration test | +120 | no |
| `tests/domain/types.test.js` | Extend ENTITIES test for new typedef | +10 | YES (test side-effect) |

**Totals.** Production: ~1,536 LOC across 17 files. Tests: ~430 LOC.
**§6.5 hits: 1 production file (`js/domain/types.js`) + 1 test file
that asserts on it.**

---

## 8. §6.5 hit prediction

### Hit #1 — `js/domain/types.js` (UNAVOIDABLE; justified)

**Justification:** The Ledgerium operating principles require explicit
contracts. `UserPreferences` is a first-class entity that:
- is persisted (in localStorage at a `bamx:v1:` namespaced key)
- has enumerated value sets (`ThemeId`, `AccentId`, `Density`,
  `MotionPreference`, `TodayLayout`)
- is read by both UI and (eventually) by the boot layer to set DOM
  attributes
- needs schema versioning for forward-migration

A persisted, enumerated, versioned, cross-layer entity belongs in
`js/domain/types.js`. Putting it elsewhere violates the existing
contract (Composition, ScheduledActivity, Opportunity etc. all live
there) and creates a parallel typedef registry that drifts.

### Hit #2 — Test file mirroring (unavoidable consequence of #1)

`tests/domain/types.test.js` (or similar) asserts that `ENTITIES`
contains every documented typedef. Adding `UserPreferences` to
`ENTITIES` requires a one-line test update. This is mechanical, not a
semantic §6.5 change.

### Path to minimize hits

We considered three alternatives to avoid touching `js/domain/types.js`:

1. **Keep typedef in `PreferencesService.js` as a JSDoc-only type.**
   Rejected — violates "every persisted entity is documented in
   `domain/types.js`" (verifiable from existing `Opportunity`
   precedent, Sprint 7).

2. **Embed prefs inside `User` entity.** Rejected — `User` is read by
   composer/engine (`composeDaily.js:434` reads
   `user.deepSlicePreference`). Mixing display prefs with operational
   fields violates separation; and engine MUST NOT see display
   preferences.

3. **Use a free-form JSON blob with no typedef.** Rejected — violates
   "explicit contracts" Ledgerium principle and removes static-analysis
   value.

**Conclusion:** 1 production §6.5 hit is the floor. We ship it once,
documented in this delta as the only acceptable path forward.

---

## 9. Backward compatibility

### First-run user (no prefs key) gets exact-current appearance

Three guarantees, in priority order:

1. **No `bamx:v1:userPreferences` key exists** → `loadPreferences()`
   returns `DEFAULT_PREFERENCES`.
2. **`DEFAULT_PREFERENCES.theme === 'default'`** → boot sets
   `documentElement.dataset.theme = 'default'`.
3. **No `[data-theme='default']` CSS rule exists.** The bare `:root {}`
   block IS the default. Cascade resolves to the exact-current palette.

A test enforces this: render Today against a pristine localStorage and
diff the computed `--project-fill`, `--surface-0`, etc. against the
constants in `app.css:14-80`. Equality required.

### Existing localStorage data untouched

`bamx:v1:compositions`, `bamx:v1:kaizens`, `bamx:v1:opportunities`,
`bamx:v1:users`, `bamx:v1:portfolio:filter`, etc. are not read or
written by the preferences system. Migration is null.

### Phil's color identity is the default

`DEFAULT_PREFERENCES.accent === 'phil'` and
`DEFAULT_PREFERENCES.bucketPaletteOverrides === null` ensure
green / yellow / purple stays the default palette. Users opt in to
alternatives. There is no surprise color change.

---

## 10. Test strategy

### Theme switching test pattern

```js
// tests/ui/themeSwitching.test.js
test('setting theme=dark mutates :root data-theme attribute', () => {
  const doc = createTestDocument();
  PreferencesService.savePreferences({theme: 'dark'});
  expect(doc.documentElement.dataset.theme).toBe('dark');
});

test('default prefs leave :root with data-theme=default', () => {
  const doc = createTestDocument();
  bootApp({document: doc, storage: emptyStorage()});
  expect(doc.documentElement.dataset.theme).toBe('default');
});

test('PreferencesChanged event fires with the patched object', async () => {
  const events = [];
  EventBus.on('PreferencesChanged', (e) => events.push(e));
  PreferencesService.savePreferences({accent: 'mono'});
  expect(events).toHaveLength(1);
  expect(events[0].accent).toBe('mono');
  expect(events[0].theme).toBe('default'); // unchanged fields preserved
});
```

### Preferences persistence tests

```js
test('first read with no key returns DEFAULT_PREFERENCES (no write)', () => {
  const storage = mockStorage();
  const result = PreferencesService.loadPreferences({storage});
  expect(result).toEqual(DEFAULT_PREFERENCES);
  expect(storage.getItem('bamx:v1:userPreferences')).toBeNull();
});

test('savePreferences merges with existing values, not replaces', () => {
  PreferencesService.savePreferences({theme: 'dark'});
  PreferencesService.savePreferences({accent: 'mono'});
  const result = PreferencesService.loadPreferences();
  expect(result.theme).toBe('dark');     // preserved
  expect(result.accent).toBe('mono');    // patched
});

test('savePreferences stamps updatedAt with injected clock', () => {
  const clock = () => '2026-04-30T12:00:00.000Z';
  PreferencesService.savePreferences({theme: 'dark'}, {clock});
  expect(PreferencesService.loadPreferences().updatedAt).toBe('2026-04-30T12:00:00.000Z');
});

test('resetPreferences removes the key entirely (idempotent)', () => {
  PreferencesService.savePreferences({theme: 'dark'});
  PreferencesService.resetPreferences();
  expect(PreferencesService.loadPreferences()).toEqual(DEFAULT_PREFERENCES);
});

test('schemaVersion mismatch routes through migrator', () => {
  storage.setItem('bamx:v1:userPreferences', JSON.stringify({
    theme: 'dark', schemaVersion: 0
  }));
  // future-proofing scaffold; v1 is identity
  const result = PreferencesService.loadPreferences({storage});
  expect(result.schemaVersion).toBe(1);
});
```

### Backward-compat regression test

```js
test('Today render with no prefs is byte-equal to Iter 38 baseline', () => {
  // Snapshot of Today HTML output as of pre-customization commit
  const baseline = readFile('tests/snapshots/today_iter38.html');
  const html = renderTodayWithEmptyStorage();
  expect(html).toBe(baseline);
});
```

### Visual contract tests (per theme)

For each theme, assert that EVERY variable defined in `:root {}` is
either explicitly overridden in the theme block OR intentionally
inherited. Mechanical enumeration in CI prevents "I forgot to set
`--project-bg` in the dark theme" bugs.

---

## 11. Open architectural questions

1. **Q: Multi-device sync.** Phil currently runs single-device, single-user.
   Is the long-term plan to sync prefs across devices? If yes, the
   localStorage key should be designed to mirror cleanly to a future
   server-side store. Recommendation: use `userId` keying from day one
   (key = `bamx:v1:userPreferences`, value contains `userId`) and assume
   single-user for MVP. Confirm with Phil.

2. **Q: Theme authorship — designer or user?** Should "futuristic" be a
   single curated theme, or should we expose enough knobs that a power
   user can build their own (custom hex inputs for every variable)?
   Recommendation: ship 4-5 curated themes for MVP; add custom-theme
   builder in Phase 2 only if requested. Keeps surface area small.

3. **Q: Do `showWhyThisPlan` / `showMorningRecap` belong in
   preferences or are they engine signals?** Currently these CycleCard
   sub-modules render unconditionally. Making them prefs means a user
   can permanently hide them. Alternative: progressive disclosure based
   on usage (e.g. auto-hide after 5 dismissals). Decide before building
   `TodayModulesToggle`.

4. **Q: `prefers-reduced-motion` integration.** Should
   `MotionPreference: 'reduced'` map only to user choice, or should it
   ALSO auto-apply when the OS reports `prefers-reduced-motion: reduce`?
   Recommendation: OS preference is the floor (always respected); user
   pref can only further reduce, never override the OS opt-out. Confirm
   accessibility stance.

5. **Q: Density semantics.** Does `'compact'` mean (a) tighter spacing
   only, (b) shorter row heights only, (c) both, or (d) a coordinated
   reduction including font-size step-down? Coordinate with UX designer
   before defining `[data-density='compact']` rules — this affects
   information architecture, not just spacing.

---

## Handoff checklist

- [x] UserPreferences typedef defined with default values
- [x] Persistence key + service surface specified
- [x] Theme system mechanism specified (`data-theme` on `<html>`)
- [x] Backward-compat guarantee documented + testable
- [x] Component change table with LOC + §6.5 hits
- [x] §6.5 hits justified and minimized to 1 production file
- [x] Open questions surfaced for Phil decision before build
- [ ] **PHIL DECISIONS NEEDED:** open questions 2, 3, 4 (see §11)

---
END OF DELTA
