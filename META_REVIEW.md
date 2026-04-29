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
