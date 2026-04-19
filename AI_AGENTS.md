# BAM-X Kaizen OS — AI Agents Layer

Owner: AI Systems Designer Agent
Status: Draft v0.1 — grounded in `PRODUCT_BLUEPRINT.md` v0.2, `ARCHITECTURE.md` v0.3, `ENGINE_DESIGN.md` v0.2, `UX_FLOWS.md` v0.2, `CATALOG_GAPS.md` v0.1 §H, and `DELIVERY_PLAN.md` (12 epics, Next-window additions).
Scope: the AI layer that sits **beside** the deterministic engine. It never replaces the engine. MVP ships scripted heuristics inside `UX_FLOWS §4.6 + §5` coaching; LLM-powered variants and cross-week pattern agents ship in Next per blueprint §4.2 and §5.2 ("AI coach inside composer", "AI weekly DMAIC draft").

> **Terminology reconciliation.** All entities, events, routes, services, and components referenced below use the names from the upstream docs (`ARCHITECTURE.md` §2–§6, `UX_FLOWS.md` §1–§5, `ENGINE_DESIGN.md` §1–§5, `CATALOG_GAPS.md §H`). No new names. Discovered shortfalls are flagged as `> **Architecture gap:** …` with a proposed resolution and referred back to `ARCHITECTURE.md §9` for landing.

---

## 1. Principles & Guardrails

The AI layer is **additive, evidence-grounded, and abstain-first**. It is governed by seven non-negotiable rules.

### 1.1 Engine-first rule

The composer (`ComposerService.composeDaily` / `composeWeekly`), the `InvariantEngine` (4-2-2 floors/ceilings, non-optional set, over-capacity, output-artifact-at-close), the capacity model (`ENGINE_DESIGN §2`), the Kaizen close HARD RULE (remeasurement required), and every FSM in `ARCHITECTURE §3` are **deterministic and AI-free**. An AI agent may:

- **Suggest** a ranking, a next step, a microcopy string, an explanatory sentence.
- **Annotate** an entity the user already sees (a Deep block, a Kaizen card, a Reflection prompt).
- **Rank** options when the engine returns multiple eligible choices (e.g., two DMAIC steps whose `dependsOn` is satisfied).

An AI agent may **never**:

- Override or bypass a guard in `InvariantEngine.validateComposition`, `ActivityService.close/skip`, `KaizenService.close`, or `VarianceService.log`.
- Promote, close, baseline, or remeasure a Kaizen without the user's explicit click. `KaizenPromoted` / `KaizenBaselineLocked` / `KaizenRemeasured` / `KaizenClosed` events are fired by services only after user action.
- Write to `Variance`, `Reflection`, `FrictionSignal`, `Kaizen`, `BaselineMetric`, or `Remeasurement` silently. All writes flow through the named services and state transitions.
- Silently truncate, re-compose, or modify a `Composition`. If the engine returns `InfeasibleResult`, the AI layer may only help the user read the `suggestedActions` (per `ARCHITECTURE §4.7`).

### 1.2 Evidence rule

Every AI output must cite the concrete entity rows it reasoned over. Each `AgentSuggestion` carries a `basisEntityRefs: EntityRef[]` array (schema in §3.2). An agent with no basis abstains. A reviewer reading any suggestion in the telemetry log must be able to re-derive it from the cited rows.

### 1.3 Behavior-bar rule

Every agent must trace to at least one named KPI from blueprint §7. An agent that does not measurably move one of these numbers is deleted:

| Agent | Primary KPI lift target |
|---|---|
| Planning | Composition acceptance rate (blueprint §7.2: ≥60% Daily, ≥50% Weekly without edit) |
| Momentum | Standard Work adherence (§7.2: ≥70%) + start-on-time (§7.3 leading indicator via `ActivityStartedLate`) |
| Context | Output-artifact completeness (§7.3: ≥80% by day 7) + Deep minutes per week (`UX_FLOWS §6.4`) |
| Reflection | Reflection rate on-time (§7.2: ≥75%) + validated Kaizens/MAU/month (§7.5: ≥1.0) |
| Composer Explainer | Composition acceptance rate (same as Planning; reduces "why did it pick that?" rejects) |

### 1.4 MVP scripted-heuristic vs Next LLM-powered split

- **MVP.** Every agent ships as a deterministic **scripted heuristic** — rule-based pattern matching over the events + entities. No LLM in MVP. This is consistent with `DELIVERY_PLAN.md E11` ("Coaching Microcopy System") and blueprint §5.2 which places "AI coach inside composer" and "AI weekly DMAIC draft" explicitly in Next.
- **Next.** LLM-powered variants ship only where phrasing variety or genuine cross-week pattern-matching adds lift that heuristics cannot reach. Each agent's §2 per-agent spec names what the LLM does and what stays scripted. No MVP epic from `DELIVERY_PLAN` is replaced — the AI layer is additive.

### 1.5 Safety rules

- **No generated reflection text.** Reflections are the user's evidence (blueprint §2: "every completion is a measurement, not a checkbox" and §6.1 JTBD: "the sprint's evidence is captured while it is still fresh"). The Reflection agent may surface pre-read and hints but MUST NOT pre-fill `Reflection.whatWentWell`, `whatToImprove`, or `dmaicDraft.*` text. An "AI weekly DMAIC draft" per blueprint §5.2 is a Next feature that pre-fills **Define/Measure/Analyze only from captured rows** (never invented); the user still authors Improve/Control.
- **No silent Kaizen promotion.** The Weekly Reflection wizard (`UX_FLOWS §2.3 step 4`) is the only path to `KaizenPromoted`. The Reflection agent pre-selects a candidate cluster; the **user clicks Promote**.
- **No silent writes.** Every entity mutation goes through its service (`ActivityService`, `ReflectionService`, `VarianceService`, `KaizenService`, `FrictionService`). The AI layer calls **no repository method directly**.
- **Non-blocking.** No modal agent prompts. Every suggestion appears inline in a named component and is dismissible (`AgentSuggestion.lifecycle` in §4.4). Consistent with `UX_FLOWS §4.6`.
- **Session-scoped reasoning.** Agents reason over the user's own entities only. No cross-user read. No exfiltration of user data beyond the session's own LLM call in Next (and the Next LLM call uses entity **excerpts**, not raw dumps — see §3.1).

### 1.6 Telemetry rule

Every agent must emit an `AgentTelemetryEvent` (§3.3) at three lifecycle points: `PROPOSED` (agent produced a suggestion), `DISPLAYED` (UI rendered it), and one of `ACTED_ON` / `DISMISSED` / `EXPIRED`. This is what lets the KPI lift in §1.3 be measured. An agent with no telemetry is broken.

### 1.7 Idempotency rule

An event firing twice for the same `scheduledActivityId` / `compositionId` / `reflectionId` must not produce duplicate suggestions. Agents maintain a de-dup key (`agentId + basisEntityRefs[].id joined + trigger`) in memory (MVP) or in `agent_suggestions` (Next). Re-fires update the existing suggestion (new `proposedAt`) rather than appending.

---

## 2. Agent Catalog

Five agents. Planning, Momentum, Context, and Reflection are required by `.claude/prompts/06-ai-agent-optimization.md`. Composer Explainer is added because the design needs a read-only agent to turn `Composition.composerInputsSnapshot.explain[]` into the user-facing "why this block?" microcopy on `CycleCard` — it is not a decision-maker, it is a translator, and without it the composer's audit trail does not surface in UI.

Per-agent template: Purpose · Trigger · Input model · Output model · Decision logic · UI surface · KPI lift target · MVP/Next split · Example outputs · Failure / abstain conditions.

---

### 2.1 Planning Agent

**Purpose.** Help the user accept or productively edit the composer's proposed Daily/Weekly `Composition` by ranking the *configurable* slots the composer filled and explaining which ones are closest to a bad fit. It does **not** re-schedule, re-rank non-optionals, or re-run the composer. Behavior change aimed: raise composition acceptance rate (blueprint §7.2 target ≥60% Daily) by reducing "I'll just edit everything" rejections caused by one or two wrong-looking configurable picks.

**Trigger.**
- `CycleProposed { compositionId, cycleType }` (`ARCHITECTURE §6.1`) — fires when `ComposerService` produces a `PROPOSED` Composition. Agent runs before the user opens `/today` or `/week/compose`.
- `CycleEdited { compositionId, editedActivityIds }` fired repeatedly on the same user within 7 days — agent re-runs with a "you edit X frequently; consider disabling in `/catalog` or adjusting capacity in `/settings`" suggestion (matches `UX_FLOWS §5.2`).
- Scheduled run: on user's `sprintAnchorDate` boundary, re-rank the upcoming week's configurable slots.

**Input model** (fields read; nothing written).

```
AgentContext {
  user: User (fields: id, role, dailyCapacityMinutes, workDays, sprintAnchorDate, deepSlicePreference),
  composition: Composition (fields: id, cycleType, state, composerInputsSnapshot),
  activities: ScheduledActivity[] (fields: id, catalogEntryId, bucket, plannedDurationMinutes,
                                    plannedStartAt, sourceOfSchedule, linkedKaizenId, linkedDmaicStepRef),
  catalog: CatalogEntry[] (for each id referenced; fields: id, name, bucket, isNonOptional, dependsOn, cadence),
  recentVariances: Variance[] (windowed: last 14 days; fields: kind, reasonCode, catalogEntryId, loggedAt),
  recentCompositions: Composition[] (last 7 Daily; fields: state, decidedAt, composerInputsSnapshot.explain),
  activeKaizen: Kaizen | null (fields: id, state, actions[], readyToRemeasure)
}
```

**Output model.** `AgentSuggestion[]` (discriminated union in §3.2). Specifically: zero or more of
- `RANKED_OPTION` — a slot the composer filled that has a better alternative **from the same bucket**. Never suggests a replacement that would violate invariants.
- `MICROCOPY` — a short string for the CycleCard header that calls out "2 slots worth a quick review before you Accept."
- `HIGHLIGHT` — a visual emphasis on one `ScheduledActivityBlock` the user should glance at first.

**Decision logic** (MVP scripted — runs in <50ms).

```
fn planningAgent(ctx) -> AgentSuggestion[]:
  suggestions = []

  # Rule P1 — Repeated-edit pattern (mirrors UX_FLOWS §5.2)
  editCount = count(ctx.recentCompositions where state==EDITED and decidedAt within 7d)
  if editCount >= 3:
    suggestions.push(MICROCOPY {
      kind: 'MICROCOPY', slot: 'CycleCard.header',
      text: "You have edited 3 days running. Adjusting capacity or enabled Catalog entries in Settings may fit you better.",
      basisEntityRefs: [compositions[].id]
    })

  # Rule P2 — Configurable CI block that repeatedly gets edited away
  for a in ctx.activities where sourceOfSchedule==COMPOSER_AUTO and bucket==CI and not catalog(a).isNonOptional:
    recentReplaces = count(
      ctx.recentVariances where kind==EDITED_FROM_PROPOSAL and catalogEntryId==a.catalogEntryId within 14d
    )
    if recentReplaces >= 2:
      better = nextBestCatalogEntry(ctx.catalog, bucket=CI, excluding=a.catalogEntryId, applying=ctx.user.role)
      if better:
        suggestions.push(RANKED_OPTION {
          kind: 'RANKED_OPTION', slot: 'ScheduledActivityBlock['+a.id+']',
          replaceCatalogEntryId: a.catalogEntryId,
          suggestedCatalogEntryId: better.id,
          rationale: "You have replaced this 2+ times in the last 14 days.",
          basisEntityRefs: [a.id, ...recentVariances.map(v=>v.id)]
        })

  # Rule P3 — Deep block with no Kaizen link when an active Kaizen exists
  if ctx.activeKaizen and ctx.activeKaizen.state in ['ACTIVE','IN_REMEASUREMENT']:
    for a in ctx.activities where bucket==PROJECT and linkedKaizenId==null:
      suggestions.push(HIGHLIGHT {
        kind: 'HIGHLIGHT', slot: 'ScheduledActivityBlock['+a.id+']',
        emphasis: 'soft',
        rationale: "Active Kaizen "+ctx.activeKaizen.id+" exists. This Deep block is not linked.",
        basisEntityRefs: [a.id, ctx.activeKaizen.id]
      })

  # Rule P4 — Abstain if composerInputsSnapshot.explain already surfaces the same point
  suggestions = dedupeAgainstComposerExplain(suggestions, ctx.composition.composerInputsSnapshot.explain)

  return suggestions
```

**LLM sketch (Next).** Single prompt, session-scoped, cached 24h:

```
SYSTEM: You rank the configurable slots of a composer proposal. You DO NOT edit the proposal. You output JSON matching AgentSuggestion[].
CONTEXT (entity excerpts only):
  - composition: {id, cycleType, composerInputsSnapshot.explain[]}
  - activities (configurable only): [{id, catalogEntry.name, bucket, minutes, sourceOfSchedule}]
  - last-14d edit frequency by catalogEntryId: [{catalogEntryId, count}]
  - active kaizen (if any): {id, title, state}
TASK: return up to 3 RANKED_OPTION or HIGHLIGHT suggestions. Each must cite basisEntityRefs. Abstain (return []) if no suggestion clears 0.7 confidence.
```

**UI surface.** `CycleCard` (`UX_FLOWS §3.1`). `RANKED_OPTION` renders as a small "Review this" chevron on the relevant `ScheduledActivityBlock` (`§3.3`). `MICROCOPY` renders in the CycleCard header per `UX_FLOWS §4.6` coaching rules. `HIGHLIGHT` renders as a soft emphasis on the block (≤10% visual-weight delta). All are dismissible per `§4.4` lifecycle.

**KPI lift target.** Composition acceptance rate Daily — blueprint §7.2 target ≥60% (§7.3 leading-indicator ≥40% by day 14). Measure by comparing acceptance rate for users who saw ≥1 Planning suggestion vs control.

**MVP / Next split.** MVP = **scripted** (P1–P4 rules above). Next = LLM-powered ranking that considers up to 4 weeks of composition/edit history for personalization; adds `RANKED_OPTION` phrasings that mirror user's past reasoning (read-only, via cached 4-week excerpt).

**Example outputs.** See §5.1 (Monday composition) and §5.2 (repeated-edit pattern).

**Failure / abstain conditions.**
- Fewer than 3 prior compositions (insufficient history for P2/P3): abstain.
- `composition.state !== 'PROPOSED'`: abstain (the engine has already committed; Planning has nothing to say).
- `InvariantEngine.validateComposition` returned a violation: abstain — the user needs to see the engine's own message, not an AI annotation layered on top.
- Every `suggestedCatalogEntryId` candidate would fail `canRebucket` or `fits` (per `ENGINE_DESIGN §2.6`): abstain for that slot.

---

### 2.2 Momentum Agent

**Purpose.** Protect the bucket that is most at risk per blueprint §6.2 — PROJECT (Deep Work) — by surfacing the cost of interruption **at the moment of the trade-off**, not at end-of-day. Secondary purpose: reduce variance-without-reason on non-optionals by nudging the reason-code picker into view when a non-optional is about to be skipped. Behavior change aimed: raise Standard Work adherence (§7.2 target ≥70%) and Deep minutes per week (`UX_FLOWS §6.4` headline KPI), and reduce missing-reason variance (§7.3 on-time start leading indicator).

**Trigger.**
- `ActivityStarted { scheduledActivityId }` where the just-started activity has `bucket !== 'PROJECT'` AND another `ScheduledActivity` with `bucket='PROJECT'`, `state='SCHEDULED'`, `plannedStartAt <= now` exists on the same composition. This is the "user opens Teams while Deep block is already live" case (prompt requirement).
- `ActivityStartedLate { scheduledActivityId, minutesLate }` where `minutesLate >= 5` and the late activity is non-optional. Emits the soft start-on-time nudge per `UX_FLOWS §4.7`.
- `VarianceLogged { kind: 'SKIPPED_NON_OPTIONAL', reasonCode: 'ESCALATION' }` where 2+ same-reason variances have fired within the current weekly composition. Surfaces the cluster-forming banner per `UX_FLOWS §5.3 + §5.8`.
- Scheduled run: every 10 min while `/today` is open, scan for Deep blocks that are `SCHEDULED` and past `plannedStartAt + 5 min`.

**Input model.**

```
AgentContext {
  user,
  activeComposition: Composition (Daily, state=ACTIVE),
  activities: ScheduledActivity[] (today's; fields: id, bucket, state, plannedStartAt, actualStartAt, linkedKaizenId, catalogEntryId, intention),
  catalog: CatalogEntry[] (for each id; fields: id, name, bucket, isNonOptional),
  weekVariances: Variance[] (this week; fields: kind, reasonCode, catalogEntryId, loggedAt),
  weekFrictions: FrictionSignal[] (this week, status=OPEN; fields: tag, summary, capturedAt),
  activeKaizen: Kaizen | null,
  pendingReflections: Reflection[] (this week; fields: id, pending, scheduledActivityId, actualEndAt)
}
```

**Output model.** `AgentSuggestion[]`:
- `CONTEXT_CARD` — a small inline card on `/today` for the Deep-block interruption-cost prompt (`UX_FLOWS §6.4 #3`). Carries the trade-off, the scheduled Deep block's `intention`, the linked `Kaizen.title`, and two actions (wired to `ActivityService.skip` for the Deep block or back-out for the Communication/CI block).
- `MICROCOPY` — the pinned banner copy ("Second escalation this week…" per `§5.3`; "Meeting load shows up three times this week…" per `§5.8`).
- `HIGHLIGHT` — a pulse on an overdue Deep block.

**Decision logic** (MVP scripted).

```
fn momentumAgent(ctx, trigger) -> AgentSuggestion[]:
  if trigger.kind == 'ActivityStarted':
    started = find(ctx.activities, trigger.scheduledActivityId)
    # M1 — Deep displacement
    deepAtRisk = ctx.activities.filter(a =>
      a.bucket == 'PROJECT' and a.state == 'SCHEDULED' and a.plannedStartAt <= now()
    )
    for d in deepAtRisk:
      return [CONTEXT_CARD {
        kind: 'CONTEXT_CARD', slot: 'Today.banner',
        title: "Deep block [" + d.intention + "] was scheduled at " + fmt(d.plannedStartAt) + ".",
        body: d.linkedKaizenId ? "Part of: " + kaizen(d.linkedKaizenId).title : null,
        actions: [
          { label: "Start Deep now",        intent: 'START_ACTIVITY', targetId: d.id,        serviceCall: 'ActivityService.start' },
          { label: "Skip Deep with reason", intent: 'SKIP_ACTIVITY',  targetId: d.id,        serviceCall: 'ActivityService.skip (opens reason-code picker UX_FLOWS §2.5)' }
        ],
        basisEntityRefs: [started.id, d.id, ctx.activeKaizen?.id].filter(x=>x)
      }]

  if trigger.kind == 'ActivityStartedLate' and minutesLate >= 5 and isNonOptional(started):
    return [MICROCOPY {
      kind: 'MICROCOPY', slot: 'Today.banner',
      text: "[" + catalogName(started) + "] was scheduled at " + fmt(started.plannedStartAt) + ". Start it now or skip with a reason?",
      basisEntityRefs: [started.id]
    }]

  if trigger.kind == 'VarianceLogged':
    sameReason = ctx.weekVariances.filter(v => v.reasonCode == trigger.reasonCode)
    if sameReason.length >= 2 and trigger.reasonCode == 'ESCALATION':
      return [MICROCOPY {
        kind: 'MICROCOPY', slot: 'ScheduledActivityBlock['+trigger.scheduledActivityId+'].inline',
        text: "Second escalation this week. Escalations show up in Friday's reflection as a friction cluster.",
        basisEntityRefs: sameReason.map(v=>v.id)
      }]

  # M2 — Cluster-forming meeting load (UX_FLOWS §5.8)
  meetingLoad = count(ctx.weekFrictions where tag=='MEETING_LOAD' and status=='OPEN')
  if meetingLoad >= 3:
    return [MICROCOPY {
      kind: 'MICROCOPY', slot: 'Today.banner.dismissibleForToday',
      text: "Meeting load shows up three times this week in your reflections. Friday's reflection will cluster these.",
      basisEntityRefs: weekFrictions.filter(f=>f.tag=='MEETING_LOAD').map(f=>f.id)
    }]

  return []  # default: abstain
```

**LLM sketch (Next).** Not needed for the displacement trade-off (rule is crisp and evidence-clear). LLM may help phrase variety on the `MICROCOPY` cases so the user does not see the same sentence verbatim every week — but phrasing MUST stay ≤20 words, no exclamation points, no "seamless/empower" per `UX_FLOWS §4.6`.

**UI surface.** `CONTEXT_CARD` renders above the BucketStrip on `/today` with two buttons wired to service calls (never to direct repo writes). `MICROCOPY` renders inline per `UX_FLOWS §4.6` rules in the named slot. `HIGHLIGHT` renders on the named `ScheduledActivityBlock`. All dismissible; `CONTEXT_CARD` dismiss is `EXPIRED` not `ACTED_ON`.

**KPI lift target.** Deep minutes per week (`UX_FLOWS §6.4` headline, ≥1200 min target per `ENGINE_DESIGN §2.3`), on-time activity starts (§7.3), adherence (§7.2 ≥70%). Measure by comparing Deep minutes and `VarianceLogged { reasonCode=ESCALATION, catalogEntry.bucket=PROJECT }` counts for treated vs untreated users.

**MVP / Next split.** MVP = **scripted** (M1, M2, late-start nudge — all deterministic). Next = LLM phrasing variety on the cluster-banner text, and optional cross-week pattern detection ("every Tue-afternoon Deep block gets displaced; want to move it to Thu?") — still scripted-heuristic-first with LLM on phrasing only.

**Example outputs.** See §5.3 (Wed 10:15 Teams-before-Deep) and §5.4 (escalation cluster forming).

**Failure / abstain conditions.**
- If the at-risk Deep block is already `IN_PROGRESS` when the agent runs: abstain (Momentum does not second-guess active work).
- If `activeKaizen === null` AND the Deep block's `intention` is empty: abstain on CONTEXT_CARD. The cost-of-displacement message is weaker without a named intention; instead, let the IntentionField empty-state prompt (`UX_FLOWS §3.5`) fire.
- If more than one Deep block is at risk simultaneously: emit one CONTEXT_CARD only (the earliest `plannedStartAt`). Never stack.
- If the user has dismissed the same CONTEXT_CARD twice today: abstain for the day (idempotency §1.7).

---

### 2.3 Context Agent

**Purpose.** Surface the *relevant* upstream artifact at the moment the user needs it — specifically, the DMAIC step output or prior Kaizen artifact that the active Deep block is meant to produce or consume. Example: when the user starts a Deep block linked to `DMAIC C&E Matrix #34` (`CatalogEntry.dependsOn` includes `DMAIC SIPOC #21` and `Detailed Process Maps #32`), Context surfaces the existing SIPOC and Process Map outputs from the same `Kaizen.id`. Behavior change aimed: raise output-artifact-completeness at close (§7.3 target ≥80% by day 7) by giving the user the inputs to actually produce the required output.

**Trigger.**
- `ActivityStarted { scheduledActivityId }` where the started activity has `linkedDmaicStepRef !== null`. Fires once per start.
- `CycleAccepted` — on Monday / sprint boundary, Context pre-computes the week's DMAIC payload inputs so they're cached when the user starts the Deep block.
- Scheduled run on `/today` load: refresh the Context cache for today's `linkedDmaicStepRef` activities.

**Input model.**

```
AgentContext {
  activity: ScheduledActivity (fields: id, catalogEntryId, linkedKaizenId, linkedDmaicStepRef, intention, state),
  catalogEntry: CatalogEntry (fields: id, activityNumber, name, inputs, outputArtifact, procedure, dependsOn),
  dependsOnEntries: CatalogEntry[] (resolved via dependsOn),
  priorScheduledActivities: ScheduledActivity[] (filter:
    linkedKaizenId == activity.linkedKaizenId
    AND catalogEntryId in dependsOnEntries.map(e=>e.id)
    AND state == 'CLOSED'
    AND outputArtifactRef !== null),
  kaizen: Kaizen | null (if linkedKaizenId set; fields: id, title, sourceFrictionSignalIds),
  sourceFrictionSignals: FrictionSignal[] (for kaizen.sourceFrictionSignalIds; fields: summary, tag, capturedAt)
}
```

**Output model.** `AgentSuggestion[]`:
- `CONTEXT_CARD` — inline panel on `/today/activity/:id` (activity runner view, `UX_FLOWS §2.2 step 2`) with a list of linked-artifact references. Each reference is a read-only link to the prior `ScheduledActivity.outputArtifactRef` (schema + value) that this step depends on.
- `MICROCOPY` — a single line in the activity runner ("C&E Matrix uses: SIPOC #21 output (captured Apr 15), Detailed Process Map #32 output (captured Apr 17).").

**Decision logic** (MVP scripted).

```
fn contextAgent(ctx) -> AgentSuggestion[]:
  # C1 — no DMAIC link → nothing to do
  if ctx.activity.linkedDmaicStepRef == null: return []

  # C2 — for each dependsOn entry, find the same-Kaizen CLOSED activity that produced its output
  linked = []
  for d in ctx.catalogEntry.dependsOn:
    prior = ctx.priorScheduledActivities.find(a => a.catalogEntryId == d)
    if prior and prior.outputArtifactRef:
      linked.push({
        catalogEntryName: catalogName(d),
        outputSchema: prior.outputArtifactRef.schema,
        outputValue: prior.outputArtifactRef.value,   // already user-authored — never AI-generated
        capturedAt: prior.actualEndAt,
        priorActivityId: prior.id
      })

  # C3 — if no prior outputs exist, abstain with explicit no-evidence notice
  if linked.length == 0:
    return [MICROCOPY {
      kind: 'MICROCOPY', slot: 'ActivityRunner.banner',
      text: ctx.catalogEntry.name + " depends on [" + ctx.catalogEntry.dependsOn.map(catalogName).join(", ") + "] output(s), none closed yet on this Kaizen.",
      basisEntityRefs: [ctx.activity.id]
    }]

  # C4 — happy path: surface the linked outputs
  return [CONTEXT_CARD {
    kind: 'CONTEXT_CARD', slot: 'ActivityRunner.rightRail',
    title: ctx.catalogEntry.name + " uses:",
    links: linked.map(l => ({
      label: l.catalogEntryName + " output (" + fmtDate(l.capturedAt) + ")",
      preview: truncate(l.outputValue, 200),
      priorActivityId: l.priorActivityId
    })),
    basisEntityRefs: [ctx.activity.id, ...linked.map(l=>l.priorActivityId)]
  }]
```

**LLM sketch (Next).** A Next LLM pass may add a 1-sentence **summary** of the prior outputs (e.g., summarize the SIPOC text into "5 steps, inputs and outputs tracked; key bottleneck flagged at step 3"). The LLM summary is cached on first read and regenerated only when the prior `outputArtifactRef` changes. The LLM MUST be shown only the entity excerpt — never raw user data beyond the artifact text that is already on the user's own screen.

> **Architecture gap:** `outputArtifactRef.value` shapes per-schema are rendered inline in the activity close sheet (`UX_FLOWS §4.5`), but there is no typed "artifact viewer" component for use outside the close sheet. **Proposed resolution:** add a read-only `ArtifactPreview` sub-component to `UX_FLOWS §3` (lives inside `ScheduledActivityBlock` in CLOSED state and inside Context's `CONTEXT_CARD.links[].preview`). No new entity; it reuses `outputArtifactRef.schema` for rendering. Flag for inclusion in `UX_FLOWS` next revision.

**UI surface.** `CONTEXT_CARD` renders in the right-rail of `/today/activity/:id` (activity runner view, `UX_FLOWS §2.2 step 2`). `MICROCOPY` renders below the IntentionField. Both dismissible.

**KPI lift target.** Output-artifact-completeness at close (blueprint §7.3 target ≥80% by day 7). A DMAIC/Kaizen Deep block with visible upstream inputs is measurably more likely to close with a valid output artifact. Secondary KPI: Deep minutes actually spent on Kaizen work (not generic Deep Work).

**MVP / Next split.** MVP = **scripted** (C1–C4). Next = LLM summarization + cross-Kaizen link detection (e.g., "this SIPOC mirrors one from your closed Kaizen K-042 3 weeks ago; the Process Map from that one may still apply"). LLM never writes entities; always returns text for UI render.

**Example outputs.** See §5.5 (C&E Matrix with prior SIPOC + Process Map).

**Failure / abstain conditions.**
- `activity.linkedDmaicStepRef === null`: abstain.
- No prior CLOSED `ScheduledActivity` exists for any `dependsOn` entry: emit only the `MICROCOPY` no-evidence notice (C3) — no `CONTEXT_CARD`.
- The prior outputs are older than 60 days: emit the links but add a 1-line caveat ("SIPOC output is 78 days old — confirm it still applies.") — not a block.
- `activity.state !== 'IN_PROGRESS'` on render (already closed, or was skipped): abstain.

---

### 2.4 Reflection Agent

**Purpose.** Turn the week's captured evidence — `Variance[]`, `FrictionSignal[]`, `pending=false` Reflections with `frictionFlag=true`, `ActivityStartedLate` counts — into pre-read and a pre-selected cluster for `WeeklyReflectionWizard` (`UX_FLOWS §2.3`). It does **not** author reflection text. It does **not** promote Kaizens silently. It pre-computes the inputs the user will see at step 1 and step 4 of the Weekly Reflection. Behavior change aimed: raise validated-Kaizen throughput (blueprint §7.5 target ≥1.0/MAU/month) and weekly-reflection completion (§7.3 "First Weekly Reflection by end of week 2").

**Trigger.**
- `ReflectionCaptured { onTime }` — throughout the week, maintain a running cluster count.
- `FrictionSignalCaptured { frictionSignalId }` — add to `KaizenCandidateQueue` cluster map by `tag`.
- `VarianceLogged` — contributes to the "3 escalation variances this week" hint for Thu close-of-day (step 4 pre-selection rationale).
- Scheduled runs:
  - Thursday afternoon (close-of-Thu or Thu 16:00 local) — emit an advance hint `MICROCOPY` on `/today` ("3 escalation variances this week; Friday's reflection will cluster these.").
  - Friday morning on `/today` load — surface the week's 5 Friction Signals as pre-read.
  - Immediately when the user opens `/week/reflect` step 1 — surface the pre-read list (already computed).

**Input model.**

```
AgentContext {
  user,
  weekComposition: Composition (WEEKLY),
  weekVariances: Variance[] (this week; kind, reasonCode, catalogEntryId, loggedAt),
  weekFrictions: FrictionSignal[] (this week, status in [OPEN, CLUSTERED]; tag, summary, capturedAt, reflectionId),
  weekReflections: Reflection[] (this week, kind=END_OF_ACTIVITY, pending=false; capturedAt, planVsActualMinutes),
  clusterDismissals: map<tag, { lastDismissedAt, dismissedCount, lastReasonSummary }> (from bamx:v1:clusterDismissals),
  recentKaizens: Kaizen[] (last 4 weeks closed; title, closeKind, sourceFrictionSignalIds),
  activeKaizen: Kaizen | null
}
```

**Output model.** `AgentSuggestion[]` — specifically:
- `REFLECTION_PROMPT_AUGMENT` — a new discriminated-union kind (§3.2) that feeds the `WeeklyReflectionWizard` at steps 1 and 4. Carries: (a) the week's top-5 `FrictionSignal` pre-read list, (b) top-3 clustered tag counts, (c) the pre-selected cluster for step 4 (tag + count + contributing FrictionSignal ids), (d) the dismissed-cluster hint if applicable.
- `MICROCOPY` — the Thursday close-of-day advance hint and the "similar cluster dismissed N weeks ago" hint.

**Decision logic** (MVP scripted).

```
fn reflectionAgent(ctx, trigger) -> AgentSuggestion[]:
  # R1 — Thursday advance hint
  if trigger.kind == 'scheduled' and trigger.time == 'THU_1600_LOCAL':
    escalationCount = count(ctx.weekVariances where reasonCode=='ESCALATION')
    if escalationCount >= 3:
      return [MICROCOPY {
        kind: 'MICROCOPY', slot: 'Today.banner',
        text: escalationCount + " escalation variances this week. Friday's reflection will cluster these.",
        basisEntityRefs: ctx.weekVariances.filter(v=>v.reasonCode=='ESCALATION').map(v=>v.id)
      }]

  # R2 — Friday step-1 pre-read (top 5 friction signals)
  if trigger.kind == 'WeeklyReflectionWizard.step1.open':
    top5 = ctx.weekFrictions
      .sortBy(f => -f.capturedAt)   # most recent first; UX_FLOWS §2.3 step 1 lists "top 5 from this week"
      .slice(0, 5)
    return [REFLECTION_PROMPT_AUGMENT {
      kind: 'REFLECTION_PROMPT_AUGMENT', slot: 'WeeklyReflectionWizard.step1.prereadList',
      preread: top5.map(f => ({ id: f.id, summary: f.summary, tag: f.tag, capturedAt: f.capturedAt, reflectionId: f.reflectionId })),
      basisEntityRefs: top5.map(f=>f.id)
    }]

  # R3 — Friday step-4 pre-selected cluster
  if trigger.kind == 'WeeklyReflectionWizard.step4.open':
    clusters = groupBy(ctx.weekFrictions, f => f.tag)
    # pick the highest-count cluster; tie-break by most recent capturedAt
    chosen = argmax(clusters, c => [c.signals.length, maxBy(c.signals, s => s.capturedAt).capturedAt])
    if chosen.signals.length < 3:
      # insufficient-evidence state (UX_FLOWS §2.3 step-4 empty-evidence)
      return [REFLECTION_PROMPT_AUGMENT {
        kind: 'REFLECTION_PROMPT_AUGMENT', slot: 'WeeklyReflectionWizard.step4.preselect',
        preselect: null,
        insufficientEvidence: { count: chosen.signals.length, threshold: 3 },
        basisEntityRefs: ctx.weekFrictions.map(f=>f.id)
      }]
    # happy path: pre-select the cluster
    suggestion = REFLECTION_PROMPT_AUGMENT {
      kind: 'REFLECTION_PROMPT_AUGMENT', slot: 'WeeklyReflectionWizard.step4.preselect',
      preselect: { tag: chosen.tag, count: chosen.signals.length, frictionSignalIds: chosen.signals.map(s=>s.id) },
      basisEntityRefs: chosen.signals.map(s=>s.id)
    }
    # R4 — dismissed-cluster hint (UX_FLOWS §2.3 step 4 + ARCHITECTURE §9 item 9)
    dismissed = ctx.clusterDismissals[chosen.tag]
    if dismissed and weeksSince(dismissed.lastDismissedAt) <= 8:
      suggestion.dismissedHint = {
        text: "Similar cluster dismissed " + weeksSince(dismissed.lastDismissedAt) + " weeks ago — re-surfacing.",
        basis: { tag: chosen.tag, lastDismissedAt: dismissed.lastDismissedAt, dismissedCount: dismissed.dismissedCount }
      }
    return [suggestion]

  return []
```

**LLM sketch (Next).** The **AI weekly DMAIC draft** called out in blueprint §5.2 is an extension of this agent. It:

- Reads only the week's `Variance[]`, `FrictionSignal[]`, and captured `Reflection[]` — never invents.
- Pre-fills `dmaicDraft.define`, `dmaicDraft.measure`, `dmaicDraft.analyze` only. **Never** pre-fills `dmaicDraft.improve` or `control`. The user authors those (blueprint §2 evidence rule, §1.5 safety rule).
- Pre-fills each field as a **candidate** — the `WeeklyReflectionWizard` renders it as a "Use this draft" chip the user must accept before it writes to `Reflection.dmaicDraft`.
- Prompt:

```
SYSTEM: You draft Define/Measure/Analyze from a week's captured evidence. You do NOT invent frictions, variances, or counts. Every claim must be traceable to an input row. You output JSON with {define, measure, analyze} strings, each ≤ 280 chars, plus {basisEntityRefs}.
CONTEXT (entity excerpts only):
  - weekVariances: [{kind, reasonCode, catalogEntryId}]  (IDs only for reasons)
  - weekFrictions: [{tag, summary}]
  - weekReflections: [{planVsActualMinutes, frictionFlag}]  (no free text)
TASK: produce the three drafts. If evidence count < 3 per field, abstain (null).
```

**UI surface.** `REFLECTION_PROMPT_AUGMENT` is consumed by `WeeklyReflectionWizard` (`UX_FLOWS §3.7`) at step 1 (preread list), step 2 (variance count aid), step 3 (top-3 clustered tags read-only aid), step 4 (pre-selected cluster + dismissed hint). `MICROCOPY` renders on `/today` banner per `§5.8` / `§5.9`.

**KPI lift target.** Validated Kaizens / MAU / month (blueprint §7.5 target ≥1.0). Secondary: First Weekly Reflection by end of week 2 (§7.3 leading indicator).

**MVP / Next split.** MVP = **scripted** (R1–R4; all deterministic pre-reads and pre-selects). Next = LLM-drafted D/M/A per the prompt above, plus phrasing variety on the dismissed-cluster hint.

**Example outputs.** See §5.6 (Thu close-of-day advance hint), §5.7 (Fri step-1 pre-read), §5.8 (Fri step-4 pre-select + dismissed hint), §5.9 (insufficient evidence abstain).

**Failure / abstain conditions.**
- `weekFrictions.length === 0` at step 1: emit empty `preread: []` (not abstain — the wizard still needs to render the step).
- `max cluster count < 3` at step 4: emit `insufficientEvidence` per §R3 — wizard disables Promote per `UX_FLOWS §2.3 step-4 edge case`.
- Never pre-fill the reflection's free-text fields in MVP. Never in Next either for `whatWentWell` / `whatToImprove` / DMAIC `improve` / `control`.
- If `clusterDismissals[tag]` was last updated >8 weeks ago, treat as stale and do not render the dismissed hint. (Keeps the hint current.)

---

### 2.5 Composer Explainer Agent (fifth agent)

**Purpose.** Read-only. Turn `Composition.composerInputsSnapshot.explain[]` (the deterministic `why[]` audit trail from `ENGINE_DESIGN §1.2`) into user-facing "why this block?" microcopy on each `ScheduledActivityBlock` in the CycleCard. It is not a decision-maker — the composer already decided — it is a translator. It also answers the engine-surfaced INFEASIBLE case by rendering `InfeasibleResult.explain[]` + `suggestedActions` into scannable buttons per `ARCHITECTURE §4.7`. Behavior change aimed: raise composition acceptance rate by making the composer's reasoning transparent (Accepts rise when the user understands why the block was chosen).

**Trigger.**
- `CycleProposed { compositionId }` — compute explanations once per composition.
- `ComposerInfeasible { userId, date, result }` — render the guided-remediation actions as UI copy.

**Input model.**

```
AgentContext {
  composition: Composition (fields: id, composerInputsSnapshot.explain: [{ref, rule, detail}]),
  activities: ScheduledActivity[] (fields: id, catalogEntryId, bucket, sourceOfSchedule),
  catalog: CatalogEntry[] (for each referenced id; fields: id, name, bucket),
  infeasibleResult: InfeasibleResult | null
}
```

**Output model.** `AgentSuggestion[]`:
- `MICROCOPY` — per-block explanations, slotted to each `ScheduledActivityBlock[id]`.
- `MICROCOPY` — header sentence summarizing the `composerInputsSnapshot` (sprintPhase, activeKaizenId presence, varianceQueue count).
- `CONTEXT_CARD` — the INFEASIBLE state's explain lines + suggestedActions list.

**Decision logic** (MVP scripted — a literal translator; no heuristics).

```
fn composerExplainer(ctx) -> AgentSuggestion[]:
  out = []

  if ctx.infeasibleResult:
    out.push(CONTEXT_CARD {
      kind: 'CONTEXT_CARD', slot: 'CycleCard.infeasibility',
      title: "Can't compose a valid day at your current capacity.",
      explainLines: ctx.infeasibleResult.explain,
      actions: ctx.infeasibleResult.suggestedActions.map(translate),
      basisEntityRefs: [ctx.composition.id]
    })
    return out

  # Per-block translation
  for e in ctx.composition.composerInputsSnapshot.explain:
    activity = ctx.activities.find(a => a.id == e.ref || a.catalogEntryId == e.ref)
    if !activity: continue
    text = ruleToSentence(e.rule, e.detail, ctx)   # table §2.5.1 below
    out.push(MICROCOPY {
      kind: 'MICROCOPY', slot: 'ScheduledActivityBlock['+activity.id+'].whyChip',
      text: text, maxChars: 80,
      basisEntityRefs: [activity.id, ctx.composition.id]
    })

  # Header summary
  snap = ctx.composition.composerInputsSnapshot
  headerParts = []
  if snap.sprintPhase != 'EXECUTION_WK1' and snap.sprintPhase != 'EXECUTION_WK2':
    headerParts.push("Sprint phase: " + humanize(snap.sprintPhase))
  if snap.activeKaizenId:
    headerParts.push("Active Kaizen: " + kaizenTitle(snap.activeKaizenId))
  if snap.varianceCount > 0:
    headerParts.push(snap.varianceCount + " carry-over" + (snap.varianceCount==1 ? "" : "s") + " from yesterday")
  if headerParts.length > 0:
    out.push(MICROCOPY { kind:'MICROCOPY', slot:'CycleCard.header.subline', text: headerParts.join(" · "), basisEntityRefs:[ctx.composition.id] })

  return out
```

**§2.5.1 Rule → sentence translation table** (MVP, exhaustive for the `ENGINE_DESIGN §1` rules):

| `why.rule` | Sentence template | Example |
|---|---|---|
| `R1_NON_OPTIONAL` | "Placed as non-optional." | "Placed as non-optional." |
| `R2_VARIANCE_RESCUE` | "Carried over from " + detail | "Carried over from 2026-04-20." |
| `R3_KAIZEN_LINK` | detail == 'generic_deep' ? "Deep block; no active Kaizen." : "Deep block linked to Kaizen " + kaizenTitle | "Deep block linked to Kaizen K-087 (cycle-time reduction)." |
| `R4_PHASE_CEREMONY` | "Fixed by sprint phase: " + humanize(detail) | "Fixed by sprint phase: Planning Day." |
| `R_CI_ROTATION` | "CI rotation: " + detail | "CI rotation: PDCA tick, 48h since last tick." |
| `R_COMM_FILLER` | "Comm filler: " + detail | "Comm filler: Wednesday 1:1 window." |
| `WEEK_DAY_COMPOSED` | Not user-surfaced (internal weekly audit only) | — |

**LLM sketch (Next).** Optional polish — LLM rewrites the scripted templates into one- or two-sentence variants that match the user's prior reading level. Still bounded by `UX_FLOWS §4.6` rules (≤20 words, no exclamation, no "seamless"/"empower", etc.). Cached per rule+detail combo so the user doesn't see different phrasings for the same rule.

**UI surface.** Per-block `MICROCOPY` renders as a "why?" chevron on each `ScheduledActivityBlock` (new UI affordance — see architecture gap below). Header `MICROCOPY` renders in `CycleCard.header.subline`. INFEASIBLE `CONTEXT_CARD` renders in the CycleCard body in place of Accept/Edit/Reject per `UX_FLOWS §2.1 empty/error state`.

> **Architecture gap:** `UX_FLOWS §3.3` defines the five display states for `ScheduledActivityBlock` (PROPOSED / SCHEDULED / IN_PROGRESS / CLOSED / SKIPPED) but does not define a "why chip" affordance for the PROPOSED state. **Proposed resolution:** add a small, dismissible info chevron to the PROPOSED-state block that reveals the Composer Explainer microcopy. This is a UI-only addition, no new entity, no new state. Flag for `UX_FLOWS` next revision. Until added, the header subline MICROCOPY is sufficient for MVP.

**KPI lift target.** Composition acceptance rate Daily/Weekly (blueprint §7.2: ≥60% / ≥50% without edit). Same KPI as Planning Agent; they are complementary — Planning points at questionable slots, Composer Explainer explains why every slot is there. Measure: acceptance rate for users who hover/expand ≥1 why chip vs control.

**MVP / Next split.** MVP = **scripted** (literal translation table). Next = optional LLM polish on phrasing.

**Example outputs.** See §5.1 (Monday start-of-day block explanations) and §5.10 (INFEASIBLE guided remediation rendering).

**Failure / abstain conditions.**
- `composerInputsSnapshot.explain[]` is empty or missing: abstain. (Upstream engine bug — agent does not invent an explanation.)
- `composerInputsSnapshot.explain[]` contains a rule string not in the translation table: abstain for that block (log an `AgentTelemetryEvent` of kind `SCHEMA_MISMATCH` so we see it in telemetry and add the rule).

---

## 3. Input / Output Models (consolidated)

Shared typed-interface reference for all five agents. Lives in `/js/ai/types.js` in MVP; migrates to a TypeScript package in Next.

### 3.1 `AgentContext`

Every agent receives this shape. Fields populated are agent-specific; unused fields are `null`. Windows are explicit so the agent cannot "secretly" read beyond its scope.

```ts
type ISODate = string;
type UUID = string;

type AgentContext = {
  user: {
    id: UUID,
    role: Array<'PRACTITIONER' | 'FACILITATOR' | 'LEADER' | 'CHAMPION'>,
    dailyCapacityMinutes: number,
    workDays: number[],
    sprintAnchorDate: ISODate,
    deepSlicePreference: '2x2h' | '4x1h'
  },
  window: {
    kind: 'TODAY' | 'THIS_WEEK' | 'LAST_14_DAYS' | 'LAST_4_WEEKS',
    startAt: ISODate,
    endAt: ISODate
  },
  composition: Composition | null,              // when agent scope is a specific composition
  activities: ScheduledActivity[],              // may be subset, always scoped to window
  catalog: CatalogEntry[],                      // catalog entries actually referenced, not the whole library
  variances: Variance[],                        // append-only, scoped to window
  frictionSignals: FrictionSignal[],            // scoped to window
  reflections: Reflection[],                    // captured (pending=false), scoped to window
  clusterDismissals: Record<string, {           // from bamx:v1:clusterDismissals, for Reflection agent
    lastDismissedAt: ISODate,
    dismissedCount: number,
    lastReasonSummary: string
  }>,
  activeKaizen: Kaizen | null,
  recentKaizens: Kaizen[],                      // last 4 weeks closed; for Reflection agent
  pdcaExperiment: PdcaExperiment | null,        // active experiment, for Context agent
  infeasibleResult: InfeasibleResult | null,    // only set for Composer Explainer on ComposerInfeasible trigger
  trigger: {                                    // what caused this invocation
    event: string,                              // e.g., 'CycleProposed', 'ActivityStarted', 'scheduled'
    payload: Record<string, unknown>,
    at: ISODate
  }
};
```

**Rules on `AgentContext` construction.**
- Built by a single module `AgentContextBuilder` that reads from the `IRepository` — agents never read the repo directly.
- `window` is enforced — the builder refuses to populate fields outside the declared window.
- Entity fields listed in each agent's per-agent spec define what the builder populates; unused fields stay `null`.
- LLM calls in Next receive an **excerpt** of `AgentContext` (IDs + the specific fields the agent's prompt names). No raw free-text reflection content is sent to the LLM for Reflection agent's DMA-draft pass unless the user has opted in, per §1.5.

### 3.2 `AgentSuggestion` — discriminated union

```ts
type EntityRef = {
  entity: 'Composition' | 'ScheduledActivity' | 'Reflection' | 'FrictionSignal' | 'Variance' |
          'Kaizen' | 'BaselineMetric' | 'Remeasurement' | 'CatalogEntry' | 'PdcaExperiment',
  id: UUID,
  field?: string                               // optional: "Kaizen.actions[2].doneAt" for granular trace
};

type AgentSuggestion =
  | MicrocopySuggestion
  | RankedOptionSuggestion
  | HighlightSuggestion
  | ContextCardSuggestion
  | ReflectionPromptAugmentSuggestion;

type BaseSuggestion = {
  id: UUID,
  agentId: 'PLANNING' | 'MOMENTUM' | 'CONTEXT' | 'REFLECTION' | 'COMPOSER_EXPLAINER',
  proposedAt: ISODate,
  slot: string,                                // named UI slot, per agent spec
  basisEntityRefs: EntityRef[],                // evidence rule §1.2
  lifecycle: 'PROPOSED' | 'DISPLAYED' | 'ACTED_ON' | 'DISMISSED' | 'EXPIRED',
  expiresAt: ISODate | null,                   // when EXPIRED auto-applies; null = session-scoped
  dedupeKey: string,                           // idempotency §1.7
  confidence: number                           // 0..1; < 0.7 means abstain; always present for observability
};

type MicrocopySuggestion = BaseSuggestion & {
  kind: 'MICROCOPY',
  text: string,                                // ≤ 20 words per UX_FLOWS §4.6
  maxChars?: number                            // optional hard cap
};

type RankedOptionSuggestion = BaseSuggestion & {
  kind: 'RANKED_OPTION',
  replaceCatalogEntryId: UUID,                 // the block the composer filled
  suggestedCatalogEntryId: UUID,               // the alternative — same bucket, invariant-safe
  rationale: string,                           // ≤ 20 words
  action: 'OPEN_CATALOG_PICKER' | 'REPLACE_ON_SAVE'
};

type HighlightSuggestion = BaseSuggestion & {
  kind: 'HIGHLIGHT',
  targetComponent: 'ScheduledActivityBlock' | 'KaizenCard' | 'BucketStrip',
  targetId: UUID,
  emphasis: 'soft' | 'medium',                 // never 'strong' — non-blocking rule §1.5
  rationale: string
};

type ContextCardSuggestion = BaseSuggestion & {
  kind: 'CONTEXT_CARD',
  title: string,
  body?: string,
  links?: Array<{ label: string, preview?: string, priorActivityId?: UUID }>,
  actions?: Array<{
    label: string,
    intent: 'START_ACTIVITY' | 'SKIP_ACTIVITY' | 'OPEN_ROUTE' | 'RAISE_CAPACITY' | 'DISMISS',
    targetId?: UUID,
    serviceCall?: string                       // named service + method; never a repo call
  }>
};

type ReflectionPromptAugmentSuggestion = BaseSuggestion & {
  kind: 'REFLECTION_PROMPT_AUGMENT',
  preread?: Array<{ id: UUID, summary: string, tag: string, capturedAt: ISODate, reflectionId: UUID }>,
  preselect?: { tag: string, count: number, frictionSignalIds: UUID[] } | null,
  dismissedHint?: { text: string, basis: { tag: string, lastDismissedAt: ISODate, dismissedCount: number } },
  insufficientEvidence?: { count: number, threshold: number }
};
```

**JSON examples per kind** (abbreviated; full scenarios in §5):

```json
{"id":"as_001","agentId":"MOMENTUM","kind":"MICROCOPY","slot":"Today.banner",
 "text":"[PDCA Cycle] was scheduled at 10:15. Start it now or skip with a reason?",
 "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_pdca_apr22"}],
 "lifecycle":"PROPOSED","proposedAt":"2026-04-22T10:20:00-07:00","confidence":0.95,
 "expiresAt":"2026-04-22T11:00:00-07:00","dedupeKey":"MOMENTUM:late-start:sa_pdca_apr22"}
```

```json
{"id":"as_002","agentId":"PLANNING","kind":"RANKED_OPTION","slot":"ScheduledActivityBlock[sa_lnd_apr22]",
 "replaceCatalogEntryId":"ce_personal_lnd","suggestedCatalogEntryId":"ce_document_review",
 "rationale":"You have replaced this CI slot twice in the last 14 days.",
 "action":"OPEN_CATALOG_PICKER",
 "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_lnd_apr22"},{"entity":"Variance","id":"v_edit_apr15"},{"entity":"Variance","id":"v_edit_apr19"}],
 "lifecycle":"PROPOSED","proposedAt":"2026-04-22T07:01:00-07:00","confidence":0.78,
 "expiresAt":null,"dedupeKey":"PLANNING:ranked:sa_lnd_apr22"}
```

```json
{"id":"as_003","agentId":"CONTEXT","kind":"CONTEXT_CARD","slot":"ActivityRunner.rightRail",
 "title":"Cause & Effect Matrix (#34) uses:",
 "links":[
   {"label":"SIPOC (#21) output (Apr 15)","preview":"Process: Onboarding. Suppliers: HRIS, IT, Manager. Inputs: signed offer...","priorActivityId":"sa_sipoc_apr15"},
   {"label":"Detailed Process Maps (#32) output (Apr 17)","preview":"5 step map; key bottleneck at step 3 (access provisioning).","priorActivityId":"sa_procmap_apr17"}
 ],
 "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_cem_apr22"},{"entity":"ScheduledActivity","id":"sa_sipoc_apr15"},{"entity":"ScheduledActivity","id":"sa_procmap_apr17"}],
 "lifecycle":"PROPOSED","proposedAt":"2026-04-22T10:15:00-07:00","confidence":0.99,
 "expiresAt":null,"dedupeKey":"CONTEXT:dmaic-inputs:sa_cem_apr22"}
```

```json
{"id":"as_004","agentId":"REFLECTION","kind":"REFLECTION_PROMPT_AUGMENT","slot":"WeeklyReflectionWizard.step4.preselect",
 "preselect":{"tag":"MEETING_LOAD","count":5,"frictionSignalIds":["fs_mon1","fs_tue1","fs_tue2","fs_wed1","fs_thu1"]},
 "dismissedHint":{"text":"Similar cluster dismissed 3 weeks ago — re-surfacing.","basis":{"tag":"MEETING_LOAD","lastDismissedAt":"2026-04-03","dismissedCount":1}},
 "basisEntityRefs":[{"entity":"FrictionSignal","id":"fs_mon1"},{"entity":"FrictionSignal","id":"fs_tue1"},{"entity":"FrictionSignal","id":"fs_tue2"},{"entity":"FrictionSignal","id":"fs_wed1"},{"entity":"FrictionSignal","id":"fs_thu1"}],
 "lifecycle":"PROPOSED","proposedAt":"2026-04-24T14:02:00-07:00","confidence":0.92,
 "expiresAt":null,"dedupeKey":"REFLECTION:step4-preselect:comp_w_apr20"}
```

```json
{"id":"as_005","agentId":"COMPOSER_EXPLAINER","kind":"MICROCOPY","slot":"ScheduledActivityBlock[sa_deep1_apr20].whyChip",
 "text":"Deep block linked to Kaizen K-087 (Onboarding cycle time).",
 "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_deep1_apr20"},{"entity":"Composition","id":"comp_d_apr20"}],
 "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:00-07:00","confidence":1.0,
 "expiresAt":null,"dedupeKey":"EXPLAINER:why:sa_deep1_apr20"}
```

### 3.3 `AgentTelemetryEvent`

```ts
type AgentTelemetryEvent = {
  id: UUID,
  userId: UUID,
  agentId: AgentSuggestion['agentId'],
  suggestionId: UUID,
  phase: 'PROPOSED' | 'DISPLAYED' | 'ACTED_ON' | 'DISMISSED' | 'EXPIRED' | 'SCHEMA_MISMATCH',
  at: ISODate,
  context: {                                   // compact, for funnel analysis
    trigger: string,
    slot: string,
    basisEntityCount: number,
    confidence: number
  },
  userAction?: {                               // only on ACTED_ON
    kind: 'ACCEPT' | 'EDIT' | 'REPLACE' | 'START' | 'SKIP' | 'PROMOTE' | 'DISMISS',
    resultingEntityId?: UUID
  }
};
```

Stored in MVP under `bamx:v1:agent-telemetry` (ring buffer, capped 5,000 rows). In Next, persisted per-row to `agent_telemetry_events` table for KPI-lift measurement. `MetricsService` subscribes to compute per-agent lift vs control.

> **Architecture gap:** `ARCHITECTURE.md §7.1` does not reserve an `bamx:v1:agent-*` key family. **Proposed resolution:** add `bamx:v1:agent-suggestions` (capped 500 rows; last 14 days) and `bamx:v1:agent-telemetry` (capped 5,000 rows) to the persistence layout. No schema change; new keys. Flag for `ARCHITECTURE.md` §7.1 follow-up edit.

---

## 4. Decision Logic (cross-agent)

### 4.1 Shared event bus subscription

All five agents subscribe to the same `EventBus` (`ARCHITECTURE §6.3`). They are added as **new subscribers** to events already defined in `§6.1` — no new event types are introduced by the AI layer. Dispatch is synchronous in MVP. Agents must handle their event within 50ms for scripted logic (no blocking work); LLM calls in Next are asynchronous and emit their output via a follow-up `AgentSuggestionProposed` internal event.

**Event → agent subscription table:**

| Event | Planning | Momentum | Context | Reflection | Composer Explainer |
|---|---|---|---|---|---|
| `CycleProposed` | ✓ | | | | ✓ |
| `CycleAccepted` | | | | ✓ (reset cluster counters if cross-week) | |
| `CycleEdited` | ✓ (rolling count) | | | | |
| `CompositionStarted` | | ✓ (arm late-start scan) | | | |
| `ActivityStarted` | | ✓ | ✓ | | |
| `ActivityStartedLate` | | ✓ | | | |
| `ActivityCompleted` | | | | ✓ (reflection-pending counter) | |
| `ReflectionCaptured` | | | | ✓ (pending→captured; update on-time count) | |
| `FrictionSignalCaptured` | | ✓ (tag cluster ≥3) | | ✓ (cluster queue) | |
| `VarianceLogged` | ✓ (edit-frequency signal) | ✓ (reason-code cluster) | | ✓ (weekly variance aid) | |
| `WeeklyReflectionCompleted` | | | | ✓ (reset counters; write clusterDismissals if dismissed) | |
| `KaizenPromoted` | ✓ (Deep-link check) | | ✓ (prime DMAIC context) | | |
| `KaizenRemeasured` | | | | | |
| `KaizenClosed` | | | | ✓ (portfolio history) | |
| `PdcaTickCommitted` | | | ✓ (experiment progress aid) | | |
| `ComposerInfeasible` | | | | | ✓ |

### 4.2 Ranking when multiple agents fire simultaneously

Screen real estate on `/today` is limited. If two agents produce a suggestion for the same `slot` or a conflicting slot, the ranking is:

1. **Invariant-first.** If the engine itself has surfaced a violation or blocker (e.g., `OVER_CAPACITY`, `NON_OPTIONAL_MISSING`, `KaizenService.close` refused), NO agent renders above that message. The user sees the engine's message alone. Agents render below or not at all.
2. **Confidence threshold.** Suggestions with `confidence < 0.7` are suppressed (abstain-first, §4.3 below).
3. **Slot-exclusive ordering** when two agents compete for the same slot:

```
Today.banner priority:
  1. MOMENTUM.CONTEXT_CARD (Deep displacement) — real-time trade-off in progress
  2. MOMENTUM.MICROCOPY (late-start nudge)      — actionable, timeboxed
  3. REFLECTION.MICROCOPY (Thu advance hint)    — informational
  4. MOMENTUM.MICROCOPY (cluster-forming banner) — informational

CycleCard.header.subline priority:
  1. COMPOSER_EXPLAINER.MICROCOPY (context)     — always rendered if present
  2. PLANNING.MICROCOPY (review 2 slots)        — rendered if available space

ScheduledActivityBlock[id].whyChip priority:
  1. COMPOSER_EXPLAINER.MICROCOPY (why this block?)

ScheduledActivityBlock[id].reviewChevron priority:
  1. PLANNING.RANKED_OPTION
  2. PLANNING.HIGHLIGHT

ActivityRunner.rightRail priority:
  1. CONTEXT.CONTEXT_CARD (DMAIC inputs)

WeeklyReflectionWizard.step* priority:
  1. REFLECTION.REFLECTION_PROMPT_AUGMENT (exclusive owner of these slots)
```

4. **First-come among ties** after (1)–(3): earlier `proposedAt` wins.

### 4.3 Abstain-first principle

Agents prefer no output over a low-confidence one. Each rule in each agent's decision logic must include an explicit abstain path. `confidence < 0.7` is the default suppression threshold for LLM-generated suggestions in Next; for scripted MVP rules, confidence is `1.0` on positive-match rules and the abstain path is explicit (e.g., Planning's "fewer than 3 prior compositions" check).

### 4.4 Suggestion lifecycle

```
  PROPOSED ──► DISPLAYED ──┬─► ACTED_ON      (user clicked the suggestion's action)
                           ├─► DISMISSED     (user dismissed explicitly)
                           └─► EXPIRED       (expiresAt reached without user action)

  An agent may emit REVISED (new proposedAt, same dedupeKey) at any time
  before ACTED_ON / DISMISSED / EXPIRED; this replaces the existing suggestion
  in-place rather than adding a second row.
```

Every transition emits an `AgentTelemetryEvent` (§3.3). `EXPIRED` specifically for `CONTEXT_CARD` and `MICROCOPY` triggered by a time-bounded condition (e.g., the late-start nudge expires when the activity moves to `IN_PROGRESS` or `SKIPPED`). The lifecycle feeds the KPI lift measurement.

### 4.5 Cache / idempotency rules

- **De-dup key.** Every suggestion carries `dedupeKey = agentId + ':' + ruleId + ':' + basisEntityRefs.map(r=>r.id).join(',')`. Two events firing with the same dedupeKey within 24h update the existing suggestion's `proposedAt` rather than creating a new row.
- **Session cache.** `AgentContextBuilder` caches per (userId, window) for 60 seconds to avoid repo thrashing on rapid-fire events (e.g., ten `ActivityCompleted` events in a minute).
- **LLM cache (Next).** LLM calls are cached per (agentId, promptHash) for 24h. Re-generation happens when a cited entity's updatedAt changes.
- **Replay safety.** Re-emitting the full event log (e.g., for MetricsService recompute) must NOT multiply suggestions. The dedupeKey protects this.

### 4.6 Service boundary

Agents never call `IRepository` directly. They read from `AgentContextBuilder`. They propose suggestions to the UI layer via a dedicated `AgentDispatcher` module that owns the slot-ranking in §4.2. The UI's action handlers (e.g., "Start Deep now" button on a CONTEXT_CARD) call the named service (`ActivityService.start`), which enforces guards and emits the correct `ActivityStarted` event. The loop closes without an agent ever being a writer.

---

## 5. Example Outputs

Ten worked scenarios. Each shows the input row shape, the agent output as JSON, and the rendered microcopy / UI placement. All entity IDs in these examples are illustrative; all field names are taken verbatim from `ARCHITECTURE.md` §2.

### 5.1 Monday start-of-day — Composer Explainer (NOT Planning) explains today's composition

**Boundary illustration.** On a clean Monday Accept, the Planning agent has no repeated-edit basis yet; it abstains. The Composer Explainer renders every block's why chip from the deterministic `composerInputsSnapshot.explain[]`.

**Inputs (abbreviated).**
```json
{
  "composition": {
    "id": "comp_d_apr20", "cycleType": "DAILY", "state": "PROPOSED",
    "composerInputsSnapshot": {
      "role": ["PRACTITIONER"], "capacityMinutes": 480, "externalMinutesToday": 0,
      "sprintPhase": "PLANNING_DAY", "activeKaizenId": "k_087", "varianceCount": 0,
      "explain": [
        {"ref":"ce_daily_standup","rule":"R1_NON_OPTIONAL","detail":"Daily Standup"},
        {"ref":"ce_am_comm","rule":"R1_NON_OPTIONAL","detail":"AM High-value Communication"},
        {"ref":"ce_sprint_planning","rule":"R4_PHASE_CEREMONY","detail":"PLANNING_DAY"},
        {"ref":"ce_sipoc_21","rule":"R3_KAIZEN_LINK","detail":"k_087"},
        {"ref":"ce_post_lunch_comm","rule":"R1_NON_OPTIONAL","detail":"Post-lunch High-value Communication"},
        {"ref":"ce_pdca_12","rule":"R_CI_ROTATION","detail":"PDCA tick, 48h since last tick"},
        {"ref":"ce_eoa_reflection","rule":"R1_NON_OPTIONAL","detail":"End-of-Activity Reflection"}
      ]
    }
  },
  "activeKaizen": { "id": "k_087", "title": "Onboarding cycle time", "state": "ACTIVE" }
}
```

**Composer Explainer outputs:**
```json
[
  {"id":"as_e1","agentId":"COMPOSER_EXPLAINER","kind":"MICROCOPY",
   "slot":"CycleCard.header.subline",
   "text":"Sprint phase: Planning Day · Active Kaizen: Onboarding cycle time",
   "basisEntityRefs":[{"entity":"Composition","id":"comp_d_apr20"}],
   "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:00-07:00","confidence":1.0,"dedupeKey":"EXPLAINER:header:comp_d_apr20"},
  {"id":"as_e2","agentId":"COMPOSER_EXPLAINER","kind":"MICROCOPY",
   "slot":"ScheduledActivityBlock[sa_sipoc_apr20].whyChip",
   "text":"Deep block linked to Kaizen K-087 (Onboarding cycle time).",
   "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_sipoc_apr20"}],
   "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:00-07:00","confidence":1.0,"dedupeKey":"EXPLAINER:why:sa_sipoc_apr20"},
  {"id":"as_e3","agentId":"COMPOSER_EXPLAINER","kind":"MICROCOPY",
   "slot":"ScheduledActivityBlock[sa_planning_apr20].whyChip",
   "text":"Fixed by sprint phase: Planning Day.",
   "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_planning_apr20"}],
   "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:00-07:00","confidence":1.0,"dedupeKey":"EXPLAINER:why:sa_planning_apr20"},
  {"id":"as_e4","agentId":"COMPOSER_EXPLAINER","kind":"MICROCOPY",
   "slot":"ScheduledActivityBlock[sa_pdca_apr20].whyChip",
   "text":"CI rotation: PDCA tick, 48h since last tick.",
   "basisEntityRefs":[{"entity":"ScheduledActivity","id":"sa_pdca_apr20"}],
   "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:00-07:00","confidence":1.0,"dedupeKey":"EXPLAINER:why:sa_pdca_apr20"}
]
```

**Planning agent** on this same trigger: abstains (no repeated-edit history, no empty-Kaizen-link anomaly; active Kaizen IS linked to the Deep block).

### 5.2 Third day of edits — Planning agent fires §5.2 microcopy

**Inputs.** User has 3 `Composition.state=EDITED` rows within last 7 days. Today's proposal: standard.

**Planning agent output:**
```json
{
  "id":"as_p1","agentId":"PLANNING","kind":"MICROCOPY",
  "slot":"CycleCard.header",
  "text":"You have edited 3 days running. Adjusting capacity or enabled Catalog entries in Settings may fit you better.",
  "basisEntityRefs":[
    {"entity":"Composition","id":"comp_d_apr18"},
    {"entity":"Composition","id":"comp_d_apr19"},
    {"entity":"Composition","id":"comp_d_apr20"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-20T07:00:30-07:00","confidence":1.0,"dedupeKey":"PLANNING:repeated-edit:user_1"
}
```

Rendered verbatim per `UX_FLOWS §5.2`. Not emoji, not exclamation, ≤20 words.

### 5.3 Wed 10:15 — user opens Teams before their Deep block; Momentum fires CONTEXT_CARD

**Inputs.**
- `comp_d_apr22` ACTIVE, sprintPhase=EXECUTION_WK1.
- `sa_deep1_apr22`: bucket=PROJECT, state=SCHEDULED, plannedStartAt=10:15, linkedKaizenId=k_087, intention="Draft SIPOC for onboarding".
- Event fires at 10:17: `ActivityStarted { scheduledActivityId: sa_teams_slot }` where `sa_teams_slot.bucket=COMMUNICATION`.

**Momentum agent output:**
```json
{
  "id":"as_m1","agentId":"MOMENTUM","kind":"CONTEXT_CARD",
  "slot":"Today.banner",
  "title":"Deep block [Draft SIPOC for onboarding] was scheduled at 10:15.",
  "body":"Part of: Onboarding cycle time",
  "actions":[
    {"label":"Start Deep now","intent":"START_ACTIVITY","targetId":"sa_deep1_apr22","serviceCall":"ActivityService.start"},
    {"label":"Skip Deep with reason","intent":"SKIP_ACTIVITY","targetId":"sa_deep1_apr22","serviceCall":"ActivityService.skip"}
  ],
  "basisEntityRefs":[
    {"entity":"ScheduledActivity","id":"sa_teams_slot"},
    {"entity":"ScheduledActivity","id":"sa_deep1_apr22"},
    {"entity":"Kaizen","id":"k_087"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-22T10:17:05-07:00","confidence":0.98,
  "expiresAt":"2026-04-22T11:15:00-07:00","dedupeKey":"MOMENTUM:displacement:sa_deep1_apr22"
}
```

Rendered verbatim per `UX_FLOWS §6.4 #3`. The "Skip Deep with reason" button opens the reason-code picker (flow 2.5). Momentum never calls skip directly.

### 5.4 Second escalation this week — Momentum MICROCOPY §5.3

**Inputs.** Today 14:00, user skipped a non-optional with `reasonCode=ESCALATION`. Same week has one prior `reasonCode=ESCALATION` variance.

**Event:** `VarianceLogged { varianceId: v_044, reasonCode: 'ESCALATION', catalogEntryId: 'ce_daily_standup', scheduledActivityId: 'sa_standup_apr22' }`.

**Momentum output:**
```json
{
  "id":"as_m2","agentId":"MOMENTUM","kind":"MICROCOPY",
  "slot":"ScheduledActivityBlock[sa_standup_apr22].inline",
  "text":"Second escalation this week. Escalations show up in Friday's reflection as a friction cluster.",
  "basisEntityRefs":[
    {"entity":"Variance","id":"v_031"},
    {"entity":"Variance","id":"v_044"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-22T14:05:00-07:00","confidence":1.0,"dedupeKey":"MOMENTUM:escalation-cluster:week_apr20"
}
```

### 5.5 Mid-afternoon — Context agent surfaces DMAIC step artifacts for C&E Matrix

**Inputs.**
- `sa_cem_apr22` IN_PROGRESS, linkedDmaicStepRef={kaizenId:k_087, catalogEntryId:ce_cem_34}.
- `ce_cem_34.dependsOn` = [`ce_sipoc_21`, `ce_procmap_32`].
- Prior CLOSED activities in same Kaizen: `sa_sipoc_apr15` (ce_sipoc_21, outputArtifactRef.schema=TEXT) and `sa_procmap_apr17` (ce_procmap_32, outputArtifactRef.schema=DOCUMENT).

**Context output:**
```json
{
  "id":"as_c1","agentId":"CONTEXT","kind":"CONTEXT_CARD",
  "slot":"ActivityRunner.rightRail",
  "title":"Cause & Effect Matrix (#34) uses:",
  "links":[
    {"label":"SIPOC (#21) output (Apr 15)","preview":"Process: Onboarding. Suppliers: HRIS, IT, Manager. Inputs: signed offer...","priorActivityId":"sa_sipoc_apr15"},
    {"label":"Detailed Process Maps (#32) output (Apr 17)","preview":"5 step map; key bottleneck at step 3 (access provisioning).","priorActivityId":"sa_procmap_apr17"}
  ],
  "basisEntityRefs":[
    {"entity":"ScheduledActivity","id":"sa_cem_apr22"},
    {"entity":"ScheduledActivity","id":"sa_sipoc_apr15","field":"outputArtifactRef"},
    {"entity":"ScheduledActivity","id":"sa_procmap_apr17","field":"outputArtifactRef"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-22T13:35:00-07:00","confidence":0.99,
  "dedupeKey":"CONTEXT:dmaic-inputs:sa_cem_apr22"
}
```

Rendered in the right-rail of the activity runner view. Previews are truncated verbatim from user-authored `outputArtifactRef.value` — no AI summarization in MVP.

### 5.6 Thu close-of-day — Reflection agent Thu advance hint (3 escalation variances this week)

**Inputs.** Thursday 16:00 local. Week so far has 3 `Variance.reasonCode='ESCALATION'` rows.

**Reflection output:**
```json
{
  "id":"as_r1","agentId":"REFLECTION","kind":"MICROCOPY",
  "slot":"Today.banner",
  "text":"3 escalation variances this week. Friday's reflection will cluster these.",
  "basisEntityRefs":[
    {"entity":"Variance","id":"v_031"},
    {"entity":"Variance","id":"v_044"},
    {"entity":"Variance","id":"v_052"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-23T16:00:00-07:00","confidence":1.0,
  "expiresAt":"2026-04-24T17:00:00-07:00","dedupeKey":"REFLECTION:thu-advance-hint:week_apr20"
}
```

### 5.7 Fri step 1 — Reflection agent surfaces the week's 5 Friction Signals as pre-read

**Inputs.** User opens `/week/reflect` Fri 14:00. Week has 6 FrictionSignals; top 5 by `capturedAt` descending.

**Reflection output:**
```json
{
  "id":"as_r2","agentId":"REFLECTION","kind":"REFLECTION_PROMPT_AUGMENT",
  "slot":"WeeklyReflectionWizard.step1.prereadList",
  "preread":[
    {"id":"fs_thu1","summary":"Skipped standup for escalation","tag":"MEETING_LOAD","capturedAt":"2026-04-23T14:10:00-07:00","reflectionId":"r_thu1"},
    {"id":"fs_wed1","summary":"Teams interrupted Deep block twice","tag":"CONTEXT_SWITCH","capturedAt":"2026-04-22T10:18:00-07:00","reflectionId":"r_wed1"},
    {"id":"fs_tue2","summary":"Meeting ran 15m over","tag":"MEETING_LOAD","capturedAt":"2026-04-21T11:15:00-07:00","reflectionId":"r_tue2"},
    {"id":"fs_tue1","summary":"Escalation from account team","tag":"MEETING_LOAD","capturedAt":"2026-04-21T09:45:00-07:00","reflectionId":"r_tue1"},
    {"id":"fs_mon1","summary":"Waiting on IT access","tag":"BLOCKED_DEP","capturedAt":"2026-04-20T15:30:00-07:00","reflectionId":"r_mon1"}
  ],
  "basisEntityRefs":[
    {"entity":"FrictionSignal","id":"fs_thu1"},
    {"entity":"FrictionSignal","id":"fs_wed1"},
    {"entity":"FrictionSignal","id":"fs_tue2"},
    {"entity":"FrictionSignal","id":"fs_tue1"},
    {"entity":"FrictionSignal","id":"fs_mon1"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-24T14:00:00-07:00","confidence":1.0,"dedupeKey":"REFLECTION:step1-preread:comp_w_apr20"
}
```

Rendered verbatim per `UX_FLOWS §2.3 step 1` ("a read-only list of the top 5 FrictionSignal rows from this week grouped by tag").

### 5.8 Fri step 4 — Reflection pre-selects cluster + dismissed-cluster hint

**Inputs.**
- Top cluster for this week: `MEETING_LOAD` with 5 signals (fs_mon1, fs_tue1, fs_tue2, fs_wed1, fs_thu1).
- `bamx:v1:clusterDismissals["MEETING_LOAD"]` = `{ lastDismissedAt: "2026-04-03", dismissedCount: 1, lastReasonSummary: "decided not enough signal" }`.
- `weeksSince(2026-04-03, 2026-04-24) = 3`.

**Reflection output:**
```json
{
  "id":"as_r3","agentId":"REFLECTION","kind":"REFLECTION_PROMPT_AUGMENT",
  "slot":"WeeklyReflectionWizard.step4.preselect",
  "preselect":{"tag":"MEETING_LOAD","count":5,"frictionSignalIds":["fs_mon1","fs_tue1","fs_tue2","fs_wed1","fs_thu1"]},
  "dismissedHint":{
    "text":"Similar cluster dismissed 3 weeks ago — re-surfacing.",
    "basis":{"tag":"MEETING_LOAD","lastDismissedAt":"2026-04-03","dismissedCount":1}
  },
  "basisEntityRefs":[
    {"entity":"FrictionSignal","id":"fs_mon1"},
    {"entity":"FrictionSignal","id":"fs_tue1"},
    {"entity":"FrictionSignal","id":"fs_tue2"},
    {"entity":"FrictionSignal","id":"fs_wed1"},
    {"entity":"FrictionSignal","id":"fs_thu1"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-24T14:05:00-07:00","confidence":0.92,"dedupeKey":"REFLECTION:step4-preselect:comp_w_apr20"
}
```

Rendered: pre-select chip is visible (user still clicks Promote or Dismiss per `UX_FLOWS §2.3 step 4`); hint line appears above the two choices verbatim per `ARCHITECTURE §9 item 9`.

### 5.9 Failure / abstain — not enough evidence for Reflection agent to promote

**Inputs.** Week has 2 `FrictionSignal` rows; top cluster count = 1 (both different tags).

**Reflection output:**
```json
{
  "id":"as_r4","agentId":"REFLECTION","kind":"REFLECTION_PROMPT_AUGMENT",
  "slot":"WeeklyReflectionWizard.step4.preselect",
  "preselect":null,
  "insufficientEvidence":{"count":1,"threshold":3},
  "basisEntityRefs":[
    {"entity":"FrictionSignal","id":"fs_a"},
    {"entity":"FrictionSignal","id":"fs_b"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-24T14:05:00-07:00","confidence":1.0,"dedupeKey":"REFLECTION:step4-insufficient:comp_w_apr20"
}
```

Wizard renders the insufficient-evidence state per `UX_FLOWS §2.3 step-4 edge case` ("Not enough evidence this week to promote. Capture more friction signals next week."). Promote button disabled. Finish still available. No Kaizen promoted.

### 5.10 Boundary — user tries to close a Kaizen without remeasurement

**Inputs.** User navigates to `/kaizen/:id/close`. `Kaizen.remeasurementId === null`. User clicks Close.

**Engine behavior (deterministic — NOT the AI layer):** `KaizenService.close()` refuses per `ARCHITECTURE §3.3` HARD RULE. The KaizenCard renders the close button disabled and the message verbatim from `UX_FLOWS §5.6` + `§4.3`: "Can't close without a remeasured number. Capture remeasurement first."

**AI agent behavior:** Composer Explainer and Planning agents DO NOT render anything at this moment. Momentum agent may render a `CONTEXT_CARD` coaching on the next step (below), but it MUST NOT:
- Call `KaizenService.close` with any override.
- Suggest a baseline-metric shortcut that bypasses `BaselineMetric.locked` or a Remeasurement shortcut that bypasses `metricDefinitionId` equality.

**Momentum output (coaching only, never overrides):**
```json
{
  "id":"as_m3","agentId":"MOMENTUM","kind":"CONTEXT_CARD",
  "slot":"KaizenCard.coachBlock",
  "title":"Capture the same metric you baselined.",
  "body":"Your baseline was: [metric name] = [baseline value]. Open remeasurement to capture the current number.",
  "actions":[
    {"label":"Go to remeasurement","intent":"OPEN_ROUTE","serviceCall":"router.navigate('/kaizen/' + kaizenId + '/remeasure')"}
  ],
  "basisEntityRefs":[
    {"entity":"Kaizen","id":"k_087"},
    {"entity":"BaselineMetric","id":"bm_087"}
  ],
  "lifecycle":"PROPOSED","proposedAt":"2026-05-10T11:22:00-07:00","confidence":1.0,"dedupeKey":"MOMENTUM:kaizen-coach:k_087"
}
```

The engine's refusal message is what the user sees first; the Momentum coaching renders below it, not above. Consistent with the ranking rule §4.2 (1): invariant-first.

### 5.11 INFEASIBLE day — Composer Explainer renders guided remediation (bonus)

**Inputs.** `ComposerInfeasible` event fires with the `InfeasibleResult` from `ENGINE_DESIGN §1.8`:

```json
{
  "kind":"INFEASIBLE",
  "totalRequiredMinutes":495,
  "capacityMinutes":420,
  "shortfallMinutes":75,
  "bucketShortfalls":{"PROJECT":0,"COMMUNICATION":75,"CI":0},
  "suggestedActions":[
    {"kind":"RAISE_CAPACITY","currentMinutes":480,"suggestedMinutes":540},
    {"kind":"REDUCE_EXTERNAL","currentExternalMinutes":60,"suggestedExternalMinutes":0},
    {"kind":"SKIP_CEREMONY_WITH_REASON","catalogEntryId":"ce_mid_sprint_review","ceremonyName":"Mid-Sprint Review","defaultReasonCode":"MEETING_CONFLICT"}
  ],
  "explain":[
    "Required 495 min = non-optionals (360) + phase ceremonies (135).",
    "Capacity 420 min = 480 dailyCap − 60 externalMinutesToday.",
    "Shortfall 75 min in COMMUNICATION bucket."
  ]
}
```

**Composer Explainer output:**
```json
{
  "id":"as_e5","agentId":"COMPOSER_EXPLAINER","kind":"CONTEXT_CARD",
  "slot":"CycleCard.infeasibility",
  "title":"Can't compose a valid day at your current capacity.",
  "body":"Required 495 min = non-optionals (360) + phase ceremonies (135). Capacity 420 min = 480 dailyCap − 60 externalMinutesToday. Shortfall 75 min in COMMUNICATION bucket.",
  "actions":[
    {"label":"Raise capacity to 540 min","intent":"RAISE_CAPACITY","serviceCall":"UserService.setDailyCapacity(540,{oneDay:true}) + ComposerService.composeDaily()"},
    {"label":"Reduce external to 0 min","intent":"OPEN_ROUTE","serviceCall":"CompositionService.setExternalMinutesToday(0) + ComposerService.composeDaily()"},
    {"label":"Skip Mid-Sprint Review (Meeting conflict)","intent":"SKIP_ACTIVITY","targetId":"ce_mid_sprint_review","serviceCall":"VarianceService.log(SKIPPED_NON_OPTIONAL, MEETING_CONFLICT) + ComposerService.composeDaily()"}
  ],
  "basisEntityRefs":[{"entity":"Composition","id":"comp_d_proposed_apr23"}],
  "lifecycle":"PROPOSED","proposedAt":"2026-04-23T07:00:00-07:00","confidence":1.0,"dedupeKey":"EXPLAINER:infeasible:2026-04-23"
}
```

Rendered in the CycleCard infeasibility state per `UX_FLOWS §2.1 empty/error state`. Every action button invokes named services; the agent itself writes nothing.

---

## Open Items Back to Coordinator

The following need a decision or a follow-up edit to upstream docs before the AI layer enters a Next-phase epic. Captured here as architecture gaps or open design questions (see each `> **Architecture gap:** …` block in §2–§3 for detail).

1. **Persistence keys.** Add `bamx:v1:agent-suggestions` and `bamx:v1:agent-telemetry` to `ARCHITECTURE.md §7.1`.
2. **Why-chip affordance.** Add a small info chevron to `ScheduledActivityBlock` in `PROPOSED` state to `UX_FLOWS §3.3`.
3. **Artifact preview component.** Add a read-only `ArtifactPreview` sub-component to `UX_FLOWS §3` so the Context agent's `CONTEXT_CARD.links[].preview` has a typed viewer.
4. **KPI-lift measurement plumbing.** `MetricsService` subscribes to `AgentTelemetryEvent` to compute per-agent lift vs. control — define the A/B slicing key before the Next-phase build starts (user-level holdout is the simplest; blueprint §7.4 launch metric should be the primary KPI).
5. **LLM vendor, caching, and opt-in policy** for Next: vendor choice, prompt-cache TTL, and the user opt-in surface for the DMA-draft LLM call. These are product-policy questions, not architecture.
