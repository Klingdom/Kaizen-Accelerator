# Auto-Population Methodology — Coordinator Recommendation

Owner: Coordinator Agent
Status: v1.0 — synthesizes `METHODOLOGY_INPUTS.md` v1.0 + `METHODOLOGY_MECHANICS.md` v1.0 into a single shippable methodology for auto-populating a Cadence Day.

> The two brainstorm docs answer different halves of the same question. **INPUTS** answered *"what does the user tell us?"* (Hybrid A: Pure Auto default + Fine-tune drawer). **MECHANICS** answered *"what does the system do?"* (On-demand-at-login compute, confidence-based auto-accept, smart defaults, graceful recovery). Together they constitute the recommended MVP methodology.

---

## 1. One-paragraph answer

**Easiest methodology: Zero-on-login, compute-on-demand, accept-or-fine-tune.** The user opens the app, the composer runs in under 100 ms on their own data, a pre-composed Cadence Day appears with the 4-2-2 shape filled from BAM standards + their active projects. They tap **Accept** (median ~12 s total) and the day is locked. If they want to adjust, a single **Fine-tune** drawer lets them change one of three inputs (capacity, external meetings, active project focus) without touching individual blocks. Editing individual blocks is still available, but shouldn't be needed on a normal day. Automation mechanics make this work: on-demand composition is fast enough to not need overnight cron; smart defaults infer role + timezone + project without asking; the confidence score hides low-certainty placements behind a "why chip" instead of interrupting with questions. BAM standard best practices (Daily Standup, AM/Post-lunch High-value Communication, End-of-Activity Reflection, Weekly Reflection on Fridays, 4-2-2 time shape) are non-optional and always present without the user needing to request them.

---

## 2. The recommended methodology end-to-end

### 2.1 First visit (brand-new user)

1. **Sign up** → 3-field form: name, email, BAM role (Practitioner / Facilitator / Leader / Champion). No role? Default is Practitioner. ~15 s.
2. **Welcome screen** explains CadencePlan's thesis in two sentences + one primary **Auto-Plan** button.
3. **Auto-Plan tap** → composer runs against default seed (catalog 80 entries enabled for role, capacity=480, deepSlicePreference=2×2h, no active Kaizen yet) → produces a PROPOSED Cadence Day.
4. **Review CycleCard** with 4-2-2 BucketStrip + 8–10 ScheduledActivityBlocks. Each block carries a "why chip" surfacing the explain-reason ("Chosen because it's the Daily Standup anchor" / "Chosen because no DMAIC/Kaizen active yet — generic Deep block").
5. **Accept** → Day ACTIVE, first block pinned with Start. Total time ~30 s (including signup).

### 2.2 Day N (returning user)

1. **Open app** → `/today` loads with composer running on-demand. Composer p95 = 1–2 ms on fixture, ~60 ms with full 80-entry catalog + activeKaizen + varianceQueue from yesterday. Visible loading skeleton for ~100 ms.
2. **See pre-composed day** — ~10 s to glance BucketStrip + block list.
3. **Tap Accept** — median total ~12 s.

If the user wants adjustments without touching individual blocks:

4. **Fine-tune drawer** (one tap away) — 3 sliders:
   - Total capacity today (240 / 360 / 480 / 600 min)
   - External meetings today (0 / 30 / 60 / 90 / 120 min)
   - Active project focus (pick from active Kaizens + "no focus")
   - On change → re-run composer → re-render CycleCard
5. **Accept** after Fine-tune — total ~20 s.

### 2.3 When composer returns INFEASIBLE

Graceful degradation per `ENGINE_DESIGN §4.7`:

- Non-optionals + ceremonies exceed capacity → show 4 `suggestedActions` inline on the CycleCard with one-tap remediation:
  - **Raise capacity for today** (one tap, sets one-day override)
  - **Reduce external meetings** (opens Fine-tune drawer with external slider focused)
  - **Skip ceremony with reason** (opens reason-code picker; logs Variance)
  - **Defer a non-optional to tomorrow** (logs Variance, re-composes)

User is never stuck on a blank state. Every path terminates in either ACCEPTED or explicit REJECTED.

---

## 3. BAM standard best-practice surfacing rule

From `METHODOLOGY_INPUTS.md §6`:

| Surfacing level | Activities | User can override? |
|---|---|---|
| **Non-optional** (always appear) | Daily Standup, AM High-value Communication, Post-lunch High-value Communication, End-of-Activity Reflection, Weekly Reflection (Fri), Sprint Planning (Mon Wk1 of sprint), Mid-Sprint Review (Fri Wk1), Sprint Review + Retrospective (Fri Wk2) | Skip with reason code → variance log; cannot delete from catalog |
| **Default-enabled, dismissible** | PDCA Cycle tick (if open experiment), 6S Email (if inbox threshold), L&D tick, Document Review (if doc arrived), Innovation Explore | Drag out of day / toggle disabled in Catalog |
| **Project-gated** | DMAIC #20–#41 (only when projectType=DMAIC active), Kaizen #42–#50 (only for KAIZEN_EVENT variants), Accelerator 30d_* (only for KAIZEN_ACCELERATOR_30D) | Auto-selected by composer; appear only in relevant project window |
| **Role-gated** | Quarterly Planning (Leaders + Champions), Team Intros (Facilitators + Champions), Catalog editor (Champions only) | User sees only activities for their `User.roles[]` |

**This is the methodology's core claim:** the user never needs to SELECT BAM standard activities. They appear automatically when the composer runs. Removing them requires an explicit skip-with-reason action, so standard work is the default state, not something the user opts into.

---

## 4. Compute-timing + confidence decision

From `METHODOLOGY_MECHANICS.md §2, §3`:

**Timing:** **On-demand-at-login** for MVP.

- Composer p95 is 1–2 ms (pure function), ~60 ms with full catalog + varianceQueue hydration from localStorage
- UX §3.3 budget is 300 ms skeleton → 2 s content; on-demand fits comfortably
- No server cron / background job needed
- Migration path: v1.1 adds Hybrid (evening-suggest at 5 pm + morning-refresh on login) behind a feature flag — only if metrics show "user wants it ready before they open the app"

**Confidence-based auto-accept (Next, not MVP):**

- Formula: `dayConfidence = 0.40·phase_match + 0.25·dependency_recency + 0.20·urgency + 0.15·(1 − ambiguity)`, weighted by activity minutes
- Threshold: `dayConfidence ≥ 0.85` → auto-accept without user tap, with 60-second Undo
- Guardrails: user has ≥ 5 prior cycles accepted, no INFEASIBLE in last 3 days, `User.preferences.autoAcceptDaily = true`
- MVP ships with confidence scoring plumbed but auto-accept OFF by default; flip on in v1.1 after adherence data validates the threshold

---

## 5. Infrastructure already in place

Based on Sprint 1–4 shipped code:

- ✓ Composer (`composeDaily` 10 steps, §1.9 golden green, p95 1–2 ms)
- ✓ InvariantEngine (9 failure codes, InfeasibleResult shape)
- ✓ CatalogService (seed 60 entries, validateDag, toggleEnabled)
- ✓ ComposerService wrapper (persist + publish CycleProposed / CycleAccepted / CycleRejected, atomic accept)
- ✓ ClockService (`_now` injection)
- ✓ CycleCard + BucketStrip + ScheduledActivityBlock + Accept/Edit/Reject triad + AutoPlanButton + AdherenceDial (Sprint 4)
- ✓ Event bus + 25 events including `ProjectPaceWarning`, `ScopeChangeRequested`

---

## 6. Infrastructure still needed for this methodology

Prioritized for Sprint 5–6:

| # | Item | Sprint | Cost |
|---|---|---|---|
| 1 | Fine-tune drawer component (3 sliders) | 5 | S (3h) |
| 2 | One-day capacity override (persist in Composition, not User) | 5 | S (2h) |
| 3 | `externalMinutesToday` input wired into ComposerService.composeDaily | 5 | S (2h) |
| 4 | Active-project picker (for Fine-tune) | 5 | S (3h) |
| 5 | Why-chip on ScheduledActivityBlock (Composer Explainer output) | 5 | M (6h) |
| 6 | INFEASIBLE CycleCard state rendering + 4 suggestedAction handlers | 5 | M (8h) |
| 7 | Smart defaults: role inference, timezone inference, sprint anchor inference | 5 | S (4h) |
| 8 | Full 60-entry static JSON catalog export (replaces `browserSeed.js`) | 5 | S (3h) |
| 9 | Confidence scoring attached to each placement's `why[]` entry | 6 | S (4h) |
| 10 | `User.preferences.autoAcceptDaily` + 60 s Undo banner | 6 (v1.1) | M (6h) |

Total new Sprint 5 work: ~31 h (within 48 h capacity). Sprint 6 picks up confidence + auto-accept + v1.1 polish.

---

## 7. Four open coordinator questions

Distilled from both brainstorms:

### Q1 — Calendar integration in MVP (from INPUTS §7.1)
Does MVP need Google / MS Calendar integration to derive `externalMinutesToday`, or is a manual slider in the Fine-tune drawer sufficient?

- **Manual slider (M4 Commitment-First):** Keeps MVP timeline; ship Sprint 5.
- **Calendar integration (M6 Calendar-Driven):** Adds 4–6 weeks to MVP; defer to v1.1.

**Coordinator default:** Manual slider for MVP; calendar integration v1.1.

### Q2 — Fine-tune pre-Accept as "edit"? (from INPUTS §7.4)
When a user adjusts capacity in the Fine-tune drawer BEFORE accepting, does that count as an "edit" for the ≥ 60 % acceptance-rate KPI in `PRODUCT_BLUEPRINT §7.2`?

- **Treat as input, not edit:** Fine-tune sets ComposerInput parameters; composer re-runs; only post-Accept drag / swap fires `CycleEdited`. This is the cleaner interpretation and preserves the "Accept without edit" metric.
- **Treat as edit:** Every Fine-tune tap counts against acceptance rate. Would make the acceptance-rate metric look worse than user experience warrants.

**Coordinator default:** Treat as input, not edit. Fine-tune ≠ `CycleEdited`.

### Q3 — Client-side vs server-side compute (from MECHANICS §9.1)
Where does `composeDaily` actually run?

- **Client-side (browser):** Current MVP architecture (vanilla ES modules + localStorage). Fast, private, works offline. Flips "on-demand-at-login" timing decision toward pure-client.
- **Server-side (future):** Needed once multi-user, calendar integration, or LLM-enhanced agents land. Adds cron job feasibility but introduces network latency.

**Coordinator default:** Client-side for MVP. Ports to server-side in v1.x when a backend lands.

### Q4 — `CycleAccepted { auto: true }` payload field? (from MECHANICS §9.2)
When confidence-based auto-accept flips the day to ACCEPTED without user tap, should the event carry a discriminator so telemetry can distinguish "user accepted" from "system auto-accepted"?

- **Add `auto: boolean` field to `CycleAccepted` payload:** Schema touch; preserves telemetry fidelity for the auto-accept rate metric (Next / v1.1).
- **Infer from other data:** e.g., compare `CycleAccepted.loggedAt` to `CycleProposed.loggedAt`; if identical → auto. Hack-prone.

**Coordinator default:** Add `auto: boolean` to the `CycleAccepted` payload. Event names are public API; adding an optional field is backward-compatible. Do this when auto-accept code lands in v1.1 (Sprint 6+).

---

## 8. Ship order for Sprint 5

The methodology is Sprint-5-shippable. Priority order within the ~31 h of new work:

1. **Smart defaults + role inference** (4 h) — unlocks first-visit experience
2. **Full 60-entry catalog JSON export** (3 h) — unblocks real composition at the browser
3. **Why-chip on ScheduledActivityBlock** (6 h) — makes the "auto" feel trustworthy
4. **Fine-tune drawer** (3 h) — the one knob the user can turn
5. **externalMinutesToday wired** (2 h) — real effect on composer output
6. **INFEASIBLE CycleCard state + 4 action handlers** (8 h) — graceful recovery
7. **One-day capacity override** (2 h) — Fine-tune's most-used lever
8. **Active-project picker** (3 h) — Fine-tune's second-most-used lever

Total: 31 h. Within Sprint 5's 48 h cap. Leaves 17 h for E5 ActivityService (start/close/skip), which the Sprint 3 handoff flagged as Sprint 5 scope.

---

## 9. Recommended answer to the user's question

> "What is the easiest methodology for auto-populating a day based on existing projects and BAM standard best practice activities?"

**Open the app. The day is already composed. Tap Accept.** The composer runs in under 100 ms on the user's own device against their enabled catalog + active projects + yesterday's variance queue. BAM non-optionals (Daily Standup, High-value Communication blocks, Reflections, 4-2-2 shape) are always present without being asked for; project-type activities (DMAIC, Kaizen, Accelerator, PDCA) appear only when a matching project is active; everything else is inferred from role + capacity + timezone defaults. If the user wants to adjust, one Fine-tune drawer with three sliders covers 95 % of real edits — capacity, external meetings, project focus. Dragging individual blocks is still available but not the primary path. If the composer can't fit the day, four named `suggestedActions` let the user unblock in one tap. Target median time from "open app" to "day locked" is **~12 seconds**.

That's the methodology. It reuses the composer Sprint 3 built, the services Sprint 4 wired, and needs ~31 h of new code in Sprint 5 to ship end-to-end.

---

## 10. Status on `origin/main` after this round

- `METHODOLOGY_INPUTS.md` v1.0 (723 lines) — committed `ad60836`
- `METHODOLOGY_MECHANICS.md` v1.0 (739 lines) — committed `ec9457c`
- **`METHODOLOGY_RECOMMENDATION.md` v1.0** (this file) — coordinator synthesis

Three docs, ~1,700 lines, one clear recommendation. Sprint 5 can execute immediately.
