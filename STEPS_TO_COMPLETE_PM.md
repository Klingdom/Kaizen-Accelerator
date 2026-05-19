# STEPS_TO_COMPLETE_PM.md
## Feature: "How to Complete" Section in BlockDetailDialog

---

## 1. Product Statement

Users schedule standard-work activities via the composer but have no in-app reference for how to execute them. Once a block is placed on the Today grid, the only execution guidance is the activity name itself. This forces recall from memory or context-switching to external docs — friction that compounds on newer practitioners and on infrequently-run ceremonies. The fix is immediate and cheap: `CatalogEntry.procedure` already exists and is fully populated across 61 entries (via the seed pipeline in `js/catalog/seed/`). The `BlockDetailDialog` already receives `catalogEntry` as a prop (Iter 46, `js/ui/components/BlockDetailDialog.js:135`). We are one render section away from surfacing execution guidance that exists but is invisible.

---

## 2. Data Model (Lensed for PM Intent)

### Confirmed: `procedure` already exists

`CatalogEntry` (declared at `js/domain/types.js:402`) carries:

```
@property {string[]} procedure
```

Every numbered entry, ceremony, and generic in the 61-entry catalog has this field populated by the seed pipeline (`source50 → fillGaps → ceremoniesAndGenerics`). The field is already a `string[]` of imperative step strings (e.g., `"a. Open current Program Plan and latest sprint outcomes."`).

### Proposed enrichment: `completionSteps` as a typed overlay

The coordinator-proposed shape:

```js
catalogEntry.completionSteps?: Array<{
  id: string,
  text: string,      // imperative, action-oriented
  optional?: boolean
}>
```

**Critique:** This shape is additive and correct for future flexibility (optional steps, stable IDs for analytics). However, it creates a data-migration problem: all 61 entries have `procedure` but none have `completionSteps`. Phase 1 should render `procedure` directly to unblock the UI layer immediately, then migrate to `completionSteps` in Phase 2 when Phil authors curated step content. Do not block the render layer on a data-shape migration.

**Recommended approach:**

- Phase 1: render `catalogEntry.procedure` as-is. No new field, no migration.
- Phase 2+: introduce `completionSteps` alongside `procedure`. `BlockDetailDialog` prefers `completionSteps` when present, falls back to `procedure`. This gives Phil a clean authored layer without breaking existing behavior.

**`communicationGuidance` field:** The single-liner shape is correct. COMM already has `catalogEntry.description`-style content surfaced via `getCommRationale()` at `BlockDetailDialog.js:82`. Use that existing path rather than a new field. If the COMM guidance needs to be distinct from the rationale sentence already rendered, introduce `communicationGuidance` only in Phase 3.

---

## 3. Per-Type Coverage Matrix

| Bucket | Gets Steps? | Typical Step Count | Empty-State Copy | `procedure` seeded? |
|---|---|---|---|---|
| PROJECT | Yes (full list) | 3–7 | "No standard steps defined for this activity yet." | Yes — all DMAIC/Kaizen/Deep Work entries have procedure arrays. E.g. `cat_34` (C&E Matrix): confirmed in browserSeed.js with `procedure: []` — **gap: browserSeed stubs are empty; full catalog via pipeline is populated.** |
| CI | Yes (full list) | 3–6 | "No standard steps defined for this activity yet." | Yes — ceremonies (`cer_quarterly_planning` has 7 steps, `cer_sprint_planning` has 3, etc. `js/catalog/seed/ceremoniesAndGenerics.js:67–235`). Generics (`gen_end_of_activity_reflection` has 4 steps at line 321). |
| COMMUNICATION | Single-line guidance only | n/a — one sentence | n/a — COMM gets `communicationGuidance` line or omits section | `cer_daily_standup` has 3-step procedure in ceremoniesAndGenerics.js:130; for COMM this is already surfaced as rationale via `getCommRationale()`. No separate steps section. |
| LUNCH (`bucket: null`) | No | — | No section rendered | `recovery_lunch` has a 3-step procedure (`js/catalog/seed/ceremoniesAndGenerics.js:419`). Intentionally skip. |
| PROTECTED (non-editable) | Yes, same as bucket rules | same | same | Ceremonies are protected and have rich procedures. Render steps; suppress Edit button per existing AC7. |

**Note on browserSeed stubs:** `browserSeed.js` entries all have `procedure: []` (empty arrays). In production the app loads the full JSON catalog which has populated procedures. Phase 1 renders should be tested against the full catalog path, not the 9-entry browserSeed fallback. The empty-state copy handles the browserSeed fallback gracefully.

**Step-count verification vs. 3–7 recommendation:**
- `cer_quarterly_planning`: 7 steps — within range
- `cer_sprint_planning`: 3 steps — within range
- `gen_end_of_activity_reflection`: 4 steps — within range
- `gen_lessons_learned`: 4 steps — within range
- `gen_weekly_reflection`: 4 steps — within range (DMAIC framing: Define/Measure/Analyze/Improve)
- `fillGaps` entries (#19, #20): 6 and 9 steps respectively — #20 (DMAIC Charter) at 9 steps exceeds range; flag for content trimming in Phase 2

---

## 4. Acceptance Criteria

**Section heading copy:** "How to complete" (imperative, consistent with Phil's directive wording).

**AC-1.** When `BlockDetailDialog` renders a PROJECT-bucket activity and `catalogEntry.procedure` is a non-empty array, a section with heading "How to complete" renders below the existing `<dl class="bdd-body">` and above `<div class="bdd-rationale-section">`.

**AC-2.** When `BlockDetailDialog` renders a CI-bucket activity (excluding `gen_end_of_activity_reflection`) and `catalogEntry.procedure` is a non-empty array, the "How to complete" section renders with the same layout as AC-1.

**AC-3.** When `BlockDetailDialog` renders a PROJECT or CI activity and `catalogEntry.procedure` is an empty array or `catalogEntry` is null, the "How to complete" section renders with the copy "No standard steps defined for this activity yet." — no ordered list, no heading omitted.

**AC-4 (orthogonal to AC-3).** The "How to complete" section does NOT render for COMMUNICATION-bucket activities. The existing rationale sentence (`<p class="bdd-rationale">`) is the sole guidance surface for COMM. Verify: a COMM block's dialog HTML contains no element with the steps-section class.

**AC-5.** The "How to complete" section does NOT render for LUNCH activities (`bucket === null` or `slotKind === 'LUNCH'`). Verify: a Lunch block's dialog HTML contains no element with the steps-section class.

**AC-6.** The "How to complete" section does NOT render for PROTECTED blocks that fall under COMMUNICATION (e.g., `cer_daily_standup`). The rationale path already handles these. Verify: `cer_daily_standup` dialog has a rationale sentence but no steps section.

**AC-7.** Steps render in source order (array index 0 first). No sorting, no deduplication. The render is a deterministic mapping of the array.

**AC-8.** `gen_end_of_activity_reflection` (CI, protected) does NOT render the "How to complete" section. It already has a dedicated "Start Reflection" footer action (`BlockDetailDialog.js:236`). The steps section would be redundant and confusing for a meta-activity.

**AC-9.** User-added activities where `catalogEntry` is null (no catalog entry — `sourceOfSchedule === 'USER_ADD'` with no match) show the empty-state copy "No standard steps defined for this activity yet." in the steps section — PROJECT and CI only. COMM/LUNCH/PROTECTED rules still apply.

**AC-10.** Optional steps (future `completionSteps[n].optional === true`) render with a CSS modifier class (`bdd-step--optional`) producing visually dimmed styling. This AC is dormant in Phase 1 (no entries have `completionSteps` yet) but must be implemented in the render function to avoid a future markup-breaking change.

**AC-11.** The steps section has a stable CSS class (`bdd-steps-section`) and the ordered list has class `bdd-steps-list`. These are the hooks for styling and for QA test selectors.

**AC-12.** `BlockDetailDialog` is a pure render function (`js/ui/components/BlockDetailDialog.js:125`). The steps section must be computed as an HTML string with no DOM access, consistent with the existing pattern.

---

## 5. Success Metrics

| Metric | Before | Target | How to Measure |
|---|---|---|---|
| Catalog entries with non-empty `procedure` | ~40 of 61 (browserSeed stubs are empty; full catalog pipeline has populated procedures for numbered entries and ceremonies) | 61/61 by Phase 3 | Count in `fullCatalog.json` at build time |
| BlockDetailDialog opens (proxy for feature usage) | No current tracking | Establish baseline in Phase 1 week 1; target 30% week-over-week growth as users discover click behavior | Add `data-action="BLOCK_DETAIL_OPEN"` event to EventBus; count in analytics |
| Time-to-first-step visible after dialog open | n/a | <100ms (pure string render, no async) | Lighthouse trace on Today page |
| User-reported "how do I do this" questions (qualitative) | Phil's working assumption: users rely on memory | Reduction after Phase 2 seed content ships | Phil observation / support signal |

**Incomplete requirement flag:** We have no baseline for how often users currently click activity blocks. Phase 1 must instrument `BLOCK_DETAIL_OPEN` or an equivalent event to make Phase 2 impact measurable. Without this, the "opens" metric is unmeasurable at Phase 2 launch.

---

## 6. Phasing

### Phase 1 — UI scaffolding + render path (cheapest viable)
Render `catalogEntry.procedure` in `BlockDetailDialog` for PROJECT and CI. Ship the empty-state copy. No new fields on `CatalogEntry`. No content authored. Ships in a single sprint.

**What this validates:** The render path is correct. Empty states appear in production for browserSeed-fallback users. Dialog structure is testable before content exists.

### Phase 2 — Seed steps for 10 highest-traffic catalog entries
Based on the catalog, the highest-frequency daily activities (daily cadence + non-optional + most likely to appear on any given Today grid):

1. `gen_end_of_activity_reflection` — excluded per AC-8; has its own action
2. `cer_daily_standup` — COMM; single-line only
3. `gen_deep_work_project` — PROJECT; generic; author 3 steps for the generic block
4. `gen_weekly_reflection` — CI; has 4 steps already in ceremoniesAndGenerics.js
5. `cer_sprint_planning` — CI; has 3 steps already
6. `cer_sprint_retrospective` — CI; has 3 steps already
7. `cer_sprint_review` — CI; has 4 steps already
8. `cer_mid_sprint_review` — CI; has 3 steps already (also COMMUNICATION-tagged, check bucket)
9. `cat_1_personal_learning_and_development_l_d_tracker` — CI; procedure needs Phil's authored content
10. `cat_12_pdca_cycle` — CI; procedure needs Phil's authored content

Items 4–8 already have `procedure` content in the seed pipeline and will render immediately on Phase 1 ship. Items 3, 9, 10 need Phil's content decisions (see §7).

### Phase 3 — COMMUNICATION single-line guidance for COMM catalog entries
Author `communicationGuidance` content (or verify the existing rationale sentences in `COMM_RATIONALE_BY_CATALOG_ID` / `COMM_RATIONALE_BY_SLOT_KIND` cover the needed entries). No structural change to `BlockDetailDialog` — the COMM rationale path already exists at `BlockDetailDialog.js:221`.

### Phase 4 — Edit/add steps affordance (deferred)
An in-app UI for Phil to author steps against catalog entries. Blocked on: (a) Phil deciding the authoring workflow, (b) determining whether steps are authored in-app or via the seed pipeline at build time. Explicitly out of scope for this feature.

---

## 7. Open Questions for Phil

**SW-Q1 (content authority — Phil only).** The `gen_deep_work_project` generic entry has `procedure: ["a. Declare intention...", "b. Work...", "c. Log output..."]` in ceremoniesAndGenerics.js:262. Are those 3 steps the canonical execution steps for any deep-work PROJECT block? Or should deep-work steps vary by the specific named project task?

**SW-Q2 (content authority — Phil only).** `cat_1` (L&D Tracker) and `cat_12` (PDCA Cycle) have `procedure: []` in the browserSeed stub and likely sparse content in the full pipeline. What are the 3–5 canonical steps for each? This determines Phase 2 content priority.

**SW-Q3 (copy decision).** The heading "How to complete" is proposed above. Alternatives: "Steps to complete", "Standard steps", "How it's done". Phil's call — one word change, but it sets the tone across the app.

**SW-Q4 (scope clarification).** `cer_mid_sprint_review` is tagged `bucket: 'COMMUNICATION'` in ceremoniesAndGenerics.js:169. Under the coordinator-approved scope rules (COMM = single-line, no steps list), this ceremony gets a rationale sentence rather than its 3-step procedure. Is that correct, or should ceremonies always get the steps list regardless of bucket?

**SW-Q5 (instrumentation authority).** Phase 1 ships a render feature with no analytics hook. To make Phase 2 impact measurable, we need `BLOCK_DETAIL_OPEN` added to `js/events/events.js`. Is Phil approving this as part of the Phase 1 sprint, or is it a separate instrumentation task?

**SW-Q6 (future edit affordance).** Phase 4 (edit/add steps) is deferred. Confirm: no "Edit steps" affordance ships in Phase 1 or Phase 2. The steps section is read-only indefinitely until Phil decides on content authoring workflow.

---

## 8. Score (Phase 1 specifically)

Using the §6.4 framework:

| Dimension | Score (1–5) | Rationale |
|---|---|---|
| Impact | 4 | Every standard-work activity click surfaces execution guidance. High daily touch frequency for practitioners. |
| Strategic | 4 | Directly fulfills Phil's directive. Strengthens the "standard work" value proposition of the OS. |
| Learning | 3 | Phase 1 teaches us whether users click blocks at all (baseline for opens metric). Moderate learning value. |
| Confidence | 5 | `procedure` is already populated. `catalogEntry` prop is already passed to `BlockDetailDialog`. Pure render addition. No ambiguity. |
| Effort | 5 (low effort) | One render section added to a pure function. Existing per-type branching pattern (`isComm`, `isCI`, `isProject`) is directly reusable. No schema migration. No new events. |
| Risk | 5 (low risk) | Pure HTML string render. No state mutation. No new persistence. Worst case is an empty section rendering — caught by AC-3. |

**Phase 1 net score: high confidence, low effort, low risk. Ship it.**
