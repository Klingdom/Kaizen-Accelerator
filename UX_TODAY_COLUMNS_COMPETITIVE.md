# UX Today Columns — Competitive Analysis
_BAM-X / Ledgerium AI · April 2026_

---

## 1. Per-Product Row Anatomy

> Reading direction: left → right, as a user scans across a single task row in that product's Today/daily list view.
> "State label" = a literal text string like "Scheduled", "In Progress", "Proposed" visible on the row.

| Product | Col 1 (far left) | Col 2 | Col 3 — Name region | Col 4 | Col 5 | Col 6 (far right) | Duration shown? | State label on row? | Output/outcome shown? |
|---|---|---|---|---|---|---|---|---|---|
| **Motion** (Agenda) | Scheduled time band (e.g. 9:00 AM) | Project color bar / icon | Task name | Priority badge (icon only: urgent/high/medium/low) | Deadline chip (date) | — | No explicit duration chip (time band implies slot length) | No — status communicated by section grouping (Today / Overdue) | No |
| **Sunsama** (daily kanban column) | Completion circle (checkbox) | Channel/integration source icon (e.g. Asana logo, Gmail icon) | Task name | Planned-time chip (e.g. "1h") | Timer play button (▶) | Actual-time readout (appears on hover / after tracking) | Yes — planned time chip | No — completion is binary checkbox, no text label | No |
| **Akiflow** (Today rail) | Project color bar (left border or dot) | Completion checkbox | Task name | Time-slot chip (e.g. "10:00–10:30") | Priority indicator (icon) | Tags (inline text chips) | Yes — slot length implied by time chip | No — tasks move to "Done" section visually | No |
| **Linear** (My Issues list) | Priority icon (none/urgent/high/medium/low — colored icon, no text) | Status icon (circle: Todo / In Progress / Done / Cancelled) | Issue ID + Title | Label chips (colored pill, text label inside) | Assignee avatar | Estimate (points/hours) · Due date chip (calendar icon + date, color-coded) | Yes — estimate field | No — status is icon only, not spelled out as text | No |
| **Things 3** (Today list) | Large completion circle (checkbox) | Task name + optional inline checklist count | Tags (green lozenge, text) | Deadline badge (red/orange date if set) | Notes indicator (small dot) | — | No — duration not surfaced on row | No — no state text; order/position is the only state cue | No |
| **Reclaim.ai** (calendar blocks) | Time block on calendar grid (start/end = visual duration) | Color-coded category bar | Task name | Priority level (P1–P4 color dot, no text) | "Done scheduling" emoji (👍) on completed-scheduling tasks | — | Yes — block height = duration | No text label; 👍 emoji is only non-color state cue | No |
| **Todoist** (Today list) | Priority color flag (P1 red / P2 orange / P3 blue / P4 none) | Completion checkbox | Task name | Sub-task count (if any) | Project chip (colored dot + name) | Label chips · Due date (if not today) | Yes — duration chip available in paid tier | No — priority is color only; no text state label | No |
| **TickTick** (Today list) | Priority color dot (red/orange/blue/grey) | Completion checkbox | Task name | Tag chips (text pill) | Due time (if set, shown as clock + time) | List name (right-aligned, muted) | Yes — duration shown as estimate on task if set | No — no text state label | No |
| **Any.do** (Today section) | Completion checkbox | Task name | Priority badge (orange "Priority" tag if set) | Due date/time chip | List name chip | — | No | No | No |
| **Asana** (My Tasks list) | Completion circle | Task name | Project pill (colored chip) | Assignee (avatar, usually self) | Due date chip | Custom field columns (configurable: priority, effort, etc.) | Yes — if "Effort" custom field added | No — status icon only (circle variants) | No |
| **ClickUp** (Home / My Work) | Status color chip (text inside, e.g. "TO DO", "IN PROGRESS") | Priority flag icon | Task name | Space/List breadcrumb | Due date chip | Assignee avatar | Yes — time estimate if set | YES — ClickUp is the main outlier: status appears as a colored text chip ("TO DO", "IN PROGRESS", "COMPLETE") inline on every row | No |

---

## 2. Cross-Cutting Patterns

### What appears universally (≥8/10 products)
- **Completion mechanism** (checkbox or circle) — always leftmost or near-leftmost
- **Task name / title** — always the widest, dominant column; center-of-gravity of the row
- **Project or source context** — present in every tool except Things 3; rendered as a color chip, dot, or integration icon
- **Due date or scheduled time** — present in 9/10; positioned right-of-name or far right

### What best-in-class tools do deliberately
- **Priority is always visual-only** (color, icon, position) — never a text badge saying "High Priority" on the row itself
- **State is communicated by section grouping** (Today / Overdue / Upcoming), row opacity (dimmed = done), or position — not by a text label on each row
- **Duration is a scheduling signal, not a status signal** — shown as a time chip or block height, not prominently
- **Integration source icons** (Sunsama) act as context without taking up label space

### What is deliberately omitted
- Long text descriptions on the row (everything lives in the expanded detail pane)
- Redundant information already implied by section grouping (e.g., "Today" label on every row in the Today view)
- Multiple state labels — tools pick one mechanism (section OR color OR icon) and commit to it

---

## 3. State-Label Finding

**Result: 1 out of 10 competitors shows a textual state label per row.**

ClickUp is the single outlier: it renders status as a colored text chip ("TO DO", "IN PROGRESS", "COMPLETE") inline on every row. This is a deliberate design choice tied to ClickUp's highly configurable, team-workflow-first identity — but it is widely critiqued in reviews as visually noisy and redundant in personal/today views.

Every other tool in this study communicates state through:
- Section grouping (Motion groups tasks under "Today", "Overdue", "Later")
- Icon-only status (Linear's circle variants — hollow = Todo, half-filled = In Progress, filled = Done)
- Row opacity or strikethrough (Todoist, Things 3, TickTick — dimmed/struck means done)
- Position (Reclaim — scheduled tasks appear as calendar blocks; unscheduled float in sidebar)
- Emoji cue (Reclaim's 👍 for "done scheduling")

**Verdict: Phil's instinct is validated by 9/10 competitors. A text state label ("Proposed / Scheduled / In Progress") on every row is noise, not signal. BAM-X should drop the state label from the row and rely on section grouping + visual cues (the PROPOSED chip, opacity, position).**

---

## 4. Output-Artifact / Outcome Surfacing

**Result: 0 out of 10 competitors surface an expected output or deliverable inline on the task row.**

None of the researched tools show any "what you'll produce" signal on the row itself. The closest approaches are:
- **Sunsama** shows a "planned time" chip, which implies work scope but not deliverable type
- **Linear** shows an "estimate" (story points / hours), again scope not output
- **Asana** allows custom fields that could include a "deliverable" field, but this is not a default row column and requires explicit configuration

No tool surfaces a statement like "→ Draft: Q2 forecast model" or "→ Output: revised brief" on the task row.

**Implication: BAM-X's plan to surface `outputArtifact` from the activity catalog inline on the row is genuinely differentiated. There is no competitive precedent. This is a clear white space.** The risk is cognitive load — see Anti-patterns below for mitigation guidance.

---

## 5. What BAM-X Has That Competitors Don't

| BAM-X element | Competitive status | Why it matters |
|---|---|---|
| **Bucket chip (focus area)** | Absent in all 10 tools | Gives the row a deliberate focus dimension — not just "what project" but "what type of work" (Deep Work, Admin, Comms). Sunsama channels are the closest analogue but are integration-source-based, not cognition-type-based. |
| **Why-chip on PROPOSED state** | Absent in all 10 tools | Surfaces the rationale for AI-proposed tasks before ratification. No competitor explains why a task appeared on today's list. This is the deliberate-ratification model in practice and is a genuine UX differentiator. |
| **Immutable event linkage** | Absent in all 10 tools | No competitor ties a task row to an evidence chain. BAM-X rows are anchored to real captured behavior, not self-reported intent. |

---

## 6. What Competitors Have That BAM-X Doesn't (Candidates)

| Competitor column | Who uses it | BAM-X fit assessment |
|---|---|---|
| **Project chip** (colored text pill) | Sunsama, Todoist, TickTick, Asana, ClickUp | Medium fit. BAM-X has bucket chip (cognition type). A project chip would add a second context layer. Valuable if BAM-X tracks multi-project users. Consider after v1. |
| **Priority badge** (icon or color) | Linear, Reclaim, Todoist, ClickUp, Akiflow | Medium fit. BAM-X has deliberate ratification as the priority signal. An explicit priority icon may be redundant but useful for power users managing large backlogs. |
| **Due-date chip** | Motion, Todoist, Asana, Linear, TickTick | High fit. BAM-X has duration but not deadline visibility on the row. A deadline chip (date, color-coded red when near) is a low-cost high-signal addition. |
| **Integration source icon** | Sunsama | Low fit for now. BAM-X generates its own events. Relevant if BAM-X adds integrations (Jira, Linear, etc.) later. |
| **Comment / notes count badge** | Asana, ClickUp, Linear | Low fit. BAM-X rows are atomic task units, not collaboration objects. Don't add this. |
| **Attachment badge** | Asana, ClickUp | Low fit. Same reasoning. |
| **Assignee avatar** | Asana, Linear, ClickUp | Low fit. BAM-X is personal-first. Not relevant until team features ship. |

---

## 7. Top 3 Patterns BAM-X Should Consider Adopting

### Rank 1 — Sunsama: planned-time chip + timer play button
**Source:** Sunsama
**Pattern:** A discrete "planned time" chip (e.g., "1h 30m") appears right-of-title on every row, followed by a ▶ timer button that activates time tracking.
**Fit to BAM-X:** High. BAM-X already tracks duration. Surfacing it as a visible chip per row — rather than just in the time-band column — reinforces the time-bounded nature of deliberate work. The timer button maps well to BAM-X's "start activity" state transition.
**Fit to deliberate-ratification model:** Strong. The planned-time chip is set at ratification time and becomes a commitment artifact visible on the row. Actual time (tracked) vs. planned time (committed) creates a meaningful deviation signal.
**Suggested implementation:** Replace the current duration column with a compact planned-vs-actual chip: "45m" before start, "23m / 45m" during, "47m / 45m" after. No text state label needed — the ratio tells the story.

### Rank 2 — Linear: icon-only status with section grouping for state
**Source:** Linear
**Pattern:** State is communicated by (a) which section a task is in (Todo / In Progress / Done) and (b) a small circle icon with clear visual states. No text label appears on the row.
**Fit to BAM-X:** High. BAM-X should adopt section-based grouping (PROPOSED / ACTIVE / COMPLETE) as the primary state signal and drop the text state label. The existing PROPOSED chip can serve as the section anchor, not a per-row badge.
**Fit to deliberate-ratification model:** Excellent. PROPOSED items appear in a visually distinct section at the top; ratified items move to SCHEDULED; active items are highlighted. State change = row moves section. This mirrors the ratification event without labeling it redundantly.
**Suggested implementation:** Three sections on the Today page with visual section headers. Rows within each section carry no redundant state label.

### Rank 3 — Motion: scheduled time band as the leftmost anchor
**Source:** Motion
**Pattern:** The absolute leftmost element on every row is the clock time (e.g., "9:30 AM"), giving the row immediate temporal grounding before the user reads the task name.
**Fit to BAM-X:** High. BAM-X already has a time-band column. Ensuring it is always the first element users see (even for PROPOSED tasks, showing "proposed ~2:00 PM") creates consistency and reinforces the calendar-first mental model.
**Fit to deliberate-ratification model:** Good. For PROPOSED tasks, the time band could show a softer style (dashed, muted) vs. the solid time band for SCHEDULED tasks — a visual vocabulary that communicates state without text.
**Suggested implementation:** Standardize time band as col 1 in every state. PROPOSED = dashed/muted time. SCHEDULED = solid time. ACTIVE = highlighted/pulsing. COMPLETE = struck-through time.

---

## 8. Anti-Patterns to Avoid

1. **ClickUp's text status chip on every row.** "TO DO" / "IN PROGRESS" on every row is redundant once section grouping and time-band styling communicate state. Adds cognitive load without adding information.

2. **Asana's unbounded custom column sprawl.** Allowing users to add unlimited columns to task rows creates visual inconsistency. BAM-X should fix the column schema and give users show/hide toggles, not add-column powers.

3. **TickTick's list-name column on the far right.** Muted list names on the far right of every row are consistently the last thing users look at and often ignored. Context belongs left-of-name (bucket chip, project chip), not right.

4. **Sunsama's actual-time readout hidden until hover.** Key completion data (how long the task actually took) is invisible until mouse interaction. For BAM-X's evidence model, actual duration should be a first-class visible field post-completion — not buried.

5. **Things 3's total omission of duration.** Things 3 is beautiful but time-blind — no duration signal on any row. For BAM-X, which is built on evidence-linked time records, hiding duration would undermine the core value proposition. Always surface it.

---

## Sources
- https://www.usemotion.com/help/getting-started/navigation-basics/navigating-motion-features/navigating-project-management-features
- https://www.usemotion.com/blog/agenda-view
- https://help.sunsama.com/docs/planned-and-actual-times
- https://help.sunsama.com/docs/kanban-task-view
- https://organizeyouronlinebiz.com/sunsama-features/
- https://product.akiflow.com/help/articles/0006630-task-features
- https://how-to-use-guide.akiflow.com/time-slots
- https://linear.app/docs/display-options
- https://linear.app/docs/priority
- https://help.reclaim.ai/en/articles/5966818-task-filters-open-scheduled-done-scheduling-marked-done
- https://help.reclaim.ai/en/articles/5108936-overview-what-reclaim-tasks-are-and-how-to-create-and-use-them
- https://www.todoist.com/help/articles/customize-views-in-todoist-AoHhBxFdZ
- https://help.ticktick.com/articles/7055782408586526720
- https://tidbits.com/2025/08/14/ticktick-provides-a-focused-daily-task-list-and-more/
- https://help.asana.com/s/article/list-view?language=en_US
- https://help.clickup.com/hc/en-us/articles/15822815173015-Task-List-cards
- https://culturedcode.com/things/support/articles/2803579/
- https://www.sunsama.com/blog/sunsama-2025-task-manager-roadmap
