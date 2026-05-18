# UX_TODAY_REVIEW_R3 — Today Page Fresh-Eyes Review
## Cumulative Deploy: Iter 31–49

**Reviewer:** UX Designer subagent
**Date:** 2026-04-30
**Scope:** Today page functionality and UX — fresh-eyes audit, no prior recommendations anchored

---

## 1. Functionality Audit

### Load — Composition Exists (PROPOSED state)
Works. `CycleCard` renders `renderProposed()` which emits the date heading, PROPOSED banner,
TodayGrid with dashed-border blocks, and the Accept/Edit/Reject triad. The `CadencePressureRing`
fires in the header only when `ringActivities` is non-null (`Today.js:189`).

**Friction found:** The PROPOSED banner (`CycleCard.js:316–320`) and the dashed block outlines
(`app.css:475–502`) both encode the same information — "these are proposals." Two redundant
signals for one concept. The banner text is verbose: "Your day plan is ready for review.
Dashed-border blocks are proposals — accept to commit." Users who understand calendar UX do not
need this decoded for them.

### Load — Empty State (no composition)
Works. `Today.js:274–291` renders `emptyCopy` + `daysSinceSignupHint` + `AutoPlanButton`.
The copy variants (`TODAY_COPY.FIRST_RUN` vs `TODAY_COPY.EMPTY`) are appropriately distinct.

**Friction found:** The empty state has no visual illustration of what the page will look like.
A first-time user clicks Auto-Plan into a calendar they've never seen. There's no affordance
showing that the grid exists. Minor but real for day-0 users.

### Load — INFEASIBLE State
Works. `InfeasibleBanner` + AutoPlanButton. `Today.js:262–272`. Copy is action-oriented.
No significant friction found.

### Click Any Activity Block
**PROJECT:** Works. `blockWrapper()` emits `data-action="OPEN_BLOCK_DETAIL"`. `BlockDetailDialog`
renders with color bar, time range, secondary line (intention/output), kaizen chip if linked,
Edit button (`BlockDetailDialog.js:196–203`).

**COMM:** Works. Dialog shows sub-type rationale sentence (`BlockDetailDialog.js:221–226`).
The five rationale variants work but `COMM_RATIONALE_BY_CATALOG_ID` only has one entry
(`cer_daily_standup` — `BlockDetailDialog.js:49–51`). User-added COMM without a recognized
`slotKind` gets the generic "Communication time." fallback (`BlockDetailDialog.js:97`).
This is not a bug — it is a gap in rationale coverage.

**CI:** Works. EoAR block gets `cycle-block-sacred` class + sacred-indicator dot
(`TodayGrid.js:305–314`). Sprint ceremonies get rationale sentence. Non-ceremony CI without
a kaizen link gets the unlinked indicator (`TodayGrid.js:329–334`). The "Start Reflection"
button in BlockDetailDialog dispatches `EOD_OPEN_REFLECTION` (`BlockDetailDialog.js:237–244`).

**Lunch:** Works differently — emits `OPEN_LUNCH_TOOLTIP` not `OPEN_BLOCK_DETAIL`
(`TodayGrid.js:537–540`). The tooltip renders as a centered fixed overlay with a backdrop click
to dismiss (`Today.js:617–635`). This is coherent.

**Protected blocks (PROTECTED state):** Iter 45 fixed the click bug. Clicking a protected block
now correctly opens `BlockDetailDialog` (no disabled Edit button, rationale sentence shown).

**Friction found:** The BlockDetailDialog has no visible way to close it except the `×` button
at top-right and clicking the backdrop. The backdrop close works but is not discoverable —
there is no visual hint that clicking outside closes the dialog. Pressing Escape is not
documented/confirmed in code; focus-trap handling (`js/ui/focusTrap.js`) exists but its
Escape binding must be verified against `BlockDetailDialog`'s rendering path.

### Drag-to-Move and Drag-to-Resize
Move: `dragController.js:189–256`. Uses `pointerdown`/`pointermove`/`pointerup`.
15-min snap interval. Works on non-protected, non-lunch blocks.

Resize: Bottom edge handle (10px hit area, `app.css:978–989`). `data-activity-duration`
attr drives the resize math. Works.

PROPOSED path: Drag queues `dragSession` → confirm banner appears → user must Confirm or Cancel
(`Today.js:349–357`). This is a two-step commit that protects accidental edits before accepting.

ACCEPTED/EDITED path: Drag commits immediately → overlap detection fires → conflict banner if
needed (`Today.js:354–357`).

**Friction found:** The resize handle hit area is 10px (`app.css:982`). On touch devices, 10px
is below the 44px minimum recommended by Apple HIG and barely meets WCAG 2.5.8 (24x24px minimum
for target size). On desktop this is acceptable for a pointer-based interaction, but tablet use
will be frustrating. This is a real usability risk on iPads, which is a plausible device for
planning at a desk.

**Second friction:** The drag-confirm banner text says "Move {name} to {start}?" where `newStart`
is an HH:MM string (`Today.js:499`). If the user drags to 14:30, the banner reads
"Move Daily Standup to 14:30?" — adequate but slightly mechanical. No friction classification
change, just noted.

### Click Empty Time (CatalogPicker)
`TodayGrid.js:752–761` renders a transparent `cycle-empty-overlay` behind blocks.
`data-action="CLICK_EMPTY_TIME"` fires when the click target is not inside a block.
Snaps to 15-min increments via `CLICK_SNAP_MINUTES`. `CatalogPickerDialog` opens.

**Friction found:** The overlay element is `aria-hidden="true"` which is correct —
it's a visual affordance, not a meaningful element. However, keyboard users have no way
to open the CatalogPicker because the empty timeline has no focusable element to tab to.
There is no keyboard path to add an activity to a time slot without entering Edit mode.
This is a **missing interaction path for keyboard users**.

### Click Settings Gear
`AppShell.js:47–55`. Gear icon links to `#settings`. `Settings.js` renders theme radios
+ motion radios. Changes dispatch `PREF_CHANGE_THEME` / `PREF_CHANGE_MOTION`.
`UserPreferencesService.save()` persists. Works.

**Friction found:** The Settings page has no back navigation button. Users must click a nav
item to leave. On mobile (if ever targeted), this is a dead-end. For now it's acceptable.

### Switch Themes (Light / Dark / System)
Theme switching applies `data-theme` to `<html>`. `app.css:3864–3953` handles all three layers.
Bucket fill colors are intentionally not modified across themes (AC9). Dark mode surfaces:
`--surface-card: #252320`, text: `--text-primary: #e8e4de`.

Works. Color identity (green/yellow/purple) stays vivid in dark mode as intended.

**One gap:** The `lunch-tooltip-content` styles (`app.css:711–723`) use `var(--color-surface, #fff)`
and `var(--color-border, #e5e7eb)` — these are NOT the same tokens as the theme system
(`--surface-1`, `--border-subtle`). In dark mode the lunch tooltip will fall back to white
background (`#fff`) because `--color-surface` is not declared in the dark theme overrides.
This is a token naming mismatch that will render the lunch tooltip light-on-light in dark mode.
**Confirmed bug: `app.css:712`.**

Similarly, `bdd-rationale` uses `var(--color-text-secondary, #6b7280)` (`app.css:754`) —
again a non-theme token. The BlockDetailDialog rationale sentence will be mid-gray even in
dark mode. Readable but inconsistent. **Same token category bug.**

### Switch Motion Intensity
`data-motion="reduced"` on `<html>` triggers `app.css:3958–3965` which blanket-suppresses
all animation durations. Block reveal, kaizen ping, now-line glow, ghost-pulse all stop.
Works correctly. Respects `prefers-reduced-motion` media query as a parallel path.

### Click Cadence Pressure Ring (hover for tooltip)
`CadencePressureRing.js:233`. The ring wrapper has `tabindex="0"` + `role="img"` + an aria-label
that reads out bucket minutes. Tooltip is CSS-only on hover (`cadence-tooltip`, `role="tooltip"`,
`aria-hidden="true"`). Three dot indicators + PROJECT/COMM/CI labels + minutes + balance status.

Works. The balance text reads "Day is balanced" or "Day is unbalanced" with no threshold detail.

**Friction found:** The tooltip is hover-only (`aria-hidden="true"`). Keyboard users who focus
the ring via Tab will get the aria-label read out but cannot see the tooltip breakdown. The
tabindex exists but has no associated keyboard interaction to show the tooltip. This means
keyboard users get a summary ("Day allocation: 6.5h total — Project 4h 0m, ...") but not
the per-bucket breakdown visual. Acceptable trade-off but worth noting.

**Second friction:** The ring sits at 56px in the header left corner. When there is no
composition (empty/infeasible state), `ringHtml` is empty (`Today.js:196`), so the header
has only the center activity summary and right-edge Day badge — the left side is empty.
This creates an off-center, lopsided header. A placeholder or ghost ring would preserve layout.

### Use NowJumpButton
`NowJumpButton.js:21–27`. Dispatches `SCROLL_TO_NOW`. `app.js` calls
`document.querySelector('.cycle-now-line')?.scrollIntoView({block: 'center', behavior: 'smooth'})`.

Works. The button is sticky bottom-right inside `.today-card-col`. The button is always visible
as long as `nowIso` is present (`Today.js:371`).

**Friction found:** The button uses a down-arrow (`↓ Now`) but the now-line could be below or
above the viewport. If the user is already below the current time, scrolling down is correct,
but if they are above it, the arrow is misleading (should point up). This is a minor directional
affordance mismatch. A neutral "Now" without the arrow, or a dynamic arrow, would be more accurate.

### Start Reflection on End-of-Activity Reflection Block
`BlockDetailDialog.js:229–249`. Clicking the EoAR block opens the dialog, which renders the
sacred rationale and a "Start Reflection" button dispatching `EOD_OPEN_REFLECTION`. Works.

The `ReflectionSheet` component handles the actual reflection. The path is coherent: click block
→ dialog → button → reflection sheet.

**Friction found:** There is no visual distinction between the EoAR block and other CI blocks
beyond the `cycle-block-sacred` glow outline. The sacred-indicator dot is 7px (`app.css:686–691`)
and positioned top-right at 4px/6px, which is tiny and competes with other overlaid elements.
New users will not recognize the EoAR block as a specially actionable item without the dialog.

### Blocks with Kaizen Links vs Unlinked
Linked: `kaizenChip` renders with kaizen title + `kaizenPing` animation. Kaizen sub-label
appears on PROJECT and CI blocks ≥56px (`TodayGrid.js:240–244`, `320–323`). Works.

Unlinked CI: `cycle-block-ci-unlinked` span — 3px dashed amber left-edge strip
(`app.css:619–634`). Only on user-added CI, not sprint ceremonies. Works per spec.

**Friction found:** Both the kaizen chip AND the kaizen sub-label render on the same block
(`TodayGrid.js:246–248`). The chip shows the kaizen title as a small pill at the bottom.
The sub-label also shows the kaizen title as a mono text line above the chip. Two elements
showing the same string on the same block. This is **redundant information density** on
blocks that are already compact (12px base font, 5px padding).

---

## 2. UX Assessment

### Visual Hierarchy
The header (Cadence Pressure Ring left / activity summary center / Day badge right) is clean
after the Iter 48 date-echo removal. The eye should land on the calendar grid because it is
the dominant element in area. But the PROPOSED banner (`CycleCard.js:316–319`) interrupts
the flow between header and grid, adding a second horizontal interruption before the user can
see the day. For returning users (day 5+), this banner communicates nothing they don't already
know.

The date heading in `cycle-date-display` (`CycleCard.js:310`) uses Instrument Serif which gives
it the right editorial weight. It is the strongest typographic element on the page and correctly
anchors the calendar.

### Information Density
Blocks contain up to 5 layers of information on a single card:
1. Time range (Geist Mono, 10px)
2. Name (Geist, 12px, weight 500)
3. Secondary line (intention or output, 10px, opacity 0.72)
4. Kaizen sub-label (Geist Mono, 9px, opacity 0.65)
5. Kaizen chip (glow pill, 9px)

For a 60-minute block (~60px tall at default 60px/hour), items 3–5 will all try to render
at heights between 56px and 60px, which is the minimum gate. At 30-minute blocks (30px),
only items 1–2 show, which is correct. The 56px gate is reasonable but the four-line stack
on barely-tall-enough blocks will overflow or clip. QA should verify a 60-minute block with
a long name, intention, and linked kaizen.

### Color Identity
Green/yellow/purple is working well. The 3-stop gradient (`app.css:792–830`) gives the
blocks depth and makes the calendar visually rich rather than flat. Dark mode preserves the
fills as intended (AC9).

The now-line red (`--now-red: #dc2626`) is correctly distinct from all three bucket colors.
The glow trail and breathing dot are distinctive without being garish.

The one area of concern: past-hour dimming (`opacity: 0.55` on `.cycle-hour-past`) applies
to the hour-rail labels only. The blocks in past hours remain at full opacity. This creates
a visual disconnect — the time labels look faded but the blocks they label are vivid. Google
Calendar dims both the rail and the blocks in past hours. Phil's approach is defensible
(the plan is still real even if past), but it may feel slightly inconsistent.

### Typography
Instrument Serif for date heading, Geist for body, Geist Mono for time labels and kaizen
elements — this is a coherent system. The hierarchy works: Instrument Serif signals "date/identity",
Geist Mono signals "precise/numeric". The 9px kaizen sub-label in Geist Mono is at the edge of
legibility at standard pixel density (retina displays will handle it; 1x displays may struggle).

### Spacing / Rhythm
The 5px left/right padding on `cycle-block-positioned` (`app.css:441`) is tight but allows
the block gradients to breathe. The 5px vertical gap (`gap: 2px` on flex column, `app.css:449`)
between block sub-elements is compact. The 48px hour rail width (`app.css:367`) is appropriate
and leaves the timeline wide.

The `today-header` uses `justify-content: space-between` (`app.css:145–148`) with `flex: 1`
on the center div. When the ring is absent (empty state), the header collapses to center+badge
with an awkward left void.

### Coherence Across Iterations
The cumulative deploy is coherent. Iters 39–48 have been additive without leaving visible
seams except for the token naming inconsistency in dark mode noted above. The removal decisions
(bucket label rows, standalone duration row, right-margin strip, date echo, disabled Edit button)
were all correct calls that reduced noise. The page is cleaner than it was at Iter 38.

---

## 3. Specific Improvements (Top 7)

### Improvement 1: Remove the PROPOSED Banner
**What changes:** Delete the `proposedBanner` block in `CycleCard.js:316–319` and the
`cycle-proposed-banner` CSS. The dashed block outlines already encode "proposed." The banner
text adds no new information for a user past day 1.

**Effort:** S (15 min — remove JSX block + CSS rules, no logic change)

**Rationale:** Eliminates a redundant signal that interrupts the visual path from header to
calendar. Users trust the dashed outlines once they've used the page once. The banner is
doing work that the visual encoding already does.

**§6.5 hit:** No

**Classification:** Friction reduction — removing a familiarity scaffold that has outlived its
purpose.

---

### Improvement 2: Fix Dark-Mode Token Mismatch in Lunch Tooltip + BDD Rationale
**What changes:**
- `app.css:712` — change `var(--color-surface, #fff)` to `var(--surface-1, #fff)`
- `app.css:713` — change `var(--color-border, #e5e7eb)` to `var(--border-subtle, #e5e7eb)`
- `app.css:754` — change `var(--color-text-secondary, #6b7280)` to `var(--text-muted, #57534e)`
- Check `.bdd-btn-reflect` at `app.css:762` — `var(--ci-fill-base, #6d28d9)` is correct (fill tokens are not overridden by theme).

**Effort:** S (under 30 min — CSS token substitutions only)

**Rationale:** In dark mode, the lunch tooltip renders on a white background, and the
BlockDetailDialog rationale sentence reads in mid-gray. Both are visually broken in a shipped
feature. This is a correctness fix, not a polish item.

**§6.5 hit:** No

**Classification:** Bug fix — dark mode regression from mismatched token naming systems.

---

### Improvement 3: Consolidate Kaizen Evidence to One Element Per Block
**What changes:** On PROJECT and CI blocks, show only the kaizen sub-label (`cycle-block-kaizen-sublabel`)
OR the kaizen chip (`cycle-block-kaizen`), not both. The sub-label carries more meaning (shows
the title as readable text) and is already height-gated. The chip is a smaller, less readable
version of the same information. Remove `kaizenChip` from the inner content of `renderProjectBlock()`
and `renderCIBlock()` in `TodayGrid.js` when `kaizenTitle` is non-null and `h >= 56`.

**Effort:** M (1–2 hours — conditional logic change in renderProjectBlock/renderCIBlock,
verify CSS animation on chip is not expected elsewhere)

**Rationale:** Two elements on the same block showing the same kaizen title is redundant
information density. The kaizen ping animation (`kaizenPing`) is a useful first-load signal
but fires on the chip, which could be moved to the sub-label element instead. Reduces visual
noise on every linked block.

**§6.5 hit:** No

**Classification:** BAM-X-unique — the kaizen linking pattern has no precedent in standard
calendar apps; cleaning up the dual-representation improves the concept's legibility.

---

### Improvement 4: Fix the NowJumpButton Arrow Direction
**What changes:** In `NowJumpButton.js:22`, replace the static down-arrow (`&#8595; Now`) with
a neutral label `Now` or compute direction. The simplest fix: remove the arrow entirely.
CSS: `.now-jump-btn` retains its styling.

**Effort:** S (5 min — single string change in NowJumpButton.js)

**Rationale:** A down-arrow implies the now-line is always below. If the user is viewing
the morning from an afternoon scroll position, the arrow misleads. A plain "Now" pill
is unambiguous. The red color already signals urgency/temporality.

**§6.5 hit:** No

**Classification:** Familiarity adjustment — calendar apps (GCal) use a bidirectional or
neutral "Now" indicator.

---

### Improvement 5: Add a Keyboard Path to CatalogPicker
**What changes:** Add a visible "+ Add activity" button inside the TodayGrid's empty zones,
or add a keyboard-activatable affordance to the header/card area that dispatches
`CLICK_EMPTY_TIME` with a default start time (e.g., next available 15-min slot). This does
not require changing the empty-overlay architecture.

Simplest implementation: add a small "+" FAB inside the `cycle-calendar-grid-wrap` that
is visible on keyboard focus and dispatches `CLICK_EMPTY_TIME` with a computed default
`startMinutes`. The empty overlay continues to handle mouse/touch.

**Effort:** M (2–3 hours — new button element in TodayGrid or CycleCard render, plus
`app.js` handler to compute default start time)

**Rationale:** Currently, keyboard users have no path to add an activity by time slot. This
is an accessibility gap. The drag interaction is inherently pointer-only, but opening the
picker should be keyboard-accessible.

**§6.5 hit:** No (pure UI layer addition)

**Classification:** Accessibility gap — BAM-X-unique feature with a missing interaction modality.

---

### Improvement 6: Resize Handle Hit Area Increase
**What changes:** In `app.css:982`, increase `.cycle-block-resize-handle` height from `10px`
to `16px`. Also increase the visual accent line width from `right: 20%`/`left: 20%` to
`right: 10%`/`left: 10%` to make the grab affordance more visible on hover.

**Effort:** S (15 min — two CSS value changes)

**Rationale:** 10px is below the minimum touch target for tablet users. 16px remains subtle
enough not to intrude on block content but makes resize reliably hittable. The change has no
impact on desktop mouse interaction and meaningfully improves tablet usability.

**§6.5 hit:** No

**Classification:** Familiarity adjustment — standard touch target sizing.

---

### Improvement 7: Empty-State Header Layout Fix
**What changes:** When `ringHtml` is empty (no composition), provide a placeholder element of
the same 56px width on the left to preserve the header's three-column layout. Simplest approach:
in `Today.js:192–196`, when `ringActivities` is null, render a `<div class="cadence-ring-placeholder"
aria-hidden="true"></div>` with `width: 56px; flex-shrink: 0;` in CSS.

**Effort:** S (20 min — conditional render in Today.js:192, two CSS lines)

**Rationale:** Without the ring, the three-column header (`ring | center | badge`) collapses
to a visually unbalanced two-column layout. The center activity summary and Day badge float
awkwardly to the left. A zero-content placeholder div preserves layout symmetry without
showing misleading data.

**§6.5 hit:** No

**Classification:** Layout correctness — asymmetry on the empty and infeasible states.

---

## 4. What's Working Well

### A. The Color System Lands Perfectly
Green/yellow/purple with 3-stop gradients (`app.css:792–830`) is the best version of this
system since inception. The inset highlight (`inset 0 1px 0 rgba(255,255,255,0.22)`) gives
depth without skeuomorphism. Block colors are instantly recognizable as Phil's color identity.
Dark mode preserves the fills as intended. **Do not touch the block gradient system.**

### B. The Now-Line is Excellent
The breathing dot + glow trail + HH:MM timestamp label is the right level of emphasis for
the current moment. It is visually distinctive without being distracting. The `dotBreathe`
animation is subtle. The red is a strong but appropriate signal. The Geist Mono timestamp
at 10px is perfectly readable. **This is a reference-quality now-line implementation.**

### C. The Kaizen Unlinked Indicator is Exactly Right
The 3px dashed amber left-edge strip on CI-without-kaizen (`app.css:619–634`) is the correct
treatment for a constraint indicator: subtle, non-alarming, visible on close inspection,
invisible unless you're looking for it. Sprint ceremonies correctly excluded. This is
BAM-X-unique and well-executed.

### D. EoAR Sacred Treatment
The `cycle-block-sacred` glow outline (`app.css:675–678`) combined with the CSS-only
indicator dot creates a visually distinct block without relying on emoji. The "Start Reflection"
action in BlockDetailDialog is the right path — it requires intentional engagement, not an
accidental tap. The design correctly distinguishes this block from all others.

### E. Drag Confirm Banner for PROPOSED State
The two-step commit on PROPOSED compositions (drag → confirm/cancel banner, `Today.js:349–357`)
is the right architecture for protecting a user who is still reviewing a plan. The banner
is clear ("Move X to Y?") and the Confirm/Cancel buttons are adequately sized. This prevents
accidental plan modifications before acceptance.

---

## 5. Honest Verdict

**Status: In a good place, needs targeted polish — no fundamental rework.**

The Today page after Iter 48 is the best it has been. The major removals (bucket strip,
date echo, disabled Edit button, bucket label rows) were all correct. The visual system
(block gradients, now-line, typography trio) is coherent and distinctive.

Three things need addressing before this page is ship-ready:

1. The dark-mode token mismatch (lunch tooltip + BDD rationale) is a bug, not a polish item.
   It is visible the first time a user switches to dark mode.

2. The dual kaizen representation (chip + sub-label) adds noise to every linked block. This
   is a quick cleanup that improves the density of the page's most important interactive elements.

3. The NowJumpButton directional arrow is a minor but pointed (pun intended) correctness issue
   that takes five minutes to fix.

The remaining improvements (keyboard path, resize hit area, empty-state header, PROPOSED banner
removal) are quality-of-life items that can be batched into a single polish sprint.

No component needs a design rethink. No interaction model needs reversal. The cumulative
iterations have produced a coherent system — now it needs tightening, not restructuring.

---

## 6. Open Questions for Phil

**Q1 — Kaizen chip fate:**
After the kaizen sub-label was added (Iter 48), the kaizen chip (`cycle-block-kaizen-linked`)
renders below it on the same block. Is the chip intended to stay permanently as a "glow badge"
separate from the text sub-label, or should the sub-label replace it? The ping animation on
the chip was a meaningful first-load signal — but duplicating the title in both places needs
a decision.

**Q2 — PROPOSED banner longevity:**
Is the PROPOSED banner serving a user education purpose for new users only, or is it intended
to stay permanently? If education-only, a session-count gate (suppress after 3 accepted plans)
would let it disappear naturally without a code removal. Or it can simply be removed now if
the dashed blocks are considered sufficient encoding.

**Q3 — Tablet / touch interaction scope:**
Is CadencePlan intended for tablet use (iPad at desk)? This affects the priority of:
the 10px resize handle fix, touch-friendly drag handle sizing, and the keyboard-path question.
If the answer is "desktop-only for now," the resize handle fix drops from a correctness
issue to a nice-to-have.
