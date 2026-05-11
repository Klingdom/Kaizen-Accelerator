# Phil Authority Queue — Consolidated Standard-Work Questions

**Purpose**: Single source of truth for every question that requires Phil's authority before backlog work can proceed. Created per META_REVIEW.md §7.5 (Iter 27) recommendation. Coordinator must check this artifact before declaring work "Phil-blocked."

**Maintainer**: Coordinator updates after each iteration that spawns or resolves SW-Q items.

---

## Status legend

- `OPEN` — awaiting Phil's answer
- `ANSWERED` — Phil has provided guidance; coordinator has applied it
- `OBSOLETE` — question no longer relevant (DONE-BY-PROXY or scope changed)

---

## Section A — Today Simplify Phase B (Composer rebalance)

**Source**: `PRODUCT_TODAY_SIMPLIFY.md`, `ARCHITECTURE_DELTA_TODAY_SIMPLIFY.md`
**Blocks**: C-PM-SIMPLIFY-B (score 12, OPEN)
**Risk**: HIGH (composer rebalance; ~15 hardcoded composer/capacity tests will need recalculation; INFEASIBLE rate may rise)

| ID | Status | Question | Default if no answer |
|---|---|---|---|
| SW-Q6 | OPEN | End-of-deep-cycles comm: 1 fixed anchor (e.g., 15:30) or 1 after each Deep block? | 1 fixed anchor at 15:30 |
| SW-Q7 | OPEN | Default duration for end-of-deep-cycles comm slot? | 15 minutes |
| SW-Q8 | OPEN | Does Daily Standup count as "start of work communication" (making 09:15 AM Comm redundant)? | They coexist (status quo) |
| SW-Q9 | OPEN | Is End-of-Activity Reflection the canonical CI block, or do project-type-specific CI activities replace it? | Canonical; project-specific is additive |
| SW-Q10 | OPEN | CI sacredness: confirm-on-skip only (lowest risk) or hard-block? | Confirm-on-skip + telemetry (architect's recommendation) |

---

## Section B — Today Simplify Phase C (No-projects discovery branch)

**Source**: `PRODUCT_TODAY_SIMPLIFY.md`, `ARCHITECTURE_DELTA_TODAY_SIMPLIFY.md`
**Blocks**: C-PM-SIMPLIFY-C (score 13, OPEN)
**Risk**: LOW (additive only; architect confirmed Kaizen IS the project proxy)

| ID | Status | Question | Default if no answer |
|---|---|---|---|
| SW-Q1 | OPEN | What activities are in the "project discovery" inventory? (names, durations, copy) | Phil-authored — no default |
| SW-Q2 | OPEN | What's the standard governance step at project approval? (workflow, gates) | Phil-authored — no default |
| SW-Q3 | OPEN | What's the project assignment standard work? | Phil-authored — no default |
| SW-Q4 | OPEN | Full project types inventory? (current `ProjectType` enum has limited values — does Phil want to expand?) | Use existing enum values |
| SW-Q5 | OPEN | What does a "discovery placeholder" row look like in CycleCard? (4h+ block while no project; what name, what bucket) | bucket=PROJECT, name="Project discovery", optional=false |

---

## Section C — Project type standard work (Phase C content)

**Source**: `PRODUCT_TODAY_SIMPLIFY.md` SW-Q13 through SW-Q18
**Blocks**: Full Phase C functionality

| ID | Status | Question | Default if no answer |
|---|---|---|---|
| SW-Q13 | OPEN | Project type browser: organize by category, search, or both? | Both (search + category list) |
| SW-Q14 | OPEN | Per-project-type standard work — does each project type carry its own catalog of activities, or do they all share the 60-entry catalog? | All share existing catalog; type filters via `projectTypeBinding` |
| SW-Q15 | OPEN | Project creation flow — single-step (name + type) or multi-step (name + type + governance + assignment)? | Single-step at first; expand later |
| SW-Q16 | OPEN | Project assignment — solo (current model) or team-aware? | Solo for now |
| SW-Q17 | OPEN | Project lifecycle states beyond what Kaizen carries (DRAFT/ACTIVE/IN_REMEASUREMENT/CLOSED)? | Reuse Kaizen states |
| SW-Q18 | OPEN | Project completion — what triggers it? (Manual close vs metric threshold vs Kaizen graduation) | Manual close at first |

---

## Section D — Lunch block (RESOLVED — historical)

**Source**: `ARCHITECTURE_DELTA_LUNCH_BLOCK.md`, `PRD_LUNCH_BLOCK.md`
**Status**: All 4 OQs answered + 2 Phil directives applied at Iter 26.
**Blocked**: nothing — DONE.

| ID | Status | Question | Phil's answer | Implemented in |
|---|---|---|---|---|
| OQ-1 | ANSWERED | focusArea: reuse `CONTINUOUS_IMPROVEMENT` or new `RECOVERY` enum? | Reuse `CONTINUOUS_IMPROVEMENT` (no §6.5 hit on types.js) | Iter 26 |
| OQ-2 | ANSWERED | `outputArtifact.required: false` invariant check? | Yes — false (lunch produces no artifact) | Iter 26 |
| OQ-4 | ANSWERED | Weekly composer parity (does Week view also emit lunch?) | Yes — both daily and weekly | Iter 26 |
| (new) | ANSWERED | Comm timing: status-quo or move comm to 12:30? | (a) status quo — Post-lunch Comm stays at 13:00 | Iter 26 |
| (new) | ANSWERED | Lunch duration default | 30 min (Phil directive — not architect's original 60) | Iter 26 |
| (new) | ANSWERED | Lunch start time | 12:00 (Noon) | Iter 26 |

---

## Section E — Today Calendar Conversion (PRODUCT_TODAY_CALENDAR.md)

**Source**: `PRODUCT_TODAY_CALENDAR.md`
**Blocks**: C-PM-CAL-01 through C-PM-CAL-08 (Phase 1 / Phase 2 / Phase 3)
**Risk**: HIGH on SW-Q-CAL-01 (drag commit semantics conflicts with deliberate-ratification model)

| ID | Status | Question | Default if no answer | Blocks |
|---|---|---|---|---|
| SW-Q-CAL-01 | OPEN | Drag commit semantics: Immediate on drop (Google Calendar pattern — writes Variance row on drag-end) OR Pending until explicit Save/Commit click (BAM-X deliberate-ratification pattern — preserves Commit/Cancel/Undo triad)? | Pending until Save | Phase 2 |
| SW-Q-CAL-02 | OPEN | Click-empty-time slot (Phase 3): what gets inserted? (a) opens Catalog picker, (b) inserts a generic unnamed placeholder block, (c) not allowed — empty time stays empty until Auto-Plan or Edit mode | Opens Catalog picker | Phase 3 |
| SW-Q-CAL-03 | OPEN | Conflict / overlap policy after drag: (a) auto-shift the colliding block forward, (b) show conflict warning and require manual resolution, (c) reject drop and snap block back to origin | Show warning, require manual resolution | Phase 2 |
| SW-Q-CAL-04 | OPEN | Table toggle vs replace: retain six-column table as a secondary "List" view (toggle in CycleCard header) OR replace the table outright with the calendar grid? | Replace outright | Phase 1 |

---

## Coordinator usage

Before declaring work "Phil-blocked":
1. Check this file for the relevant SW-Q items
2. If unanswered, surface the SW-Q ID(s) to Phil with the proposed defaults
3. If Phil answers, mark ANSWERED + cite the iteration where the answer was applied
4. If Phil approves the defaults, mark ANSWERED + apply at next iteration

When new SW-Q items arise from Define-passes, append to the appropriate section.

When Phil answers in batch (recommended pattern), mark all answered questions in a single coordinator pass and update the blocked-on candidates simultaneously.

---

_Created at Iter 27 meta-review §7.5 (2026-05-04). Last update: 2026-05-04._
