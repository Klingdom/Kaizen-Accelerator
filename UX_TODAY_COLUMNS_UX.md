# UX_TODAY_COLUMNS_UX — Today Page Row Column Review

Owner: ux-designer
Status: v1.0 — canonical recommendation
Inputs: ScheduledActivityBlock.js:265–278, domain/types.js §2.2, OutputArtifactDialog.js,
        goldenDay.js fixtures, Today.ccc.test.js (CCC ≤ 12 / ≤ 25 words per region),
        PRD_CADENCEPLAN_TODAY.md §2–§3, SPRINT_16A_NOTES.md

---

## 1. Goal

Reduce noise in the activity row so that the single most important piece of
information at each point of the day is immediately readable with a single
fixation. Today, the row contains one column that actively misleads the user
(`.sa-intention`: an empty prompt asking them to do work they have not yet
done), and one that adds no discriminating information (`.sa-state-label`:
a text word for state that is already communicated by composition-level
treatment). The goal is to replace `.sa-intention` with the documented output
artifact name — what the user must produce, not a question — and to remove
`.sa-state-label` entirely, netting a row that is shorter, faster to scan, and
honest about what is known at render time.

## 2. Non-Goals

This review covers per-row columns only. It does not propose changes to the
Today page layout above or below the activity list, the CycleCard chrome, the
AutoPlanButton, the BucketStrip, the Now Pane, the RhythmExplainer, or any
component that is not part of the ScheduledActivityBlock render function at
ScheduledActivityBlock.js:265–278. Dark-mode reskin, route renames, and
multi-page IA are explicitly out of scope per PRD_CADENCEPLAN_TODAY §2.

---

## 3. Per-Column Verdict Table

Current render order (ScheduledActivityBlock.js:266–273):

| # | Class | Current Content | Verdict | Justification |
|---|---|---|---|---|
| 1 | `.sa-when` | Time band ("09:00–10:00"; edit-mode: `<input type="time">`) | KEEP | Anchors the row to a real-world position in the day. First fixation in F-pattern. Essential for scheduling context and edit-mode time-change interaction. |
| 2 | `.sa-bucket-chip` | Bucket label chip (PROJECT / COMMUNICATION / CI) | KEEP | Color-coded at a glance; conveys energy context without a column header. Signal density is very high for its width. |
| 3 | `.sa-name` | Activity name (+ carried badge + kaizen chip inline) | KEEP | Primary semantic content. Users read this to know what they are doing. Inline badges are load-bearing sub-signals but compact enough not to fracture this column. |
| 4 | `.sa-duration` | "120m" | KEEP | Paired cognitively with `.sa-when` for "how much of my day does this take". Single token; never ambiguous. |
| 5 | `.sa-intention` | Placeholder: "One line: what outcome by close?" | REPLACE | An empty prompt is negative signal: it communicates nothing about the task and creates obligation-anxiety. Replace with the documented output artifact name from `CatalogEntry.outputArtifact.name`. |
| 6 | `.sa-state-label` | "proposed" / "scheduled" / "in progress" / "closed" / "skipped" | REMOVE | State is redundant. It is already encoded in (a) the CycleCard composition-level badge, (b) row opacity/border CSS driven by `.sa-state-*` class on `<li>` (line 206), (c) `.sa-elapsed` visibility (IN_PROGRESS only), and (d) `.sa-skip-reason` presence (SKIPPED only). The text word adds nothing a user cannot read from visual treatment within 200ms. |

---

## 4. `.sa-intention` Replacement Design — "Output Artifact" Column

### What it answers

Not "what do you intend?" but "what do you produce?" Every CatalogEntry has
an `outputArtifact` object with a `name` string (e.g., "1 Pager", "C&E Matrix",
"Meeting notes", "Current-condition measurement"). That name is the column content.

### Column label

None. The column has no header. An artifact icon prefix (described below)
provides implicit labeling. Omitting a header reduces vertical chrome and keeps
the CCC word-count budget unaffected.

### Visual treatment

- Prefix icon: a small document glyph (Unicode U+1F4C4, rendered as a CSS
  `::before` pseudo-element on `.sa-artifact`, or an inline `<span>` with
  `aria-hidden="true"`) so the eye discriminates this column from `.sa-name`
  without a header. Do not use color — the bucket chip already owns color in
  this row.
- Text style: muted foreground (`--text-muted` token or equivalent 60% opacity
  on the base text color). This places the artifact name visually subordinate to
  the activity name, which is correct: the activity name is what you are doing;
  the artifact name is the exit criterion.
- Font size: same as body; do not shrink. Reduced size forces re-read at arm's
  length and costs more time than it saves space.

### Source field

`CatalogEntry.outputArtifact.name` — the human-readable artifact name string.

The `schema` field (TEXT / DOCUMENT / NUMERIC / TWO_LIST / CHART) is not
surfaced in the row. It is implementation detail that belongs in the
OutputArtifactDialog (already used at close time, see OutputArtifactDialog.js).
The `required` boolean is also not surfaced: every catalog entry tested in
goldenDay.js and ceremoniesAndGenerics.js marks `required: true`, so it carries
no discriminating information in the row.

The `kind` sub-field noted in the task brief does not exist as a separate
property in the live type definition (domain/types.js:365). The authoritative
shape is `{ name: string, schema: string, required: boolean }`. Use `.name`.

### Graceful degradation

Three null paths exist:

1. `activity.catalogEntryId` is set but `CatalogEntry.outputArtifact` is null
   (see source50.js:327: one entry has `outputArtifact: null` explicitly).
   Render: nothing. The column collapses to zero width. No placeholder, no dash.
   A placeholder would repeat the mistake of `.sa-intention`.

2. The ScheduledActivityBlock caller does not pass a resolved catalog entry
   (the current prop signature at line 153–166 does not include one). Until the
   prop is added, the column must receive `outputArtifactName` as a pre-resolved
   string prop, defaulting to `null`. Render: nothing when null.

3. A custom or user-authored activity has no catalog entry at all.
   Same treatment as case 2: column absent.

### Truncation behavior at narrow widths

- Max visible text: 28 characters before truncation (`text-overflow: ellipsis;
  overflow: hidden; white-space: nowrap;` on `.sa-artifact`).
- 28 characters accommodates the longest known artifact names from goldenDay.js:
  "Current-condition measurement" is 30 characters. Allow 2-line wrap at
  mobile widths rather than truncating there, since mobile only shows 1–2
  columns above the fold anyway and comprehension is not time-critical off-device.
- Full name on hover via `title` attribute (already pattern-consistent with the
  carried badge at line 199).

### Click-to-expand vs always-visible

Always-visible. The artifact name is not supplemental; it is the exit criterion
for every block. Hiding it behind a tap/click would make it invisible during
the planning scan that happens at the start of the day — exactly when it is
most needed. This also keeps the row interaction model simple: the only
interactive elements in a non-edit-mode row are Start / Skip / Close buttons.

### Rendered HTML shape (informational — not implementation)

```html
<div class="sa-artifact" title="[full name if truncated]">
  <span class="sa-artifact-icon" aria-hidden="true">📄</span>
  <span class="sa-artifact-name">Meeting notes</span>
</div>
```

---

## 5. `.sa-state-label` Removal — What We Lose, What Compensates

### What `.sa-state-label` currently does

It renders a lowercase text string ("proposed", "scheduled", "in progress",
"closed", "skipped", "dropped") derived by `stateLabel()` at line 43–59.

### What compensates

| State | Current label | Compensation post-removal |
|---|---|---|
| PROPOSED | "proposed" | CycleCard composition-level badge shows PROPOSED. Row visual treatment (muted/italic via `.sa-state-proposed` on `<li>`) already present (line 206). |
| SCHEDULED | "scheduled" | Start + Skip buttons visible (`renderActions`, line 87). Button presence is unambiguous. |
| IN_PROGRESS | "in progress" | `.sa-elapsed` renders "Xm elapsed" (line 113–117). Elapsed timer is unambiguous. Pinned styling (line 207) further marks the current block. |
| CLOSED | "closed" | Row greyed/dimmed via `.sa-state-closed` CSS class. No actions visible. OutputArtifactRef recorded (not surfaced in row, but close was completed). |
| SKIPPED | "skipped" | `.sa-skip-reason` renders the reason code (line 148–151). Reason text implies skip without needing the label. |
| DROPPED | "dropped" | Rare state. Row opacity/border treatment covers it. If the product needs to distinguish DROPPED from CLOSED visually, that is a CSS token decision, not a column decision. |

### Genuine loss assessment

Nothing is genuinely lost. Every state has at least one non-label signal that
is more specific than the label itself (a timer, a set of buttons, a reason
text, or a CSS class driving opacity). The label was redundant by design of the
state machine.

### Minimal compensation

None required. The existing conditional chrome (`.sa-elapsed`, `.sa-skip-reason`,
`.sa-actions`) is sufficient. If a future audit of colorblind users reveals that
CSS-only state distinction fails accessibility, the correct fix is an
`aria-label` on the `<li>` (which the existing `data-activity-id` and `class`
already support) — not re-adding a visible text label.

---

## 6. New Columns to Consider

### Candidate (a) — Linked Kaizen / Project Chip (promote from inline)

**Current location:** Inline in `.sa-name` as `<span class="sa-kaizen-chip">part of: [title]</span>` (line 201).

**Rationale for promoting:** When multiple activities share the same Kaizen,
the inline chip repeats the same text in every row of the name column, polluting
the primary semantic column with project linkage metadata.

**Verdict: DO NOT PROMOTE (yet).** The chip is sparse — most activities do not
have a `linkedKaizenId`. Promoting a sparse column creates horizontal dead space
on the majority of rows, which costs more in scan time than the repetition
costs. The inline position is correct for now. Revisit if the product surfaces
portfolio-level linkage as a first-class planning signal.

**Source field:** `activity.linkedKaizenId` + `kaizenTitle` prop (already passed
at line 178–181).

**Latency-target impact:** None — sparse columns have zero marginal rendering
cost.

---

### Candidate (b) — Carried-Over Indicator (promote from inline)

**Current location:** Inline in `.sa-name` as `<span class="carried-badge">carried</span>` (line 199).

**Rationale for promoting:** Carried-over work is a planning health signal. A
dedicated column would let the user scan "which of today's blocks are yesterday's
unfinished work" in one visual pass.

**Verdict: DO NOT PROMOTE.** Same sparsity argument as (a). Carried-over blocks
are the exception, not the norm. A separate column would be empty on most days.
The inline badge in `.sa-name` is readable and appropriately subordinate to the
activity name. The badge title attribute ("carried from yesterday") is sufficient
for screen readers.

**Source field:** `activity.carriedOver` boolean.

**Latency-target impact:** None.

---

### Candidate (c) — Energy / Bucket Reason (why-this-slot reasoning)

**Rationale:** The WhyChip (`whyChip` at line 225) already surfaces a planning
rationale for PROPOSED compositions. This is the closest analog to an
"energy/bucket reason" column.

**Verdict: DO NOT ADD as a column.** WhyChip is already rendered as trailing
chrome on qualifying rows (PROPOSED + `explainEntry` present). Promoting it to
a dedicated column would show it always, on every row, in every state. The
reasoning text is verbose enough (one sentence+) that it breaks the ≤ 25-word
CCC per-region budget enforced by Today.ccc.test.js (PROSE_REGIONS guard,
line 91–97). Keeping it as conditional trailing chrome is correct.

**Latency-target impact:** Adding a prose column to every row would push
comprehension time past the 10s target for a full-day plan (8–10 rows × one
sentence = 80–120 additional words, which is 32–48 seconds at 150 wpm on top
of the existing load).

---

### Candidate (d) — Predecessor / Dependency Chip (DMAIC sequence)

**Source field:** `CatalogEntry.dependsOn` — an array of parent CatalogEntry
ids (domain/types.js:374).

**Rationale:** DMAIC activities have a DAG ordering. Surfacing "depends on
[Measure]" could prevent users from scheduling Define-phase work out of sequence.

**Verdict: DO NOT ADD to the row.** Dependency enforcement belongs in the
composer (ComposerService) and in the Catalog detail view, not in a per-row
column on Today. Today is an execution surface; the user is executing a plan
that has already been composed and validated. Dependency warnings at execution
time add cognitive overhead at the moment of highest time pressure. If a
dependency violation is worth surfacing, it belongs as a composition-level
warning on the CycleCard, not a column on every row.

**Latency-target impact:** Would fragment attention during the start-of-day
scan. Reject.

---

### Candidate (e) — Estimated vs Actual Duration (CLOSED state)

**Source fields:** `activity.plannedDurationMinutes` (already rendered in
`.sa-duration`) vs `activity.actualDurationMinutes` or derivable from
`activity.actualStartAt` + close timestamp.

**Rationale:** For CLOSED activities, showing "planned 60m / actual 45m" gives
immediate adherence feedback at the row level without navigating to Insights.

**Verdict: ADD — but only for CLOSED rows, replacing `.sa-duration`.**

When `activity.state === 'CLOSED'` and the actual duration can be computed,
replace the `.sa-duration` cell content with a comparison: "45m / 60m" (actual
/ planned) in muted text, or simply "45m" if actual equals planned. If actual
duration is not computable (actualStartAt missing), fall back to the planned
duration as today. This is a modification to an existing column, not an
additional column, so it does not increase the column count.

**Implementation note:** `activity.actualStartAt` is recorded at START_ACTIVITY
dispatch. Close time is not currently stored on the ScheduledActivity. The
comparison requires either (a) a `closedAt` field or (b) the close-dialog
submission timestamp. This is a data-model question — see Open Questions §9.

**CCC impact:** Zero — this modifies content inside the existing `.sa-duration`
region. The region count does not change.

**Latency-target impact:** Positive — saves a navigation to Insights for
adherence feedback.

---

## 7. Final Recommended Column Set

Left-to-right column order for the post-change ScheduledActivityBlock row:

| Position | Class | Content | Source | Verdict vs current |
|---|---|---|---|---|
| 1 | `.sa-when` | Time band ("HH:MM–HH:MM"); edit-mode: `<input type="time">` | `activity.plannedStartAt`, `activity.plannedDurationMinutes` | KEEP (unchanged) |
| 2 | `.sa-bucket-chip` | Bucket chip (PROJECT / COMMUNICATION / CI) | `activity.bucket` via `bucketMeta()` | KEEP (unchanged) |
| 3 | `.sa-name` | Activity name + inline carried badge + inline kaizen chip | `activity.name`, `activity.carriedOver`, `activity.linkedKaizenId` | KEEP (unchanged) |
| 4 | `.sa-duration` | "120m" (OPEN states) OR "actual/planned" comparison (CLOSED) | `activity.plannedDurationMinutes`; `activity.actualStartAt` for CLOSED | MODIFY for CLOSED state only |
| 5 | `.sa-artifact` | Output artifact name, muted, icon-prefixed | `CatalogEntry.outputArtifact.name` (pre-resolved as prop) | REPLACE (was `.sa-intention`) |
| — | `.sa-state-label` | ~~"proposed" / "scheduled" / etc.~~ | — | REMOVED |

**Total columns: 5 (was 6).**
Net change: -1 (`.sa-state-label` removed), -0 (`.sa-intention` replaced in
place by `.sa-artifact`), +0 net additions.

Conditional chrome that is NOT in this column order (rendered after the columns
for qualifying states only — unchanged):

- `.sa-elapsed` — IN_PROGRESS only
- `.sa-skip-reason` — SKIPPED only
- `.sa-actions` — SCHEDULED and IN_PROGRESS only
- `.sa-edit-actions` / `.sa-lock` / `.durationChips` / `.whyChip` — edit-mode
  or PROPOSED+explainEntry only

---

## 8. Scanning-Pattern Rationale

The F-pattern reading model predicts that users make a strong horizontal fixation
on the first line of a list item, then fall back to the left edge for the next
row. In the activity list, this means the leftmost columns receive the most
fixation time and must carry the highest-value information.

Column 1 (`.sa-when`) is time: the user's first question every morning is "when
does this happen?" Time anchors all subsequent reading.

Column 2 (`.sa-bucket-chip`) is energy type: a color-coded chip that the eye
reads pre-attentively. It answers "what kind of work is this?" in under 100ms
without a semantic read.

Column 3 (`.sa-name`) is identity: the longest text string, carrying the most
meaning per character. It sits at the natural reading restart point after the
two short left columns.

Column 4 (`.sa-duration`) is size: how much of my day does this consume? It is
paired cognitively with column 1 (time band) but placed after name because it
is secondary to knowing what the block is.

Column 5 (`.sa-artifact`) is exit criterion: what must I produce before I can
close this block? It sits rightmost among the structural columns because it is
referenced at closure, not at start — its fixation moment is later in the
workflow. Muted styling further signals that it is reference information, not
a primary action signal. By placing it here, we do not pollute the left-side
high-fixation zone with metadata that is only needed at the end of the block.

The removed `.sa-state-label` was rightmost and received the least fixation.
Its removal costs no scanning value.

---

## 9. Edit-Mode Interaction

The proposed column changes do not affect edit-mode chrome. Confirmed:

- `.sa-edit-actions` (Select / × buttons) and `.sa-lock` are rendered as
  additional elements appended after the column set at lines 230–237. They are
  not positionally coupled to any specific column.
- `.durationChips` are rendered conditionally when `editSelected && !protectedBlock`
  (line 246–248). They appear below the row, not within a column slot.
- The time editor (`<input type="time">` in `.sa-when`, line 250–252) replaces
  `.sa-when` content when `timeEditable === true`. No other column participates
  in this swap.
- The new `.sa-artifact` column is read-only in all modes. It has no
  edit-mode variant, which is correct: the output artifact is defined by the
  catalog entry, not by the schedule. A user editing a slot changes when and how
  long they do the activity, not what they must produce.
- The CLOSED-state `.sa-duration` modification (candidate e) does not affect
  edit-mode because CLOSED blocks are not selectable in edit-mode (edit-selectable
  is set only for non-protected, non-closed blocks; the `isProtectedBlock` guard
  at line 184 covers this).

One constraint: if `.sa-artifact` is added as a column, the `ScheduledActivityBlock`
prop interface must be extended to accept `outputArtifactName: string | null`.
The caller (Today.js or CycleCard) must resolve the catalog entry and pass the
name as a pre-resolved string. Do not pass the full CatalogEntry object into the
block renderer — that would couple the pure render function to catalog lookup
logic, violating the "pure render" contract stated in the file header (line 7).

---

## 10. Open Questions

1. **CLOSED-state actual duration source.** Candidate (e) requires a `closedAt`
   timestamp or equivalent to compute actual duration for CLOSED rows. The
   ScheduledActivity type (domain/types.js:464) records `outputArtifactRef` at
   close, but not a `closedAt` timestamp. Does ActivityService.close() or the
   storage layer record close time anywhere? If not, is the product team willing
   to add `closedAt` to the ScheduledActivity schema to enable this? This is a
   data-model decision that blocks the CLOSED-state duration comparison.

2. **Caller responsibility for `outputArtifactName` resolution.** The block
   renderer is a pure function that does not access the catalog. The caller
   must look up `CatalogEntry.outputArtifact.name` by `activity.catalogEntryId`
   before passing it as a prop. Where in Today.js or CycleCard does this lookup
   happen? Is a catalog index already available at render time, or does this
   require a new prop threading path from Today → CycleCard → ScheduledActivityBlock?
   The answer determines implementation effort.

3. **`.sa-artifact` for custom / non-catalog activities.** Some ScheduledActivity
   rows may have no `catalogEntryId` (user-authored blocks). The null degradation
   rule (column collapses to nothing) is specified in §4 above, but the product
   team should confirm: is a blank artifact column acceptable for custom blocks,
   or should custom blocks surface a generic "your notes" label? The latter would
   require a default artifact name for custom entries — a catalog or composer
   concern, not a UX column concern.
