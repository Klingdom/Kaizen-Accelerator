# UX Direction Proposal — Today Page Redesign
# "Operational Glass"

Owner: UX Designer
Status: Proposal — awaiting Phil approval before any sprint scoping
Constraint scope: Hard constraints from Iter 29–38 are preserved throughout. §6.5 boundary maintained — no composer, engine, types, or events are touched.

---

## 1. Creative Direction Statement

The aesthetic is **Operational Glass** — the visual language of high-stakes operator environments where information density and emotional calm must coexist. Think the inside of a Bloomberg terminal if Bloomberg had a taste budget: data-forward, spatially layered, always readable at 06:00 with one eye open. Glass panels with controlled frosted transparency create depth without clutter. Type is set with extreme authority — large numerals carry the day's pulse; small labels are whisper-small and muted. Color is restrained to Phil's existing three-bucket identity (green / yellow / purple) but given new luminosity treatment: on dark backgrounds they glow softly rather than sitting flat. Motion is deliberate, not decorative — the only things that animate are the things that changed. The result should feel like a Bloomberg / Linear / Stripe Sigma hybrid raised specifically for the 4-2-2 operating context: a tool a disciplined operator is proud to open at day-start.

---

## 2. Tension Acknowledgment — Calm Tool vs Futuristic Signal

The tension is real and must be resolved explicitly, not evaded.

**What "futuristic" usually means in 2026:** glassmorphism panels, particle backgrounds, neon gradients, cursor-trail effects, AI-companion chat bubbles, holographic shimmer. These patterns originate from gaming UIs and crypto dashboards. They perform innovation. They also produce cognitive noise, slow perceived response time, and signal "beta product" to senior operators.

**What BAM-X is:** a CI-discipline execution tool for knowledge workers running structured standard work. Its core claim is *evidence over opinion, discipline over improvisation*. The design must reinforce that claim. A neon gradient on a Kaizen chip undermines it.

**Resolution:**

- Futuristic reads as *precision* and *intelligence*, not spectacle. The futuristic signal comes from: spatial depth, sub-pixel rendering, data confidence (no empty states, no placeholder dashes), and one or two interactive patterns no other calendar ships.
- Modern reads as the Linear / Stripe Sigma / Cron tier: monochromatic base, no border radius excess, type doing real work, interactions that feel instantaneous.
- Loud effects are rejected. Subtle glows, controlled blur, and fluid micro-transitions are accepted.
- The Kaizen ping glow-ring from Iter 33 survives because it is CI-coherent: it signals a live discipline checkpoint, not decoration.
- **Where futuristic wins:** the Now-line, the bucket strip, the Kaizen chip state, the dark mode atmosphere.
- **Where calm wins:** block bodies, dialog behavior, the header, all copy.

---

## 3. Visual Language Proposal

### 3.1 Typography

**Primary typeface: Geist (Vercel, free).**
Rationale: Linear uses it as of mid-2025; it is the clearest signal of the 2025–2026 tool tier. Monospace numerals in Geist make time ranges and KPI numbers lock in place across changing states. It has a Mono variant that can carry the hour rail without importing a second family.

**Secondary / display: Geist Mono** for hour-rail timestamps, time-range labels inside blocks, and all numeric KPIs (adherence percentages, bucket totals).

**Scale:**
- Day/date heading: 32px / weight 600 — the largest element on the page; earns its prominence
- Block activity name: 14px / weight 500
- Block time range: 12px Geist Mono / weight 400 — tabular alignment already correct per Sprint 16a
- Hour rail labels: 11px Geist Mono / muted (--text-quaternary token)
- Bucket strip totals: 18px Geist Mono / weight 600
- NowPane label: 12px / weight 500

**What changes from current:** Inter → Geist. No other font is introduced. The swap is a CSS `font-family` token change. All em-based sizing is preserved.

### 3.2 Color Extensions (alongside Phil's identity)

Phil's bucket identity is locked:
- PROJECT: green (`#22c55e` family)
- COMMUNICATION: yellow (`#eab308` family)
- CI: purple (`#a855f7` family)
- Lunch / protected: muted slate

**Dark mode extensions (see §7 for full dark variant):**
- PROJECT glow: `#22c55e` at 60% saturation, 8px blur halo on block border
- COMMUNICATION glow: `#eab308` at 60% saturation
- CI glow: `#a855f7` at 60% saturation
- Background: `#0a0a0f` — near-black with a slight blue undertone (not pure black; pure black reads as app-dead)
- Surface panel: `#111118` with `backdrop-filter: blur(12px)` on floating elements
- Glass overlay (modals, drawers): `rgba(17, 17, 24, 0.85)` + blur

**Light mode (current default):**
- Background: `#f8f9fb` — off-white, not pure white (pure white reads as unstyled)
- Surface: `#ffffff`
- Glass: `rgba(255, 255, 255, 0.80)` + blur for floating surfaces
- Phil's bucket hues remain unchanged

**New semantic tokens to add (no §6.5 touch):**
These are CSS custom property additions to `app.css` only, not engine/type changes:
```
--surface-glass: rgba(255,255,255,0.80)
--blur-panel: blur(12px)
--glow-project: 0 0 8px rgba(34, 197, 94, 0.35)
--glow-comm: 0 0 8px rgba(234, 179, 8, 0.35)
--glow-ci: 0 0 8px rgba(168, 85, 247, 0.35)
--color-bg-base: #f8f9fb  (light) / #0a0a0f (dark)
--color-surface: #ffffff  (light) / #111118 (dark)
```

### 3.3 Depth and Atmosphere

**Layering model (3 z-levels):**

1. **Ground** — the calendar grid, hour rail, background. Flat, no shadow.
2. **Cards** — activity blocks float 2px above ground with a `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`. No border unless selected.
3. **Glass** — drawers, dialogs, the bucket strip panel. Glass treatment: frosted backdrop filter, thin 1px border at `rgba(255,255,255,0.12)`.

This is spatial depth without parallax gimmicks. The eye perceives hierarchy immediately.

### 3.4 Motion Vocabulary

Four motion types, each with a reduced-motion fallback (see §8):

| Motion | Trigger | Duration | Reduced fallback |
|---|---|---|---|
| Block slide-in | New block appears (reflow / auto-plan) | 120ms ease-out | instant |
| Now-line pulse | Every 60s update | 400ms opacity fade | no pulse, static |
| Kaizen glow-ring ping | Kaizen chip enters view | 600ms radial expand then fade | static ring, no animation |
| Bucket refill | Bucket total changes after commit | 200ms number count-up | instant swap |

No spring physics. No bounce. No cursor trails. Duration ceiling: 600ms. Nothing that runs on scroll.

---

## 4. Customization Framework

### 4.1 The Six Dimensions

| Dimension | Options | Proposed Default | Rationale |
|---|---|---|---|
| **Theme** | Light / Dark / System | **System** | Respects OS setting; no forced choice at first run |
| **Color palette** | Phil's Identity / Calm Neutral / High Contrast | **Phil's Identity** | Current palette is already calibrated; no regression risk |
| **Density** | Compact (44px min block) / Standard (60px) / Spacious (80px) | **Standard** | Matches current block sizing; most legible without scrolling |
| **Motion** | Full / Reduced / None | **Full** | `prefers-reduced-motion` overrides this if OS flag is set |
| **Widgets** | Toggle each: bucket strip / day badge / EOD CTA / NowPane | All on by default | Users who want a cleaner grid can declutter |
| **Font** | Geist (new default) / Inter (legacy) | **Geist** | Forward-looking; Inter remains for users who reject the swap |

**Palette options in detail:**

- **Phil's Identity** — current green / yellow / purple at current saturation. Default.
- **Calm Neutral** — PROJECT: slate-blue (`#3b82f6`), COMMUNICATION: teal (`#14b8a6`), CI: indigo (`#6366f1`). Softer; better for low-contrast environments.
- **High Contrast** — PROJECT: `#16a34a` (darker green), COMMUNICATION: `#b45309` (amber, not yellow — higher contrast), CI: `#7c3aed` (deeper purple). WCAG AA on all backgrounds.

### 4.2 Where Settings Live

**Proposal: dedicated `/settings` route, entry point via header icon.**

Rationale:
- The `/settings` route already exists in the UX_FLOWS.md IA (§1.2). It currently holds role, capacity, and sprint anchor date.
- Adding a "Appearance" section alongside those existing settings is low cost and architecturally consistent.
- In-context popovers (e.g., a paint-brush icon in the Today header) are discoverable but they push settings state management into Today.js, violating the single-responsibility principle.
- A header-level "gear" icon that routes to `/settings#appearance` is the correct pattern.

**Settings page structure:**
```
/settings
  Account
    — role, capacity, sprint anchor date (existing)
  Appearance
    — Theme (segmented: Light / Dark / System)
    — Color palette (3 swatches with labels)
    — Density (segmented: Compact / Standard / Spacious)
    — Motion (segmented: Full / Reduced / None)
    — Widgets (checklist: bucket strip, day badge, EOD CTA, NowPane)
    — Font (segmented: Geist / Inter)
  Notifications (placeholder for future)
```

**User discovery:**
- First-run (day 0): after the user accepts their first plan, a one-time dismissible tip chip appears below the header: "Customize your workspace in Settings →". Chip appears once, dismisses on click, never reappears.
- Returning users: gear icon in the top-right header, always present. No mystery.
- No onboarding wizard step added. Customization is opt-in discovery, not a mandatory setup gate.

### 4.3 Settings Storage

Settings persist to `localStorage` keyed by userId under `bamx_prefs_v1`. Server-sync is not required for MVP. If storage is cleared, defaults restore silently — no error state.

### 4.4 Phil's Input Required on Defaults

See §9 for full list. The four default decisions that most need Phil's confirmation:
1. Theme default: System vs Dark (if BAM-X positions as a dark-first tool)
2. Font: Geist vs Inter — is the sprint cost of the font swap worth the positioning signal?
3. Density default: Standard (current) vs Compact (more blocks visible without scroll on 1280px)
4. Widget defaults: should EOD CTA be on-by-default for day-1 users, or only after day 7?

---

## 5. Calendar Grid Evolution

### 5.1 Hour Rail

**What stays:** vertical hour labels, current time markers, the now-line.

**What changes:**
- Hour labels switch to Geist Mono, 11px, `--text-quaternary` token (very muted). They should be barely visible — a scaffold, not a feature.
- Hour labels align to the top of each row, not centered (top-aligned reads as a true timeline more than centered).
- Hour rail width: 48px (current is 60px after Sprint 16a time-range change widened `.sa-block` column). The rail itself can be narrower; the block's time range column carries the precise label.
- Minor tick marks (30-min) rendered as 1px `--border-subtle` lines, no label. They provide snap reference without adding noise.

### 5.2 Activity Block Visual Treatment

**Current treatment (Iter 33 Chartered Minimalism):** gradient top-to-bottom from bucket hue at ~15% opacity to white, 4px left border in solid bucket hue. This is good. It is not replaced; it is evolved.

**Evolution:**

- **Left border:** stays. The 4px bucket-color left border is the primary identity signal. Increase to 3px on compact, 4px standard, 5px spacious.
- **Block body:** gradient evolves from linear top-bottom to a very subtle radial "inner light" — a `radial-gradient(ellipse at 20% 40%, rgba(bucket, 0.12) 0%, transparent 70%)`. This reads as depth, not a flat wash.
- **Selected block:** 1px outline in bucket color at full opacity (not a shadow — outlines don't affect layout). No fill change.
- **In-progress block:** adds the bucket-color `box-shadow` glow token (`--glow-project`, `--glow-comm`, or `--glow-ci`) at 50% intensity. This makes the active block visibly alive without animation.
- **Closed block:** existing `opacity: 0.55` preserved per T10 append-only pattern.
- **Skipped block:** existing red border + `#fef2f2` background preserved.
- **Protected block:** no drag handles (preserved). Visual: lock icon `🔒` replaces the drag-grip icon in the block gutter. 12px, `--text-muted`.
- **User-edited block (W4):** existing `data-user-edited` desaturation preserved. In the new radial gradient, desaturated state reduces the radial to 5% opacity instead of 12%.

### 5.3 Now-Line Evolution

**Current:** a horizontal line across the grid.

**Evolution:**
- Line becomes a 1.5px stroke in `--color-now` token (currently primary blue; propose changing to a warm amber `#f59e0b` — distinct from any bucket color, reads as "current moment" not "action").
- Left terminus: a filled circle, 6px diameter, same amber. This creates a "playhead" metaphor — the day is playing; you are here.
- Right terminus: fades to transparent over 40px. The line does not extend to the right edge of the grid; it terminates visually, suggesting the future is unwritten.
- Now-line does NOT animate on scroll. It repaints once per minute (existing behavior preserved).
- **Reduced motion:** no change. The now-line has no animation in any variant; this is already motion-compliant.

### 5.4 Bucket Strip Evolution

**Current:** right-margin strip with 4-2-2 targets (240/120/120 minutes). Preserved structurally per hard constraints.

**Evolution:**
- Strip panel gets the glass treatment: `background: var(--surface-glass); backdrop-filter: var(--blur-panel)`. It floats above the grid background.
- Each bucket row: the progress bar evolves from a flat fill to a tapered fill — full saturation at the left (complete), tapering to 30% opacity at the right (remaining). Reads as "filled from the left" rather than a binary bar.
- Totals display as Geist Mono numerals, 18px, weight 600. Under each total, a `-- / -- min` breakdown in 11px muted text.
- Over-budget state: progress bar fill color shifts from bucket hue to `#ef4444` red (existing behavior, now more deliberate — the red should be the only red on the page when it fires).
- The strip collapses to icon-only when the `bucket strip` widget toggle is off in settings.
- **During edit mode:** BucketStrip remains fully visible (T2 fix from design themes — this is the CSS scope correction identified in UX_TODAY_V2_DESIGN §I-3). This is not a new feature; it is a bug fix that this redesign makes non-negotiable.

---

## 6. Innovative Signatures

### 6.1 Signature 1: The Discipline Pulse (primary)

**What it is:** a subtle real-time arc beneath the calendar grid's bottom edge — a condensed 24-hour arc showing the day's 4-2-2 *actual shape* as it builds. Not a chart. Not a widget. A 4px-tall arc strip, permanently docked below the hour grid, that updates as blocks close.

**Why it is different:** no other calendar or scheduler shows you the *aggregate shape* of your day as it executes. Motion shows you blocks. Sunsama shows you a time estimate total. BAM-X would show you the emerging profile of your standard work discipline — whether the day is actually becoming the 4-2-2 shape it was composed as.

**What it looks like:**
- A 100%-width horizontal bar at the bottom of the calendar grid.
- Divided into segments: green (PROJECT time closed), yellow (COMMUNICATION time closed), purple (CI time closed), slate (remaining scheduled time), very-light-gray (unscheduled).
- Width of each segment is proportional to minutes. The bar always adds up to the full workday duration (e.g., 480 minutes = 100% width).
- As blocks close throughout the day, the segment for that bucket grows in real time.
- At end of day, the bar shows whether the day's actual shape matched the 4-2-2 composition — instantly legible, no numbers required.

**CI coherence:** this is the 4-2-2 discipline made visible in real time, not just at EOD. It reinforces the operating principle without requiring any new interaction. It is a read-only, passive signal — consistent with the anti-theme against dashboard widget proliferation (A5), because it is embedded in the grid, not added above it.

**Implementation note (frontend scoping):** the Discipline Pulse is a pure CSS/rendering addition. It reads from the existing scheduled activities array (already in app state), computes bucket-minute sums, and renders. No engine touch, no event system touch.

### 6.2 Signature 2: Kaizen Chip Breath Pulse at Discipline Boundaries (secondary)

**What it is:** the existing Kaizen glow-ring ping (Iter 33 signature) fires at a second trigger: when the Discipline Pulse bar shows a bucket crossing the 50% threshold of its 4-2-2 target mid-day.

Example: the user closes their second PROJECT block, pushing PROJECT-closed minutes past 120m (50% of 240m target). The Kaizen chip on the relevant block — or the nearest CI activity in the schedule — fires a single soft glow-ring ping. One pulse, 600ms, gone.

**Why it is different:** the glow-ring was previously only a static entry-state animation. This makes it a live CI feedback signal, not just an onboarding flourish. The pulse says: *your discipline is accumulating.*

**Constraints:** the ping fires at most once per bucket per day (not on every block close — that would be noise). It does not block interaction. It fires even when `motion: reduced` only if the user has `motion: full` selected.

---

## 7. Dark Mode Design

### 7.1 Background Stack

```
--color-bg-base:    #0a0a0f   (near-black, slight blue undertone)
--color-surface:    #111118   (card / panel background)
--color-surface-raised: #1a1a24  (popover, drawer body)
--color-border:     rgba(255,255,255,0.08)
--color-border-subtle: rgba(255,255,255,0.04)
```

### 7.2 Bucket Color Translation

Dark mode does not invert Phil's colors. It *raises their brightness* so they read at the same contrast ratio against a dark background as they do against a light one.

| Bucket | Light mode hex | Dark mode hex | Luminance check |
|---|---|---|---|
| PROJECT | `#22c55e` | `#4ade80` | Passes AA on `#111118` (ratio ~5.1:1) |
| COMMUNICATION | `#eab308` | `#fbbf24` | Passes AA on `#111118` (ratio ~7.2:1) |
| CI | `#a855f7` | `#c084fc` | Passes AA on `#111118` (ratio ~4.7:1) |
| Muted/lunch | `#94a3b8` | `#64748b` raised to `#94a3b8` | Passes AA |

**Block bodies in dark mode:**
- Left border: bucket hue at dark-mode brightness (above)
- Block body: radial gradient from bucket hue at 8% opacity (reduced from 12% light) to `#111118`
- In-progress glow: `--glow-*` tokens at 40% intensity on dark (reduced — dark backgrounds amplify glow; too much reads as neon)

### 7.3 Type on Dark

- Primary text: `#f1f5f9` (not pure white — pure white causes halation)
- Secondary text: `#94a3b8`
- Muted / labels: `#475569`
- Hour rail: `#334155`

### 7.4 Now-Line on Dark

Amber `#f59e0b` playhead on dark: increase glow to `0 0 6px rgba(245, 158, 11, 0.5)`. The amber now-line on a near-black background is the most striking element on the page — it should be, because "where you are right now" is the single most important piece of information in execution mode.

---

## 8. Accessibility Considerations

### 8.1 Motion

- All animation is gated on `prefers-reduced-motion: no-preference`.
- When `prefers-reduced-motion: reduce` is detected: all transitions set to `0ms`, all glow-ring pings suppressed, Discipline Pulse updates instantly.
- The settings panel `Motion` toggle additionally allows the user to override this: `None` disables all motion even if OS flag is not set. `Full` enables motion only if OS flag is also `no-preference` (cannot override OS reduced-motion request).

### 8.2 High-Contrast Variant

- When `prefers-contrast: more` is active: all glassmorphism background blurs are removed (`backdrop-filter: none`). All surfaces render with solid backgrounds.
- Block glow tokens collapse to zero.
- Borders increase from 1px to 2px.
- This variant is tested against WCAG AA (target: all text ratios ≥ 4.5:1, all non-text contrast ≥ 3:1).
- The `High Contrast` palette option in settings independently provides higher-contrast bucket colors regardless of OS flag.

### 8.3 Keyboard Navigation for New Affordances

**Settings panel:** fully keyboard-navigable. Segmented controls use `role="radiogroup"` + `role="radio"` with arrow-key navigation. Widget toggles use `role="switch"`. All focusable via Tab.

**Discipline Pulse bar:** read-only. Receives `role="img"` and `aria-label="Day shape: X minutes PROJECT, Y minutes COMMUNICATION, Z minutes CI completed"`. Updated when values change. Not keyboard-interactive.

**Kaizen chip breath pulse:** no keyboard behavior change. The glow-ring is visual-only feedback for a pre-existing chip that is already keyboard-reachable.

**New settings gear icon in header:** `aria-label="Open settings"`, keyboard-focusable, routes to `/settings`.

### 8.4 Color-Blind Accommodation

- The three bucket colors (green / yellow / purple) are already distinct on the deuteranopia / protanopia / tritanopia axes. The Calm Neutral palette (slate-blue / teal / indigo) preserves this.
- The Discipline Pulse bar adds bucket labels as `aria-label` text on each segment. Screen readers announce the proportion even if color is not visible.
- Block left borders remain the primary identity signal (not just fill color) — shape-based differentiation, not color-only.

---

## 9. Items Requiring Phil's Input

Every item below is a default decision this proposal cannot make unilaterally. Until Phil confirms, the documented default applies.

| # | Decision | Proposed default | Stakes |
|---|---|---|---|
| P1 | **Theme default: System vs Dark** | System | If BAM-X positions as a dark-first product, Dark should be the default. Changes first impression for all new users. |
| P2 | **Font swap: Geist vs stay on Inter** | Geist | Sprint cost: one CSS token change + QA regression on all snapshot tests that contain font-family. Low risk, but Phil must confirm the positioning signal is worth it. |
| P3 | **Density default: Standard vs Compact** | Standard | Compact shows more of the day without scrolling on 1280px; Standard is current behavior. Compact may feel cramped for users with long activity names. |
| P4 | **Discipline Pulse: visible by default or widget-gated?** | Visible by default | It is the primary innovative signature. Making it opt-in reduces its impact. Making it default means all users see it on first load. |
| P5 | **Kaizen breath-pulse trigger threshold** | 50% of bucket target | 50% fires once mid-day. 25% fires earlier. 75% fires later (near success). Phil's preference on when the discipline feedback should land. |
| P6 | **Now-line color: amber vs current primary blue** | Amber (`#f59e0b`) | Amber is distinct from all bucket colors and clearly reads as "present moment." If Phil prefers to keep the now-line in primary brand blue, that works; it will conflict more with the day-badge pill color. |
| P7 | **Widget defaults for new users: EOD CTA on or off day 0–6?** | On (always visible) | EOD CTA is T3 closure ritual. If it fires before any activities are closed, it may feel premature on day 0. Default-on is more discoverable; default-off requires users to find the setting. |
| P8 | **Color palette additional options** | Three options proposed | If Phil wants only his identity palette (no alternatives), the palette dimension is removed from settings entirely. Complexity vs personalization tradeoff. |
| P9 | **Dark mode bucket glow intensity** | 40% (conservative) | On dark backgrounds, bucket glows can look either elegant or neon. This needs Phil's eye on a rendered mockup before engineering commits. |

---

## 10. What Is Lost vs Chartered Minimalism (Iter 33)

This is the honest tradeoff list. No item is hidden.

| What is gained | What is lost or risked |
|---|---|
| Spatial depth via 3-layer z model | Absolute simplicity of flat surfaces — one more CSS variable set to maintain |
| Radial gradient block bodies (inner light) | The perfectly clean gradient that current Chartered Minimalism ships — any new gradient must be QA'd across all block states |
| Operational Glass dark mode | No dark mode existed before. Dark mode adds a full second render path to every component — QA surface doubles |
| Geist font | Inter snapshot tests break. Every component test with font-family assertions needs a single string replacement pass. Estimated: 1–2h QA effort. |
| Discipline Pulse bar | Additional horizontal space below the calendar grid (4px). On very short viewports this could push the EOD CTA off-screen. Needs viewport audit. |
| Amber now-line | Current primary-blue now-line is already in user memory (Iter 15 introduction). A color change may cause brief confusion on first view. |
| Glassmorphism bucket strip | `backdrop-filter` is not supported on all browsers without a prefix. Fallback must render solid surface. QA needs to test the fallback. |
| Settings page appearance section | Adds a settings route section. Currently `/settings` has three fields. Adding six appearance dimensions increases settings complexity. Must not make the page feel like a config panel. |
| Kaizen breath-pulse second trigger | The Iter 33 glow-ring fires on chip entry (once, predictable). Adding a mid-day trigger means the ring can fire during active work — must not distract. The 600ms duration and once-per-bucket-per-day cap mitigate this. |
| Customizable widget toggles | When users turn off the bucket strip, they lose the 4-2-2 invariant visual anchor. The product cannot enforce a minimum widget set. A user who turns off every widget gets a bare calendar with no BAM context. Acceptable for power users; risky for day-7 users who have not internalized the system. |

**What Chartered Minimalism gets right that this proposal must not break:**
- The plan is the first thing the user sees. All depth and atmosphere work must not push the CycleCard below the fold.
- Block bodies are readable at a glance. Radial gradients must be tested at 14px text on the lightest background point to confirm legibility is not reduced.
- Color identity is instant and unambiguous. Any glow or depth effect must not blur the bucket-color signal.

---

## Appendix A: Settings Page Screen Spec (stub)

Route: `/settings`
Section: Appearance (new, added below existing Account section)

**Theme control:**
- Label: "Color theme"
- Component: 3-option segmented control. Options: Light | Dark | System
- Default: System
- Behavior: change takes effect immediately on the current page (no save required). Persisted to `bamx_prefs_v1.theme` in localStorage.

**Color palette control:**
- Label: "Bucket color palette"
- Component: 3 swatch-pill options with labels. Phil's Identity | Calm Neutral | High Contrast
- Default: Phil's Identity
- Behavior: immediate preview. Persisted to `bamx_prefs_v1.palette`.

**Density control:**
- Label: "Schedule density"
- Component: 3-option segmented. Compact | Standard | Spacious
- Default: Standard
- Behavior: changes `--block-min-height` CSS token (44px / 60px / 80px). Immediate effect.

**Motion control:**
- Label: "Motion"
- Component: 3-option segmented. Full | Reduced | None
- Default: Full (overridden silently by OS `prefers-reduced-motion: reduce` → forces Reduced)
- Note rendered below: "Accessibility note: your OS reduced-motion setting always takes precedence."

**Widgets control:**
- Label: "Visible widgets"
- Component: 4 toggle switches in a list.
  - Bucket strip (default: on)
  - Day badge (default: on)
  - End-of-day CTA (default: on)
  - Now pane (default: on)
- Behavior: hiding Now pane suppresses the `NowPane` component render entirely. Hiding bucket strip suppresses the strip panel. Both changes are localStorage-gated.

**Font control:**
- Label: "Interface font"
- Component: 2-option segmented. Geist | Inter
- Default: Geist
- Behavior: swaps `--font-sans` and `--font-mono` CSS tokens. Immediate.

---

## Appendix B: Discipline Pulse — Screen Spec

**Location:** immediately below the bottom edge of the calendar grid, above the footer / EOD CTA zone.

**Height:** 4px strip (compact), 6px (standard), 8px (spacious) — scales with density setting.

**Segments:** left to right in this order — PROJECT (green), COMMUNICATION (yellow), CI (purple), remaining scheduled (slate-200), unscheduled (slate-50 / transparent on dark).

**aria-label pattern:** `"Day shape: ${projectMin} min project, ${commMin} min communication, ${ciMin} min CI completed of ${totalMin} min scheduled"`

**Update trigger:** fires on `ActivityClosed` event re-render. No polling. No new event type. Reads existing app state.

**Interaction:** none. Hover on desktop shows a tooltip with exact minute counts per bucket. Touch devices: no tooltip (tap would conflict with scroll).

**Empty state:** before any activity is closed, the strip renders as 100% slate (all remaining). It is present from day-start. It does not wait for a closed activity to appear.

**Overflow guard:** if CI or COMMUNICATION minutes exceed their 4-2-2 target, the corresponding segment renders at target-width with a 2px red right-edge marker. The strip does not overflow its container.
