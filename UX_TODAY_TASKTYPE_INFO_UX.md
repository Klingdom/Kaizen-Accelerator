# UX: Per-Task-Type Information Design — Today Calendar Card
Status: Define-phase. No production code changed.
Owner: ux-designer
Inputs: TodayGrid.js (Iter 43), BlockDetailDialog.js (Iter 30),
ScheduledActivityBlock.js (Sprint 16a), editMode.js (Sprint 14),
bucketMeta.js (Iter 14), PRD_CADENCEPLAN_TODAY.md, UX_TODAY_V2_DESIGN.md.

---

## 1. Current State Inventory

### 1a. Compact card (TodayGrid — `renderTodayBlock`)

Every block currently renders the same information regardless of task type:

| Element | Source field | Always shown? |
|---|---|---|
| Lock icon (emoji) | `isProtectedBlock()` → true | Conditional on protected status |
| Time label | `formatHHMM(startValue)` or `formatTimeRange` depending on block height | Yes |
| Activity name | `activity.name` | Yes |
| Kaizen link chip | `activity.linkedKaizenId` + `kaizenTitleById` lookup | Conditional on link |
| Resize handle | `!protected && !isLunch` | Conditional |
| Bucket chip (CSS class only, no visible text) | `bucketMeta(bucket).chipClass` → background color | Via color, not label |

No bucket label text is displayed on compact cards. The bucket is only communicated
by background color (green = PROJECT, yellow/amber = COMMUNICATION, purple = CI,
muted gray = Lunch).

No indication of:
- Sub-type (Daily Standup vs AM Comm vs End-of-deep-cycles Comm)
- Expected output or artifact
- Why this block is here
- Elapsed time (IN_PROGRESS state)
- Skip reason (SKIPPED state — only available in ScheduledActivityBlock list view)

### 1b. Expanded view (BlockDetailDialog)

Clicking any block opens BlockDetailDialog with a uniform structure:

| Field | Source |
|---|---|
| Bucket chip (with text label) | `bucketMeta(bucket).label` |
| Time range | `formatTimeRange` |
| Duration | `plannedDurationMinutes` in minutes |
| Expected output | `outputArtifact.name / .kind / .schema` or `—` |
| Kaizen chip | `kaizenTitle` when linked |
| Edit button (disabled if protected) | `isProtectedBlock()` |

Every task type gets identical structure regardless of what is actually useful.
The "Expected output" row shows `—` for all COMMUNICATION, CI ceremony, and
Lunch blocks. Duration and bucket are already visible on the calendar — they
are doubled information in the dialog.

### 1c. List view (ScheduledActivityBlock — CycleCard)

The list row view contains more task-type-differentiated data than either the
compact card or the dialog:

| Column | Always shown |
|---|---|
| Time range (HH:MM–HH:MM) | Yes |
| Bucket chip (text label) | Yes |
| Activity name | Yes |
| Duration (minutes) | Yes |
| Output artifact (clickable when non-null) | Conditional — null for COMM/CI/Lunch |
| Kaizen chip | Conditional |
| Why chip (PROPOSED state only) | Conditional |
| Elapsed timer | IN_PROGRESS only |
| Skip reason | SKIPPED only |

The list view is better than both compact and dialog for information richness,
but it is inside the CycleCard list, not on the calendar grid blocks.

---

## 2. Per-Task-Type Information Ideal

### PROJECT (Deep Work, green)

**What is the user trying to do/know?**
Confirm this block is the right Kaizen-linked task, see how long it runs, and
know what output they should be producing when they start it.

**Minimum info for action (compact card):**
Time range + activity name. Optional: output artifact name if it fits.

**Maximum useful info (expanded dialog):**
Activity name, time range, expected output (named), Kaizen title and current
phase, "why this block is here" (one-line rule from `composerInputsSnapshot.explain`).
Drop: bucket label (color already communicates this), standalone duration line
(time range already implies duration when start and end are shown).

**Currently shown that is noise:**
Bucket label ("Deep Work") in dialog — the green color and the "Deep Work"
copy on the page's legend already cover this. Displaying it again in the dialog
costs a row.

**Missing that would help:**
Expected output name visible on compact card when block height permits. Kaizen
phase (e.g. "Measure phase") in the dialog for linked blocks.

---

### COMMUNICATION (yellow)

**What is the user trying to do/know?**
Check whether this slot is already defined (protected anchor) or something they
chose, and confirm the time so they can plan around it. For AM Comm: is there
anything urgent to address? For post-lunch: how long do I have? For
end-of-deep-cycles: is this the only stop between now and EOD?

**Minimum info for action (compact card):**
Time range + sub-type label (e.g. "Standup", "AM Comm", "Post-lunch", "EOD Comm").
The current name field is already the sub-type for anchored blocks. No change
needed except adding a "Protected" visual cue that is cleaner than the lock emoji.

**Maximum useful info (expanded dialog):**
Sub-type identity, time range, duration, rationale for placement (why chip
translated to plain language — "placed at 09:15 as AM high-value communication
window per 4-2-2 methodology"). For user-added Comm: expected output or outcome.
Drop: bucket label text in dialog (redundant with color), duration as a standalone
line (implied by time range), Edit button for protected blocks
(currently rendered disabled — it communicates nothing and adds visual weight).

**Sub-case distinctions:**

AM Comm (09:15, 60 min, protected):
- Compact: time range + "AM Comm" label. No other addition needed.
- Dialog: replace disabled Edit button with a plain note: "Anchor — part of your
  4-2-2 daily rhythm." Remove bucket + duration rows.

Post-lunch Comm (13:00, 30 min, protected):
- Same as AM Comm treatment.

Daily Standup (09:00, 15 min, protected):
- Compact: time range + "Standup". Lock indicator sufficient.
- Dialog: show "Daily ceremony — 15 min" + the "why locked" rationale.
  Drop disabled Edit button.

End-of-deep-cycles Comm (15:30, 15 min, protected, Iter 38):
- Compact: time range + "EOD Comm" or "Wind-down Comm".
- Dialog: "Transition block before End-of-Activity Reflection at 17:00. Clears
  communication queue before close." One sentence, no Edit.

User-added Comm (from Catalog picker):
- Compact: time range + name. Same as current.
- Dialog: keep Edit button enabled. Show expected output if defined in the
  catalog entry. Show why chip if available.

**Currently shown that is noise:**
Disabled Edit button on protected COMM blocks. Bucket label text in dialog.
Standalone duration line when time range already shows start and end.

**Missing that would help:**
A one-line rationale on anchored COMM blocks ("part of 4-2-2 anchor sequence")
replacing the disabled Edit button. For user-added COMM, expected output from
the catalog entry.

---

### CI — Continuous Improvement (purple)

**What is the user trying to do/know?**
For End-of-Activity Reflection: remember to complete the reflection before
leaving. For sprint ceremonies: know which ceremony this is and when it ends.
For user-added CI: know what they committed to and what output is expected.

**Minimum info for action (compact card):**
Time range + name. Sacred/protected blocks: add a "Sacred" or "Required" badge
instead of a generic lock emoji.

**Maximum useful info (expanded dialog):**
Activity name, time range, duration, outcome or expected artifact. For EoAR:
a reminder note ("Complete your EOD reflection — captures learning from today").
For ceremonies: ceremony name + standard duration note. For user-added CI:
expected output, why chip if available.

**Sub-case distinctions:**

End-of-Activity Reflection (17:00, 15 min, sacred):
- Compact: time range + "EOD Reflection". Replace lock emoji with a distinct
  "Sacred" marker — the lock emoji conflates this with ceremony protection, but
  EoAR is sacred for a different reason (captures learning, not ceremony
  sequencing).
- Dialog: name + "15 min · Required for your daily learning loop." Prompt:
  "Start your reflection when this block begins." Drop disabled Edit button,
  drop bucket label text, drop duration line.

Sprint ceremonies (Planning/Review/Retro, protected):
- Compact: time range + name (names are already distinct). Lock indicator.
- Dialog: ceremony name + standard duration + "Sprint ceremony — cannot be
  moved." Drop disabled Edit button, drop bucket label text.

User-added CI (Catalog picker):
- Compact: time range + name. Same as current.
- Dialog: name + time + duration + expected output when defined. Why chip.
  Edit enabled.

**Currently shown that is noise:**
Disabled Edit button across all protected CI blocks. Bucket label text in dialog
(the purple color already differentiates CI). Duration as standalone line when
time range is shown.

**Missing that would help:**
For EoAR: a micro-prompt ("What did you learn today?") either in the dialog or
as a secondary line on the compact card when block height allows. This primes
the reflection before the user clicks Start.

---

### Lunch (muted gray, bucket: null)

**What is the user trying to do/know?**
Confirm the break time and move on. No action required.

**Minimum info for action (compact card):**
Time range + "Lunch". Nothing else. Current render already shows this (name is
"Lunch" per composer, color is muted chip-unknown). The resize handle is
correctly suppressed.

**Maximum useful info (expanded dialog):**
"Lunch break — 30 min. Capacity-neutral." One line. Drop all other rows
(bucket is null/unknown, output is none, Kaizen is never linked).

**Currently shown that is noise:**
In the dialog: the bucket row shows "Unscheduled" (chip-unknown) — Lunch is
not unscheduled, it is deliberately placed. The "Expected output" row shows `—`
which adds a row of noise. The duration row is visible but trivial for a fixed
30-min block.

**Missing that would help:**
Nothing. This is one case where less is clearly more. The dialog should be
suppressed entirely for Lunch in favor of a tap-to-dismiss tooltip: "30-min
lunch break. Capacity-neutral." No Edit button needed.

**Recommendation:** For Lunch, clicking the block should not open the full
BlockDetailDialog. It should open a minimal inline tooltip (non-modal) that
displays "Lunch · 12:00–12:30 · Capacity-neutral" and closes on any outside
tap. This reduces the perceived formality of an unchangeable non-work block.

---

### Protected Anchors (lock icon, all types)

**Visual treatment:**
The current lock emoji (`🔒`) is functional but:
(a) it doubles as the indicator for protected CI ceremonies AND protected COMM
anchors, conflating two different "why it's locked" reasons.
(b) The emoji renders inconsistently across platforms.

**Recommendation:** Replace the lock emoji with a CSS-only filled indicator
(a small dot or pill with a distinct class: `.cycle-block-anchor` for COMM
anchors, `.cycle-block-sacred` for EoAR, `.cycle-block-ceremony` for sprint
ceremonies). Each class uses the bucket color with 100% opacity to signal
permanence without introducing a new icon.

**What info matters for locked blocks:**
The "why this is locked" rationale. Currently shown: nothing except the lock
symbol. Proposed: a single sentence in the dialog that names the locking reason.

| Anchor | Rationale sentence |
|---|---|
| Daily Standup | "Daily ceremony — part of your team rhythm." |
| AM High-value Comm | "4-2-2 anchor — reserved for high-priority communication." |
| Post-lunch Comm | "4-2-2 anchor — reserved for post-lunch communication." |
| EOD Comm | "Transition block before end-of-day reflection." |
| EoAR | "Sacred — captures daily learning. Cannot be removed." |
| Sprint ceremonies | "Sprint ceremony — scheduled with your team." |

**Should they hide editing affordances entirely?**
Yes. The disabled Edit button should be removed from the dialog for all
protected blocks and replaced with the rationale sentence. The disabled state
communicates "you can't do this" but not "why", which creates confusion. A
sentence explaining the reason is more informative and takes the same space.

---

## 3. Specific Per-Type Proposals

### PROJECT (Deep Work, green)

**Compact card:**
- Line 1: time range (HH:MM–HH:MM)
- Line 2: activity name
- Line 3 (when block height >= 56px): output artifact name, truncated to 24 chars
- Kaizen chip when linked: retain, move below name
- No bucket label text (color is sufficient)
- No lock icon (PROJECT blocks are not protected by default)

**Detail dialog:**
Remove: bucket row, standalone duration row (keep only time range).
Add: output artifact row (already present; make it primary after the name).
Add: Kaizen row with phase label when linked (e.g. "Measure — Sprint 3").
Add: single-line why-chip explanation in plain prose below the name.
Row order: Name → Time → Output → Kaizen (if linked) → Why (if available).

**Kaizen link treatment:**
Show kaizen title + current DMAIC phase in the dialog. On the compact card,
the kaizen chip is sufficient. Do not add the phase label to the compact card
(too much text density).

**Expected output handling:**
Show on compact card only when block height permits (>= 56px). Always show in
the dialog. If the catalog entry has no outputArtifact, omit the row entirely
(do not show "—").

**Unique to PROJECT:**
The Why chip (from `composerInputsSnapshot.explain`) is most valuable here
because the user chose the catalog entry but may not remember why today's
specific PROJECT block was sequenced. Expose the explain text as a plain
sentence in the dialog, not just a tooltip.

---

### COMMUNICATION (yellow) — sub-cases

**AM Comm (09:15, 60 min, protected):**
Dialog: name + time range + "4-2-2 anchor — reserved for high-priority
communication." Remove bucket row, duration row, disabled Edit button.
Compact: time range + name. No change.

**Post-lunch Comm (13:00, 30 min, protected):**
Same treatment as AM Comm. Different rationale sentence.

**End-of-deep-cycles Comm (15:30, 15 min, protected, Iter 38):**
Dialog: name + time range + "Transition block before EOD reflection."
Compact: time range + name. Label this "EOD Comm" if the current name is
long — confirm name field in composer output. No edit affordance.

**User-added Comm (Catalog picker):**
Dialog: same row order as current. Keep Edit button enabled. Add expected
output row if `outputArtifact` is non-null in the catalog entry (most COMM
catalog entries have no outputArtifact — omit the row rather than show "—").
Compact: time range + name. Same as current. No additional info needed.

---

### CI (purple) — sub-cases

**End-of-Activity Reflection (17:00, 15 min, sacred):**
Compact card: time range + "EOD Reflection". Replace lock emoji with a
`.cycle-block-sacred` indicator. When block height >= 40px, add a micro-prompt
as a subtitle: "What did you learn?"
Dialog: name + time + "Sacred — captures daily learning. Cannot be removed."
Replace disabled Edit button with the rationale. Add a "Start Reflection" action
button that fires OPEN_REFLECTION_SHEET (already exists in ReflectionSheet.js).

**Sprint ceremonies:**
Compact card: time range + ceremony name. `.cycle-block-ceremony` indicator.
Dialog: name + time range + "Sprint ceremony." Remove disabled Edit button.
Remove bucket row. Remove duration row (implied by time range).

**User-added CI (Catalog picker):**
Dialog: name + time + duration + expected output (when defined) + why chip.
Edit button enabled. No rationale sentence needed.

---

### Lunch

**Compact card:**
Time range + "Lunch". Muted gray. No resize handle (already correct). No other
information.

**Interaction:**
Do not open BlockDetailDialog. Show an inline tooltip on click/tap:
"Lunch · [HH:MM–HH:MM] · Capacity-neutral" with a dismiss-on-outside-click
behavior. Zero modal overhead.

**Anything else useful:**
Nothing. Lunch is not actionable. Adding more info would imply the user can
or should do something about it.

---

## 4. Information Hierarchy Per Type

### PROJECT
1st (most scannable): time range — the question is always "what time does this
start and end?"
2nd: activity name — confirms it's the right task
3rd: output artifact name — reminds what the task produces
4th (dialog only): Kaizen phase, why explanation

### COMMUNICATION (anchored)
1st: time range — "when do I need to be available?"
2nd: activity name (sub-type)
3rd (dialog only): rationale sentence — one line, not a data field

### COMMUNICATION (user-added)
1st: time range
2nd: activity name
3rd: expected output (if any)

### CI — EoAR
1st: time range — "17:00 is approaching"
2nd: "EOD Reflection" label
3rd: micro-prompt "What did you learn?" — primes the action before the block starts

### CI — ceremonies
1st: time range
2nd: ceremony name
3rd (dialog only): ceremony rationale

### CI — user-added
1st: time range
2nd: activity name
3rd: expected output

### Lunch
1st: time range
2nd: "Lunch" label
(nothing else)

---

## 5. Cross-Cutting Recommendations

### Single render function vs per-type render functions

Keep ONE `renderTodayBlock` function (as currently exists in TodayGrid.js) with
per-type branching on compact card content. Do not create six separate render
functions — the positioning math, aria attributes, and interaction hooks are
identical across types. The branching is limited to:
- What subtitle/secondary line to show (when height permits)
- Which anchor indicator to use (lock emoji → CSS class)
- Whether to render the kaizen chip

For BlockDetailDialog, add a per-type dialog builder function that takes the
same `activity` object and returns a type-appropriate row set. A single
`buildDialogRows(activity, kaizenTitle, outputArtifact)` function with a switch
on `activity.bucket ?? 'LUNCH'` is cleaner than six separate components.

### Lunch block visual treatment

Lunch should be MORE muted than current. Two changes:
1. Reduce compact card height by 4px via a `.cycle-block-lunch` min-height
   reduction — it visually signals "this is not a work block."
2. In the hour rail, the 12:00 label can be slightly bolder to help the user
   locate lunch without reading the block text.

Do not use the same block structure as PROJECT/COMM/CI for Lunch. It should
look like a gap marker, not a task.

### Locked blocks visual structure

Locked blocks should have a fundamentally different interaction affordance but
not a fundamentally different visual structure (they still need to be readable
on the calendar). The specific changes:
- Replace the lock emoji with CSS-class-based indicators (`.cycle-block-anchor`,
  `.cycle-block-sacred`, `.cycle-block-ceremony`).
- In the dialog, replace the disabled Edit button with a one-sentence rationale.
- Remove pointer-events for the resize handle (already done correctly for
  protected blocks in TodayGrid.js via `canDrag` gate).

---

## 6. Cuts to Make Alongside Additions

### PROJECT

| Add | Remove | Net density |
|---|---|---|
| Output artifact name on compact card (height-gated) | — | +1 element, height-conditional |
| Kaizen phase in dialog | Standalone duration row in dialog | Same |
| Why explanation prose in dialog | Bucket label row in dialog | Same |

Net: compact card slightly richer; dialog same number of rows, more useful rows.

### COMMUNICATION (anchored)

| Add | Remove | Net density |
|---|---|---|
| Rationale sentence in dialog | Disabled Edit button | Less |
| — | Bucket label row in dialog | Less |
| — | Standalone duration row in dialog | Less |

Net: dialog is LESS dense. Three rows removed, one sentence added in footer area.

### COMMUNICATION (user-added)

| Add | Remove | Net density |
|---|---|---|
| Expected output row when defined | Bucket label row in dialog | Same |

Net: same.

### CI — EoAR

| Add | Remove | Net density |
|---|---|---|
| Micro-prompt on compact card (height-gated) | Lock emoji → CSS indicator | Same |
| Rationale sentence in dialog | Disabled Edit button | Less |
| "Start Reflection" action button | Bucket label row, duration row | Same |

Net: compact card minimally richer (one height-gated line). Dialog less dense.

### CI — ceremonies

| Add | Remove | Net density |
|---|---|---|
| Rationale sentence in dialog | Disabled Edit button | Less |
| — | Bucket label row in dialog | Less |
| — | Duration row in dialog | Less |

Net: dialog is LESS dense.

### Lunch

| Add | Remove | Net density |
|---|---|---|
| — | Full BlockDetailDialog | Much less |
| Inline tooltip on click | — | Replaces modal with lighter surface |

Net: LESS density. Modal replaced by dismissable tooltip.

---

## 7. Implementation Strategy — Data Availability

### Already available in current data model

| Info field | Source | Available? |
|---|---|---|
| Time range | `plannedStartAt + plannedDurationMinutes` | Yes — already rendered |
| Activity name | `activity.name` | Yes |
| Kaizen title | `kaizenTitleById[activity.linkedKaizenId]` | Yes |
| Output artifact name | `outputArtifact.name` (pre-resolved by CycleCard) | Yes — in ScheduledActivityBlock; not in TodayGrid compact block |
| Why chip entry | `composerInputsSnapshot.explain[]` | Exists in WhyChip.js; available in ScheduledActivityBlock; **not passed to BlockDetailDialog** |
| Protected status | `isProtectedBlock(activity)` | Yes |
| Is lunch | `activity.bucket === null` | Yes |
| Sub-type / slot kind | `activity.slotKind` (AM_COMM, POST_LUNCH_COMM) | Partial — EoAR and EOD Comm Iter 38 may not have a slotKind |

### Requires new fields or wiring

| Info field | Gap | Effort |
|---|---|---|
| Output artifact on TodayGrid compact card | `outputArtifact` is not currently passed into `renderTodayBlock`. The CycleCard pre-resolves it for ScheduledActivityBlock but TodayGrid does not receive it. Requires passing `outputArtifactByActivityId` map as a prop to TodayGrid. | S — prop threading only |
| Why explanation prose in BlockDetailDialog | `explainEntry` is available on ScheduledActivityBlock but is NOT passed to BlockDetailDialog. BlockDetailDialog would need an `explainEntry` prop. Data exists; wiring is missing. | S — prop threading |
| Kaizen phase in BlockDetailDialog | The `kaizenTitle` is passed but the Kaizen object itself is not. Showing the phase requires resolving the Kaizen entity (phase field). Depends on KaizenService or a pre-resolved prop. | M — new prop or lookup |
| Rationale sentences for anchored blocks | These are static strings keyed on `activity.slotKind` or `activity.catalogEntryId`. No new data needed — a lookup table in BlockDetailDialog suffices. | XS — pure render |
| "Start Reflection" button in EoAR dialog | OPEN_REFLECTION_SHEET action already exists in ReflectionSheet.js. The button just needs to emit the correct data-action. | XS |
| Lunch inline tooltip (non-modal) | The current click-block path always opens BlockDetailDialog. Gating on `isLunch` to show a tooltip instead requires a conditional in the OPEN_BLOCK_DETAIL handler in app.js. | S |
| CSS anchor indicators (`.cycle-block-anchor` etc.) | New CSS classes. No JS change. | XS |
| `composerInputsSnapshot.explain[]` population | Per PRD_CADENCEPLAN_TODAY §9 Q1: may be empty in current ComposerService. If empty, why chip and why prose have no data to show. Confirm before assigning to an iteration. | Unknown — check ComposerService |

### Summary of blockers

No hard blockers for the information changes in §6. The highest-value additions
(rationale sentences, output artifact wiring to TodayGrid, why explanation in
dialog) are either pure render changes or S-effort prop threading. The Kaizen
phase in the dialog is the only M-effort item and is not critical for the first
iteration of this spec.

The `composerInputsSnapshot.explain[]` availability is the one unknown that must
be confirmed before relying on why prose in the dialog. If it is empty, the why
rows simply do not render (already the default behavior for the WhyChip when
entry is null).

---

## Assumptions

1. `outputArtifact` is pre-resolved by CycleCard for ScheduledActivityBlock.
   The same resolution must be provided to TodayGrid as a map if compact-card
   output names are to be shown. CycleCard is the right place to build and pass
   this map — it already has catalog access.

2. `activity.slotKind` is populated for AM_COMM and POST_LUNCH_COMM anchors
   (from editMode.js PROTECTED_SLOT_KINDS). EoAR is identified by
   `activity.catalogEntryId === 'gen_end_of_activity_reflection'`. EOD Comm
   (Iter 38) must have a slotKind or catalogEntryId to differentiate from
   user-added COMM — confirm in composer output.

3. Micro-prompt on EoAR compact card ("What did you learn?") is height-gated
   at >= 40px block height. At 15 min × 60px/hr = 15px raw, the block is
   clamped to MIN_BLOCK_HEIGHT_PX = 24px. The prompt does NOT show at 24px.
   It shows only when the user has manually expanded EoAR to >= 40px. This is
   an acceptable constraint — most users will see EoAR at 15 min / 24px clamp.
   The dialog is the correct surface for the EoAR prompt.

4. The Lunch tooltip replacement (non-modal) is a behavioral change in app.js,
   not a CSS-only change. It requires adding a guard in the OPEN_BLOCK_DETAIL
   handler: if `isLunch`, render tooltip; else render BlockDetailDialog. QA
   must cover this conditional path.

5. This spec does not change the ScheduledActivityBlock list view. The list
   view is already the richest surface. The changes here target the calendar
   compact card and the BlockDetailDialog, which are currently the weakest.
