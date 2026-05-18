# UX Today — Per-Task-Type Information Product Definition

Owner: product-manager
Status: v1.0
Inputs: PRODUCT_BLUEPRINT v0.3, UX_FLOWS v0.2.2, GLOSSARY v1.0,
        UX_TODAY_V2_PRODUCT.md, UX_REVIEW_TODAY_PRODUCT.md,
        PRD_CADENCEPLAN_TODAY.md, UX_TODAY_V2_DESIGN.md

---

## 1. Product Purpose per Task Type

What is the user DOING when they encounter each block? Not what the block IS — what the
user is DOING.

### 1.1 PROJECT (Deep Work)

The user is producing output toward a defined deliverable that moves an active Kaizen or
named project forward. This is the highest-cognitive-demand block on the day. The user
needs to know exactly WHAT they are building in this slot (not just "project time"), and
they need to feel the weight of that 4h commitment as a protected resource. They are NOT
deciding what to work on; the composer and the active Kaizen have decided for them. Their
job is to execute with an intention stated and an artifact ready to receive output at close.

Catalog primitives: Deep Work — Project Task (generic), DMAIC steps #20–#41,
Accelerator tasks `30d_*`, Kaizen Event steps #42–#47.

Protected-anchor status: configurable (which DMAIC/Kaizen step fills the block), but the
240-min PROJECT bucket is a hard invariant. The user cannot shrink it below the 50% floor
without a composer infeasible.

### 1.2 COMMUNICATION

The user is executing high-value, structured communication — NOT clearing an inbox or
attending any meeting that arrived in calendar. The system has selected this block and its
sub-type to fulfill the 2h COMMUNICATION bucket. The user's job is to engage with the
specific named activity (e.g., Daily Standup has a 15-min procedure; AM Comm has a
focus list), not to freestyle email triage.

Sub-type behaviors differ in important ways (see §4). The unifying behavior: the user
is serving the team or stakeholders in a structured way, with a defined output (a decision
made, a sync completed, a document sent).

Catalog primitives: Daily Standup (#ceremony), High-value Communication Time-blocking
(catalog #14), High-value team & project meetings (#15), Connecting with teammates (#16),
Document Writing (#18), Value-Added Communication (generic).

Protected-anchor status: Daily Standup and AM/Post-lunch High-value Comm blocks are
non-optional anchors. End-of-Deep-Cycles Comm and any user-added Comm blocks are
configurable.

### 1.3 CI (Continuous Improvement)

The user is doing deliberate improvement work — structured, evidence-linked, and sacred.
This is not reactive time or bonus capacity. It is the 2h carved from the day explicitly
to make the system better. Depending on the sub-type, the user may be:

- Reflecting (End-of-Activity Reflection, Weekly Reflection) — capturing evidence that feeds
  the Kaizen queue
- Running an experiment (PDCA Cycle #12) — measuring a hypothesis
- Learning (#1 L&D, #2 Team L&D) — building capability
- Processing structure (6S Email #13) — restoring cognitive order
- Running a ceremony (Sprint ceremonies) — governing the improvement cycle

The Sacred CI Principle (Iter 31 directive) applies: this time is protected and purposeful.
The user doing CI is not "getting around to it" — they are running the most opinionated
part of the BAM system.

Catalog primitives: End-of-Activity Reflection (generic), Weekly Reflection (generic),
PDCA Cycle (#12), L&D (#1/#2), 6S Email (#13), Document Review (#4), Innovation Explore
(#6), Sprint ceremonies (Planning, Review, Retro, Mid-Sprint Review).

Protected-anchor status: End-of-Activity Reflection is embedded in the execution loop
(fires at close of each activity). Weekly Reflection on Friday is non-optional. Sprint
ceremonies are non-optional when the sprint phase fires them. All other CI entries are
configurable per day.

### 1.4 Lunch

The user is resting, eating, and resetting for the afternoon. The block is capacity-neutral
(bucket: null) and does not count toward any 4-2-2 target. The user is NOT doing any
structured work. There is no reflection, no artifact, and no output requirement. The only
product concern is ensuring this block does not consume time from another bucket by
accident and that it is visually distinct from productive blocks so the user knows they
are protected from expectation during this window.

Protected-anchor status: protected anchor; composer places it at a user-configured time;
it cannot be removed or re-bucketed.

---

## 2. Information Value Scores per Task Type

Scored 1 (not needed on card) to 5 (must be visible without a tap).
"Card" = the ScheduledActivityBlock in the Today CycleCard list.
"Dialog" = opened detail / BlockDetailDialog.

### 2.1 PROJECT Block

| Information element | Card score | Dialog score | Rationale |
|---|---|---|---|
| Activity name | 5 | 5 | User must know WHAT they are building (SIPOC vs C&E vs generic Deep Work) |
| Time of day / duration | 5 | 5 | 4h is a commitment; start time orients the user for meeting buffers |
| Expected output artifact | 4 | 5 | Composer-placed Deep Work without a named artifact is noise; knowing the artifact sets the intention before Start |
| Linked Kaizen (if any) | 5 | 5 | The evidence-linked planning principle — provenance is the differentiator |
| Composer rationale (why chip) | 3 | 5 | On card: collapsed chip is enough; in Dialog: full DAG context is critical |
| Bucket label ("PROJECT") | 2 | 2 | Redundant if color coding is present and the user understands the system; pure noise on day 7+ |
| State (PROPOSED / ACCEPTED / IN_PROGRESS / etc.) | 4 | 4 | IN_PROGRESS needs a clear visual; PROPOSED vs SCHEDULED matters for action |
| Edit / Skip / Start actions | 5 | 4 | Start is the dominant CTA; Skip (with reason code) must be accessible |
| DMAIC phase indicator | 3 | 5 | On card: single-word phase tag is sufficient; in Dialog: step name + predecessor status needed |
| Intention field | 4 | 5 | Required before Start on non-optional; user-authored; the contract for this block |

### 2.2 COMMUNICATION Block (all sub-types)

| Information element | Card score | Dialog score | Rationale |
|---|---|---|---|
| Activity name | 5 | 5 | Daily Standup vs AM Comm vs Post-lunch Comm vs End-of-Deep-Cycles Comm — each implies a different behavior |
| Time of day / duration | 5 | 5 | Standup is 15 min; AM Comm is 60 min; the duration is the structural signal |
| Expected output artifact | 3 | 5 | Standup: sync decision; AM Comm: list of high-value exchanges completed; must be in Dialog but not on card |
| Linked Kaizen (if any) | 2 | 3 | Comm blocks rarely link to a Kaizen directly; surfacing it on card is noise for most days |
| Composer rationale (why chip) | 2 | 4 | Non-optional anchors need no explanation; configurable Comm slots benefit from rationale in Dialog |
| Bucket label ("COMMUNICATION") | 2 | 2 | Redundant if color is present |
| State | 4 | 4 | Same as PROJECT — IN_PROGRESS and PROPOSED states are action-relevant |
| Edit / Skip / Start actions | 5 | 4 | Start is primary; non-optional Standup skip requires reason code, which is high-importance |
| Sub-type label | 5 | 5 | "Daily Standup" vs "AM Communication" must be the primary label; generic "COMMUNICATION" alone is insufficient |
| Participants (Standup) | 1 | 3 | On card: irrelevant; in Dialog: useful for ceremony blocks only |

### 2.3 CI Block (all sub-types)

| Information element | Card score | Dialog score | Rationale |
|---|---|---|---|
| Activity name | 5 | 5 | "PDCA Cycle" vs "End-of-Activity Reflection" vs "L&D — Sprint Planning book chapter" — all are categorically different activities |
| Time of day / duration | 4 | 5 | 2h is the bucket; individual CI activities range from 1 min (Reflection) to 120 min (Sprint Retro) |
| Expected output artifact | 5 | 5 | CI blocks without a named output artifact are unfalsifiable; the artifact IS the proof of CI |
| Linked Kaizen (if any) | 5 | 5 | Sacred CI principle: CI is evidence-linked; a CI block with no Kaizen link should be visually distinguishable from one that is linked |
| Composer rationale (why chip) | 4 | 5 | CI blocks are the most likely to feel arbitrary to a user; the why chip is more critical here than on Comm blocks |
| Bucket label ("CI") | 2 | 2 | Color coding sufficient |
| State | 4 | 4 | Same rationale as PROJECT |
| Edit / Skip / Start actions | 4 | 4 | Sprint ceremony CI blocks: skip requires reason code; PDCA / L&D: configurable, skip is lower-stakes |
| PDCA experiment link | 4 | 5 | For PDCA Cycle blocks: the linked PdcaExperiment hypothesis must surface in Dialog; on card a short "Exp: [hypothesis summary]" chip is high-value |
| Friction signal captured? | 3 | 5 | Post-close: was friction flagged? On card shows a small badge; in Dialog shows the tag and the linked FrictionSignal |

### 2.4 Lunch Block

| Information element | Card score | Dialog score | Rationale |
|---|---|---|---|
| Activity name | 3 | 3 | "Lunch" is self-evident |
| Time of day / duration | 5 | 5 | The only thing that matters: when it starts and how long |
| Expected output artifact | 1 | 1 | None. Explicitly remove. |
| Linked Kaizen (if any) | 1 | 1 | None. Never. Lunch is capacity-neutral. |
| Composer rationale (why chip) | 1 | 1 | None. Remove any why chip from Lunch blocks. |
| Bucket label | 1 | 1 | No bucket. Should not show a bucket chip. |
| State | 2 | 2 | SCHEDULED / IN_PROGRESS distinction is mildly useful (helps the user track afternoon start) |
| Edit / Skip / Start actions | 3 | 2 | Allow time-adjust (push Lunch 15 min) without full edit mode; no skip (it is protected) |
| Visual distinction | 5 | 5 | Lunch must be visually distinct from all productive blocks — lighter, muted, non-color-coded |

---

## 3. Acceptance Criteria per Task Type

### 3.1 PROJECT Block ACs

AC-P1: When a PROJECT block is rendered on Today, the user can immediately see the
specific catalog activity name (e.g., "DMAIC C&E Matrix" not just "Deep Work"), the
planned start time, planned duration in minutes, and — if a Kaizen is linked — the Kaizen
title displayed as a sub-label on the block without tapping.

AC-P2: When a PROJECT block is in PROPOSED state, the user can see a collapsed why-chip
on the block's trailing edge that reveals — on one tap — the composer's reason for choosing
this specific catalog entry (e.g., "SIPOC closed; C&E Matrix is the next eligible step").
The chip does not block any primary action.

AC-P3: When a PROJECT block is opened in BlockDetailDialog, the user can find: the full
catalog entry name, the output artifact schema (what they must produce to close), the
linked Kaizen title and phase, the IntentionField pre-populated from any prior intention,
and the catalog procedure steps for this entry.

AC-P4: When a PROJECT block's IntentionField is empty and the block is non-optional, the
Start button renders disabled with microcopy "State your output before starting" until
the intention field is filled.

AC-P5: When a PROJECT block is CLOSED, the block renders with a muted style showing the
actual duration, a check indicating output artifact captured, and — if friction was flagged
in the Reflection — a small friction badge visible without tapping.

### 3.2 COMMUNICATION Block ACs

AC-C1: When a COMMUNICATION block is rendered on Today, the user can immediately see
the specific sub-type name (e.g., "Daily Standup", "AM Communication", "Post-lunch
Communication") as the primary label — not the generic bucket label "COMMUNICATION" —
along with planned start time and planned duration.

AC-C2: When a Daily Standup block is rendered on Today, the non-optional lock indicator
is visible on the block (a small icon or locked state) so the user knows a skip will
require a reason code before they attempt it.

AC-C3: When a COMMUNICATION block is opened in BlockDetailDialog, the user can find:
the sub-type name, duration, the catalog-defined procedure for this activity (e.g., Standup
procedure: 3 questions; AM Comm procedure: high-value exchange focus list), and the output
artifact field (a decision logged, a sync confirmed, a document sent).

AC-C4: When a configurable COMMUNICATION block (user-added or non-anchor) is in PROPOSED
state, the why-chip is available in BlockDetailDialog explaining why this slot was placed
(e.g., "Connecting with teammates window — Wed/Thu per catalog #16"). Non-optional anchor
blocks do not require a why-chip because their placement is self-evident.

AC-C5: When a Daily Standup block is skipped, the SkipReasonModal renders the five fixed
reason codes and blocks the skip action until one is selected, identical to the behavior
for any non-optional block.

### 3.3 CI Block ACs

AC-CI1: When a CI block is rendered on Today, the user can immediately see the specific
catalog activity name (e.g., "PDCA Cycle", "Weekly Reflection", "L&D — Personal"), the
planned duration, and — if the block is linked to a Kaizen — the Kaizen title as a
sub-label. A CI block with no Kaizen link must be visually distinguishable from one that
is linked, so the user can immediately see whether the CI block is evidence-connected.

AC-CI2: When a CI block in PROPOSED state is a configurable entry, the why-chip is
visible and reveals the specific reason this catalog entry was chosen over others eligible
for the CI bucket that day (e.g., "PDCA Cycle scheduled because your active experiment
has not had a tick in 48 hours").

AC-CI3: When a CI block is opened in BlockDetailDialog, the user can find: the catalog
activity name, the required output artifact (e.g., PDCA Cycle requires measurement +
hypothesis update; Weekly Reflection requires the dmaicDraft 4-field completion), any
linked Kaizen or PdcaExperiment, and the catalog procedure for this entry.

AC-CI4: When a CI block is a Sprint ceremony (Sprint Planning, Sprint Review, Sprint
Retrospective, Mid-Sprint Review), the block is rendered with a non-optional lock
indicator, the ceremony name is the primary label, and the expected output is pre-shown
on the card (e.g., Sprint Retrospective output: two lists — went well / to improve).

AC-CI5: When an End-of-Activity Reflection block is rendered (the 1-min embedded close
ritual, not a scheduled CI slot), it must not compete visually with the primary activity
block it follows. It renders as a compact sub-element or inline prompt, not a full block,
and carries no bucket label, no Kaizen link display, and no edit/skip actions.

### 3.4 Lunch Block ACs

AC-L1: When a Lunch block is rendered on Today, the user can immediately see the planned
start time and duration. The block carries no bucket label, no Kaizen link, no output
artifact prompt, and no why-chip. It is visually distinct from all productive blocks
(muted background, no colored bucket accent).

AC-L2: When a Lunch block is rendered on Today, the only available action is a lightweight
time-adjust (push/pull start time by 15 or 30 minutes) accessible without entering full
edit mode. No Skip action is available.

AC-L3: When the user's Lunch block is IN_PROGRESS (clock is within the lunch window),
the NowPane shows "Lunch — back at [end time]" as the current activity without triggering
any start CTA, reflection prompt, or artifact requirement.

---

## 4. Sub-Type Considerations

### 4.1 COMMUNICATION Sub-Types: Do They Need Different Info?

Yes. The bucket-level treatment alone is insufficient. Four sub-types have meaningfully
different information needs on the card:

**Daily Standup (15 min, non-optional, every workday)**
- Primary need: time (it anchors the morning), non-optional lock indicator, the 3-question
  procedure accessible in 1 tap. On card: name + time + lock. In Dialog: full procedure.
- Does NOT need: composer rationale (placement is self-evident), linked Kaizen (Standup
  is not Kaizen-linked), long artifact form (output is a sync decision, a short text field).

**AM Communication (60 min, non-optional, anchor)**
- Primary need: name ("AM Communication" not just "Communication"), duration (60 min is
  a significant commitment), the high-value exchange focus field in Dialog. On card:
  name + duration + start time.
- Does NOT need: why-chip (non-optional anchor), linked Kaizen on card.

**Post-lunch Communication (30 min, non-optional, anchor)**
- Primary need: name, start time (it anchors afternoon entry), duration. Functionally
  identical to AM Comm but shorter. On card: name + time.
- Does NOT need: differentiated treatment from AM Comm beyond name and timing.

**End-of-Deep-Cycles Communication (configurable, user or composer placed)**
- Primary need: the specific catalog entry name that fills this slot (e.g., "Connecting
  with teammates", "Document Writing", "High-value team meeting"). If a user added this
  manually, it needs a why-chip. On card: specific name, not generic "End-of-Deep-Cycles
  Comm".
- This is the sub-type most likely to be miscommunicated as generic. The card must show
  the specific catalog entry name, not the slot name.

**Verdict:** The bucket label "COMMUNICATION" is secondary. The specific sub-type name
must be the primary label on every COMMUNICATION block. Generic bucket-level treatment
would compress four distinct user behaviors into one undifferentiated block — this is
exactly the anti-pattern BAM-X exists to prevent.

### 4.2 CI Sub-Types: Does Reflection Need Different Info Than Sprint Planning?

Yes, significantly.

**End-of-Activity Reflection (1 min, embedded at activity close)**
- This is not a scheduled block in the traditional sense — it fires automatically after
  every ScheduledActivity close. It should NOT render as a full ScheduledActivityBlock.
  It is a modal / inline prompt. Information need: the plan-vs-actual delta (auto-computed),
  a single friction tag checkbox, and 140-char text. No bucket label, no Kaizen link, no
  why-chip, no edit actions.
- If rendered as a block: it would appear 6-8 times per day, drowning the CycleCard in
  CI-labeled rows. This is an explicit out-of-scope item for the block treatment.

**Weekly Reflection (20 min, Friday, non-optional CI anchor)**
- Needs: the 5-step DMAIC wizard indicator, the friction signal count feeding into this
  session (surfaced pre-Start so user knows evidence quality), the Kaizen promotion decision
  point. On card: "Weekly Reflection — N friction signals this week" as a sub-label.
  In Dialog: full 5-step flow entry.

**PDCA Cycle (configurable, every ~48 hours when an experiment is active)**
- Needs: the linked PdcaExperiment hypothesis as a visible sub-label on card (not just
  "PDCA Cycle" as an opaque label), the tick count (tick 3 of 10), and the measurement
  form in Dialog. A PDCA block without the experiment context is meaningless.

**Sprint Planning / Sprint Review / Sprint Retrospective (ceremonies, non-optional)**
- Need: ceremony name as primary label, non-optional lock, expected output on card
  (Retro: two lists; Review: demo results; Planning: sprint backlog committed). The sprint
  ceremonies carry enough ceremony weight to surface their output schema on the block
  without opening Dialog.

**L&D, 6S Email, Document Review (configurable CI fills)**
- These are the "quiet" CI activities. They need the specific catalog name, duration, and
  the output artifact type visible on card (L&D: what you are studying; 6S Email: inbox
  count before/after; Document Review: which document). A generic "CI" label fails these
  entries.

---

## 5. Differentiation from Generic Calendar Apps

### 5.1 What BAM-X Shows That Google Calendar Does Not

**Per-block output artifact specification.** Every BAM-X block carries a catalog-defined
output schema (TEXT / TWO_LIST / NUMERIC / DOCUMENT / CHART). The user knows before they
start what they must produce to close the block. Google Calendar events have no artifact
requirement — attending is enough. BAM-X makes completion observable and measurable.

**Composer provenance (why-chip).** Every PROPOSED-state block carries the composer's
reason for its placement sourced from `composerInputsSnapshot.explain[]`. "Chosen because
your DMAIC SIPOC is closed and C&E Matrix is the next eligible step" is information Google
Calendar cannot produce because it has no awareness of catalog DAGs, active Kaizens, or
sprint phase.

**Non-optional lock with reason code.** Skipping a non-optional block on BAM-X requires
a reason code and produces an append-only Variance row. Google Calendar events can be
deleted with no trace. The variance log is a first-class adherence signal that BAM-X uses
to coach the next cycle. This is visible on the block as a lock indicator.

**Bucket-cognition typing (4-2-2).** Every block is typed as PROJECT / COMMUNICATION /
CI / null, and those types are cognition types (not user-defined labels). The BucketStrip
enforces the 240/120/120 invariant. Google Calendar has no concept of cognitive mode.
A meeting at 10 AM and a DMAIC step at 10 AM look identical in Google Calendar; in BAM-X
they carry categorically different information and UI treatment.

**Kaizen provenance on Deep and CI blocks.** A Deep Work block linked to an active DMAIC
Kaizen shows the Kaizen title, current DMAIC phase, and the specific catalog step being
executed. This is the evidence-linked planning principle in observable form. No calendar
app has Kaizen linkage because no calendar app is an improvement OS.

### 5.2 What MUST Stay (non-negotiable differentiators)

1. The why-chip on PROPOSED-state blocks. Acceptance on faith is a Google Calendar
   behavior. Acceptance with provenance is the BAM-X behavior.
2. The non-optional lock + reason code skip. Variance logging is what makes adherence
   measurable. Removing the lock makes BAM-X a calendar.
3. The output artifact requirement at close. This is the single clearest line between
   "block completed" (calendar) and "standard work executed with evidence" (BAM-X).

---

## 6. Out of Scope — Information to Remove or Never Add

### 6.1 Currently Shown — Remove

**Bucket label text ("PROJECT", "COMMUNICATION", "CI") as a standalone chip on every
block.** Color coding carries this information for returning users (day 7+). The text
chip is noise that competes with the activity name for the primary read slot. Recommendation:
show bucket label only in the why-chip expanded state and in BlockDetailDialog, not as
a persistent chip on the collapsed card. Exception: show it on Lunch blocks as an
explicit "null / capacity-neutral" signal only if the absence of bucket color causes
confusion — but the cleaner solution is visual distinctiveness (muted treatment) rather
than a text label.

**Composer rationale on non-optional anchor blocks (Daily Standup, AM Comm, Post-lunch
Comm, Sprint ceremonies).** These blocks are self-evidently placed because they are
non-optional. A why-chip on a Daily Standup block that reads "Chosen because it is
non-optional and fires every workday" is pure noise. Reserve why-chips for configurable
blocks where the specific choice requires explanation.

### 6.2 Never Add (explicitly excluded)

**Output artifact prompt or reflection prompt on Lunch blocks.** Lunch is capacity-neutral
and sacred in its own way — the user must be able to see it has zero output requirement
without hunting for confirmation.

**Linked Kaizen display on COMMUNICATION blocks (card level).** Communication blocks
rarely link to a Kaizen. Showing a blank Kaizen link slot on every Comm block trains
the user to ignore it, which undermines the signal on CI and PROJECT blocks where the
Kaizen link is critical.

**DayBadge ("Day 47") on individual blocks.** The DayBadge is a page-level element and
is already flagged for suppression after day 14 in UX_TODAY_V2_PRODUCT.md. It must not
migrate into block-level information.

**Duration chips on closed blocks.** Once a block is CLOSED, the actual vs planned
delta is a reflection artifact, not a card-level display item. Surfacing it on every
closed block throughout the day creates visual noise that competes with the active block's
information needs. Reserve plan-vs-actual for the Reflection capture step and the
AdherenceDial KPI.

---

## 7. Phasing Recommendation

Changes below are sequenced by impact. Phase 1 contains the highest-value, lowest-risk
changes (rendering-only, no data model changes). Phase 2 requires new data fields but
no structural changes. Phase 3 requires composer output changes.

### Phase 1 — Card label and noise reduction (this iteration)

1a. Replace generic bucket label chip with specific sub-type name as primary label on
all COMMUNICATION and CI blocks. "Daily Standup" not "COMMUNICATION". "PDCA Cycle" not
"CI". Zero new data required; the CatalogEntry name is already bound to ScheduledActivityBlock.

1b. Remove why-chip from non-optional anchor blocks (Daily Standup, AM Comm, Post-lunch
Comm, Sprint ceremonies). This is a conditional render suppression, not a removal of
the component.

1c. Apply muted visual treatment to Lunch block and remove bucket chip, Kaizen link
slot, and output artifact prompt from Lunch block rendering path.

1d. Surface linked Kaizen title as a sub-label on PROJECT and CI blocks where
`linkedKaizenId` is non-null. This data is already in props per `kaizenTitleById` in
Today.js. Rendering-only change.

Expected impact: comprehension time on the CycleCard drops for returning users; the
highest-value blocks (PROJECT, CI) are immediately distinguishable from the lower-stakes
ones (Lunch, non-optional Comm anchors).

### Phase 2 — Dialog and artifact specification (next iteration)

2a. Show expected output artifact schema on card for CI ceremony blocks (Sprint Retro:
"Two lists: went well / to improve"; Sprint Review: "Demo results summary"). This requires
reading `CatalogEntry.outputArtifact.schema` at card render, which is already available
in the data model.

2b. Show PDCA tick count and linked PdcaExperiment hypothesis as sub-label on PDCA
Cycle blocks. Requires threading `linkedPdcaExperimentId` and the experiment hypothesis
into the ScheduledActivityBlock props. Minor data plumbing.

2c. Show friction badge on CLOSED blocks where the Reflection captured a FrictionSignal.
Requires reading `Reflection.frictionFlag` in the card's closed-state render.

2d. Show Weekly Reflection friction-signal count as a sub-label on the Friday Weekly
Reflection CI block ("N friction signals available this week"). Requires a derived count
from `FrictionSignal[]` in the current week.

Expected impact: users start the Weekly Reflection knowing whether the evidence base is
strong; PDCA blocks become self-describing; CI blocks carry evidence status.

### Phase 3 — Composer provenance and why-chip quality (following iteration)

3a. Populate `composerInputsSnapshot.explain[]` per ScheduledActivity in the composer
so that the why-chip on configurable PROJECT and CI blocks shows specific, accurate
provenance (DAG step reasoning, active Kaizen phase, variance queue influence).

3b. Differentiate why-chip content by block type: PROJECT blocks show DAG context,
CI blocks show rotation reason and experiment linkage, configurable COMM blocks show
catalog entry selection reason.

3c. For PROPOSED-state CI blocks, add a one-line "if you skip this, it goes to the
variance queue" indicator so the user understands the downstream consequence before
skipping. This requires reading `CatalogEntry.isNonOptional` and the composer's
variance queue state.

Expected impact: composition acceptance rate increases because configurable blocks
explain themselves; users no longer accept configurable CI and PROJECT blocks on faith.

---

## 8. Open Questions for Phil

1. **End-of-Activity Reflection rendering model.** The Reflection is currently described
   as a modal overlay fired at activity close, not a block in the CycleCard. Should it
   remain modal-only, or should a "pending reflection" stub appear as a compact inline
   element in the CycleCard between the closed block and the next scheduled block?
   Default if unanswered: modal-only; no block rendering.

2. **Lunch block skip / time-adjust scope.** The recommendation above allows lightweight
   time-adjust on Lunch without full edit mode. Is the current EditDrawer the right
   surface for this, or should Lunch get a dedicated 15/30-min nudge action directly
   on the block? Default: dedicated nudge, not EditDrawer entry.

3. **Bucket label removal threshold.** The recommendation removes the bucket label chip
   from collapsed cards for returning users. Should this suppression start at day 2
   (same threshold as RhythmExplainer) or remain visible until the user explicitly
   dismisses it? Default: suppress at day 7 (after the AdherenceDial baseline period),
   consistent with the activation funnel in Blueprint §7.3.

4. **PDCA hypothesis sub-label length.** PDCA experiment hypotheses may be verbose.
   What is the max visible length for the sub-label on the PDCA Cycle block before
   truncation? Default: 60 characters, truncated with ellipsis, full text in Dialog.

5. **Sprint ceremony sub-type label source.** Sprint Planning, Sprint Review, Sprint
   Retrospective, and Mid-Sprint Review are ceremony CatalogEntries. Should their
   card label come from `CatalogEntry.name` (which may be the BAM canonical name
   like "Improvement Planning Meeting") or from a user-facing alias (e.g., "Sprint
   Planning")? Default: user-facing alias per the canonical ceremony names in
   PRODUCT_BLUEPRINT §3.1 ceremonies table.
