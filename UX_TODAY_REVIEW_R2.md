# UX_TODAY_REVIEW_R2.md
## Critical UX Review — Today Page (Current State as of 2026-04-30)

---

## 1. CURRENT STATE INVENTORY

### Page composition (Happy Path — ACCEPTED composition with activities)

```
┌─────────────────────────────────────────────────────────────────────┐
│ today-header                                                         │
│  [CadencePressureRing 56px SVG donut] [Day N badge pill]            │
├─────────────────────────────────────────────────────────────────────┤
│ today-body-with-strip                                                │
│ ┌──────────────────────────────────────┐  ┌────────────────────┐   │
│ │ CycleCard (.cycle-card)              │  │ cycle-bucket-strip │   │
│ │  cycle-header                        │  │ "Today's Load"     │   │
│ │   <h1> Thursday, 30 April 2026</h1>  │  │  Deep Work  4h     │   │
│ │   <span> aria-live now-summary </span│  │  ▓▓▓▓▓▓▓▓░░        │   │
│ │   [MorningRecap disclosure? hidden]  │  │  Comms     2h      │   │
│ │   [WhyThisPlan disclosure? hidden]   │  │  ▓▓▓▓░░░░░░        │   │
│ │  ──────────────────────────────────  │  │  CI        1h 30m  │   │
│ │  TodayGrid (.cycle-calendar-grid)    │  │  ▓▓▓░░░░░░░        │   │
│ │  ┌──────┬───────────────────────────┐│  └────────────────────┘   │
│ │  │ 07   │ [block: standup 09-09:30] ││                           │
│ │  │ 08   │ [block: deep-work 08-10]  ││                           │
│ │  │ 09   │ ── now-line ──────────── ││                           │
│ │  │ 10   │                           ││                           │
│ │  │ 11   │ [block: meeting 11-12]    ││                           │
│ │  │ 12   │ [block: lunch 12-12:30]   ││                           │
│ │  │ 13   │                           ││                           │
│ │  │ ...  │                           ││                           │
│ │  │ 19   │                           ││                           │
│ │  └──────┴───────────────────────────┘│                           │
│ │  [triad: Accept / Edit / Reject]  ← PROPOSED only                │
│ │  [EOD footer: Day complete N/N] ← eodRecap only                  │
│ └──────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Overlay / modal layers (conditional)
- **BlockDetailDialog** — on block click: name, bucket, time, duration, expected output, Edit button
- **CatalogPickerDialog** — on empty-time click: search + bucket filter pills + card list
- **DragConfirmBanner** — after drag on PROPOSED: inline banner "Move X to HH:MM? Confirm / Cancel"
- **ConflictBanner** — after drag with overlap: inline banner with Revert / Keep
- **EditDrawer** — side panel when edit mode active

### Header detail
- `CadencePressureRing`: 56px SVG donut; three arcs (green PROJECT / yellow COMM / purple CI); center shows total hours; hover tooltip shows per-bucket breakdown + balanced/unbalanced verdict
- `today-day-badge`: black pill "Day 12" (Geist Mono, uppercase, letter-spaced)
- No date in header — date lives inside CycleCard h1

### TodayGrid detail
- Hour rail: 48px wide, `--surface-2` bg, Geist Mono 11px, --ink-400 color, current hour highlighted red
- Now-line: 2px red bar with glow box-shadow, breathing dot left edge, HH:MM pill label
- Hour lines: 1px hairlines at each hour boundary
- Blocks: absolutely positioned, 3-stop gradient fills (bucket color), white text, 5px border-radius, staggered reveal animation, hover-lift transform, resize handle at bottom
- PROPOSED state: dashed border outline on blocks
- Empty-time overlay: full-height transparent layer behind blocks, click fires CLICK_EMPTY_TIME

### File sources
- Page composition: `js/ui/pages/Today.js` lines 166–318
- CycleCard header: `js/ui/components/CycleCard.js` lines 289–346 (PROPOSED), 354–403 (ACCEPTED)
- TodayGrid: `js/ui/components/TodayGrid.js` lines 279–386
- CadencePressureRing: `js/ui/components/CadencePressureRing.js` lines 165–241
- BlockDetailDialog: `js/ui/components/BlockDetailDialog.js` lines 38–145
- CatalogPickerDialog: `js/ui/components/CatalogPickerDialog.js` lines 193–247
- Primary CSS: `app.css` lines 284–413 (grid/blocks), 575–646 (now-line), 3302–3480 (date/banner/strip)

---

## 2. CRITICAL ASSESSMENT

### Information density: MARGINAL OVERLOAD
The visible page is lean at a glance — calendar grid dominates, which is correct. The problems are structural rather than volume:
- **Double status encoding**: composition state appears as (a) PROPOSED sub-text under h1 (`cycle-date-sub`, app.css:3313), AND as (b) the dashed-border treatment on every block, AND as (c) a yellow banner with a "PROPOSED" pill (app.css:3323–3347), AND as (d) the Accept/Edit/Reject triad at the bottom. Four confirmations of one fact.
- **BucketStrip vs. CadencePressureRing**: both show the same three-bucket capacity data — one as a sidebar strip, one as a header donut. The donut has a hover tooltip that mirrors the strip exactly. This is direct redundancy with no information differential.
- The `cycle-now-summary` aria-live span (CycleCard.js:299) is purely for screen-reader announcements and emits nothing visually. That's correct, but it does add a silent slot to the header area that could confuse developers into thinking it's a visible label.

### Visual hierarchy: WEAK FIRST SCAN
Primary scan question: "What am I doing right now and what's next?"
- The eye lands on the **date heading** (28px Instrument Serif, app.css:3302) because it is the largest text on the page. The date is not the most important thing at 10am on a workday.
- The **now-line** is the correct hero for "what time is it and what am I in" but it's buried inside the grid at whatever vertical position matches the current time. On a 720px viewport the grid may be 12 hours tall and now-line could be anywhere.
- The **CadencePressureRing** is top-left (Today.js:167–169) — a 56px donut of ambient data — but it sits alone next to "Day N" in a sparse header. This header conveys low urgency information first, before the user sees their plan.
- The **triad** (Accept / Edit / Reject) is at the bottom of the CycleCard for PROPOSED compositions. On a long day (7am–7pm = 12 hours × 60px = 720px grid), this primary action is invisible without scrolling. A user must scroll past the entire day to accept a plan.
- The right-margin **BucketStrip** (164px wide, app.css:3362) is styled as a quiet sidebar. On mobile it collapses (app.css:3460) and disappears. It never draws attention even when CI time is at 0.

### Functional clarity: SEVERAL DARK INTERACTIONS
- **Drag to move/resize**: there is no tutorial moment, no indicator that blocks are draggable, no affordance until hover (resize handle appears on hover only, app.css:668). First-time discovery depends on accidentally dragging.
- **Click empty time → Catalog picker**: the empty-time overlay (TodayGrid.js:365–374) is invisible and has no visual invitation. A new user has no reason to click empty gray space. The cursor probably does not change (CSS on `.cycle-empty-overlay` sets `pointer-events: none` on the overlay itself — the click is handled differently via the timeline wrapper).
- **PROPOSED dashed blocks**: the dashed-border treatment is explained in the PROPOSED banner ("dashed-border blocks are proposals"), but the banner is low-contrast yellow and easy to skip. If a user misses the banner, blocks feel broken or unclickable.
- **BlockDetailDialog "Edit" button**: opens an edit drawer that covers the right side of the screen. There is no hint that clicking a block on the calendar is the path to editing it. The typical expectation from calendar apps (including Google Calendar) is that clicking a block shows details, not opens an editor — which is correct here — but the button inside the dialog labeled "Edit" triggers a significantly different mode. The transition from dialog to EditDrawer is not telegraphed.
- **WhyThisPlan and MorningRecap**: both are collapsed disclosures in the card header. No visual hint they exist. Experienced users will discover them; new users will not.

### Accumulated complexity: COHERENT BUT LAYERED
The page is not incoherent — it has a clear primary region (grid), a clear sidebar (bucket strip), and a clear header (ring + day badge). However 16+ iterations have deposited features that have not been consolidated:
- `cycle-proposed-banner` + `cycle-date-sub` + dashed block outlines + triad label = four PROPOSED indicators, none eliminated when a previous one was added
- `cycle-bucket-strip` was added in Iter 33 and never reconciled with the CadencePressureRing added in Iter 42. They coexist with duplicate data
- `data-user-edited` desaturation (app.css:523–526) desaturates composer-built blocks to a flat pale color but user-edited blocks restore the full gradient. In practice, all blocks in an Auto-Plan composition have `data-user-edited="false"` until the user edits something — meaning the default view of a freshly accepted plan shows desaturated blocks, which conflicts with the visual goal of saturated color fills from Iter 31

### Brand alignment: STRONG BUT SLIPPING
The Instrument Serif date heading, Geist Mono time labels, green/yellow/purple bucket fills, and the CadencePressureRing together read as a deliberate system. The "deliberate ratification + sacred CI" brand concept is legible in the ring (ratification via arcs representing CI time allocation) and in the triad (accept / reject / edit vocabulary).

What slips:
- The drag-confirm banner (`today-drag-confirm-banner`, app.css:709) uses `--primary` which maps to `#0f172a` (a generic dark slate) not the product palette. It looks like a generic SaaS toast.
- The conflict banner (`today-conflict-banner`) uses `--warning: #f59e0b` which is fine, but "Keep (manual fix)" as button copy is engineering language, not product voice.
- `cycle-proposed-banner` text reads "Dashed-border blocks are proposals — accept to commit." The word "commit" is version-control language, not scheduling language.

### First-time comprehension: LIKELY FAILS 10-SECOND TARGET
Within 10 seconds a new user needs to understand: (1) this is my day, (2) these are my activities, (3) this is what I'm supposed to do now.

Current obstacles:
- The date heading reads before anything else but contributes no action. The user then scrolls to find the now-line.
- The CadencePressureRing in the header requires hover to understand. At 56px with no label it looks like a progress spinner.
- The PROPOSED banner explains dashed blocks but only if the user reads it. New users scroll past banners.
- There is no "current activity" callout that jumps to the eye without scrolling.

---

## 3. SPECIFIC IMPROVEMENTS (Priority Order)

### I1 — Scroll-to-now on load (auto-anchor the grid) [BAM-X unique]
**Rationale**: On a 12-hour grid at 60px/hr = 720px, the now-line is invisible above the fold for any late-morning time. The most critical piece of information — "what am I doing right now" — requires scrolling to find. Auto-scroll the grid container to center the now-line on page load and after Auto-Plan acceptance.
**Effort**: S — a single `scrollTop` call in app.js after render, reading `nowLineOffsetPx` output.
**Risk**: Low — purely additive. Fallback: do nothing if no nowIso.
**§6.5 hit**: No — no composer/domain files. js/ui/ only.
**Type**: BAM-X unique (no Google Calendar analog at this product layer).

### I2 — Elevate current/next activity to header [BAM-X unique]
**Rationale**: The `cycle-now-summary` aria-live span (CycleCard.js:299) already computes "Now: X, N minutes" and "Up next: Y, N minutes" but renders invisibly (aria-live only). Surface this text visually in the today-header, replacing or supplementing the Day N badge. The header currently carries the least time-sensitive information on the page (Day N count) while the most time-sensitive fact (current block) is buried mid-scroll.
**Effort**: S — promote existing `buildCurrentActivitySummary` output to a visible `<span>` in Today.js header region (lines 166–169), styled analogously to the futuristic preview's `.today-weekday` / `.today-date-sub` treatment.
**Risk**: Low — data already computed. Requires CSS addition only.
**§6.5 hit**: No.
**Type**: BAM-X unique.

### I3 — Consolidate PROPOSED status signals from 4 to 2 [BAM-X unique]
**Rationale**: PROPOSED is currently communicated via: (a) `cycle-date-sub` "PROPOSED" text, (b) dashed outlines on all blocks, (c) `cycle-proposed-banner` with prose explanation, (d) the triad at bottom. Remove (a) the `cycle-date-sub` — it duplicates the banner without adding meaning. Condense (c) the banner to one sentence maximum. The dashed blocks and the triad are sufficient signal; prose repeating them adds noise.
**Effort**: S — remove `cycle-date-sub` render branch (CycleCard.js:311) and shorten the banner copy (CycleCard.js:316–319).
**Risk**: Low.
**§6.5 hit**: No.
**Type**: BAM-X unique.

### I4 — Sticky triad for PROPOSED compositions [BAM-X unique]
**Rationale**: The Accept / Edit / Reject triad is rendered at the bottom of the CycleCard. On a long plan this requires scrolling. The ratification act is the primary emotional beat of the product (deliberate acceptance). It should be visible when the user first sees the plan. Make the triad position: sticky at the bottom of the viewport when the CycleCard is in PROPOSED state.
**Effort**: M — CSS sticky positioning on `.triad` inside `.cycle-card.cycle-proposed`. May require a CSS containment adjustment to avoid overflow:hidden on the card clipping sticky. The card itself uses `border-radius` + `overflow: hidden` which kills sticky children — so the triad needs to move outside the overflow:hidden boundary (a wrapper element outside the card, or change card overflow).
**Risk**: Medium — layout edge cases on short viewports, mobile. Needs QA on viewport heights below 600px.
**§6.5 hit**: No.
**Type**: BAM-X unique.

### I5 — Unify CadencePressureRing and BucketStrip (remove the strip) [BAM-X unique]
**Rationale**: `cycle-bucket-strip` (Today.js:376–382, right margin) and `CadencePressureRing` (Today.js:159–164, header) show the same three-bucket data in two different formats. The ring shows proportion; the strip shows absolute minutes against target. The ring tooltip already shows "Day is balanced / unbalanced" and per-bucket minutes. The strip adds nothing the ring's tooltip does not cover. Remove the strip; enrich the ring tooltip to show target vs actual in the same row (already partially there in CadencePressureRing.js:207–230). This reclaims 164px of right-margin width for the calendar grid.
**Effort**: M — delete `renderBucketStrip` (Today.js:331–382) and the `bucketStripHtml` logic (Today.js:264–306). CSS cleanup of `.cycle-bucket-strip`, `.cycle-bucket-row` blocks (app.css:3362–3443). Update ring tooltip to add actual vs target rows.
**Risk**: Low — the strip is not connected to any action or state change.
**§6.5 hit**: No.
**Type**: BAM-X unique.

### I6 — Fix data-user-edited desaturation paradox [BAM-X unique]
**Rationale**: `app.css:523–526` desaturates all blocks with `data-user-edited="false"` to a flat pale wash, overriding the bucket-color gradient. A freshly Auto-Planned day has every block marked `userEdited: false` — meaning the very first view of an accepted plan shows desaturated blocks. The vibrant green/yellow/purple fills (Iter 31 + Iter 40's key visual identity) only appear after the user manually edits an activity. This inverts the intended experience: the default state should be the vibrant one; the desaturation rule should either be removed or inverted (apply desaturation after user edits as a "this was changed" indicator, not the inverse).
**Effort**: S — remove or invert the `[data-user-edited="false"]` rule at app.css:523–526. Verify there is no downstream logic that depends on the pale style for user communication.
**Risk**: Low-Medium — need to confirm whether the desaturation was intentional for a specific sprint's "proposed vs accepted" distinction that may have since been superseded by dashed outlines.
**§6.5 hit**: No.
**Type**: BAM-X unique.

### I7 — Drag discoverability: passive affordance on blocks [Hybrid: GCal-informed]
**Rationale**: Google Calendar shows a move cursor on hover and a resize cursor on the bottom edge before the user initiates a drag. The current implementation shows the resize handle only on `:hover` as a thin accent line (app.css:668–677). There is no explicit move cursor on the block body. Add `cursor: grab` to `.cycle-block-positioned` (app.css:363) for non-protected blocks, and surface the resize handle at all times (not just hover) as a 4px pill at the bottom edge with slight contrast. This is a Google Calendar UX convention that reduces discovery time for the drag interaction.
**Effort**: S — CSS-only. Change `cursor: pointer` (app.css:363) to `cursor: grab` for draggable blocks; make the resize handle always-visible at 2px opacity, expanding on hover.
**Risk**: Low.
**§6.5 hit**: No.
**Type**: Hybrid (Google Calendar affordance applied to BAM-X blocks).

### I8 — Half-hour grid lines [Google Calendar familiarization]
**Rationale**: Google Calendar renders both hour lines and lighter half-hour lines. The current `renderHourLines` (TodayGrid.js:252–259) renders only at whole-hour boundaries. Half-hour lines significantly improve time-estimation accuracy when reading the grid — users can quickly see "this block ends around 10:30" vs. guessing between 10 and 11. This is a well-established calendar convention that reduces cognitive load with no semantic change to the product.
**Effort**: S — extend `renderHourLines` (TodayGrid.js:252–259) to also render half-hour dividers at 0.5 opacity relative to the hour lines. Single loop change.
**Risk**: Low.
**§6.5 hit**: No.
**Type**: Google Calendar familiarization.

### I9 — Past-hours visual dimming [Google Calendar familiarization]
**Rationale**: Google Calendar dims completed time. The futuristic preview (`today-futuristic-preview.html:732`) includes `.cycle-hour.hour-past { opacity: 0.45; }` but this class is not applied in the production `renderTodayHourRail` function (TodayGrid.js:230–241). The hour rail in production has no past/future differentiation — the current hour highlighting exists (TodayGrid.js:234–235) but past hours look identical to future hours. Applying `cycle-hour-past` opacity to past hour labels (not blocks) would give the grid a clear "this is done / this is coming" reading.
**Effort**: S — in `renderTodayHourRail` (TodayGrid.js:230–241), add a `isPast` check when `nowMinutesOfDay` is available, emit the `cycle-hour-past` class (already defined in the futuristic preview CSS, needs adding to app.css).
**Risk**: Low.
**§6.5 hit**: No.
**Type**: Google Calendar familiarization.

### I10 — Replace "Keep (manual fix)" copy [Brand alignment]
**Rationale**: The conflict banner button "Keep (manual fix)" (Today.js:478) reads as engineering language. It will appear to any user who drags a block into a conflict. Rewrite to "Keep as-is" — same intent, product voice.
**Effort**: S (copy change only).
**Risk**: Low.
**§6.5 hit**: No.
**Type**: BAM-X unique.

---

## 4. GOOGLE CALENDAR COMPARISON

### What Google Calendar does well that applies here

**Hour rail typography**: GCal uses 10–11px system sans-serif, right-aligned, sits at the top of each hour slot, with reduced opacity for the rail vs. the event area. The production implementation (app.css:301–335) is already close — Geist Mono 11px, --ink-400 color, right-aligned. The one gap is the current-hour label is red and bold (strong signal) but the past/future hours are uniform. GCal distinguishes past with reduced opacity on the label; production does not.

**Event blocks**: GCal shows title + time within blocks, adjusts font size for short blocks, and clips gracefully. Production does the same (TodayGrid.js:146–149: time-range vs. start-only depending on block height). GCal shows a colored left border on blocks rather than full fills. Production's full gradient fills are a deliberate BAM-X divergence (Iter 31) — do not adopt GCal's left-border approach.

**Drag affordance**: GCal shows `cursor: move` on the block body and a resize cursor (↕) on the bottom 10px of the block. Production shows `cursor: pointer` on blocks and a resize handle only on hover. The GCal pattern is lower friction and can be adopted (see I7 above).

**Half-hour grid lines**: GCal renders both solid hour lines and lighter half-hour lines. Production renders only hour lines. Adopt half-hour lines (see I8).

**Today navigation**: GCal has a "Today" button in the header to jump to the current date. Production's page is always today — this is irrelevant here.

**Mini-calendar sidebar**: GCal shows a mini calendar in the sidebar for date navigation. Not applicable — BAM-X Today is a single-day view by product design.

**Event creation on click**: GCal opens a quick-create popover on click of empty time. Production opens the CatalogPickerDialog — same pattern, already implemented (Iter 36). The difference is GCal shows a "+" tooltip on hover over empty space. Production has no hover hint for empty time. This is worth adding (a "+" icon or time label on hover).

### What should NOT be copied

**GCal's flat pastel block fills**: GCal uses light-background blocks with colored text. BAM-X uses saturated gradient fills with white text (Iter 31, Iter 40). The saturated fills are a strong visual identity signal for the bucket system and should not be diluted to GCal pastels.

**GCal's week-default orientation**: GCal defaults to week view and Today is secondary. BAM-X centers Today — this is correct and should stay.

**GCal's generic "+ Create" button**: GCal's top-left button creates any event. BAM-X's Auto-Plan is intentional structured composition. The CatalogPicker (entry through empty-time click) is the correct BAM-X pattern — do not add a free-form creation button.

**GCal's multiple calendar overlays and color assignment per calendar**: not applicable to BAM-X's bucket model.

---

## 5. RECOMMENDATION

**Direction: C — Hybrid (small set of BAM-X-unique improvements + small set of GCal familiarization)**

The page is architecturally sound and visually coherent. It does not need a redesign. It needs targeted removals and two discoverability fixes.

**Top 3 from section 3:**

1. **I6 — Fix data-user-edited desaturation paradox** (S effort, low risk): The vibrant fills are the product's primary visual identity. They are currently invisible in the default freshly-planned state. This is the highest-ROI fix on the page — one CSS rule removal that makes the intended design visible.

2. **I2 — Elevate current/next activity to header** (S effort, low risk): The "Now: X" computation already exists (CycleCard.js:111–156). Surfacing it visually in the today-header eliminates the need to scroll to find the now-line. This directly addresses the 10-second comprehension failure.

3. **I5 — Remove BucketStrip, enrich Ring tooltip** (M effort, low risk): Eliminating the redundant sidebar reclaims horizontal space for the grid and reduces the "stitched together" feeling. The Ring already communicates the same information on hover.

**Two GCal familiarization adjustments (bonus, low cost):**

- **I8 — Half-hour grid lines** (S): Standard calendar legibility improvement.
- **I9 — Past-hour dimming** (S): Already coded in the futuristic preview; just needs porting to production `renderTodayHourRail`.

---

## 6. OPEN QUESTIONS FOR PHIL

1. **data-user-edited desaturation (I6)**: Was the pale desaturation for `userEdited: false` blocks a deliberate decision to distinguish composer-built vs. user-edited blocks, or is it a leftover from an earlier iteration? If deliberate, what was the intended reading? If leftover, it should be removed immediately.

2. **Triad position for PROPOSED (I4)**: The ratification triad being below the fold on a full day's plan is a real discoverability problem. Are you comfortable with the triad becoming sticky (always visible at the bottom of the viewport) when a plan is in PROPOSED state? This changes the layout model for one state.

3. **CadencePressureRing comprehension**: The 56px donut in the header is a signature element but has no label — it only reveals itself on hover. Is it acceptable to add a static 2-word label beneath it ("Day load" or "Balance") to help new users understand it is interactive and meaningful without a hover? Or is the wordless ring intentional?

4. **Auto-scroll to now-line (I1)**: Preferred behavior when `nowIso` is before `gridStartHour` (e.g., user checks app at 6am before the 7am grid starts) — scroll to grid top, or show a "day hasn't started" indicator?
