# UX_TODAY_SIMPLIFY_UX.md
# Today Page Simplification + No-Projects Discovery Flow
# Define-only. No code changes. §6.5 boundary applies.
# Author: UX Designer agent | Date: 2026-04-30

---

## 1. Goal

Reduce the Today page to its essential value unit — the "Today, composed" CycleCard — so that users experience one clear, purposeful view of their day with no ambient noise. The simplified layout forces every pixel to earn its place: header orientation, then the composed day, nothing else. Once the canvas is clean, populate it with a meaningful default day built from the user's actual projects (at least 4 hours project work, 2 hours high-value communication across three anchors, and a protected CI slot), or replace project-work blocks with project-DISCOVERY placeholders when the user has zero projects and route them to project-type selection.

## 2. Non-Goals

- This proposal does not redesign CycleCard internals, BucketStrip, or the composer engine.
- It does not invent new standard-work content. Every activity label, discovery step, and CI default is flagged as Phil-authority and listed in Section 8.
- It does not change the onboarding or sign-up flow, the Weekly page, or any non-Today route.
- It does not ship new features on top of the simplified page. Simplification ships first; features are additive later.
- It does not remove any drawer or modal — only persistent page-body elements are removed.

---

## 3. Component Removal Table

| Component | Decision | Justification |
|---|---|---|
| MorningRecap | REMOVE | Recap of prior day belongs in a weekly/reflection view, not the daily canvas. It distracts from the present composed day. Prior-day data remains available in state if a future feature re-introduces it in a non-primary position. |
| RhythmExplainer | REMOVE | Educational explainer served its purpose during onboarding orientation. Users who have composed a day do not need it repeated. Move to a one-time tooltip or a help affordance if re-introduction is needed. |
| NowPane | REMOVE | The CycleCard's own activity list with current-time highlighting (nowIso prop) already answers "what am I doing now." A separate pane duplicates that signal and competes for attention. |
| UpNextRail (desktop) | REMOVE | "What's next" is readable by scanning the activity list in CycleCard. A separate rail adds layout complexity and a secondary reading axis. |
| UpNextMobile (mobile) | REMOVE | Same rationale as desktop rail. Mobile users get a linear scroll through CycleCard rows, which is sufficient and lower cognitive load. |
| WhyThisPlan | REMOVE from persistent body | The composer explanation is useful for trust-building but is not primary UI. DEFER to a tap-to-expand disclosure inside CycleCard header (a small info icon next to "Today, composed.") — this preserves access without occupying persistent space. Flag for CycleCard implementation. |
| EodClosureStrip | REMOVE | End-of-day closure belongs in a dedicated EOD flow or the Weekly Reflection route. It is not a persistent element of the Today canvas. |

---

## 4. Final Today Page Anatomy (Post-Simplify)

### Persistent layout — always visible

```
+--------------------------------------------------+
|  HEADER                                          |
|  [Day badge]  [AdherenceDial]  [FineTuneButton]  |
+--------------------------------------------------+
|                                                  |
|  CYCLECARD — "Today, composed."         [i]      |
|  +--------------------------------------------+ |
|  | BucketStrip (PROJECT / COMM / CI targets)  | |
|  |--------------------------------------------|  |
|  | [Activity row 1]                           | |
|  | [Activity row 2]                           | |
|  | [Activity row 3 — CI, visually distinct]   | |
|  | ...                                        | |
|  |--------------------------------------------|  |
|  | [Accept]  [Edit]  [Reject]                 | |
|  +--------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
```

### Conditional overlays — only present when open (no change to behavior)

- FineTuneDrawer (open: true)
- EditDrawer (edit mode active)
- OutputArtifactDialog (CLOSE dialog open)
- SkipReasonModal (SKIP dialog open)

Nothing else renders in the page body. No persistent strips, rails, or explanatory panels below or beside CycleCard.

The `[i]` icon next to the CycleCard header triggers a disclosure that surfaces the WhyThisPlan content inline. It is visible only in PROPOSED / ACCEPTED / EDITED states, matching the existing `whyEligible` logic.

---

## 5. Default Day Composition (Projects Present)

When the user has at least one project, the composer produces a day structured as follows. Minimum time commitments per Phil's directive:

### Project work — minimum 4 hours (240 minutes)

Project work blocks fill the available capacity after comm and CI anchors are placed. The number of blocks and their durations come from the engine's project-scheduling logic. A single project block or multiple shorter blocks are both valid. The composer already handles this; the UX change is removing the elements that buried the result.

- ARCH DELTA FLAG: If the current composer does not guarantee a minimum 240-minute project-work floor across the day, that floor needs to be added to `DAILY_NON_OPTIONAL_SET` or the relaxation logic in `relaxConfigurable.js`. Flagged for architect review — do not assume the current 105-minute comm total + 15-minute CI total guarantees 240 minutes of project work; depends on declared capacity.

### Communication anchors — 2 hours (120 minutes), three slots

| Slot | Current default anchor | Minutes | Phil directive |
|---|---|---|---|
| Start-of-work communication | 09:15 (AM_COMM) | 60 | Matches existing default |
| Post-lunch communication | 13:00 (POST_LUNCH_COMM) | 30 | Matches existing default |
| End-of-deep-work-cycle communication | See Section 6 below | 30 | NEW — not yet in composer |

Note: The standup at 09:00 (15 min) is currently in DAILY_NON_OPTIONAL_SET as COMMUNICATION bucket but is a ceremony. Whether standup counts toward the 2-hour comm target is a Phil-authority question (see Section 8, item 1).

### CI — protected slot (see Section 7 for visual treatment)

| Slot | Current default anchor | Minutes |
|---|---|---|
| End-of-Activity Reflection | 17:00 | 15 |

CI is the only bucket that cannot be removed via the AcceptEditRejectTriad or the FineTuneDrawer without a confirmation gate. See Section 7.

---

## 6. End-of-Deep-Work-Cycle Communication Slot

Phil's directive introduces a third communication anchor: "communication at the end of deep work cycles."

### UX interpretation

This slot signals that a focused project-work block has concluded and the user surfaces to communicate before the next deep block begins. It is distinct from post-lunch comm (which is time-anchored) because it is position-anchored — it follows a project-work block rather than a clock time.

### Suggested default anchor: 15:30

Rationale: A typical day with a 09:15 AM comm block, project work from 10:15–13:00, post-lunch comm at 13:00, and a second deep block from 13:30–15:30 places a natural cycle break at 15:30. This keeps the EOD reflection at 17:00 protected and leaves a 90-minute afternoon project block after comm.

Alternative to evaluate: 11:45 (end of a single morning deep block before lunch). Phil may prefer one or both depending on whether users have one or two deep work cycles per day.

ARCH DELTA FLAG: This slot does not currently exist in `DAILY_NON_OPTIONAL_SET` in `composeDaily.js`. Adding it requires:
1. A new entry with `slotKind: 'END_OF_CYCLE_COMM'` and the chosen anchor time.
2. Verification that the scheduler does not produce a comm-comm adjacency conflict when the deep block ends earlier than the anchor.
3. Phil must confirm the anchor time and whether it is position-relative or time-anchored. See Section 8, item 2.

---

## 7. CI Sacredness — UX Treatment

CI must be visually and semantically protected. The goal is that users feel CI is non-negotiable without being punitive about it.

### Visual hierarchy proposals

**Row-level differentiation inside CycleCard**

Option A — Distinct left-border accent:
```
+--[ PROJECT ]--------------------------------------+
|  Sprint Work — User Auth Feature       10:15  2h  |
+---------------------------------------------------+
+--[ COMM ]------------------------------------------+
|  Post-lunch Communication              13:00 30m  |
+---------------------------------------------------+
|||[ CI ]|||||||||||||||||||||||||||||||||||||||||||||
|  End-of-Activity Reflection            17:00 15m  |
|||||||||||||||||||||||||||||||||||||||||||||||||||||+
```
CI row uses a full-width left-border stripe in a distinct color (not grey — must read as elevated, not disabled). Suggested: amber or a warm neutral that reads as "thoughtful pause" rather than warning.

Option B — Chip label treatment:
The existing bucket chip on the CI row uses a filled background instead of the outline style used for PROJECT and COMM. This distinguishes CI at the chip level without requiring layout changes.

Option C — Subtle quote-mark or icon prefix:
A small icon (e.g., a pause mark or leaf symbol — icon choice is Phil-authority) precedes the CI activity name only, marking it as a reflection moment.

Recommendation: Combine Option A (left-border) + Option B (filled chip). These are CSS-only changes to the ScheduledActivityBlock component when `bucket === 'CI'`. No new components needed.

### Interaction sacredness

- CI rows do not show a "Skip" affordance at the primary action level. If a skip is attempted (e.g., via long-press or an edit action), a confirmation modal fires: "CI is your improvement practice. Are you sure you want to skip reflection today?" Confirm/Cancel. This mirrors the existing SkipReasonModal pattern.
- In edit mode, CI rows cannot have their duration reduced below a Phil-defined minimum (question: see Section 8, item 3). The duration chip for CI shows the current value but disables reductions below the floor.
- CI is excluded from the FineTuneDrawer's capacity-reduction relaxation. If the composer needs to shed minutes, it sheds from PROJECT blocks first, then COMM, never CI. ARCH DELTA FLAG: verify `relaxConfigurable.js` respects this ordering.

---

## 8. No-Projects State Design

### State definition

User has zero active projects in the system. The composer has no project work to schedule. DAILY_NON_OPTIONAL_SET still fires (comm + CI), but project-work blocks are replaced with discovery placeholders.

### CycleCard appearance — no-projects state

```
+--------------------------------------------------+
|  HEADER                                          |
|  [Day badge]  [AdherenceDial]  [FineTuneButton]  |
+--------------------------------------------------+
|                                                  |
|  CYCLECARD — "Today, composed."                  |
|  +--------------------------------------------+ |
|  | BucketStrip (PROJECT bucket shown at 0%)   | |
|  |--------------------------------------------|  |
|  | [COMM]  Start-of-work Comm     09:15  60m  | |
|  |--------------------------------------------|  |
|  | [PROJECT DISCOVERY]  --Phil-authority--    | |
|  |  "What kind of work will you focus on?"    | |
|  |  > Tap to explore project types     11:15  | |
|  |--------------------------------------------|  |
|  | [COMM]  Post-lunch Comm         13:00  30m  | |
|  |--------------------------------------------|  |
|  | [PROJECT DISCOVERY]  --Phil-authority--    | |
|  |  "What kind of work will you focus on?"    | |
|  |  > Tap to explore project types     13:30  | |
|  |--------------------------------------------|  |
|  | [COMM]  End-of-cycle Comm       15:30  30m  | |
|  |--------------------------------------------|  |
|  | [PROJECT DISCOVERY]  --Phil-authority--    | |
|  |  "What kind of work will you focus on?"    | |
|  |  > Tap to explore project types     16:00  | |
|  |--------------------------------------------|  |
|  | [CI]  End-of-Activity Reflection 17:00  15m | |
|  |--------------------------------------------|  |
|  | [Explore project types]                    | |
|  +--------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
```

Three discovery placeholder rows fill the project-work slots (approx. 10:15–11:15, 13:30–14:30, 16:00–16:45 — specific durations and anchors are Phil-authority; see Section 8, item 4). Each placeholder block uses a distinct visual treatment: dashed border, muted PROJECT chip, and a single CTA label. The CTA text is Phil-authority (see Section 8, item 5).

The primary CTA at the bottom of CycleCard changes from "Accept / Edit / Reject" to a single "Explore project types" button in the PROPOSED state when no projects exist. Accept and Edit are suppressed because there is nothing to commit without projects.

Net new component required: a DiscoveryPlaceholderBlock row variant inside ScheduledActivityBlock, or a thin new component `DiscoveryPlaceholderRow` that renders in the same list position as a ScheduledActivityBlock. This must be flagged for frontend implementation.

---

## 9. Project Discovery to Project Type Flow

### Journey map

```
STEP 1 — Today page, no-projects state
[Discovery placeholder row] tapped
        |
        v
STEP 2 — Project Type Browser (new route or sheet)
+--------------------------------------------------+
|  What kind of work drives your outcomes?         |
|                                                  |
|  [Project Type A]  --Phil-authority--            |
|  [Project Type B]  --Phil-authority--            |
|  [Project Type C]  --Phil-authority--            |
|  ...                                             |
|                                                  |
|  [Back to Today]                                 |
+--------------------------------------------------+
        |
        | User selects a type
        v
STEP 3 — Lightweight Project Creation
+--------------------------------------------------+
|  Name this project                               |
|  [ Project name input              ]             |
|                                                  |
|  Estimated weekly hours?                         |
|  [2h]  [4h]  [8h]  [Custom]                      |
|                                                  |
|  [Create project]   [Back]                       |
+--------------------------------------------------+
        |
        | Create tapped
        v
STEP 4 — Return to Today, projects present
+--------------------------------------------------+
|  Today page re-composes with project work blocks |
|  replacing discovery placeholders.               |
|  PROPOSED state — "Accept / Edit / Reject"       |
|  triad appears.                                  |
+--------------------------------------------------+
```

### Step notes

Step 2 — The project type browser is a new route or bottom sheet. Content (project types, their descriptions, and icons) is entirely Phil-authority. UX shape: a vertically scrollable list of tappable cards. One selection at a time.

Step 3 — Minimal creation form. Only name and weekly-hour estimate are required to unblock composer. All other project metadata can be added later. If the user taps Back at Step 3 without saving, they return to Today in the no-projects state — no data is written.

Step 4 — The return to Today triggers a re-compose. The page re-renders with the new project's work blocks in place of discovery placeholders. The PROPOSED state triad (Accept / Edit / Reject) appears normally.

Entry from Today can also occur via the "Explore project types" CTA button at the bottom of CycleCard, not only via discovery row tap. Both routes lead to the same Step 2 screen.

ARCH DELTA FLAG: The composer must know whether a user has zero projects before it runs, so it can substitute discovery placeholder activities instead of project-work blocks. This likely requires a new flag in the composer input (e.g., `hasProjects: boolean`) or a check against the project store at compose time. Flagged for architect review.

---

## 10. CI Sacredness — Interaction Summary (consolidated)

| Trigger | Behavior |
|---|---|
| Skip tapped on CI row | SkipReasonModal fires with CI-specific copy. Confirmation required. |
| Edit mode: duration chip on CI row | Minimum floor enforced (Phil-authority: see Section 8, item 3). Cannot reduce below floor. |
| FineTune capacity reduction | Relaxation algorithm skips CI block. CI minutes are not available for shedding. |
| Auto-Plan with very low capacity | CI is preserved; project or comm blocks are reduced. Infeasible banner fires only if comm + CI already exceed declared capacity. |
| User tries to delete CI activity | Not permitted in edit mode. No delete affordance shown on CI rows. |

---

## 11. Edit-Mode Preservation

Edit mode (EditDrawer + duration chips + time editor) is unaffected by the page-body simplification. The EditDrawer is a conditional overlay and was never part of the removed element set. After simplification:

- EditDrawer renders when `editMode` prop is non-null, same as today.
- Duration chips on selected slot render inside CycleCard (ScheduledActivityBlock), same as today.
- Time editor (start-time editing from Sprint 14) renders in EditDrawer, same as today.
- The edit triad (Commit / Cancel / Undo) renders inside CycleCard in place of Accept/Edit/Reject when `editMode === true`, same as today.
- CI rows in edit mode suppress the delete affordance and enforce duration floor (see Section 10).

No regressions to edit mode are expected from the removal of MorningRecap, RhythmExplainer, NowPane, UpNextRail, WhyThisPlan, and EodClosureStrip. All six are rendered outside EditDrawer scope.

---

## 12. Accessibility

The simplified layout reduces aria landmark complexity. Post-simplify structure:

```
<main data-route="today">            ← landmark: main
  <header role="banner"> ... </header> ← day badge, AdherenceDial, FineTuneButton
  <section aria-label="Today, composed">  ← CycleCard wrapper
    <div role="list" aria-label="Today's activities">
      <div role="listitem"> ... </div>  ← each ScheduledActivityBlock
      <div role="listitem" aria-label="Continuous Improvement — [activity name]">
        ...CI row with aria-describedby pointing to CI sacredness note...
      </div>
    </div>
  </section>
  <!-- Conditional overlays only when open -->
  <div role="dialog" aria-modal="true"> ... </div>
</main>
```

Semantic state encoding from Iteration 22 (aria-current, aria-disabled, data-state attributes on activity blocks) is preserved. The removed components did not carry unique aria landmarks; their removal does not leave orphaned aria references.

CI rows add `aria-label` including the bucket name so screen readers distinguish them from PROJECT and COMM rows without relying solely on visual color.

Discovery placeholder rows (no-projects state) use `role="listitem"` with `aria-label="Project discovery — [slot time]"` and include a visually-labeled button for the project type CTA. The button is keyboard-focusable and does not rely on tap-only affordance.

---

## 13. Items Requiring Phil's Standard-Work Authority

Every item below must be answered by Phil before implementation can be finalized.

1. **Does the daily standup (cer_daily_standup, 09:00, 15m) count toward the 2-hour high-value communication target?** If yes, AM_COMM should be 45m (not 60m) to reach exactly 2 hours with post-lunch (30m) + end-of-cycle (30m) + standup (15m). If no, total comm exceeds 2 hours by 15 minutes; is that acceptable?

2. **What is the anchor time for the end-of-deep-work-cycle communication slot?** This proposal suggests 15:30 as the default. Is that correct? Is it time-anchored or position-anchored (relative to the end of a project block)? Should there be one or two end-of-cycle comm slots per day?

3. **What is the minimum floor duration for CI (End-of-Activity Reflection)?** Currently 15 minutes. Is that the enforced floor in edit mode, or can users reduce it (with confirmation)? Can it be zero?

4. **What activities fill the discovery placeholder slots when a user has zero projects?** The placeholder row needs a label, a duration, and a CTA. "Explore project types" is a proposed shape, not content. Phil must supply the actual discovery activity names, descriptions, and how many placeholder blocks appear (this proposal suggests three, filling ~3 hours, but Phil owns the count and durations).

5. **What project types appear in the Project Type Browser (Step 2 of the discovery flow)?** This is entirely Phil's standard-work inventory. The UX provides a card-list container; Phil supplies the types, descriptions, and any icons or groupings.

6. **What is the standard-work CI activity Phil wants as the default beyond "End-of-Activity Reflection"?** Are there other CI activities in Phil's inventory that should appear as daily defaults (e.g., a morning intention-setting block), or is the single 17:00 reflection the only CI default?

7. **Should the "Explore project types" CTA at the bottom of CycleCard (no-projects state) replace the entire Accept/Edit/Reject triad, or appear alongside it?** This proposal suppresses Accept and Edit when no projects exist. Phil must confirm whether Reject is also suppressed or whether users should be able to reject a discovery-only composition.

8. **What confirmation copy appears when a user attempts to skip a CI activity?** The SkipReasonModal currently uses generic copy. CI requires specific copy. Phil must supply the CI-specific skip confirmation message.

---

## 14. Open Questions (UX-unresolvable from this brief)

1. **Composer feasibility with all four comm anchors and 4-hour project floor.** A user with an 8-hour declared capacity has 480 minutes. Four comm blocks (15 + 60 + 30 + 30 = 135m) + CI (15m) = 150m, leaving 330m (5.5h) for project work. This exceeds the 4-hour floor comfortably for 8-hour users. But users with shorter declared capacity (e.g., 5 hours = 300m) may find comm + CI (150m) leaves only 150m for projects — below the 4-hour floor. How should the composer behave in this case? Does it reduce comm, or flag infeasible?

2. **WhyThisPlan disclosure icon — where exactly in CycleCard?** The proposal defers WhyThisPlan to an `[i]` icon in the CycleCard header. This requires a targeted change to CycleCard rendering logic. The frontend engineer needs a precise placement spec. This UX spec describes the behavior (tap to expand inline) but the visual slot within the CycleCard header needs confirmation once the simplified layout is visible in the browser.

3. **Does AdherenceDial in the header require project data to render meaningfully?** In the no-projects state, adherence percentage is undefined. Should the AdherenceDial be hidden, show a neutral state, or show a first-day prompt? Depends on AdherenceDial's null-data behavior, which was not reviewed for this brief.

4. **Is the Project Type Browser a new route (URL-addressable) or a bottom sheet over Today?** This affects navigation stack, back-button behavior, and whether the browser URL changes. A route is more accessible and linkable; a sheet is faster but harder to deep-link. Architecture decision needed before frontend implementation.

5. **Re-compose timing after project creation (Step 4).** When the user creates their first project and returns to Today, does the compose run automatically and synchronously (blocking return) or does Today re-render first and then show a loading state while compose runs? The current AutoPlanButton is an explicit user action; automatic re-compose on project creation is a new behavior that needs event-system design.

---

## Appendix: Removed Element Inventory

For engineering reference — elements to stop rendering in `Today.js` return string (line 294–323):

| Variable | Component | Line in Today.js render | Disposition |
|---|---|---|---|
| `morningRecapHtml` | MorningRecap | 296 | Remove from render output |
| `rhythmExplainerHtml` | RhythmExplainer | 297 | Remove from render output |
| `nowPaneHtml` | NowPane | 298 | Remove from render output |
| `upNextMobileHtml` | UpNextMobile | 299 | Remove from render output |
| `whyThisPlanHtml` | WhyThisPlan | 302 | Move to inline disclosure in CycleCard |
| `eodClosureHtml` | EodClosureStrip | 316 | Remove from render output |
| `upNextRailHtml` | UpNextRail | 318 | Remove from render output |

Imports for removed components in Today.js (lines 25–31) should also be removed to avoid dead code. This is an implementation note for the frontend engineer — not a design decision.

CycleCard, header, all four conditional overlays (FineTuneDrawer, EditDrawer, OutputArtifactDialog, SkipReasonModal) remain unchanged.
