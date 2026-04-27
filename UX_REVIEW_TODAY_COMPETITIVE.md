# Today Page — Comparable Product Patterns (competitive-researcher lens)

_Authored by competitive-researcher (Tier 1, read-only); persisted by coordinator for synthesis._

## 1. Comparator Set

| Comparator | Rationale | URL |
|---|---|---|
| **Motion** | Already inspirational to the team; AI auto-schedule + hour-grid is the closest architectural cousin to BAM-X's auto-compose | https://www.usemotion.com |
| **Sunsama** | Closest behavioral twin: guided morning ritual, EOD shutdown, manual time-boxing — the "deliberate day" ethos matches BAM-X intent | https://www.sunsama.com |
| **Reclaim.ai** | Best-in-class habit-block auto-protection and focus-time analytics; the "defend deep work" angle directly mirrors BAM-X's CI bucket | https://reclaim.ai |
| **Akiflow** | Universal inbox + command-bar speed + time-slot grouping; the best single-operator daily execution surface | https://akiflow.com |
| **Todoist** | Largest installed base for Today-view patterns; just shipped calendar layout + priority-color coding + Plan sidebar | https://www.todoist.com |
| **Things 3** | Gold standard for minimal Today/Evening split; "This Evening" zone and progressive disclosure of task detail | https://culturedcode.com/things |
| **Tana** | Daily-note-as-structured-node; supertag templates auto-populate today context | https://tana.inc |
| **Linear** | Keyboard-first, <50 ms interactions; opinionated workflow that reduces decision fatigue | https://linear.app |

## 2. Today-Page Pattern Inventory

| Comparator | Pattern | Description |
|---|---|---|
| Motion | AI Daily Agenda tab | Morning generation of ordered task list: today, tomorrow, overdue |
| Motion | Auto-reschedule on conflict | When a meeting runs long, all remaining tasks shift automatically |
| Motion | Hour-grid calendar overlay | Tasks rendered as time-blocks on a scrollable day column |
| Motion | Overdue task surfacing | Overdue items flagged inline in agenda view each morning |
| Sunsama | 5-P morning ritual | Process → Plan → Prioritize → Prepare → Publish; structured wizard |
| Sunsama | Yesterday recap step | First step: review yesterday's incomplete tasks before planning today |
| Sunsama | Shutdown ritual | EOD prompt: what did you finish, what moves to tomorrow, reflection note |
| Sunsama | Slack publish | "Publish" step shares day plan to team channel as accountability signal |
| Sunsama | Time estimate per task | Every task gets a manual time estimate; running total shown vs. capacity |
| Reclaim | Habit blocks (adaptive) | Recurring blocks start as Free, harden to Busy as week fills; auto-reschedule |
| Reclaim | Focus Time goal tracking | Weekly goal vs. actual focus hours; overtime and context-switching metrics |
| Reclaim | Weekly performance report | Email digest: meetings / tasks / habits / focus time breakdown |
| Reclaim | Auto-decline meetings | Optional rule: decline meetings that would break a focus block |
| Akiflow | Universal inbox | Tasks pulled from 3000+ integrations into one triage surface |
| Akiflow | Command bar | Natural-language task creation + scheduling without leaving keyboard |
| Akiflow | Stats dashboard | Time-usage breakdown + inbox-zero streak counter |
| Akiflow | Daily rituals | Built-in morning + shutdown ritual flow |
| Todoist | Priority-color P1 anchoring | P1 tasks float to top of Today in red; visual hierarchy baked in |
| Todoist | Calendar layout + Plan sidebar | Dual panel: list of unscheduled tasks + hour-grid; drag to time-block |
| Todoist | Drag-to-postpone gesture | Drag task to bottom of Today list to defer to tomorrow |
| Things 3 | Today / This Evening split | Separate zones for work hours and evening; hard work-life boundary in UI |
| Things 3 | Calendar events alongside tasks | Apple Calendar events shown in Today list without leaving app |
| Things 3 | Progressive disclosure | Task opens into clean sheet; fields tucked away |
| Tana | Daily node as structured template | Day page auto-populates via supertag |
| Tana | Habit tracking in daily note | Habit template embeds directly into daily note |
| Linear | Cmd+K global command | Opens task creation / navigation from anywhere |
| Linear | Keyboard-first navigation | Nearly every action has a shortcut |

## 3. Cross-Comparator Common Patterns (BAM-X currently lacks all of these)

**Pattern appears in 5+ of 8 comparators:**

1. **Yesterday recap / morning review step** — Sunsama, Akiflow, Motion, Tana, Todoist. BAM-X has no prior-day bridge moment.
2. **Quick-capture inbox / command entry** — Akiflow, Motion, Todoist, Linear, Tana. BAM-X requires navigating to Catalog to add activities.
3. **Single top-priority / "anchor task" anchor** — Todoist, Sunsama, Things 3, Tana. BAM-X has no anchor-per-bucket designation.
4. **EOD shutdown ritual / day-close review** — Sunsama, Akiflow, Motion, Tana. BAM-X has no structured end-of-day close.
5. **Keyboard shortcut to trigger plan/replan** — Linear, Akiflow, Motion, Todoist. BAM-X's Auto-Plan is button-click only.

**Appears in 4 comparators:**

6. **Energy / deep-work color coding** — Reclaim, Sunsama, Todoist, Things 3. BAM-X buckets are typed but no visual energy signal.
7. **Streak or consistency visualization** — Reclaim, Akiflow, Tana, Todoist. BAM-X has AdherenceDial but no streak ribbon.

## 4. Patterns BAM-X Has That Comparators Mostly Don't

1. **Enforced 4-2-2 bucket invariant** — Unique. No comparator enforces a named, ratio-constrained split.
2. **Auto-compose with floor/ceiling constraints** — INFEASIBLE state with structured explanation. Comparators fail silently.
3. **Kaizen-aware deep block** — Active Kaizen ID is a first-class composition input.
4. **Immutable output artifacts per activity** — Tamper-evident evidence record per completed block.
5. **Day-counter badge anchoring progress to signup** — Visible progress without streak penalty framing.

## 5. Patterns BAM-X Should NOT Adopt

1. **Infinite-scroll task backlog on Today** — Undermines WIP discipline.
2. **Gamified streak penalties (Duolingo-style)** — Contradicts Kaizen retrospective model.
3. **Free-form AI reschedule without user ratification** — Removes the deliberate planning moment.
4. **Drag-and-drop as the primary scheduling interaction** — Naive drag silently violates bucket invariant.
5. **Social/public sharing by default** — Wrong default for individual operator MVP.

## 6. Top 5 Competitive-Lens Recommendations (ranked)

| Rank | Title | Pattern to adopt | Source comparator(s) | Effort |
|---|---|---|---|---|
| 1 | **Morning bridge step** | Lightweight "yesterday recap" before Auto-Plan fires | Sunsama, Motion | S |
| 2 | **Global quick-capture with constraint preview** | Cmd/Ctrl+K to create activity + show bucket impact | Akiflow, Linear | M |
| 3 | **Single anchor-task pin per bucket** | One activity per bucket marked "anchor" | Todoist, Sunsama, Things 3 | S |
| 4 | **EOD shutdown micro-ritual** | "3 completed, 1 skipped — move it to tomorrow or drop it?" | Sunsama, Akiflow | M |
| 5 | **Focus-time weekly report card** | Weekly summary: focus minutes vs target, CI rate, sparkline | Reclaim, Akiflow | S |

## 7. Anti-Patterns to Watch For

1. **Calendar-as-truth creep** — Erodes evidence-record separation.
2. **AI suggestion noise in the day view** — Adds cognitive load to the surface that should be quietest.
3. **Settings-buried constraint controls** — FineTuneDrawer is right; don't move capacity controls out of context.
4. **Streak → shame spiral** — AdherenceDial percentage is architecturally safer than streak count.
5. **Over-broad "Today" surface** — Resist dashboard widget requests on the Today route.

## 8. Cross-Page Competitive Patterns

| BAM-X Page | Strongest external comparator | Borrowable pattern |
|---|---|---|
| **Today** | Sunsama | 5-P morning ritual + shutdown ritual |
| **Week** | Motion | Hour-grid calendar (Sprint 15 done); next: overdue surfacing across week |
| **Portfolio** | Linear | Project-list with opinionated status, keyboard-navigable |
| **Catalog** | Akiflow | Universal inbox + slot-based grouping (cluster by bucket) |
| **Kaizen** | Tana | Structured daily-note with embed for active Kaizen tasks |
| **InsightsPortfolio** | Reclaim.ai | Focus-time analytics with goal-vs-actual sparklines and weekly digest |

## 9. Strongest North-Star: Sunsama

Motion is the calendar-layer inspiration (Sprint 15 already draws from it), but **Sunsama is the deeper north star** for BAM-X's behavioral model: deliberate morning planning, constrained day capacity, manual ratification, EOD shutdown, and no-AI-auto-reschedule philosophy all map directly onto BAM-X's composition contract. Motion optimizes for throughput; Sunsama optimizes for intentionality — which is BAM-X's actual value proposition.

## 10. Sources

- Motion: https://www.usemotion.com/features/ai-task-manager · https://www.usemotion.com/help/time-management/auto-scheduling · https://www.usemotion.com/calendar
- Sunsama: https://www.sunsama.com/features/daily-planning-and-shutdown · https://help.sunsama.com/docs/daily-planning · https://roadmap.sunsama.com/changelog/daily-shutdown
- Reclaim: https://reclaim.ai/features/habits · https://reclaim.ai/features/focus-time · https://help.reclaim.ai/en/articles/6207587-how-reclaim-manages-your-schedule-automatically
- Akiflow: https://akiflow.com/features · https://product.akiflow.com/help/articles/3677363-time-blocking-101
- Todoist: https://www.todoist.com/help/articles/plan-your-day-with-the-todoist-today-view-UVUXaiSs · https://www.todoist.com/help/articles/use-the-calendar-layout-in-todoist-lPHRQTu0o
- Things 3: https://culturedcode.com/things/features/
- Tana: https://tana.inc/docs/daily-notes · https://help.tana.inc/today-node-and-changing-the-day-tag.html
- Linear: https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help
- Comparisons: https://blog.rivva.app/p/motion-vs-sunsama-vs-akiflow · https://toolfinder.co/comparisons/akiflow-vs-sunsama
- InsightsPortfolio analogue: https://www.celonis.com/insights · https://max-productive.ai/ai-tools/reclaim-ai/
