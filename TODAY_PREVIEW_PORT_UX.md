# Today Preview Port — UX Gap Analysis
_UX Designer · 2026-05-18_

---

## 1. Method

**Files read:**

- `assets/today-futuristic-preview.html` (1647 lines) — full read; all CSS and HTML sections examined
- `assets/today-redesign-preview.html` (1276 lines, earlier Chartered Minimalism preview) — header/grid sections; mostly superseded by futuristic preview
- `js/ui/pages/Today.js` (560 lines) — full read
- `js/ui/components/TodayGrid.js` (793 lines) — full read
- `js/ui/components/CadencePressureRing.js` (243 lines) — full read
- `js/ui/components/BlockDetailDialog.js` (368 lines) — full read
- `app.css` — targeted grep + reads for: `cycle-block`, `bdd-`, `cadence-ring`, `today-`, `now-line`, block-fill gradients, keyframes, dark-mode block, `body::before`, `IN_PROGRESS`, `proposedShimmer`, `kaizenRing`
- `UX_TODAY_FUTURISTIC_DELTA.md` — full read (port decisions from 7-lens synthesis)
- `UX_TODAY_REVIEW_R3_DELTA.md` — full read (R3 review decisions)

**Classification logic:** A feature is ALREADY LIVE if the relevant CSS selector/JS logic is present. PARTIALLY LIVE if the concept is ported but execution differs from the preview. NOT LIVE if the preview HTML/CSS defines the pattern and no equivalent selector appears in `app.css` or any component.

---

## 2. What's Already Live

| Preview feature | Where it landed |
|---|---|
| Instrument Serif + Geist + Geist Mono font trio | `app.css:19–22`; `--font-display`, `--font-body`, `--font-mono` |
| 3-stop inner-top-light gradient fills (project/comm/CI) | `app.css:779–817`; `160deg, #4ade80 → base → #15803d` pattern |
| Inset highlight on block fills `inset 0 1px 0 rgba(255,255,255,0.22)` | `app.css:790, 803, 816` |
| Bucket-color glow `box-shadow` on blocks | `app.css:788–790, 801–803, 814–816` |
| `blockReveal` stagger animation | `app.css:445, 3657–3659` (translateX variant) |
| Hover-lift (`translateY(-2px)`) | `app.css:452–455` |
| `prefers-reduced-motion` suppression on block animations | `app.css:942–956` |
| CadencePressureRing SVG with tooltip | `CadencePressureRing.js`; `app.css:4001+` |
| Ring hover/focus tooltip | `app.css:4088–4089` |
| Now-line: 2px, glow box-shadow, dot `::before`, glassy timestamp pill | `app.css:884–940` |
| Now-line dot breathing animation (`dotBreathe`) | `app.css:3669–3672` |
| Now-line glow trail animation (`nowGlow`) | `app.css:3663–3666` |
| Past hour dimming on rail (`cycle-hour-past`) | `app.css:409` |
| Current hour highlight in red | `app.css:401–406` |
| Half-hour dashed dividers | `TodayGrid.js:647–655`; `app.css` (`.cycle-half-hour-line`) |
| PROPOSED blocks: pale-tint gradient + dashed border | `app.css:469–488` |
| Lunch block: warm gradient + italic + dashed border | `app.css:492–503` |
| BDD color accent bar at top | `BlockDetailDialog.js:266–267`; `app.css:3429–3441` |
| BDD Instrument Serif title | `app.css:3453–3462` |
| BDD `dialogEnter` scale-fade animation | `app.css:3425, 3675–3678` |
| Kaizen chip glow-ring ping | `app.css:3687–3691` (`kaizenPing`) |
| Resize handle at block bottom edge | `TodayGrid.js:505–507`; `app.css:965–988` |
| Ghost block during drag | `TodayGrid.js:710–722`; `app.css:1001+` |
| `role="img"` with ARIA label on ring | `CadencePressureRing.js:233` |
| Day badge (`Day N` pill) | `Today.js:150–151`; `app.css:150–160` |
| Dark mode token block | `app.css:3823+` |
| Dark mode cadence ring + tooltip | `app.css:4176–4189` |
| Steps-to-complete in BDD | `BlockDetailDialog.js:98–127` |
| CI unlinked indicator | `TodayGrid.js:340–346`; `app.css:606+` |
| Sacred EoAR indicator + class | `TodayGrid.js:319`; `app.css:662+` |
| Kaizen sub-label (height-gated) | `TodayGrid.js:246–247`, `330–333` |

The futuristic preview's Phase 2 (block fills, now-line) and Phase 3 (ring) are substantially live. The earlier redesign preview (Chartered Minimalism, DM trio) is fully superseded.

---

## 3. What's Partially Live (specific gaps)

### 3.1 — `blockReveal` animation direction

**Preview** (futuristic, line 1114–1117): `from { opacity:0; transform: translateY(10px) scale(0.98) }` — blocks rise upward and scale in, feeling physical.

**Live** (`app.css:3657–3659`): `from { opacity:0; transform: translateX(-6px) }` — a leftward slide. Competent but the preview's `translateY + scale` combo reads more like a block settling into position on a calendar — truer to the spatial metaphor.

**Gap:** Direction and scale component. The `cubic-bezier(0.16, 1, 0.3, 1)` easing (spring) is already used in both.

### 3.2 — Hover on blocks: scale component missing

**Preview** (line 775–776): `:hover { transform: translateY(-3px) scale(1.005) }` — tiny XY scale gives depth perception as if block lifts off the surface.

**Live** (`app.css:452–455`): `transform: translateY(-2px)` only — no scale. The visual difference is subtle but the scale component is the thing that creates the 3D lift feeling vs a flat shift.

**Gap:** `scale(1.005)` and 3px Y (vs current 2px).

### 3.3 — Now-line timestamp pill: backdrop-filter missing

**Preview** (line 944–951): `.cycle-now-label` uses `background: var(--surface-glass); backdrop-filter: blur(8px)` — the time label is a frosted-glass chip that lets the block content slightly show through.

**Live** (`app.css:926–940`): `.cycle-now-label` uses `background: rgba(255,255,255,0.9)` — opaque white, no blur. In dark mode this becomes a white rectangle on a dark surface (contrast is fine but the glassy effect is absent).

**Gap:** Add `backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)` and switch to `rgba(255,255,255,0.85)` (light) / `rgba(20,20,23,0.85)` (dark). Also needs a `border: 1px solid var(--border-inner)` edge to define the glass clearly. (~15 min, CSS-only)

### 3.4 — IN_PROGRESS block visual treatment: absent entirely

**Preview** (lines 864–875): `.block-in-progress` has a double-ring treatment: `outline: 2px solid rgba(255,255,255,0.60)` at `outline-offset: -3px` PLUS a `::before` pseudo-element with `border: 2px solid rgba(255,255,255,0.35)` inset. Creates a "currently active" halo — the live block you're in right now is visually distinct from scheduled and closed blocks.

**Live**: No CSS selector targeting IN_PROGRESS state. Grep for `IN_PROGRESS` in `app.css` returns zero hits for block styling. `data-state` attribute is emitted by `blockWrapper` (`TodayGrid.js:184`) but nothing styles it. IN_PROGRESS blocks render identically to SCHEDULED ones.

**Gap:** High-signal omission. The current activity block (state='IN_PROGRESS') should be immediately obvious without clicking.

### 3.5 — CLOSED/SKIPPED block visual treatment: partial

**Preview** (lines 877–885): `.block-closed { opacity: 0.45 }` and `.block-skipped { opacity: 0.50; outline: 2px solid rgba(225,29,72,0.50) }` — closed activities recede; skipped ones get a red outline.

**Live**: No CSS for `data-state="CLOSED"` or `data-state="SKIPPED"` on `.cycle-block-positioned`. The state is emitted as a `data-state` attribute (verified in `blockWrapper`), but no visual differentiation rule exists. Closed blocks render at full opacity identical to live blocks.

**Gap:** Past-hours are dimmed on the rail, but the blocks themselves don't follow suit.

### 3.6 — PROPOSED blocks: `proposedShimmer` breathing animation absent

**Preview** (lines 842–844, 1131–1134): `.block-proposed` gets `animation: proposedShimmer 2.2s ease-in-out 400ms infinite` — a gentle `filter: brightness(1.04)` pulse at 50%. Communicates "pending / not yet ratified" without being distracting. Explicitly cited in the design notes (line 1542) as a Phil-design-intent item.

**Live**: PROPOSED blocks have the dashed border (correct, locked decision) and pale gradient, but no shimmer animation. The `kaizenPing` animation exists; `proposedShimmer` does not appear anywhere in `app.css`.

**Gap:** One `@keyframes` block + one animation rule on `.cycle-block-proposed`. No interaction with R3 constraints.

### 3.7 — Kaizen-linked block: `kaizenRing` ping animation absent

**Preview** (lines 825–827, 1124–1129): CI blocks with `data-kaizen-linked="true"` fire `kaizenRing` at 900ms post-load — two concentric ring expansions from the block boundary. Design notes (line 1543) call this "Disciplined, not flashy."

**Live**: `kaizenPing` at `app.css:3687–3691` animates the chip's `box-shadow` (a contained glow on the chip element). The preview's `kaizenRing` is block-level: the entire CI block boundary pulses outward twice. These are different — one is a chip micro-animation, the other is a block-level spatial ping.

**Gap:** The block-level double-ring expansion on kaizen-linked CI blocks at page load. This is the "signature" of the kaizen-linked state.

### 3.8 — Page ambient depth gradient: absent

**Preview** (lines 289–304): `body::before` renders two large radial-gradient ellipses — one green in the top-left corner (`var(--project-glow)`) and one purple in the bottom-right (`var(--ci-glow)`). `pointer-events: none; position: fixed; z-index: 0`. Subtle, tinted ambient light that makes the page feel spatially warm.

**Live**: No `body::before` in `app.css`. Plain `--surface-0` (#f7f6f4) background. The effect is invisible in screenshots but visible when holding the live page next to the preview.

**Gap:** Purely additive CSS. No interaction consequence.

### 3.9 — BDD panel: glassmorphism vs opaque surface

**Preview** (lines 965–979): `.bdd-panel` uses `background: var(--surface-glass)` with `backdrop-filter: blur(40px) saturate(180%)` — frosted panel reads as floating above content.

**Live** (`app.css:3411–3426`): `.bdd-panel` uses `background: var(--surface-1)` — solid white, no blur. The live shadow (`0 24px 64px rgba(0,0,0,0.18)`) is strong but the glass effect is absent. The preview explicitly reserved glassmorphism for chrome-only surfaces (design notes line 1545); the BDD panel qualifies since it overlays content.

**Gap:** Add `backdrop-filter: blur(32px) saturate(160%)` to `.bdd-panel` and switch background to a semi-transparent surface token.

### 3.10 — BDD close button: circular bordered style vs bare icon

**Preview** (lines 1001–1017): `.bdd-close` is a 28px circle with `border: 1px solid var(--border)` and smooth hover to `--surface-2`. Explicitly framed and touchable.

**Live** (`app.css:3465–3483`): `.bdd-btn-close` is a bare transparent button with no border and no defined size beyond `padding: 2px 4px`. It's a floating `×` character. Works but has smaller hit area and no visual affordance.

**Gap:** Make close button circular (28×28px, rounded border). WCAG 2.5.8 minimum target size (R3 D2 deferred item).

---

## 4. What's in the Preview But NOT Recommended

### 4.1 — Controls bar (floating sticky theme/palette/motion switcher)

**Preview** (lines 320–399, 1224–1258): A sticky frosted-glass toolbar at the top of the page with Live/Dark toggle, swatch switcher, and motion controls.

**Not recommended.** This is a prototyping artifact for preview exploration only. The live version correctly routes theme control through the settings page (R3 architecture decision confirmed in `UX_TODAY_FUTURISTIC_DELTA.md §3 Divergence D`). Porting the controls bar would be scope-creep that duplicates settings infrastructure.

### 4.2 — Nav bar day-pill with date

**Preview** (lines 1269–1270): `<span class="nav-day-pill">Thu · Apr 30</span>` — a monospaced date pill in the nav right edge.

**Not recommended.** The date echo was explicitly removed from the Today header in Iter 48 Phase 4D (`Today.js:166–173`) because it created a hierarchy inversion and a 5th competing element. Adding it to the nav would reintroduce the same problem one level up.

### 4.3 — Separate date heading above cycle card ("Thursday" + "2026-04-30 · Day 9")

**Preview** (lines 1277–1328): `<h1 class="today-weekday">Thursday</h1>` as a 30px Instrument Serif headline in the page header, separate from CycleCard.

**Not recommended.** Also removed in Iter 48 (AC11). The CycleCard's `cycle-date-display` is the semantic h1 owner. Restoring it as a standalone page header creates the hierarchy inversion that R3 explicitly fixed.

### 4.4 — Triad buttons (Accept / Edit / Reject) outside CycleCard

**Preview** (lines 1475–1480): Accept/Edit/Reject as a `.triad` section below the calendar grid, outside CycleCard.

**Not recommended.** The live implementation has these inside CycleCard as part of the composition state machine flow. Moving them outside would be a regression — the CycleCard knows when to show/hide the triad based on composition state and edit mode; an external triad wouldn't have access to that context without prop drilling.

### 4.5 — Bucket strip (with progress bars) inside CycleCard

**Preview** (lines 1339–1364): `.bucket-strip` with three progress bars (PROJECT/COMM/CI) and tick marks. This was already present in earlier iterations and then deliberately removed in Iter 48 Phase 3C (`Today.js:326–331`). The Cadence Pressure Ring already encodes the same information.

**Not recommended.** Explicitly removed. Comment in Today.js explains: "Cadence Pressure Ring (Iter 42) already encodes the same 4-2-2 allocation in the header; the strip duplicated it."

### 4.6 — `cycle-card` glassmorphism (surface-glass on the card body)

**Preview** (line 576): `.cycle-card` uses `background: var(--surface-glass); backdrop-filter: blur(24px) saturate(160%)`.

**Not recommended as applied to the full card body.** The DELTA (§7 Competitive §Anti-patterns) and Competitive lens both flag "heavy glassmorphism on functional content" as one of the top 3 anti-patterns to avoid because it kills readability. The BDD panel (item 3.9 above) is acceptable because it's a chrome overlay; the main card that contains all the blocks would blur the content beneath it without meaningful benefit. Glassmorphism for the BDD panel is different from glassmorphism as the default card treatment.

---

## 5. What's NOT Live But Worth Porting (ranked)

| Rank | Item | Effort | Files | R3 conflict risk |
|---|---|---|---|---|
| 1 | IN_PROGRESS block double-ring treatment (§3.4) | S | `app.css` only | None |
| 2 | CLOSED/SKIPPED block opacity dimming (§3.5) | S | `app.css` only | None |
| 3 | `proposedShimmer` breathing on PROPOSED blocks (§3.6) | S | `app.css` only | None — must add `prefers-reduced-motion` suppression |
| 4 | Now-label backdrop-filter glass (§3.3) | S | `app.css` only | None |
| 5 | `blockReveal` direction: `translateY + scale` (§3.1) | S | `app.css` only | None |
| 6 | Hover: add `scale(1.005)` component (§3.2) | S | `app.css` only | None |
| 7 | BDD close button circular style (§3.10) | S | `app.css` only | Addresses R3 D2 deferred item |
| 8 | BDD panel glassmorphism (§3.9) | S | `app.css` only | None — light theme only; dark needs token |
| 9 | Page ambient depth gradient `body::before` (§3.8) | S | `app.css` only | None — purely additive |
| 10 | Block-level kaizen ring ping (§3.7) | M | `app.css` + `TodayGrid.js` (add class trigger) | Low — must add `prefers-reduced-motion` suppression |

S = under 30 min. M = 30 min–2 hr. All items are purely `js/ui/` + `app.css` — none touch §6.5 files.

---

## 6. Top 5 Recommended Additions

These are ordered by user-facing signal quality, not effort (all are S/M).

### #1 — IN_PROGRESS block: double-ring active halo

**What changes:** Add CSS targeting `[data-state="IN_PROGRESS"]` on `.cycle-block-positioned`. Inner `outline` at 60% white opacity + `::before` inset border at 35% white. No animation — purely static state.

**Why it's the highest leverage change:** Right now a user glancing at the Today grid cannot instantly distinguish "what I'm doing right now" from "what I'm about to do." This single CSS rule closes that gap. The `data-state` attribute is already emitted by `TodayGrid.js:184` — zero JS change required.

**CSS to add** (two rules, ~10 lines):
```css
.cycle-block-positioned[data-state="IN_PROGRESS"] {
  outline: 2px solid rgba(255,255,255,0.60);
  outline-offset: -3px;
}
.cycle-block-positioned[data-state="IN_PROGRESS"]::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid rgba(255,255,255,0.35);
  pointer-events: none;
}
```

**Effort:** S. `app.css` only. Zero test risk (purely additive display rule).

---

### #2 — CLOSED/SKIPPED block opacity dimming

**What changes:** `[data-state="CLOSED"] { opacity: 0.45 }` and `[data-state="SKIPPED"] { opacity: 0.50; outline: 2px solid rgba(225,29,72,0.40); outline-offset: -2px }`.

**Why:** Past-hour hour labels are already dimmed (`cycle-hour-past: opacity 0.45`). The blocks they contain remaining at full opacity creates visual inconsistency — the rail fades but the content doesn't. The preview's treatment makes the whole grid scan read naturally: done things recede, current thing glows, future things are full weight. Also: a user who skipped an activity should see a gentle red outline as a reminder, not a block indistinguishable from one they completed.

**Effort:** S. `app.css` only. Two rules. The `data-state` attribute is already emitted.

---

### #3 — `proposedShimmer` on PROPOSED blocks

**What changes:** Add `@keyframes proposedShimmer { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.04)} }` and apply `animation: proposedShimmer 2.2s ease-in-out 400ms infinite` on `.cycle-block-proposed`. Add suppression under `prefers-reduced-motion`.

**Why:** PROPOSED blocks currently rely entirely on the dashed border to communicate "not yet ratified." The shimmer adds a temporal signal — the block feels alive, unresolved. The brightness delta (1.04) is visually minimal; it reads as ambient rather than attention-demanding. This is one of three preview items Phil's design notes explicitly call out by name (line 1542).

**Effort:** S. One `@keyframes` + two rules (animation + reduced-motion override). No JS touch.

---

### #4 — Now-label: glassmorphism pill

**What changes:** `.cycle-now-label` adds `backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.50)` and changes background from `rgba(255,255,255,0.9)` to `rgba(255,255,255,0.82)`. Dark mode: `rgba(20,20,23,0.82)` background + `rgba(255,255,255,0.15)` border.

**Why:** The now-line already has the glow trail and breathing dot — it's the most sophisticated element on the page. The timestamp pill being a flat opaque rectangle diminishes the effect. The glassmorphic pill is appropriate here because it is chrome on top of content (the same logic as the BDD panel), not the primary content surface. This is called out explicitly in the preview design notes (line 1541).

**Effort:** S. 4–6 CSS properties. Needs dark mode variant — 2 rules total.

---

### #5 — `blockReveal` animation direction: upward settle

**What changes:** At `app.css:3657–3659`, change the `blockReveal` keyframe from `translateX(-6px)` to `translateY(10px) scale(0.98)`. The easing (`cubic-bezier(0.16,1,0.3,1)`) stays the same.

**Why:** The existing leftward-slide reads as a "stagger-left" list pattern, not a calendar pattern. Blocks moving upward into position feel like they're being placed on a time grid from below — spatially coherent with the vertical axis the calendar represents. `scale(0.98)` adds the illusion of physical weight settling. This is a one-line change with zero behavioral consequence.

**Effort:** XS (5 min). Two values changed in one keyframe rule.

---

## 7. Open Questions for Phil

**Q1 — IN_PROGRESS halo color:** The preview uses white at 60% opacity (works on all three saturated bucket fills). Should the halo instead use the block's bucket color at reduced opacity (e.g., `--project-fill` at 0.3) for semantic consistency? White is more legible; colored is more expressive.

**Q2 — CLOSED opacity depth:** Preview uses 0.45. Current hour-rail past dimming uses 0.45 too. A closed 9AM block at 0.45 inside an already-dimmed rail section could compound to near-invisible. Phil should confirm the visual in a real day with several closed blocks — may need 0.55 instead.

**Q3 — Ambient depth gradient:** The `body::before` radial gradients use `var(--project-glow)` (green, top-left) and `var(--ci-glow)` (purple, bottom-right). These are subtle in light mode. In dark mode they can read strongly. Does Phil want this effect on dark mode, or light mode only?

**Q4 — Kaizen block-level ring ping (#10 in ranked list):** The preview's `kaizenRing` fires once at page load (delayed 900ms) — it's a "surprise and delight" pattern, not a persistent animation. But it runs on every page load/re-render. Phil should confirm whether this feels disciplined or whether it would become annoying on a page that re-renders frequently as the day updates.

**Q5 — BDD panel glassmorphism:** The live BDD panel is already well-received (R3 note: "do not touch"). Adding glassmorphism changes its visual character significantly — the panel would appear more ephemeral, which is appropriate for a popover but could feel less "substantial" for a dialog with action buttons. Is Phil comfortable with the panel feeling lighter?
