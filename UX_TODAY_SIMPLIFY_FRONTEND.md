# UX_TODAY_SIMPLIFY_FRONTEND.md
## Today Page Simplification — Frontend Implementation Map

**Directive:** Strip Today.js to header + CycleCard only. Add no-projects branch.
**Constraint:** Phase A is pure UI removal — zero composer/engine touches.
**DO NOT IMPLEMENT YET. Research/spec only.**

---

## §1 Component Usage Audit

### 1.1 MorningRecap

Source: `js/ui/components/MorningRecap.js`
Importers:
- `js/ui/pages/Today.js:29` — import, rendered at lines 166–168 (all three branches)
- `tests/ui/components/MorningRecap.test.js:17` — component test (imports directly)

No other page imports it. No other app-layer importer.

**Verdict: MOVE TO BACKUP** — source file is Today-only but has a 135-line dedicated test suite that still passes if the file exists. Keep the file. Remove import + render call from Today.js only.

---

### 1.2 RhythmExplainer

Source: `js/ui/components/RhythmExplainer.js`
Importers:
- `js/ui/pages/Today.js:25` — import, rendered at line 160 and used in all three branches (infeasible, empty, active)
- `tests/ui/components/RhythmExplainer.test.js` — component test (imports directly)

No other page imports it.

**Verdict: MOVE TO BACKUP** — Today-only, standalone test file still passes. Remove import + render call + `rhythmExplainerDismissed` prop reference from Today.js.

---

### 1.3 NowPane

Source: `js/ui/components/NowPane.js`
Importers:
- `js/ui/pages/Today.js:28` — import, rendered at lines 251–253 (active branch only)
- `tests/ui/components/NowPane.test.js:8` — component test (imports directly)

No other page imports it. Week.js does NOT import NowPane.

**Verdict: MOVE TO BACKUP** — Today-only, standalone test still passes. Remove import + `nowPaneHtml` variable + render call from Today.js.

---

### 1.4 UpNextRail

Source: `js/ui/components/UpNextRail.js`
Importers:
- `js/ui/pages/Today.js:27` — import, rendered at lines 254–271 (two variants: rail + mobile, active branch only)
- `js/ui/pages/Week.js:23` — import, rendered at line 237. **ACTIVE DEPENDENCY.**
- `tests/ui/components/UpNextRail.test.js:8` — component test
- `tests/ui/bucketMeta.regression.test.js:21` — regression fixture (imports UpNextRail to test dot compound classes)

**Verdict: KEEP SOURCE FILE** — Week.js depends on it; deletion would break Week route and regression tests. Remove only the Today.js import and the three render variables (`upNextRailHtml`, `upNextMobileHtml` at lines 254–270, and the `${upNextRailHtml}` + `${upNextMobileHtml}` template insertions at lines 299 and 318).

---

### 1.5 WhyThisPlan

Source: `js/ui/components/WhyThisPlan.js`
Importers:
- `js/ui/pages/Today.js:31` — import, rendered at lines 282–292 (active branch, PROPOSED/ACCEPTED/EDITED non-edit states)
- `tests/ui/components/WhyThisPlan.test.js:16` — component test

No other page imports it.

**Verdict: MOVE TO BACKUP** — Today-only. Remove import + `whyEligible`/`explainForWhy`/`whyThisPlanHtml` variables + `whyPlanExpanded` prop reference + render call from Today.js.

---

### 1.6 EodClosureStrip

Source: `js/ui/components/EodClosureStrip.js`
Importers:
- `js/ui/pages/Today.js:30` — import, rendered at line 277 (active branch only)
- `tests/ui/components/EodClosureStrip.test.js:16` — component test

No other page imports it.

**Verdict: MOVE TO BACKUP** — Today-only. Remove import + `eodClosureHtml` variable + render call + `eodRecap` prop reference from Today.js.

---

### Summary Table

| Component      | Source File Action | Reason                         |
|----------------|--------------------|--------------------------------|
| MorningRecap   | MOVE TO BACKUP     | Today-only; test still passes  |
| RhythmExplainer| MOVE TO BACKUP     | Today-only; test still passes  |
| NowPane        | MOVE TO BACKUP     | Today-only; test still passes  |
| UpNextRail     | KEEP               | Week.js + regression test use it |
| WhyThisPlan    | MOVE TO BACKUP     | Today-only; test still passes  |
| EodClosureStrip| MOVE TO BACKUP     | Today-only; test still passes  |

---

## §2 Today.js Render Path Delta

Pseudo-diff against `Today.js:25–323`. Lines are current line numbers.

```diff
- import { RhythmExplainer } from '../components/RhythmExplainer.js';  // line 25
- import { UpNextRail } from '../components/UpNextRail.js';             // line 27
- import { NowPane } from '../components/NowPane.js';                   // line 28
- import { MorningRecap } from '../components/MorningRecap.js';         // line 29
- import { EodClosureStrip } from '../components/EodClosureStrip.js';   // line 30
- import { WhyThisPlan } from '../components/WhyThisPlan.js';           // line 31
```

Props removed from destructuring:
```diff
- const priorDayRecap = props.priorDayRecap ?? null;     // line 133
- const eodRecap = props.eodRecap ?? null;               // line 135
- const whyPlanExpanded = !!props.whyPlanExpanded;       // line 137
```

Computed variables removed:
```diff
- const rhythmExplainerHtml = RhythmExplainer({ ... });              // lines 160–162
- const morningRecapHtml = (daysSinceSignup !== 0 && priorDayRecap)  // lines 166–168
-   ? MorningRecap({ priorDayRecap }) : '';
- const nowPaneHtml = nowIso ? NowPane(...) : '';                     // lines 251–253
- const upNextRailHtml = nowIso ? UpNextRail({ variant:'rail' }) : ''// lines 254–261
- const upNextMobileHtml = nowIso ? UpNextRail({ variant:'mobile' })  // lines 263–271
-   : '';
- const eodClosureHtml = EodClosureStrip({ eodRecap });              // line 277
- const cycleState / whyEligible / explainForWhy / whyThisPlanHtml   // lines 282–292
```

Infeasible branch (lines 182–195): remove `${morningRecapHtml}` and `${rhythmExplainerHtml}` from template.

Empty branch (lines 197–218): remove `${morningRecapHtml}` and `${rhythmExplainerHtml}` from template. This is also where the **no-projects branch** is inserted (see §4).

Active branch (lines 294–323): new minimal template:
```
  return `<main class="${mainClass}" data-route="today">
    ${header}
    <div class="today-body">
      <div class="today-card-col">
        ${CycleCard({ ... })}
      </div>
    </div>
    ${drawer}
    ${editDrawerHtml}
    ${modal}
  </main>`;
```

Removed from active branch template: `${morningRecapHtml}`, `${rhythmExplainerHtml}`,
`${nowPaneHtml}`, `${upNextMobileHtml}`, `${whyThisPlanHtml}`, `${eodClosureHtml}`,
`${upNextRailHtml}` (side-rail column), and the `today-card-col` / `today-body` wrapper
can be simplified if upNextRail side column is gone — the outer `.today-body` div
remains but the `${upNextRailHtml}` sibling is deleted.

---

## §3 Editor/Drawer/Modal Wiring

All four secondary panels are opened/closed by `app.js` event delegation, not by
Today.js state. They are only rendered when their open-flag is truthy (via `openDialog`
or `fineTune.open` or `editMode`). The simplified parent has no effect on this wiring.

### FineTuneDrawer (lines 170–178)
Props Today.js currently provides — all survive Phase A:
- `capacityMinutes` ← `fineTune.capacityMinutes ?? 480`
- `externalMinutesToday` ← `fineTune.externalMinutesToday ?? 0`
- `activeKaizenId` ← `fineTune.activeKaizenId ?? null`
- `availableKaizens` ← `fineTune.availableKaizens ?? []`
- `open` ← `!!fineTune.open`

`fineTune` is passed in from `app.js`; Today.js only forwards it. No change needed.

### EditDrawer (lines 237–248)
Props Today.js currently provides — all survive Phase A:
- `catalog` ← `props.catalog ?? []`
- `activities` ← `activitiesForRender` (from `editMode.activities` or `activeState.activities`)
- `selectedActivityId` ← `editMode.selectedActivityId ?? null`
- `search` ← `editMode.searchQuery ?? ''`
- `projectTypeFilter` ← `editMode.projectTypeFilter ?? 'all'`
- `expandedBuckets` ← `editMode.expandedBuckets ?? ['PROJECT']`
- `undoCount` ← derived from `editMode.undoStack.length`
- `violations` ← from `validateEditState(...)` — retained

Edit mode still sets `today-editing` class on `<main>` via `mainClass` at line 249.
`isEditing`, `activitiesForRender`, `compositionForRender`, and `violations` are all
still computed. No change to edit-mode logic.

### OutputArtifactDialog + SkipReasonModal (lines 180, 332–348)
Both rendered via `renderOpenDialog(openDialog)`. `openDialog` prop is unchanged.
No edit needed. The `renderOpenDialog` helper function (lines 332–348) is untouched.

---

## §4 No-Projects Branch Design

### Current empty-state (Today.js:197–218)
```js
if (!activeState) {
  // ... emptyCopy, hintHtml
  return `<main>
    ${header}
    ${hintHtml}
    ${morningRecapHtml}          // REMOVED in Phase A
    ${rhythmExplainerHtml}       // REMOVED in Phase A
    <section class="today-empty">
      <p class="empty-copy">${emptyCopy}</p>
      ${AutoPlanButton({ loading, variant: 'primary' })}
    </section>
    ...
  </main>`;
}
```

### New empty-state branching logic

The empty-state guard (`!activeState`) splits into two sub-branches:

```
if (!activeState) {
  if (hasProjects) {
    // existing: no-composition, projects exist → Auto-Plan CTA
  } else {
    // NEW: no projects at all → project-discovery flow
  }
}
```

`hasProjects` is a boolean prop passed in from `app.js` (same pattern as `isFirstRun`).
`app.js` already has access to the project store at composition time.

### New prop signature addition
```js
// In Today(props):
const hasProjects = !!props.hasProjects;   // new — default false = safe (shows discovery)
```

### ProjectDiscoveryCard component shell

New file: `js/ui/components/ProjectDiscoveryCard.js`

```js
/**
 * ProjectDiscoveryCard — entry point for the project-discovery flow.
 *
 * Pure render. Content is owned by Phil's standard work.
 * This shell provides the container, data-action hook, and
 * accessibility role. The inner copy is a slot filled by the
 * standard-work renderer (Phase C).
 *
 * Props:
 *   loading?: boolean   — mirrors AutoPlanButton's loading pattern
 *
 * Emits data-action="START_PROJECT_DISCOVERY" on primary CTA click.
 * Container class: "project-discovery-card"
 */
export function ProjectDiscoveryCard({ loading = false } = {}) {
  // Phase C: Phil fills this body with standard-work content.
  // Phase A/B stub: render the structural shell only.
  return `<section class="project-discovery-card" aria-label="Get started">
  <div class="pdc-body">
    <!-- Standard-work content rendered here in Phase C -->
  </div>
  <button
    class="pdc-cta btn-primary"
    data-action="START_PROJECT_DISCOVERY"
    ${loading ? 'disabled aria-busy="true"' : ''}
  >
    Add your first project
  </button>
</section>`;
}
export default ProjectDiscoveryCard;
```

### New empty-state render block in Today.js
```js
if (!activeState) {
  if (!hasProjects) {
    return `<main class="today-page" data-route="today">
  ${header}
  ${ProjectDiscoveryCard({ loading })}
  ${drawer}
  ${modal}
</main>`;
  }
  // existing: projects exist, no composition
  const emptyCopy = isFirstRun ? TODAY_COPY.FIRST_RUN : TODAY_COPY.EMPTY;
  const hintHtml = ...;
  return `<main class="today-page" data-route="today">
  ${header}
  ${hintHtml}
  <section class="today-empty">
    <p class="empty-copy">${esc(emptyCopy)}</p>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
  ${drawer}
  ${modal}
</main>`;
}
```

Phil owns all copy inside `ProjectDiscoveryCard`. The shell is the only new frontend
surface introduced in Phase A.

---

## §5 CSS Impact

### Classes that can be DELETED (Today-only, no other page uses them)

These appear in `app.css` under their dedicated section comments and are not referenced
by Week.js, Insights, Portfolio, or any shared component:

| CSS class(es)                     | app.css location | Safe to delete? |
|-----------------------------------|------------------|-----------------|
| `.morning-recap`                  | lines 2358–2367  | YES — Today-only component removed |
| `.eod-closure-strip`              | lines 2374–2411  | YES — Today-only component removed |
| `.eod-closure-status`             |                  | YES |
| `.eod-closure-counters`           |                  | YES |
| `.eod-closure-cta`, `:hover`      |                  | YES |
| `.why-this-plan`                  | lines 2418–2473  | YES — Today-only |
| `.why-this-plan-chip`, `:hover`, `:focus-visible` | | YES |
| `.why-this-plan--expanded`        |                  | YES |
| `.why-list`, `.why-rule`, `.why-rule:first-child`, `.why-detail` | | YES |
| `.rhythm-explainer`               | lines 119–163    | YES — Today-only |
| `.rhythm-explainer-body`          |                  | YES |
| `.rhythm-explainer-title`         |                  | YES |
| `.rhythm-explainer-copy`          |                  | YES |
| `.rhythm-explainer-dismiss`, `:hover` |             | YES |
| `.rhythm-explainer` (media query) | lines 1380–1389  | YES |

**Estimated CSS lines deleted: ~100 lines**

### Classes that MUST be KEPT (shared or still used)

| CSS class(es)                             | Reason to keep              |
|-------------------------------------------|-----------------------------|
| `.up-next-rail`, `.up-next-*`             | Week.js still renders UpNextRail |
| `.up-next-dot.chip-*` (incl. forced-color)| bucketMeta.regression.test asserts these |
| `.now-pane`, `.now-pane-*`               | Component kept in backup; CSS harmless to keep, but Week does not use NowPane — can be moved to backup alongside component |
| `.today-onboarding-hint`                  | Still used in the has-projects empty branch |
| `.today-empty`, `.today-infeasible`       | Still used by infeasible and empty branches |
| `.empty-copy`                             | Still used |
| `.today-body`, `.today-card-col`          | Still used in active branch |

### New CSS needed (Phase A)
```css
/* project-discovery-card — Phase A stub (content styled in Phase C) */
.project-discovery-card {
  padding: 36px 16px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: #fff;
}
.pdc-cta {
  margin-top: 16px;
}
```
~8 lines added.

---

## §6 Test Impact

### 6.1 Component tests — source files KEPT, all still pass

These test files import the component directly. Because the source files are kept
(moved to backup, not deleted), all tests continue to pass unchanged:

| Test file                                        | Impact     |
|--------------------------------------------------|------------|
| `tests/ui/components/MorningRecap.test.js`       | No change  |
| `tests/ui/components/RhythmExplainer.test.js`    | No change  |
| `tests/ui/components/NowPane.test.js`            | No change  |
| `tests/ui/components/WhyThisPlan.test.js`        | No change  |
| `tests/ui/components/EodClosureStrip.test.js`    | No change  |
| `tests/ui/components/UpNextRail.test.js`         | No change (file kept) |
| `tests/ui/bucketMeta.regression.test.js`         | No change (UpNextRail kept) |

### 6.2 Today.test.js — assertions on removed components

File: `tests/ui/pages/Today.test.js`

**Describe blocks that must be DELETED:**

| Lines       | Describe block                                  | Reason |
|-------------|-------------------------------------------------|--------|
| 172–233     | `Today — C-UX-10 morning recap strip` (AC10-1..5) | MorningRecap removed from Today render |
| 265–332     | `Today — C-UX-12 WhyThisPlan chip` (AC12-1..5) | WhyThisPlan removed |
| 360–583     | `Today — C-UX-3 EodClosureStrip` (AC3-1..11), 8 describe blocks | EodClosureStrip removed |

**Tests that must be UPDATED:**

- Line 563 `AC3-11: morning-recap precedes rhythm-explainer AND eod-closure-strip follows cycle-card` — delete entirely (both components removed)
- Any test asserting `rhythm-explainer` in Today output — delete

**Estimated: ~280 test lines deleted from Today.test.js.**

### 6.3 Today.sprint11.test.js

File: `tests/ui/pages/Today.sprint11.test.js`

Line 122 asserts `rhythm-explainer` index in DOM order for hint positioning.
The test at lines 116–126 (`hint appears BEFORE the rhythm explainer`) must be
**updated** — remove the `rhythmIdx` assertion entirely since RhythmExplainer is
gone. Replace with a simpler check that hint renders (or delete that specific
ordering sub-assertion).

**Estimated: 5–8 test lines updated.**

### 6.4 Today.ccc.test.js — region count drops

File: `tests/ui/pages/Today.ccc.test.js`

REGIONS array (lines 67–80) references 6 of the 12 counted regions that will now
be absent: `morning-recap`, `rhythm-explainer`, `now-pane`, `up-next-mobile`,
`why-this-plan`, `eod-closure`.

The CCC ≤ 12 bound (line 183) was designed for a page with all regions present.
Post-strip, active-composition CCC drops from ~7 (with dismissed explainer, no nowIso)
to ~4 (header, adherence-dial, cycle-card, bucket-strip, cycle-activities). The
bound is no longer meaningful at 12 — **update to ≤ 6**.

The PROSE_REGIONS array (lines 91–97) references four classes that will be absent.
Since the `extractProseText` helper returns `null` for absent regions and the loop
`continue`s, the word-count test technically still passes. However the entries are
dead — **remove the 4 prose-region entries** for clarity.

`renderActiveWithExplainer()` helper (line 151) references `rhythmExplainerDismissed: false`.
This prop is being removed from Today.js. **Delete this helper and its test** (lines 194–205).

**Estimated: ~40 lines updated/deleted in Today.ccc.test.js.**

### 6.5 Today.sprint5.test.js, Today.sprint12.test.js

Grep confirms neither file references any of the removed component classes. No changes needed.

### Summary: test files needing updates

| File                                   | Action needed        |
|----------------------------------------|----------------------|
| `tests/ui/pages/Today.test.js`         | DELETE ~280 lines    |
| `tests/ui/pages/Today.sprint11.test.js`| UPDATE ~8 lines      |
| `tests/ui/pages/Today.ccc.test.js`     | UPDATE ~40 lines     |
| All component test files (6)           | NO CHANGE            |
| All other test files                   | NO CHANGE            |

**Total: 3 test files needing edits.**

---

## §7 Estimated LOC Delta

### Phase A — UI strip + no-projects branch

| File                                       | Additions | Removals | Net    |
|--------------------------------------------|-----------|----------|--------|
| `js/ui/pages/Today.js`                     | ~15       | ~65      | −50    |
| `js/ui/components/ProjectDiscoveryCard.js` | ~22       | 0        | +22    |
| `app.css`                                  | ~8        | ~100     | −92    |
| `tests/ui/pages/Today.test.js`             | 0         | ~280     | −280   |
| `tests/ui/pages/Today.sprint11.test.js`    | 0         | ~8       | −8     |
| `tests/ui/pages/Today.ccc.test.js`         | 0         | ~40      | −40    |
| **Phase A total**                          | **~45**   | **~493** | **−448** |

---

## §8 §6.5 Boundary Check

### Phase A — pure UI removal
Zero composer/engine touches. Confirmed:
- No edits to `ComposerService`, `WeeklyComposerService`, or any `js/services/` file
- No edits to event schema or `CycleReflowed` / any emitted event
- No edits to `app.js` except: adding `hasProjects` prop passthrough to Today call
  (one-line change to `app.js`, not a composer/engine touch)
- No edits to `editMode.js`
- No edits to `validateEditState`

### Phase B — composer perfect-day (future)
Expected hits in composer layer:
- `ComposerService.composeDaily()` — new `perfectDay` param or flag
- `WeeklyComposerService.reflow()` — may need awareness of perfect-day signal
- `ComposerInput` schema — new optional field
- `app.js` — passes perfect-day signal from UI state to composer

These are architect-delta items. Phase B does not begin until architect signs off.

### Phase C — discovery content
Expected hits:
- `js/ui/components/ProjectDiscoveryCard.js` — body filled by Phil's standard work
- `app.css` — discovery card visual treatment
- `app.js` — `START_PROJECT_DISCOVERY` action handler wired

---

## §9 Phasing Recommendation

### Phase A — UI strip (independently shippable, <2 hours)
1. Remove 6 imports from `Today.js`
2. Remove prop destructuring for `priorDayRecap`, `eodRecap`, `whyPlanExpanded`, `rhythmExplainerDismissed`
3. Remove all computed variables for removed components
4. Update the three render branches to the minimal templates
5. Add `hasProjects` prop + `ProjectDiscoveryCard` shell + no-projects branch
6. Delete ~100 CSS lines for removed components
7. Update 3 test files
8. Move 5 component source files to `js/ui/components/_backup/` (not delete — preserves git blame; easy to restore)

Phase A ships standalone. No architect sign-off needed. No composer touches.

### Phase B — composer perfect-day signal
Requires architect delta before frontend work begins. Blocked until then.
Phase B frontend work: new CycleCard state render + `perfectDayHtml` variable in
active branch. Estimated: M (0.5–1d) once architect delta is approved.

### Phase C — discovery content
Blocked on Phil's standard work. Frontend shell (`ProjectDiscoveryCard`) is already
the correct handoff surface. Phase C is: fill `pdc-body` content + wire `START_PROJECT_DISCOVERY`
action in `app.js` + finalize CSS. Estimated: S (<4 hours) once content is provided.

**Phasing as stated in brief is confirmed correct.**

---

## §10 Top 3 Implementation Risks

### Risk 1: CCC test asserting region counts that are now semantically wrong
`Today.ccc.test.js` has a ≤ 12 CCC bound that was calibrated for the full-component
page. If updated to ≤ 6 before testing, the test is a useful regression guard. If
left at 12, it passes trivially and becomes meaningless. **Mitigation:** update the
bound in the same PR as Phase A; add a comment citing the new baseline.

### Risk 2: bucketMeta.regression.test.js CSS assertions on `.up-next-dot` selectors
`tests/ui/bucketMeta.regression.test.js:256–261` asserts that `.up-next-dot.chip-project`
compound selector is present in `app.css` and that the deprecated `.up-next-dot-project`
is absent. The `.up-next-*` CSS rules must NOT be deleted in Phase A (they serve Week.js).
If a developer deletes the UpNextRail CSS block alongside the component-file move,
this regression test will fail and the Week route will break visually.
**Mitigation:** The spec explicitly marks all `.up-next-*` CSS as KEEP. Verify via
`grep -n 'up-next-dot.chip-project' app.css` before merging Phase A.

### Risk 3: Today.test.js AC3-11 dual-render invariant referencing both removed components
Test at `Today.test.js:563` (`AC3-11`) asserts `morning-recap` index, `rhythm-explainer`
index, and `eod-closure-strip` index in the same render. After Phase A all three are
absent. If this test is not deleted before the PR is merged, it will fail on the
`posMorning !== -1` assertion with an opaque message. Because the test also asserts
`posCycle !== -1` (cycle-card), which still passes, the failure may look like a
CycleCard regression rather than a test-cleanup miss.
**Mitigation:** Delete the entire AC3-11 describe block as part of Phase A test cleanup.
Add a TODO comment in the test file noting the removal rationale.
