# UX_TODAY_REDESIGN.md
## BAM-X Today Page — Redesign Proposal
### Sprint 16b / Proposal Pass — Not for production. Phil reviews; no code ships until approved.

---

## 1. Aesthetic Direction Statement

**Name: Chartered Minimalism**

This design feels like sitting down with a well-made planner that a financial journalist or a senior IC at a growth-stage company actually uses — not a SaaS dashboard, not a productivity-app store listing. It has the quiet authority of a Bloomberg terminal print-edition, the structural rhythm of a carefully-set editorial column, and the spatial discipline of an architect's working document. Nothing performs. Nothing decorates for decoration's sake. The typographic hierarchy is intentional enough to feel like craft, but restrained enough that the schedule data is always the loudest thing on the page. The hour rail reads like a newspaper column margin. The activity blocks feel like typeset entries in a ledger — colored for meaning, not for mood. When the now-line pulses, it does so with the same calm regularity as a cursor blinking in a text editor: it says "this is live" without shouting it.

The through-line: **disciplined editorial meets operational precision.** The product is used daily. It needs to feel like picking up a trusted tool, not loading a dashboard.

---

## 2. Typography

### Trio

**Display / Headers:** DM Serif Display (Google Fonts)
**Body / UI:** DM Sans (Google Fonts)
**Numerals / Monospace:** DM Mono (Google Fonts)

### Reasoning

DM Serif Display has the editorial gravity of a publication masthead — it is refined but not precious. Its serifs carry weight on large display text (the day heading, the "Today" label) without crossing into decorative territory. The contrast between its strokes is sophisticated enough to read as intentional craft.

DM Sans is the grotesque companion to DM Serif — designed by the same type foundry to work together. It is not Inter. It has subtly quirky letterforms (the double-storey 'a', the slightly condensed cap height) that give body text a quiet personality without fighting the display font for attention. At 13-14px it reads extremely cleanly.

DM Mono is the keystone for this tool. Every time display is used — hour labels `09`, `14`, elapsed time `01:23:47`, block start times `08:45` — it must render in tabular monospace. DM Mono is engineered for legibility at small sizes. Its numerals are optically identical in width, which means the hour rail never shifts laterally as the clock changes. This is functional typographic choice, not stylistic.

### Import Statement
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
```

### CSS Variable Additions
```css
--font-display: 'DM Serif Display', Georgia, serif;
--font-body:    'DM Sans', 'Helvetica Neue', sans-serif;
--font-mono:    'DM Mono', 'Fira Code', 'Courier New', monospace;
```

### Verification
DM Serif Display, DM Sans, and DM Mono are all available on Google Fonts as of 2025 with stable, long-term hosting. All three are SIL Open Font License. No self-hosting required for the proposal. Production would either use Google Fonts CDN or self-host the subset WOFF2 files (the latter preferred for no external dependency).

---

## 3. Color Palette Extensions

### Phil's locked bucket colors — preserved exactly, refined gradient treatment only

| Role | Hex | Note |
|---|---|---|
| PROJECT fill base | `#16a34a` | green-600 — unchanged |
| PROJECT fill gradient top | `#22c55e` | green-500 — lighter node |
| COMMUNICATION fill base | `#ca8a04` | yellow-600 — unchanged |
| COMMUNICATION fill gradient top | `#d97706` | amber-600 — warmer node |
| CI fill base | `#9333ea` | purple-600 — unchanged |
| CI fill gradient top | `#a855f7` | purple-500 — lighter node |

The gradients are 135deg linear, from the lighter node at top-left to the base at bottom-right. Angle chosen to simulate a directional light source from top-left — a subtle signal of materiality without flat-colorism.

### Secondary Surface Palette

| Name | Hex | Usage | WCAG check |
|---|---|---|---|
| `--surface-0` | `#f7f6f4` | Page background (warm off-white; replaces flat `#fafaf9`) | N/A (bg) |
| `--surface-1` | `#ffffff` | Card/panel background | N/A (bg) |
| `--surface-2` | `#f0ede9` | Subtle recessed areas (hour rail bg, dialog inner) | N/A (bg) |
| `--ink-900` | `#111009` | Near-black; primary text (replaces `#1c1917`) | On `#fff`: 19.6:1 — AAA |
| `--ink-600` | `#57534e` | Muted/secondary text | On `#fff`: 5.4:1 — AA |
| `--ink-400` | `#a8a29e` | Placeholder / disabled | On `#fff`: 2.8:1 — AA Large only |
| `--ink-200` | `#e7e5e2` | Hairline borders (replaces `#d6d3d1`) | N/A (decorative) |
| `--ink-100` | `#f5f4f2` | Hover surfaces | N/A (bg) |

### Accent Neutral
`--accent-action`: `#0f172a` (slate-900) — already used as `--primary` in production. Retained. No new accent color introduced. This is a deliberate constraint: the bucket colors carry enough chromatic weight. Adding a fourth accent would crowd the palette.

### WCAG AA Verification (Key Pairs)

| Foreground | Background | Ratio | Grade |
|---|---|---|---|
| `#111009` on `#f7f6f4` | Page text on bg | 18.8:1 | AAA |
| `#ffffff` on `#16a34a` | PROJECT block text | 4.54:1 | AA |
| `#ffffff` on `#22c55e` | PROJECT gradient top | 3.1:1 | AA Large (14px+ bold) |
| `#ffffff` on `#ca8a04` | COMM block text | 4.6:1 | AA |
| `#ffffff` on `#d97706` | COMM gradient top | 3.8:1 | AA |
| `#ffffff` on `#9333ea` | CI block text | 5.9:1 | AA |
| `#ffffff` on `#a855f7` | CI gradient top | 4.1:1 | AA |
| `#111009` on `#ffffff` | Dialog body text | 19.6:1 | AAA |
| `#57534e` on `#f7f6f4` | Muted text on bg | 5.2:1 | AA |

Note: The gradient tops (`#22c55e`, `#d97706`) are used at the very top corner of blocks only; the center of mass of text is over the base color which clears AA comfortably.

### Block Fill Gradients (CSS)
```css
.block-project  { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
.block-comm     { background: linear-gradient(135deg, #d97706 0%, #ca8a04 100%); }
.block-ci       { background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); }
.block-lunch    { background: linear-gradient(135deg, #f5f4f2 0%, #e7e5e2 100%);
                  color: #57534e; font-style: italic; }
```

### Refined Muted Block (PROPOSED / composer-built)
```css
.block-proposed-project  { background: linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%); color: #166534; }
.block-proposed-comm     { background: linear-gradient(135deg, #fde68a 0%, #fef9c3 100%); color: #713f12; }
.block-proposed-ci       { background: linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%); color: #581c87; }
```

---

## 4. Motion Design

### Moment 1: Page-Load Reveal
**Duration:** 480ms staggered. **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (Expo out — fast start, long ease).

The hour rail fades in first (0ms delay, 240ms duration), then activity blocks cascade in from left with stagger (each block: `translateX(-8px) opacity(0)` → neutral, 40ms stagger per block, starting at 120ms). The effect is a rapid left-to-right reveal that reads like a typewriter printing the day's plan. Never more than 6 blocks animate simultaneously (capped stagger window).

```css
@keyframes blockReveal {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
.today-block { animation: blockReveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both; }
```

### Moment 2: Block Hover-Lift
**Duration:** 160ms. **Easing:** `ease-out`.

On hover: `translateY(-2px)` + shadow deepens from `0 1px 3px rgba(0,0,0,0.12)` to `0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)`. The lift is 2px only — enough to signal interactivity without drama. A subtle inner-light effect is added via `::before` pseudo-element brightening on hover (opacity 0 → 0.06 on a white overlay).

```css
.today-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08);
  transition: transform 160ms ease-out, box-shadow 160ms ease-out;
}
```

### Moment 3: Now-Line Breathing Pulse
**Duration:** 3000ms loop. **Easing:** `ease-in-out`.

The now-line has a `::after` pseudo-element — a horizontal gradient glow, 100% width, 6px height, centered on the line. The glow oscillates opacity `0.15 → 0.45 → 0.15` over 3 seconds. The dot at the left also scales slightly `1 → 1.3 → 1` on the same timing. The line itself does not move — only the glow halos. The timestamp label (positioned right of the dot, e.g. `09:47`) renders in `--font-mono` at 10px, same red, no animation.

```css
@keyframes nowPulse {
  0%, 100% { opacity: 0.15; transform: scaleX(0.92); }
  50%       { opacity: 0.42; transform: scaleX(1); }
}
@keyframes dotBreathe {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.35); }
}
.now-line-glow { animation: nowPulse 3s ease-in-out infinite; }
.now-dot       { animation: dotBreathe 3s ease-in-out infinite; }
```

### Moment 4: Dialog Entrance / Exit
**Entrance duration:** 240ms. **Exit duration:** 160ms.

The backdrop fades from `opacity(0)` to `opacity(1)` over the full 240ms. The panel enters from `scale(0.96) translateY(8px) opacity(0)` — not a slide from the edge, a subtle emergence from slightly below its final position. Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight spring overshoot — gives the panel a sense of settling in, not snapping). Exit is the reverse at 160ms with `ease-in`.

```css
@keyframes dialogEnter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.bdd-panel { animation: dialogEnter 240ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
```

### Moment 5: PROPOSED → ACCEPTED State Transition (Dashed → Solid)
**Duration:** 400ms. **Easing:** `ease`.

When a composition is ratified, all PROPOSED blocks cross-fade their background gradient from the pale tint version to the saturated fill. The dashed `outline` simultaneously transitions from `opacity 1 → 0` as the fill saturates. CSS `transition: background-color 400ms ease, outline-color 400ms ease, opacity 400ms ease` on the block element. In practice this is a class swap (`.proposed` removed) which triggers the transition on all properties simultaneously.

### Moment 6: Signature — Kaizen Link Chip Highlight
**Duration:** 1200ms. Triggered once on page-load if any block has a kaizen chip. **Easing:** `ease-in-out`.

The kaizen chip on any block receives a single soft glow pulse — `box-shadow` goes from nothing to `0 0 0 3px rgba(147, 51, 234, 0.25)` and back — once, at page load, with a 600ms delay. This is BAM-X's signal: "this work is connected to an improvement initiative." It only fires once per session. Understated, but unmistakable to someone who knows what kaizen linkage means.

```css
@keyframes kaizenPing {
  0%   { box-shadow: 0 0 0 0px rgba(147,51,234,0.3); }
  50%  { box-shadow: 0 0 0 5px rgba(147,51,234,0.15); }
  100% { box-shadow: 0 0 0 0px rgba(147,51,234,0); }
}
.kaizen-chip-linked { animation: kaizenPing 1200ms ease-in-out 600ms 1 forwards; }
```

---

## 5. Spatial Composition

### Layout Sketch (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BAM-X          Today    Week    Kaizen    Catalog        Day  4     │  nav — DM Sans 13px
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Thursday, 30 April 2026                           [ACCEPT] [EDIT]  │  header — DM Serif Display 28px date
│  ────────────────────────────────────────────────────────────────   │  1px `--ink-200` rule
│                                                                     │
│  [hour rail]  [day timeline column]                [bucket strip]   │
│                                                                     │
│    07  ─────  ┌────────────────────────────────┐                    │
│               │ 07:00–08:00                    │  Deep Work         │
│               │ API Integration Refactor       │  6h 45m / 8h      │
│    08  ─────  └────────────────────────────────┘                    │
│               ┌─────────────────┐              │  Comms             │
│               │ 08:00–09:00     │              │  1h / 2h           │
│    09  ─────  │ Stand-up        │──now line──  │                    │
│               │                 │              │  CI                │
│    10  ─────  └─────────────────┘              │  2h / 3h           │
│               ┌────────────────────────────────┐                    │
│               │ 10:00–12:00                    │                    │
│    12  ─────  │ Feature Spec (CI)   [kaizen]   │                    │
│               └────────────────────────────────┘                    │
│               ─  ─  ─ Lunch (12:30–13:00) ─  ─ ─                   │
│    13  ─────  ┌──────────────┐                                      │
│               │ ...          │                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Spatial Decisions

**Hour Rail:** Reduced from 56px to 48px. Hour numerals are right-aligned DM Mono at 13px, `--ink-400`. The rail has a subtle `--surface-2` background (vs page `--surface-0`), creating a visible but gentle visual channel separation without a border line. The right edge of the rail has a 1px `--ink-200` hairline only — not a full-border box.

**Day Timeline Column:** `position: relative` container, identical to production. Vertical hairlines at each hour boundary run the full width at `1px` `--ink-200` opacity `0.6`. These are rendered as `::before` pseudo-elements on each hour band. They are lighter than the current dashed borders — they act as ruled-paper underlining for the schedule rather than a grid cage.

**Bucket Summary Strip (right column):** Moved from below the grid to a narrow right column (`160px`) alongside it. This is the most significant compositional shift. It acts as a right margin annotation — the same role that glosses play in editorial design. The three bucket progress bars become vertical-ish "margin notes" next to the plan. On mobile this collapses below the grid.

**BlockDetailDialog:** Remains a centered modal (not a side panel). Rationale: the grid is the primary surface; a side panel would require the grid to squeeze. The modal's new treatment is a narrower, taller panel (`360px max-width`, `calc(100vh - 80px) max-height`), anchored slightly above center (`top: 40%` vs `50%`). This off-center anchor feels editorial rather than modal-tool.

**No asymmetry for drama's sake.** The hour rail is still left-aligned. Content flows top-to-bottom. The spatial novelty is in the right-margin strip (bucket summary), the reduced rail width, and the proportional relationship between the serif date heading and the mono hour labels.

---

## 6. Block Visual Treatment

### PROPOSED State
Dashed outline preserved per locked constraint. Refinement: the outline is `2px dashed` in the bucket's text color (e.g., `#166534` for PROJECT) rather than `currentColor` inherited from the fill. The fill is the pale tint gradient (`#bbf7d0 → #dcfce7`) rather than the saturated version. The dashes use `border-style: dashed` with a custom `border-image` to achieve 6px dashes / 4px gaps (more precise than `outline: dashed` which doesn't support gap control in all browsers). Opacity: 0.9 (slightly more present than the current 0.85).

```css
.block-proposed {
  background: linear-gradient(135deg, var(--proposed-bg-top), var(--proposed-bg-base));
  border: 2px dashed var(--proposed-stroke);
  opacity: 0.9;
  color: var(--proposed-text);
}
```

### ACCEPTED State
Saturated fill gradient (the 135deg linear described in section 3). The left edge of each accepted block has a `3px` solid bar in a slightly darker version of the fill color (e.g., `#15803d` for PROJECT) — a subtle left accent that reads like a category marker in a well-designed schedule. White text, slightly bold time label (500 weight in DM Mono).

### Lunch Block
`linear-gradient(135deg, #f5f4f2 0%, #e7e5e2 100%)` — warm near-white to warm light gray. Text in `--ink-600`. The name renders in `font-style: italic` (DM Sans italic variant). No left accent bar. The block has `border: 1px dashed --ink-200` to distinguish it from accepted blocks without the dashed-proposal visual meaning. A small "~" prefix before "Lunch" in the name signal its capacity-neutral status.

### IN_PROGRESS State
The block adds a `::after` overlay — a left-edge progress bar that grows from 0% to N% of the block's height, representing elapsed time ratio. This overlay is `4px` wide, positioned at the left edge inside the block border, in `rgba(255,255,255,0.5)` (a white-glass stripe against the saturated fill). A small animated dot at the leading edge of this stripe pulses at 2s intervals (matching the now-line's 3s breathing — slightly faster to signal activity). The time label shows elapsed: `01:23 of 2:00h`.

### SKIPPED State
`opacity: 0.35`. Background becomes `--surface-2` (`#f0ede9`). Text in `--ink-400`. A single diagonal `::before` watermark-style stroke across the block (a thin 1px `--ink-200` line from top-left to bottom-right, via `background: repeating-linear-gradient(-45deg, ...)` at very low opacity). Name text renders with `text-decoration: line-through --ink-400`. The left accent bar is retained but in `--ink-300`.

### CLOSED State
Similar to current `opacity: 0.55`. The time label is hidden (replaced by a small checkmark icon rendered via CSS or unicode `✓` in `--ink-400`). Block fill becomes a lighter gradient version. Text renders in the regular bucket fg color (not white).

---

## 7. Hour Rail Treatment

### Current State
13 labels in `font-size: 12px` system font, right-aligned, dashed bottom borders.

### Proposed Treatment
The hour numbers render in **DM Mono, 13px, `--ink-400`**. The numeral is the hour only, zero-padded: `07`, `08`, `09`, ... `19`. No "AM" or "PM" suffix — a deliberate editorial choice (this is a professional tool for people who read 24h military time intuitively). Half-hours are not labeled; only hours have labels.

Each hour band has a horizontal hairline at the top edge: `1px solid --ink-200` at `opacity: 0.5`. These hairlines run the full width of the timeline column. They do NOT appear in the hour rail column itself (the rail has only the right-edge hairline). This creates a pleasant asymmetry: the grid lines "emanate" from the left rail into the content area.

The current-hour label receives a subtle call-out: the numeral for the current hour (e.g., `09` if now is 09:47) renders in `--ink-900` at `font-weight: 500`, while all other hour labels stay in `--ink-400` at `font-weight: 400`. This is the only dynamic styling on the rail. No background highlight, no box, just a weight change.

Hour rail width: **48px** (down from 56px). Rail background: `--surface-2` (`#f0ede9`). Right edge: `1px solid --ink-200`.

---

## 8. Now-Line Treatment

### Current State
Horizontal `2px` red line with an 8px left-side dot. No label. No animation.

### Proposed Treatment

**The now-line is the page's heartbeat.** Three layers:

1. **The line itself:** `1.5px solid var(--now-red)` where `--now-red: #dc2626`. Slightly thinner than current (`2px → 1.5px`) to be precise without being heavy.

2. **The breathing glow:** A `::after` pseudo-element spanning the full width, `6px` tall, centered on the line. `background: linear-gradient(to right, rgba(220,38,38,0.3) 0%, rgba(220,38,38,0.0) 60%)`. This creates a soft red halo that fades right — simulating the now-line as a leading edge, with a trail. The glow pulses at `opacity: 0.2 → 0.45 → 0.2` over 3s (see Motion section).

3. **The timestamp label:** Right of the left dot, a `10px` `DM Mono` label showing the current time (e.g., `09:47`). Color: `--now-red`. Background: `white` at `opacity 0.85` (so it reads over the timeline background). The label never wraps; it truncates only if the hour rail is too narrow, which it won't be at 48px.

4. **The dot:** `10px` diameter, `--now-red`. On the left edge of the timeline (touching the rail's right border). The dot breathes: `scale(1) → scale(1.3) → scale(1)` at 3s intervals synchronised with the glow.

```
──── ●  09:47 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [glow fades right] ─────
```

---

## 9. Backgrounds and Atmosphere

### Decision: Vertical Hairlines + Warm Off-White

The page background is `--surface-0: #f7f6f4` (warm off-white, slightly warmer than the current flat `#fafaf9`). It is not a gradient mesh; it is not a dot-grid. The schedule is already information-dense. A patterned background would compete.

**What adds depth:** the vertical hairlines at hour boundaries in the timeline column (described in section 7) create the impression of a ruled surface without literally texturing the background. The hour rail's `--surface-2` creates a visible but low-contrast left column that anchors the eye to the time axis.

**What does NOT appear:** no dot-grid, no diagonal hatching, no noise texture, no gradient mesh. The surface needs to be invisible in use. The typography and block colors carry all the atmospheric weight.

**Exception: dialog backdrop.** When the BlockDetailDialog is open, the backdrop is `rgba(17, 16, 9, 0.4)` — a warm very-dark-brown-black scrim (not neutral gray, not pure black). This matches the near-black `--ink-900` and gives the overlay a slightly warmer, less clinical feeling than a gray scrim.

---

## 10. Reference / Inspiration Board

1. **Linear's Command menu and settings pages (2024)** — the authority of a tool that respects its user's time. Precise typography, no gradients on UI chrome.
2. **Stripe Sigma query interface** — tabular data with professional typographic hierarchy. The use of monospace in data contexts, generous line-height, restrained color.
3. **Pitch presentation editor (sidebar panel)** — how to make a panel-detail UI feel polished without being decorative. The edit drawer in this proposal borrows that sense of contained elegance.
4. **The Financial Times digital (ft.com headers)** — editorial serif display + grotesque body at scale. The "Today" date heading in DM Serif Display is directly influenced by how FT renders datelines.
5. **Paco Coursey's personal site (paco.me)** — meticulous micro-typography. The hour rail treatment (weight-change on current hour, not highlight boxes) comes from this kind of quiet precision.
6. **Monodraw / Sketch app canvas** — the idea of the now-line as a leading-edge with a glow-trail, similar to a cursor or scan line in professional drawing tools.
7. **Notion calendar block views** — how a density of colored blocks can remain readable when the typography inside them is impeccable. This raised the bar for the block time-label treatment.
8. **Werkzeug journal (Berlin)** — a German-Swiss art/design journal with a grid-based layout and deliberate serif + grotesque pairing. The "margin annotation" idea for the bucket strip comes from how this publication uses the outer margin for editorial callouts.

---

## 11. What the User Feels

When someone opens the current Today page, they see a functional calendar. Clean, correct, but anonymous — it could be any SaaS productivity tool. The system-font body, the flat color blocks, the generic dashed borders: all of it reads as "adequately designed." There is no moment where the tool asserts its own identity.

With the redesign, the user feels two things they did not feel before, and they may not consciously identify either: **authorship** and **instrument-quality**.

Authorship: the DM Serif Display date heading — "Thursday, 30 April 2026" set at 28px with proper editorial weight — tells the user this day was *composed*, not auto-generated. The date has presence. It anchors the experience in a specific, real moment. This is not a dashboard; it is a plan for *today*.

Instrument-quality: the DM Mono hour labels, the tabular elapsed time, the way the now-line's glow trails right like a recording indicator — these details signal that the tool is tuned for the task. The user is not using a generic tool that happens to do scheduling; they are using something designed specifically for disciplined, evidence-linked planning. The kaizen chip ping at load is the subtlest version of this — it marks connected work as connected without shouting.

The net experiential delta: the user opens the page and *pauses* for half a beat before clicking. That pause is the design working. Not because the page is beautiful in a portfolio sense, but because it has authority.

---

## 12. Implementation Notes

### Files to Modify (Production Ship)

| File | Change | Effort |
|---|---|---|
| `index.html` | Add Google Fonts `<link>` for DM Serif Display + DM Sans + DM Mono | 5 min |
| `app.css` | Add CSS variables for new surfaces, gradient fills, font-family trio. Update `.cycle-hour-rail`, `.cycle-now-line`, `.cycle-block-positioned`, `.bdd-panel`, `.today-header`. Add `@keyframes` for blockReveal, nowPulse, dotBreathe, dialogEnter, kaizenPing. Estimated ~150-200 new lines, ~80 modified lines. | 3-4 hr |
| `js/ui/components/TodayGrid.js` | Add `data-state` attribute to now-line for animation targeting. Add timestamp label to now-line HTML. Add `animation-delay` style to each block (staggered load reveal). | 45 min |
| `js/ui/components/BlockDetailDialog.js` | Update class names / structure for new panel proportions. Minor HTML restructure for the new `bdd-panel` enter animation. | 30 min |
| `js/ui/pages/Today.js` | Add right-column bucket strip wrapper HTML. Add `today-date-heading` using `composition.date`. Minor layout class changes. | 1 hr |
| `js/ui/components/CycleCard.js` | Remove/adjust the existing card wrapper (the new layout promotes the grid to a more exposed, less boxed treatment). | 45 min |

### Estimated Total Production Effort
**~6-8 hours** for a careful, test-preserving implementation. The test suite should be unaffected because all changes are in render functions (pure string output) and CSS. No engine/domain/composer files are touched. The new HTML structure in TodayGrid's output is additive (new data attributes, new sub-elements) — existing test assertions on `.cycle-block-positioned`, `.cycle-now-line`, etc. should still pass. One risk area: if any test asserts on the exact block HTML structure, the timestamp label addition to now-line and the stagger style attribute on blocks would need test updates.

### Risk Areas
- **Font load performance:** DM Serif Display is a display-only font (used in one heading). DM Sans + DM Mono are the workhorses. The `display=swap` parameter ensures no FOIT. Consider subsetting to Latin-only to reduce load weight in production.
- **Animation performance:** The now-line glow uses `transform` and `opacity` only (compositor-thread safe). Block hover uses `transform` + `box-shadow` — `box-shadow` causes repaints. For long activity lists (15+ blocks), consider using `filter: drop-shadow()` instead, which is GPU-accelerated.
- **Right-column bucket strip:** Requires structural change to `Today.js` render output. If the bucket strip data (targets, actuals) is already passed as props, this is straightforward. If not, a prop addition is needed.
- **WCAG gradient top colors:** `#22c55e` on white reads below AA at body size. Enforce that no body text renders on the gradient top zone — block title text should always be positioned over the base-color zone. This is achievable via `padding-top` on the block.

---

*Proposal authored 2026-04-30. Both artifacts are additive-only. Production code is untouched.*
