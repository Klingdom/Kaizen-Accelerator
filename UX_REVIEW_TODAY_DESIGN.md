# Today Page — UX/Visual/Interaction Review (ux-designer lens)

---

## 1. What the page is composing

The Today page assembles seven distinct regions in a single vertical column, plus a fixed right rail. From top to bottom: a `.today-header` containing a day-badge pill, the AdherenceDial KPI cluster, and a Fine-tune trigger button; a RhythmExplainer dismissible banner (onboarding only); a NowPane "now strip" showing in-progress or upcoming state; a `.today-body` two-column flex row containing the CycleCard in a fluid left column and the UpNextRail in a 280px right column; and below the body, any open FineTuneDrawer, EditDrawer, or modal (OutputArtifactDialog / SkipReasonModal). A mobile-only UpNextRail row (`up-next-mobile`) inserts above `.today-body` at ≤600px and the rail variant hides.

The interaction surface divides into two distinct modes. In read mode (ACCEPTED/ACTIVE state), each ScheduledActivityBlock carries Start, Skip, and Close affordances; the NowPane provides a Close shortcut for the in-progress activity; the UpNextRail is purely informational. In edit mode, the CycleCard dims non-editing content, the EditDrawer slides in from the right at z-index 1200, each selectable block gains Select and Remove chrome, and the selected block surfaces duration chips and a start-time `<input type="time">`. Visual hierarchy on the page is driven by card elevation (shadow on `.cycle-card` vs flat on `.up-next-rail`), type weight (22px/600 cycle title vs 13px/muted elsewhere), and primary-tone use (day-badge filled with `--primary`; edit-selected blocks with `#2563eb` inset shadow).

---

## 2. Information Architecture Audit

| Region | Visual weight | Job | Verdict |
|---|---|---|---|
| Header: day-badge + AdherenceDial + Fine-tune | Medium — flex row, badge is `--primary` filled | Orient (what day am I on?) + measure (how am I doing?) + configure | 🟡 Day-badge competes with AdherenceDial for attention; both demand the eye simultaneously with no clear reading order |
| RhythmExplainer | High — white card with left-border accent, full width, shadow | Teach the 4-2-2 split to new users | 🟡 No persistence-aware fade or step-down; renders identically on day 1 and day 6; body copy is 57 words — too long for a strip |
| NowPane | Low-medium — border + muted background | Surface what is happening right now | 🟡 OPEN_TIME variant copy is ambiguous ("Open time until Xm" reads as time remaining, not gap to next block); no tap affordance |
| UpNextRail (desktop) | Low — no shadow, muted label, 280px | Show the next 5 scheduled blocks for orientation | 🟡 Duplicates NowPane "Up next in Xm" when state=UPCOMING; no visual differentiation between the two |
| UpNextRail (mobile) | Low — full width, hidden by default | Same job, mobile context | 🔴 Appears above CycleCard on mobile but is hidden until ≤600px with no intermediate breakpoint (900–600px gap where neither variant is optimal) |
| CycleCard | High — white card, 22px title, box-shadow, primary border on Accept | Primary canvas for the day's plan and all execution actions | ✅ Correct visual dominance; edit-mode ring (`0 0 0 2px rgba(59,130,246,0.35)`) is clear |
| EditDrawer | High — fixed z-1200 slide-over, 420px, full height | Catalog swap surface during edit mode | 🟡 Footer has four buttons in one row (Add slot, Undo, Cancel, Commit); action hierarchy is unclear at a glance |
| Modals (OutputArtifactDialog / SkipReasonModal) | High — modal, blocking | Capture output artifact or skip reason | ✅ Appropriately blocking; reviewed only structurally (QA owns a11y detail) |

---

## 3. Visual System — What's Working

- **Bucket-tone consistency.** `.chip-project` / `.chip-communication` / `.chip-ci` use `--project-bg/fg`, `--communication-bg/fg`, `--ci-bg/fg` tokens, and `.up-next-dot-*` and `.wg-block` classes all reference the same fill tokens (`--project-fill`, `--communication-fill`, `--ci-fill`). Bucket identity is visually stable across Today, Week grid, and UpNextRail.
- **Edit-mode state clarity.** `.edit-selected` (inset 3px `#2563eb` + blue tint background) vs `.edit-protected` (opacity 0.65) vs `.edit-selectable:hover` (blue 6% tint) creates a clear three-tier affordance hierarchy without new color tokens. `app.css:1567–1583`.
- **Pinned block differentiation.** `.sa-block.pinned` gets `border-color: var(--primary)` plus a 2px ring shadow (`app.css:379–383`). Distinct without being loud.
- **Duration chips are touch-safe.** `.sa-dur-chip` has `min-width: 44px; min-height: 34px` with responsive override padding at ≤600px (`app.css:1945–1990`). `aria-pressed` is set correctly per Sprint 13.
- **User-edited tone signal.** `data-user-edited="true"` on `.sa-block` and `.wg-block` enables a future CSS saturation shift. The data hook is in place even where CSS rules are minimal (`app.css:2047–2059`), so the pattern can be activated without structural change.

---

## 4. Visual System — What's Failing

- **Day-badge and AdherenceDial fight for the same gaze vector.** The badge is filled `--primary` (darkest tone on the page) and sits left in the header. The AdherenceDial KPI numbers are 22px/600 weight. Both demand first attention simultaneously. The header has no clear primary-then-secondary reading direction. `Today.js:138–144`, `app.css:107–117`, `app.css:234–238`.
- **Dual "up next" surfaces with no disambiguation.** NowPane state=UPCOMING renders "Up next in Xm: [name]". UpNextRail renders "Up next" with the same activity at the top of its list. A user in the ≤600px breakpoint sees the mobile rail above CycleCard, then a NowPane below it, then the CycleCard — three surfaces, two showing the same "up next" information. `NowPane.js:161–165`, `UpNextRail.js:174–179`, `app.css:2226,2245`.
- **Duration column (`sa-duration`) is redundant with the Sprint 16a time range.** Every block now shows `HH:MM–HH:MM` in `.sa-when` (Sprint 16a), which already encodes duration for any user who can subtract. The `.sa-duration` column still appends `"Nm"` in position 4 of the 7-column grid. This is exactly duplicated information occupying a dedicated 60px column. `ScheduledActivityBlock.js:202–204`, `app.css:426–431`.
- **`.sa-duration-label` and `.sa-dur-chip` use aliased tokens not in `:root`.** `--color-text-muted`, `--color-border`, `--color-surface-muted`, `--color-primary`, `--color-primary-contrast`, `--color-focus-ring` are hardcoded fallback values (`app.css:1929–1979`). All other `sa-*` rules use `var(--muted)`, `var(--border)`, `var(--primary)`. Sprint 13 introduced a parallel token set that doesn't match the established design system.
- **RhythmExplainer has no step-down or fade contract.** It renders at identical visual weight on day 1 and day 6 — a 57-word paragraph in a full-width card with accent-left-border. The dismiss button label is "Got it" (12px, muted border) against this full-weight card. No progressive reduction (e.g., collapsing to a single-line chip after first view). `RhythmExplainer.js:17–43`, `app.css:119–163`.
- **NowPane OPEN_TIME copy is semantically broken.** "Open time until Xm" where Xm is `minutesUntil` (the gap in minutes before the next block) reads as a countdown ("free time, Xm remaining") rather than a duration label. User will parse it as "I have X minutes of open time" which is accurate, but "until" implies an endpoint, not a duration. The endpoint is the next activity name shown next to it. `NowPane.js:170–172`.
- **Edit-mode triad is duplicated between CycleCard and EditDrawer.** The CycleCard renders `triad-edit` (Commit / Cancel / Undo) at the bottom of the card. The EditDrawer footer independently renders Commit, Cancel, and Undo again. At 420px wide with z-1200, the drawer overlays most of the card, so two sets of the same three buttons are visible simultaneously. `CycleCard.js:48–56`, `EditDrawer.js:229–239`.
- **`.today-editing` dims non-editing content to opacity 0.4 with `pointer-events: none`**, which removes the BucketStrip from view at a moment when the user most needs to see violation feedback from edit actions. `app.css:1519–1522`.

---

## 5. Interaction Audit

**Flow 1 — First-run accept (empty → composition → review → accept)**
Rating: 3/5.
Smooth: Copy path is clear (`FIRST_RUN` vs `EMPTY` distinction is correct). The `daysSinceSignupHint` strips provide time-contextual nudges.
Friction: The header renders the full AdherenceDial in `showEmpty` mode with three em-dashes and a 14px paragraph ("Building your baseline. Numbers populate after day 7.") — this takes up full header real estate before the user has accepted a single day. The RhythmExplainer then adds another full card below it. On day 0, above-the-fold is almost entirely meta-content, pushing the AutoPlanButton out of immediate view on short viewports.
Missing: No visual cue connecting the RhythmExplainer to the BucketStrip it explains; a user who dismisses the explainer has no persistent reference to the 4-2-2 numbers.

**Flow 2 — In-day execution (start activity → close with artifact → reflect)**
Rating: 4/5.
Smooth: NowPane IN_PROGRESS state with elapsed timer + Close shortcut is a strong pattern. Pinned block with primary border works well.
Friction: Skip and Start buttons sit adjacent in `.sa-actions` with no visual hierarchy between them — Skip is a destructive path but renders at the same weight as Start. `ScheduledActivityBlock.js:98–100`.
Missing: No "late to start" inline indicator on the block itself (UX_FLOWS §4.7 describes a banner, but there is no corresponding component in Today.js).

**Flow 3 — Edit mode (open drawer → swap → commit)**
Rating: 3/5.
Smooth: Drawer slide-in transition (0.25s ease) is appropriate. `.edit-selectable` hover states are clear. The subtitle updates to "Swap '[name]' with..." on selection.
Friction: CycleCard dims to 0.4 opacity, making BucketStrip violation feedback invisible during the edit action that most needs it. Dual Commit/Cancel buttons in card and drawer both require resolution of which one is canonical.
Missing: No clear affordance that the EditDrawer is dismissible via clicking outside it; the only dismiss is the "×" in the drawer header and the Cancel buttons.

**Flow 4 — Duration chip + start-time editor**
Rating: 4/5.
Smooth: Duration chips are well-sized, `aria-pressed` is correct, `sa-dur-chip-active` provides clear visual selection.
Friction: `sa-duration-label` says "duration: Nm" at the same time the `sa-when` column shows `HH:MM–HH:MM` and `.sa-duration` column shows `Nm`. Three surfaces simultaneously express the same piece of data while the user is in the mode intended to change it. The cognitive load of knowing which one to trust is unnecessary.
Missing: No confirmation that a duration change has been applied beyond the chip active state changing.

**Flow 5 — Skip with reason**
Rating: 4/5.
Smooth: SkipReasonModal is isolated and blocking, appropriate for a destructive-with-consequence action.
Friction: Skip button on the block (`sa-skip`) renders at identical styling weight to `sa-start`. There is no visual signal that Skip leads to a variance log entry. `ScheduledActivityBlock.js:99`.
Missing: No inline coaching line after skip within Today (§5.3 in UX_FLOWS describes one, but no component renders it post-skip in the current code path).

**Flow 6 — Fine-tune drawer**
Rating: 3/5.
Smooth: FineTuneButton is present in the header; drawer renders when `fineTune.open === true`.
Friction: The FineTuneButton sits in `.today-header` next to the day-badge and AdherenceDial. Its visual weight relative to the other header elements is unspecified in CSS (no `.fine-tune-btn` rule visible in the grep results) — likely inherits base button styles or renders as plain text.
Missing: No loading state or error state visible for the fine-tune operation within Today.js; only the `drawer` conditional is present.

---

## 6. Microcopy Review

**`TODAY_COPY.FIRST_RUN`:** "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day — you can always adjust before you accept."
Clarity: Good — action (Tap Auto-Plan) and outcome (balanced day) are explicit.
Tone: Slightly warm for the product voice. "balanced" is vague.
Suggestion: "Your first day is unscheduled. Tap Auto-Plan to see a proposed plan — accept or adjust before it locks in."

**`TODAY_COPY.EMPTY`:** "No day scheduled yet. Auto-Plan to see a proposal, or add activities from the Catalog."
Clarity: Good. Two paths are explicit.
Tone: Correct — factual, no congratulations.
Verdict: ✅ Keep.

**`TODAY_COPY.INFEASIBLE`:** "Composer flagged an infeasible day. Raise your daily capacity or reduce external meetings, then Auto-Plan again."
Clarity: Two remedies named. But "Composer flagged" distances the system from the user.
Suggestion: "Your schedule can't fit the required blocks at current capacity. Raise capacity or reduce meetings in Fine-tune, then Auto-Plan."

**`daysSinceSignupHint` day 0–1:** "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day."
Redundant with `TODAY_COPY.FIRST_RUN` — both appear together on the empty-state render (`Today.js:179–185`). One of these should be eliminated.

**`daysSinceSignupHint` day 2–6:** "You're 3 days in. Aim for at least 5 accepted days in your first week."
Clarity: Specific and measurable — good.
Tone: "Aim for" is slightly coaching-voice. Per UX_FLOWS §4.6, no consulting voice.
Suggestion: "3 days in. Accept a plan 5 days this week to build your baseline."

**`daysSinceSignupHint` day 7+:** "Your first Weekly Reflection is Friday. That's where improvement ideas surface."
Clarity: Correct but the apostrophe-s contraction ("That's") reads slightly casual.
Verdict: 🟡 Minor. Consider: "Your first Weekly Reflection is Friday — that is where friction signals become Kaizen candidates."

**`RHYTHM_EXPLAINER_COPY.BODY`:** 57 words in a strip banner. Exceeds practical reading tolerance for a dismissible banner (20–30 words max for onboarding strips).
Suggestion: Reduce to one sentence. "CadencePlan divides your day into Deep Work (4h), Communication (2h), and Continuous Improvement (2h) — the 4-2-2 rhythm." Link "Learn more" to documentation.

---

## 7. Specific Improvements (top 8 ranked)

**1. Collapse the duplicate "up next" signal** (M)
What changes: NowPane UPCOMING state becomes the canonical "coming up" surface. UpNextRail renders only activities after the immediately upcoming one, or renders a header that reads "After that" instead of "Up next". The NowPane and UpNextRail no longer show the same activity simultaneously.
Evidence: §4 shows both NowPane UPCOMING and UpNextRail row 1 rendering the same activity name.
Expected effect: Removes the first source of user confusion on an active day. Reduces cognitive load during execution.

**2. Fix the opacity-0.4 BucketStrip blackout in edit mode** (S)
What changes: `.today-editing` dims only the CycleCard action buttons and non-editing metadata, not the BucketStrip. BucketStrip remains at full opacity during edit so violation feedback is visible.
Evidence: `app.css:1519–1522` — `.today-editing .cycle-card:not(.cycle-editing)` sets opacity 0.4 on the entire non-editing card, which includes BucketStrip.
Expected effect: Users editing a swap can see bucket balance in real time without toggling modes.

**3. Remove the duplicate Commit/Cancel/Undo triad from CycleCard during EditDrawer sessions** (M)
What changes: When the EditDrawer is open, the CycleCard triad-edit is hidden (or not rendered). EditDrawer footer is the single source of commit/cancel. Alternatively, the CycleCard triad-edit becomes the only commit surface and the EditDrawer footer removes its own Commit/Cancel.
Evidence: `CycleCard.js:48–56` renders triad in card; `EditDrawer.js:229–239` renders same three actions in drawer footer.
Expected effect: Eliminates the question of which Commit button is authoritative.

**4. Unify the Sprint 13 token set with the existing `:root` token set** (S)
What changes: Replace `--color-text-muted`, `--color-border`, `--color-surface-muted`, `--color-primary`, `--color-primary-contrast`, `--color-focus-ring` in `.sa-duration-label` and `.sa-dur-chip` rules with `var(--muted)`, `var(--border)`, `var(--bg)`, `var(--primary)`, `var(--primary-contrast)`. No visual change if fallback values match, but future theme changes won't miss the Sprint 13 components.
Evidence: `app.css:1929–1979`.
Expected effect: Consistent theming surface; eliminates dual-token-system maintenance risk.

**5. Trim RhythmExplainer body copy to one sentence + collapse to chip after first dismiss** (M)
What changes: BODY copy reduces to ~20 words. After the user taps "Got it", the component shrinks to a single-line persistent chip ("4-2-2: Deep 4h / Comms 2h / CI 2h — what's this?") rather than vanishing entirely, so the reference is available without re-surfacing the full banner.
Evidence: `RhythmExplainer.js:19–23`. Current 57-word BODY saturates a strip component.
Expected effect: New users read the full explanation; returning users have a compact reference; no re-teaching on day 6.

**6. Establish primary reading order in `.today-header`** (S)
What changes: Day-badge moves to a secondary position (right-aligned or below the dial label). AdherenceDial becomes the left anchor of the header row. FineTuneButton remains right. Day-badge reduces to a supporting label (smaller, not filled with `--primary`).
Evidence: `app.css:107–117` — badge is filled `--primary` (darkest token); `app.css:234–238` — dial numbers are 22px/600. Both claim equal dominance.
Expected effect: Header communicates "here is your status" first, "this is which day" second. Matches the user's re-entry mental model (returning users care about performance state, not day count).

**7. Introduce visual hierarchy to Skip vs Start buttons** (S)
What changes: `.sa-skip` renders as a ghost/text-only button at smaller font-size, not a filled or bordered button matching `.sa-start`. Start is clearly primary; Skip is clearly secondary and destructive-path.
Evidence: `ScheduledActivityBlock.js:98–100` — both render in a `div.sa-actions` with no hierarchy CSS applied to `.sa-skip`.
Expected effect: Reduces accidental skip. Aligns with UX_FLOWS §4.6 voice rule that coaching is never blocking but destructive paths should be visually distinct.

**8. Fix NowPane OPEN_TIME copy** (S)
What changes: "Open time until Xm" becomes "Open for Xm" or "Xm until [activity name]". The current wording is semantically ambiguous between a countdown and a gap label.
Evidence: `NowPane.js:170–172`.
Expected effect: Users correctly understand how much unstructured time they have before the next block starts.

---

## 8. Design Themes That Should Travel

**1. Stateful card mode with single-focus chrome**
Definition: When a card enters an editing mode, non-editable content dims, and a single ring (blue, `0 0 0 2px`) signals the active edit boundary. Only one card is in edit state at a time.
Lives on Today: `app.css:1519–1527` — `.today-editing .cycle-card:not(.cycle-editing)` + `.cycle-card.cycle-editing` ring.
Generalizes to: Week (day-column edit mode), Kaizen (baseline lock step), Catalog (entry enable/disable toggle mode).

**2. Bucket-tone token consistency**
Definition: PROJECT / COMMUNICATION / CI each have a `bg`, `fg`, and `fill` token. Every chip, dot, bar, and block across the product maps to these six values, never raw hex.
Lives on Today: `.chip-project/communication/ci`, `.up-next-dot-*`, `app.css:399–410`, `app.css:2207–2209`.
Generalizes to: Week grid blocks, Kaizen phase tags, Insights variance rows, Catalog bucket group headers.

**3. Now anchor**
Definition: Any page that renders time-bound entities surfaces a "now" reference — a strip, a line, or a pinned row — so the user can locate themselves in the timeline without reading timestamps.
Lives on Today: NowPane strip + `.wg-now-line` on Week grid (`app.css:2157`).
Generalizes to: Sprint timeline, any future calendar-style view.

**4. Rail-first secondary content**
Definition: Secondary informational content (what's next, related artifacts, kaizen context) lives in a 280px right rail that collapses to a mobile strip. The primary canvas is always left-column fluid.
Lives on Today: `.today-body` flex + `.up-next-rail` 280px (`app.css:2177–2184`).
Generalizes to: Week (UpNextRail already present), Kaizen (PhaseStepper rail), Insights (variance list alongside KPI tiles).

**5. Protected vs selectable block chrome**
Definition: Within an edit surface, non-editable items signal their protection with opacity reduction and a lock icon rather than hiding. Selectable items signal affordance with hover tint and click target.
Lives on Today: `.edit-protected` (opacity 0.65 + lock emoji), `.edit-selectable` (hover blue tint), `.edit-selected` (inset left border). `app.css:1567–1588`.
Generalizes to: Week composer edit mode, Catalog entry locking (non-optional entries), Sprint planning locked anchor blocks.

**6. Append-only variance visual pattern**
Definition: Skipped or closed activities remain in the timeline at their original position with a muted/struck visual treatment, never hidden. The record is visible as part of the day's history.
Lives on Today: `.sa-block.sa-state-closed` (opacity 0.55), `.sa-block.sa-state-skipped` (red border + `#fef2f2` background). `app.css:451–455`.
Generalizes to: Week view (past days' activities), Insights variance log (append-only rows), Kaizen action completion markers.

**7. Intention-field-as-commitment gate**
Definition: Before a significant action (Start), a single-line intent field is required on non-optional items. The field is always visible (not collapsed), with a descriptive placeholder. Completion of the field gates the action.
Lives on Today: `.sa-intention` always rendered in the grid, placeholder text from `ScheduledActivityBlock.js:219–223`.
Generalizes to: Weekly Reflection wizard (each DMAIC step has a 1-sentence intent field), Kaizen goal statement before Activate.

---

## 9. Open Questions for Phil

1. **Which is the canonical edit-mode commit surface — the CycleCard triad or the EditDrawer footer?** Both render Commit/Cancel/Undo simultaneously. Default if unanswered: EditDrawer footer is canonical; CycleCard triad-edit is removed when the drawer is open.

2. **Should the UpNextRail show the currently-in-progress activity or start from the first future activity?** `selectUpNext` in `UpNextRail.js:101` excludes `IN_PROGRESS` activities, so the rail and NowPane show different reference points. Default: rail starts from the first future activity (current behavior is correct, but NowPane UPCOMING should be suppressed if the same activity appears as rail row 1).

3. **Is the RhythmExplainer intended to be a one-time onboarding moment or a persistent reference tool?** Current implementation dismisses it forever on first tap. Default if unanswered: one-time moment, but replace with a compact persistent chip referencing the 4-2-2 numbers.

4. **What is the intended reading order of the header — day number first or KPI status first?** The day-badge uses `--primary` fill (highest contrast token), which implies day count is the primary header message. Default if unanswered: KPI status is primary; day-badge moves to secondary position.

5. **Is the `sa-duration` column (standalone "Nm" figure) intentionally retained now that Sprint 16a added the `HH:MM–HH:MM` time range in `sa-when`?** The range already encodes duration. Default if unanswered: remove `sa-duration` column and reclaim the 60px grid column for intention or action space.
