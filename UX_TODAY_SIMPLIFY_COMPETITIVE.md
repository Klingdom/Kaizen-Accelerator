# UX Today Simplify — Competitive Analysis
_Authored by competitive-researcher; persisted by coordinator (read-only Tier 1 agent)._

**Research date: 2026-05-03**

---

## 1. Per-Product Summary Table

| Tool | Minimalism (1–5) | Default-Day Support | Empty/No-Project State | Sacred-Time Pattern |
|------|-----------------|---------------------|------------------------|---------------------|
| **Motion** | 3 | Partial — auto-schedules tasks into slots; no curated "4h+2h" template; user must add tasks first | Guided 3-question setup; forces first project creation during onboarding; no inbox before project exists | No — auto-reschedules around meetings; no protected category |
| **Sunsama** | 4 | Partial — "core four" day shape documented in blog (4h deep + 1h shallow) but not auto-applied; manual ritual each morning | Guided 5-step ritual forced before workspace access; creates "Setup Sunsama" task automatically; calendar required | Yes — shutdown ritual enforces a hard end-of-day; overwork is surfaced as warning |
| **Akiflow** | 4 | Partial — blog templates for time-block patterns; "Block Periods" for focus; no auto-applied default shape | No explicit empty-state blocker; Inbox exists immediately; tasks can be created without project via Command Bar | No — flexible; no protected category by default |
| **Linear** | 2 | No — no time-of-day scheduling; cycle/project required as structural container | Pre-populates workspace with demo data to model ideal state; team creation prompted first; no "solo task without project" | No |
| **Things 3** | 5 | No — zero default day shape; entirely manual | No onboarding friction; Today view appears immediately; tasks added to Inbox with no project required | No — but Today is intentionally sparse to reduce anxiety |
| **Reclaim.ai** | 3 | Yes — strongest default-day framing: sets Focus Time goal (5–15h/wk), habit templates (130+), auto-schedules to fill week | Connects calendar first; habit templates shown on signup; auto-lock enables sacred blocking | Yes (strongest) — auto-lock marks blocks as "busy" to external booking; habits auto-reschedule but can be locked hard |
| **Tana** | 3 | Partial — daily node auto-created each day; user builds own template structure via supertags | Short automated walkthrough; daily page is blank; project structure is optional and user-defined | No |
| **Notion Daily** | 2 | Partial — template gallery available; no auto-applied day shape | Empty workspace with template gallery prompt; user picks a template or starts blank | No |
| **Cal.com/Calendly** | 3 | Partial — Cal.com supports "Managed Event Types" with blocked focus time; Calendly blocks availability windows | No task onboarding; booking availability setup only; no project concept | Partial — availability rules prevent booking over marked slots; not AI-managed |
| **Clockwise** | 4 | Yes (now defunct, shut down 2026-03-27) — auto-scheduled 2h+ focus blocks; morning/afternoon preference; weekly goal (5–15h) | Calendar-first; focus goal set during setup; no task/project concept | Yes — focus blocks shown as busy; lower-priority scheduling links blocked from booking into focus time |

**Minimalism scale:** 1 = complex, many panels; 5 = near-empty, single-focus surface.

---

## 2. Pattern 1: Radical Simplicity in Today Views

**Things 3 (5/5)** — the gold standard. Single vertically scrolling list. Approximately 4 components. UI deliberately refuses to explain itself.

**Sunsama (4/5)** — front-loads the ritual at planning time, then the persistent surface is clean. ~6 components.

**Akiflow (4/5)** — splits triage from Today. Today is filtered rail of items already planned. ~5 persistent components.

### Top 3 patterns BAM-X should consider

**P1-A (Things 3): Ruthless vertical list.** All rationale lives behind tap-to-expand — never always-on. Risk: BAM-X's evidence-linkage differentiator disappears from default surface.

**P1-B (Sunsama): Front-load the ritual, then clear the surface.** WhyThisPlan + MorningRecap as ritual STEPS, not always-on widgets.

**P1-C (Akiflow): Split triage from Today.** Inbox is separate; Today shows only what's been committed.

---

## 3. Pattern 2: Default "Perfect Day" Templates

**Reclaim.ai** — strongest auto-generation. Sets Focus Time goal on signup; presents 130+ habit templates; auto-schedules without task data. Builds a week, not a curated daily ratio.

**Clockwise (defunct)** — anchor-first design: reserve shape of the day before filling content. Acquired by Salesforce, shut down March 2026.

**Sunsama** — partial. Documents "core four" (4h deep + 1h shallow) prescriptively but doesn't auto-apply.

**Motion** — fills gaps but doesn't frame them. No "4h focus + 2h comm" concept.

### Conclusion
**No live competitor auto-populates a curated day shape with intentional ratios (deep work vs. communication) AND populates it before the user has added any tasks.** BAM-X's "perfect default day" (4h project + 2h comm + CI block) is genuine whitespace if executed with anchor-first model.

---

## 4. Pattern 3: Sacred / Protected Time Blocks

**Reclaim.ai** (most mature) — auto-lock at 4am daily. Tiered booking (only "Critical" overrides Focus Time). No CI / improvement category.

**Sunsama** — shutdown as sacred temporal boundary. No protected CI block.

**Clockwise (defunct)** — structural sacredness via tiered booking system.

**Cal.com / Calendly** — hard blocks via availability rules. Not adaptive.

**Things 3, Linear, Notion, Tana, Akiflow, Motion** — zero sacred-time concept.

### Summary
**No competitor treats "improvement / CI / reflection time" as a distinct protected category with design intent.** This is genuinely differentiated territory for BAM-X.

---

## 5. Pattern 4: No-Projects Onboarding

**Linear** — pre-populates workspace with demo data. Shows the destination first.
**Motion** — project creation REQUIRED during onboarding. Most gate-heavy. Users blocked at front door.
**Things 3** — no project requirement at all. Inbox captures everything. Lowest friction.
**Sunsama** — 5-step ritual must complete before workspace access. Temporal barrier, not structural.
**Akiflow** — no blocker; Command Bar always available.
**Asana** — template gallery as onboarding.
**Tana** — optional structure; blank daily node always present.

### Recommendation for BAM-X
Hybrid pattern:
1. Show composed-day card in PROPOSED state with 4h focus block labeled "No project yet"
2. Single CTA inside the block: "Add your first project to anchor this time"
3. Allow 2h comm + CI to ratify immediately without project
4. Project creation retroactively populates the 4h block

Avoids Motion's gate-blocking; preserves CI sacredness.

---

## 6. Top 3 Patterns BAM-X Should Adopt

### Rank 1: Sunsama's "Front-load ritual, clear the surface"
WhyThisPlan + MorningRecap as guided ritual sequence at plan-time. Once ratified, composed-day card is the only surface. **Risk:** users who skip ritual miss evidence context. **Mitigation:** collapse-to-expand evidence linkage within each block.

### Rank 2: Reclaim.ai's "Anchor-first habit blocking"
CI block structurally identical to Reclaim "Habit." Auto-lock pattern (soft → hard at day-start). Visual distinction (different border, not color-fill). Override requires deliberate confirmation. **Risk:** legitimate reschedules feel friction-y. **Mitigation:** single-tap release, but log override.

### Rank 3: Things 3's "No project required to start"
4h focus block renders in "unanchored" state (grey, dashed border, "Select a project"). 2h comm + CI render full immediately. User can ratify partial day. **Risk:** partial-state may communicate incompleteness. **Mitigation:** copy reframes as "Day ready — one step left."

---

## 7. Anti-Patterns to Avoid

1. **Motion's project-creation gate.** Don't block composed-day card on project existence.
2. **Notion's template-gallery overwhelm.** Don't present 20 day-shape options on first run. One opinionated default.
3. **Motion's opaque auto-scheduling (no rationale).** WhyThisPlan is direct counter — preserve it.
4. **Reclaim's "everything is flexible" framing.** CI sacred ≠ "flexible by default."
5. **Sunsama's mandatory ritual gate.** Composed-day card visible immediately; ritual enriches, doesn't gate.

---

## 8. What BAM-X Already Does That Exceeds Competitors

- **CI as design principle, not a preference** — no competitor protects improvement/reflection as first-class design element.
- **Intentional communication anchors** — no competitor asserts a specific comm window as design choice.
- **Traceability from plan output to source rationale** — WhyThisPlan + MorningRecap give traceable causal chain. Motion gives filled calendar; Sunsama gives ritual. Neither gives traceable decision trail.
- **Deliberate ratification as signal** — auditable commitment event. Invisible to competitors.

---

## 9. The "Radical Simplicity" Tension — Honest Assessment

**Phil wants:** single boxed composed-day card. Things 3 territory (5/5 minimalism).

**What that card currently contains:** WhyThisPlan rationale, MorningRecap evidence, the composed blocks.

**Is removing WhyThisPlan + MorningRecap a strategic regression?**

**Yes, if removed entirely. No, if relocated to ritual pre-step or collapsed-by-default disclosure.**

WhyThisPlan is BAM-X's primary UX-layer competitive differentiation — the only element in the competitive set providing traceable causal chain between behavioral evidence and daily plan. Removing from persistent surface eliminates visible signal of this differentiation.

**Recommended resolution:**
1. MorningRecap + WhyThisPlan as collapsible "Why this plan?" disclosure inside CycleCard — visible but not open by default
2. Default state: day header, 3 time blocks, ratification CTA. Component count: 5–6.
3. Disclosure chevron communicates depth exists without forcing it.
4. Returning users may see brief 3-second WhyThisPlan auto-show, then collapse.

**Removing WhyThisPlan entirely** brings BAM-X into parity with Motion / Akiflow — opaque auto-scheduling. That's the "process theater" category BAM-X is designed to transcend. **Strategic regression of the first order.**

**Verdict: collapse, do not delete.**

---

## Sources
- https://www.usemotion.com/help/time-management/auto-scheduling
- https://www.usemotion.com/help/motions-onboarding-process
- https://www.sunsama.com/features/daily-planning-and-shutdown
- https://help.sunsama.com/docs/getting-started/setting-up-your-account/
- https://www.sunsama.com/blog/work-day-formats
- https://reclaim.ai/features/habits
- https://help.reclaim.ai/en/articles/6750250-auto-lock-your-focus-time-habits-tasks-and-smart-meetings
- https://help.reclaim.ai/en/articles/6332766-use-focus-time-to-defend-time-for-productive-work
- https://linear.app/docs/conceptual-model
- https://www.candu.ai/blog/the-anti-onboarding-strategy-how-linear-converts-philosophy-into-product-adoption
- https://culturedcode.com/things/support/articles/4001304/
- https://tana.inc/docs/daily-notes
- https://product.akiflow.com/help/articles/3677363-time-blocking-101
- https://akiflow.com/blog/time-management-schedule-template
- https://www.morgen.so/ai-planner
- https://www.thestack.technology/clockwises-team-joins-salesforce-sunsetting-platform-as-they-go/
- https://www.notion.com/templates/daily-planner
