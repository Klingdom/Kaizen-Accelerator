# Sprint 11 P0-T2 — Manual responsive checklist

No automated mobile testing is in scope for the MVP (no headless browser in
the test harness). These are the manual spot-checks to run via Chrome /
Firefox DevTools' device-emulation mode before shipping a release.

## Breakpoints under test

- 375px (mobile — iPhone SE class)
- 768px (tablet — iPad portrait)
- 1024px (tablet landscape / small laptop)

## Per-page checks

### `/#today` (primary)

- [ ] No horizontal scroll at 375px.
- [ ] Nav wraps; brand "CadencePlan" stays legible.
- [ ] Today header stacks (day badge above adherence dial).
- [ ] Adherence dial cells stack vertically.
- [ ] Rhythm explainer body + dismiss button stack (dismiss left-aligned).
- [ ] Bucket rows wrap their `value` onto a second line so the fill bar
      keeps reasonable width.
- [ ] ScheduledActivity blocks stack each field into a single column.
- [ ] `Start` / `Close` / `Skip` buttons are ≥ 44px tall.
- [ ] Accept / Edit / Reject triad stacks full-width with 44px-tall buttons.

### `/#portfolio`

- [ ] No horizontal scroll at 375px.
- [ ] "New Opportunity" button is full-width.
- [ ] OpportunityRow wraps cleanly without clipping.
- [ ] Project cards are full-width with reduced padding.

### `/#catalog` (list view)

- [ ] No horizontal scroll at 375px.
- [ ] Header (title + view toggle) stacks at 600px.
- [ ] List rows reflow: name takes the remaining width, toggle wraps under.
- [ ] Toggle button ≥ 36px tall.

### `/#catalog` (bucket view)

- [ ] 3-column bucket grid collapses to a single column at ≤ 900px.
- [ ] Cards reduce padding at ≤ 600px.

### `/#week`

- [ ] 5-col day grid → 2-col at 1024px → 1-col at 600px.
- [ ] "Plan this week" and "Accept" buttons span full width at 600px.

### `/#kaizen`

- [ ] KaizenCard stacks actions / metrics vertically.
- [ ] DRAFT baseline dialog and close dialog forms stretch full-width.

## Toast system (Sprint 11 P0-T3)

- [ ] Toast appears near the top-right on desktop.
- [ ] At 600px wide, toast spans (left:8px; right:8px) with a close button.
- [ ] Toast auto-dismisses after ~3s.
- [ ] Clicking the × closes the toast immediately.

## Touch-target audit

Minimum touch-target height for actionable elements at 600px: 44px.

- [ ] `.sa-start` (activity start/close)
- [ ] `.triad button` (accept/edit/reject)
- [ ] `.auto-plan-btn` (empty-state CTA)
- [ ] `.wk-propose`, `.wk-accept-all`, `.wk-accept-day`
- [ ] `.oif-submit`, `.oif-cancel` (opportunity intake)

## Known acceptable regressions at 600px

- `.cat-list-toggle` is 36px (not 44px) to fit inline with the row; the
  whole row is clickable for the description drawer so the 44px rule only
  applies to primary CTAs.
