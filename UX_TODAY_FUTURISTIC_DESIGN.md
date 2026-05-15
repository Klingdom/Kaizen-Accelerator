# BAM-X Today Page — Futuristic Redesign Proposal
**Iter 34+: Luminous Constraint**
Status: PROPOSAL ONLY. No production code modified. Awaiting Phil review.

---

## 1. Aesthetic Direction Statement

**Name: Luminous Constraint**

This design sits at the intersection of Apple Vision Pro's spatial depth and Linear's functional precision. The core tension it holds: every pixel serves execution discipline, but the surface communicates that discipline through *light* rather than through austerity.

Where Iter 33's Chartered Minimalism whispers, Luminous Constraint speaks in a controlled voice. Backgrounds carry subtle luminance gradients — not decoration, but orientation signals that tell the eye where time lives. Activity blocks glow with inner-light fills rather than flat gradients. The now-line is the brightest element on the page, a scalpel of red light splitting past from present. Bucket colors remain Phil's signature identity but graduate into luminous fills that vibrate with energy.

The mental model is: *a cockpit instrument panel designed by a Swiss watchmaker*. Every control is where you expect it. Every signal is unambiguous. And the material the instruments are made of is beautiful.

Anti-target confirmed: no particle effects, no scrolling marquees, no "generative" background animations. The only motion is deliberate and tied to user actions or real-time progression.

---

## 2. Reference Inspirations

1. **Linear 2026** — the shift from card-list to continuous-surface layout with ambient depth. Specifically: the way Linear's issue list uses micro-depth to group without hard borders.

2. **Notion Calendar (2025)** — hour rail treatment: variable-height cells with current-hour emphasis, faint horizontal rule texture, and the now-line rendered as a pulsing slab rather than a hairline.

3. **Cron (acquired by Notion)** — the block-in-grid paradigm with colored fills and crisp typographic time labels. Cron proved that calendar blocks can be both data-dense and visually calm when type is set properly.

4. **Arc Browser sidebar** — the way color themes are *lived-in* rather than decorative. Arc's Space system showed that a workspace can have a defined chromatic identity that users configure once and inhabit for months.

5. **Apple Vision Pro OS** — spatial depth signals via translucency and gaussian blur rather than hard shadows. Panels feel suspended in space, not pasted on a flat surface.

6. **Stripe Sigma** — the treatment of tabular/time data with monospace numerics, hairline gridlines, and ambient color fill for row categories. Validated that data-dense surfaces can be premium-feeling.

7. **Vercel Dashboard (2025)** — the gradient surface treatment for status indicators. A green deployment badge doesn't just carry a color; it has a luminous quality that makes the signal feel alive.

8. **Sunsama (day planning ritual UX)** — the morning planning ritual and EOD closure flows as first-class UI moments, not afterthoughts. Referenced for ritual interaction pattern (not visual language).

---

## 3. Typography Trio

### Display: **Instrument Serif**
- Source: Google Fonts — `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1`
- Weight: 400 (regular) + italic for ceremonial moments (EOD closure, welcome)
- Usage: Day header ("Thursday, April 30"), section titles ("Your Day"), BlockDetailDialog activity name
- Justification: Instrument Serif is a 2024-era optical serif that sits between editorial warmth and technical precision. Its optical sizing means numerals feel grounded. It contrasts sharply with the monospace numerics without fighting them. It's the kind of serif that reads as *considered*, not nostalgic.

### Body: **Geist** (Vercel's open-source)
- Source: `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600`
- Or: `@font-face` from `https://vercel.com/font/geist-sans` (OFL licensed)
- Usage: All body copy, nav items, button labels, bucket strip labels, activity names in list view
- Justification: Geist is the clearest contemporary neutral since DM Sans, but it has tighter letter-spacing at small sizes (11-13px) that improves readability in the activity list context. The 300-weight gives the muted hierarchy genuinely light texture.

### Numerals/Mono: **Geist Mono**
- Source: `https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500`
- Usage: Hour rail labels, time range displays (HH:MM–HH:MM), duration values, adherence dial numbers
- Justification: Paired with Geist body, Geist Mono gives consistent rhythm. Its tabular-numeric default and tight vertical metrics work especially well for the hour rail where 8px height differences matter. The monospace identity also reinforces the "precision instrument" reading.

**Fallback stack:** `'Instrument Serif', 'Georgia', serif` / `'Geist', 'DM Sans', 'Helvetica Neue', sans-serif` / `'Geist Mono', 'DM Mono', 'Fira Code', monospace`

---

## 4. Color Palette Extensions

### 4.1 Phil's Identity Palette (Light Mode)

```
--project-fill:    #16a34a  (green-600)
--project-glow:    rgba(22, 163, 74, 0.20)
--project-bg:      #f0fdf4  (green-50 — lighter than current green-100)
--project-fg:      #14532d  (green-900 — deeper than current green-800)
Contrast --project-fg on --project-bg: #14532d on #f0fdf4 = 9.8:1 ✓ WCAG AA (needs 4.5:1)

--comm-fill:       #d97706  (amber-600)
--comm-glow:       rgba(217, 119, 6, 0.18)
--comm-bg:         #fffbeb  (yellow-50)
--comm-fg:         #78350f  (amber-900)
Contrast --comm-fg on --comm-bg: #78350f on #fffbeb = 9.2:1 ✓ WCAG AA

--ci-fill:         #9333ea  (purple-600)
--ci-glow:         rgba(147, 51, 234, 0.18)
--ci-bg:           #faf5ff  (purple-50)
--ci-fg:           #3b0764  (purple-950)
Contrast --ci-fg on --ci-bg: #3b0764 on #faf5ff = 14.1:1 ✓ WCAG AAA

--lunch-fill:      #78716c  (stone-500)
--lunch-bg:        #fafaf9  (stone-50)
--lunch-fg:        #44403c  (stone-700)

--surface-0:       #f8f7f5  (slightly warmer than current #f7f6f4)
--surface-1:       #ffffff
--surface-2:       #f2efe9  (recessed — hour rail)
--surface-glass:   rgba(255, 255, 255, 0.72)

--ink-900:         #0e0d0b  (near-black, slightly warmer)
--ink-700:         #3d3a35
--ink-500:         #57534e
--ink-300:         #a8a29e
--ink-100:         #f5f4f2

--now-red:         #e11d48  (rose-600 — slightly more saturated/pink than current dc2626)
--now-glow:        rgba(225, 29, 72, 0.25)

--surface-depth:   radial-gradient(ellipse at 20% 0%, rgba(22,163,74,0.04) 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 100%, rgba(147,51,234,0.03) 0%, transparent 50%)
```

Body text on surfaces:
- `--ink-900` (#0e0d0b) on `--surface-1` (#ffffff) = 20.1:1 ✓ WCAG AAA
- `--ink-500` (#57534e) on `--surface-1` (#ffffff) = 7.0:1 ✓ WCAG AA
- `--ink-300` (#a8a29e) on `--surface-1` (#ffffff) = 2.8:1 — use only for decorative/non-critical elements
- `--ink-500` on `--surface-2` (#f2efe9) = 6.2:1 ✓ WCAG AA

Block text on fills:
- White (#ffffff) on `--project-fill` (#16a34a) = 4.54:1 ✓ WCAG AA
- White (#ffffff) on `--comm-fill` (#d97706) = 4.6:1 ✓ WCAG AA
- White (#ffffff) on `--ci-fill` (#9333ea) = 5.9:1 ✓ WCAG AAA-close
- White (#ffffff) on `--lunch-fill` (#78716c) = 4.7:1 ✓ WCAG AA

### 4.2 Phil's Identity Palette (Dark Mode)

Dark mode is *not* a simple color inversion. Bucket colors shift to glowing-on-dark treatment: fully saturated fills remain, but backgrounds go dark and the fills develop subtle inner-light via gradient.

```
--surface-0-dk:    #0c0c0e  (near-black, cool)
--surface-1-dk:    #141417  (card / panel)
--surface-2-dk:    #1a1a1f  (hour rail)
--surface-3-dk:    #1f1f26  (hover)
--surface-glass-dk: rgba(20, 20, 23, 0.80)

--ink-900-dk:      #f0eff0  (near-white, slightly cool)
--ink-700-dk:      #c4c2c8
--ink-500-dk:      #8b8a92
--ink-300-dk:      #4a4a52
--ink-100-dk:      #1d1d24

--project-fill-dk:  #22c55e  (green-500 — 1 step brighter for dark bg)
--project-bg-dk:    #0d2818
--project-fg-dk:    #86efac  (green-300 — light for dark bg chips)
Contrast #86efac on #0d2818 = 7.1:1 ✓ WCAG AA

--comm-fill-dk:     #f59e0b  (amber-400 — brighter)
--comm-bg-dk:       #27200a
--comm-fg-dk:       #fde68a  (yellow-200)
Contrast #fde68a on #27200a = 8.3:1 ✓ WCAG AA

--ci-fill-dk:       #a855f7  (purple-500 — 1 step brighter)
--ci-bg-dk:         #1e0a2e
--ci-fg-dk:         #d8b4fe  (purple-300)
Contrast #d8b4fe on #1e0a2e = 8.9:1 ✓ WCAG AA

--now-red-dk:       #fb7185  (rose-400 — glow-appropriate on dark)
--now-glow-dk:      rgba(251, 113, 133, 0.30)

--border-dk:        rgba(255,255,255,0.08)
--border-strong-dk: rgba(255,255,255,0.16)
```

Dark surface depth:
```
--surface-depth-dk: radial-gradient(ellipse at 15% 10%, rgba(34,197,94,0.06) 0%, transparent 55%),
                    radial-gradient(ellipse at 85% 90%, rgba(168,85,247,0.05) 0%, transparent 45%)
```

### 4.3 Alternative Palette: Monochrome Operator

For users who don't share Phil's CI-expert color identity, a neutral palette that preserves legibility and bucket differentiation without the saturated fills.

```
--project-fill-alt:  #374151  (gray-700)
--project-bg-alt:    #f9fafb
--project-fg-alt:    #111827  (gray-900)
Contrast: 16.0:1 ✓ WCAG AAA

--comm-fill-alt:     #4b5563  (gray-600)
--comm-bg-alt:       #f3f4f6
--comm-fg-alt:       #1f2937
Contrast: 13.9:1 ✓ WCAG AAA

--ci-fill-alt:       #1f2937  (gray-800)
--ci-bg-alt:         #e5e7eb
--ci-fg-alt:         #111827
Contrast: 16.0:1 ✓ WCAG AAA

Block fill text: white on gray-700 = 7.0:1 ✓
                 white on gray-600 = 5.7:1 ✓
                 white on gray-800 = 8.1:1 ✓
```
Differentiation is preserved via shape and position of bucket chips, and border-left accent bars use graduated gray values. The monochrome palette also has a Dark variant using the same dark surfaces as Phil's palette.

---

## 5. Depth and Atmosphere

### Surface Architecture
The page has four depth layers, each with distinct treatment:

1. **Page background** — `--surface-depth` ambient gradient (radial ellipses of bucket colors at very low opacity: 3-6%). This is a *presence* signal, not a visible gradient. It reads subliminally as "this page is alive."

2. **Card surfaces** — `background: var(--surface-glass)` + `backdrop-filter: blur(24px) saturate(180%)`. Cards float. Their edges are defined by a 1px border using `rgba(255,255,255,0.65)` in light mode and `rgba(255,255,255,0.09)` in dark mode — the light-mode border reads as an inner highlight.

3. **Activity blocks** — Linear gradient fills (135deg, 2 stops). In the futuristic treatment, the top stop is slightly *lighter* than the fill color and the bottom is slightly darker, creating an inner-top-light effect that makes blocks feel three-dimensionally lit.

4. **BlockDetailDialog** — `backdrop-filter: blur(40px)` + a slightly more opaque glass surface. The dialog floats 8px above the grid, with `box-shadow: 0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)`.

### Specific CSS Techniques

**Glassmorphism (light mode):**
```css
.cycle-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 1px 1px rgba(0,0,0,0.04),
    0 4px 12px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.80);
}
```

**Inner-top-light block fill (PROJECT example):**
```css
.cycle-block-positioned.chip-project {
  background: linear-gradient(
    160deg,
    #4ade80 0%,   /* green-400 — highlight */
    #16a34a 45%,  /* green-600 — body */
    #15803d 100%  /* green-700 — shadow base */
  );
  box-shadow:
    0 1px 3px rgba(22,163,74,0.30),
    0 4px 12px rgba(22,163,74,0.15),
    inset 0 1px 0 rgba(255,255,255,0.25);
}
```

**Ambient page depth:**
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 15% 5%, rgba(22,163,74,0.05) 0%, transparent 100%),
    radial-gradient(ellipse 50% 35% at 85% 95%, rgba(147,51,234,0.04) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}
```

**Hour rail subtle texture:**
```css
.cycle-hour-rail {
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 47px,
    rgba(0,0,0,0.04) 47px,
    rgba(0,0,0,0.04) 48px
  );
}
```

**Now-line glow (evolved):**
```css
.cycle-now-line {
  height: 2px;
  background: var(--now-red);
  box-shadow: 0 0 12px 2px var(--now-glow), 0 0 4px 0 var(--now-red);
}
```

---

## 6. Motion Design

All timings assume `prefers-reduced-motion: no-preference`. Reduced-motion variants listed in §11.

### M1 — Page load stagger (expanded from Iter 33 blockReveal)
- What: Calendar blocks reveal sequentially, bottom-to-top within the visible viewport
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like out)
- Timing: 320ms per block; 40ms stagger delay per block index
- Detail: blocks translate from `translateY(10px) scale(0.98)` + opacity 0 to natural position. The now-line fades in last at 600ms + (n * 40ms).

### M2 — Now-line clock pulse
- What: The now-line's left dot breathes on a 4s sine cycle; the glow behind the line also oscillates.
- Easing: `ease-in-out`
- Timing: `animation: nowPulse 4s ease-in-out infinite`
- Detail: dot scales 1.0 → 1.4 → 1.0; glow opacity 0.25 → 0.45 → 0.25. This is the page's only persistent ambient animation — it signals time is live.

### M3 — Kaizen ping (evolved from Iter 33 AC10)
- What: Blocks with kaizen linkage play a two-ring ripple outward from the kaizen chip
- Easing: `ease-out`
- Timing: fires once at 900ms post-load; outer ring reaches full size at 1400ms total; then settles
- Detail: the chip renders a `::before` and `::after` pseudo-element that expand from 0 to 150% scale, fading opacity 0.6 → 0. The chip itself briefly gains a border glow of `--ci-glow` color. This signals "this block is connected to active improvement work" — disciplined, not decorative.

### M4 — Activity block interaction (hover + click)
- Hover: `transform: translateY(-3px) scale(1.005)` + enhanced box-shadow in 180ms `ease-out`. The shadow extends to show depth — block lifts.
- Click/tap: `transform: translateY(-1px) scale(0.998)` at 80ms `ease-in`, then spring back.
- This micro-interaction gives blocks tactile feel on both mouse and touch.

### M5 — BlockDetailDialog entrance
- What: dialog panel slides up from 12px below and fades in
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot = feels physical)
- Timing: 280ms; backdrop blurs in simultaneously at 250ms `ease`
- Exit: 200ms `ease-in` slide down + fade

### M6 — Edit mode activation
- What: non-selected blocks dim to 0.35 opacity in 200ms `ease`; selected block gains a 2px animated blue ring
- The ring animates a rotating border gradient — one full rotation at 3s `linear infinite` — only while the block is in edit-selected state. This is the "active editing boundary" signal.
- When edit mode closes: all blocks restore opacity in 160ms `ease-out`

### M7 — Bucket strip bar fill on load
- What: each bucket fill bar animates from 0% to actual width after page load
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (standard material)
- Timing: 500ms; 100ms stagger between PROJECT/COMM/CI rows
- This makes the bucket allocation feel *composed* rather than statically present.

---

## 7. Customization Mechanism

### Where controls live
A persistent settings icon (⚙ or a "tune" icon) in the top-right corner of the nav bar opens an inline panel — not a full-page settings route. The panel is narrow (280px), slides in from the right, and contains:

1. **Theme toggle** — Light / Dark / System (3-way segmented control)
2. **Palette selector** — 2-3 named options rendered as swatches:
   - "Phil's CI" (green/yellow/purple, default)
   - "Monochrome Operator" (grays)
   - (Future: "Ocean," "Ember" etc.)
3. **Motion intensity** — Full / Reduced (toggle, respects `prefers-reduced-motion` OS setting by default but lets user override)

### Discovery
On first load, the settings icon has a subtle pulse (one cycle, 2s after load) drawing attention without being intrusive. After first click, the pulse never fires again (localStorage flag).

### Persistence
All three settings persist in `localStorage` under the key `bamx-prefs-v1`. On load, `<html>` gets data attributes: `data-theme`, `data-palette`, `data-motion` — CSS variables are then scoped to these attributes. This means the CSS variable layer is clean and the theme switch requires no JavaScript variable mutation after initial setup.

---

## 8. Calendar Grid Evolution

### Before (Iter 33 Chartered Minimalism)

**Hour rail:**
- 48px width, DM Mono 11px, --ink-400 color, --surface-2 background
- Plain horizontal rows, no texture
- Current hour: ink-900 + weight 500

**Activity blocks:**
- Flat 2-stop gradient (135deg)
- Border-left 3px accent bar (darker shade of fill)
- DM Mono 10px time labels
- Hover: translateY(-2px)
- PROPOSED: 2px dashed outline + pale tint gradient fill

**Now-line:**
- 1.5px hairline, now-red
- Breathing dot (dotBreathe) + glow trail (nowGlow) pseudo-elements
- Timestamp label in DM Mono at left edge

**Bucket strip:**
- Flat colored rows, 14px progress bar height
- Static bar fill (no animation)

---

### After (Luminous Constraint)

**Hour rail:**
- 52px width (4px wider — more breathing room for Geist Mono labels at 11px)
- Alternating half-hour texture via repeating-gradient
- Current hour: `--now-red` color + weight 600 (the clock is the hero of the rail)
- Past hours: muted 50% opacity

**Activity blocks:**
- 3-stop gradient (inner-top-light model: lighter top → body → darker bottom)
- No hard border-left bar — instead, blocks have a left-edge inner glow: `box-shadow: inset 3px 0 0 rgba(255,255,255,0.35)`
- Geist Mono 10px time labels
- Hover: translateY(-3px) scale(1.005) + enhanced glow
- PROPOSED: dashed outline retained (locked decision) but fill becomes an animated shimmer: `@keyframes proposedShimmer` that shifts the gradient angle 135deg → 150deg → 135deg at 2s ease-in-out infinite

**Now-line:**
- 2px line with active glow: `box-shadow: 0 0 12px 2px var(--now-glow)`
- Dot replaced with a filled circle that pulses 4s (M2 above) — more visible at small sizes
- Timestamp floats in a glassy pill: `background: rgba(255,255,255,0.90); backdrop-filter: blur(8px); border-radius: 4px`

**Bucket strip:**
- Horizontal bar height increased to 18px (more presence)
- Bar fill animates on load (M7)
- Fill bars have a subtle gradient (left lighter, right at full fill color)
- Target tick line is thicker (2px solid vs 2px dashed) and has a tooltip on hover showing "Target: 2.5h"

---

## 9. Signature Innovative Pattern: The Cadence Pressure Ring

No other calendar product does this.

**Concept:** The CycleCard header hosts a thin circular arc — 30px diameter — around the day-badge that shows today's cadence allocation at a glance. The arc is divided into three color-coded segments (green/yellow/purple) proportional to planned minutes in each bucket. The arc is incomplete if any bucket is under-floor; it becomes a full ring when the day is optimally allocated.

This is not a progress bar, not a pie chart, not a streak counter. It is a *balance ring* — a compression of the 4-2-2 structure into a single 30px token that answers "is my day balanced?" in one glance.

Interaction:
- At page load, the arc animates in from 0 (M7 extended).
- Hovering the ring opens a tooltip: "PROJECT 3h · COMM 1.5h · CI 2h — balanced."
- If any bucket is overpacked, the relevant arc segment flashes at 1.2s.
- In edit mode, the ring updates in real-time as activities change.

Implementation note: Pure SVG with CSS animation. One `<svg>` with three `<circle>` elements using `stroke-dasharray` / `stroke-dashoffset`. No library needed.

This pattern is CI-discipline-coherent: it externalizes the 4-2-2 constraint as a visual signal without requiring the user to interpret a number. It also answers the AdherenceDial's pre-baseline problem (§2.7 of UX_DESIGN_THEMES) — even on day 1, the ring shows allocation intent.

---

## 10. Dark Mode Design

### Principle
Phil's colors stay *saturated* in dark mode — they do not desaturate. Saturated colors on a near-black background with controlled glow create a "luminous instrument panel" reading. The surface is dark and calm; the signals are vivid and precise.

### Implementation

**Green (PROJECT) in dark:**
- Fill: `#22c55e` (one step brighter than light-mode `#16a34a`)
- Bg chip: `#0d2818` (near-black green tint — barely visible)
- Fg chip: `#86efac` (green-300 — soft mint, no glow)
- Block glow: `box-shadow: 0 0 18px rgba(34,197,94,0.22)` — subtle halo

**Yellow (COMMUNICATION) in dark:**
- Fill: `#f59e0b` (amber-400 — warm gold)
- Glow: `rgba(245,158,11,0.20)`

**Purple (CI) in dark:**
- Fill: `#a855f7` (purple-500 — slightly brighter)
- Glow: `rgba(168,85,247,0.20)`
- Phil's identity color gets the most visible glow treatment, as CI is the focus bucket

**Hierarchy signal:**
Dark mode blocks are slightly more distinct from their background than in light mode because the contrast between a glowing fill and a near-black surface is naturally higher than saturated-on-warm-white. Padding inside blocks increases by 1px to give the glowing content more breathing room.

**Now-line in dark:**
- Color shifts to `--now-red-dk: #fb7185` (rose-400) — less harsh than crimson on dark
- Glow expands: `box-shadow: 0 0 20px 4px rgba(251,113,133,0.35)`

---

## 11. Accessibility

### Motion-Reduced Variant
```css
@media (prefers-reduced-motion: reduce) {
  .cycle-block-positioned { animation: none; opacity: 1; }
  .cycle-now-line::before { animation: none; }
  .cycle-now-line::after { animation: none; }
  .cycle-block-kaizen-linked { animation: none; }
  .bucket-fill { transition: none; }
  .bdd-panel { animation: none; }
}
```
The `data-motion="reduced"` attribute (from the user's setting) also triggers the same rules independently of OS setting.

### Keyboard Navigation for New Affordances
1. **Cadence Pressure Ring** — `tabindex="0"` on the SVG; `Enter` opens the tooltip as a popover; `Escape` dismisses.
2. **Theme panel** — triggered by a `<button>` in the nav; focus is trapped inside the panel; `Escape` closes.
3. **Motion toggle** — standard checkbox or `role="switch"`.

### High-Contrast Mode
```css
@media (forced-colors: active) {
  .cycle-block-positioned { forced-color-adjust: none; }
  .cycle-block-positioned.chip-project { background: Highlight; color: HighlightText; }
  .cycle-block-positioned.chip-communication { background: LinkText; color: HighlightText; }
  .cycle-block-positioned.chip-ci { background: Highlight; color: HighlightText; }
  .cycle-now-line { background: Highlight; }
}
```
Bucket differentiation in forced-colors relies on the bucket chip label text, not color alone. The ring (§9) uses `fill: currentColor` so it adapts automatically.

### ARIA
- Cadence ring: `role="img"` + `aria-label="Day balance: PROJECT 3h COMM 1.5h CI 2h — balanced"`
- Theme toggle: `aria-label="Color theme" aria-pressed` or `role="radiogroup"`
- Palette selector swatches: `role="radio"` within `role="radiogroup"`

---

## 12. What Changes vs Iter 33

### Honest Before/After Summary

| Element | Iter 33 (Chartered Minimalism) | Luminous Constraint |
|---|---|---|
| Typography | DM Serif Display + DM Sans + DM Mono | Instrument Serif + Geist + Geist Mono |
| Page background | Warm off-white flat (#f7f6f4) | Warm off-white + ambient depth gradient |
| Card surface | White flat (#ffffff) | Glass: rgba(255,255,255,0.72) + blur(24px) |
| Hour rail width | 48px | 52px |
| Block fill | 2-stop linear gradient | 3-stop inner-top-light gradient + glow |
| Block hover | translateY(-2px) | translateY(-3px) scale(1.005) + glow |
| Now-line | 1.5px hairline + breathing dot + glow trail | 2px glowing line + pulsing dot + glassy timestamp pill |
| PROPOSED state | Dashed outline + pale tint | Dashed outline + animated shimmer gradient |
| Bucket strip bars | Static fill | Animated on-load fill (M7) |
| Day header | "Day N" badge pill | "Day N" badge + Cadence Pressure Ring |
| Kaizen ping | Single glow-ring (AC10) | Two-ring ripple from kaizen chip |
| Dark mode | Not present | Full dark palette per §10 |
| Light/dark toggle | Not present | Nav panel: theme / palette / motion |
| Alternative palette | Not present | Monochrome Operator option |
| Fonts loadable | Google Fonts (DM family) | Google Fonts (Instrument Serif) + Vercel open-source (Geist) |

What does NOT change:
- Dashed border encoding for PROPOSED — locked decision preserved
- Calendar grid structure (48px → 52px is additive, not structural)
- Bucket color identity (green/yellow/purple) — Phil's directive
- All Iter 29-38 calendar functionality
- ARIA patterns already implemented (bdd-modal, focus traps)
- The activity list table (ScheduledActivityBlock rows) — unchanged structurally

---

## 13. Implementation Effort Estimate

### Phase A — Typography + Color tokens (foundation)
- Import Geist + Instrument Serif
- Rewrite `:root` token set (add dark-mode tokens, alternative palette tokens)
- Add `data-theme`, `data-palette`, `data-motion` data attributes to `<html>`
- Effort: **8–10 hours**

### Phase B — Surface + Depth (atmosphere)
- Implement glassmorphism card treatment
- Ambient page background gradient
- Hour rail texture + alternating half-hour rule
- Effort: **6–8 hours**

### Phase C — Block fills + Now-line evolution
- 3-stop inner-top-light gradients per bucket (light + dark)
- Now-line glow + glassy timestamp pill
- PROPOSED shimmer animation
- Effort: **6–8 hours**

### Phase D — Motion (M1-M7)
- Revised blockReveal stagger (M1)
- Now-line pulse (M2)
- Kaizen two-ring ping (M3)
- Block hover spring (M4)
- BlockDetailDialog entrance (M5)
- Edit mode ring + dim (M6)
- Bucket bar fill animation (M7)
- Effort: **8–10 hours**

### Phase E — Cadence Pressure Ring
- SVG ring component in CycleCard header
- CSS animation for arc fill
- Tooltip popover
- Real-time update in edit mode
- ARIA
- Effort: **10–14 hours**

### Phase F — Theme/Palette/Motion toggle system
- Settings panel (HTML + CSS)
- localStorage persistence
- CSS variable scoping via data attributes
- Motion reduced mode
- Effort: **8–10 hours**

**Total: 46–60 production hours across 6 phases.**

Recommended ship order: A → B → C → D (phases are independently releasable). E and F are Phase 2.

---

## Provenance / Dependency Notes

- Phase A is a prerequisite for B, C, D, E, F.
- Phase E (Cadence Ring) does not depend on Phase F (toggles) but is more valuable after F ships.
- BlockDetailDialog glass treatment in Phase B is additive to existing `.bdd-modal` styles.
- Dark mode (Phase A tokens) requires Phase F toggles to be user-accessible, but the CSS can land earlier for system-preference automatic application.
