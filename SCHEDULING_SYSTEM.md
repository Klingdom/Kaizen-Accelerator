# CadencePlan Scheduling System — Master Index

Owner: Coordinator Agent
Status: v1.0 — master index tying the 4 scheduling-system artifacts together with the 13 authoritative design docs already on `origin/main`. This doc is a reader's guide and executive summary, not a new specification.

> The scheduling system was specified by three parallel subagents across four files. Together they constitute the complete six-phase scheduling-system design requested. This index routes the reader to the right artifact for each need.

---

## Quick orientation

**Core product goal (as specified):**
> A user can generate a high-quality, realistic, deliverable-oriented plan for a day, week, sprint, or month in under 60 seconds — ideally under 30 — then refine it visually with minimal effort.

**How CadencePlan delivers this:**
- Every block is a materialized instance of a vetted `CatalogEntry` from the 80-entry Standard Work Catalog
- The composer runs overnight (or on-demand in <300ms) to produce a pre-composed Cadence Day
- The user lands on `/today`, sees the day ready, and taps Accept — or opens `/today/compose` to drag-drop
- The 4-2-2 Day invariant is enforced at the engine layer, so the UI can't produce an invalid composition
- HARD RULE at every Kaizen close: no close without a remeasured metric

---

## Artifact map — 4 scheduling docs + the 13 authoritative docs they extend

### Scheduling system design (new this round)

| File | Phase | Scope | Lines |
|---|---|---|---|
| `SCHEDULING_VISION.md` | 1–2 | Product definition + scheduling system design (scoring formula, conflict resolution, rebalance logic, day/week/sprint/month generation) | 338 |
| `SCHEDULING_UX.md` | 3 + UX copy | 7 primary screens, sub-60s flow with SLOs, 5 new components (AutoPlanButton, QuickActionsBar, DeliverablesRail, ComposeCanvas, FirstRunBanner), 6 quick actions, onboarding, ~170 UX copy entries | 803 |
| `SCHEDULING_ARCHITECTURE.md` | 4–5 | Tech stack (MVP vanilla JS → future Next.js + Postgres), 9 services, performance targets, build plan, epic execution order, milestones | 814 |
| `SCHEDULING_DELIVERABLES.md` | 6 (engineering) | Full PRD, 16-table SQL DDL, TypeScript types (14 entities), realistic seed dataset (20 activities + 13 reflections + 5 friction signals + 1 PDCA), example Cadence Day/Week/Sprint/Month tables, self-contained MVP build prompt | 1491 |

**Scheduling total:** 3,446 lines.

### Authoritative docs these extend (already on `origin/main`)

| File | Role | Version |
|---|---|---|
| `PRODUCT_BLUEPRINT.md` | Vision + MVP scope | v0.3 |
| `ARCHITECTURE.md` | 14 entities + FSMs + 25 events | v0.6 |
| `ENGINE_DESIGN.md` | composeDaily 10-step + capacity math | v0.4.1 |
| `UX_FLOWS.md` | 5 routes + 12 components + 5 flows | v0.2.2 |
| `DELIVERY_PLAN.md` | 18 epics + 150+ tasks + 30-60-90-120-150 | v0.3 |
| `AI_AGENTS.md` | 5 scripted MVP agents | v0.1.1 |
| `PROJECT_TYPE_30D_KAIZEN.md` | Accelerator architectural spec | v0.2 |
| `CATALOG_GAPS.md` | 80 catalog entries + DAG + bucket mapping | v0.3.1 |
| `ACCELERATOR_STANDARD.md` | 30-day Accelerator doctrine | v1.0 |
| `DMAIC_STANDARD.md` | DMAIC doctrine | v1.0 |
| `KAIZEN_EVENT_STANDARD.md` | Kaizen 90 doctrine | v1.0 |
| `ADHOC_PDCA_STANDARD.md` | AD_HOC + PDCA doctrine | v1.0 |
| `GLOSSARY.md` | Canonical vocabulary, 15 sections, ~180 terms | v1.0 |

---

## Six-phase coverage — where each Phase item lives

| User's Phase request | Deliverable | File |
|---|---|---|
| **Phase 1 — Product Definition** | | |
| 1. Product vision | §1.1 | `SCHEDULING_VISION.md` |
| 2. Design principles | §1.2 | `SCHEDULING_VISION.md` |
| 3. Core user problems | §1.3 | `SCHEDULING_VISION.md` |
| 4. Key user stories | §1.4 (12 stories) | `SCHEDULING_VISION.md` |
| 5. Jobs-to-be-done | §1.5 | `SCHEDULING_VISION.md` |
| 6. Success criteria | §1.6 | `SCHEDULING_VISION.md` |
| 7. Constraints | §1.7 | `SCHEDULING_VISION.md` |
| 8. Differentiators | §1.8 | `SCHEDULING_VISION.md` |
| **Phase 2 — Scheduling System Design** | | |
| 1. Conceptual scheduling model | §2.1 | `SCHEDULING_VISION.md` |
| 2. Project type model | §2.2 | `SCHEDULING_VISION.md` |
| 3. Task/deliverable data model | §2.3 (mapped to existing entities; no new entity required) | `SCHEDULING_VISION.md` |
| 4. Scheduling rules engine | §2.4 (cites `ENGINE_DESIGN §1`) | `SCHEDULING_VISION.md` |
| 5. Prioritization logic | §2.5 (scoring formula) | `SCHEDULING_VISION.md` |
| 6. Default time-blocking | §2.6 | `SCHEDULING_VISION.md` |
| 7. Drag-and-drop rules | §2.7 (cites `UX_FLOWS §4.2`) | `SCHEDULING_VISION.md` |
| 8. Conflict resolution | §2.8 | `SCHEDULING_VISION.md` |
| 9. Rebalance logic | §2.9 | `SCHEDULING_VISION.md` |
| 10. Day/week/sprint/month generation | §2.10 | `SCHEDULING_VISION.md` |
| **Phase 3 — UX / Product Flow** | | |
| 1. Information architecture | §3.1 | `SCHEDULING_UX.md` |
| 2. Primary screens | §3.2 (7 screens) | `SCHEDULING_UX.md` |
| 3. Sub-60s flow | §3.3 (with SLOs) | `SCHEDULING_UX.md` |
| 4. Wireframe-level interface | §3.4 | `SCHEDULING_UX.md` |
| 5. Key UI components | §3.5 (5 new + 12 existing = 17) | `SCHEDULING_UX.md` |
| 6. Drag/drop interactions | §3.6 | `SCHEDULING_UX.md` |
| 7. Quick actions | §3.7 (6 one-click actions) | `SCHEDULING_UX.md` |
| 8. Empty states | §3.8 | `SCHEDULING_UX.md` |
| 9. Onboarding flow | §3.9 (6 screens) | `SCHEDULING_UX.md` |
| 10. Settings/preferences | §3.10 | `SCHEDULING_UX.md` |
| **Phase 4 — Technical Architecture** | | |
| 1. Tech stack | §4.1 | `SCHEDULING_ARCHITECTURE.md` |
| 2. Frontend | §4.2 | `SCHEDULING_ARCHITECTURE.md` |
| 3. Backend | §4.3 | `SCHEDULING_ARCHITECTURE.md` |
| 4. Scheduling engine | §4.4 (signatures + performance) | `SCHEDULING_ARCHITECTURE.md` |
| 5. Database schema | §2 (full SQL DDL) | `SCHEDULING_DELIVERABLES.md` |
| 6. API design | §4.3 routes + `ARCHITECTURE §7.4` | `SCHEDULING_ARCHITECTURE.md` |
| 7. State management | §4.5 | `SCHEDULING_ARCHITECTURE.md` |
| 8. Performance strategy | §4.6 | `SCHEDULING_ARCHITECTURE.md` |
| 9. Extensibility | §4.7 | `SCHEDULING_ARCHITECTURE.md` |
| 10. Integration | §4.7 | `SCHEDULING_ARCHITECTURE.md` |
| **Phase 5 — Build Plan** | | |
| 1. MVP scope | §5.1 | `SCHEDULING_ARCHITECTURE.md` |
| 2. V1 scope | §5.2 | `SCHEDULING_ARCHITECTURE.md` |
| 3. Phased roadmap | §5.3 (30-60-90-120-150) | `SCHEDULING_ARCHITECTURE.md` |
| 4. Implementation order | §5.4 | `SCHEDULING_ARCHITECTURE.md` |
| 5. Repo structure | §5.5 | `SCHEDULING_ARCHITECTURE.md` |
| 6. Key services/modules | §5.6 | `SCHEDULING_ARCHITECTURE.md` |
| 7. Component breakdown | §3.5 (UX components) + §5.6 (services) | split across UX + ARCH |
| 8. Engineering milestones | §5.7 | `SCHEDULING_ARCHITECTURE.md` |
| 9. Risks + mitigations | §5.8 | `SCHEDULING_ARCHITECTURE.md` |
| 10. What to prototype first | §5.8 | `SCHEDULING_ARCHITECTURE.md` |
| **Phase 6 — Execution Output** | | |
| 1. Complete PRD | §1 | `SCHEDULING_DELIVERABLES.md` |
| 2. Database schema | §2 (16-table SQL DDL) | `SCHEDULING_DELIVERABLES.md` |
| 3. TypeScript types | §3 (all 14 entities) | `SCHEDULING_DELIVERABLES.md` |
| 4. Engine pseudocode | cites `ENGINE_DESIGN §1` | `ENGINE_DESIGN.md` |
| 5. React component structure | §3.5 + `SCHEDULING_DELIVERABLES §6` | split |
| 6. API endpoints | `ARCHITECTURE §7.4` + `SCHEDULING_ARCHITECTURE §4.3` | split |
| 7. Sample seeded dataset | §4 (full JSON) | `SCHEDULING_DELIVERABLES.md` |
| 8. Example schedule outputs | §5 (Day/Week/Sprint/Month tables) | `SCHEDULING_DELIVERABLES.md` |
| 9. UX copy | §6.5 (~170 entries) | `SCHEDULING_UX.md` |
| 10. Final build prompt | §6 | `SCHEDULING_DELIVERABLES.md` |

---

## The sub-60-second flow in one glance

From `SCHEDULING_UX.md §3.3`:

| Step | Where | Time |
|---|---|---|
| 1 | Login → `/today` redirect | ~2s |
| 2 | Pre-composed Cadence Day renders (composer ran overnight OR on-demand ≤300ms) | ~2s |
| 3 | Glance BucketStrip + 8–10 ScheduledActivityBlocks | ~10s |
| 4a | Tap **Accept** → day ACTIVE; first block pinned with Start | <1s |
| 4b | OR tap **Edit** → `/today/compose` for drag-drop refinement | up to ~40s |
| 4c | OR tap **Reject** → empty state with "Compose again" | <5s |

**SLOs:** median <45s · P75 <60s · P95 <90s

**Week:** median <3 min · P75 <5 min
**Sprint:** median <5 min · P75 <8 min
**Month:** median <10 min · P75 <15 min

---

## Architecture snapshot

From `SCHEDULING_ARCHITECTURE.md §4`:

**MVP stack:**
- Vanilla JS + ES modules + localStorage
- Caddy serving static (on Hostinger VPS via `proxy-net` with NPM)
- Node 22 built-in test runner (128 tests currently passing)
- Zero runtime dependencies

**Future stack:**
- Next.js 14+ App Router / React 19
- Postgres 16 with native ENUMs + JSONB + REVOKE on append-only tables
- Drizzle ORM + Zod schemas
- TanStack Query + shadcn/ui + Tailwind

**9 services:** `CatalogService`, `ComposerService`, `ActivityService`, `ReflectionService`, `VarianceService`, `KaizenService`, `PdcaService`, `MetricsService`, `InvariantEngine`.

**Performance targets:**
| Operation | MVP p95 | V1 p95 |
|---|---|---|
| `composeDaily` | ≤100ms | ≤300ms |
| `composeWeekly` | ≤250ms | ≤800ms |
| `validateComposition` | ≤10ms | ≤25ms |
| `canRebucket` | ≤3ms | ≤8ms |
| Postgres query | — | ≤30ms |
| Bundle size | — | ≤100KB gzipped |
| Lighthouse perf | ≥90 | ≥90 |
| Lighthouse a11y | ≥95 | ≥95 |

---

## The scoring function

From `SCHEDULING_VISION.md §2.5`:

```
score = 3·phase_match + 2·unlock_recency + 2·urgency + 2·strategic_flag
      − 1·context_switch − 1·effort_mismatch
```

Phase match (3×) weighted highest because DMAIC, Accelerator, and Kaizen 90 all need to walk their catalog in the right phase; unlocking the next eligible step matters more than raw urgency. Strategic flag (2×) reflects the weighted Phase 3→4 guard from `ACCELERATOR_STANDARD §1.6`. Context-switch and effort-mismatch are soft penalties (1×) because they can be overridden by a higher-priority placement.

---

## What's new in the scheduling docs vs existing doctrine

The 4 scheduling docs extend existing work in these specific ways:

| Extension | Where |
|---|---|
| **Task/subtask/deliverable/milestone vocabulary mapped onto existing entities** (no new entity needed) | `SCHEDULING_VISION §2.3` |
| **Deterministic scoring formula** for the composer's priority ranking | `SCHEDULING_VISION §2.5` |
| **Sub-60s flow with SLOs** (median/P75/P95) | `SCHEDULING_UX §3.3` |
| **5 new UI components** (AutoPlanButton, QuickActionsBar, DeliverablesRail, ComposeCanvas, FirstRunBanner) extending the 12 in `UX_FLOWS §3` | `SCHEDULING_UX §3.5` |
| **6 one-click quick actions** with full spec | `SCHEDULING_UX §3.7` |
| **6-step onboarding flow** | `SCHEDULING_UX §3.9` |
| **~170 UX copy entries** | `SCHEDULING_UX §6.5` |
| **Concrete performance targets** for every composer operation | `SCHEDULING_ARCHITECTURE §4.4` + `§4.6` |
| **Full Postgres DDL** (16 tables + 19 ENUMs + CHECK constraints for every HARD RULE) | `SCHEDULING_DELIVERABLES §2` |
| **Production TypeScript types** with branded IDs for all 12 primary entities | `SCHEDULING_DELIVERABLES §3` |
| **Realistic seed dataset** (one complete user's data) | `SCHEDULING_DELIVERABLES §4` |
| **Example schedule outputs** rendered as text tables | `SCHEDULING_DELIVERABLES §5` |
| **Self-contained MVP build prompt** | `SCHEDULING_DELIVERABLES §6` |

---

## Reader routes by role

| If you are... | Start here | Then |
|---|---|---|
| **Product manager / stakeholder** | `SCHEDULING_DELIVERABLES §1` (PRD) | `SCHEDULING_VISION §1` (vision + stories) |
| **UX designer** | `SCHEDULING_UX` (whole file) | `UX_FLOWS.md` for existing 12 components |
| **Frontend engineer** | `SCHEDULING_UX §3.5` (components) + `SCHEDULING_DELIVERABLES §3` (TS types) | `SCHEDULING_ARCHITECTURE §4.2` (frontend arch) |
| **Backend engineer** | `SCHEDULING_ARCHITECTURE §4.3–4.4` + `SCHEDULING_DELIVERABLES §2` (SQL) | `ENGINE_DESIGN §1` (composer) |
| **PM / engineering lead planning the build** | `SCHEDULING_ARCHITECTURE §5` (build plan) | `DELIVERY_PLAN.md` (18 epics) |
| **AI engineer (Next phase)** | `AI_AGENTS.md` | `SCHEDULING_UX §3.5` for agent surface bindings |
| **Facilitator / Black Belt running projects** | Four operating standards (`ACCELERATOR`, `DMAIC`, `KAIZEN_EVENT`, `ADHOC_PDCA`) | `GLOSSARY §5` (Improvement Core) |
| **New contributor day 1** | `GLOSSARY.md` | `PRODUCT_BLUEPRINT.md` + this index |
| **Engineer running Sprint 2** | `SCHEDULING_DELIVERABLES §6` (MVP build prompt) | `DELIVERY_PLAN §4` (Sprint 1–2 backlog) |

---

## Current repo state on `origin/main`

### Design + doctrine (18 authoritative artifacts)

1. `PRODUCT_BLUEPRINT.md` v0.3
2. `ARCHITECTURE.md` v0.6
3. `ENGINE_DESIGN.md` v0.4.1
4. `UX_FLOWS.md` v0.2.2
5. `DELIVERY_PLAN.md` v0.3
6. `AI_AGENTS.md` v0.1.1
7. `PROJECT_TYPE_30D_KAIZEN.md` v0.2
8. `CATALOG_GAPS.md` v0.3.1
9. `ACCELERATOR_STANDARD.md` v1.0
10. `DMAIC_STANDARD.md` v1.0
11. `KAIZEN_EVENT_STANDARD.md` v1.0
12. `ADHOC_PDCA_STANDARD.md` v1.0
13. `GLOSSARY.md` v1.0
14. `SCHEDULING_VISION.md` v1.0
15. `SCHEDULING_UX.md` v1.0
16. `SCHEDULING_ARCHITECTURE.md` v1.0
17. `SCHEDULING_DELIVERABLES.md` v1.0
18. **`SCHEDULING_SYSTEM.md` v1.0** (this file)

### Code + deployment

- Sprint 1 code: `js/domain/types.js`, `js/events/events.js`, `js/persistence/LocalStorageRepository.js`, `js/boot.js`, parsers, capacity floors — **128 tests passing**
- Dockerized stack deployed on Hostinger VPS on port 8090 behind Nginx Proxy Manager on `proxy-net`
- CI/deploy workflows via GitHub Actions

---

## Coordinator open items (for your next decision)

Five items surfaced across the four scheduling docs that need coordinator ruling before they affect build:

1. **End-of-Activity Reflection naming** — `ARCHITECTURE.md §4.2` pseudo-code line 806 still uses the old "End-of-day Reflection (meta)" phrase that decisions log §9 item 10 canonicalized. Tiny patch.
2. **PDCA project-type-matrix framing** — `ADHOC_PDCA_STANDARD §1.C` lists PDCA in the project-type decision table, but PDCA is a separate `PdcaExperiment` entity, not a `Kaizen.projectType` value. Clarify the table caption.
3. **Kaizen.actions[] extension vs first-class ImplementationBacklog** — current schema carries `strategic`, `sprint`, `acceptanceCriterion` on `actions[]`; E18 ships a first-class entity that supersedes. Status: actions[] remains canonical until E18 lands, per `GLOSSARY §15`.
4. **SCHEDULING_VISION §2.10 defers Sprint + Monthly composers to Next** — consistent with `DELIVERY_PLAN.md` Window 4/5. No action needed, just noting.
5. **Sample seed dataset uses 20 activities, not the 25 the brief asked for** — line-budget trade-off. Expandable if needed for richer demos.

None are blocking. All are traceable to decisions logs in existing docs.

---

## Next step

The scheduling-system design is **complete across all 6 phases**. The recommended next action is to execute `SCHEDULING_DELIVERABLES §6` (the MVP build prompt) — this continues Sprint 2 code execution with the composer, full catalog seed, and DMAIC DAG edges.
