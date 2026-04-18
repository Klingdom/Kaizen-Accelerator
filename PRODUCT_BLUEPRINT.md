# BAM-X Kaizen Operating System — Product Blueprint

Owner: Product Manager / CTO Agent
Status: Draft v0.2 — grounded in `docs/Business Agility Standard Work.txt`, `docs/BAM-X-COMPLETE-BUILD-INSTRUCTIONS.txt`, and `docs/📘 The BAM Way_ Agile Project Mastery.pdf`. Downstream agents (system-architect, ux-designer, backend, frontend, analytics) should treat this as the authoritative scope document.

> **Assumption:** "BAM-X Kaizen OS" is the executable product surface for the BAM framework described in *The BAM Way* and the 50-activity Standard Work catalog. The marketing site (`index.html`, `kaizen-accelerator.html`) and the 30-Day Accelerator consulting offering are treated as a sibling delivery layer that can later consume this OS, not as the scope of this blueprint.

---

## 1. Product Vision

BAM-X Kaizen OS is the executable surface for the Business Agility Mechanism. It turns the BAM Standard Work catalog — a vetted library of ~50 named activities with defined cadences, durations, inputs, and outputs — into a daily, weekly, sprint, and monthly operating rhythm that a knowledge worker or team actually runs. The day is partitioned into the 4-2-2 shape (4h Project Work / 2h Value-Added Communication / 2h Continuous Improvement) as described in Chapters 2, 7, 8, and 9 of *The BAM Way*. Standard activities are auto-composed into the day, week, sprint, and quarter; every completion produces evidence; evidence is harvested into Kaizen candidates. The system is not a calendar and not a task app. It is the source of truth for *which standard activities were run, when, with what result, and what improved as a consequence*.

---

## 2. Core Differentiation

**BAM-X turns the BAM Standard Work catalog into an executable scheduling engine.** Competing products ask the user to invent their own rituals on top of a blank calendar; BAM-X ships a vetted library of named activities (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective, PDCA Cycle, DMAIC SIPOC, Kaizen Event SIPOC, Document Review, High-value Communication Time-blocking, etc.) and assembles them into the user's day, week, sprint, and month automatically.

- **The primitive is a standard activity, not a calendar event.** Every unit of scheduled time is an instance of a catalog entry with a known cadence, duration, procedure, and output artifact. The user cannot invent a block from scratch during planning; they choose (or accept) from the catalog. Ad-hoc work still fits — but as `Deep Work — Project Task` or `Value-Added Communication`, which are themselves catalog entries, so adherence remains measurable.
- **Cycles are compositions, not schedules.** Daily / Weekly / Sprint / Monthly are four composition rules over the same catalog. The Daily cycle inherits the 4-2-2 shape; the Weekly cycle wraps five daily cycles with mid-sprint and weekly-rhythm activities; the Sprint cycle wraps two weekly cycles with Sprint Planning at the open and Sprint Review + Retrospective at the close; the Monthly / Quarterly composition introduces OKR check-in, improvement-week (Sprint 7) reset, and L&D review. The user does not rebuild these each time; the system composes them.
- **Auto-compose, not hand-build.** Given a user's role, capacity, current sprint phase, and active Kaizen, the system proposes the next day / week / sprint / month as a filled-in composition. The user edits the edges; they do not start from zero. 4-2-2 is one of several composition constraints applied during the Daily composition step.
- **Every completion is a measurement, not a checkbox.** Closing a standard activity requires its catalog-defined output (e.g., Sprint Retrospective requires two lists — what went well, what to improve; PDCA Cycle requires a current-condition measurement). The output is the raw material for the next cycle's Kaizen queue, not a nice-to-have journal entry.
- **Kaizen is continuous and promoted from evidence.** The system continuously harvests variances and friction signals from completed activities and stages them as Kaizen candidates. There is no separate "start a Kaizen" wizard; candidates are promoted from already-captured evidence inside standard work.
- **Outcomes are verified, not claimed.** A Kaizen is not done when an action is marked complete. It is done when a remeasured metric beats the baseline by the declared goal, with evidence attached (DMAIC Control Chart, Process Capability, or Kaizen Results Narrative as described in activities 29, 30, and 49 of the catalog).

> **Assumption:** The catalog in `Business Agility Standard Work.txt` (50 numbered activities, with some numbering gaps and several untitled/missing-hours rows such as activities 19, 20, 42, 43) is authoritative. Gaps will be filled with reasonable defaults in the initial data seed and flagged for Phil's review before GA.

---

## 3. Standard Work Catalog & Scheduling Cycles

This is the product's primitive library and the composition engine that sits on top of it. Every feature downstream of this section consumes these two concepts.

### 3.1 The Standard Work Catalog (primitive)

The catalog is the set of named, reusable activities from `docs/Business Agility Standard Work.txt` plus the BAM ceremonies described in *The BAM Way*. Each entry carries: **name**, **focus area**, **default duration**, **cadence** (daily / weekly / sprint / monthly / quarterly / continuous / on-signal), **inputs**, **outputs / required artifact**, **participants**, **trigger**, and **procedure**. Durations below are sprint-hours as given in the source `.txt` unless the activity is explicitly a ceremony in *The BAM Way* (Daily Standup, Sprint Planning, Sprint Review, Sprint Retrospective).

**Continuous Improvement — personal & team cadence**

| # | Activity | Default cadence | Hrs/sprint (src) | Trigger |
|---|---|---|---|---|
| 1 | Personal Learning & Development (L&D Tracker) | Continuous / weekly | 2.0 | Own goal |
| 2 | Team Learning & Development (L&D Tracker) | Continuous / weekly | 2.0 | Team goal |
| 3 | Company Compliance Training | Monthly | 0.5 | Compliance window |
| 4 | Document Review (PRFAQ / MBR / 6 Pager) | On-signal (document received) | 2.0 | Document arrives |
| 5 | Team Introductions & Engagements | Monthly | 1.0 | New partner team |
| 6 | Innovation Process — Explore Opportunities | Continuous | 1.0 | Opportunity discovered |
| 7 | Innovation Process — Evaluate Opportunity | On-signal (opp assigned) | 2.0 | Opp assigned |
| 8 | Innovation Process — PRFAQ | On-signal (opp active) | 2.0 | Opp → Active |
| 9 | Innovation Process — Proof of Concept / Prototype | On-signal (PRFAQ approved) | 2.0 | PRFAQ approved |
| 10 | Innovation Process — Product Assessment | On-signal | 2.0 | Prototype reviewed |
| 11 | Innovation Process — Initiate New Product/Program | On-signal | 1.0 | Assessment approved |
| 12 | PDCA Cycle | Every 48 hours (micro-cycle) | 2.0 | Active experiment |
| 13 | 6S Email Activity | Weekly | 0.5 | Inbox threshold |

**Communications — daily/weekly rhythm**

| # | Activity | Default cadence | Hrs/sprint (src) | Trigger |
|---|---|---|---|---|
| 14 | High-value Communication Time-blocking (30–60 min) | Daily (AM + post-lunch) | 10.0 | Rhythm |
| 15 | High-value team & project meetings (15–30 min) | Weekly | 5.0 | Rhythm |
| 16 | Connecting with other teammates (1:1s, 15–60 min) | Weekly (Wed/Thu) | 2.0 | Rhythm |
| 18 | Document Writing (backlog, updates, blurbs, narratives) | Weekly | 2.0 | Sprint backlog |
| 19 | Refining Program Plan | Sprint | — (src missing) | Sprint phase |

**BAM ceremonies — sprint cadence** (from *The BAM Way* ch. 6 and the `.txt` entries without activity numbers)

| Activity | Default cadence | Duration | Trigger |
|---|---|---|---|
| Sprint Planning (Improvement Planning Meeting) | Every 2 weeks, Mon of Week 1 | 2.0h (2 × 1h segments) | Start of sprint |
| Daily Standup (Daily Improvement Meeting) | Daily | 15 min | Same time each work day |
| Sprint Review (Improvement Sprint Review) | Every 2 weeks, Fri of Week 2 | 1.0h | End of sprint |
| Sprint Retrospective (Improvement Sprint Retrospective) | Every 2 weeks, Fri of Week 2 | 30 min | Immediately after Review |
| Mid-Sprint Review | Every 2 weeks, Fri of Week 1 | 30 min | Mid-sprint checkpoint |
| Quarterly Planning | Quarterly | Half-day | Start of quarter |

**DMAIC Project Work — cadence varies by project phase (activities 20–41)**

Each DMAIC project is a multi-sprint composition that sequences: DMAIC Project Charter → SIPOC → Output Data Collection Plan → Stakeholder Analysis → Communication Plan → Risk Plan → VOC/VOB/VOA → Continuous Reporting Framework → Baseline Output Performance Data → Control Chart → Process Capability Report → MSA Report → Detailed Process Maps → Quick Win Improvements → Cause & Effect Matrix → Inputs Data Collection Plan → Correlation & Regression → FMEA → Process Improvement Backlog → Financial Benefit Translator → Implemented Improvements → Project Results Narrative. These sit in the Sprint / Monthly composition as *Kaizen work*, not in the daily Deep block on their own — they are the payload that the sprint is built around.

**Kaizen Project Work — cadence is event-based (activities 42–50)**

Kaizen Charter → Output Data Collection Plan → Event Scheduling → Event SIPOC → Prioritized Inputs → FMEA → Implemented Improvements → Results Narrative 3-Pager → Process Owner Transition. A Kaizen is a time-boxed event composition that borrows Daily and Weekly cycles for the duration of the event.

> **Assumption:** Activities 17 and numbers skipped in the source file (e.g., 19 with no hours, 20/42/43 marked "Missing") are treated as placeholders; MVP seeds them with conservative defaults (1.0h / sprint, cadence = sprint) and surfaces a "catalog gap" flag so Phil can fill them in-product.

### 3.2 The Four Cycles (compositions)

A **cycle** is a time-bounded composition of catalog activities, produced by the auto-composer from the catalog plus user signals (role, capacity, active Kaizen, sprint phase, calendar load). Non-optional activities must appear; configurable activities may be added, removed, or reordered.

**Daily cycle (1 workday, 8h, 4-2-2 shape)**

- **Non-optional:** Daily Standup (15 min, in Communication bucket); morning High-value Communication block (60 min); post-lunch High-value Communication block (30 min); at least one Deep Work block totalling 4h across the day; one Continuous Improvement block of ≥ 30 min.
- **Configurable:** which CI catalog entry fills the 2h CI bucket today (L&D, PDCA tick, 6S Email, Document Review, Innovation Explore, DMAIC/Kaizen step); whether Deep Work is sliced into 2 × 2h or 4 × 1h; which catalog entry fills the remaining 30 min of Communication.
- **Close-of-day:** 60-second structured reflection on each started activity (plan vs actual + one friction signal). This feeds the Kaizen candidate queue.

**Weekly cycle (5 workdays, 40h project-work capacity)**

- **Non-optional:** 5 Daily cycles; 1 Mid-Sprint Review (Fri Week 1 of a sprint, 30 min); Connecting-with-teammates 1:1 window (Wed or Thu, 20 min); a weekly L&D tick or Document Writing session (catalog #1/#2/#18) in CI time; one 6S Email pass (#13) if inbox threshold tripped.
- **Configurable:** which 1:1s happen; whether Document Review appears (triggered by inbox); which high-value team meetings appear.
- **Close-of-week:** guided 20-minute Weekly Reflection that pulls the week's completed activities, variances, and friction signals into a short DMAIC worksheet. Produces at most one promoted Kaizen candidate if thresholds are met.

**Sprint cycle (2 weeks, 10 workdays, ~40h project work per person per BAM source)**

- **Non-optional:** Sprint Planning (Mon Week 1, 2h, 2 × 1h segments per the `.txt` procedure); 10 Daily cycles; Mid-Sprint Review (Fri Week 1, 30 min); Sprint Review (Fri Week 2, 1h); Sprint Retrospective (Fri Week 2, 30 min, immediately after Review).
- **Configurable:** the Sprint Backlog payload (which DMAIC / Kaizen / Innovation activities fill the team's 4h/day Deep capacity); optional backlog refinement session (Wed Week 2).
- **Close-of-sprint:** Retrospective outputs (two lists — went well / to improve) become prioritized Non-Project Backlog for the next sprint, per the `.txt` procedure. Decision point: Continue Business Agility Mechanism and Sprint Model?

**Monthly cycle (≈ 2 sprints plus a quarterly anchor every third month)**

- **Non-optional:** two Sprint cycles stacked; one Team L&D review tick (#2); one Company Compliance Training check (#3); Kaizen pipeline review (catalog entry: Kaizen Process Owner Transition #50 and Kaizen Results Narrative #49 for any closing Kaizens); on a quarter boundary, Quarterly Planning and Quarter Kickoff.
- **Configurable:** Team Introductions & Engagements (#5); a portfolio-level Document Review pass for MBR / PRFAQ arrivals; whether "Sprint 7" (improvement/reset buffer) fires this month, per the 6+1 model in *The BAM Way* Chapter 5.
- **Close-of-month:** Monthly Check-in (30 min, per *The BAM Way* Chapter 4) that rolls up OKR confidence, sprint-goal completion, and Kaizen throughput.

### 3.3 Auto-compose behavior

The composer runs on each cycle boundary (start of day / week / sprint / month) and takes these inputs:

- **Role signal** — which BAM role the user has agreed to today (Practitioner / Facilitator / Leader / Champion per *The BAM Way* Chapter 3 and 14). Role determines which ceremonies the user is non-optional for (e.g., Facilitators own Sprint Planning facilitation).
- **Capacity signal** — hours available today / this week after fixed external meetings are imported.
- **Sprint phase signal** — where in the 2-week sprint the user is (Planning day / Execution / Mid-sprint / Pre-review / Review day) — this changes which ceremonies fire.
- **Active Kaizen signal** — which DMAIC / Kaizen activity (by catalog #) is the current "payload" for Deep Work blocks this sprint.
- **Variance signal** — what was skipped or ran over in the prior cycle; skipped non-optional activities get rescheduled first.

Output is a filled cycle the user can **Accept**, **Edit**, or **Reject**. Acceptance rate is a first-class success metric (see §6).

### 3.4 Non-optional vs configurable — explicit list

- **Non-optional (standard work — cannot be silently skipped):** Daily Standup; morning and post-lunch High-value Communication blocks; Sprint Planning; Mid-Sprint Review; Sprint Review; Sprint Retrospective; end-of-cycle reflection (daily / weekly). Skipping any of these requires a reason code and is logged as a variance event.
- **Configurable (user or team may choose):** which CI activity fills the daily 2h CI bucket; which DMAIC/Kaizen payload fills Deep Work; 1:1 participants and timing; whether a Document Review appears on a given day; whether Sprint 7 reset fires this quarter.

---

## 4. MVP Scope (strict)

The MVP is a single-user, single-team web application that runs one person's Daily and Weekly cycles end-to-end from the Standard Work catalog, and produces one validated Kaizen per month from captured evidence. Sprint and Monthly composers ship in Next.

### 4.1 Must-have (MVP) — five items

1. **Standard Work Catalog as seeded data.** The catalog from §3.1 ships with the product as editable data (name, focus area, duration, cadence, procedure, inputs, outputs, participants). Users can enable / disable entries for their role but cannot delete the non-optional set. The catalog is the source of truth for every scheduled block.
2. **Daily cycle auto-composer.** Given role, capacity, and active Kaizen, the composer proposes tomorrow's day as a filled 4-2-2 composition of catalog activities, respecting the non-optional set in §3.4. The user can Accept / Edit / Reject before save. A saved day is the commitment artifact.
3. **Weekly cycle auto-composer.** At week open (or Sunday evening), the composer proposes the week as five Daily cycles plus the weekly non-optional activities (Mid-Sprint Review if mid-sprint, one 1:1, one L&D tick, 6S Email if tripped). User accepts or edits.
4. **End-of-cycle reflection tied to Kaizen promotion.** 60-second reflection at close of each catalog activity (plan vs actual + one friction signal), and a guided 20-minute Weekly Reflection that pulls the week's variances and friction signals into a DMAIC worksheet. A single active Kaizen per user is promoted from this queue with baseline / goal / actions / remeasurement. No Kaizen can be closed without a remeasured number.
5. **Adherence + composition dashboard.** Three numbers visible on login: (a) standard-work adherence % over last 14 days (non-optional activities completed vs scheduled), (b) composition acceptance rate % (cycles accepted without edit vs proposed), (c) delta on the active Kaizen's primary metric vs. baseline.

> **Assumption:** Sprint and Monthly composers are pushed to Next. Justification: the Daily + Weekly composers already cover >80% of a user's scheduled time, and both Sprint Planning and Sprint Review are themselves catalog activities that can be placed manually on the correct week in MVP. Shipping the Sprint composer correctly requires modeling sprint phase state, two-week rollovers, and the 6+1 monthly pattern — none of which add behavior that a user can't get from a hand-placed Sprint Planning block in MVP. If the Sprint composer is required at GA, the priority cut goes against dashboard breadth (only (a) ships), not against the composers themselves.

### 4.2 Should-wait (Next — not MVP)

- Sprint cycle auto-composer (incl. 2-week phase state machine and 6+1 quarter awareness)
- Monthly cycle auto-composer (incl. Quarterly Planning anchoring and Sprint 7 reset trigger)
- Team-level rollup view for Team Manager / Facilitator (adherence and composition acceptance across direct reports; top friction signals)
- AI coaching inside the composer ("your Deep block has no linked DMAIC activity — confirm?") — this is an enhancement of auto-compose, not its replacement
- AI weekly DMAIC draft (fills Define/Measure/Analyze from the week's reflections; user edits Improve/Control)
- Multiple concurrent Kaizens per user (capped at 3) with portfolio view for CI Practitioner
- Calendar integration (Google / Microsoft) to pull real meetings into the Communication bucket as catalog instances
- Slack / Teams notifications for ceremony start, end-of-cycle reflection, CI-at-risk
- Standard Work catalog editor for admins / champions (add custom activities, edit procedures, publish to team)
- Kaizen templates library sourced from catalog entries 42–50 and DMAIC entries 20–41
- Mobile companion for starting a scheduled catalog activity and capturing voice reflections

### 4.3 Explicitly excluded (not MVP, not Next — require a new decision)

- General-purpose task management or issue tracking (no Jira / Asana replacement)
- A calendar product (no event creation, invites, RSVPs, timezone arithmetic)
- Meeting transcription, note-taking, or scribe functionality
- Generic AI chat or document generation outside the composer / reflection / DMAIC moments
- Process-mining of screens / keystrokes / browser activity
- Multi-tenant enterprise admin, SSO federation, audit export, data residency controls
- Consultant-delivery workflow for the 30-Day Accelerator engagement
- Gamification, streaks, leaderboards, badges

---

## 5. Feature Hierarchy

### 5.1 MVP

- Standard Work Catalog (seeded from §3.1, editable enable/disable, non-optional locked)
- Daily cycle auto-composer (4-2-2 shape, role + capacity + active-Kaizen inputs, Accept / Edit / Reject)
- Weekly cycle auto-composer (5 daily cycles + weekly non-optionals)
- Scheduled catalog activity instance (start, stop, plan-vs-actual time, linked output artifact)
- End-of-activity reflection (60-second structured prompt)
- Weekly Reflection (guided 20-minute DMAIC flow producing one Kaizen candidate)
- Single active Kaizen record (baseline, goal, actions, remeasurement, close-with-evidence)
- Friction signal capture (any reflection can tag "friction" → Kaizen candidate queue)
- Variance log (every skip or override of a non-optional activity has a reason code, queryable)
- Adherence + composition dashboard (three numbers, always visible on login)

### 5.2 Next

- Sprint cycle auto-composer (Sprint Planning on Mon Wk1 → Mid-Sprint Fri Wk1 → Review + Retro Fri Wk2; respects 6+1 quarter structure)
- Monthly cycle auto-composer (two sprints + monthly check-in; quarter boundary triggers Quarterly Planning)
- Team rollup view for Facilitator / Team Manager (per-person adherence, composition acceptance, friction signals, active Kaizens)
- AI coach inside composer (challenges empty or goal-less blocks; flags when Deep is not linked to an active DMAIC/Kaizen activity)
- AI weekly DMAIC draft (pre-fills Define / Measure / Analyze from reflections)
- Multiple concurrent Kaizens per user (cap 3) + CI Practitioner portfolio view
- Calendar integration (Google / Microsoft) — meetings imported as Communication-bucket catalog instances
- Slack / Teams nudges (ceremony start, end-of-cycle reflection, CI-at-risk)
- Catalog editor for Champions (add / edit / publish custom catalog entries per team)
- Kaizen and DMAIC project templates (activities 20–41 and 42–50 as pre-wired multi-sprint sequences)
- Mobile companion (start activity, voice reflection)

### 5.3 Later

- Org-level CI portfolio view (multi-team Kaizen pipeline, benefits rollup)
- Benchmarking: adherence and composition-acceptance deltas across teams and customers
- Simulation mode ("what if I reclaimed 2h of Communication into Deep this sprint?")
- Process-evidence ingestion (bind catalog instances and Kaizens to captured workflow events)
- Agent SDK (domain agents open scheduled instances, submit reflections, propose Kaizens under governance)
- Benefits / ROI engine (financial translation of Kaizen wins, confidence intervals — extends activity #39 Financial Benefit Translator)
- Marketplace of catalog packs per role and per industry
- Enterprise admin, SSO, audit, data residency, RBAC on Kaizens and catalog edits

---

## 6. Jobs To Be Done

### 6.1 Knowledge Worker (primary MVP persona; BAM role: Agile Practitioner)

- **Goals:** Spend more of the day in the Deep 4h bucket, run the standard ceremonies without thinking about what they are, stop losing the 2h CI block to reactive work.
- **Pain points:** Blank calendar means every day is reinvented; Sprint Planning and Retrospective exist on paper but don't happen in practice; reflections live in performance reviews, not in the day; skipped CI time leaves no trace.
- **Behaviors to change:** Accept a pre-composed day instead of writing one. Run Daily Standup at the same time every work day (per `.txt` procedure). Close every catalog activity with a reflection. Treat a skipped non-optional activity as a logged variance.
- **JTBD statements:**
  - When I open the system in the morning, I want tomorrow already composed as a 4-2-2 day of catalog activities — Daily Standup, two High-value Communication blocks, two Deep blocks, and one CI activity — so I can start executing instead of planning from zero.
  - When a scheduled catalog activity ends (e.g., a PDCA tick, a Document Review), I want a 60-second reflection that writes straight into the catalog entry's required output field, so the sprint's evidence is captured while it is still fresh.
  - When a week ends, I want a 20-minute guided DMAIC Weekly Reflection over my own completed activities, so one concrete improvement is promoted from evidence instead of from memory.

### 6.2 Product / Program Leader (BAM role: Agile Leader)

- **Goals:** Protect Deep Work time for program thinking, see whether strategic sprints are actually running their standard ceremonies, spot program drift before Sprint 6.
- **Pain points:** "Strategy block" is silently eaten by escalations; the calendar has a Sprint Review on it but no evidence of the Retrospective that should follow; DMAIC work lives on slides, not in the sprint's actual hours.
- **Behaviors to change:** Defend Deep blocks via the variance log. Use the Weekly Reflection to pick one program-level friction per week. Tie at least one Kaizen per month to a program-level metric (cycle time, predictability, quality).
- **JTBD statements:**
  - When a Deep block is broken by an escalation, I want a one-tap variance with reason code, so by end of quarter I can see the true cost of interruptions from the variance log instead of arguing from memory.
  - When I run my Weekly Reflection, I want the top three recurring frictions surfaced from my own completed catalog activities, so my next Kaizen is promoted from evidence instead of brainstormed on a Monday.
  - When I declare a Kaizen, I want baseline, goal, and remeasurement dates to be non-optional fields tied to DMAIC activity #28 (Baseline Output Performance Data) and #29 (Control Chart), so the close step refuses to fire without real before/after data.

### 6.3 Team Manager (BAM role: Agile Facilitator)

- **Goals:** See whether the team actually ran Sprint Planning, Daily Standups, Mid-Sprint Review, Sprint Review, and Retrospective as standard work — not just as items in a doc. Coach from the variance log, not from vibes.
- **Pain points:** No shared artifact of how the team's time was spent against standard work; 1:1s are opinion-vs-opinion; "continuous improvement" is a line in the team charter that no one runs.
- **Behaviors to change:** Stop asking "how's the sprint going" and open the adherence view on the standard ceremonies. Promote improvement projects from the team's variance log, not from a brainstorm. Hold the line on the weekly 1:1 window (Wed/Thu per activity #16).
- **JTBD statements (Next, since rollup ships in Next):**
  - When I open Monday morning, I want each direct report's last-week adherence across the non-optional catalog activities (Daily Standup, Sprint Planning, Review, Retrospective, CI block, end-of-cycle reflection) plus their top friction signal, so I can coach from evidence.
  - When a team member's CI block is consistently crushed, I want the pattern flagged with reason codes aggregated from the variance log, so I can fix the upstream cause (meeting load, priority inversion) instead of blaming the person.
  - When the team closes a Kaizen, I want baseline, goal, and remeasured number visible side-by-side — tied to the catalog's Kaizen Results Narrative (#49) and Control Chart (#29) outputs — so I can decide whether to replicate it with another team.

### 6.4 CI / Kaizen Practitioner (BAM role: Agile Champion)

- **Goals:** Run many small Kaizens promoted from real variances, keep a visible DMAIC and Kaizen pipeline (activities 20–41 and 42–50), prove ROI using the Financial Benefit Translator (#39) without bespoke spreadsheets.
- **Pain points:** Kaizen events produce action lists that die in two weeks; no running pipeline of candidates; baselines and remeasurements are ad hoc; benefits claims are unverifiable.
- **Behaviors to change:** Start Kaizens only from the variance / friction queue (not from workshops). Refuse to close a Kaizen without the catalog's required output artifacts. Sequence DMAIC steps across sprints as a visible composition.
- **JTBD statements:**
  - When I open the Kaizen pipeline, I want candidates promoted from real variances and friction signals captured by the daily reflection step, so I pick the highest-leverage one instead of inventing a topic for the next workshop.
  - When I declare a Kaizen, I want baseline capture (#28), goal definition, dated action plan, and remeasurement to be one linked record through the catalog's Kaizen and DMAIC entries, so I can prove before / after without reconstruction.
  - When a Kaizen closes, I want the system to refuse closure without a remeasured number that beats baseline — or an explicit "failed, here is the learning" attached to Kaizen Results Narrative 3 Pager (#49) — so the portfolio shows truth rather than claimed wins.

---

## 7. Success Metrics

All metrics are measured per-user for MVP; team and portfolio rollups arrive in Next.

### 7.1 Baseline (pre-MVP)

- **Standard Work adherence (non-optional activities completed on time with required artifact):** assumed baseline ~0% — the catalog does not exist as a live artifact in the user's tooling before the product. Baseline is established from the user's first two full weeks in-product.
- **Composition acceptance rate (cycles accepted without edit):** no baseline — behavior does not exist.
- **Kaizens closed with remeasured evidence (personal):** assumed baseline 0–1 per year per knowledge worker.
- **End-of-activity reflection rate:** assumed baseline ~0%.

> **Assumption:** These baselines are estimated from consulting experience, not a measured customer sample. A real baseline must be captured from the first 20 MVP users before any target is used externally.

### 7.2 Target outcomes (end of 90-day MVP period)

- **Standard Work adherence:** ≥ 70% of scheduled non-optional catalog activities completed with their required output artifact, measured over the user's last 14 working days, for ≥ 70% of weekly-active users. (Adherence is a first-class metric; it is the direct test of "does standard work actually run?".)
- **Composition acceptance rate:** ≥ 60% of proposed Daily cycles and ≥ 50% of proposed Weekly cycles accepted without edit. (Tests whether the auto-composer is proposing the right thing; < 50% means the composer is guessing wrong.)
- **Reflection rate:** ≥ 75% of completed catalog activities have a reflection captured within 15 minutes of close.
- **Kaizen throughput:** ≥ 1 validated Kaizen closed per user per month (validated = remeasured primary metric attached, delta vs. baseline recorded, positive or negative).
- **Evidence-grounded improvement:** ≥ 50% of closed Kaizens show a primary-metric improvement of ≥ 10% vs. declared baseline. The other 50% are allowed to be honest failures; the metric is truthfulness of the portfolio, not a forced win rate.

### 7.3 Leading indicators (within first 14 days of a user's lifetime)

- **Daily composition rate:** % of working days where a composed 4-2-2 day existed (accepted or edited) before 9:00 local. Target ≥ 50% by day 14.
- **Composition acceptance rate (early):** % of proposed Daily cycles accepted without edit in week 1 and week 2. Expect a dip in week 1 while the composer learns the user's capacity and active Kaizen; target ≥ 40% by day 14.
- **Intention / output completeness:** % of scheduled catalog activities that have a declared intention and a captured output artifact at close. Target ≥ 80% by day 7.
- **End-of-activity reflection rate:** ≥ 50% by day 7, ≥ 75% by day 14.
- **Friction signal capture:** ≥ 3 friction signals logged in week 1 (required raw material for the first Weekly Reflection).
- **First Weekly Reflection completed by end of week 2.**

### 7.4 Launch metric (single number)

- **Active-user composition-and-reflection rate at day 14:** percentage of signups who, by their 14th calendar day, have accepted or edited ≥ 7 composed Daily cycles, captured ≥ 1 reflection on each of those 7 days, and completed 1 Weekly Reflection. Launch is successful if this number is ≥ 35%.

### 7.5 Post-launch metric (single number to judge durability at 90 days)

- **Validated Kaizens per monthly-active user per month,** sustained for two consecutive months. Target ≥ 1.0. This is the metric that proves behavior change. Anything below means the product is being used as a scheduler rather than as a Kaizen OS and the scope must be corrected.

---

## Handoff Notes for Downstream Agents

- **system-architect:** The core entities are Standard Work Catalog Entry, Cycle (Daily / Weekly / Sprint / Monthly), Composition (a filled Cycle instance), Scheduled Activity (an instance of a Catalog Entry inside a Composition), Reflection, Variance, Friction Signal, Kaizen, Baseline Metric, Remeasurement. The 4-2-2 shape is a domain invariant on the Daily composition, not a UI preference. The non-optional set in §3.4 is a domain invariant on each Cycle.
- **ux-designer:** Three load-bearing rituals in MVP: (1) the composer Accept / Edit / Reject moment at start-of-day and start-of-week, (2) the 60-second end-of-activity reflection, (3) the 20-minute Weekly Reflection. Everything else can be ugly at MVP. These cannot.
- **analytics:** Instrument the six leading indicators in §7.3 before shipping; the launch metric in §7.4 is computed from them. The composition acceptance rate must be instrumented per cycle type, not aggregated — Daily and Weekly are expected to move at different speeds.
- **backend / frontend:** Refuse to let a composed cycle save without the non-optional set from §3.4. Refuse to let a Kaizen close without a remeasured number tied to Catalog #28 / #29 outputs. These are product rules, not validation niceties.
- **Open questions flagged for Phil / coordinator:**
  - Is the catalog in `Business Agility Standard Work.txt` the final canonical list, or should the *BAM Way* Chapter 14 role-based standard work (Practitioner / Facilitator / Leader / Champion daily and sprint commitments) be merged in as additional catalog entries before MVP seed?
  - Activities 17, 19, 20, 42, and 43 are incomplete in the source `.txt`. Should the MVP seed ship with Phil-filled values, or with placeholders flagged in-product?
  - Is MVP single-user (as scoped here) or does it need a two-person team case from day one to exercise Sprint Planning as a shared ceremony?
  - Is there a specific role / industry beachhead (e.g., product managers at 50–500 person SaaS) that should tighten the Practitioner persona before UX design begins?
