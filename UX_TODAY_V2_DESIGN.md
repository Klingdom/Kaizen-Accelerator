# Today Page v2 — UX/Visual Lens (against <10s + <60s targets)

---

## 1. Time-to-Comprehension Audit (target <10s)

A returning user opens Today. Here is the actual scan path, top-to-bottom, as rendered in the PROPOSED/ACCEPTED state with `nowIso` present and `rhythmExplainerDismissed: false`.

**Zone A (0–2s): Header strip — `Today.js:152–156`**
Day-badge (filled `--primary` pill) lands first visually because it is the highest-contrast element on the page (`app.css:107–117`). The user reads "Day 6" or similar. AdherenceDial (`app.css:202–238`) is a 280px-wide white box with three 22px/600-weight numbers. FineTuneButton is right-edge. No reading order is enforced: eye bounces left → right → left trying to establish what matters. Score: **2/5** (high noise, no hierarchy).

**Zone B (2–4s): MorningRecap strip — `Today.js:166–168`**
One-line strip ("Yesterday: 4/6 closed · 2 skipped"). Small, muted text, border-left accent (`app.css:2347`). Provides immediate session continuity. Score: **4/5** — strong signal, good weight.

**Zone C (4–7s): RhythmExplainer card — `Today.js:160–161`, `app.css:119–163`**
Full-width white card, box-shadow, 57-word paragraph, 3px accent-left-border. On a returning user (day 6, `dismissed: false`), this card is visually the heaviest element above the CycleCard. It competes directly with the plan for first-read real estate. Score: **1/5** — actively delays comprehension; should be dismissed by day 2; unconditional render is a structural mistake.

**Zone D (7–9s): NowPane strip — `Today.js:251–253`, `app.css:2251–2298`**
Context-state strip. IN_PROGRESS variant ("Now: [name] · 14m elapsed") is strong. UPCOMING variant duplicates UpNextRail row 1 (unresolved C-UX-7). OPEN_TIME copy "Open time until 47m" is semantically ambiguous (`NowPane.js:171`). Score: **3/5** when IN_PROGRESS; **2/5** when UPCOMING (duplication).

**Zone E (9–10+s): CycleCard — `Today.js:303–314`**
The user finally reaches the plan. By second 9, the header, recap, explainer, and NowPane have already consumed the attention budget. Score: **5/5** for the component itself; **0/5** for its position in the scan path after the interference above it.

Summary: a returning user hits two high-noise zones (header, RhythmExplainer) before reaching the plan. The plan is not visible in 10 seconds on a laptop viewport at 1280px with the explainer present.

---

## 2. Time-to-Action Audit (target <60s)

### Path (a): "Plan looks fine, accept and start"

1. Land on Today (Zone A–E scan: ~10s)
2. Scroll past RhythmExplainer to see BucketStrip (if not dismissed): +3s
3. Read PROPOSED_INTRO copy in CycleCard header: +2s ("Here is your proposed day. Accept to schedule, Edit to tweak, Reject to discard." — `CycleCard.js:68`)
4. Locate AcceptEditRejectTriad at bottom of CycleCard: +2s scroll
5. Click Accept: 1 click
6. Locate the first Start button (SCHEDULED state, `ScheduledActivityBlock.js:93`): +2s scan
7. Click Start: 1 click

**Total: ~20s, 2 clicks, 1 scroll.** Path (a) is within budget today — but only because the RhythmExplainer is short enough to scroll past quickly. It breaks the 10s comprehension target, not the 60s action target.

### Path (b): "Need one swap, then start"

1. Land on Today, scan, accept plan: ~20s (same as above)
2. Click Edit (AcceptEditRejectTriad middle button): 1 click, EditDrawer slides in: +1s
3. Identify which block to swap (scan activity list at 0.4 opacity because cycle-editing dims non-editing card: `app.css:1519`): +3s
4. Click the block to select it: 1 click
5. Search/scroll EditDrawer catalog for replacement: +10–20s
6. Click replacement to apply swap: 1 click
7. Locate Commit button — two candidates now visible: CycleCard triad-edit (`CycleCard.js:52–53`) AND EditDrawer footer (`EditDrawer.js:229–239`): +2s confusion
8. Click canonical Commit: 1 click
9. Locate first Start button: +2s
10. Click Start: 1 click

**Total: ~40–50s, 5–6 clicks, 1 scroll.** Within 60s but consumes nearly all of the budget. The opacity-dimming of the CycleCard during edit (`app.css:1519`) adds hidden scan cost every time.

**Where we exceed budget:** any catalog search that takes longer than 15s (realistic for a user who does not know the catalog by memory) pushes path (b) over 60s. The dual Commit buttons add 2s of confusion on every edit session. BucketStrip invisibility during edit mode means the user cannot confirm invariant compliance until after Commit.

---

## 3. Visual-Hierarchy Score

The top 5 elements competing for the user's eye on an active-day Today:

| Rank | Element | Should be here? | Why it's fighting |
|---|---|---|---|
| 1 | RhythmExplainer card | NO — day 2+ users | Full-width white card with shadow; outweighs CycleCard visually on undismissed state |
| 2 | AdherenceDial 22px numbers | SECONDARY | Same font-size as CycleCard title; renders before any plan content |
| 3 | Day-badge filled pill | TERTIARY | `--primary` fill is the darkest token on page; lands before plan, date, or status |
| 4 | CycleCard | YES — should be #1 | Correct visual treatment but buried under 3 heavier zones |
| 5 | NowPane / UpNextRail (same activity) | PARTIAL — NowPane yes, duplication no | UPCOMING variant + UpNextRail row 1 show identical content in adjacent zones |

The CycleCard ranks fourth in visual weight despite being the primary content surface. This is the core hierarchy failure.

---

## 4. Scan-Killers (specific UX failures vs the latency targets)

**SK-1: RhythmExplainer renders unconditionally for any undismissed user**
File: `RhythmExplainer.js:31` (`if (props.dismissed === true) return ''`) / `Today.js:160`
Failure: A day-6 user who has never tapped "Got it" still sees 57 words in a full-weight card above the plan on every session load. 57-word paragraph in a strip reads at ~15 words/sec = 3.8s read time alone. The card's visual weight delays the CycleCard from entering the field of view.
Estimated cost: 4–6s of scan time per session for any undismissed user.

**SK-2: Dual Commit/Cancel/Undo triad during EditDrawer sessions**
File: `CycleCard.js:52–55` + `EditDrawer.js:229–239`
Failure: When the EditDrawer is open (`isEditing: true`), both the CycleCard's `triad-edit` and the EditDrawer's footer render three buttons each (Commit, Cancel, Undo). The drawer is at z-index 1200 (`app.css:1519`), covering most of the card — but the card's triad is still rendered in the DOM below the drawer. On smaller viewports where the drawer does not cover the full card, both triads are simultaneously visible.
Estimated cost: 2–3s confusion + occasional wrong-Commit click per edit session.

**SK-3: BucketStrip invisible during edit mode**
File: `app.css:1519–1522` — `.today-editing .cycle-card:not(.cycle-editing) { opacity: 0.4; pointer-events: none; }`
Failure: The BucketStrip lives inside `.cycle-card`. During edit mode, any CycleCard that is not `cycle-editing` (i.e., the main card when the drawer is open to its side) is dimmed to 0.4 opacity. The BucketStrip — the one visual that tells the user whether their swap is creating a bucket violation — is invisible during the action that most needs it.
Estimated cost: forces an extra Commit → observe violation → undo → re-edit loop. 10–20s per violation cycle.

**SK-4: NowPane UPCOMING + UpNextRail row 1 same activity**
File: `NowPane.js:160–165` + `UpNextRail.js:169–174`
Failure: When `minutesUntil <= 30`, NowPane renders "Up next in Xm: [name]". UpNextRail renders the same activity as row 1 labeled "Up next". The user sees the same piece of information in two adjacent zones and must verify they are the same. On mobile (≤600px), a third instance renders via `upNextMobileHtml` above CycleCard (`Today.js:264–271`).
Estimated cost: 2–3s disambiguation per session; mild but cumulative.

**SK-5: AdherenceDial empty-state renders full width above the plan for 7 straight days**
File: `AdherenceDial.js:52–57`, `app.css:202–218`
Failure: Pre-day-7, the dial renders three em-dashes and a 14px paragraph ("Building your baseline. Numbers populate after day 7.") in a white card that occupies full flex-1 width in the header. It communicates nothing actionable. A user who has accepted plans for 5 straight days sees the same cold dashes as day 0.
Estimated cost: Zero information delivered in the attention slot it occupies. The opportunity cost is a momentum signal that would reinforce the habit (C-UX-11, OPEN).

**SK-6: Header reading order — day-badge dominates, KPI is the actual content**
File: `app.css:107–117` (badge `--primary` fill) / `Today.js:152–155`
Failure: `.today-day-badge` uses `background: var(--primary)` — the darkest token on the page — and sits at flex-start. The AdherenceDial, which carries the three KPI numbers the user actually needs, is flex-center. Users eye-track left-to-right: they read "Day 6" first, then the KPI cluster, then the FineTune button. "Day 6" is low-value orientation data; the KPI triplet is the decision-relevant status. Reading order is inverted.
Estimated cost: 1–2s reorientation per session; establishes wrong mental model for returning users.

**SK-7: NowPane OPEN_TIME copy is semantically broken**
File: `NowPane.js:171` — `"Open time until ${minutesUntil}m"`
Failure: "Open time until 47m" is ambiguous between "I have 47m of open time" (duration) and "I have open time until [some implied wall-clock time]" (endpoint). The "until" implies a countdown to an endpoint, but the endpoint is not named in this string. The next activity name is a separate `<span class="now-pane-name">` — the user must combine two separate strings mentally.
Estimated cost: 1–2s parse cost; occasional misread of remaining time.

**SK-8: WhyThisPlan chip position above CycleCard header breaks scan path**
File: `Today.js:302` — `whyThisPlanHtml` renders before `CycleCard` in `.today-card-col`
Failure: The chip appears above the CycleCard. In collapsed state it is low-noise. In expanded state (`whyPlanExpanded: true`), it renders a full `<dl>` with rule-grouped details (`WhyThisPlan.js:113–120`) that can span multiple screens. An expanded WhyThisPlan pushes the CycleCard below the viewport entirely on a 768px laptop.
Estimated cost: 0s in collapsed state; up to 5s scroll-to-find-plan in expanded state. Medium risk.

---

## 5. Glanceability Patterns Worth Adopting

**P1: Status pill above primary content (Motion pattern)**
A single-line colored pill ("3 tasks left · 2h remaining") anchors the day's status in one token. The user reads one line and knows the state before seeing any detail. Applicable here: replace the AdherenceDial header block with a single status pill on days 0–6 ("5 days accepted — building baseline"), promoting to the triplet on day 7+. Reduces header height by ~50%.

**P2: Single-row visual summary bar (Sunsama pattern)**
A horizontal bar divided into color-coded segments shows the full day at a glance — Deep (blue), Comm (green), CI (orange) blocks in proportion. The user sees the day's shape in one horizontal scan before reading individual activities. Today's BucketStrip is already close to this. Moving it above the activity list (its current position) and ensuring it's always visible — including during edit mode — makes it the comprehension anchor.

**P3: "Now" as a scrollable anchor, not a strip (Linear / Reclaim pattern)**
Pinning the current activity as a visually distinct anchor row inside the activity list (rather than a separate NowPane above the card) eliminates the duplication problem and keeps all temporal orientation within one surface. The NowPane becomes redundant if the CycleCard's IN_PROGRESS block is visually prominent enough to self-announce.

**P4: Primary CTA color-coded by state (Todoist + Akiflow)**
The Accept button on PROPOSED state renders in the same `--primary` blue as the day-badge pill — two primary-blue elements compete. A state-keyed CTA: PROPOSED → green "Accept" (go/yes signal), ACCEPTED → neutral "Edit", editing → blue "Commit". Users scan for the green button when they want to accept, not for "which blue thing do I tap."

**P5: Collapsed onboarding cards that auto-expire (Notion / Slack pattern)**
After day 1, the RhythmExplainer auto-collapses to a single-line chip if `dismissed` has never been set but `daysSinceSignup >= 2`. The full card only appears on day 0–1. This requires no new data — `daysSinceSignup` is already in the props. Eliminates SK-1 without breaking the new-user onboarding moment.

---

## 6. Top 8 Improvements Ranked by ms/click Impact

**I-1: Auto-collapse RhythmExplainer after day 1**
Before: Full 57-word card renders for any undismissed user regardless of `daysSinceSignup`.
After: `RhythmExplainer` renders full card only when `daysSinceSignup <= 1`; renders a single-line chip ("4-2-2: Deep 4h / Comms 2h / CI 2h — what's this?") for `daysSinceSignup >= 2` and undismissed; renders nothing when dismissed.
Files: `RhythmExplainer.js:30–41`, `Today.js:160`.
Estimated save: 4–6s per session for returning users. Effort: S.

**I-2: Suppress NowPane UPCOMING when UpNextRail row 1 shows same activity**
Before: `NowPane.js:160–165` renders "Up next in Xm: [name]"; `UpNextRail.js:169` renders same activity as row 1.
After: When `state.kind === 'UPCOMING'`, NowPane renders its strip AND `selectUpNext` is called with an offset of 1 so the UpNextRail starts from the second future activity. UpNextRail header relabels as "After that" when the first slot is suppressed.
Files: `NowPane.js:160`, `UpNextRail.js:89–108`, `Today.js:254–270`.
Estimated save: 2–3s disambiguation per active-day session. Effort: S.

**I-3: Make BucketStrip fully visible during edit mode**
Before: `app.css:1519–1522` — `.today-editing .cycle-card:not(.cycle-editing)` sets `opacity: 0.4` on the full card including BucketStrip.
After: The opacity selector targets only the action buttons and non-structural metadata within the non-editing card; BucketStrip remains at full opacity. Exact CSS selector: scope the dim to `.cycle-card:not(.cycle-editing) .sa-actions, .cycle-card:not(.cycle-editing) .triad` rather than the entire card.
Files: `app.css:1519–1522`.
Estimated save: 10–20s per edit session where a violation would otherwise be invisible. Effort: S.

**I-4: Single commit surface — suppress CycleCard triad-edit when EditDrawer is open**
Before: `CycleCard.js:49–56` renders `triad-edit`; `EditDrawer.js:229–239` renders an identical triad. Both are in DOM simultaneously during a swap session.
After: `renderEditTriad` in CycleCard is only called when `editMode === true AND editDrawerOpen === false`. EditDrawer footer is the canonical commit surface during drawer sessions. CycleCard triad remains for inline edits (duration chip, start-time) that do not open the drawer.
Files: `CycleCard.js:169–171`, `Today.js:238–248`.
Estimated save: 2–3s confusion per edit session; eliminates wrong-commit click path. Effort: S.

**I-5: AdherenceDial momentum mode pre-day-7**
Before: `AdherenceDial.js:52–57` — three em-dashes + "Building your baseline. Numbers populate after day 7."
After: Pre-day-7 variant renders a compact row: "Day N · X days accepted" where X is derived from acceptance history already in props. Promotes to percent triplet at day 7+.
Files: `AdherenceDial.js:47–58`.
Estimated save: Not directly a latency saving, but removes the attention dead zone in the header that currently consumes 1–2s with zero information return. Effort: S.

**I-6: Establish header reading order — KPI left, badge secondary**
Before: `app.css:107–117` — `--primary`-filled badge is leftmost, highest contrast; AdherenceDial is flex-1 center.
After: AdherenceDial anchors left (primary status, largest surface). Day-badge moves right of dial, renders as a muted text label without fill (`font-size: 11px; color: var(--muted)` — no background fill). FineTuneButton remains right edge.
Files: `Today.js:152–156`, `app.css:100–117`.
Estimated save: 1–2s header re-read elimination per session. Effort: S.

**I-7: Fix NowPane OPEN_TIME copy**
Before: `NowPane.js:171` — `"Open time until ${minutesUntil}m"`.
After: `"${minutesUntil}m until ${nextActivityName}"` — time first, label second, endpoint named inline. Remove the redundant `<span class="now-pane-name">next: [name]</span>` and fold the activity name into the primary label string.
Files: `NowPane.js:169–177`.
Estimated save: 1–2s parse-time per OPEN_TIME session. Effort: S.

**I-8: Collapse WhyThisPlan to chip-only on mobile / short viewports**
Before: `Today.js:302` — expanded `WhyThisPlan` (`whyPlanExpanded: true`) renders a full `<dl>` above the CycleCard, pushing it below viewport on ≤768px screens.
After: On `whyPlanExpanded: true`, the `<dl>` renders inside a `max-height: 200px; overflow-y: auto` scroll container so it never exceeds viewport share. CycleCard always remains partially visible above the fold.
Files: `WhyThisPlan.js:122–131`, `app.css:2407–2450` (new rule needed).
Estimated save: 3–5s scroll-to-plan for any user who expanded Why on a short viewport. Effort: S.

---

## 7. The Smallest Coherent v2 Today

The minimum viable redesign that hits <10s comprehension and <60s action requires exactly three structural changes and nothing more. First, break the RhythmExplainer's unconditional render: auto-collapse to a single chip for returning users (day 2+) so that the plan is visible on first screen-load without scrolling. This single change reclaims the most above-the-fold real estate of any item on this list and drops comprehension time from ~10s to ~6s. Second, invert the header reading order so the AdherenceDial (or its pre-day-7 momentum text) anchors left and the day-badge demotes to a secondary muted label. This removes the attention mis-direction at session open. Third, fix the BucketStrip blackout in edit mode so the user can see bucket balance while swapping — this is the single biggest time drain in path (b) and the fix is one CSS selector change.

These three changes ship in one iteration and together satisfy the latency targets for the primary flows. Everything else on the list — the NowPane duplication fix, the dual Commit triad, the OPEN_TIME copy — is a quality improvement that shaves 1–3 seconds but does not break the targets. In iteration 2, collapse the NowPane/UpNextRail duplication (C-UX-7, already scored OPEN/11) and fix the dual Commit surface (I-4 above). In iteration 3, address the AdherenceDial momentum mode (C-UX-11, scored OPEN/11) and the NowPane copy fix. Nothing new needs to be built; all three iterations draw from the existing OPEN backlog.

---

## 8. Open Questions for Synthesis

1. **RhythmExplainer auto-collapse threshold**: this review recommends day 2 as the auto-collapse trigger. If the Growth lens argues for day 1 (first completion of any accepted plan), the threshold shifts and the copy in the chip changes. Default if unanswered: auto-collapse at `daysSinceSignup >= 2`, regardless of dismiss state.

2. **WhyThisPlan expanded state interaction scope**: I-8 proposes a scroll-container for the expanded `<dl>`. If the architect determines the expanded state should instead render below the CycleCard (not above it), the position change is a Today.js template reorder, not a CSS constraint. Default if unanswered: keep WhyThisPlan above CycleCard but constrain max-height to 200px.

3. **NowPane suppression vs UpNextRail offset for the UPCOMING-duplication fix**: two approaches for C-UX-7. Option A: NowPane UPCOMING remains the canonical surface; UpNextRail starts from activity index 1. Option B: NowPane UPCOMING is suppressed entirely when `minutesUntil > 15`; UpNextRail keeps row 0. Default if unanswered: Option A — NowPane is canonical, UpNextRail offsets.

4. **AdherenceDial momentum data availability**: I-5 requires an accepted-day count for days 0–6. Does this count exist in the `adherence` prop today, or does it require a new computed field from `app.js`? Default if unanswered: derive from `daysSinceSignup` and a new `acceptedDaysCount` prop; if prop is absent, fall back to the current em-dash display.

5. **Header layout reorder (I-6) ownership**: reordering the header flex items is a Today.js template change + CSS change. If the architect or PM has a constraint against moving the day-badge (e.g., it anchors a data-testid used in QA suites), the visual demotion (remove fill, reduce size) can achieve the same hierarchy result without reordering. Default if unanswered: visual demotion only (no DOM reorder), so QA selectors remain stable.
