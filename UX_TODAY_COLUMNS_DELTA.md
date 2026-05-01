# UX Today Columns — Synthesis Delta
_Coordinator-authored synthesis of 6 lens reviews · 2026-04-30_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_COLUMNS_UX.md` | ✅ Returned |
| Product | `PRODUCT_TODAY_COLUMNS.md` | ✅ Returned |
| Frontend | `UX_TODAY_COLUMNS_FRONTEND.md` | ✅ Returned |
| QA | `UX_TODAY_COLUMNS_QA.md` | ✅ Returned |
| Analytics | `UX_TODAY_COLUMNS_ANALYTICS.md` | ✅ Returned |
| Competitive | `UX_TODAY_COLUMNS_COMPETITIVE.md` | ✅ Returned |

---

## 1. Phil's Stated Direction (anchor for all 6 lenses)

1. KEEP: time band, focus area (bucket chip), activity name, activity duration
2. REPLACE: `.sa-intention` ("One line: what outcome by close?" placeholder) → render the documented `outputArtifact` from CatalogEntry
3. REMOVE: `.sa-state-label` ("proposed/scheduled/in progress/closed") — useless

---

## 2. Convergence Findings (where all 6 lenses agree)

| Finding | UX | PM | FE | QA | Analytics | Competitive | Convergence |
|---|---|---|---|---|---|---|---|
| Remove `.sa-state-label` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (9/10 competitors confirm) | **6/6 — STRONG** |
| Replace `.sa-intention` with `outputArtifact` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (0/10 competitors do this — white space) | **6/6 — STRONG** |
| KEEP all 4 columns Phil flagged | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | **5/5 — STRONG** |
| §6.5 boundary: zero hits | n/a | n/a | ✅ | n/a | n/a | n/a | **CONFIRMED** |
| outputArtifact catalog coverage = 100% (60/60) | n/a | partial concern | ✅ confirmed via pipeline | n/a | n/a | n/a | **CONFIRMED** |

**ConvergenceBonus per §6.4:** lens count = 6 → bonus = +min(3, 6−1) = **+3**

---

## 3. Recommended Final Column Set

Five columns post-change (was 6). Conditional chrome unchanged.

| # | Class | Source field | Render rule | Verdict |
|---|---|---|---|---|
| 1 | `.sa-when` | `plannedStartAt` + `plannedDurationMinutes` (formatted as range) | Always | KEEP |
| 2 | `.sa-bucket-chip` | `bucket` | Always | KEEP |
| 3 | `.sa-name` | `name` (+ inline carried badge + kaizen chip) | Always | KEEP |
| 4 | `.sa-duration` | `plannedDurationMinutes` | Always; **post-Iter X+1: when state=CLOSED, render `actual / planned` ratio** (UX rec, low effort) | KEEP + minor enhancement |
| 5 | `.sa-artifact` | `CatalogEntry.outputArtifact.kind` (or `.name`) | Always when present; collapse silently when null (Lunch block, custom activities) | NEW — replaces `.sa-intention` |
| ~~6~~ | ~~`.sa-state-label`~~ | ~~`activity.state`~~ | ~~always~~ | **REMOVED** |

Conditional chrome (unchanged):
- `.sa-elapsed` (IN_PROGRESS only)
- `.sa-skip-reason` (SKIPPED only)
- `.sa-actions` (Start/Skip/Close buttons)
- `.sa-edit-actions` / `.sa-lock` (edit-mode chrome)
- `.sa-duration-chips` (edit-mode, when selected)
- `.whyChip` (PROPOSED only)

---

## 4. Lens-Specific Recommendations Beyond Phil's Direction

### UX (rejected new columns; favors restraint)
- All proposed new columns (linked-kaizen separate, carried-over separate, energy-reason, predecessor, planned-vs-actual) **rejected** as either redundant or scope creep
- **One refinement accepted**: `.sa-duration` to show `actual/planned` ratio when state=CLOSED. Low effort, high signal-to-noise.

### Product (5-column recommendation matches UX; flags coverage)
- Confirms 5-column set
- Flags concern (C-PM-25): `source50.js` sets `outputArtifact: null` for all 49 base entries — populated later in pipeline. Frontend confirms 100% coverage post-pipeline; PM concern resolved by FE.

### Frontend (zero §6.5 hits; clean implementation path)
- Catalog lookup must happen at the **caller layer** (`CycleCard.js` or higher), not inside `ScheduledActivityBlock` — pass `outputArtifactName` as a new prop
- CSS impact: `.sa-block` grid has 7 explicit columns; must update `grid-template-columns` in sync with DOM change
- Test impact: 6 tests in `tests/ui/components/ScheduledActivityBlock.test.js` need action (3 deleted, 3 redirected); CCC test unaffected

### QA (medium risk — ARIA needs care)
- Risk severity: **MEDIUM** (not LOW)
- Reasons:
  1. Removing `.sa-state-label` eliminates the only human-readable state string in DOM → ARIA regression risk unless `<li>` aria-label is updated **in same commit**
  2. `outputArtifact` prop-passing contract not yet defined → blocks new tests until API specified
  3. CSS grid-template-columns has 7 columns — must sync with DOM change or layout silently breaks
- Test count delta: +10 net (+13 new, -3 deleted, ~3 edited)

### Analytics (split-cohort dashboard, not baseline reset)
- Add `layoutVersion` discriminator to `TodayPageViewed` payload — segments pre-refactor vs post-refactor cohorts at query time
- Do NOT wait for 14-day baseline to close (operationally fragile)
- Do NOT reset baseline (discards data already collected)
- Net new events: 0 unconditional. Optional: `RowOutputClicked` if `.sa-artifact` is made clickable to open `OutputArtifactDialog`. Recommend `producedExpectedOutput: boolean` field on existing `ActivityCompleted` payload.
- Primary KPI: median `TodayPageViewed → first user action` time; success threshold = p50 drops ≥15% post-refactor.

### Competitive (validates removal; highlights white space)
- 9/10 competitors do not show a textual state label on rows → **strongly validates removal**
- 0/10 competitors surface expected-output inline → BAM-X surfacing `outputArtifact` is **genuine white space differentiation**
- Top competitive recommendation: combine **Sunsama-style planned-time chip** with **Linear-style section-based state communication**. Section grouping (PROPOSED / SCHEDULED / ACTIVE / COMPLETE) replaces per-row state label.
- Anti-patterns to avoid: ClickUp's text status chip; Asana's unbounded custom column sprawl; TickTick's right-aligned list-name muted column.

---

## 5. Consolidated Open Questions (decisions needed from Phil)

| # | Question | Source lens | Recommended default |
|---|---|---|---|
| Q1 | Render `outputArtifact.kind` or `outputArtifact.name`? | UX, FE | `.name` if present, fallback to `.kind`. Both non-null per pipeline. |
| Q2 | Should `.sa-artifact` be **clickable** to open `OutputArtifactDialog`? | UX, Analytics | **Yes** — clickable. Also enables `RowOutputClicked` analytics event. Low cost. |
| Q3 | When CatalogEntry has no outputArtifact (e.g., Lunch block from pending design), does the column **collapse** (hidden) or render `—`? | UX, FE | **Collapse silently** to preserve grid integrity. |
| Q4 | Add the CLOSED-state `actual/planned` duration ratio enhancement in this iteration, or defer? | UX | **Defer** to keep this iteration tightly scoped. New backlog candidate C-UX-COL-1. |
| Q5 | Add Linear-style section grouping (PROPOSED / SCHEDULED / ACTIVE / COMPLETE) in this iteration? | Competitive | **Defer** — significantly larger scope. New backlog candidate C-UX-COL-2 ("Section-grouping for Today rows"). |
| Q6 | Add `producedExpectedOutput: boolean` to `ActivityCompleted` payload now? | Analytics | **Defer** — touches event payload (§6.5). New backlog candidate C-AN-3. |
| Q7 | Update `<li>` aria-label to encode state semantically (since visible label is gone)? | QA | **Yes — required**. Block ship without this. AC-required. |

---

## 6. Implementation Scope (this iteration only — assuming defaults)

**In scope:**
- Remove `.sa-state-label` rendering (1 template line + delete `stateLabel()` helper, ~17 LOC removed)
- Remove `.sa-state-label` CSS (1 rule + 1 mobile selector entry)
- Replace `.sa-intention` placeholder with `.sa-artifact` rendering, sourcing prop `outputArtifactName`
- Update `CycleCard.js` (caller) to look up `CatalogEntry.outputArtifact` by `catalogEntryId` and pass as prop
- Update `<li>` aria-label to encode state semantically
- Update `app.css` grid-template-columns from 7 → 6 effective tracks
- Update 6 tests in `ScheduledActivityBlock.test.js` (3 deleted, 3 redirected)
- Add ~13 new tests covering the new artifact column, fallback when null, ARIA semantics
- Add `layoutVersion: 'v2'` field to `TodayPageViewed` event payload (analytics cohorting)

**Out of scope (deferred to backlog):**
- C-UX-COL-1: CLOSED-state `actual/planned` duration ratio
- C-UX-COL-2: Linear-style section grouping for Today rows
- C-AN-3: `producedExpectedOutput` on `ActivityCompleted`
- Section-grouping pattern (Linear-inspired)
- Project chip, due-date chip, priority badge (competitive candidates)

---

## 7. Effort & Risk

| Dimension | Estimate |
|---|---|
| LOC delta | ~+150 / -50 (net +100) |
| Test delta | +13 / -3 / ~3 edited |
| §6.5 hits | **0** (confirmed by FE) |
| Boundary protection | Catalog read-only; types/composer/engine/events untouched |
| Risk | MEDIUM (ARIA + grid-template sync) |
| Implementation hours | 3–5 hrs |
| Rollback path | Single-commit revert; no data migration |

---

## 8. Scoring (per §6.4 framework)

Item: **C-UX-COL — Today row column refactor (intention→outputArtifact, remove state label)**

| Dimension | Score |
|---|---|
| Impact | 5 (touches every Today page session) |
| Strategic alignment | 5 (deliberate-ratification model + outputArtifact = evidence linkage = product positioning) |
| Learning value | 4 (validates outputArtifact surfacing — competitive white space) |
| Confidence | 5 (6/6 lens convergence; 100% catalog coverage; 0 §6.5 hits) |
| Effort | 2 (3–5 hrs) |
| Risk | 2 (MEDIUM per QA — well-bounded) |
| **Base score** | 5+5+4+5−2−2 = **15** |
| **ConvergenceBonus (§6.4)** | +3 (6 lenses) |
| **Total** | **18** |

This **clears the score-13 gate** with strong margin.

---

## 9. Recommended Path

**Single iteration, 4 hrs of frontend work:**
1. Coordinator approval gate (this artifact)
2. Phil decisions on Q1–Q7 (defaults proposed, awaiting confirmation)
3. Dispatch frontend-engineer with this delta + UX/PM/FE/QA artifacts as inputs
4. Validate against new tests + ARIA + CCC proxy (must stay ≤12 regions)
5. Standard governance close (CHANGELOG, ITERATION_LOG, IMPROVEMENT_BACKLOG, SYSTEM_HEALTH)

**Boundary deferrals (separate iterations later):**
- C-UX-COL-1, C-UX-COL-2, C-AN-3 added to backlog
- Lunch-block work (paused — `ARCHITECTURE_DELTA_LUNCH_BLOCK.md` and `PRD_LUNCH_BLOCK.md` await Phil's open-question decisions)

---

## 10. Decision Required

Phil to choose one path:

- **A** — Approve Q1–Q7 defaults and dispatch frontend-engineer for build (recommended)
- **B** — Override one or more defaults, then dispatch
- **C** — Hold; queue C-UX-COL as backlog item for next improvement-loop selection
- **D** — Add the CLOSED-state ratio (Q4) and/or section-grouping (Q5) to in-scope before dispatching

Status: awaiting decision.
