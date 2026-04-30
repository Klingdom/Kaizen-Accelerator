# Today v2 — Competitive Latency Patterns

_Authored by competitive-researcher; persisted by coordinator (read-only Tier 1 agent)._

**Research date: 2026-04-30**

## 1. The 10-Second Pattern Inventory

| Comparator | Pattern | How it compresses comprehension | URL |
|---|---|---|---|
| **Motion** | Single-surface AI Agenda + MIT surfacing | AI pre-answers "what next?" — no parsing required | https://www.usemotion.com/ |
| **Motion** | Color-coded section labels (Today / Tomorrow / Past Deadline) | Skim-safe hierarchy; overdue surfaces as count badge | https://bymilliepham.com/motion-review |
| **Sunsama** | Visual workload clock (color-coded load indicator) | Red/yellow/green replaces arithmetic — feasibility is a glance | https://help.sunsama.com/docs/daily-planning |
| **Akiflow** | Unified Inbox + Today rail (single pane) | No app-switching; signals pre-merged; keyboard nav on one surface | https://www.morgen.so/blog-posts/akiflow-vs-motion |
| **Linear** | Focus grouping in My Issues (Urgent → Blocking → Cycle → Active → Backlog) | Decision paralysis eliminated by pre-sorted execution order | https://linear.app/docs/my-issues |
| **Things 3** | Minimal Today list (only ratified tasks; Evening subsection de-emphasized) | Only user-chosen tasks; evening visually de-prioritized | https://culturedcode.com/things/support/articles/4001304/ |
| **Tana** | Daily node as blank canvas + pinned saved-search results | Fresh-start psychology; no stale clutter | https://outliner.tana.inc/daily-notes |
| **Reclaim** | Calendar-native: tasks + habits + meetings on one timeline | Comprehension = "read your calendar once" | https://reclaim.ai/features/planner |
| **Notion Home** | Custom dashboard with inline DB filters | Power-user build; speed entirely template-dependent | https://www.notion.com/ |

**Cross-cutting insight**: Fastest-comprehending products reduce reading surface to a single ranked sequence with visible feasibility signal (load, priority badge, AI-surfaced MIT). Slowest force users to reconcile multiple lists.

## 2. The 60-Second Update-and-Start Pattern Inventory

| Comparator | Pattern | Latency advantage | URL |
|---|---|---|---|
| **Akiflow** | Command Bar (no mouse) → capture → time-block | Capture-to-block without mouse; "Replan Undone" fills gaps in one action | https://akiflow.com/features/keyboard-shortcuts/ |
| **Motion** | T-key → edit duration/priority → auto-reschedule fires | Single key opens task; engine cascades automatically | https://bymilliepham.com/motion-review |
| **Linear** | G+M → find → C → Tab → Cmd+Enter | Create-to-assign in ~5 keystrokes; no modal for basics | https://shortcuts.design/tools/toolspage-linear/ |
| **Sunsama** | Hover task → X key → auto-schedule into calendar block | One keystroke converts unscheduled to timeslot; no drag | https://thesweetsetup.com/how-to-startup-and-shutdown-your-day-with-sunsama/ |
| **Sunsama** | Shutdown ritual capped at 2 min: review → defer → post to Slack | Hard 2-min bound enforced by step count | same |
| **Things 3** | Drag-and-drop within Today; no modal | Re-prioritization is one gesture, no confirmation | https://culturedcode.com/things/support/articles/4001304/ |
| **Reclaim** | One-click meeting join; AI auto-reschedules conflicts | Update path zero-click; start path one-click | https://reclaim.ai/features/planner |
| **Tana** | Quick Add → Supertag auto-routes to day node | Capture without context-switch; routing deterministic | https://tananodes.com/day-node-capture-tana-commands/ |

**Cross-cutting insight**: Fastest update-and-start paths share two mechanics: (a) keyboard-only path from idle to committed with no intermediate modal, (b) automatic propagation so the user's last action IS the start action.

## 3. Patterns BAM-X Should Adopt

Ranked by fit to <10s/<60s targets and alignment with BAM-X's deliberate-ratification model.

**1. Linear-style pre-sorted execution order in CycleCard.** Started/in-progress blocks above pending. Returning user scans in one pass.

**2. Sunsama's workload clock — visual feasibility signal.** BAM-X has BalanceMeter but no single binary feasibility indicator. Color clock answers "is today overloaded?" in 200ms.

**3. Akiflow/Sunsama single-key schedule action.** Single keyboard shortcut (E) to enter edit on focused block; Enter/Esc to commit/cancel. **Highest-leverage change for <60s goal.**

**4. Motion's persistent "Up Next" chip.** BAM-X has NowPane but explicit one-next-action chip outside timeline scroll answers "what after this?" without click.

**5. Things 3 Evening subsection de-emphasis.** Visually de-emphasize post-5pm tasks (lighter, smaller, collapsed). Reduces morning cognitive load.

## 4. Patterns BAM-X Already Has (vs Comparators)

1. **NowPane** matches Motion "Up Next"
2. **WhyThisPlan disclosure chip** — exceeds all comparators (no comparator surfaces rationale inline)
3. **Deterministic composition with ratification gate** — exceeds Motion/Reclaim (silent auto-reschedule violates BAM-X positioning)
4. **BalanceMeter** carries richer semantic content than Sunsama's binary load clock — Sunsama wins on glanceability, BAM-X wins on meaning
5. **MorningRecap + RhythmExplainer** — no direct comparator equivalent

## 5. Anti-Patterns to Avoid

1. **Motion's silent full-auto reschedule** — violates deliberate-ratification model
2. **Sunsama's 10-15 minute morning ritual modal** — anti-pattern for <60s goal
3. **Tana's blank-canvas daily note** — wrong for cold-start comprehension
4. **Notion Home custom dashboard** — no enforced hierarchy; onboarding failure mode
5. **Reclaim's zero-click AI auto-resolution** — too opaque for evidence-linked positioning

## 6. Top 3 Competitive-Lens Recommendations

| Title | Comparator | Why it fits BAM-X | Effort | Risk |
|---|---|---|---|---|
| **Keyboard-first edit entry (E to edit, Enter to commit)** | Akiflow + Sunsama | Eliminates mouse requirement; preserves deliberate-ratification; no auto-reschedule implied | Low (keybinding + focus mgmt) | Low — purely additive |
| **Single-color feasibility indicator on MorningRecap strip** | Sunsama workload clock | Compresses "is today feasible?" to one color; doesn't replace BalanceMeter | Low (compute exists in BalanceMeter logic; add CSS class) | Low — no model change |
| **Persistent "Up Next" chip outside CycleCard scroll** | Motion Up Next sidebar | Anchors post-current-block awareness; fits NowPane's role | Medium (layout addition; edge cases) | Medium — empty/end-of-day states |

## 7. Strongest North-Star: Akiflow

Only comparator simultaneously achieving fast comprehension (unified inbox, single surface) AND fast update-and-start (keyboard-only path) without hiding the plan from the user. Unlike Motion, doesn't violate deliberate ratification.

**Single most copy-able for <10s**: Sunsama's visual feasibility clock (BAM-X already computes the data).

**Single most copy-able for <60s**: Akiflow/Sunsama keyboard-first command path — specifically `E` to edit focused block, `Enter` to commit.

**Most-tempting to NOT adopt**: Motion's silent full-auto reschedule.

## Sources

- https://www.usemotion.com/ · https://bymilliepham.com/motion-review · https://www.usemotion.com/help/time-management/auto-scheduling
- https://help.sunsama.com/docs/daily-planning · https://thesweetsetup.com/how-to-startup-and-shutdown-your-day-with-sunsama/
- https://akiflow.com/features/keyboard-shortcuts/ · https://www.morgen.so/blog-posts/akiflow-vs-motion
- https://linear.app/docs/my-issues · https://shortcuts.design/tools/toolspage-linear/
- https://culturedcode.com/things/support/articles/4001304/
- https://outliner.tana.inc/daily-notes · https://tananodes.com/day-node-capture-tana-commands/
- https://reclaim.ai/features/planner · https://reclaim.ai/features/focus-time
- https://www.notion.com/
