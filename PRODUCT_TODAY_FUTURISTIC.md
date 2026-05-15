# PRD — Today Page Futuristic Redesign
Status: Draft v1.0 — awaiting Phil approval before any design or implementation work begins.
Date: 2026-04-30
Author: Product Manager
Sprint target: Phases 1–2 in iterations 17–18; Phases 3–4 in iterations 19–20 (pending Phil sign-off on phasing)

---

## 1. Problem Statement

### What is wrong with the current Today page (post-Iter 38 / Sprint 16a state)

The Today page is functionally complete. Seven state branches render correctly. The
4-2-2 composer pipeline (Iter 38 output) is sound. Drag, insert, click-detail, and the
calendar grid work. Accessibility meets WCAG AA on focus traps and screen-reader labels.
The MorningRecap strip, NowPane, UpNextRail, EditDrawer, FineTuneDrawer, AdherenceDial,
EodClosureStrip, and CycleCard are all present and structurally correct.

The problem is aesthetic and motivational, not functional.

Phil's verbatim directive: "UX and front end for today page need to be drastically
improved. Make more futuristic, modern, innovative, and customizable."

Translated into product language, four specific failure modes exist in the current state:

**F1 — Visual vocabulary is generic.**
The page uses a standard light-mode white-card, subtle-shadow, blue-accent pattern that
is indistinguishable from any SaaS CRUD tool built in 2022. Nothing about the surface
communicates that this is an operating system for deliberate professional practice. The
typographic hierarchy is flat. Depth cues are minimal (thin box-shadows). Motion is
absent except for drawer slides.

**F2 — No dark mode or alternative surface.**
The product exists in one visual state: white backgrounds, slate text, green/yellow/purple
bucket colors on white. For a tool Phil uses daily, the absence of a dark mode is a UX
comfort gap, not a missing feature — especially in the early-morning and late-day use
windows the product targets.

**F3 — Customization is zero.**
Every user sees an identical layout, identical density, identical color surface. There is
no user expression. For a product whose value proposition is "your operating rhythm,
made executable," the lack of any personalization signal undercuts the brand promise.

**F4 — Visual hierarchy does not communicate state urgency.**
PROPOSED, ACCEPTED, IN_PROGRESS, CLOSED, SKIPPED blocks look broadly similar at a
glance. The most important state — the activity that is running right now — does not
dominate the viewport. A user glancing at the page for 3 seconds cannot immediately
identify what they should be doing without reading block labels.

### Why now

Sprint 16a (time-range display) closes the final functional gap in the iteration 29–38
roadmap. The Today page has been in feature-build mode for 16 sprints. Functional debt
is cleared. This is the correct moment to invest in the visual and experience layer
without risking regressions in live functionality.

---

## 2. Hypothesis

If Today is redesigned with a modern visual vocabulary, a dark-mode default option,
motion cues for state transitions, and a minimal customization mechanism, then:

H1 — Phil's daily session initiation time decreases (opening the app feels rewarding,
not transactional).
H2 — The IN_PROGRESS activity is identifiable within 3 seconds of page load without
scanning block labels.
H3 — At least one customization option (dark mode or density) is adopted within 7
days of first availability.
H4 — Phil does not request a scope expansion ("make it even more futuristic") within
the first 4 weeks after Phase 2 ships — measured by absence of a new redesign
directive in session notes.

These are behavioral predictions, not vanity metrics. H4 is specifically included
because "more futuristic" is a subjective intensifier that can spiral. The redesign
must deliver a decisive visual shift, or the directive recurs.

---

## 3. In Scope vs Out of Scope

### IN SCOPE — Phase 1 (iterations 17–18)

- Dark mode: a single dark-surface CSS variable set activated by a toggle in user
  preferences. Phil's canonical colors (green #22c55e, yellow #eab308, purple #8b5cf6,
  lunch-gray #9ca3af) must remain legible in both modes.
- Motion-reduced toggle: a binary preference that disables CSS transitions and
  animations. Required for accessibility (WCAG 2.1 §2.3.3 AAA, but treated as AA
  obligation given Phil's stated a11y commitment). This toggle is prerequisite to all
  motion work in Phase 2.
- User preference persistence: localStorage key `kaizen_user_prefs` storing theme and
  motion preferences. Shape defined in §7 below.
- A preference settings panel: a modal or drawer accessible from the header that
  exposes the Phase 1 toggles and is expandable for Phase 2+ options without UI
  redesign.
- Token system prerequisite: T1 (bucket-tone token consolidation, spec in
  T1_TOKEN_SPEC.md) must be complete before Phase 1 ships. Without a single
  `--token-name` source of truth, dark mode requires duplicating all color declarations.
  This is a dependency on iteration 13–16 work already specced; confirm shipped status
  before Phase 1 begins.

### IN SCOPE — Phase 2 (iterations 18–19)

- Typography upgrade: one modern font pairing (sans-serif display for headings, tabular
  monospace for time values). Specific typefaces are a UX/design decision; PM constraint
  is that the display heading must register as deliberately chosen rather than a browser
  default, and time values must be mechanically precise in weight/spacing.
- Depth system: a layering vocabulary using shadow tokens (three levels: surface,
  raised, floating) that replaces the current single-weight box-shadow used on every
  card. Raised level applies to the active CycleCard; floating applies to drawers.
- Active state visual dominance: the IN_PROGRESS activity block receives a distinct
  visual treatment (e.g., a left-edge glow in the bucket color, elevated shadow level)
  that makes it identifiable within 3 seconds without reading any text.
- State-to-state transition motion: smooth CSS transitions for block state changes
  (SCHEDULED → IN_PROGRESS → CLOSED) respecting the motion-reduced preference.
  No JavaScript-driven animations; CSS-only, bounded to 200ms max duration.
- NowPane visual elevation: the NowPane strip (currently a muted horizontal bar)
  receives enough visual weight to serve as the "current moment anchor" on the page.

### IN SCOPE — Phase 3 (iteration 19–20)

- One signature innovative pattern: a "time ribbon" or "day spine" — a persistent
  vertical timeline element on the left edge that visualizes elapsed/remaining day
  proportion as a filled track. This is the single "innovative" differentiator that
  separates the product from a standard scheduling app. It does not replace the
  CycleCard block list; it is an ambient orientation layer alongside it.
  Implementation specifics and visual design are delegated to UX/Design agent.
  PM constraint: the pattern must be opt-out (on by default) and must not obscure any
  existing block interaction target.

### IN SCOPE — Phase 4 (iteration 20–21, conditional on Phase 3 reception)

- Layout density toggle: compact (tighter block padding, smaller type) vs standard
  (current sizing). Two states only. No continuous slider.
- One alternative accent palette beyond Phil's defaults: a cooler blue-gray palette
  option for users who want less saturated colors. Phil's green/yellow/purple/gray
  remain the default and cannot be removed.

### OUT OF SCOPE (explicit exclusions — do not propose, do not implement)

- Full theme marketplace or theme sharing between users.
- User-created custom themes (color pickers, hex entry).
- AI-generated themes or palette suggestions.
- Animated transitions between every screen or route change.
- 3D rendering, parallax, or WebGL effects.
- Per-block custom colors (users cannot recolor individual activity blocks).
- System-tray or ambient display modes (the page is not a dashboard widget).
- Any change to the composer 4-2-2 output logic (Iter 38 output is frozen).
- Any change to calendar grid functionality (visual, click-detail, drag, insert).
- Any change to §6.5 boundaries (no leakage of scheduling concerns across pages).
- Animated number counters or gamification elements on AdherenceDial (anti-theme A2
  in UX_DESIGN_THEMES.md).
- Social/sharing features triggered by visual redesign (anti-theme A6).
- Any regression in WCAG AA compliance. Accessibility is a hard floor, not a
  tradeoff against visual ambition.

---

## 4. MVP Customization Set (Phase 1 scope, tight default)

The MVP customization set is exactly two toggles and one preference panel.

| Option | Values | Default | Rationale |
|---|---|---|---|
| Color surface | Light / Dark | Light | Preserves current behavior as default; avoids surprising existing usage |
| Motion | Standard / Reduced | Reduced if `prefers-reduced-motion` media query is set, else Standard | Correct accessibility default; respects OS-level signal |

These two options ship in Phase 1. No other customization is available to the user
in Phase 1.

The preference panel is a drawer or modal (design agent decision) accessible via a
single icon in the page header. It must be keyboard-navigable and screen-reader
labeled ("Appearance preferences"). It must not add a persistent settings route — it
is a panel, not a page.

---

## 5. Full Customization Aspirational Set (post-MVP, Phase 4+)

For planning purposes only. None of these are committed in this PRD.

- Layout density toggle (Phase 4, in scope above but conditional)
- Alternate accent palette (Phase 4, in scope above but conditional)
- Font size scaling (small / medium / large) — post-Phase 4
- Week start day (Mon / Sun) — this is a scheduling concern, not a visual one; defer
  to scheduling engine team
- NowPane position (top of page vs inline with CycleCard) — post-Phase 4
- Day Spine time ribbon on/off toggle (Phase 3 ships it on by default; Phase 4
  adds the off toggle)

---

## 6. Acceptance Criteria

AC format: Given / When / Then. All ACs are verifiable without subjective judgment
except where explicitly marked with a proxy verification method.

### AC1–AC5: Visual Modernization

**AC1 — Typography deliberateness.**
Given the Today page in either light or dark mode, when a user who has not seen the
product before views the page, then the heading font is visibly non-default (not
system-ui or Georgia) and the time values use a monospace or tabular-numeric weight,
confirmed by inspecting the `font-family` computed style on the `<h1>` or page heading
element and on the `.sa-when` element, which must differ from each other.

**AC2 — Shadow depth system (three levels).**
Given the app.css token file post-Phase 2, when the shadow token declarations are
grepped, then exactly three shadow tokens exist (`--shadow-surface`, `--shadow-raised`,
`--shadow-floating`) with distinct values; no hardcoded `box-shadow` declarations exist
outside these tokens in any component that uses shadow (verified by grep for
`box-shadow:` not inside a `--shadow-` variable definition — expected count: 0).

**AC3 — IN_PROGRESS block is identifiable in 3 seconds.**
Given an ACCEPTED composition with one block in IN_PROGRESS state, when Phil opens
Today and closes his eyes, then within 3 seconds of reopening he can correctly name
the activity without scanning block titles — verified by Phil doing this live during
acceptance review. Proxy: the IN_PROGRESS block carries a left-edge visual marker
(color, glow, or border) in the bucket's primary color at ≥3px width and the block's
background or border is visually distinct from SCHEDULED blocks at a glance.

**AC4 — No bucket-color regression.**
Given the redesigned Today page in both light and dark modes, when each of the three
bucket types (PROJECT, COMMUNICATION, CI) and the lunch-gray reserved slot are
rendered, then their canonical colors (green, yellow, purple, gray) remain visually
identifiable and their contrast ratio against the containing block background passes
WCAG AA (4.5:1 for text, 3:1 for graphical elements) — verified by automated
color-contrast tooling on the rendered HTML.

**AC5 — Dark mode surface is coherent (no white bleed).**
Given the dark mode preference is set, when Today loads in any state branch
(FIRST_RUN, PROPOSED, ACCEPTED, infeasible, all-closed), then no element renders a
white (`#ffffff` or equivalent) background — verified by visual inspection of each
state branch and confirmed by a CSS grep asserting that no component file contains a
hardcoded `background: white` or `background: #fff` outside a forced-colors media
query.

### AC6–AC10: Customization Mechanism

**AC6 — Preference panel is reachable in one action.**
Given any state of the Today page, when the user activates the preference control (one
click or one keyboard shortcut), then the preference panel opens within 200ms and focus
moves to the first interactive element inside it, confirmed by keyboard-only navigation
test (Tab to the preference icon, Enter to open, Tab lands on first toggle within
200ms).

**AC7 — Preferences persist across sessions.**
Given the user sets dark mode = on and motion = reduced, when the browser tab is closed
and reopened (not a hard refresh), then both preferences are applied on page load without
user action, verified by checking `localStorage.getItem('kaizen_user_prefs')` before
and after a tab close/reopen cycle and confirming the returned JSON matches the set
values.

**AC8 — Default is preserved on first run.**
Given a user who has never set any preferences (no `kaizen_user_prefs` key in
localStorage), when Today loads, then the light-mode surface is applied and motion is
set to Standard unless the OS `prefers-reduced-motion` media query is active — verified
by opening an incognito window and confirming the light surface and no motion-reduced
class on `<body>` (absent OS signal).

**AC9 — Preference panel does not add a route.**
Given the app's route table post-Phase 1, when the list of registered routes is
inspected, then no `/settings` or `/preferences` route exists — the panel is a
floating layer, not a page.

**AC10 — Both toggles are keyboard-accessible and screen-reader labeled.**
Given the preference panel open, when a screen reader announces each toggle, then it
reads the label ("Color surface: Dark" or "Motion: Reduced") and the current state,
not just "toggle" or "button" — verified by running the page through axe-core or NVDA
with assertions on `aria-label` and `aria-checked` attributes.

### AC11–AC15: Feature Preservation

**AC11 — Calendar grid functionality unchanged.**
Given the Today page post-redesign, when the user interacts with the calendar grid
(visual render, click-detail, drag-to-reorder in edit mode, insert), then all
interactions behave identically to the Sprint 16a baseline, confirmed by running the
existing calendar grid test suite (2565 tests, 0 failures) unchanged.

**AC12 — Composer 4-2-2 output unchanged.**
Given the redesigned Today page, when the user triggers Auto-Plan or accepts a proposed
composition, then the composition output (bucket distribution, activity selection,
duration constraints) is identical to the Iter 38 baseline, confirmed by running the
composer unit tests without modification.

**AC13 — Drag and insert interactions preserved.**
Given the redesigned Today page in edit mode, when the user drags a block to a new
position and inserts a new activity, then the edit-mode state machine behavior is
unchanged from the Sprint 16a baseline, confirmed by passing the edit-mode integration
tests without modification.

**AC14 — All existing acceptance criteria from Iter 29–38 pass.**
Given the redesigned codebase, when the full test suite is run, then the count is >=
2565 (Sprint 16a baseline) and 0 tests fail. Any new tests added for the redesign are
additive.

**AC15 — Phil's color identity preserved in all modes.**
Given the redesigned Today page in dark mode and in light mode, when a visual diff is
taken against the Sprint 16a baseline for bucket chip colors, then the green (#22c55e),
yellow (#eab308), purple (#8b5cf6), and lunch-gray (#9ca3af) values are present and
unchanged in all computed bucket-chip color values — verified by snapshot test
asserting the four hex values remain in bucketMeta output and in the rendered chip
CSS custom properties.

### AC16–AC18: Accessibility

**AC16 — Motion-reduced preference disables all transitions.**
Given the motion-reduced preference is set (either via the toggle or via OS
`prefers-reduced-motion: reduce`), when Today loads and all state transitions occur
(block start, block close, drawer open/close), then no CSS `transition` or `animation`
property fires with a duration greater than 0ms on any element — verified by a
Chromium DevTools performance trace showing no animation frames during block state
changes under the reduced-motion flag.

**AC17 — High-contrast mode (forced-colors) preserves bucket discrimination.**
Given a browser running in Windows High Contrast mode (`forced-colors: active`), when
Today renders with all three bucket types visible, then each bucket type remains
visually distinguishable from the others — verified by the existing
`@media (forced-colors: active)` block in app.css (T1_TOKEN_SPEC.md §2.3) and by
visual inspection under Edge in High Contrast Black mode. No new AC; confirm the T1
block is not broken by Phase 1–2 token changes.

**AC18 — Keyboard navigation is complete through preference panel and all redesigned
elements.**
Given a keyboard-only user on the redesigned Today page, when they Tab through every
interactive element including the preference panel, then focus order is logical
(document order), no focus trap is left open unintentionally, the preference panel
closes on Escape and returns focus to the triggering element, and all new interactive
elements have visible focus rings meeting WCAG AA 3:1 contrast — verified by
keyboard-only walkthrough logged as a test case in tests/ui/responsive.manual.md.

---

## 7. Data Model Implications

### localStorage Shape

Key: `kaizen_user_prefs`
Value: JSON object. Schema (v1):

```json
{
  "schemaVersion": 1,
  "theme": "light" | "dark",
  "motion": "standard" | "reduced",
  "density": "standard"
}
```

`density` is included in v1 schema even though Phase 4 is the first to expose it.
Setting the field now prevents a schema migration when Phase 4 ships. Default value
is `"standard"` on read if field is absent (forward-compatible).

### Migration from current state

Current state: no `kaizen_user_prefs` key exists for any user. No migration is
required. First load after Phase 1 ships writes the default values. If the key does
not exist on load, the app applies defaults (light, motion per OS signal) and writes
the key.

### Risk: localStorage cleared by user

If a user clears browser storage, preferences reset to defaults. This is acceptable
for MVP. Post-Phase 4, evaluate whether server-side preference storage is warranted.
Flag for Phil's decision (SW-3 below).

### Impact on existing data model

No schema changes to compositions, activities, catalog entries, or Kaizen records.
The preference system is a pure client-side concern. No backend calls are added.

---

## 8. Top 5 Risks

**R1 — Design coherence drift between phases.**
Risk: Phase 1 ships dark mode with minimal visual change; Phase 2 ships typography
and depth; Phil's reaction to Phase 2 is "this doesn't feel futuristic enough" because
the phases are evaluated independently rather than as a cumulative experience.
Mitigation: produce a composite design mockup showing all four phases together before
Phase 1 begins. Phil approves the end-state vision before any implementation starts.
Probability: High. Impact: High.

**R2 — Accessibility regression from dark-mode token work.**
Risk: dark mode tokens override existing color values in ways that break the
bucket-chip contrast ratios or the forced-colors media query established in T1.
The bucket tokens (green, yellow, purple, gray) were tuned for white backgrounds;
on dark surfaces they may fail WCAG AA without re-tuning.
Mitigation: automated contrast testing on all four bucket colors against the dark
surface before Phase 1 ships. No visual release without a passing contrast report.
Probability: Medium. Impact: High.

**R3 — Customization scope explosion after Phase 1 ships.**
Risk: Phil sees dark mode and immediately requests font size controls, custom accent
colors, per-block opacity, etc. The "customizable" directive is open-ended; any
shipped toggle creates appetite for more.
Mitigation: this PRD defines an explicit "OUT OF SCOPE" list (§3) and an explicit
Phase 4 scope cap. Any request outside those lists requires a new PRD iteration, not
a sprint addition. PM must enforce this boundary at sprint planning.
Probability: High. Impact: Medium.

**R4 — Component coupling to theme system.**
Risk: the vanilla-JS string-template architecture (no CSS-in-JS, no component
scoping) means dark mode requires CSS custom property overrides on `:root` or a
`[data-theme="dark"]` attribute on `<body>`. If any component has hardcoded hex
values or non-tokenized `background-color` declarations, dark mode will have white-
bleed patches.
Mitigation: T1 token consolidation (already specced) is a hard prerequisite. Before
Phase 1 begins, run a grep for hardcoded hex values in all component files. Any
remaining hardcoded values must be tokenized in the same iteration, not deferred.
Probability: Medium. Impact: Medium.

**R5 — "More futuristic" pushback after Phase 2.**
Risk: Phases 1–2 deliver dark mode, typography, and depth — Phil's reaction is that
the result looks "like a nicer Notion" rather than "futuristic." The Phase 3
signature pattern (day spine / time ribbon) is the key differentiator. If Phil
evaluates Phase 2 before Phase 3 ships and the composite mockup was not approved
first, the scope pressure recurs.
Mitigation: same as R1 — composite end-state mockup approved before Phase 1 begins.
Phase 2 acceptance review explicitly references the composite, not Phase 2 in
isolation.
Probability: Medium. Impact: High.

---

## 9. Phasing Recommendation

Each phase is independently shippable and leaves the product in a valid, releasable
state. No phase is a blocker for unrelated roadmap work.

**Phase 1 (iterations 17–18): Dark mode + customization framework**
Deliverables: `kaizen_user_prefs` localStorage schema; theme toggle; motion toggle;
preference panel in header; `:root` dark-theme token overrides; `[data-theme="dark"]`
on `<body>`; contrast verification on all bucket colors in dark mode.
Prerequisites: T1 token consolidation confirmed shipped.
Phil review gate: visual check of dark mode in PROPOSED, ACCEPTED, and infeasible
states before merging.
Does not change: any functional behavior, any test assertion, any data model.

**Phase 2 (iterations 18–19): Visual refinements**
Deliverables: font pairing applied to headings and time values; three-level shadow
token system; IN_PROGRESS block visual dominance treatment; state transition CSS
animations (200ms max, respects reduced-motion); NowPane visual elevation.
Prerequisites: Phase 1 shipped and stable.
Phil review gate: composite mockup from Phase 0 (pre-work) compared against actual
rendered result; IN_PROGRESS identifiability test (AC3) passed live.

**Phase 3 (iterations 19–20): Innovative signature pattern**
Deliverables: Day Spine — a persistent vertical timeline element on the left edge
visualizing elapsed/remaining day proportion. On by default, no toggle yet
(Phase 4 adds the toggle). Must not obscure any existing interaction target.
Prerequisites: Phase 2 shipped; UX/Design agent has produced a specification for
the Day Spine interaction model and visual design.
Phil review gate: Day Spine renders correctly in all state branches; 3-second
identifiability test (AC3) still passes with the Spine present.

**Phase 4 (iterations 20–21, conditional):**
Deliverables: layout density toggle (compact / standard); alternate accent palette
(one cooler blue-gray option); Day Spine on/off toggle added to preference panel.
Conditional: Phil approves Phase 3 reception before Phase 4 scoping begins.
If Phil's reaction to Phase 3 is "this is enough," Phase 4 is deferred indefinitely.

**Pre-work (before Phase 1 begins):**
UX/Design agent must produce a composite end-state mockup showing all four phases
together. Phil must approve the end-state vision in writing (Slack or session note)
before Phase 1 implementation begins. This is a hard gate. Without composite approval,
the redesign is high-risk for "more futuristic" pushback (R1, R5).

---

## 10. Standard-Work Authority Items (Phil Must Answer)

These are decisions that cannot be defaulted by the PM or design agent. Phil must
provide explicit answers before Phase 1 implementation begins.

**SW-1 — Dark mode default on first run.**
Should dark mode be the default for a brand-new user, or should light mode remain the
default with dark mode as an opt-in?
Options: (a) light mode default, dark mode opt-in [recommended — preserves current
user experience, no surprise]; (b) system-default (match OS `prefers-color-scheme`);
(c) dark mode always on first run.
Phil must choose one. Recommendation: option (b) — respect the OS signal, default
to light if no OS signal.

**SW-2 — Composite mockup approval gate.**
Phil must confirm that no Phase 1 implementation work begins until a composite end-
state mockup (all four phases) has been reviewed and approved by Phil. Yes or no.
If no, R1 and R5 are accepted risks explicitly.

**SW-3 — Preference persistence scope.**
For Phase 1, preferences are stored in localStorage only. If a user uses two browsers
or clears storage, preferences reset.
Is localStorage acceptable for Phase 1, or does Phil require server-side persistence
from the start?
Options: (a) localStorage for Phase 1, evaluate server-side post-Phase 4 [recommended];
(b) server-side from Phase 1 (requires backend work, adds 1–2 iteration delay to Phase 1
target).
Phil must choose one. If (b), the backend-engineer agent must be engaged before Phase 1
begins.

---

## 11. Success Metrics

Baseline state is the Sprint 16a / post-Iter 38 Today page with no visual redesign,
no dark mode, no customization.

| Metric | Baseline | Target (30 days post-Phase 2) | Measurement method |
|---|---|---|---|
| Dark mode adoption rate | 0% (not available) | ≥ 50% of Phil's sessions use dark mode | `kaizen_user_prefs.theme` value logged on app load |
| Motion-reduced adoption | 0% (not available) | Matches OS `prefers-reduced-motion` rate within ±5% (i.e., the toggle is not over-used or ignored relative to OS signal) | Compare `kaizen_user_prefs.motion` vs `window.matchMedia('prefers-reduced-motion').matches` at load |
| IN_PROGRESS identifiability | Unmeasured (no baseline) | Phil correctly identifies the active block in ≤3s in a live acceptance test (AC3) | Live acceptance test at Phase 2 review |
| Session initiation sentiment | Informal ("the page feels transactional") | Phil's unprompted description of opening the app shifts from transactional to positive within 2 weeks of Phase 2 ship | Session notes / Phil's own language in Slack or review sessions |
| Preference change frequency | N/A | ≤ 3 preference changes per week after week 1 (indicates settings found once and held, not constantly re-adjusted — a sign of coherent defaults) | Count of `kaizen_user_prefs` write events per week |
| Test suite integrity | 2565 tests, 0 failures | 2565+ tests, 0 failures, suite duration < 3.5s | CI run on every phase merge |

**Leading indicator (Phase 1 gate):**
Dark mode renders correctly in all six Today state branches (FIRST_RUN, PROPOSED,
ACCEPTED, infeasible, all-closed, edit mode) with 0 white-bleed patches and all bucket
colors passing WCAG AA contrast — before Phase 1 is considered shipped.

**Post-launch metric (Phase 4 gate):**
If Phase 4 ships, the density toggle adoption rate is measured 30 days after ship. If
adoption is < 20%, the Phase 4 aspirational items (font scaling, alternate palettes)
are deprioritized until a usage signal justifies the investment.

---

## Appendix: Constraint Confirmation

The following constraints from Iter 29–38 are explicitly confirmed as preserved
throughout all four phases:

- Composer 4-2-2 actual output: frozen (Iter 38). Not touched.
- Calendar grid functionality (visual, click-detail, drag, insert): preserved. AC11, AC13.
- Phil's color identity (green #22c55e, yellow #eab308, purple #8b5cf6, lunch-gray
  #9ca3af): preserved in all themes. AC4, AC15.
- WCAG AA accessibility (focus traps, screen-reader semantics): preserved and extended.
  AC10, AC16, AC17, AC18.
- §6.5 boundary: Today remains a single-job page (execute the current day). No
  dashboard widget proliferation. Anti-theme A5 (UX_DESIGN_THEMES.md) remains in effect.
