# PRODUCT_TODAY_COLUMNS.md
# Today Page Row Column Refactor — Product Definition

Owner: Product Manager Agent
Status: APPROVED FOR ENGINEERING
Date: 2026-04-30
Renderer: `js/ui/components/ScheduledActivityBlock.js`
Downstream: frontend-engineer, QA, ux-designer

---

## 1. Problem Statement

The Today page row is the primary execution surface of the BAM-X OS.
It is the one view the user reads before starting every block of work.
The current column design fails at its core job: helping the user
understand what they are about to produce and why this block belongs here.

**Confirmed issue 1: `.sa-intention` is a prompt, not an answer.**
The placeholder text "One line: what outcome by close?" is a question
addressed to the user. It is never filled in by the system because
`intention` is read-only (see `ScheduledActivityBlock.js:213` comment
"Intention is read-only this sprint"). The column therefore always
renders as a gray italic question in every user session. A question
cannot function as a column. It creates cognitive overhead (the user
must mentally supply the answer) without delivering any information.

**Confirmed issue 2: `.sa-state-label` is redundant noise.**
The state label renders "proposed" or "scheduled" in uppercase 11px
gray text. This information is already visible through:
- row opacity (CLOSED = 55% opacity, `app.css:451`)
- border color (SKIPPED = danger red, `app.css:452`)
- the presence or absence of action buttons (Start/Skip appear only
  on SCHEDULED; Close appears only on IN_PROGRESS; CLOSED and SKIPPED
  have no actions)
- the elapsed timer (IN_PROGRESS only)
The literal word "proposed" or "scheduled" adds zero decision value
on top of these signals. Phil has confirmed it is useless.

**Additional issue 3: no column communicates the expected output.**
The BAM-X product position (PRODUCT_BLUEPRINT.md §2) is explicit:
"Every completion is a measurement, not a checkbox." Yet the row
surface gives the user no indication of what measurement or artifact
is expected when this block closes. The user must open the Close
dialog to discover this. That is too late — they should know before
they start.

**Additional issue 4: the state label occupies grid space that could
carry output-artifact information.**
At the narrow widths common on laptop screens, the `.sa-state-label`
column takes layout width away from content columns. Removing it
frees space for a meaningful output column without a layout change.

**Additional issue 5: no Kaizen linkage signal at a glance.**
A Kaizen chip exists (`.sa-kaizen-chip`) but it renders inline under
the name. There is no column-level affordance that signals DMAIC step
progress (e.g., "DMAIC step 3 of 7") to give the user sprint-level
context before starting the block.

---

## 2. Value-Per-Column Analysis

Scoring scale: 1 (no value) to 5 (high value). All columns assessed
in the context of a user scanning the Today list before starting work.

### Current columns

| Column | Class | Decision value | Action value | Justification value | Evidence/audit value | Frequency |
|---|---|---|---|---|---|---|
| Time band | `.sa-when` | 5 — tells user when to start | 5 — direct trigger | 1 — no why | 2 — audit trail for variance | 5 — every session |
| Focus area / bucket | `.sa-bucket-chip` | 4 — signals energy type | 3 — sets context | 2 — partial why | 1 | 5 |
| Activity name | `.sa-name` | 5 — identifies the work | 5 — user must know what to start | 2 | 2 | 5 |
| Duration | `.sa-duration` | 4 — time-boxing | 3 — helps decide skip/defer | 1 | 2 | 4 |
| Intention (placeholder) | `.sa-intention` | 1 — always a question, never an answer | 1 — adds no next step | 1 — question, not explanation | 1 — no data | 2 — user learns to ignore |
| State label | `.sa-state-label` | 1 — redundant with buttons/opacity | 1 — no action triggered | 1 | 1 | 1 — ignored |

### Proposed replacement column

| Column | Class (proposed) | Decision value | Action value | Justification value | Evidence/audit value | Frequency |
|---|---|---|---|---|---|---|
| Output artifact name | `.sa-output-artifact` | 5 — user knows what they must produce | 4 — primes the close dialog | 4 — "because this produces X" | 5 — links to OAD schema | 5 — every block |

### Proposed new columns (evaluated — see §5)

| Column | Decision value | Action value | Justification value | Evidence/audit value | Recommended? |
|---|---|---|---|---|---|
| Output-status indicator | 5 | 4 | 4 | 5 | Yes — future sprint |
| DMAIC step pointer | 4 | 3 | 5 | 4 | Yes — future sprint |
| Quick-action chip (Skip / Defer) | 3 | 5 | 1 | 1 | Defer — separate UX decision |
| Time-since-last-completion | 2 | 2 | 3 | 3 | Defer |

---

## 3. Replace `.sa-intention` with Output Artifact — Product Framing

PRODUCT_BLUEPRINT.md §2 states: "Every completion is a measurement,
not a checkbox. Closing a standard activity requires its
catalog-defined output." This is the product's core differentiator
from a calendar app. If the row surface does not surface the expected
output before the user starts work, the product fails to deliver on
this promise at the moment of highest leverage.

`CatalogEntry.outputArtifact` is the system's answer to the question
"what does this block produce?" It is already defined, seeded, and
consumed by `OutputArtifactDialog.js` at close time. Examples from
`js/catalog/browserSeed.js`: PDCA Cycle produces "Current-condition
measurement" (NUMERIC schema); Sprint Retrospective produces a
TWO_LIST (what went well / to improve); High-value Communication
produces "Comm Outcome Note" (TEXT). These are precise, artifact-
specific answers — not generic prompts.

Rendering `outputArtifact.name` in the row converts the column from
a question the user must mentally answer into a declaration the system
has already answered. It directly implements the BAM-X deliberate-
ratification model: the user sees the expected output, accepts the
block, and starts it knowing exactly what evidence they will produce.
The WhyChip already explains why the block is scheduled; the output
artifact column explains what the user is accountable to deliver.
Together they complete the row's evidentiary contract.

This change requires no new data. `outputArtifact` is populated for
every seeded catalog entry. The renderer must receive it as a prop
(looked up from the catalog by `catalogEntryId`) and render
`outputArtifact.name` in place of the intention placeholder. When
`outputArtifact` is null (custom blocks, Lunch, user-added blocks
without catalog entries), the column renders empty or with a
configurable fallback label — it does not render a question.

---

## 4. Remove `.sa-state-label` — Business Logic Dependency Audit

The `stateLabel()` function in `ScheduledActivityBlock.js:43` converts
state enum values to lowercase human strings: "proposed", "scheduled",
"in progress", "closed", "skipped", "dropped". These strings are
rendered inside `.sa-state-label` only.

**Test coverage grep result:** No test in `tests/ui/components/
ScheduledActivityBlock.test.js` asserts on the text content of
`.sa-state-label` or the string "proposed"/"scheduled" from that
class. Tests for intention, elapsed, skip reason, kaizen chip, and
carried badge exist but none for the state label text.

**CSS dependency:** `app.css:443` defines `.sa-state-label` styles
(font-size, color, text-transform). `app.css:1408` adds a responsive
override. Neither rule gates any user-facing behavior — they are
display-only.

**App.js dependency:** No handler in `app.js` reads the rendered
`.sa-state-label` text. State routing is driven by the `state` field
on the activity object, not by rendered DOM content.

**Conclusion:** `.sa-state-label` has zero user-facing business logic
dependencies. Its removal is safe. The CSS rules for `.sa-state-label`
should be deleted alongside the HTML. The `stateLabel()` function
itself should be retained — it is used implicitly by the state CSS
class mechanism (`sa-state-${state.toLowerCase()}`) and may be
referenced in future audit tooling.

**CLOSED and SKIPPED readability post-removal:** Both states retain
distinct visual signals without the label. CLOSED: `opacity: 0.55`
via `.sa-state-closed`. SKIPPED: danger red border + background via
`.sa-state-skipped` plus the `.sa-skip-reason` chip (rendered from
`a.reasonCodeIfSkipped`). IN_PROGRESS: elapsed timer renders. These
signals are more visually immediate than a gray uppercase 11px label
and do not require reading.

---

## 5. New Columns Proposal — Product Perspective

This section evaluates candidates for future additions beyond the
immediate refactor. None are in scope for this sprint.

**Candidate A: Output-status indicator**
Render a pill showing whether the expected artifact has been produced
for IN_PROGRESS or CLOSED states. Example: "expected: C&E Matrix — not
yet recorded" vs "C&E Matrix saved". Highest evidence/audit value of
any candidate. Requires reading `outputArtifactRef` from the activity
record. Deferred because it requires backend state propagation to the
row render path, which is out of scope here.

**Candidate B: DMAIC step pointer**
When the activity is bound to a Kaizen via `linkedKaizenId`, render
"DMAIC step N of M" inline. This gives sprint-level context before
starting a Deep block. Requires the renderer to receive Kaizen step
metadata as a prop. Deferred — dependency on Kaizen DAG resolution
at render time is non-trivial.

**Candidate C: Quick-action chip (Skip / Working-Lunch / Defer)**
A compact chip row exposing the most common secondary actions. Skip
and Defer-to-Tomorrow are the highest-frequency user gestures after
Start. A chip presentation would reduce tap-distance. Deferred — this
is a UX interaction pattern decision, not a column decision, and
should be spec'd in a dedicated UX pass.

**Candidate D: Time-since-last-completion (routine activities)**
For daily recurring blocks (High-value Comm, Daily Standup, PDCA),
show "last done: 2 days ago" to surface drift. Low decision value
for the majority of blocks; high value for compliance tracking.
Deferred — requires completion history aggregation per catalog entry.

---

## 6. Acceptance Criteria for the Column Refactor

AC-01: The `.sa-intention` div is removed from the rendered row HTML
for all activity states (PROPOSED, SCHEDULED, IN_PROGRESS, CLOSED,
SKIPPED). No HTML, text, or placeholder from the old `.sa-intention`
block appears in the output.

AC-02: A `.sa-output-artifact` div is rendered in the position
previously occupied by `.sa-intention`. When `outputArtifact` is
provided (non-null object with a `name` field), the div displays
`outputArtifact.name` as escaped text.

AC-03: When `outputArtifact` is null or undefined (Lunch block,
custom user block, any entry without a catalog outputArtifact),
`.sa-output-artifact` renders empty — no placeholder question, no
error text, no fallback copy that mimics the old prompt.

AC-04: The `.sa-state-label` div is removed from the rendered row HTML
for all activity states. The text "proposed", "scheduled", "in progress",
"closed", "skipped", or "dropped" does not appear as the content of
a `.sa-state-label` element.

AC-05: CLOSED-state readability regression check — a CLOSED row still
renders with `.sa-state-closed` class, producing `opacity: 0.55` via
CSS. No additional text label is required to communicate CLOSED state.

AC-06: SKIPPED-state readability regression check — a SKIPPED row
still renders with `.sa-state-skipped` class (danger red border) and
the `.sa-skip-reason` chip when `reasonCodeIfSkipped` is set. The
absence of the text label "skipped" does not degrade state legibility.

AC-07: Edit mode is unaffected. In edit mode, the `.sa-output-artifact`
column renders identically to normal mode (read-only; no edit input
is added). Duration chips, Select/Remove edit chrome, and lock icon
for protected blocks all render unchanged.

AC-08: The three existing intention tests in
`tests/ui/components/ScheduledActivityBlock.test.js` (lines 369–397)
are updated or replaced. The test "empty intention renders placeholder
copy from §6.5.8" must be deleted or rewritten to assert that the
old placeholder text does NOT appear. New tests assert: (a) output
artifact name renders when provided, (b) null outputArtifact renders
empty div, (c) output artifact name is HTML-escaped.

AC-09: The `stateLabel()` function is retained in the module (not
deleted) to preserve future audit tooling compatibility, even though
its output is no longer rendered.

AC-10: The CSS rules `.sa-intention`, `.sa-intention .placeholder`,
`.sa-state-label`, and their responsive override at `app.css:1407–1408`
are removed. A new `.sa-output-artifact` rule is added with at minimum
`font-size: 13px` and `overflow: hidden; text-overflow: ellipsis;
white-space: nowrap` (consistent with the previous intention styling).

---

## 7. Edge Cases

**EC-01: Lunch block (no outputArtifact)**
The Lunch catalog entry has no outputArtifact defined. The
`.sa-output-artifact` div renders empty. This is correct — the block
exists to protect time, not to produce a deliverable. Do not render
"none" or a dash; render nothing.

**EC-02: Custom user block (no catalog entry)**
A user-added activity that has no `catalogEntryId` or whose catalog
entry was not seeded will have `outputArtifact = null`. The renderer
receives `outputArtifact` as a prop. If the prop is null, the column
is empty. The renderer must not throw on null input.

**EC-03: Carried-over block**
A block carried from yesterday has the same `catalogEntryId` and
therefore the same `outputArtifact`. The output artifact column renders
identically to a fresh block. The "carried" badge already surfaces the
provenance. No special handling needed.

**EC-04: Block linked to a Kaizen (DMAIC step)**
These blocks have a `linkedKaizenId` and often the most specific
`outputArtifact` definitions (e.g., "FMEA" DOCUMENT, "C&E Matrix"
DOCUMENT). The output artifact column is highest-value for these
blocks and must render correctly. The kaizenChip still renders under
the name; the output artifact column renders in the grid position.

**EC-05: Block with a NUMERIC outputArtifact**
`outputArtifact = { name: 'Current-condition measurement', schema: 'NUMERIC', unit: 'defects/unit', required: true }`.
The column renders "Current-condition measurement" — the name only.
The unit is not rendered in the row (it belongs in the close dialog).
This avoids column crowding.

**EC-06: IN_PROGRESS state with elapsed timer**
The elapsed timer (`.sa-elapsed`) renders alongside the output artifact
column. Both must fit in the row. The elapsed timer should remain on
the trailing edge; the output artifact column takes the intention slot.
No layout collision if the grid template is updated to remove the
state-label column and the intention column simultaneously.

**EC-07: Activity where outputArtifact.name is an empty string**
Treat as null — render the column empty. An empty string artifact name
is a seed data defect, not a UI concern. The column should not render
a blank italic string.

---

## 8. Out of Scope

The following are deferred to future iterations and must not be
included in this refactor sprint:

- Output-status auto-checking (did the user produce the artifact
  before closing? automated verification against `outputArtifactRef`)
- DMAIC step N-of-M pointer rendered in the row column area
- Quick-action chip row (Skip / Defer inline without modal)
- Time-since-last-completion for routine blocks
- Making `outputArtifact` editable inline in the row
- Any changes to `OutputArtifactDialog.js` — it is unaffected
- Any changes to the close flow or `ActivityService.close()`
- Responsive / mobile layout changes beyond the CSS rule swap
- The `stateLabel()` function removal (retained for audit tooling)

---

## 9. Backlog Candidates Spawned

**C-PM-22: Output-status indicator column**
After a block is closed, surface whether `outputArtifactRef` was
recorded. Gives the Today list an audit signal: "PDCA Cycle — metric
not recorded" for blocks closed without artifact capture. P1.

**C-PM-23: DMAIC step pointer in row**
When `linkedKaizenId` is set, render "DMAIC step N / M" in the row
to give sprint-level context. Requires Kaizen DAG resolution at render
time. P2.

**C-PM-24: Quick-action chip UX design pass**
Evaluate Skip and Defer-to-Tomorrow as inline chips rather than
modal-gated actions. High action value; needs UX spec before
engineering. P2.

**C-PM-25: Seed audit — outputArtifact null coverage**
Identify all seeded catalog entries where `outputArtifact` is null
after `source50.js` and `fillGaps.js` pipeline. For each, either add
a defined artifact or explicitly mark the entry as artifact-exempt
so the UI can distinguish "no artifact by design" from "seed gap."
P1.

**C-PM-26: Delete stateLabel() function**
Once the removal has been in production for one sprint with no
regressions, delete the `stateLabel()` function and its CSS rules
permanently. Track as a cleanup item. P3.

---

## 10. Success Metrics

All metrics are measured against the Today page row in a production
session with a seeded catalog (not a demo).

**SM-01: Output-artifact comprehension rate**
BEFORE: ~0% — the `.sa-intention` column always renders the placeholder
question; no user can read their expected output from the row.
AFTER target: ≥80% of catalog-backed blocks render a non-empty
`.sa-output-artifact` name. Measured by: count of rendered rows where
`.sa-output-artifact` is non-empty / total rows with a catalog entry.
This is a deterministic code metric, not a survey. It should reach
100% for seeded entries and ~0% for Lunch/custom blocks (by design).

**SM-02: State-label DOM presence**
BEFORE: 100% of rows contain a `.sa-state-label` element.
AFTER target: 0% — no `.sa-state-label` element exists in the
rendered DOM. Measured by automated test assertion (AC-04).

**SM-03: Placeholder text recurrence rate**
BEFORE: 100% of rows with no `intention` set render "One line: what
outcome by close?" — a question the system cannot answer.
AFTER target: 0% — the string "One line: what outcome by close?" must
not appear anywhere in the rendered Today page HTML. Measured by
string-search in the integration snapshot test.

**SM-04: Close-dialog artifact-name match rate (future leading indicator)**
Once SM-01 is live, measure whether the artifact name surfaced in the
row matches the schema rendered in the close dialog. Establishes
ground truth that the row and the dialog are driven by the same
`outputArtifact` data. Target: 100%. Deferred to the sprint after
this refactor ships.
