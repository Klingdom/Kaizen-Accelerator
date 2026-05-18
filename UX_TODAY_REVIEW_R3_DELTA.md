# Today Page R3 — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-04-30_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_REVIEW_R3.md` | ✅ |
| Frontend | `UX_TODAY_REVIEW_R3_FRONTEND.md` | ✅ |
| QA | `UX_TODAY_REVIEW_R3_QA.md` | ✅ |

**Lens count: 3 → ConvergenceBonus cap = +3**

---

## 1. Phil's Directive

> "Have the subagents review the today page for functionality and user experience and make recommended improvements."

Scope: cumulative Iter 31–49 deploy (color identity, calendar, luminous constraint, per-task-type info, dragController hotfixes).

---

## 2. Headline — Where the Page Stands

All 3 lenses independently arrive at the same verdict:

> **"In a good place. Needs targeted polish, not rework."** (UX)
> **"Ship with 2 caveats."** (QA — Risk 1 is a release blocker; Risk 3 is a P1 follow-up)
> **"Structurally healthy. §A.3 reconciliation cleanup overdue."** (FE)

No agent recommends restructuring. No agent finds a critical functionality defect that breaks user value. The convergent fixes are correctness + cleanup, not redesign.

---

## 3. STRONG CONVERGENCE — Action Required

### 3.1 SHIPPED BUG — Dark-mode token mismatch on lunch tooltip + BDD rationale (3 lenses)

**Convergence: 3/3** (UX flagged at `app.css:712`; QA confirmed independently as Risk 1; FE flagged the broader §A.3 token-system drift)

`.lunch-tooltip-content` uses `var(--color-surface, #fff)` — a token that is NOT declared in the dark-mode block at `app.css:3889`. Every dark-mode user gets a white flash on lunch click. The four child spans (`--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`) all have the same problem. `.bdd-rationale` at `app.css:754` shares the bug with `var(--color-text-secondary, #6b7280)`.

The rest of the codebase uses the Iter 39 semantic token layer (`--surface-card`, `--text-primary`, `--border-subtle`). The lunch tooltip + BDD rationale were added later and bypassed this convention.

**Fix scope:** CSS-only. 4-line substitution. ~30 minutes including a contrast regression test.

**Verdict:** **Release blocker per QA. Cannot ship dark-mode users into this.**

---

### 3.2 DEAD CODE + ORPHANED CSS — Reconciliation overdue (2 lenses + META §A.3)

**Convergence: 2/3** (FE explicit at §1-C, §1-D, §1-E, §3-D; UX implied at §6 unconcerned about restoration)

| Orphan | Location | Lines |
|---|---|---|
| `renderBucketStrip()` dead function | `Today.js:419–470` | 52 |
| `formatHeaderDate()` dead function | `Today.js:55–70` | 16 |
| `DEFAULT_TARGETS` import triangle | `Today.js:38` | 1 |
| `.today-header-date` CSS + dark variants | `app.css:180–184, 4259–4279` | ~24 |
| `.cycle-bucket-strip` CSS block | `app.css:3713–3795` | ~83 |
| `.today-body-with-strip` + `.today-grid-col` | `app.css:3796–3831` | ~36 |

**Total: 4 dead JS functions + ~120 orphaned CSS lines.**

META §A.3 (reconciliation audit rule) explicitly demands these be cleaned when emitters are removed. They have been deferred across multiple iterations with "retained for future use" comments — those comments themselves are now misleading because the CSS classes they reference are no longer in any render path.

**Fix scope:** Pure deletion. No risk of behavioral change. ~1 hour with test re-run.

---

### 3.3 MODAL MUTUAL-EXCLUSION GAP — Double-overlay bug class (2 lenses)

**Convergence: 2/3** (FE flagged `EOD_OPEN_REFLECTION` → `state.blockDetail` not cleared at §1-F; QA flagged `OPEN_BLOCK_DETAIL` + `DRAG_CONFIRM` banner co-existence as Risk 3)

Same architectural pattern: state slices for modal-adjacent surfaces (`blockDetail`, `dragSession`, `reflectionSheet`, `lunchTooltip`, `catalogPickerDialog`) are all independent and none clear the others before opening. This is a structural defect, not a per-handler bug.

Concrete sequences that produce visible breakage:
1. EoAR block → BlockDetailDialog → Start Reflection → ReflectionSheet opens *behind* the dialog (z-index dependent)
2. Drag block in PROPOSED → confirm banner appears → tap another block → both `role="alert"` banner AND `role="dialog"` panel render simultaneously; Escape only clears one

**Fix scope:** Add mutual-exclusion guards to each modal-state opener (3-4 handlers). Alternative: single render-time guard in `Today.js` that enforces precedence. ~1.5 hours including integration tests for both sequences.

---

## 4. SINGLE-LENS BUT CREDIBLE — Worth Recognizing

### 4.1 Ghost block NaN positioning (FE §1-H)

`dragSession.proposedStart` is populated from `payload.proposedStartMin` (app.js:2089), but `onDragPending` in `dragController.js:407` sends `newStart` as a HH:MM string, not minutes. The ghost block at `TodayGrid.js:697` computes `null - gridStartHour*60 = NaN` and renders `top: NaNpx; height: NaNpx` — invisible but DOM-resident.

**Impact:** Ghost preview is silently broken in PROPOSED pending flow. Confirm banner still works.

**Fix scope:** S — populate `proposedStartMin` correctly in `onDragPending` OR convert in TodayGrid. ~30 min + 1 test.

---

### 4.2 Kaizen dual representation (UX §3 Improvement 3)

PROJECT and CI blocks with a linked kaizen show the title in BOTH the kaizen sub-label (mono text, opacity 0.65) AND the kaizen chip (glow pill below). Same string, twice, on already-compact 12px blocks.

**Fix scope:** M — conditional render in `renderProjectBlock` / `renderCIBlock`. Decision needed: which element wins?

---

### 4.3 NowJumpButton arrow direction (UX §3 Improvement 4)

Static `↓ Now` is wrong when user is scrolled below the now-line. Drop the arrow, keep the pill.

**Fix scope:** XS — 5-minute single-string change.

---

### 4.4 Unknown-bucket silent fallback (QA §2 Risk 2)

`TodayGrid.js:569–571` falls through to `renderProjectBlock` for any unknown bucket with no `console.warn`. Future bucket additions (e.g. `LEARNING`) would render silently as Deep Work. Developer-experience risk, not user-facing.

**Fix scope:** XS — one-line warn + one test.

---

### 4.5 DRAG_CONFIRM silent failure (FE §1-B)

`state.dragSession = null` runs BEFORE `_ensureEditMode()` guard. If the guard fails, the user clicks Confirm, sees the banner disappear, but nothing persists. No toast, no error.

**Fix scope:** S — reorder + add toast on failure. ~30 min + 1 test.

---

## 5. DEFERRED — Polish & Architecture (real findings, lower priority)

| # | Finding | Lens | Effort | Total Score |
|---|---|---|---|---|
| D1 | Remove PROPOSED banner (redundant with dashed outlines) | UX | S | 8 |
| D2 | Resize handle hit area 10→16px (WCAG 2.5.8) | UX | S | 7 |
| D3 | Empty-state header symmetry placeholder | UX | S | 6 |
| D4 | Keyboard path to CatalogPicker | UX | M | 9 |
| D5 | Extract shared `parseMinutesOfDay` to `js/ui/timeUtils.js` | FE | M | 8 |
| D6 | Stagger animation cap > 6 blocks | FE | S | 5 |
| D7 | DC-L9/L10 test label correction (§A.2 hygiene) | FE | S | 6 |
| D8 | Stale `CycleCard.js` file docstring | FE | S | 4 |
| D9 | Past-hour block dimming (visual consistency with rail) | UX | S | 5 |

All below score-13 gate. Batch into a future polish sprint.

---

## 6. Scoring (per §6.4)

### Phase 1 — Dark-mode token fix (release blocker)

| Dimension | Score |
|---|---|
| Impact | 3 (visible regression on every dark-mode lunch click) |
| Strategic alignment | 4 (correctness; trust) |
| Learning value | 2 (codifies token-system discipline) |
| Confidence | 5 (3-lens convergence; CSS-only) |
| Effort | 1 (30 min) |
| Risk | 1 (CSS-only, no logic) |
| **Base** | 3+4+2+5−1−1 = **12** |
| **ConvergenceBonus** | **+3** (3 lenses) |
| **Total** | **15** |

### Phase 2 — Cleanup + double-overlay (convergent quality fixes)

| Dimension | Score |
|---|---|
| Impact | 3 (DX clarity + UX defect removal) |
| Strategic alignment | 4 (META §A.3 reconciliation overdue across 3+ iterations) |
| Learning value | 3 (codifies mutual-exclusion pattern for future modals) |
| Confidence | 5 (convergent; deletions are mechanical) |
| Effort | 2 (2.5–3 hr total) |
| Risk | 2 (mutual-exclusion guards touch state handling) |
| **Base** | 3+4+3+5−2−2 = **11** |
| **ConvergenceBonus** | **+2** (2 lenses) |
| **Total** | **13** |

### Phase 3 — Single-lens latent bugs + UX polish

| Dimension | Score |
|---|---|
| Impact | 3 |
| Strategic alignment | 3 |
| Learning value | 2 |
| Confidence | 4 |
| Effort | 3 (~3–4 hr for 4.1–4.5 combined) |
| Risk | 2 |
| **Base** | 3+3+2+4−3−2 = **7** |
| **ConvergenceBonus** | **+1** |
| **Total** | **8** |

### Phase 4 — Deferred polish

Total: **~5** (below gate; batch later)

---

## 7. Decision Required

Phil to choose:

- **A** — Phase 1 only. 30 min. Ships the dark-mode fix. Defers everything else.
- **B** — Phase 1 + Phase 2. ~3 hr. Ships dark-mode + clears the dead-code backlog + fixes both double-overlay bugs. **Both phases pass the score-13 gate.**
- **C** — Phase 1 + 2 + 3. ~7 hr. Adds ghost-block, kaizen consolidation, NowJump arrow, unknown-bucket warn, DRAG_CONFIRM silent-failure fix. Phase 3 items are below gate individually but cheap when batched.
- **D** — Pick specific items by listing them.
- **E** — Hold; review individual lens artifacts first.
- **F** — Reject; ship as-is.

**My recommendation: B.**

Reasoning:
- Phase 1 is a real release blocker (QA's verdict). It cannot wait.
- Phase 2 is overdue (META §A.3 has been deferred across 3+ iterations) and the double-overlay bug class will keep growing as more modals are added. Fixing the pattern now is cheaper than fixing each instance later.
- Phase 3 items are useful but none individually score above gate; deferring them to a Phase-3 sprint when 2–3 more single-lens findings accumulate is more efficient.

If you want minimum scope: **A** (just unblock dark-mode users; defer everything else).

If you want a fuller polish pass: **C** (the full ~7 hr block clears every shipped or near-shipped defect found).

---

## 8. Bystander Notes

- Deploy queue depth at synthesis time: 0 (last deploy was Iter 49, Phil confirmed deployed).
- All three lenses agree the per-bucket render dispatch (Iter 47) and the DC-IP/DC-PR regression lock (Iter 41+45) are structurally exemplary. **Do not touch those.**
- The CadencePressureRing, now-line glow, sacred-CI treatment, and CI-unlinked indicator were called out as reference-quality by UX. Same: do not touch.
- META §A.3 (reconciliation audit) cleanup has been deferred for 3+ iterations. Phase 2 closes that debt.
- META §A.2 (orthogonal-case) compliance is strong in tests but the DC-L9/L10 label drift (FE §4-F) suggests one final hygiene pass on test descriptions is warranted in Phase 4.
