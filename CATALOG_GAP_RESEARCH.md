# CATALOG GAP RESEARCH — BAM-X Kaizen OS
## Market Research Agent — External Benchmark Review
**Date:** 2026-05-19

---

## 1. Methodology

Frames surveyed against the existing catalog:

**PROJECT**: PMBOK 7th Edition (Project Management Institute, 2021) — 8 Performance Domains; Scrum Guide 2020 (Sutherland/Schwaber); SAFe 6.0 (Scaled Agile, Inc.); Cal Newport "Deep Work" (2016) and "Time-Block Planner" methodology; Shape Up (Fried/Hansson, Basecamp, 2019); OKR cycle (Doerr, "Measure What Matters," 2018); Lean Six Sigma DMAIC/DMADV body of knowledge (ASQ curriculum).

**COMMUNICATION**: Manager Tools podcast/framework (Horstman, "The Effective Manager," 2016); Patrick Lencioni "Death by Meeting" (2004) — 4 meeting typology; Bezos/Amazon memo culture (6-pager narratives, no-PowerPoint rule); GitLab Remote Playbook (async-first communication handbook, 2020 ed.); Stakeholder management — RACI/RAPID frameworks (HBR/Bain); "Crucial Conversations" (Patterson et al., 4th ed., 2021); HBR research on meeting overload (Perlow et al., "Stop the Meeting Madness," HBR 2017).

**CI**: Toyota Production System — Ohno, kaizen, hansei, jidoka; Liker "The Toyota Way" (2004) — 14 principles; Lean Startup (Ries, 2011) — Build/Measure/Learn, validated learning; Theory of Constraints (Goldratt, "The Goal," 1984); Personal Kanban (Benson/Barry, 2011); Drucker "The Effective Executive" (1967) — feedback analysis method; "4 Disciplines of Execution" (McChesney et al., 2012); "Atomic Habits" (Clear, 2018) — habit loop, identity-based change; Carol Dweck "Mindset" (2006) — growth mindset/reflection.

---

## 2. Bucket Coverage Assessment

**PROJECT bucket — WELL-COVERED within its chosen scope.** The DMAIC and Kaizen project workflows (#20–#50) are thorough and sequenced correctly. The Deep Work generic covers unstructured project time. Gaps exist at the front and back ends: there is no structured project-intake/scoping ritual, no time-blocking protocol for deep work sessions (Newport), and no OKR check-in cadence that is distinct from Quarterly Planning.

**COMMUNICATION bucket — MODERATELY COVERED, significant gaps.** The catalog has standup, mid-sprint review, sprint review, document writing, and two connection generics. What is structurally missing: a structured 1:1 protocol (Manager Tools framework; #16 "Connecting w/ teammates" is time-blocked socializing, not the Horstman feedback+coaching 1:1), a pre-meeting preparation ritual (Lencioni's meeting architecture demands pre-work), a stakeholder status report cadence (distinct from the DMAIC Communication Plan which is project-scoped), and a high-stakes escalation/crucial-conversation protocol.

**CI bucket — MODERATELY COVERED, notable gaps.** The PDCA cycle, weekly and daily reflections, lessons learned, and the full innovation pipeline are solid. Missing: a dedicated OKR mid-quarter check-in (the catalog has Quarterly Planning but no monthly OKR pulse), a constraint/bottleneck identification ritual (Theory of Constraints), a habit-tracking/streak review cadence (Atomic Habits), and a hansei (structured self-examination after a significant failure or milestone) distinct from the generic retrospective.

---

## 3. Recommended Additions

### TIER 1 — MUST-ADD

#### Entry 1 — Structured 1:1 Meeting (COMMUNICATION)
- **ID:** `gen_structured_one_on_one`
- **Bucket:** COMMUNICATION
- **Focus:** Manager-report relationship health; feedback delivery and coaching
- **Default duration:** 30 min
- **Cadence:** weekly
- **Trigger:** Recurring calendar hold, same day/time each week per direct report
- **Inputs:** Prior 1:1 notes, open action items, performance signals, team member's agenda
- **Output:** 1:1 Notes with action items (TEXT, required)
- **Participants:** Manager, Direct Report (one pair per instance)
- **Procedure:**
  - a. Open the shared 1:1 document; both parties review outstanding action items from the prior meeting (5 min).
  - b. Give the report the floor first — ask "What's on your agenda?" and take notes on their priorities and blockers (10 min).
  - c. Deliver any prepared feedback using the Manager Tools SBI model: Situation, Behavior, Impact; pause for response (5 min).
  - d. Manager shares any context, org updates, or coaching points the report needs (5 min).
  - e. Confirm action items with owners and due dates; record in shared document before the meeting closes (5 min).
- **Bucket rationale:** Dyadic communication protocol — not CI, not project-scoped work.
- **Source:** Horstman, "The Effective Manager" (2016), Ch. 4-5; Manager Tools podcast "One-on-Ones" series.
- **Authorability:** SBI step is canonical and portable. Agenda split (report first) is Horstman canonical. Phil to specify action-item format.

#### Entry 2 — OKR Monthly Check-In (CI)
- **ID:** `gen_okr_monthly_check_in`
- **Bucket:** CI
- **Focus:** OKR confidence scoring, course correction between quarterly plans
- **Default duration:** 45 min
- **Cadence:** monthly
- **Trigger:** First Monday of each month that is not a sprint-start week
- **Inputs:** Active OKR scorecard, Key Result actuals to date, blockers log
- **Output:** OKR Confidence Update (DOCUMENT, required)
- **Participants:** Self, Agile Leader, Sponsor (optional)
- **Procedure:**
  - a. Open the OKR scorecard; for each Key Result record actuals-to-date and update the confidence score (0–100%).
  - b. Identify any Key Result at confidence below 50% and name the primary blocker in one sentence.
  - c. For each at-risk Key Result, propose one specific corrective action and assign an owner and due date.
  - d. Confirm whether any Objective should be paused, pivoted, or retired given current quarter realities.
  - e. Publish the updated scorecard and notify Sponsor if any KR falls below 40% confidence.
- **Bucket rationale:** Structured CI review of goal progress — closest parallel to Quarterly Planning but monthly grain.
- **Source:** Doerr, "Measure What Matters" (2018), Ch. 7 "Superpower #3: Track for Accountability"; Google internal OKR cadence.
- **Authorability:** Confidence scoring (0–100%) and the <50% threshold are canonical Doerr/Google. Phil to decide cadence offset from sprints.

#### Entry 3 — Weekly Time-Block Plan (PROJECT)
- **ID:** `gen_time_block_planning`
- **Bucket:** PROJECT
- **Focus:** Intentional capacity allocation before the week begins
- **Default duration:** 20 min
- **Cadence:** weekly
- **Trigger:** Sunday evening or Monday morning before first calendar commitment
- **Inputs:** Upcoming week's calendar, Sprint Backlog commitments, personal OKR priorities, energy forecast
- **Output:** Weekly Time-Block Plan (TEXT, required)
- **Participants:** Self
- **Procedure:**
  - a. Open the week's calendar view; identify all fixed commitments (meetings, deadlines, travel).
  - b. Estimate remaining discretionary hours by day; account for known energy peaks and troughs.
  - c. Assign each Sprint Backlog commitment to a specific time block on a specific day; no commitment floats unscheduled.
  - d. Reserve at least one 90-minute deep-work block per day before 12:00; mark it as protected.
  - e. Write a one-sentence intention for the week ("This week's win is ___") at the top of the plan.
- **Bucket rationale:** Pre-project planning that governs how project work gets executed — belongs in PROJECT as allocation ritual.
- **Source:** Newport, "Deep Work" (2016), Ch. 4; Newport "Time-Block Planner" companion methodology (2020).
- **Authorability:** 90-minute pre-noon block is Newport canonical. Phil to specify scheduling tool integration.

#### Entry 4 — Constraint (Bottleneck) Identification (CI)
- **ID:** `gen_constraint_identification`
- **Bucket:** CI
- **Focus:** Locating and subordinating to the system's binding constraint
- **Default duration:** 60 min
- **Cadence:** monthly
- **Trigger:** Monthly CI review or when throughput variance exceeds 20% of baseline
- **Inputs:** Process map, throughput data, WIP aging report, team capacity log
- **Output:** Constraint Register (DOCUMENT, required)
- **Participants:** CI Champion, Process Owner, Team
- **Procedure:**
  - a. Map the current end-to-end workflow from trigger to output artifact; identify all steps.
  - b. For each step, record average cycle time and WIP queue depth from the past sprint.
  - c. Identify the step with the longest combined cycle time plus wait time — this is the candidate constraint.
  - d. Confirm the constraint by checking whether upstream steps are underutilized while this step is backlogged.
  - e. Document the constraint in the Constraint Register: name, location, throughput rate, WIP depth, recommended focus.
  - f. Decide exploitation action (maximize output of the constraint before adding capacity elsewhere); add to Improvement Backlog.
- **Bucket rationale:** TOC constraint identification is a diagnostic CI ritual that feeds the Improvement Backlog.
- **Source:** Goldratt, "The Goal" (1984), Ch. 15 (Five Focusing Steps); "Theory of Constraints Handbook" (Cox/Schleier, 2010), Ch. 2.
- **Authorability:** Five focusing steps are canonical TOC. 20% throughput variance trigger needs Phil calibration.

#### Entry 5 — Stakeholder Status Report (COMMUNICATION)
- **ID:** `gen_stakeholder_status_report`
- **Bucket:** COMMUNICATION
- **Focus:** Proactive upward and lateral communication of project/program health
- **Default duration:** 30 min
- **Cadence:** weekly
- **Trigger:** Every Friday before end-of-day, covering the completed sprint week
- **Inputs:** Sprint Backlog status, OKR confidence, open risks, decisions needed
- **Output:** Weekly Status Report (DOCUMENT, required)
- **Participants:** Self (author), Stakeholders (recipients)
- **Procedure:**
  - a. Open the status report template; set the reporting period and RAG (Red/Amber/Green) status for each workstream.
  - b. Write a two-sentence summary of the week's accomplishments — only completed items, no in-flight descriptions.
  - c. List the top 1–3 risks or blockers with owner, mitigation, and target resolution date.
  - d. Identify any decisions needed from stakeholders this week; frame each as a clear yes/no or option-select question.
  - e. Distribute via the agreed channel (email, wiki, or async thread) by 16:00 Friday; do not send on Monday morning.
- **Bucket rationale:** Structured, cadenced communication artifact — describes project work but is not project work itself.
- **Source:** Manager Tools "Status Reports Done Right" (2006); PMBOK 7th Ed. Performance Domain: Stakeholders p. 29; GitLab Remote Playbook "Async Status Updates."
- **Authorability:** RAG rating, two-sentence accomplishment rule, Friday-before-16:00 norm are canonical. Phil to specify distribution channel.

---

### TIER 2 — SHOULD-ADD

#### Entry 6 — Pre-Meeting Preparation (COMMUNICATION)
- **ID:** `gen_pre_meeting_prep`
- **Bucket:** COMMUNICATION
- **Focus:** Ensuring meetings begin from shared context; reducing in-meeting discovery time
- **Default duration:** 15 min
- **Cadence:** ad_hoc
- **Trigger:** Any scheduled meeting with duration ≥ 30 min, initiated 24 hours before
- **Inputs:** Meeting agenda, relevant documents, prior decisions log, attendee list
- **Output:** Pre-Read distributed to attendees (TEXT, required)
- **Participants:** Meeting Organizer
- **Procedure:**
  - a. Confirm the meeting has a written agenda with at least one clear decision or output stated.
  - b. Identify the 1–2 documents attendees need to have read before arriving; distribute with 24-hour lead time.
  - c. Write a one-sentence "desired outcome" statement at the top of the agenda.
  - d. If no agenda or desired outcome can be written, cancel or convert the meeting to an async update.
- **Source:** Lencioni "Death by Meeting" (2004), Ch. 5; Amazon 6-pager memo practice (Bezos 2018 shareholder letter); HBR Perlow et al. "Stop the Meeting Madness" (2017).
- **Authorability:** "Cancel if no agenda" rule is portable. Amazon silent-read variant is an option Phil may offer.

#### Entry 7 — High-Stakes Conversation Preparation (COMMUNICATION)
- **ID:** `gen_crucial_conversation_prep`
- **Bucket:** COMMUNICATION
- **Focus:** Structuring preparation before a difficult or high-stakes interpersonal conversation
- **Default duration:** 20 min
- **Cadence:** ad_hoc
- **Trigger:** Identified need for a conversation with meaningful disagreement, performance concern, or values conflict
- **Output:** Conversation Brief (TEXT, required)
- **Participants:** Self
- **Procedure:**
  - a. Write the observable facts of the triggering event in two sentences using neutral language.
  - b. Identify your own emotional state and the story you have been telling yourself about the facts — separate these clearly.
  - c. Write the outcome you want from this conversation; confirm it is relational and not merely transactional.
  - d. Draft your opening sentence: "I want to talk about [observable fact]. My intent is [outcome]. Are you open to that?"
  - e. Anticipate the other party's likely response; plan your listening posture, not your rebuttal.
- **Source:** Patterson et al., "Crucial Conversations" (4th ed., 2021), Ch. 2 and Ch. 4.
- **Authorability:** STATE model is canonical Patterson. Opening sentence template is portable.

#### Entry 8 — Hansei (Structured Failure Reflection) (CI)
- **ID:** `gen_hansei`
- **Bucket:** CI
- **Focus:** Deep individual or team reflection after a significant miss, failure, or project close
- **Default duration:** 45 min
- **Cadence:** per_project
- **Trigger:** Significant project failure, major missed target, or at every project close regardless of outcome
- **Output:** Hansei Document (DOCUMENT, required)
- **Participants:** Self, Team (optional), Process Owner
- **Procedure:**
  - a. State the specific expectation that was not met in one paragraph — include the metric gap, not just the sentiment.
  - b. Describe what actually happened in the sequence it occurred; avoid characterizing individuals.
  - c. Identify the root cause using the Five Whys protocol — ask "why" at least five times from the gap back to the systemic condition.
  - d. Write one commitment: the specific change to prevent recurrence, with a measurement that will confirm the change worked.
  - e. Publish the Hansei Document alongside the project record; do not file it privately.
- **Bucket rationale:** Structured CI self-examination distinct from Sprint Retrospective (team-cadenced, surface-level) and Lessons Learned (Kaizen-close summary).
- **Source:** Liker "The Toyota Way" (2004), Principle 14; Rother "Toyota Kata" (2010), Ch. 7.
- **Authorability:** Five Whys is canonical TPS. "Publish, don't file privately" is Toyota cultural requirement — Phil to decide enforcement.

#### Entry 9 — Habit Streak Review (CI)
- **ID:** `gen_habit_streak_review`
- **Bucket:** CI
- **Focus:** Tracking behavioral consistency on identity-based habits to sustain improvement gains
- **Default duration:** 10 min
- **Cadence:** weekly
- **Trigger:** Weekly Reflection session (runs immediately after `gen_weekly_reflection`)
- **Output:** Habit Streak Update (TEXT, required)
- **Participants:** Self
- **Procedure:**
  - a. Open the habit tracker; mark each day of the past week as complete or missed for each tracked habit.
  - b. For any habit with 2+ consecutive misses, write one sentence on the smallest action that would restore consistency.
  - c. Confirm the identity statement behind each habit is still true for you — update it if your goals have shifted.
  - d. Record the current streak count for each habit; celebrate any streak over 21 days explicitly.
- **Source:** Clear "Atomic Habits" (2018), Ch. 16 and Ch. 2.
- **Authorability:** 21-day streak threshold is Clear canonical. Identity statement framing is portable. Phil to specify habit tracker integration.

#### Entry 10 — Async Written Project Update (COMMUNICATION)
- **ID:** `gen_async_written_update`
- **Bucket:** COMMUNICATION
- **Focus:** Replacing synchronous status meetings with structured async written communication
- **Default duration:** 20 min
- **Cadence:** weekly
- **Trigger:** Any recurring team meeting that can be replaced with an async read; minimum Monday AM publication
- **Output:** Async Update Post (TEXT, required)
- **Participants:** Self (author), Team (readers)
- **Procedure:**
  - a. Write the update in a shared, persistent channel (wiki, doc, or project management tool) — not email.
  - b. Lead with what was completed since the last update; be specific (task name + outcome, not vague summaries).
  - c. State the plan for the next period in the same specificity.
  - d. Flag any blocker with: description, who can unblock it, and when a decision is needed.
  - e. Close with a single explicit ask, if any — one question, one decision, one approval.
- **Source:** GitLab Remote Playbook (2022 ed.); Basecamp "Shape Up" (2019) p. 12-14; GitLab employee handbook.
- **Authorability:** "No email" and "persistent channel" requirements are GitLab canonical. Phil to specify the persistent channel.

---

### TIER 3 — COULD-ADD

#### Entry 11 — Project Kickoff Meeting (PROJECT)
- **ID:** `gen_project_kickoff`
- **Bucket:** PROJECT
- **Duration:** 60 min, per_project, Triggered by Charter approval
- **Source:** PMBOK 7th Ed. Performance Domain: Team Sec. 4.3.2; Scrum Guide 2020 "Sprint Zero"
- **Why tier 3:** Sprint Planning partially covers this; DMAIC/Kaizen Charters anchor scope.

#### Entry 12 — Lead-Indicator Metrics Review (CI)
- **ID:** `gen_focus_metrics_review`
- **Bucket:** CI
- **Duration:** 20 min, weekly, runs before `gen_okr_monthly_check_in`
- **Source:** McChesney "4 Disciplines of Execution" (2012), Discipline 2; Doerr (2018) Ch. 9.
- **Why tier 3:** Partially covered by PDCA Cycle (#12) and Weekly Reflection.

#### Entry 13 — Personal Kanban Board Review (CI)
- **ID:** `gen_personal_kanban_review`
- **Bucket:** CI
- **Duration:** 15 min, daily, start of work day
- **Source:** Benson/Barry "Personal Kanban" (2011), Rules 1-2.
- **Why tier 3:** Daily Standup and Sprint Backlog accomplish most of this for team contexts.

#### Entry 14 — Reading for Synthesis (CI)
- **ID:** `gen_reading_for_synthesis`
- **Bucket:** CI
- **Duration:** 60 min, weekly, triggered by active L&D goal
- **Source:** Newport "Deep Work" (2016); Adler/Van Doren "How to Read a Book" (1972).
- **Why tier 3:** cat_1 / cat_2 cover learning investment broadly; this adds structure but not universally canonical.

---

## 4. Cross-Bucket Patterns

**OKR Check-In / Status Report pairing:** Monthly OKR Check-In (CI) logically triggers Stakeholder Status Report (COMM). Link via `dependsOn` edge when reporting periods coincide.

**Pre-Meeting Prep and the full meeting stack:** Pre-Meeting Preparation (COMM) applies to Sprint Planning, Sprint Review, Quarterly Planning, and any status meeting. Implement as `dependsOn` edge from ceremonies with duration ≥ 60 min.

**Hansei and Lessons Learned:** Distinct triggers — Lessons Learned at every Kaizen close (structured summary); Hansei at significant failure (deeper root-cause).

---

## 5. Sources Cited

- Goldratt, E. (1984). "The Goal." North River Press.
- Patterson, K. et al. (2021). "Crucial Conversations" (4th ed.). McGraw-Hill.
- Liker, J. (2004). "The Toyota Way." McGraw-Hill.
- Doerr, J. (2018). "Measure What Matters." Portfolio/Penguin.
- Clear, J. (2018). "Atomic Habits." Avery Publishing.
- McChesney, C. et al. (2012). "The 4 Disciplines of Execution." Free Press.
- Newport, C. (2016). "Deep Work." Grand Central Publishing.
- Horstman, M. (2016). "The Effective Manager." Wiley.
- Lencioni, P. (2004). "Death by Meeting." Jossey-Bass.
- PMI. (2021). "PMBOK Guide" 7th Ed.
- Fried, J. & Hansson, D.H. (2019). "Shape Up." Basecamp.
- GitLab, Inc. (2022). "GitLab Remote Playbook / GitLab Handbook."
- Rother, M. (2010). "Toyota Kata." McGraw-Hill.
- Perlow, L. et al. (2017). "Stop the Meeting Madness." HBR Jul-Aug 2017.
- Benson, J. & Barry, T. (2011). "Personal Kanban." Modus Cooperandi Press.
- Bezos, J. (2018). Amazon Shareholder Letter.

---

## 6. Open Questions for Phil

- **OQ-1: 1:1 scope.** Is the primary persona a manager (needs `gen_structured_one_on_one` as their own ritual) or an individual contributor (needs it as a prep ritual for their report-side)?
- **OQ-2: OKR check-in timing.** Three-tier cadence (quarterly set, monthly check, weekly reflection) is Doerr canonical. Enforce all three or treat monthly as optional?
- **OQ-3: Hansei vs Sprint Retrospective boundary.** If users rarely experience significant failures, Hansei card triggers rarely. Add as low-frequency card or augment Sprint Retro procedure with deep-failure conditional branch?
- **OQ-4: Async-first commitment.** Entries 6 + 10 push toward GitLab-style async-first culture. Confirm BAM-X user base aligns?
- **OQ-5: Habit tracker integration.** BAM-X has no native habit-tracking data model. Future data feature or external-tool reference?
