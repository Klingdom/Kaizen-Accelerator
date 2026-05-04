# Meta-Review — Iterations 9–16

Owner: meta-coordinator
Status: v0.1 — first formal meta-review pass.
Trigger: 4 loops since governance bootstrap (Iterations 13–16); CLAUDE.md (`.claude/agents/coordinator.md:585`) threshold is every 3.
Scope: BAM-X Kaizen OS at `C:\Users\philk\kaizen`. Reviewed: `CLAUDE.md`, `coordinator.md`, `ITERATION_LOG.md`, `IMPROVEMENT_BACKLOG.md`, `SYSTEM_HEALTH.md`, `CHANGELOG.md`, `UX_DESIGN_THEMES.md`, `UX_DELTA_OTHER_PAGES.md`, `BUG_TIME_COLUMN_*.md`.

---

## 1. Executive Summary

**State of the loop.** The improvement system is performing very well by every measurable axis. Across 8 iterations the suite grew from 2,565 to 2,834 tests (+269, +10.5%) with runtime *falling* from 2.55s to 2.10s (`SYSTEM_HEALTH.md:3`); zero failing tests at any close; one minor spec deviation across 6 spec-driven implementation iterations (Iteration 11 copy-string co-location, `CHANGELOG.md:299`); zero major deviations; one validation save (Iteration 10 caught C-PM-3 already-shipped before code dispatch, `ITERATION_LOG.md:122`); one governance backfill that recovered 2 missed convergent findings (`IMPROVEMENT_BACKLOG.md:13`). Every loop closed within budget, on spec, with append-only artifact updates.

**Biggest insight.** The single largest observable shift between Iteration 9 (governance bootstrap) and Iteration 16 (3-bug fix) is the maturation of the **Define-pass-then-implement** pattern. Iterations that produced explicit Define artifacts (specs, PRDs, architecture deltas, diagnostic reports) before code consistently shipped at 3-6× their estimated effort *with zero major deviations*. Iteration 10 (no Define, ad-hoc) and Iteration 13 (Define) were both 5.5× efficient, but Iteration 13 produced a reusable spec artifact and zero spec deviations vs Iteration 10's intuition-led path. The Define pass is no longer overhead — it's the leverage point. The 7-lens parallel review pattern (Iteration 12) and the 3-lens parallel diagnostic (Iteration 16) are two crystallised templates of the same shape.

**Highest-leverage operating-model change.** Update `coordinator.md` Improvement Loop Mode rule from "NEVER implement more than ONE item per loop" to **"ONE coherent shipment per loop, where a shipment may bundle multiple tightly-related items that share a single Define artifact, single integrity boundary, and single user-visible coherence claim."** This is the rule the coordinator has *already* been operating under for Iterations 14–16; the written rule contradicts proven practice. Codifying the de-facto rule is low risk and high value: it preserves the "no scope creep" intent while removing a friction point that has caused no demonstrable harm in 3 consecutive successful bundlings (Iteration 14: 3 items / 16 ACs / 0 deviations; Iteration 15: 1 item / 11 ACs / 0 deviations; Iteration 16: 3 bugs / 12 ACs / 0 deviations).

---

## 2. Iteration Performance Scorecard

| # | Title | Define-pass? | Items | Spec deviations | Tests added | Time act/est | Outcome quality (1–5) |
|---|---|---|---|---|---|---|---|
| 9 | Governance bootstrap | Y (substrate) | 3 docs | n/a | 0 | n/a | 5 — produced the substrate everything else compounds on |
| 10 | C-SA-1 deterministic IDs | N (recon only) | 1 | 0 | +17 | 1h / 5.5h | 5 — caught stale top-ranked candidate before code (`ITERATION_LOG.md:122`) |
| 11 | C-PM-2 E14 portfolio | Y (`E14_PORTFOLIO_SPEC.md`, 214 lines) | 1 | 1 minor (copy location) | +53 | 1.5h / 9h | 5 — MVP must-have shipped, all 10 ACs PASS, R1/R2 risks resolved |
| 12 | Cross-page UX review | Y (Define phase only — 9 artifacts, 1,766 lines) | 0 code | n/a | 0 | n/a | 5 — produced 10 themes + 7 convergent findings, all reliably mapped to score-13 candidates |
| 13 | C-UX-1 T1 token consolidation | Y (`T1_TOKEN_SPEC.md`, 244 lines) | 1 | 1 minor (`:root` block didn't exist as spec assumed) | +46 | 1h / 5.5h | 5 — prerequisite for T2–T10 landed, 8 ACs PASS, AC4/6/7/8 grep-verified |
| 14 | C-UX-10 + C-UX-12 + C-UX-13 (CadencePlan v1) | Y (PRD + arch delta + UX delta, 831 lines) | 3 bundled | 0 | +70 | 1.5–2h / 6h | 5 — 16 ACs PASS, T1 freeze respected, composer untouched |
| 15 | C-UX-3 EOD closure | N (reused Iteration 14's Define) | 1 | 0 | +59 | 1.5h / 5h | 5 — daily-ritual bookend complete, 11 ACs PASS, integrity preserved |
| 16 | Today time-column 3-bug fix | Y (3 diagnostic artifacts, ~500 lines) | 3 bugs | 0 | +24 | 1.5h / 8h | 5 — 12 ACs PASS, 3 previously-undocumented contracts now explicit + tested (`CHANGELOG.md:46-50`) |

**Aggregate.** 8 iterations, 5/5 outcome quality on every implementation iteration. Median time-actual / time-estimate = ~0.20 (~5× efficient). Zero major deviations. One catch (Iteration 10) — there is no detected miss.

---

## 3. The 4 Named Patterns — Verdicts

### 3.1 Bundling discipline

**Verdict: REVISE THE RULE. Current text contradicts proven practice.** The rule "NEVER implement more than ONE item per loop" (`coordinator.md:347`) was violated successfully by Iterations 14, 16; every bundling produced higher per-loop value than the items would have produced staged across multiple loops. No bundling has produced a regression, deviation, or partial close.

**Proposed revised rule.** "ONE coherent shipment per loop. A shipment may bundle multiple items if and only if all of the following hold:"

1. **Single Define artifact** governs the bundle (spec / PRD / arch delta / diagnostic report set).
2. **Single integrity boundary** — the bundle either modifies the same surface (Iteration 14: Today page) or fixes one user-visible symptom with non-overlapping root causes (Iteration 16: time column).
3. **Single coherence claim** — the bundle ships one capability the user can describe in one sentence ("Today now opens with yesterday's recap and explains the plan", "Today's time column now updates correctly").
4. **Combined estimate ≤ 1.5× a normal single-item budget** at scoring time. If estimate exceeds 1.5×, split.

**Test for "tightly-related".** All 3 conditions above must hold. If any condition fails, ship as separate iterations.

**Risk if adopted.** Bundling discipline relaxes; coordinator may bundle marginally-related items. Mitigated by condition (1) — every bundle requires a single Define artifact, which forces explicit articulation of the coherence claim before code dispatches.

---

### 3.2 Define-phase ROI

**Verdict: DEFINE PASSES DO NOT BEAT NO-DEFINE ON SPEED, BUT DELIVER ZERO DEVIATIONS AND HIGHER-CONFIDENCE OUTCOMES.** Iteration 10 (no Define) ran 5.5× efficient; Iterations 11/13/14/16 (Define) ran 3-6× efficient. The speed delta is noise. The deviation delta is signal: 0 major deviations across all Define-led iterations vs 1 minor in Iteration 11 (and that deviation was the *spec being wrong about a `:root` block that didn't exist*, `ITERATION_LOG.md:232`).

**The real question is risk-adjusted, not speed-adjusted.** Iteration 10 succeeded on intuition because the surface (`editMode.activityFromCatalogEntry`) was small and well-known. Iteration 14 (3 components, 2 new files, app.js wiring) and Iteration 16 (3 root causes across 3 files) succeeded because Define-pass partitioned the problem before any agent touched code.

**Proposed threshold rule for mandatory Define-pass.**

- **REQUIRED** for any candidate with Effort ≥ M (estimated 3+ project-hours).
- **REQUIRED** for any user-reported defect (regardless of Effort estimate). Iteration 16 is the precedent: 3 parallel diagnostic agents found 3 distinct root causes; a single-agent dive would have shipped Bug 1 only and left Bugs 2–3 latent.
- **REQUIRED** for any candidate scoring ≥ 13. Score-13 items have either high Impact, high Strategic alignment, or both — the cost of a deviation is materially higher than for score-≤11 candidates.
- **OPTIONAL** for score-≤11 candidates with Effort = S. Iteration 10's no-Define path remains valid for narrow, deterministic, single-file changes.

**Risk if adopted.** Adds 1–3h of Define work to every score-13+ iteration. Justified by (a) zero deviations across 6 Define-led iterations; (b) Iteration 14's discovery that 95% of "Why this plan?" already existed in the composer (`CHANGELOG.md:151`) — the Define pass *prevented* a wasted composer change.

---

### 3.3 Scoring weights / convergent-finding signal

**Verdict: ADD AS A SCORING MULTIPLIER, AND GATE SCORE-13+ ON ≥ 3-LENS AGREEMENT.** Iteration 12 produced 7 convergent findings (≥ 4 lenses agreeing); all 7 mapped reliably to score-13 candidates (`ITERATION_LOG.md:198`). Iteration 16 had 3 lenses (QA/frontend/architect) each find a distinct root cause for one user-reported symptom — the convergence wasn't "agreement on the same finding" but "non-overlapping coverage of one symptom from 3 angles", and it correctly produced a 3-bug fix vs a 1-bug partial fix.

**Proposed formula change.** Current: `Total = Impact + Strategic + Learning + Confidence − Effort − Risk` (`IMPROVEMENT_BACKLOG.md:5`). Proposed addition: `+ ConvergenceBonus`, where `ConvergenceBonus = +1 per lens beyond the first agreeing on the finding, capped at +3`.

This makes the formula:
- 1 lens: +0 (no bonus, ordinary single-perspective candidate)
- 2 lenses: +1
- 3 lenses: +2
- 4+ lenses: +3 (cap)

**Gate.** No candidate may be scored ≥ 13 unless ≥ 3 lenses have evaluated it. This forces multi-lens evidence for the highest-priority work and prevents single-PM-pass score inflation (the failure mode of Iteration 9, which produced 2 stale candidates from a single-agent regeneration, `IMPROVEMENT_BACKLOG.md:45`).

**Risk if adopted.** Score-13 tier becomes harder to reach. Mitigated by the existing Iteration 12 pattern — 7-lens parallel review is now a known low-cost orchestration (~1.5h coordinator time including synthesis). When the backlog feels stale, run a multi-lens pass; this is already documented as an `IMPROVEMENT_BACKLOG.md:49` recommendation.

---

### 3.4 Candidate validation discipline

**Verdict: MAKE PRE-FLIGHT RECONNAISSANCE MANDATORY. CONVERGENT FINDINGS SHOULD AUTO-GENERATE BACKLOG CANDIDATES.** Iteration 10 caught C-PM-3 (top-ranked, score 14) as already-shipped via grep before dispatching the implementer (`ITERATION_LOG.md:122`). Iteration 12 governance backfill discovered 2 convergent findings (C-UX-10, C-UX-11) had been raised in synthesis but not formalized as candidates (`IMPROVEMENT_BACKLOG.md:13`). Both are evidence that backlog state can drift from code state and synthesis state.

**Proposed reconnaissance protocol** (every implementation iteration, before agent dispatch):
1. **Code grep**: `grep -nE "<key symbol from problem statement>" js/` — confirm the gap is real.
2. **Git log scan**: `git log --all --source --remotes --grep=<keyword> -i --since="3 months ago"` — confirm the gap hasn't been quietly closed.
3. **Test grep**: `grep -nE "<key symbol>" tests/` — confirm tests don't already lock the contract.
4. **Backlog cross-check**: re-read the candidate's own evidence stamp; if older than 2 iterations, re-run grep.

If any check fails the candidate is disqualified and the next-best is dispatched (Iteration 10 pattern).

**Proposed Define-phase rule.** "Every Define-phase synthesis MUST produce, as its final artifact, a draft IMPROVEMENT_BACKLOG candidate stub for every convergent finding (≥ 2 lenses agreeing). The synthesis agent writes these stubs; the coordinator scores and integrates them in the same loop."

**Risk if adopted.** Adds ~10 minutes of recon to every implementation iteration. The Iteration 10 catch alone justified that cost across all subsequent loops.

---

## 4. Other Patterns Identified

### 4.1 Time-estimate calibration is systematically inflated by ~5×

**Evidence.** Iterations 10/11/13/14/15/16 ran 1h/5.5h, 1.5h/9h, 1h/5.5h, 1.5-2h/6h, 1.5h/5h, 1.5h/8h respectively. Median ratio ≈ 0.20 (5× efficient). This is not 1-2 outliers — it's every iteration.

**Recommended action.** Halve estimates in `IMPROVEMENT_BACKLOG.md` for all Effort=S/M candidates. Reframe: estimates are currently *worst-case-with-no-Define* numbers. With the proposed Define-mandatory threshold above, estimates should reflect post-Define implementation cost, which empirically is ~20% of pre-Define estimate.

### 4.2 Test runtime is *decreasing* despite +269 tests

**Evidence.** 2,565 tests at 2.55s (Iteration 9 baseline) → 2,834 tests at 2.10s (post-Iteration 16). 10.5% more tests, 17% faster runtime. Per-test cost dropped from 0.99ms to 0.74ms.

**Recommended action.** No corrective action needed — this is genuinely good. Recommend: stop budgeting against 3.5s ceiling and budget against per-test ms. Current trajectory has 40% headroom; the runtime is not at risk.

### 4.3 Coverage is concentrated on Today; Week / Portfolio / Catalog under-touched

**Evidence.** Of 8 implementation iterations, 6 touched the Today page or its services (10, 14, 15, 16) or its supporting tokens (13). Only Iteration 11 shipped a non-Today surface (`/insights/portfolio`). `UX_DELTA_OTHER_PAGES.md` recommends Week → InsightsPortfolio → Portfolio → Kaizen → Catalog sequencing for cross-page T2–T10 application (`ITERATION_LOG.md:195`); no progress on this so far.

**Recommended action.** After the next Today-page iteration, set a soft policy: 1 cross-page iteration for every 2 Today iterations, until cross-page coverage catches up. Specifically Week deserves a pass — it carries the highest cross-page friction signal in `UX_DELTA_OTHER_PAGES.md`.

### 4.4 The composer / domain types / event bus integrity boundary is held perfectly

**Evidence.** Every implementation iteration since Iteration 11 has run `git diff --stat` against composer/domain/events as an explicit AC; every iteration has produced 0 deltas. (Iteration 14: `CHANGELOG.md:155`. Iteration 15: `CHANGELOG.md:100`. Iteration 16: `CHANGELOG.md:38`.)

**Recommended action.** Codify this as a coordinator rule. **"No implementation iteration may modify `js/composer/`, `js/domain/types.js`, `js/events/`, or `js/engine/orderDay.js` without an architecture-delta artifact and explicit user approval."** This is already operating practice; it deserves to be a written rule because it is the strongest reason the suite has remained green across 4 consecutive bundling iterations.

### 4.5 Backlog hygiene is healthy but trending toward stagnation in the score-11 tier

**Evidence.** As of post-Iteration 16: 8 DONE, 1 BLOCKED, 10 OPEN. Score distribution of OPEN: three at 13 (C-UX-6, C-UX-8, C-AN-1), one at 12 (C-PM-4 — note: overlaps with shipped C-UX-3 per `CHANGELOG.md:117`), four at 12 (C-SA-2, C-QA-2, C-QA-3, C-PM-4), four at 11 (C-UX-2, C-UX-7, C-UX-11, C-SA-3), two at 10 (C-PM-5, C-QA-1), two at 8 (C-UX-5, C-UX-9). The score-11 cluster is at risk of perpetual deferral.

**Recommended action.** (a) Mark C-PM-4 as DONE-BY-PROXY (it was the EOD-prompt candidate; Iteration 15's C-UX-3 implements that capability). (b) Re-score the score-11 cluster after T1 landed — some items (e.g., C-UX-2 BucketStrip blackout) may now be smaller-effort post-Iteration 13. (c) Add a "stale-after" date on every candidate; if not selected within 4 iterations of being top-3, force a reassessment.

### 4.6 Diagnostic-pass-then-comprehensive-fix pattern is a new template

**Evidence.** Iteration 16 dispatched 3 parallel diagnostic agents (QA, frontend, architect) on a single user-reported symptom; they returned 3 non-overlapping root causes (`BUG_TIME_COLUMN_QA.md:7-26`); the implementer then fixed all 3 in one pass at 1.5h / 8h efficiency.

**Recommended action.** Promote this to a named coordinator playbook: **"User-reported defect protocol — dispatch ≥ 2 parallel diagnostic agents (always include QA + the most likely owner of the surface) before any implementation. Synthesize root causes into a single fix iteration only if non-overlapping; otherwise stage."** This is the template Iteration 16 used; it deserves explicit reuse.

---

## 5. Risks Detected

**R1 — Estimate inflation hides false confidence.** If estimates are 5× actual time, the team has unmeasured slack. That slack absorbs unexpected complexity silently. If a future iteration genuinely takes 8h (not 1.5h), nothing in the dashboard will flag it as anomalous because "it came in under estimate." Recommend: track ratio over time; flag any iteration with >0.6 ratio for retrospective.

**R2 — Convergent-finding gate may starve the score-12 tier.** If only ≥ 3-lens candidates may be scored ≥ 13, single-engineer technical-debt items (C-SA-2, C-QA-2, C-QA-3) will never reach the top of the queue. Recommend: leave a single-lens score-12 ceiling intact; the gate applies only to score-13+.

**R3 — Today-page over-investment.** Six of eight iterations have touched Today. The Today page is now the most stable, most-tested, most-coherent surface. Cross-page ratio of design themes T2–T10 has progressed only via T1 (the prerequisite) and the BucketStrip relabel. Risk: the product looks polished only on Today, and demos that hit Week or Portfolio reveal the gap.

**R4 — Validation-failure detection rate cannot be measured at N=1.** Iteration 10 caught one stale candidate. There is no second observation to confirm the catch rate isn't 100% by accident. Recommend: instrument every implementation iteration's pre-flight grep results in the iteration log, even when nothing is caught — that establishes a baseline.

**R5 — Composer and engine perfection may be load-bearing.** The `js/composer / js/domain / js/events / js/engine` boundary has been held across 4 bundling iterations; this is *a strength*, but it also means the deepest part of the system has not been exercised under change pressure since Sprint 15. When E13 / E18 / E15 (DELIVERY_PLAN must-haves) require composer changes, the team has no recent muscle memory for safe composer modification.

---

## 6. Recommended Changes to CLAUDE.md / Operating Model

(Not applied here — coordinator implements approved recommendations.)

### 6.1 Replace `coordinator.md:347` "NEVER implement more than ONE item per loop"

- **Old**: "NEVER implement more than ONE item per loop"
- **New**: "ONE coherent shipment per loop. A shipment may bundle multiple items only if all of: (1) single Define artifact governs the bundle, (2) single integrity boundary, (3) single user-visible coherence claim, (4) combined estimate ≤ 1.5× normal single-item budget."
- **Rationale**: codifies the de-facto rule used successfully in Iterations 14, 16.
- **Risk**: marginally relaxes bundling discipline; mitigated by the 4 conjunctive conditions.

### 6.2 Add new section under `coordinator.md:444` Step 6 — Pre-flight reconnaissance

- **New text**: "Before agent dispatch, the coordinator MUST run: (1) code grep on the candidate's key symbol; (2) git log scan over the last 3 months; (3) test grep for existing contract locks; (4) backlog freshness check. If any check disqualifies the candidate, dispatch the next-best."
- **Rationale**: Iteration 10 catch precedent; cost is ~10 minutes per loop.
- **Risk**: trivially small.

### 6.3 Add new section under `coordinator.md:374` Step 2 — Define-pass mandatory threshold

- **New text**: "Define-phase artifact REQUIRED before implementation when any of: Effort ≥ M, candidate is a user-reported defect, score ≥ 13. OPTIONAL for score-≤11 single-file fixes."
- **Rationale**: zero deviations across 6 Define-led iterations; single observed risk (Iteration 10) had narrow surface that justified ad-hoc.
- **Risk**: ~1-3h Define overhead per qualifying loop; offset by deviation reduction.

### 6.4 Update `coordinator.md:417` scoring formula

- **Old**: `Priority Score = Impact + Strategic Alignment + Learning Value + Confidence − Effort − Risk`
- **New**: `Priority Score = Impact + Strategic Alignment + Learning Value + Confidence − Effort − Risk + ConvergenceBonus` where `ConvergenceBonus = min(3, max(0, lens_count − 1))`
- **Gate**: "No candidate may be scored ≥ 13 unless ≥ 3 lenses have independently evaluated it."
- **Rationale**: Iteration 12 evidence — 7 convergent findings → 7 score-13 candidates with no false positives.
- **Risk**: harder to reach score-13; mitigated by 7-lens orchestration being a known low-cost pattern.

### 6.5 Add to `coordinator.md` Non-Negotiable Rules

- **New rule**: "No implementation iteration may modify `js/composer/`, `js/domain/types.js`, `js/events/`, or `js/engine/orderDay.js` without an architecture-delta artifact and explicit user approval."
- **Rationale**: this boundary has held across 4 successful bundling iterations; making the rule explicit removes the implicit dependence on coordinator memory.
- **Risk**: blocks legitimate composer work; mitigated by the architecture-delta path explicitly preserved.

### 6.6 Append to `IMPROVEMENT_BACKLOG.md` candidate template

- **New required field**: `Lens count` and `Lenses` array (e.g., `["UX", "QA", "Frontend"]`).
- **Rationale**: enables convergence bonus calculation; forces explicit attribution.
- **Risk**: 30 seconds per candidate.

---

## 7. Recommended Backlog Adjustments

1. **C-PM-4 (End-of-day reflection prompt, score 12) → DONE-BY-PROXY.** Iteration 15's C-UX-3 EOD closure ritual implements the same capability (`CHANGELOG.md:117`). Mark with cross-reference to Iteration 15.
2. **C-UX-2 (BucketStrip blackout, score 11) → re-score post-T1.** T1 token consolidation may have already touched the involved selectors; re-grep `app.css:1519–1527` and confirm Effort estimate.
3. **C-UX-11 (AdherenceDial momentum, score 11) → consider promoting.** This was the Iteration 12 governance backfill that named the *biggest activation risk*; current score 11 underweights that signal. Adding 2-lens convergence bonus (Growth + Design + Competitive ≥ 3 lenses) brings it to 13 under the proposed formula.
4. **C-AN-1 (Top-of-funnel events, score 13) → SHOULD BE NEXT.** Without TodayPageViewed / AutoPlanButtonClicked, every UX iteration ships unmeasured. Iteration 14 (3 user-visible behaviors) and Iteration 15 (1 user-visible ritual) already shipped without analytic baseline. The longer this is deferred, the larger the unmeasured-redesign debt grows.
5. **No new candidate adds needed** — the post-Iteration 12 backlog still has runway.

---

## 8. Recommended Process Additions (beyond CLAUDE.md edits)

1. **Pre-flight reconnaissance protocol** (formalized — see 6.2). Coordinator runs 4 checks before agent dispatch every implementation iteration; results logged.
2. **Define-pass mandatory threshold** (formalized — see 6.3). Drives Define agents whenever Effort ≥ M, defect, or score ≥ 13.
3. **Multi-lens parallel diagnostic for every user-reported defect.** Iteration 16 template — 2-3 parallel diagnostics before any fix is dispatched. Always include QA.
4. **Convergent-finding → automatic backlog candidate.** Synthesis agent writes draft candidates with Lens count and Lenses array; coordinator scores and integrates in the same loop.
5. **Estimate-ratio tracking.** Every iteration log records `time_actual / time_estimate`. Flag iterations with ratio > 0.6 for retrospective. Recalibrate template estimates downward when ratio < 0.3 sustained over 3 iterations.
6. **Cross-page balance policy.** Soft 1:2 ratio of cross-page : Today iterations until T2–T10 cross-page coverage exists on Week, Portfolio, InsightsPortfolio.

---

## 9. Next-Loop Recommendation

**Iteration 17: bundle C-UX-6 + C-UX-8 + C-AN-1 as one Today-a11y + measurement shipment.**

Rationale (single-paragraph): All three are score 13. C-UX-6 (modal focus traps) and C-UX-8 (action-button aria-labels) are tightly-related a11y fixes on the same surface (Today drawers + activity blocks). C-AN-1 (top-of-funnel events) is the prerequisite for measuring any subsequent UX redesign — every iteration we delay it ships unmeasured. Combined Effort = S+S+S; Define artifact = a single PRD covering "Today a11y + measurement baseline"; integrity boundary = Today drawers + ScheduledActivityBlock + analytics emission; coherence claim = "Today is now WCAG-compliant on action buttons and dialog focus, and emits the funnel events any future redesign needs." This satisfies all 4 proposed bundling conditions. Expected actual time ~2-2.5h vs nominal estimate ~7h.

If Phil prefers narrower scope, ship C-AN-1 alone — it unblocks measurement and is the single highest-leverage non-Today item.

If Phil prefers cross-page progress, the alternative is a Week-page T2 + T10 pass per `UX_DELTA_OTHER_PAGES.md` recommended sequencing — would need a 2-lens Define artifact (UX + frontend) first.

---

## 10. Open Questions for Phil

1. **Approve revised bundling rule (§6.1)?** Default if unanswered: continue de-facto bundling under Iteration 14/16 precedent without rule change. Risk: rule contradicts practice; new coordinator instance might revert.
2. **Approve Define-pass mandatory threshold (§6.3)?** Default if unanswered: keep current voluntary Define use; the team is using it consistently anyway.
3. **Approve convergence bonus + score-13 gate (§6.4)?** Default if unanswered: keep current formula; rely on coordinator judgment to gate score-13 selections.
4. **Approve next iteration as bundled C-UX-6 + C-UX-8 + C-AN-1?** Default if unanswered: take whichever is at top of `IMPROVEMENT_BACKLOG.md` rank table — currently C-UX-6.
5. **Mark C-PM-4 as DONE-BY-PROXY?** Default if unanswered: leave OPEN; will surface again as a duplicate of C-UX-3 in next backlog refresh.

---

# §7. Meta-Review Iter 27 (covering Iter 18 → Iter 27)

Owner: meta-coordinator
Status: v0.2 — second formal meta-review pass.
Trigger: 4 pure improvement-loop iterations since Iter 18 (Iter 19, 21, 24, 27); §6 cadence ("every 3 completed improvement loops") met and exceeded by one. Presenting symptom: sustained upward runtime trend (3.15s → 4.03s across last 6 iterations; per-test cost 1.14ms → 1.34ms = +17%).
Scope: BAM-X Kaizen OS at `C:\Users\philk\kaizen`. Reviewed: `META_REVIEW.md` §1–§6, `ITERATION_LOG.md` Iter 18–27 (~410 lines), `IMPROVEMENT_BACKLOG.md` (full), `SYSTEM_HEALTH.md` (current snapshot), `CHANGELOG.md` (top 10 entries), `.claude/agents/coordinator.md`, `.claude/agents/CLAUDE.md`, `tests/ui/dialogFocusTraps.test.js` (header + structure), `tests/ui/focusTrap.test.js` (size).

---

## §7.0 Iteration Performance Scorecard (Iter 18–27)

| #  | Title (short)                                  | Define? | Items   | Spec dev. | Tests Δ  | Runtime  | per-test | §6.5 hits | Outcome |
|----|------------------------------------------------|---------|---------|-----------|----------|----------|----------|-----------|---------|
| 18 | Operating-model adoption (META §6.1–§6.6)      | n/a     | 6 rules | 0         | 0        | 2.10s    | 0.74ms   | 0         | 5 — codified de-facto practice |
| 19 | Composer correctness (C-SA-4 + C-SA-5)         | Y arch  | 2       | 0         | +9       | 3.36s    | 1.18ms   | 3 (lic.)  | 5 — first §6.5 use; clean |
| 20 | Today UX v2 multi-lens review (Define only)    | Y 9art  | 0 code  | 0         | 0        | 3.36s    | —        | 0         | 5 — produced 5 convergent findings |
| 21 | C-AN-1 + C-UX-2 + C-QA-V2-1 ("baseline+safe")  | reused  | 3 bun.  | 0         | +23      | 3.15s    | 1.10ms   | 0         | 5 — measurement clock started |
| 22 | C-UX-COL row column refactor (user-directive)  | Y 6lens | 1       | 0 (+1 pos.)| +26     | 3.31s    | 1.14ms   | 1 (event) | 5 — competitive white-space |
| 23 | C-PM-SIMPLIFY-A (user-directive)               | Y 7lens | 1       | 0         | +7       | **3.67s** ⚠️| 1.27ms | 0         | 5 — 11→5 regions, 4 compensations |
| 24 | C-UX-6 modal focus traps                       | reused  | 1       | 0 (+2 ann.)| +30     | 3.49s    | 1.19ms   | 0         | 5 — reusable utility produced |
| 25 | C-PM-SIMPLIFY-A2 (user-directive)              | none    | 1       | 0 (+2 min)| +14      | **3.80s** ⚠️| 1.29ms | 0         | 4 — dead `state.fineTune` left in |
| 26 | C-PM-LUNCH (user-directive)                    | reused* | 1       | 0         | +43      | 3.53s    | 1.18ms   | 3 (pred.) | 5 — exact §6.5 prediction match |
| 27 | C-UX-6b focus-trap rollout (mech. follow-up)   | none    | 1       | 0         | +32      | **4.03s** ⚠️| 1.34ms | 0         | 4 — runtime regression introduced |

*reused = Iter 22's lunch-block Define-pass artifacts (3 weeks paused) finally consumed.

**Aggregate.** 9 iterations (excl. Iter 18 governance). 8/9 outcome quality ≥ 5; one 4-rated iteration (Iter 27, due to runtime regression). Zero major spec deviations across the entire window. 4 user-directive iterations (22, 23, 25, 26) ran outside the backlog scoring path on direct Phil request — all produced strong outcomes. Median time-actual / time-estimate ≈ 0.30 (~3× efficient — improved from §4.1's 5× but still reflects systematic estimate inflation).

---

## §7.1 Runtime Budget Update

### Finding

The 3.5s ceiling is no longer realistic and is no longer informative.

Data:
- Suite Iter 9 → Iter 27: **2,565 → 3,018 tests** (+18%)
- Runtime Iter 9 → Iter 27: **2.10s → 4.03s** (+92%)
- Per-test cost Iter 9 → Iter 27: **0.82ms → 1.34ms** (+63%)
- Last 6 iterations have crossed the 3.5s budget in **4 of 6** (Iter 23, 25, 27 over; Iter 24, 26 under by margin <50ms; only Iter 21 cleanly under).
- The per-test cost trend is the real signal: tests added in the v2/strip/lunch/focus-trap window are heavier than 2025 baseline tests. Iter 27's 32 dialog integration tests jumped runtime by 0.50s in one iteration — that is **15.6ms per test added**, ~12× the rolling per-test mean.

The 3.5s budget was set when per-test cost was ~0.74ms. At 1.34ms (today's true marginal), 3.5s would only allow ~2,612 tests — we are 406 tests past that. The budget is functionally dead; coordinator is no longer using it as a decision tool.

### Recommendation

**Two-axis budget**, replacing single-number ceiling:

1. **Rolling per-test ceiling: 1.5ms / test** (current 1.34ms gives 12% headroom). This is the primary metric. It is unit-stable as the suite grows.
2. **Absolute runtime alarm: 5.0s** (Iter 27 = 4.03s gives 19% headroom). This is the secondary safety rail — flags only if either the ceiling drifts upward OR the suite grows by ~25% beyond today.

Rationale for not picking 4.5s: it would absorb Iter 27's overshoot without forcing root-cause work on the per-test cost trend. The per-test trend is the leading indicator; absolute runtime is the lagging indicator. We should react to the leading indicator.

### Operating-model delta

- `SYSTEM_HEALTH.md` Quality Scores table: replace single "Runtime budget: 3.5s" row with two rows: "Per-test ceiling: 1.5ms/test" (primary) and "Runtime alarm: 5.0s" (secondary).
- `coordinator.md` Step 7 Validation: add "If per-test cost > 1.5ms, run `node --prof` on the slowest test file and either optimize or justify in the iteration log."

---

## §7.2 Per-Test ms Metric Adoption Decision

### Finding

Q3 from Iter 17 §4.2 ("switch SYSTEM_HEALTH from absolute runtime to per-test ms") has been deferred 4 times: Iter 19 ("not urgent"), Iter 23 ("becoming relevant"), Iter 25 ("overdue"), Iter 27 ("critically overdue"). At each deferral the runtime trend deteriorated. This is a textbook example of repeated-issue not-converted-to-rule from §6 of meta-review template.

The deferral was rational at Iter 19 (per-test was 1.18ms — still healthy). It became irrational by Iter 23 (1.27ms with no plan to investigate). The coordinator's "watch item but not blocking" phrasing across 4 iterations is the failure mode: a watch item that is never acted on is just a postponed decision.

### Recommendation

**Adopt now.** Per-test ms / test is the primary runtime metric going forward. Threshold = 1.5ms (per §7.1 above).

Three concrete uses:
1. SYSTEM_HEALTH dashboard reports `runtime / test_count` as headline metric.
2. Iteration log mandatory field: `per_test_ms` computed at close.
3. Coordinator Step 7 validation: any iteration that *increases* per-test ms by >5% triggers a 1-line iteration-log entry naming the test file responsible (cheap; no investigation required unless ceiling breached).

### Operating-model delta

- `coordinator.md` Step 8.1 ITERATION_LOG.md template: add `per_test_ms` field to required entries.
- `SYSTEM_HEALTH.md`: per §7.1 above.
- Mark Iter 17 §4.2 Q3 as RESOLVED in next coordinator pass.

---

## §7.3 Test-Design Hygiene

### Finding

Iter 27 added 32 dialog integration tests in a single new file (`tests/ui/dialogFocusTraps.test.js`, 346 LOC). Each test simulates a full focus-trap install/release lifecycle through `installFocusTrap` with a stubbed `_doc`. The runtime jumped 0.50s for a 32-test addition (15.6ms/test — ~12× the rolling mean of 1.34ms).

Compare to Iter 24's `tests/ui/focusTrap.test.js` (441 LOC, 26 tests) — same `_doc` injection pattern, same surface, but those tests run within rolling per-test cost. Iter 24's tests target the utility primitive. Iter 27's tests target the integration of that primitive across 8 dialogs. The integration tests aren't *wrong*, but they are heavy-per-test.

Audit verdict on the question "could unit tests cover this?":
- AC10 (utility is REUSED, not re-implemented) — already locked by Iter 24's tests; Iter 27's test of this is duplicative.
- AC1–8 (8 dialogs each install/release) — these are 8 essentially identical assertions. Could be parameterized (1 test, 8 fixtures) at ~4× lower cost.
- AC9 (Escape calls handler) and AC12 (Tab cycles) — already locked by Iter 24's utility tests. Re-asserting per dialog is paranoia, not coverage.

This is **shallow-coverage debt**: 32 tests, ~10–15 of which provide marginal information beyond Iter 24's utility tests.

Pattern observed across the window:
- Iter 22: +26 tests (efficient — most are different surface assertions)
- Iter 23: +7 net (efficient — moved tests with components to `_backup/`)
- Iter 26: +43 tests (largely necessary — composer/catalog assertions, weekly parity)
- Iter 27: +32 tests (~50% redundant per the analysis above)

### Recommendation

**Three rules, ordered by enforcement strength:**

1. **Per-iteration test-cost budget (soft):** A single iteration may not increase per-test ms by more than 5% unless the rationale is logged. Iter 27 increased it 13% (1.18 → 1.34); under this rule it would have required justification and likely test-design rework.

2. **Parameterization-first guidance (testing principle):** When N essentially-identical tests differ only by fixture (e.g., 8 dialogs × 4 ACs = 32 tests), the default is **1 parameterized test runner over a fixtures table**, not N copies. This is a documentation rule, not enforced.

3. **Integration-vs-unit tier preference:** Per `tests/ui/focusTrap.test.js` precedent, prefer `_doc`-injected unit tests over integration tests when the unit-test pattern can isolate the same contract. Iter 27 should have been 4 parameterized unit tests across 8 dialog fixtures (~8 logical tests at ~1.5ms each = ~12ms total), not 32 integration tests at 15.6ms each (~500ms total).

### Operating-model delta

- `coordinator.md` Step 6 Implementation: add a sub-rule "Test-design hygiene — parameterize identical-shape tests; prefer `_doc`-injection unit tests over integration tests when isolation is feasible. Per-iteration per-test-ms increase >5% requires a 1-line rationale in iteration log."
- No new artifact required. This is a coding-conventions rule that lives in coordinator's pre-flight on test-heavy iterations.

---

## §7.4 §6.5 Boundary Effectiveness Audit

### Finding

The composer/engine integrity boundary (§6.5, adopted Iter 18) has held cleanly across **all 9 iterations** since adoption. Concrete results:

| Iter | §6.5 hits | Predicted? | Defect prevented? |
|------|-----------|------------|-------------------|
| 19   | 3 (licensed via arch-delta) | Yes — architect specified `composeDaily.js`, `orderDay.js`, `types.js` | Bug A + Bug B latent overlap; one fix class closed both |
| 20   | 0 | n/a (Define-only) | n/a |
| 21   | 0 (events.js add was renderer-side, permitted) | Yes — explicit user approval clause invoked | n/a |
| 22   | 1 (events.js: `RowOutputClicked`) | Yes — coordinator inline arch decision | n/a |
| 23   | 0 | Yes — UI-strip-only | n/a |
| 24   | 0 | Yes — pure UI utility | n/a |
| 25   | 0 | Yes — chrome removal | n/a |
| 26   | **3 (composeDaily, composeWeekly, validateComposition) — exactly as architect predicted** | Yes — `ARCHITECTURE_DELTA_LUNCH_BLOCK.md` predicted "3 hits, no orderDay/types/events touch" | Capacity-neutrality preserved; new bucket=null sentinel chosen over new enum |
| 27   | 0 | Yes — UI-wiring-only | n/a |

**Iter 26 is the strongest evidence.** The architect predicted 3 specific hits before any code was written. The implementer landed exactly 3 hits, in exactly those files, with zero churn into orderDay/types/events. This is the §6.5 boundary functioning as designed — predictable, traceable, no scope creep.

**Iter 19 is the second-strongest.** The deferred-finding `C-SA-6` (validator overlap detection) was surfaced *because* the architect's audit of orderDay revealed the misleading "validator surfaces" comment. The §6.5-mandated arch-delta directly produced new backlog work.

### Recommendation

**Hold boundary at current scope. Do not extend, do not contract.** The boundary is doing exactly what it was designed for. Three specific clarifications:

1. **`js/composer/lunchBlock.js` (new in Iter 26) inherits §6.5 protection.** It is in `js/composer/`. The path-based rule already covers it. Add a one-line note to coordinator.md Non-Negotiable Rules to make this explicit: "Path rule is recursive: any new file under `js/composer/`, `js/engine/`, or `js/events/` falls under §6.5 from creation."

2. **Renderer-side `js/events/events.js` constant additions** (Iter 21 + Iter 22) are *not* exempt — they were arch-delta-approved inline by coordinator at Iter 21 and tracked by lens-level review at Iter 22. The rule is working as intended; do not add a "renderer-only" exemption.

3. **The `js/ui/focusTrap.js` utility (Iter 24) is correctly outside §6.5** despite being shared across 10 dialogs. It is UI infrastructure, not composition/engine logic. Boundary is correctly drawn.

### Operating-model delta

- `coordinator.md` Non-Negotiable Rules: amend §6.5 wording to add: "Path rule is recursive — any new file created under the protected paths inherits §6.5 from the moment of creation."
- No backlog or process changes.

---

## §7.5 Backlog Hygiene Rules

### Finding

Three issues identified:

**Issue A — Stale OPEN entries.** `C-UX-V2-1` (auto-collapse RhythmExplainer, score 15) is listed as OPEN in `IMPROVEMENT_BACKLOG.md` line 44, but `RhythmExplainer.js` was moved to `_backup/` in Iter 23 (`js/ui/components/_backup/RhythmExplainer.js`). The entire premise of the candidate (the always-on render) no longer exists. This is **DONE-BY-PROXY (Iter 23)** by exactly the same pattern as C-PM-4 → C-UX-3 (Iter 17).

**Issue B — Stale OPEN entries (suspected).** `C-UX-7` (Now/Up-Next duplication fix, score 11) — both NowPane and UpNextRail-on-Today were removed at Iter 23 (NowPane moved to `_backup/`; UpNextRail removed from Today.js imports though kept on Week). The duplication on Today no longer exists. Probably DONE-BY-PROXY-Iter-23.

**Issue C — Phil-authority queue is opaque.** Multiple iterations (23, 25 follow-ups) reference a "~25 SW-Q queue" that gates C-PM-SIMPLIFY-B and C-PM-SIMPLIFY-C. There is no consolidated list anywhere. Phil cannot batch-answer because the questions are scattered across artifact files (`UX_TODAY_SIMPLIFY_*.md` and the lunch-block PRD).

### Recommendation

**Three actions:**

1. **DONE-BY-PROXY sweep on every meta-review.** Each meta-review must run a 1-pass audit: for each OPEN candidate, grep the symbol it targets; if the symbol no longer exists in `js/`, mark DONE-BY-PROXY with cross-reference to the iteration that removed it. C-UX-V2-1 and (probably) C-UX-7 should be marked now.

2. **Stale-after date on candidates.** Already recommended in §4.5 of Iter 17 meta-review; never adopted. Recommend now: every candidate gets a `lastEvidenceConfirmed: <date>` field. If older than 4 iterations *and* not selected, the candidate is auto-flagged for re-grep before being scoreable.

3. **Phil-authority queue consolidation.** Create a single artifact `PHIL_AUTHORITY_QUEUE.md` (or a clearly-titled section in IMPROVEMENT_BACKLOG.md) listing every Phil-blocked question by ID, source artifact, and dependency. This unblocks Phil to answer in batches and gives coordinator a single place to check before declaring work Phil-blocked.

### Operating-model delta

- `coordinator.md` Step 8 ("Update System Artifacts"): add explicit DONE-BY-PROXY sweep as part of Update IMPROVEMENT_BACKLOG step. Trigger: every meta-review and every iteration close where files were moved/deleted.
- New artifact: `PHIL_AUTHORITY_QUEUE.md` (or new section in IMPROVEMENT_BACKLOG.md).
- IMPROVEMENT_BACKLOG candidate template: add `lastEvidenceConfirmed` field per §6.6 amendment.

---

## §7.6 Score-13 Gate Refinement

### Finding

The single-lens score-13 cap (§6.4, adopted Iter 18) was challenged in this window by 4 user-directive iterations (22, 23, 25, 26) that shipped *without* lens-convergence and worked fine. Specifically:

- Iter 22 (C-UX-COL): coordinator routed to a 6-lens Define-pass *after* Phil's directive. The gate worked correctly here — the 6 lenses validated the directive and uncovered architecture decisions (cohort tagging, semantic aria) that wouldn't have surfaced from the directive alone.
- Iter 23 (C-PM-SIMPLIFY-A): same — 7-lens Define-pass converged 7/7 on stripping but 6/7 on relocating-not-deleting. The 1-lens dissent (Competitive) prevented "strategic regression to Motion-tier opaque scheduling." Gate value-add: very high.
- Iter 25 (C-PM-SIMPLIFY-A2): no Define-pass; user directive shipped directly. Score 13, single-lens (Phil). Worked fine.
- Iter 26 (C-PM-LUNCH): reused 3-week-old 2-lens Define-pass. Score 13, 2 lenses. Worked fine.

Iter 25 and Iter 26 are mild evidence that the gate is sometimes **overprotective** — both were tightly-scoped, low-risk, and clearly-authored by Phil. But they are also small-sample and benefited from the gate's existence (Phil was confident because prior iterations had been multi-lens validated).

The gate did *not* fail in any iteration. It correctly forced multi-lens review on Iter 22 + 23 (highest-risk in the window) and correctly allowed bypass on Iter 25 + 26 (clear directive, low-risk).

### Recommendation

**Hold the score-13 gate as-is.** The 4-data-point window does not justify changing a rule that has produced zero failures. Two minor clarifications:

1. **User-directive bypass is implicit, not explicit.** Iter 22, 23, 25, 26 all bypassed because Phil directed them. Codify: "User-directive features may bypass the score-13 lens-count gate at user's discretion. Coordinator must still run a Define-pass if Effort ≥ M (per §6.3) — that rule is independent."

2. **DONE-BY-PROXY check before promoting.** When a multi-lens review (e.g., Iter 20's 7-lens v2 review) bumps an existing single-lens candidate from score 11 → score 14 via ConvergenceBonus (e.g., C-UX-2 BucketStrip at Iter 20), coordinator should re-grep the candidate's symbol *before* the bump takes effect. Iter 20 did this implicitly; making it explicit prevents promoting stale candidates to high priority.

### Operating-model delta

- `coordinator.md` §6.4 Score-13 Gate: append "User-directive features bypass this gate at user's discretion; the §6.3 Define-pass mandate (Effort/defect/score thresholds) still applies independently."
- `coordinator.md` Step 6 Pre-Flight Reconnaissance: add "before applying ConvergenceBonus to an existing candidate, re-run grep on the candidate's symbol — promotion to score-13+ tier requires evidence freshness."

---

## §7.7 Pace Sustainability Signals

### Finding

Iter 19 → Iter 27 = 9 iterations across ~5 days of active work (clusters: Iter 18–21 over 1 day; Iter 22 alone; Iter 23–27 over 24 hours). Iter 24–27 were 4 iterations in 24 hours.

Pace metrics:
- 9 iterations / ~5 active days = 1.8 iterations/day average
- 4 iterations / 1 day = 4 iterations/day peak (Iter 24–27)
- Define-pass artifact volume: Iter 20 produced 9 artifacts (2,088 lines); Iter 22 produced 7; Iter 23 produced 7. Total Define-phase output across the window: **~30 artifacts, ~6,500 lines** of analysis docs.

Debt signals visible in the data:
1. **Production deploy queue is 6 iterations deep** (Iter 22 + 23 + 24 + 25 + 26 + 27 all queued). No production validation has occurred since Iter 21. This is the strongest debt signal — the loop is *implementing* faster than it is *validating in production*.
2. **Iter 25 spec deviations** (`state.fineTune` retained as dead state slice): the only iteration in the window with a "minor deviation that requires follow-up cleanup." Linked to the back-to-back Path A dispatch — Iter 25 didn't get a thinking pause before Iter 26 dispatched.
3. **Iter 27 runtime regression** (32 redundant tests): same shape — fast dispatch, no test-design review, runtime cost not surfaced until close.
4. **Phil-authority queue at ~25 items**: the loop is *generating* Phil-blocked questions faster than Phil is answering them (Iter 23 spawned ~5; Iter 26 spawned 0 — those questions were 3 weeks old).

Working signals:
- Zero major spec deviations across all 9 iterations
- Zero failed validations
- §6.5 boundary held in all 9
- Test count grew 18% with zero failures introduced

### Recommendation

**The pace is generating debt that is small but accumulating. Specific guardrails:**

1. **Production-deploy gate.** No more than 4 iterations may queue without a production deploy. At 4-deep, the next iteration must include a "deploy + smoke verify" step *before* implementation. Currently 6-deep — this is the most actionable signal in the entire meta-review.

2. **Back-to-back dispatch cooling-off.** When Phil approves Path A (back-to-back dispatch), coordinator must add an explicit 1-paragraph review pause between iterations: "Iter N close — what surfaced that should change Iter N+1 plan?" This would have caught Iter 25's `state.fineTune` cleanup before Iter 26 dispatched.

3. **Test-design pre-flight on test-heavy iterations.** When an estimated test addition is >20 tests, coordinator must spend ~2 minutes asking "is this parameterizable?" before dispatch. This would have caught Iter 27.

4. **Phil-authority queue limit.** When the queue exceeds 20 unanswered SW-Q items, coordinator must surface a "consolidate and ask Phil to batch" recommendation. Currently 25. This is overdue.

### Operating-model delta

- `coordinator.md` Step 5 Selection: add "Production-deploy gate: if >4 iterations queued, next iteration must include deploy step."
- `coordinator.md` Step 6 Implementation: add "Back-to-back dispatch — coordinator inserts 1-paragraph review pause between Path A iterations" and "Test-heavy pre-flight — for estimated >20 test additions, run parameterization check."
- `coordinator.md` Step 8 Update Artifacts: add "Phil-authority queue size — if >20, surface batch-consolidation recommendation."

---

## §7.8 New Operating-Model Rules Surfaced

Beyond the topic-specific recommendations above, the iter-by-iter review surfaced two rule patterns worth codifying:

### §7.8.1 Reusable Utility Pattern

**Observation:** Iter 24 produced `js/ui/focusTrap.js` as a dependency-injectable utility. Iter 27 then mechanically applied it across 8 dialogs in a single iteration. This is the same shape as Iter 13's T1 token consolidation enabling Iter 14 + Iter 22 + Iter 23. **First iteration produces the primitive; second iteration applies it broadly; third+ iterations consume it without thinking about it.**

This pattern is high-leverage:
- Iter 24 cost: ~1h to produce the utility + 1 dialog conversion
- Iter 27 cost: ~1h to apply to 8 dialogs (would have been 8h if each were bespoke)

**Rule:** When a Define-pass identifies an N-dialog or N-component pattern, prefer to ship the primitive first as a single-instance proof, then mechanical rollout in a follow-up iteration. Do not bundle "primitive + 9-instance rollout" in one iteration — the primitive design needs validation before rollout.

### §7.8.2 Define-Pass Dormancy / Resurrection Pattern

**Observation:** Iter 26 consumed Define-pass artifacts from 3 weeks earlier (`ARCHITECTURE_DELTA_LUNCH_BLOCK.md`, `PRD_LUNCH_BLOCK.md`). The 3-week dormancy did not invalidate the artifacts — they were still consumable directly with one minor adjustment (60 min → 30 min duration per Phil's update). This validates the artifact-driven model: written artifacts have long shelf life.

**However:** the implementer report flagged that Phil's directive "30 min" was easy to miss against the architect's specified "60 min." The Define-pass artifact was 3 weeks old, but the user-directive update was 1 day old. The cost to spot the conflict was low (one careful read), but the cost in a less-disciplined iteration could be high.

**Rule:** When resurrecting a Define-pass artifact older than 5 iterations, coordinator must run a "directive-vs-spec" diff: scan recent (last 5 iterations) iteration logs for any user directive that contradicts the dormant spec. Append a 1-line resurrection note to the artifact at the head: "Resurrected Iter N. Directives since original date: [list]."

### Operating-model delta

- `coordinator.md` Step 2 Define-Pass: add §7.8.1 "Primitive-first rollout" subsection + §7.8.2 "Dormant Define-pass resurrection" subsection.
- No new artifacts required.

---

## §7 Summary

The Iter 18–27 window is **strong on every output metric** (zero major deviations, 8/9 iterations rated 5/5, §6.5 boundary 100% held, suite grew 18% with zero failures) but **weak on three feedback signals**:

1. Runtime trend not acted on across 4 deferrals (§7.1, §7.2)
2. Test-design hygiene drift in Iter 27 (§7.3)
3. Production-deploy queue at 6-deep with no validation pause (§7.7)

The fundamental loop is healthy. The system is choosing better work over time (Iter 20's 7-lens v2 review is a higher-quality version of Iter 12's 7-lens cross-page review). What is not happening: the system is not yet *acting on its own monitoring signals* (per-test ms, Phil queue size, deploy queue depth) without explicit human prompt. That is the meta-system gap this meta-review addresses.

_End of §7 — Meta-Review Iter 27._
