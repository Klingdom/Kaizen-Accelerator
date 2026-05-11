# UX Today — Calendar Daily View: Competitive Research
**Date:** 2026-05-07
**Prepared for:** BAM-X Today redesign — converting table-style schedule to calendar-style daily view
**Scope:** Day/Today view ONLY (not month, year, or agenda list)

---

## 1. Per-Product Daily-View Feature Matrix

| Feature | Google Calendar | Apple Calendar | Outlook Web | Cal.com | Calendly | Motion | Reclaim.ai | Sunsama | Akiflow | Fantastical | Notion Calendar |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hour rail position | Left gutter | Left gutter | Left gutter | Left gutter | N/A | Left gutter | Left gutter | Left gutter | Left gutter | Left gutter | Left gutter, monospaced |
| Drag-move snap | 15 min | 15 min | 5–60 (default 30) | N/A | N/A | 15 min | 15 min | 15 min | 15 min | 15 min | 15 min |
| Drag-move commit | Immediate on drop | Immediate | Immediate | N/A | N/A | Immediate (+ AI re-plan) | Immediate (auto-lock) | Immediate | Immediate | Immediate | Immediate |
| Drag-resize edge | Bottom | Bottom | Bottom | N/A | N/A | Bottom | Top + Bottom | Bottom | Bottom | Bottom | Bottom |
| Click-empty-time | Popover with type tabs | Double-click → sheet | Quick-add popover | N/A | N/A | Modal | Defers to Google Cal | Schedule modal | Quick-schedule popover | NLP bar (Cmd+N) | NLP popover |
| Click-block | Anchored popover | Popover | Popover + RSVP | N/A | Booking detail | Right-side panel | Right-side pane | Right panel | Detail overlay | Popover (Cmd+E full) | Popover |
| Now indicator | Red line + dot | Red line | Blue line + dot | N/A | N/A | Red line + pulse | Red line | Red line | Red line | Red line | Red line |
| All-day events | Top strip | Top strip | Top strip | N/A | N/A | Top strip | Top strip + grey overlay | Top strip | Top strip | Top strip | Top strip |
| Work-hours shading | Subtle gray outside | Subtle gray | Cream inside/gray outside | N/A | N/A | Gray dimming | Inherits Google | None | None | Configurable | None |
| Conflict rendering | Side-by-side 1/n | Side-by-side | Side-by-side slight overlap | N/A | N/A | Side-by-side | Side-by-side | Side-by-side | Side-by-side | Side-by-side | Side-by-side |
| Color coding | By calendar | By calendar | Calendar + categories | Availability type | Event type | Project + saturation | Auto category | Source (Slack/etc.) | Project/tag | Calendar + status | Eight palette colors |

---

## 2. Cross-Cutting Patterns (Universal in Best-in-Class — 9/11 products)

**Left-gutter hour rail** — 48–60px width, hourly labels, muted type. Universal.

**Immediate drag-commit on drop** — zero products use pend-until-Save. PATCH fires on `mouseup`. Ghost block during drag, time tooltip, then commit. Undo via Cmd+Z is the universal safety net.

**15-minute snap granularity** — universal default. Outlook configurable, but no consumer calendar exposes <15min by default.

**Bottom-edge resize handle** — universal. Top-edge resize rare; Reclaim is the standout supporting both.

**Click-empty-time → lightweight popover or NLP quick-add** — never a full-page modal. Drag-on-empty pre-fills duration.

**Click-block → anchored popover (not modal)** — keeps day-grid context visible. Modal on first click is a 2025 anti-pattern.

**Red now-indicator line** — universal. Most-adopted day-view affordance.

**All-day events in pinned top strip** — separate zone above hour grid, often collapsible.

**Side-by-side overlap (width = 1/n)** — universal. Hiding conflicts not used by any product.

**Color by calendar first** — every multi-calendar product. Event-level override secondary. Task-overlay products add a second dimension (project, category).

---

## 3. Drag Commit Semantics — Survey

**ALL 9 editable day-grid products commit immediately on drop.** Zero exceptions. Cal.com + Calendly are booking tools (not editable grids), so out of scope. Industry pattern: ghost block + time tooltip during drag, then commit on release, undo via Cmd+Z.

---

## 4. Click-Empty-Time — Survey

| Product | UI pattern |
|---|---|
| Google Calendar | Lightweight popover with type tabs |
| Apple Calendar | Double-click → inline title field |
| Outlook | Quick-add popover |
| Motion | Modal |
| Reclaim | Defers to Google Calendar |
| Sunsama | Schedule modal |
| Akiflow | Quick-schedule popover |
| Fantastical | NLP parser bar (Cmd+N) |
| Notion Calendar | NLP quick-add inline |

**Universal pattern:** lightweight, non-blocking popover or inline quick-add — never full-screen modal. Drag-on-empty-time to draw a duration range is supported by Google, Apple, Notion Cal, Fantastical.

---

## 5. Click-Block — Survey

**Dominant pattern: anchored popover** with summary + 2–4 quick actions; secondary interaction to open full editor.

**Side panel alternative** chosen by AI-scheduling tools (Motion, Reclaim, Sunsama) where task context warrants more vertical space.

**Full-screen modal on first click is a 2025 anti-pattern.**

---

## 6. Snap-to-Grid Intervals

**15 minutes is the industry standard.** Outlook is the configurable outlier. No major consumer calendar exposes <15min by default. **Recommendation for BAM-X: 15-min snap, no UI to change it.**

---

## 7. Visual Differentiation Beyond Color

| Technique | Example | Notes |
|---|---|---|
| Left accent bar | Fantastical, Notion Cal | Communicates category when colors muted |
| Dashed outline | Reclaim | "Free/flexible" vs solid = busy |
| Opacity/saturation | Motion | AI-scheduled lighter; fixed meetings saturated |
| Availability dot | Fantastical | Filled/open circle, strikethrough |
| Category icon | Outlook, Sunsama | Small icon (video, person, tag) inside block |
| Duration chip | Sunsama, Akiflow | Inside-block chip showing estimate |
| Lock icon | Reclaim | Pinned-against-AI-reschedule |

---

## 8. Top 5 Patterns BAM-X Should Adopt

### Rank 1 — Red now-indicator line
**Source:** Universal. **Fit:** Neutral (orientation only). **Risk:** None. **Safest, highest-impact visual upgrade from table view.**

### Rank 2 — Drag-to-move (15-min snap) with immediate commit + undo
**Source:** Google, Fantastical, Notion Cal. **Fit:** Tension at plan level resolved by scope (see §11). **Risk:** Low; Cmd+Z mitigates accidents. **Do NOT require Save button after drag — users will find it patronizing.**

### Rank 3 — Anchored popover on click-block
**Source:** Google, Fantastical, Notion Cal. **Fit:** Positive (preserves plan-in-context). **Risk:** Low.

### Rank 4 — Dashed outline for PROPOSED/pending blocks
**Source:** Reclaim. **Fit:** Excellent — visually encodes PROPOSED vs RATIFIED state distinction. **Risk:** Low. Direct support for BAM-X's deliberate-ratification model.

### Rank 5 — Click-empty-time → lightweight quick-schedule popover
**Source:** Google, Notion Cal, Akiflow. **Fit:** Positive with nuance — popover should not auto-commit; should route through "propose to composer" for ad-hoc additions. **Risk:** Medium (default-type-selector decision).

---

## 9. Top 3 Anti-Patterns BAM-X Should Reject

**1. Full-screen modal on click-block** — destroys plan-in-context view.

**2. Autonomous AI re-plan triggered by drag (Motion-style)** — user drags one block, AI silently reschedules everything else. Exact inverse of deliberate ratification. **In BAM-X, drag-to-move must move ONLY the dragged block.**

**3. Color-only differentiation of block types** — BAM-X carries richer metadata (bucket, CI class, ratification state, evidence link). Need hierarchy: color + border style + chip + opacity.

---

## 10. What BAM-X Already Does That Exceeds Calendar Competitors

- **Deliberate ratification** — no competitor requires explicit user sign-off before plan becomes active. Motion/Reclaim commit AI plans immediately.
- **Evidence-linked plan rationale** — BAM-X stores "why" (CI signal, bucket classification, composer reasoning). Standard calendars store only "what."
- **Bucket-cognition-type chip** — Maker/Manager/Admin/Recovery as cognitive-demand category. No calendar invented this.
- **Immutable plan record** — ratified plan preserved even on deviation. Google overwrites; Motion overwrites continuously.
- **Composer-as-proposer workflow** — AI never acts autonomously. Inverse of Motion (AI decides, user overrides).

---

## 11. The "Deliberate Ratification" Tension — Honest Assessment

**The tension is real but resolvable by scope.**

**Deliberate ratification applies at the PLAN level** — the daily plan composed by AI requires explicit user ratification before becoming active. Sacred principle.

**Intra-day micro-adjustments after ratification are different.** Dragging a block 30 min because a meeting ran over is:
- User-initiated (not AI-initiated)
- Local (one block)
- Low-stakes (original ratified plan immutable)

**Requiring a Save button after every drag is friction with zero evidence-integrity benefit.** The ratified plan is already stored. The drag is a deviation event — capture it as such, commit immediately, log it.

### Recommended scoped model
1. **PROPOSED blocks** — dashed outline; require explicit ratification (Accept triad). No drag until ratified.
2. **Ratified blocks** — drag commits immediately on drop. Original ratified plan preserved in evidence record; deviation logged with timestamp + "user-adjusted" label.
3. **Undo** (Cmd+Z) available for 30 sec after any drag commit. Industry-standard safety net.

This preserves deliberate ratification at composition level while adopting universally-expected immediate-commit UX for execution-phase adjustments. **Asking users for Save-after-drag will cause abandonment.**

---

## Sources

- https://dev.to/arghya_majumder/google-calendar-day-view-42a0
- https://support.google.com/calendar/answer/37034?hl=en
- https://flexibits.com/fantastical/help/keyboard-shortcuts
- https://blakecrosley.com/guides/design/notion-calendar
- https://help.reclaim.ai/en/articles/6206998-overview-using-planner-to-view-and-manage-your-smart-reclaim-events
- https://help.reclaim.ai/en/articles/6937489-auto-rescheduling-settings-for-tasks-and-habits
- https://help.sunsama.com/docs/timeboxing
- https://akiflow.com/features/inbox-calendar/
- https://www.usemotion.com/help/time-management/auto-scheduling
- https://calendly.com/blog/new-scheduling-page-ui
- https://support.microsoft.com/en-us/office/-change-the-time-increments-of-your-calendar-fb2a6097-cdf4-4eaf-8c63-a91c2c5865f5
- https://fullcalendar.io/docs/event-dragging-resizing
- https://www.eleken.co/blog-posts/calendar-ui
- https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop
