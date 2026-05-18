# UX_TODAY_REVIEW_R2_COMPETITIVE.md
## Google Calendar Day View — Competitive Deep-Dive for BAM-X Positioning

_Authored by competitive-researcher; persisted by coordinator (read-only Tier 1 agent)._
**Research date: 2026-05-17**

---

## 1. GCal Day View Feature Inventory

### 1.1 Hour Rail Treatment
Google Calendar renders hour labels as small, uppercase, 12-hour formatted strings: "9 AM", "12 PM", "1 PM". Format always abbreviated — never "09:00", never bare "9". Labels sit flush against left edge, right-aligned within label column, vertically positioned at the TOP of their respective hour row (not centered). Font: Google Sans (or Roboto fallback) at ~10–11px, weight regular (400), subdued mid-gray ~`#70757a` (Material Design 3 secondary-text token). Labels are intentionally recessive — they orient the eye without demanding attention. No bold variant, no color on current hour, no active-state highlight. Noon ("12 PM") gets no special typographic treatment.

### 1.2 Time Grid Lines
Hour separator: full-width horizontal rule at top of each 60-min block. Color `#dadce0` — cool light gray at very low contrast (~3:1 max) against white. Half-hour mark: shorter or lighter rule, also `#dadce0` or more transparent. **No 15-minute grid lines by default.** No special treatment for noon. Visual hierarchy: faint hour rule > even fainter half-hour > nothing for quarter-hours.

### 1.3 Event Block Style
Solid-fill rectangle with ~4px rounded corners. Fill color = calendar's assigned color at moderate-to-full saturation (Material-level: Tomato, Flamingo, Tangerine, Banana, Sage, Basil, Peacock, Blueberry, Lavender, Grape, Graphite). Title: white (darker fills) or dark gray (lighter fills like Banana), Google Sans Medium ~500 weight, 12px. Start time below title, smaller + lighter. Location on third line if block tall enough. **NO left-border-only variant in web Day view.** Overflow: ellipsis. Minimal shadow at low opacity. 2025 Material 3 Expressive: slightly more saturated fills + Dynamic Color application.

### 1.4 Now Indicator
Full-width horizontal red line at current time. At LEFT end: filled red CIRCLE/dot ~10–12px diameter. **No time label on indicator itself** — dot anchors the line to hour rail. Updates in real time (~1 min polling). **No pulsing or glow animation** — static styled element that moves position. Only on today's date — absent all other days.

### 1.5 Today/Now Navigation
"Today" button: top-left header, text button or outlined chip (Material), between hamburger icon and prev/next arrows. Click jumps to current date AND scrolls grid to position Now indicator ~1/3 from top of viewport. Keyboard: `T` (if enabled). View shortcuts: `D` Day, `W` Week, `M` Month, `A` Agenda. `G` go-to-date dialog. `/` search.

### 1.6 Header Chrome
Material top-app-bar. Left: hamburger, month+year at ~22px Google Sans Regular ("April 2026"), prev/next chevron arrows. Right: view switcher, search, help, account avatar. **"Create" button in left sidebar, NOT top bar** — rounded-rectangle "+ Create" labeled in Google Sans Medium, top of sidebar above mini calendar. Click opens full event creation modal. Day view column header shows weekday+date prominently (e.g., "THU 30").

### 1.7 Sidebar / Overview
Top to bottom: (1) "+ Create" button, (2) mini calendar (month thumbnail, ~200px wide, today as filled blue circle, viewed day underlined/bolded), (3) "Other calendars" with checkbox toggles + color dots. Collapsible via hamburger. No search field in sidebar. Right-side panel (Tasks, Keep, Contacts) separately accessible, collapsed by default.

### 1.8 Event Interaction
- **Click event**: Popover/tooltip-style card anchored to event block. Title, time, calendar, location, description snippet, edit/delete/open buttons. Floats over grid; closes on outside click or Escape.
- **Drag-to-move**: Snaps to 15-min increments. Ghost preview follows cursor. Drop commits immediately optimistically.
- **Click empty slot**: Small quick-add popover, pre-filled with clicked time. Tabs: Event / Focus time / Task / Appointment / OOO. Submit creates minimal event; "More options" opens full form.
- **Resize**: Bottom-edge drag handle on hover. Resize snaps to 15-min.

### 1.9 Empty State
Day with no events renders full 24-hour time grid exactly as if events were present — no illustration, no message, no hint, no CTA. Now indicator still appears. **No "Create your first event" prompt in time grid.** Deliberate design: calendar as blank canvas, not opinionated system. "+ Create" in sidebar is always-visible passive CTA.

### 1.10 Design Philosophy
**Zero learning cost at scale.** Chrome deliberately suppressed — grid, labels, rules tuned to be perceptible without readable at-a-glance. Eye jumps to event blocks (only saturated, solid elements) immediately. Interaction model NEVER surfaces system opinions. Color belongs entirely to USER's organizational taxonomy. Result: interface feels like infrastructure — disappears, leaving only the user's data.

---

## 2. Top 5 GCal Patterns BAM-X Could Adopt (Ranked by Fit)

### Rank 1 — Recessive hour rail (top-of-row label, ~10px, gray, regular weight)
GCal's hour labels succeed because they're orientation markers, not anchors. Adopting GCal convention — `#70757a`-equivalent gray, right-aligned to label column, top-of-row position, "9 AM" format — reduces cognitive load without sacrificing legibility. Dark mode: swap to ~`#9aa0a6` (Material dark secondary text). Cadence Ring + bucket-color blocks remain loudest visual elements. **Pure polish win with zero positioning cost.**

### Rank 2 — Red dot + full-width line for Now indicator
GCal established this; every calendar clone copied it. Industry-standard. BAM-X's Now pane / sacred CI is differentiated concept; the time-grid now indicator itself should NOT look custom or idiosyncratic — familiarity here REDUCES friction. Specific: 2px horizontal line in red + filled circle at left terminus. No label text on indicator itself. Dark mode: soften to slightly desaturated red.

### Rank 3 — 15-minute drag snap, 30-minute visual grid
GCal's precision/legibility tradeoff: show 30-min grid lines, snap to 15-min increments. For BAM-X's deliberate-ratification model (user commits time blocks consciously) — 15-min snap is appropriate. If BAM-X snaps to 30 min or coarser, this is concrete improvement. Half-hour hairline grid (`#dadce0` equiv or `rgba(255,255,255,0.06)` dark) is correct visual complement.

### Rank 4 — Click-empty-slot quick-add popover (tab-separated types)
GCal's click-to-create popover with type tabs (Event / Focus time / Task) is the right affordance pattern. BAM-X's bucket-cognition model already distinguishes activity types — these map cleanly onto tab-style popover. **Difference: BAM-X's tabs would be bucket types vs GCal's event types — meaningful differentiation rather than copy.** Familiar (GCal muscle memory) + BAM-X-native (bucket semantics).

### Rank 5 — Sidebar mini calendar as navigation artifact, not data artifact
GCal's mini calendar serves ONE purpose: date navigation. It does NOT display event density, loading states, or data. BAM-X can adopt cleanly for non-Today pane navigation context. Cadence Ring is the appropriate data artifact for today; mini calendar is purely navigation control. Keeping these roles separated prevents sidebar from becoming cognitive split-screen.

---

## 3. Top 3 GCal Anti-Patterns BAM-X Must NOT Adopt

### Anti-Pattern 1 — The no-opinion empty state (grid-as-blank-canvas)
GCal shows empty grid with no guidance because GCal does NOT have opinions about what belongs in your time. BAM-X's core value proposition is the OPPOSITE: structured model of time (buckets, cadence, sacred CI) + explicit ratification loop. An empty BAM-X day should NEVER look like an empty GCal day. **Adopting GCal's blank canvas would erase the most important signal BAM-X owns: "your time has structure, not just events."**

### Anti-Pattern 2 — Calendar-as-taxonomy (user-defined color = organizational meaning)
GCal's color system assigns colors to calendars, which users use to build their OWN organizational taxonomy. Infinitely flexible but produces NO systemic meaning — GCal's "Tomato" is "Work" for one user, "Personal" for another, "Doctor appointments" for a third. BAM-X's bucket-cognition colors are SYSTEM-defined and semantically meaningful: Deep Work block is always the same color because Deep Work is a defined type. **Adopting GCal's user-assignable palette would break BAM-X's core legibility.** Positioning cliff.

### Anti-Pattern 3 — The non-judgmental drag model (move anything anywhere, always succeeds)
GCal lets users drag any event to any time slot with ZERO friction. The system has no concept of "this conflicts with a sacred commitment" or "this violates your cadence plan." For BAM-X (scoped commit semantics, sacred CI protection explicit features), adopting GCal's frictionless drag would SILENTLY DESTROY the ratification model. If user drags Deep Work block into time slot that breaks weekly cadence, BAM-X should surface that — warning, confirmation, visual indicator. Drag should NOT feel like moving furniture in empty room. **GCal optimizes for speed; BAM-X optimizes for intentionality. Incompatible defaults.**

---

## 4. Honest Assessment — Is "Make It More Like GCal" a Positioning Trap or Reasonable Fallback?

**Position: it is a positioning trap when applied to semantics, and a reasonable fallback when applied to craft.**

GCal's visual language — recessive labels, hairline grids, red dot-line, quick-add popover — is a layer of CRAFT POLISH that exists BELOW the semantic layer. Adopting these patterns makes BAM-X legible to users who have 10+ years of GCal muscle memory. **That is a feature, not a compromise.**

The TRAP is category-level: if Phil frames "make it feel like GCal" at the product level, natural gravity pulls toward GCal's implicit VALUES — neutrality, user-defined meaning, zero system opinions. Every concession in that direction WEAKENS BAM-X's primary differentiation.

**The test for every proposed change**: "Am I copying pixels or philosophy?" Pixels = usually fine. Philosophy = never.

**Verdict**: Adopt GCal's craft conventions freely (label format, grid hierarchy, now indicator, snap interval). Reject GCal's product philosophy at every turn (blank canvas, user-taxonomy color, frictionless drag).

---

## 5. What BAM-X Already Has That GCal Lacks

| BAM-X feature | GCal equivalent | Differentiation |
|---|---|---|
| **Cadence Ring** | None | Plan-vs-actual cognitive shape; GCal has no concept of intended day shape |
| **Bucket-cognition color system** | User-assigned calendar colors | System-defined types vs personal filing labels |
| **Scoped commit semantics / deliberate ratification** | None | Explicit commit vs zero-friction events |
| **Sacred CI (committed intervals)** | None | Protected time class vs all-equivalent draggable objects |
| **Evidence-linked immutable outputs** | None | Audit trail vs scheduling tool only |
| **Week hour-grid with Now pane** | None | First-class current-moment UI concept |

---

## 6. Strategic Implications for Improvement Backlog

### Threats from analysis
- **GCal's Material 3 Expressive rollout (2025)** making baseline expectation for calendar polish higher. If BAM-X's grid lines, labels, event blocks look hand-rolled against this backdrop, perception gap widens. Polish debt compounds.
- **GCal's click-to-create pattern** now so deeply encoded in user muscle memory that significantly different creation flow generates friction users attribute to BAM-X being "hard to use" rather than "intentionally different."

### Opportunities
- **GCal's explicit no-opinion design** is a PERMANENT white space. Will never add bucket cognition, cadence modeling, or sacred CI — those would break universal positioning. BAM-X can occupy that space PERMANENTLY without threat of GCal countermove.
- **Material 3 Expressive's "heavier" visual language** being criticized for visual weight. BAM-X's darker, more purposeful palette is actually BETTER tuned for information density. Highlight contrast, not close gap.

### Monitor
- **Notion Calendar (formerly Cron)** — closer to BAM-X's "opinionated time" positioning. Worth dedicated review pass.
- **Motion AI** — directly competes on "AI structures your day" with GCal-like surface. Key question: Motion's auto-scheduling is probabilistic + non-auditable; BAM-X's is deterministic + evidence-linked.

---

## Sources

- https://dev.to/arghya_majumder/google-calendar-day-view-42a0
- https://9to5google.com/2025/08/07/google-calendar-material-3-expressive-redesign/
- https://www.androidpolice.com/google-calendar-redesign-enable/
- https://principles.design/examples/google-calendars-design-principles
- https://support.google.com/calendar/answer/37034?hl=en
- https://support.google.com/calendar/thread/113614391/google-calendar-has-a-time-grid-of-half-an-hour
- https://support.google.com/calendar/thread/333380855/my-red-current-time-line-with-round-dot-on-end
- https://www.usecarly.com/blog/google-calendar-keyboard-shortcuts/
- https://support.google.com/calendar/answer/15619910?hl=en
- https://www.androidpolice.com/android-16-material-3-expressive-on-google-calendar/
- https://support.google.com/calendar/answer/72143?hl=en
