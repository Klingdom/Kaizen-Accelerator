# Steps-to-Complete — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-05-19_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| PM | `STEPS_TO_COMPLETE_PM.md` | ✅ |
| UX | `STEPS_TO_COMPLETE_UX.md` | ✅ |
| FE | `STEPS_TO_COMPLETE_FRONTEND.md` | ✅ |

**Lens count: 3 → ConvergenceBonus = +3**

---

## 1. Phil's Directive

> "For task cards on the today page, always add the steps to complete section so users understand exactly how to complete the task."

Approved working assumptions:
- Source of truth: per-catalog-entry
- Render location: BlockDetailDialog only
- Scope: PROJECT + CI get step lists; COMM single-line guidance; LUNCH + PROTECTED skip

---

## 2. CRITICAL DISCOVERY (PM lens — overrides original plan)

**`CatalogEntry.procedure` already exists** and is populated across the 61-entry catalog. Declared at `js/domain/types.js:402` as `string[]`. Populated by the seed pipeline:

- `cer_quarterly_planning` — 7 steps
- `cer_sprint_planning` — 3 steps
- `cer_sprint_retrospective` — 3 steps
- `cer_sprint_review` — 4 steps
- `cer_mid_sprint_review` — 3 steps
- `gen_end_of_activity_reflection` — 4 steps
- `gen_weekly_reflection` — 4 steps
- `gen_lessons_learned` — 4 steps
- `gen_deep_work_project` — 3 steps
- All `cat_*` numbered entries — populated via `source50` + `fillGaps`

**Implication:** Phase 1 ships real content immediately. No schema migration. No §6.5 hit on `js/domain/types.js`. No "Steps coming soon" empty state on production catalog entries.

The `completionSteps?: Array<{id, text, optional}>` typed overlay proposed by FE remains structurally correct as a **Phase 3+** enrichment when Phil wants stable IDs and optional flags. For Phase 1, render `procedure` directly.

---

## 3. Convergent Decisions (3/3 lenses agree)

### 3.1 Scope dispatch
- **PROJECT** → numbered list
- **CI** → numbered list
- **COMMUNICATION** → no steps section (route `communicationGuidance` through existing `getCommRationale()` as priority-2b — FE's critique adopted)
- **LUNCH** (`bucket === null`) → skip entirely
- **PROTECTED** → render normally per bucket (no isProtected guard; FE's final position adopted)
- **`gen_end_of_activity_reflection`** → skip entirely (already has "Start Reflection" footer action — PM AC-8)

### 3.2 Visual treatment
- **Heading:** "Steps to complete" (noun phrase, matches `.bdd-label` pattern — UX wins over PM's "How to complete")
- **Style:** `var(--font-mono)` 11px uppercase `--ink-400` — same class as existing `.bdd-label`
- **Format:** `<ol>` numbered list (not checkboxes — false affordance without persistence)
- **Optional steps:** dim with `var(--text-muted)` + parenthetical `(optional)` in the text node
- **Per-bucket color:** neutral (color bar already signals bucket)
- **Long-list:** `<ol>` scrolls at `max-height: 160px` (~6-7 items); panel does NOT scroll; footer stays pinned
- **`bdd-panel` fix:** add `max-height: 80vh; overflow-y: auto;` to prevent footer clip on short viewports

### 3.3 Information hierarchy
Insert between `</dl>` (data rows) and `bdd-rationale-section` (rationale sentence) at `BlockDetailDialog.js:294–295`:
```
Color bar → Title → Time/Output/Participants/Kaizen rows → STEPS → Rationale → Footer
```

### 3.4 Token discipline (R3 Phase 1 lesson)
**MANDATORY:** Use only Iter 39 semantic tokens (`--text-primary`, `--text-secondary`, `--text-muted`, `--surface-card`, `--border-subtle`). Do NOT introduce `--color-*` tokens. R3 Phase 1 fixed exactly this bug class on `.lunch-tooltip` and `.bdd-rationale`. Repeating the bug is a §A.3 reconciliation failure.

### 3.5 Accessibility
- Heading: `<h3>` (one level below `<h2 class="bdd-title">`)
- List: `<ol>` (NOT div+div)
- Optional steps: parenthetical text node (NOT aria-label override — keeps visible and spoken text aligned)
- Reduced motion: no entrance animation in Phase 1

### 3.6 Tests
~15–18 cases mirroring `BlockDetailDialog.iter47.test.js` pattern. Full META §A.2 orthogonal pairs (every "renders X" has a paired "does NOT render X under condition Y").

---

## 4. Tensions Resolved

| Tension | Lenses | Resolution |
|---|---|---|
| `procedure` vs `completionSteps` field | PM vs FE+UX | **Use `procedure` for Phase 1** (PM). `completionSteps` as typed overlay deferred to Phase 3+ when content authoring needs IDs + optional flags. |
| COMM render path | FE critique vs PM/UX | **FE wins.** `communicationGuidance` slots into existing `getCommRationale()` as priority-2b. No second render path. |
| Heading copy | PM vs UX | **UX wins.** "Steps to complete" matches `bdd-label` noun-phrase pattern. |
| Empty-state copy | PM generic vs UX type-specific vs FE "coming soon" | **UX wins.** Type-specific copy ("No steps defined for this work type yet." / "...improvement activity yet."). |
| `isProtected` guard | FE oscillates | **FE final position adopted.** No isProtected guard. Protected blocks render normally per bucket. Protected ceremonies with populated `procedure` show their steps. |
| Optional flag in Phase 1 | PM AC-10 wants markup hook now | **Defer.** `procedure: string[]` has no optional flag. Render function takes plain strings. Optional support arrives with `completionSteps` overlay. |
| `BLOCK_DETAIL_OPEN` instrumentation | PM SW-Q5 | **Defer.** Separate improvement-loop item. Not blocking Phase 1. |

---

## 5. Phased Plan

### Phase 1 — Render `procedure` (3–4 hr, ships visible content immediately)
**File changes:**
- `js/ui/components/BlockDetailDialog.js` — add `renderCompletionSteps(catalogEntry, bucket)` helper; insert call between `</dl>` and `bdd-rationale-section` at ~line 294
- `app.css` — add 7 new classes (`.bdd-steps-section`, `.bdd-steps-heading`, `.bdd-steps-list`, `.bdd-step-item`, `.bdd-step-item--optional`, `.bdd-steps-empty`, `.bdd-steps-section--empty`); add `max-height: 80vh; overflow-y: auto;` to `.bdd-panel`
- `tests/ui/components/BlockDetailDialog.steps.test.js` — ~15–18 tests, full §A.2 orthogonal coverage

**Data:** none. Uses existing `catalogEntry.procedure`.

**§6.5 hit:** NO (no `js/composer/`, `js/engine/`, `js/types/`, `js/events/` changes).

**What's visible day 1:**
- All ceremonies (sprint planning, retrospective, etc.) show their 3–7 step procedures
- All generics (weekly reflection, lessons learned, deep work) show their procedures
- `cat_*` numbered entries show populated procedures (from `source50` + `fillGaps`)
- User-added activities show the type-specific empty state
- COMM blocks unchanged (rationale sentence path)
- LUNCH + EoAR unchanged

### Phase 2 — Content curation (Phil-blocked, deferred)
Author/refine procedure content for:
- `gen_deep_work_project` (3 generic steps — confirm they're canonical) — SW-Q1
- `cat_1` (L&D Tracker) — SW-Q2
- `cat_12` (PDCA Cycle) — SW-Q2
- Trim `fillGaps` #20 (DMAIC Charter, 9 steps) toward the 3–7 range

**Phil-blocked:** content authority.

### Phase 3 — `completionSteps` typed overlay (deferred)
Introduce optional `completionSteps?: Array<{id, text, optional}>` on `CatalogEntry`. Renderer prefers it over `procedure` when present. Enables:
- Stable IDs (for analytics)
- Optional-step flagging (dim visual)
- Per-step metadata expansion

**§6.5 hit:** YES (modifies `js/domain/types.js`).

### Phase 4 — Edit/add affordance (deferred)
In-app authoring UI. Blocked on workflow decision (in-app vs seed pipeline).

### Parallel item — `BLOCK_DETAIL_OPEN` instrumentation
Separate improvement-loop dispatch. Adds the event to `js/events/events.js` so Phase 1 impact is measurable.

---

## 6. Scoring (per §6.4)

### Phase 1

| Dimension | Score |
|---|---|
| Impact | 4 (every standard-work click surfaces execution guidance; high daily touch) |
| Strategic alignment | 4 (Phil's directive; strengthens "standard work" OS positioning) |
| Learning value | 3 (validates click-to-expand model; baseline for opens metric) |
| Confidence | 5 (3-lens convergence; `procedure` already populated; pure render addition) |
| Effort | 2 (one render section, 7 CSS classes, ~3–4 hr including tests) |
| Risk | 1 (pure HTML string render; no state; no §6.5; worst case = empty section) |
| **Base** | 4+4+3+5−2−1 = **13** |
| **ConvergenceBonus** | **+3** (3 lenses) |
| **Total** | **16** |

**Well above the score-13 gate. Ship.**

Phase 2 deferred (Phil-blocked on content).
Phase 3 deferred (introduces §6.5 hit; wait until content needs IDs/optional flags).
Phase 4 deferred (workflow decision needed).

---

## 7. Open Questions for Phil (do not block Phase 1)

| ID | Question | Resolution path |
|---|---|---|
| SW-Q1 | Are `gen_deep_work_project`'s 3 existing steps canonical, or do they vary per named project? | Phase 2 content decision |
| SW-Q2 | Canonical steps for `cat_1` (L&D Tracker) and `cat_12` (PDCA Cycle)? | Phase 2 content decision |
| SW-Q4 | `cer_mid_sprint_review` is bucket-COMMUNICATION with a 3-step procedure. Strict bucket-rules (no steps) or ceremony-override (show steps)? | **Default in Phase 1: strict bucket-rules.** COMM = no steps list. Phil can override later. |
| SW-Q5 | Add `BLOCK_DETAIL_OPEN` event for Phase 2 impact measurement? | Separate improvement-loop dispatch — not blocking Phase 1 |
| SW-Q6 | Confirm: no Edit-steps affordance in Phase 1 or Phase 2 — read-only until Phase 4? | **Default: confirmed read-only.** No Edit affordance. |

SW-Q3 (heading copy) resolved by synthesis → "Steps to complete".

---

## 8. Decision Required

Phil to choose:

- **A** — Dispatch Phase 1 now (3–4 hr). Defers SW-Q1/2/4/5 (all content/instrumentation decisions can wait).
- **B** — Dispatch Phase 1 + answer SW-Q4 now (mid_sprint_review treatment).
- **C** — Hold; review lens artifacts first.
- **D** — Reject; out of scope.

**My recommendation: A.**

Reasoning:
- Phase 1 scores 16 (well above gate)
- `procedure` already populated → ships visible content day 1 (not a "scaffolding-only" release)
- No §6.5 hit; isolated to 1 component + 1 CSS block + 1 test file
- All SW-Qs are deferrable without changing the Phase 1 shape
- Token discipline carries forward from R3 Phase 1 lesson (no regression)

If you want minimum scope: same answer — A is already the minimum viable.

---

## 9. Bystander Notes

- Deploy queue: 0 (R3 Phases 1–3 all pushed)
- Last 3 dispatches (R3 P1/P2/P3) shipped clean with no regressions
- META §A.3 reconciliation: this feature introduces new CSS classes — confirm each has an emitter at the time of merge (the test suite will catch this orthogonally if the §A.2 "does NOT render" cases are written)
- META §A.2 orthogonal-case discipline carries forward; FE test plan mirrors `BlockDetailDialog.iter47.test.js` which is the reference template
