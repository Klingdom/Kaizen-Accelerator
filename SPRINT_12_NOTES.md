# Sprint 12 Notes — Edit Mode for Today

## Summary

Four-pass sprint that replaces the Sprint-6 placeholder alert with a full
edit-mode for Today. Users can now tap Edit on a PROPOSED or
ACCEPTED/EDITED CycleCard, select a slot, and swap it for any CatalogEntry
via a right-side drawer grouped by bucket.

- **Pass 12a** — pure helpers + state + handler entry point.
- **Pass 12b** — `EditDrawer` pure component (search, filter, bucket
  cards, "In today" badge, duration delta).
- **Pass 12c** — ScheduledActivityBlock edit-mode chrome (select/remove/
  lock) + CycleCard Commit/Cancel/Undo triad.
- **Pass 12d** — `ComposerService.commitEdit`, live BucketStrip recompute,
  keyboard shortcuts (Esc/Ctrl+Z), CSS, integration tests.

Baseline: 2084 tests passing on main at `caae422` + Sprint 11 uncommitted
work. Sprint 12 total: **2241 tests passing**, 0 failing, ~1.9s full
suite.

## Files added

- `js/ui/editMode.js` — pure helpers (`isProtectedBlock`, `applySwap`,
  `applyRemove`, `applyAdd`, `activityFromCatalogEntry`,
  `computePlannedByBucket`, `validateEditState`, `pushUndo`/`popUndo`,
  `durationDelta`, `filterCatalog`, `isInToday`,
  `PROTECTED_CATALOG_IDS` / `PROTECTED_NAMES` / `PROTECTED_SLOT_KINDS`).
- `js/ui/components/EditDrawer.js` — right-side drawer component.
- `tests/ui/editMode.test.js` — 52 tests.
- `tests/ui/components/EditDrawer.test.js` — 33 tests.
- `tests/ui/components/ScheduledActivityBlock.editMode.test.js` — 10 tests.
- `tests/ui/components/CycleCard.editMode.test.js` — 9 tests.
- `tests/ui/pages/Today.sprint12.test.js` — 5 tests.
- `tests/app.sprint12.test.js` — 25 handler-integration tests.
- `tests/services/ComposerService.commitEdit.test.js` — 18 tests.
- `tests/integration/edit-mode.test.js` — 4 end-to-end tests.
- `SPRINT_12_NOTES.md` — this file.

Test delta: **+157 tests** (2241 − 2084).

## Files changed

- `js/app.js`
  - Imports `CycleEdited`, edit-mode helpers, subscribes to `CycleEdited`.
  - `createState()` extended with `editMode: null` slot.
  - Replaced the Sprint-6 EDIT placeholder alert with real entry into
    edit mode (snapshot the composition's activities + set UI state).
  - Added 12 new handlers: `EDIT`, `EDIT_EXIT`, `EDIT_SELECT_SLOT`,
    `EDIT_ADD_SLOT`, `EDIT_SWAP`, `EDIT_REMOVE_SLOT`, `EDIT_UNDO`,
    `EDIT_BUCKET_TOGGLE`, `EDIT_SEARCH`, `EDIT_PROJECT_TYPE_FILTER`,
    `EDIT_COMMIT`, `EDIT_CANCEL`.
  - `start()` wires an edit-mode-scoped keydown listener (Esc →
    `EDIT_CANCEL`, Ctrl/Cmd+Z → `EDIT_UNDO`) and an `input`-event
    delegate for the `EDIT_SEARCH` search input.
  - `renderApp()` passes `editMode` + `catalog` into the Today page.
- `js/services/ComposerService.js`
  - New `commitEdit(compositionId, newActivities, opts)` method. Atomic
    replace: unchanged (same id + same catalogEntryId) rows preserve
    runtime state, swapped/removed rows are marked DROPPED,
    fresh/added rows land under a unique id. Recomputes
    `plannedByBucket`. Transitions PROPOSED → EDITED (leaves ACCEPTED/
    ACTIVE/CLOSED alone). Publishes `CycleEdited` with
    `{compositionId, userId, swaps, committedAt}`.
- `js/ui/pages/Today.js`
  - New `editMode` + `catalog` props.
  - When `editMode` is non-null: renders CycleCard with edit flags
    (live activities, Commit/Cancel/Undo triad, edit-mode chrome on
    rows), renders `EditDrawer`, adds `today-editing` class (dims
    surrounding content via CSS).
  - BucketStrip reads live `editMode.activities`, not the persisted
    composition — totals update instantly as the user swaps.
- `js/ui/components/CycleCard.js`
  - `editMode`, `selectedActivityId`, `undoCount` props added.
  - `renderProposed` + `renderAccepted` swap the normal triad for a
    Commit/Cancel/Undo triad when editing, drop Start/Skip runtime
    actions, and forward editMode flags into each row.
- `js/ui/components/ScheduledActivityBlock.js`
  - `editMode` + `editSelected` props.
  - Adds `edit-selectable` / `edit-selected` / `edit-protected` classes.
  - Non-protected rows render a Select + × (Remove) button and carry
    `data-action="EDIT_SELECT_SLOT"` on the `<li>` itself so the entire
    row is a click hotspot (accessibility-first spine).
  - Protected rows render a lock icon + tooltip, no edit actions.
- `app.css`
  - ~300 lines appended covering `.edit-drawer`, `.edit-bucket-card`,
    `.edit-catalog-card`, `.edit-pt-filter`, `.edit-drawer-footer`,
    `.sa-block.edit-*`, `.edc-*` chips, `.triad.triad-edit`, mobile
    full-screen drawer takeover at `<600px`.
- `tests/app.test.js` — the old Sprint-6 alert test was replaced with
  two Sprint-12 tests (enter edit mode + ignore unknown compositionId).

## "Better than requested" enhancements shipped

1. **Click-to-swap primary, drag-drop deferred.** Accessible, keyboard-
   friendly, works on mobile. Every row + catalog card is a real
   `<button>` wired via data-action delegation.
2. **"In today" badge** — every catalog card cross-checks the current
   edit-mode activities array and shows a yellow `In today` chip when
   the same catalogEntryId is already scheduled.
3. **Protected blocks locked** — non-optionals (by catalogEntryId OR
   name OR slotKind AM_COMM / POST_LUNCH_COMM), sprint ceremonies, R2
   rescues (`carriedOver`), and strategic Deep payload (PROJECT +
   `strategic: true`) render a 🔒 icon, cannot be selected or removed,
   and attempted swap surfaces an info toast explaining why.
4. **Real-time BucketStrip** — Today page recomputes
   `plannedFromActivities(editMode.activities)` on each render, so the
   4-2-2 strip updates instantly. `validateEditState` returns UNDER_
   FLOOR / OVER_CEILING violations; bucket panels in the drawer get
   `edit-bucket-violated` class (red outline) when broken.
5. **Undo stack** — up to 20 snapshots; every swap / remove / add
   pushes; Ctrl/Cmd+Z or the Undo button restores. Success toast
   announces each undo.
6. **Duration delta chip** — when a slot is selected, every catalog
   card shows `+30m` or `-15m` in its meta row (green for positive,
   red for negative, grey for zero). Clears when selection clears.
7. **Search within drawer** — top-level `<input type="search">` matches
   name + activityNumber (`#34`) + procedure text + id,
   case-insensitive. Wired via an input-event delegate in app.js
   (clicks go through the normal dispatcher).
8. **Project-type filter** — 5 pills (All / 30-Day Accelerator / 90-Day
   Kaizen / DMAIC / Ad Hoc) visible only when the PROJECT panel is
   expanded. Maps the legacy `KAIZEN_EVENT` binding onto
   `KAIZEN_EVENT_90D`. Null binding → Ad Hoc.
9. **Remove + Add-slot** — × button on every non-protected row removes
   it; `+ Add slot` in the drawer footer flips `selectedActivityId` to
   the magic `'__new__'` sentinel so the next catalog-card click
   appends a fresh slot to the bottom of the activities list.
10. **`CycleEdited` event emission** — `ComposerService.commitEdit`
    publishes exactly once per commit with payload
    `{compositionId, userId, swaps: [{slotActivityId,
    fromCatalogEntryId, toCatalogEntryId}], committedAt}`. Cancel
    restores the snapshot by simply dropping `state.editMode`; no
    event fires.
11. **Keyboard shortcuts** (bonus) — `Esc` cancels the edit session,
    `Ctrl+Z` / `Cmd+Z` undoes. Only active while `state.editMode` is
    set; both are suppressed when focus is inside an input/textarea.
12. **Dimmed background** (bonus) — `today-editing` class on `<main>`
    plus `cycle-card:not(.cycle-editing) { opacity: 0.4 }` makes the
    surrounding page recede so focus stays on the active flow.

## Acceptance criteria — checked

1. Full suite **2241 passing** / 0 failing / ~1.9s ✅ (target: ≥2200
   passing, <3s).
2. Edit on PROPOSED or ACCEPTED CycleCard opens the drawer ✅.
3. Drawer shows 3 bucket cards, expand/collapse, search, project-type
   filter all functional ✅.
4. Click-a-slot + click-a-card swap; BucketStrip updates live;
   protected blocks reject with toast ✅.
5. Undo works for 5+ swaps; Esc cancels; Ctrl+Z undoes ✅ (keyboard
   paths are browser-only; the handler contracts are test-covered).
6. Commit persists via `ComposerService.commitEdit`; `CycleEdited`
   fires with `{compositionId, userId, swaps, committedAt}` ✅.
7. Cancel restores snapshot (implementation: `state.editMode = null`;
   snapshot is never persisted mid-edit) ✅.
8. "In today" badge surfaces on any currently-scheduled catalog card ✅.
9. Duration delta chip shown when slot selected + card focused ✅.
10. Remove + Add-new flows both functional ✅.

## Deviations from the brief

- **Edit-mode state init** — the brief listed
  `expandedBuckets: Set<...>`. JSON-over-DI-friendly arrays were used
  instead (`['PROJECT']` by default) since the state is shallow-
  snapshotted across handler calls and a `Set` doesn't round-trip the
  way the rest of `state.editMode` does. No user-visible impact.
- **Cancel = drop snapshot** — the brief said "Cancel restores
  snapshot". Because the snapshot is never persisted mid-edit (all
  mutations live on `state.editMode.activities`), the restore is a
  trivial `state.editMode = null`. A follow-up that wants the
  snapshot-restore path visible (e.g. preview-before-commit) can call
  `state.editMode.activities = state.editMode.snapshotActivities` —
  the snapshot is still stored on the state object.
- **Drag-drop** — not shipped. Click-to-swap is the spine per
  enhancement #1. Drag-drop is a strict add-on for a future sprint.
- **Real-time violations** — the drawer applies `edit-bucket-violated`
  classes but there's no hard block on Commit. The composer-level
  invariants are not re-enforced at commit time (user can, e.g.,
  shrink PROJECT below floor). Follow-up: either surface a Commit-
  time confirm or re-validate and return an error.

## Test-suite shape (2241 / 0 / ~1.9s)

- `editMode` pure helpers: 52 tests.
- `EditDrawer`: 33 tests.
- `ScheduledActivityBlock` edit-mode: 10 tests.
- `CycleCard` edit-mode: 9 tests.
- `Today.sprint12`: 5 tests.
- `app.sprint12` handlers: 25 tests.
- `ComposerService.commitEdit`: 18 tests.
- `edit-mode` integration: 4 tests.

## Not touched (per brief)

- `js/composer/composeDaily.js` — read DAILY_NON_OPTIONAL_SET /
  SPRINT_CEREMONIES only.
- `js/engine/relaxConfigurable.js` — read PROTECTED set only (mirrored
  in `editMode.js`).
- Sprint 8 FSM Kaizen methods — untouched.
- `ARCHITECTURE.md` / Caddy / Docker / deploy — untouched.

## Suggested follow-ups

1. Commit-time re-validation — if the edited activities violate a hard
   invariant (floor/ceiling), surface a confirm dialog or an
   error toast instead of a silent commit.
2. Drag-drop enhancement layer over the existing click-select-then-
   click-card spine. HTML5 DnD on desktop, long-press on mobile.
3. Per-slot duration override — currently swap takes the catalog
   entry's `defaultDurationMinutes`; a future pass could let the user
   shrink/grow the replacement inline.
4. Keyboard shortcuts for Commit (Ctrl+Enter?) — user request.
