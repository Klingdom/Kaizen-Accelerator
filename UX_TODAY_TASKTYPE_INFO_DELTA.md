# UX Today Task-Type Info — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-05-18_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_TASKTYPE_INFO_UX.md` | ✅ |
| Product | `UX_TODAY_TASKTYPE_INFO_PRODUCT.md` | ✅ |
| Frontend | `UX_TODAY_TASKTYPE_INFO_FRONTEND.md` | ✅ |

**Lens count: 3 → ConvergenceBonus = +2**

---

## 1. Phil's Directive

> "Have subagents determine the best information possible for each task type on the today page"

---

## 2. Strong Convergence: NET CUT info density while ADDING per-type specificity

All 3 lenses agree the direction is:
- ✅ **REMOVE** generic/redundant info (bucket-label text rows, disabled Edit buttons, repeated labels)
- ✅ **ADD** specific evidence-linked info per task type (catalog activity name, kaizen linkage, rationale)
- ✅ **Lunch is the most-stripped** — possibly NO detail dialog at all
- ✅ **Protected blocks need re-thinking** — disabled Edit button is "the most useless element in the system" per UX
- ✅ **0 §6.5 hits expected** for all proposals — pure UI work

---

## 3. Convergent Per-Type Recommendations

### PROJECT (Deep Work — green)
| Convergence | Recommendation |
|---|---|
| **3/3** | Show SPECIFIC catalog activity name, not generic "Deep Work" |
| **3/3** | Add `outputArtifact.name` to compact card (height-gated, ≥56px height) |
| **3/3** | Add linked Kaizen title as sub-label when present (PM: "must show") |
| **3/3** | Wire `composerInputsSnapshot.explain` into BlockDetailDialog as plain-prose rationale |
| **3/3** | REMOVE bucket-label "PROJECT" text row (color carries it) |
| **3/3** | REMOVE standalone duration row in dialog (time-range already includes duration) |

### COMMUNICATION (yellow) — sub-types matter
| Convergence | Recommendation |
|---|---|
| **3/3** | Show specific sub-type name as primary label (Daily Standup / AM Comm / Post-lunch / End-of-Deep-Cycles), NOT generic "COMMUNICATION" |
| **3/3** | Each sub-type implies different procedure → different rationale text per `slotKind` |
| **3/3** | REMOVE bucket-label "COMMUNICATION" text row |
| **3/3** | REMOVE disabled Edit button (currently the most useless element — communicates "you can't do this" without saying why) |
| **3/3** | Replace with single rationale sentence keyed on `activity.slotKind` or `catalogEntryId` |

### CI (purple) — sub-types matter; SACRED treatment
| Convergence | Recommendation |
|---|---|
| **3/3** | Show specific CI activity name (End-of-Activity Reflection vs Sprint Retro vs user-added) |
| **3/3** | Surface linked Kaizen / PdcaExperiment as sub-label (PM: "must announce evidence connection") |
| **3/3** | CI blocks with no Kaizen link visually distinguishable from those linked |
| **3/3** | Reflection: replace disabled Edit with "Start Reflection" action (fires existing `OPEN_REFLECTION_SHEET`) |
| **3/3** | Replace lock emoji with `.cycle-block-sacred` CSS indicator (visual class, not text) |
| **3/3** | Sprint ceremonies: same disabled-Edit removal + rationale-sentence pattern |

### LUNCH (capacity-neutral, muted gray)
| Convergence | Recommendation |
|---|---|
| **3/3** | Strip everything except time + "Lunch" label |
| **3/3** | UX: SUPPRESS BlockDetailDialog entirely — replace with one-line dismissable inline tooltip |
| **PM agrees** | "Everything else is noise" — time + duration only |
| **FE notes** | Easy to implement — special case in dialog handler |

### PROTECTED ANCHORS (locked)
| Convergence | Recommendation |
|---|---|
| **3/3** | DELETE disabled Edit button (most useless element across the system) |
| **3/3** | Visual lock indicator preserved BUT as CSS class, not emoji |
| **3/3** | Add "why is this block here" rationale sentence (anchor's purpose) |

---

## 4. Cross-Cutting Removals (Net-Cut)

The 3 lenses converge on these eliminations across all types:

1. **Bucket-label text row** (PROJECT/COMMUNICATION/CI text) — color carries the semantic; text is redundant
2. **Standalone duration row** in dialog — time range already shows it
3. **Disabled Edit button** on protected/locked blocks — communicates nothing actionable, just frustration
4. **Why-chip on non-optional anchor blocks** — self-evident placement doesn't need justification (PM)

These cuts FREE space for the per-type specific additions.

---

## 5. Implementation Strategy

| Lens | Recommendation | Synthesis |
|---|---|---|
| FE | **Option (b) per-bucket render functions** (extract shared `blockWrapper()` helper) | **ADOPT** |
| UX | Block has shared structure + per-type facets | Compatible with (b) |
| PM | Phasing recommendation: ship cheapest subset first | **ADOPT** |

**Recommended structure**:
- `renderProjectBlock()`, `renderCommBlock()`, `renderCIBlock()`, `renderLunchBlock()`, `renderProtectedBlock()`
- Shared `blockWrapper()` for positioning, aria, data-attrs
- Each render function independently testable

**§6.5 hits: 0** — all proposals are pure UI work in `js/ui/`. The `composerInputsSnapshot.explain` field already exists (Iter 17 composer work); `outputArtifact` already exists on CatalogEntry; kaizen linkage already in ScheduledActivity.

---

## 6. Phased Implementation (per PM recommendation)

### Phase 1 — Cheapest viable subset (2-3 hr, MEDIUM impact)
FE-recommended:
- Add `intention` (or `outputArtifact.name`) as secondary line on PROJECT compact cards (zero new prop wiring; field already on object)
- Thread full `catalogEntry` into BlockDetailDialog (already resolved in `Today.js:600-603`)
- Display `participants`/`trigger` from catalog for COMMUNICATION blocks
- 2 files changed, 6-8 new tests, 0 §6.5

### Phase 2 — Per-type render refactor + protected-block cleanup (4-6 hr, HIGH impact)
- Extract per-bucket render functions (Option b)
- Remove disabled Edit button across all protected blocks (the convergent "most useless element")
- Replace bucket-label text rows with rationale sentences keyed on `slotKind`
- Add CSS class `.cycle-block-sacred` for CI; replace lock emoji
- "Start Reflection" action on End-of-Activity Reflection
- Suppress dialog on Lunch; inline tooltip instead

### Phase 3 — Kaizen-link sub-labels + bucket-strip removal (3-4 hr, MEDIUM impact)
- Surface kaizen title as sub-label on PROJECT + CI cards when present
- Visual indicator (e.g., dashed border) for CI without kaizen link
- Remove right-margin bucket-strip (per UX info audit from Iter 45 — Ring covers same data)
- Recovers ~164px horizontal space

### Phase 4 — Polish + edge cases (2-3 hr, LOW impact)
- Visual hierarchy tightening per UX Section 4
- Edge cases (long activity names, missing data)

**Total**: 11-16 hr across 4 phases.

---

## 7. Scoring (per §6.4)

Item: **C-UX-TASKTYPE-INFO — Per-task-type info bundle**

| Dimension | Score |
|---|---|
| Impact | 4 (every Today block displays better; cuts noise; adds specific value per type) |
| Strategic alignment | 5 (Phil's directive; aligns with bucket-cognition typology + evidence-linkage; preserves BAM-X positioning) |
| Learning value | 3 (validates per-type-info hypothesis; informs whether further per-type work is warranted) |
| Confidence | 5 (3-lens convergence on every major decision; cheap subset can ship first) |
| Effort | 3 (full bundle 11-16 hr; phased) |
| Risk | 2 (per-type render changes; manageable with phasing; 0 §6.5 hits) |
| **Base score** | 4+5+3+5-3-2 = **12** |
| **ConvergenceBonus** | **+2** (3 lenses) |
| **Total** | **14** |

Per-phase scores:
- **Phase 1** (cheapest subset): 12 + 2 = **14** (highest ROI — ship now)
- **Phase 2** (per-type refactor + protected cleanup): 12 + 2 = **14** (biggest visible impact — removes "useless" disabled Edit + reduces noise)
- **Phase 3** (Kaizen sub-labels + bucket-strip removal): 11 + 2 = **13**
- **Phase 4** (polish): 9 + 2 = **11** (defer)

---

## 8. Decision Required

Phil to choose:

- **A** — Approve full 4-phase plan; dispatch Phase 1 first (2-3 hr; non-blocking; sets foundation)
- **B** — Approve Phase 1 + Phase 2 only (the biggest-impact + cheapest combo, 6-9 hr total)
- **C** — Approve ONLY Phase 1 cheapest subset (2-3 hr, ships fast)
- **D** — Approve specific items by listing them (override the phasing)
- **E** — Hold; review individual lens artifacts first
- **F** — Reject; current per-type info is fine

**My recommendation: B.** Phase 1 + Phase 2 together are the highest-value combo. Phase 1 sets data threading; Phase 2 cuts the "disabled Edit button on protected blocks" — the convergent "most useless element" — and removes the bucket-label noise that's making the page feel busy. Together they address both Phil's "not thrilled about the information" feedback AND the per-task-type directive. Phase 3 + 4 deferrable.

If you want minimum scope: **C** (Phase 1 cheapest, 2-3 hr — Phase 2/3/4 follow if you like the result).

---

## 9. Bystander Note

Deploy queue is currently **2-deep** (Iter 44 + 45). META §7.7 gate well under limit. Phase 1 dispatch would push to 3. Phase 2 to 4. Phil's deploys keep cycling so this stays manageable.

Bucket-strip removal (from Iter 45 UX info audit) is now folded into Phase 3 of this plan — no longer a standalone iteration.

Date-echo removal (from Iter 45 UX info audit) is small enough to absorb into Phase 1 if approved.
