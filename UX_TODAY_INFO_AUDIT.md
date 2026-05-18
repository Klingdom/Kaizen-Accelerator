# UX Today Page — Information Density & Hierarchy Audit

**Version:** Post-Iter 43 deploy
**Trigger:** Phil's signal — "Still not thrilled about the information on the today page."
**Scope:** Normal state (composition exists, ACCEPTED/ACTIVE). Infeasible and empty states excluded.
**Files inspected:**
- `js/ui/pages/Today.js` (lines 141–408, 421–472)
- `js/ui/components/CycleCard.js` (lines 289–404)
- `js/ui/components/CadencePressureRing.js` (lines 165–241)
- `app.css` (lines 143–196, 3462–3580, 3816–3905, 4002–4034)

---

## 1. What Is On the Page Now

### 1a. Page-Level Header (`<header class="today-header">`)

Layout: `display: flex; align-items: center; justify-content: space-between`

```
┌─────────────────────────────────────────────────────────────┐
│  [RING 56px]   [HEADER-CENTER]                 [DAY BADGE]  │
│   3-arc SVG    ┌───────────────────────────┐   ┌─────────┐  │
│   + center     │ Sunday, May 18, 2026      │   │  Day 5  │  │
│     hours      │ Up next: Deep Work at 09:00│   └─────────┘  │
│   + tooltip    └───────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

Elements in order (Today.js lines 246–253):
1. **Cadence Pressure Ring** — 56px SVG, 3 arc segments (green/amber/purple), center shows total hours, hover tooltip shows per-bucket minutes + balance verdict
2. **today-header-center** (flex column, center-aligned):
   - `<time class="today-header-date">` — "Sunday, May 18, 2026" in Instrument Serif 17px
   - `<span class="today-header-activity">` — "Now: X (Nm left)" or "Up next: Y at HH:MM" in 11px muted text
3. **Day Badge** — "Day N" pill (primary color, 12px uppercase)

Five distinct information units in a single header row.

### 1b. CycleCard Header (`<header class="cycle-header">`)

Inside the card, below the page header:

```
┌─────────────────────────────────────────────────────────────┐
│  Sunday, May 18, 2026                (cycle-date-display)   │
│  [aria-live hidden screen-reader text: "Up next: …"]        │
│  ▸ Why this plan (collapsed disclosure)                      │
│  ▸ Yesterday: 5/6 closed (collapsed disclosure, if recap)    │
└─────────────────────────────────────────────────────────────┘
```

The `cycle-date-display` is an `<h1>` in the same Instrument Serif face, same locale format, same date value as `today-header-date`. These are two separate render paths (CycleCard.js `formatDateDisplay` vs Today.js `formatHeaderDate`) producing visually identical output.

The `cycle-now-summary` span (CycleCard.js line 395) is `aria-live="polite"` — it is the screen-reader surface. The page-level `today-header-activity` is the visible surface. They compute the same value from the same `nowIso` + `activities` props (Today.js lines 208–243, CycleCard.js `buildCurrentActivitySummary` lines 111–156).

### 1c. Body Layout

When a composition exists and `!isEditing` (Today.js lines 347–396):

```
┌──────────────────────────────────┬───────────────┐
│  today-grid-col (flex: 1)        │  cycle-bucket │
│                                  │  -strip       │
│  ┌──────────────────────────┐    │  164px wide   │
│  │  cycle-header (in card)  │    │               │
│  │  h1: date (again)        │    │  Today's Load │
│  │  aria-live: now/next     │    │  ──────────── │
│  │  [WhyThisPlan ▸]         │    │  Deep Work    │
│  │  [MorningRecap ▸]        │    │  3h 0m ▓▓▓░  │
│  │                          │    │  target 4h    │
│  │  TodayGrid (hour rail)   │    │               │
│  │  7am–7pm blocks          │    │  Comms        │
│  │  now-line glow           │    │  1h 30m ▓▓░░  │
│  │  past-hour dim           │    │  target 2h    │
│  │                          │    │               │
│  │  [NowJumpButton sticky]  │    │  CI           │
│  │                          │    │  1h 0m ▓░░░   │
│  └──────────────────────────┘    │  target 2h    │
│                                  │               │
└──────────────────────────────────┴───────────────┘
```

The bucket strip (Today.js lines 347–377) is 164px wide, fixed-shrink, visible in all non-edit states. It renders three rows: label + actual minutes + 3px progress bar + "target Xh" subtext.

---

## 2. Information Audit

| # | Information | User need | First-scan prominence | Competes with | Duplicated? |
|---|-------------|-----------|----------------------|---------------|-------------|
| 1 | Cadence Pressure Ring (arc segments) | Is my day balanced across buckets? | High — 56px visual, left-anchored | Day Badge | Yes: bucket strip shows same totals in prose form |
| 2 | Ring center text ("Xh") | How many hours am I planning today? | Low — 9px mono inside 56px ring | Nothing | No — only place total hours appears in summary form |
| 3 | Ring tooltip (hover) | Per-bucket minutes + balance verdict | Off by default; hover only | Nothing | Yes: bucket strip shows per-bucket minutes persistently |
| 4 | Calendar date in page header | What day is it? | High — Instrument Serif 17px, centered | Ring, date in card | Yes: repeated in cycle-date-display h1 below |
| 5 | Current/next activity in page header | What am I doing now / what's next? | Low — 11px muted, below date | Nothing at same scale | Partial: aria-live span in card computes same value |
| 6 | Day Badge ("Day N") | How many days have I been using this? | Medium — pill, right-anchored | Ring | No — unique info; however engagement-metric usefulness is low once past onboarding |
| 7 | cycle-date-display h1 in card | What day am I planning? | High — h1 inside card | Page-header date | Yes: same string as #4 |
| 8 | cycle-now-summary aria-live | Screen-reader: what is happening now? | Screen-reader only | Nothing visible | Yes: same computation as #5 |
| 9 | Bucket strip — Deep Work row | How much project work is planned vs target? | Medium — persistent 164px column | Ring arc | Yes: ring arc + ring tooltip cover same data |
| 10 | Bucket strip — Comms row | How much comms is planned vs target? | Medium | Ring arc | Yes |
| 11 | Bucket strip — CI row | How much CI is planned vs target? | Medium | Ring arc | Yes |
| 12 | TodayGrid (hour rail + blocks) | When do I do each activity? | High — dominant visual | Everything above | No — core, unique |
| 13 | WhyThisPlan disclosure (collapsed) | Why did the composer choose this? | Low — collapsed, must tap | Nothing | No |
| 14 | MorningRecap disclosure (collapsed) | How did yesterday go? | Low — collapsed, must tap | Nothing | No |
| 15 | EOD CTA in footer | Time to capture reflection | Medium — appears contextually | Nothing | No |

**Duplication count:** 4 out of 15 information units are substantially duplicated (items 4/7, 5/8, and 1/3/9/10/11).

---

## 3. Likely Root Causes of Phil's "Not Thrilled" Signal

### Hypothesis A: Header overload (primary suspect)

The page-level header contains **five competing elements** in a single flex row: Ring (56px) + Date (17px serif) + Now/Next (11px) + Day Badge (pill). That is the entire width of the viewport split between four visual objects before a single activity block is visible.

The Ring and the Day Badge are both left/right anchors pulling attention outward. The date and activity text are center-stacked between them. On a typical laptop viewport (1200–1400px), the center column has room to breathe; on anything below ~860px, the date truncates due to `text-overflow: ellipsis` and the activity line is the first thing cut (app.css line 179, 195). The header communicates status but not action — there is nothing to do in the header.

### Hypothesis B: Right-margin bucket strip is visible but redundant

The bucket strip (app.css line 3462–3553) is 164px wide and persistently visible. It shows exactly the same per-bucket minutes that the Ring's hover tooltip shows (CadencePressureRing.js lines 207–231 vs Today.js `renderBucketStrip` lines 421–472). The Ring exists *because* the strip was considered too heavy; the strip was not removed when the Ring was added in Iter 42. The page now has both.

The strip also competes with the TodayGrid for horizontal space. The grid gets `flex: 1` but gives up 164px + 20px gap unconditionally. On narrower viewports (<860px) the strip stacks below the grid (app.css line 3559–3571), fragmenting the layout further.

### Hypothesis C: Date rendered twice; hierarchy inverted

The calendar date appears in the **page header** as `today-header-date` (Today.js line 200) and again inside the CycleCard as `cycle-date-display` h1 (CycleCard.js line 389). Both use Instrument Serif, both show the same locale string, both derive from `composition.date`.

The h1 inside the card is the semantically correct primary heading for the composition. The page-header date is a redundant echo added in Iter 43. This creates an inverted hierarchy: the secondary (header echo) renders above and at approximately the same type size as the primary (card h1). A user scanning downward encounters the date twice within ~100px of scroll.

---

## 4. Specific Reduction Proposals

### Proposal 1 — Remove the right-margin bucket strip [HIGH IMPACT, LOW RISK]

**What:** Delete `renderBucketStrip` call (Today.js line 348–349) so `bucketStripHtml` is always `''`. The `today-body-with-strip` layout path becomes dead code; the body falls to the simpler `today-body` path (Today.js lines 378–396).

**Why:** The Ring (Iter 42 signature) already encodes the same 4-2-2 allocation visually. The hover tooltip on the Ring (CadencePressureRing.js lines 213–231) shows per-bucket minutes and balance verdict — more information than the strip, available on demand. Removing the strip recovers 164px + 20px gap of horizontal space, giving TodayGrid the full content width on all viewports. The Ring becomes unambiguously the primary bucket-summary affordance.

**Enrichment if needed:** If Phil wants the per-bucket actual/target figures persistently visible, they can be surfaced as a single line of text below the Ring (e.g., "4h / 2h / 1h") within the header-center, at the same muted 11px level as the activity summary. This adds zero new layout columns.

**What it breaks:** Nothing. The bucket strip is read-only display. `renderBucketStrip` has no dispatch actions, no state writes.

**File touches (spec only):** Today.js line 347 (condition gate or function no-op); app.css lines 3542–3580 can be deprecated.

### Proposal 2 — Remove the page-header date; let the card h1 own it [MEDIUM IMPACT, LOW RISK]

**What:** In Today.js, set `headerDateHtml = ''` unconditionally, or condition it to empty when a composition exists (since the card h1 already shows it). The page-header date was added in Iter 43 (AC4/AC5) before it was clear that CycleCard already rendered the same string as an h1.

**Why:** Eliminates one of the five header elements and resolves the hierarchy inversion. The card h1 (`cycle-date-display`) is the semantic owner of the date — it is the right place. The page header is a navigation / status zone, not a calendar heading.

**What survives:** Instrument Serif date rendering survives in the card h1. The `formatHeaderDate` function in Today.js can be deleted; `formatDateDisplay` in CycleCard.js is the single source of truth.

**Tradeoff:** The header becomes Ring + Now/Next + Day Badge — three elements instead of five. The Ring and Day Badge remain as left/right anchors. The activity summary (Now/Next) becomes the sole center text.

**File touches (spec only):** Today.js lines 198–201 (`headerDateHtml` conditional or constant empty).

### Proposal 3 — Demote or relocate the Day Badge [LOW IMPACT, OPTIONAL]

**What:** Move "Day N" out of the header entirely and into the card subtext (e.g., below the cycle-date-display h1 as a small annotation), or render it only during the first 14 days (onboarding window), suppressing it for established users.

**Why:** "Day 5" communicates onboarding progress. By day 30 it communicates nothing useful and occupies a visual anchor position (right edge of header). The Day Badge competes with the Ring for left/right attention in the header row. It is not an action; it does not help the user schedule their day.

**What survives:** The `daysSinceSignup` signal is still computed and can drive the onboarding hint copy (Today.js `daysSinceSignupHint`, line 103) without needing to be a visible badge in the header.

**File touches (spec only):** Today.js lines 176–178; app.css `.today-day-badge` can be scoped to `.today-day-badge--onboarding` with a JS condition.

---

## 5. What NOT to Remove

| Element | Why sacred |
|---------|-----------|
| Cadence Pressure Ring | Iter 42 signature pattern; sole visual summary of day balance; interactive (hover tooltip); compact (56px). Do not touch. |
| TodayGrid (hour rail + blocks) | Core interaction surface since Iter 29. Dominant visual. Where the user reads and manages their day. |
| Bucket color system | Iter 31 canonical token set. The green/amber/purple identity is baked into the Ring arcs, block gradients, and strip fills. Color identity must stay. |
| cycle-date-display h1 | Semantic heading of the composition; anchors the card; correct owner of the date. Keep here; remove the echo in page header. |
| BlockDetailDialog | Iter 30 click-block interaction. Not relevant to density problem. |
| WhyThisPlan + MorningRecap disclosures | Collapsed by default; zero visual weight unless tapped. Not part of the density problem. |

---

## 6. Recommendation

### Recommended path: A — Specific cuts, no restructure

**Cut 1 (mandatory):** Remove the right-margin bucket strip. This is the highest-impact change. It recovers horizontal space, eliminates the primary duplication flagged in the UX R2 review, and elevates the Ring to unambiguous primacy. The Ring's hover tooltip already contains the detailed per-bucket data the strip showed. Implementation is a one-line gate in Today.js (`renderBucketStrip` returns `''`).

**Cut 2 (recommended):** Remove the page-header date echo. The card h1 owns the date; the page header does not need to repeat it. This eliminates one of the five header elements and fixes the hierarchy inversion. The header becomes: Ring + Now/Next text + Day Badge — three elements, all different in kind.

**Hold on Proposal 3** (Day Badge demotion): Wait until Phil confirms whether the date echo removal alone resolves his discomfort. If the header still feels cluttered, demoting or suppressing the Day Badge is the next lever.

### Why not B (bigger restructure)?

The layout skeleton (header + CycleCard + grid) is sound. The problem is additive accumulation — each iteration added something without retiring its predecessor. Cuts solve that directly. A restructure risks displacing the Ring or the grid, which are the two elements that are working.

### Why not C (ask Phil first)?

The evidence is sufficient to act. "Not thrilled" plus the duplication evidence (Ring + strip show the same data) plus the iteration history (strip was never retired when Ring was added) points clearly at the bucket strip and the date echo as the candidates. Shipping the two cuts, then asking Phil to react, is faster than an interview loop and produces a testable artifact.

### Why not D (hold)?

The page is not mature — it accumulated five changes in two iterations (Iter 42 + 43). "Hold" would defer a known duplication. The Ring was explicitly added as a more compact replacement for heavy bucket display; leaving the strip alongside it contradicts the design rationale.

---

## Implementation Scope (spec only — no production code changed)

| Cut | File | Location | Change |
|-----|------|----------|--------|
| Remove bucket strip | `js/ui/pages/Today.js` | Line 347–349 | Condition `bucketStripHtml = ''` unconditionally, or guard: `const bucketStripHtml = '';` |
| Remove bucket strip CSS | `app.css` | Lines 3462–3580 | Deprecate `.cycle-bucket-strip`, `.cycle-bucket-row`, `.today-body-with-strip`, `.today-grid-col` (or leave inert) |
| Remove page-header date echo | `js/ui/pages/Today.js` | Lines 198–201 | Set `const headerDateHtml = '';` or delete the conditional |
| Remove `formatHeaderDate` | `js/ui/pages/Today.js` | Lines 55–70 | Function becomes dead code; safe to delete |

No changes to CycleCard.js, TodayGrid.js, CadencePressureRing.js, or any non-UI layer.

---

## One Question for Phil

If the two cuts above (strip removal + header date removal) are shipped and the header becomes Ring + Now/Next + Day Badge:

> "Does the Ring give you enough of a read on how your day is balanced, or do you want the per-bucket numbers (e.g., '4h / 1h 30m / 1h') visible somewhere without having to hover?"

This answer determines whether the Ring tooltip is sufficient or whether a persistent one-line text summary should be added near the Ring in the header.
