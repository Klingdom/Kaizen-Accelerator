# BAM-X Kaizen OS — Theme Deltas for Other Pages

Status: v0.1 — Define-phase. Not implemented. Awaiting Phil approval before any candidates land in IMPROVEMENT_BACKLOG.md. References UX_DESIGN_THEMES.md themes T1–T10.

---

## Page: Week

### Current state
- Week.js:191–210 — empty state renders h1 + propose button but no status signal and no context for why to plan now. WEEK_COPY.EMPTY is one factual sentence with no recovery path or day-band awareness.
- Week.js:83–88 — `renderActivity` defines its own bucket→class map (chip-project / chip-communication / chip-ci) independent of the maps in ScheduledActivityBlock and UpNextRail.
- Week.js:138–153 — `DayPreview` renders a `<dl>` for per-bucket totals but no BucketStrip component; visual treatment diverges from Today's BucketStrip.
- Week.js:202–210 — `wk-page-header` contains h1 + propose button only; no primary status signal (e.g., week adherence shape or Deep-minutes headline per UX_FLOWS §6.4).

### Theme application matrix
| Theme | Apply? | How | Effort | Risk | Dependency |
|---|---|---|---|---|---|
| T1 Bucket-Tone Token Consistency | YES | Merge `renderActivity` bucket→class map into shared `bucketMeta()` helper (Frontend §6 pattern 1); verify `.wk-chip` uses `:root` tokens | S | Low | T1 must ship on Today first |
| T2 Stateful Card Mode | PARTIAL | If Week gains per-day edit mode, apply single-focus chrome; not needed today | FUTURE | — | — |
| T3 Closure Ritual | YES | Week-close confirmation on Friday: after all 5 days ACCEPTED, surface a non-blocking strip "Week complete — Friday's reflection is ready" | M | Medium — requires weekly state read | C-PM-4 timing infrastructure |
| T4 Morning Bridge | YES | Week header adds a prior-week delta line: "Last week: Xm Deep / Ym Comms / Zm CI" on Monday first-load per Growth §8 | S | Low | Yesterday's comp service call |
| T5 Empty-State Warmth Ladder | YES | WEEK_COPY.EMPTY adds a second sentence naming the recovery path: "Tap Plan this week to compose Mon–Fri from your catalog" | S | Low | None |
| T6 Anchor + Secondary Affordance | YES | Per-day Accept button is primary (filled); "Accept all 5 days" in footer remains primary; add a secondary/ghost "Edit day" affordance per DayPreview | S | Low | None |
| T7 Page Header Trio | YES | Add a status signal to `wk-page-header`: week-level Deep-minutes vs target when weekly comp exists; h1 persists on empty state (already present) | S | Low | None |
| T8 Drawer Pattern | FUTURE | No drawer exists on Week today; apply if a per-day edit drawer is added | FUTURE | — | — |
| T9 Day-Band Onboarding | PARTIAL | Week can surface day-band context (e.g., "Week 1 — aim for 5 accepted days") in the empty state for users in day 0–6 | S | Low | `daysSinceSignup` prop required |
| T10 Append-Only Variance | YES | Past days (CLOSED/SKIPPED state) in the week grid remain visible with muted treatment; no hiding of closed day columns | S | Low | CSS only |

### Proposed deltas (ranked)

**1. Week header status signal (T7)**
Problem: `wk-page-header` has h1 + propose button but no status. Returning users on Tuesday cannot see how the week is shaped without reading every DayPreview column.
Proposed change: When `weekly` exists, add a one-line status chip between h1 and the propose button: "Deep Xm · Comms Ym · CI Zm this week." Uses `plannedByBucket` sums already on the composition.
Theme(s): T7.
Acceptance signal: Week header renders the three bucket totals when a weekly composition exists; renders nothing extra on empty state.

**2. Bucket-chip token unification (T1)**
Problem: Week.js:83–88 defines its own bucket→class map. Any token change on Today will not propagate to Week.
Proposed change: Extract a shared `bucketMeta(bucket)` helper returning `{ chipClass, label }`. Replace the local switch in `renderActivity`. Verify `.wk-chip` rules reference `:root` tokens.
Theme(s): T1.
Acceptance signal: Changing `--project-bg` in `:root` changes color in both Today chips and Week chips without a separate Week CSS edit.

**3. Empty-state warmth (T5)**
Problem: WEEK_COPY.EMPTY is one factual sentence with no recovery path named explicitly and no day-band context.
Proposed change: Extend to two sentences: "No week plan yet." + "Tap Plan this week to compose a Mon–Fri schedule from your catalog." For users in day 0–6, prepend: "Week 1 — building your baseline. Aim for 5 accepted days."
Theme(s): T5, T9.
Acceptance signal: Empty state for day-0 user differs from empty state for day-30 user. Both have a named next step.

**4. Prior-week delta on Monday (T4)**
Problem: No continuity signal between last week and this week. User on Monday opens Week and sees last week's data gone.
Proposed change: On Monday first-load, a one-line recap strip above the grid: "Last week: Xm Deep, Ym Comms, Zm CI accepted." Dismissible. Requires one prior-week composition read.
Theme(s): T4.
Acceptance signal: Strip appears Monday morning when a prior-week composition exists; does not appear on other days or when no prior week exists.

**5. Anchor affordance on per-day Accept (T6)**
Problem: "Accept day" button is visually primary but "Accept all 5 days" in the footer is also primary. Two primary actions exist simultaneously.
Proposed change: "Accept all 5 days" is the page-level primary (filled, full-width in footer). Per-day "Accept day" buttons are secondary (ghost/outlined). No two primary-weight buttons are visible simultaneously.
Theme(s): T6.
Acceptance signal: Only one filled primary button is visible at any scroll position in the Week view.

### Out of scope for this page
- Week-level edit mode (drag-to-reorder days): not raised by any lens for this cycle.
- UpNextRail on Week (already imported via Week.js:23): no changes proposed; its behavior is correct per Design §8 theme 4.
- Individual activity editing within a day column: requires edit-mode infrastructure not in scope.
- Weekly Reflection trigger: owned by Kaizen page; Week surfaces the "Friday reflection ready" nudge only.
Re-open trigger: if Weekly Reflection is promoted to a Week-page modal.

### Acceptance criteria
1. Week header renders h1 + bucket-total status chip + one primary action when a weekly composition exists.
2. Empty state renders h1 + two-sentence copy with a named next step; day-0–6 users see a day-band prefix.
3. Bucket chip classes on Week derive from the same source as Today; changing `:root` bucket tokens changes both pages.
4. "Accept all 5 days" is the only filled primary button visible at any point in the page; per-day Accepts are ghost.
5. On Monday with a prior-week composition, a prior-week delta strip renders above the grid and is dismissible.

---

## Page: Portfolio

### Current state
- Portfolio.js:160–169 — `pf-page-header` renders h1 "Project Portfolio" + "New Opportunity" button; no status signal (active project count, open opportunity count).
- Portfolio.js:189–203 — Validated Kaizens section empty state: "No validated Kaizens yet. Close a Kaizen to see it here." No CTA embedded; user must navigate to Kaizen page manually.
- Portfolio.js:218–268 — Projects section groups by project-type; KaizenCard shows DRAFT/ACTIVE/IN_REMEASUREMENT state but no time-elapsed or remeasurement-due signal (Growth §8, PM §7).
- Portfolio.js:280–328 — Opportunities section has filter + sort controls but no named empty-state recovery path (OPPORTUNITIES_EMPTY is one sentence with no embedded CTA).

### Theme application matrix
| Theme | Apply? | How | Effort | Risk | Dependency |
|---|---|---|---|---|---|
| T1 Bucket-Tone Token Consistency | PARTIAL | KaizenCard bucket tags should reference `:root` tokens; validate after T1 ships on Today | S | Low | T1 prerequisite |
| T2 Stateful Card Mode | PARTIAL | KaizenCard already has expand/collapse; apply single-focus rule (only one expanded at a time — already enforced via `expandedKaizenId`) | NO | — | Already correct |
| T3 Closure Ritual | PARTIAL | Validated Kaizens section: add a "next step" CTA per Growth §8: "Ready for your next Kaizen? Friday's reflection is where the next candidate surfaces." | S | Low | None |
| T4 Morning Bridge | NO | Portfolio is not a daily-entry surface; prior-day bridge does not apply | NO | — | — |
| T5 Empty-State Warmth Ladder | YES | ACTIVE_EMPTY, OPPORTUNITIES_EMPTY, VALIDATED_EMPTY all lack embedded CTAs; add one named next step to each | S | Low | None |
| T6 Anchor + Secondary Affordance | YES | "New Opportunity" is the only page-level primary CTA; filter/sort controls are secondary; validate no two primary-weight CTAs compete | S | Low | None |
| T7 Page Header Trio | YES | Add a status signal: "N active projects · M open opportunities" between h1 and the New Opportunity button | S | Low | None |
| T8 Drawer Pattern | YES | OpportunityIntakeForm already uses `role="dialog"` (Portfolio.js:158); apply `aria-modal="true"` + `aria-labelledby` + focus trap | M | Medium | QA §8 pattern 3 |
| T9 Day-Band Onboarding | NO | Portfolio is not a daily ritual; day-band copy does not apply | NO | — | — |
| T10 Append-Only Variance | YES | Closed/Rejected opportunities remain visible in the list with muted treatment; not hidden when filter is "All" | S | Low | CSS only |

### Proposed deltas (ranked)

**1. Portfolio header status signal (T7)**
Problem: `pf-page-header` has h1 + button but no status. User cannot see the project portfolio shape at a glance.
Proposed change: Add a status line: "N active · M open opportunities · K validated" between h1 and the New Opportunity button. Uses already-available array lengths.
Theme(s): T7.
Acceptance signal: Header shows three counts when data exists; counts omit zero values (e.g., "2 active · 5 opportunities" when no validated Kaizens exist).

**2. Empty-state warmth (T5)**
Problem: All three section empty strings name the empty state but do not name the next step or link to the right action.
Proposed change: ACTIVE_EMPTY adds "Promote an opportunity below to start one." OPPORTUNITIES_EMPTY adds a "New Opportunity" inline link or button. VALIDATED_EMPTY adds "Close your first Kaizen on the Kaizen page."
Theme(s): T5.
Acceptance signal: Each empty state has a distinct named next step. No empty state ends with a period and nothing else.

**3. Validated Kaizens next-step CTA (T3)**
Problem: A user who views a closed Kaizen with a successful result has no prompt to start the next one. Growth §8 identifies this as a pull-back opportunity.
Proposed change: Below the last ValidatedKaizenCard (or at section bottom), add a single-line CTA: "Ready for your next improvement? Friday's reflection surfaces the next candidate."
Theme(s): T3.
Acceptance signal: CTA appears when at least one validated Kaizen exists; does not appear on empty state (empty state has its own copy).

**4. Intake modal a11y (T8)**
Problem: OpportunityIntakeForm uses `role="dialog"` but lacks `aria-modal="true"` and `aria-labelledby`. Focus is not trapped when the modal is open (QA §8 pattern 3).
Proposed change: Add `aria-modal="true" aria-labelledby="[h2 id]"` to the modal root element. Wire focus trap at the `OPP_OPEN_INTAKE` handler in app.js. Restore focus to "New Opportunity" button on close.
Theme(s): T8.
Acceptance signal: Tab within an open intake modal does not reach elements outside it. Escape closes the modal and focus returns to the trigger button.

**5. KaizenCard time-elapsed signal (Growth §8)**
Problem: KaizenCard shows ACTIVE/IN_REMEASUREMENT state but no "N days since activation · remeasurement by [date]" signal. Users miss the remeasurement window without navigating away.
Proposed change: Add a single inline line to the ACTIVE KaizenCard: "Active for N days. Remeasurement suggested by [date]." Uses `activatedAt` + a configurable remeasurement offset.
Theme(s): T5 (contextual state), T7 (status signal).
Acceptance signal: ACTIVE KaizenCard renders elapsed days and a suggested remeasurement date. DRAFT cards do not render this line.

### Out of scope for this page
- Kaizen promotion flow from Portfolio: owned by Kaizen page.
- Drag-to-prioritize opportunities: anti-theme A4 (drag as primary interaction).
- Portfolio-level analytics KPIs: owned by InsightsPortfolio.
- Social sharing of project status: anti-theme A6.
Re-open trigger: if Portfolio is designated as the primary Kaizen management surface (currently split with Kaizen page).

### Acceptance criteria
1. Portfolio header renders h1 + N-active / M-open / K-validated status counts + one primary "New Opportunity" button.
2. Each of the three sections renders a distinct empty state with a named next step.
3. ValidatedKaizens section renders a next-step CTA when at least one validated Kaizen exists.
4. OpportunityIntakeForm modal has `aria-modal="true"`, `aria-labelledby`, and Tab does not escape the modal.
5. ACTIVE KaizenCard renders elapsed days and a suggested remeasurement date.

---

## Page: Catalog

### Current state
- Catalog.js:47–52 — `cat-page-header` renders h1 + view-toggle (List / By bucket); no status signal (N entries enabled of M total) and no primary action beyond the view toggle.
- Catalog.js:62–76 — list-view empty state is a single `<p>` with no CTA and no day-band context.
- Catalog.js:78–97 — `renderListRow` renders a toggle On/Off as the dominant interaction; no visual hierarchy between the toggle (secondary configuration action) and the entry name (primary content).
- Catalog.js:80 — lock icon emoji (`🔒`) for non-optional entries; no aria-label or textual fallback for screen readers.

### Theme application matrix
| Theme | Apply? | How | Effort | Risk | Dependency |
|---|---|---|---|---|---|
| T1 Bucket-Tone Token Consistency | YES | `cat-list-bucket` span displays bucket label as text; CatalogBucketView group headers should reference `:root` bucket tokens for any color coding | S | Low | T1 prerequisite |
| T2 Stateful Card Mode | PARTIAL | Toggle On/Off is the interaction; apply single-active-row chrome if a per-entry detail expand is added | FUTURE | — | — |
| T3 Closure Ritual | NO | Catalog is configuration, not execution; closure does not apply | NO | — | — |
| T4 Morning Bridge | NO | Catalog is not a daily-entry surface | NO | — | — |
| T5 Empty-State Warmth Ladder | YES | CATALOG_COPY.EMPTY ("No catalog entries yet.") has no CTA; for a user who reaches the empty state, there is no named next step | S | Low | None |
| T6 Anchor + Secondary Affordance | YES | Toggle On/Off is the only action but non-optional items disable it. The disabled state should visually signal "locked by role" not "broken." The lock emoji needs a text alternative | S | Low | None |
| T7 Page Header Trio | YES | Add a status signal: "N of M entries enabled" between h1 and the view toggle | S | Low | None |
| T8 Drawer Pattern | NO | No drawer exists on Catalog | NO | — | — |
| T9 Day-Band Onboarding | PARTIAL | On day 0–3, Catalog empty state could note: "Enable the activities that match your role — the composer draws from enabled entries only." One-time contextual nudge | S | Low | `daysSinceSignup` prop needed |
| T10 Append-Only Variance | NO | Catalog is not a time-bound execution surface | NO | — | — |

### Proposed deltas (ranked)

**1. Catalog header status signal (T7)**
Problem: User cannot tell at a glance how many entries are enabled vs available. Returning to Catalog to check configuration requires scanning the list.
Proposed change: Add "N of M entries enabled" between the h1 and the view toggle. Uses `entries.filter(e => e.enabledByUser !== false).length` over `entries.length`.
Theme(s): T7.
Acceptance signal: Header count reflects current enable state. Toggling an entry updates the count after re-render.

**2. Non-optional entry affordance (T6)**
Problem: Lock emoji (`🔒`) on non-optional entries has no aria-label (QA §1 pattern). Toggle button is `disabled` but visually similar to an enabled toggle; disabled state could read as "Off" rather than "locked."
Proposed change: Replace emoji with a `<span aria-label="Required — cannot be disabled" class="cat-list-lock-icon">` SVG or character. Change disabled toggle label from "On" to "Required" or "Locked."
Theme(s): T6.
Acceptance signal: Screen reader announces "Required — cannot be disabled" for non-optional entries. Toggle label reads "Required" not "On" for locked items.

**3. Empty-state warmth with day-band context (T5, T9)**
Problem: CATALOG_COPY.EMPTY has no CTA and no context. A new user who lands on an empty Catalog sees a dead end.
Proposed change: Extend to two sentences: "No catalog entries yet." + "Standard Work entries are seeded during setup — contact your administrator or check the seed pipeline." For day 0–3 users with entries present, add a contextual note above the list: "Enable the activities that match your role. The composer draws only from enabled entries."
Theme(s): T5, T9.
Acceptance signal: Empty state has a named next step. Non-empty state shows a day-band tip for users in day 0–3.

**4. Bucket label as chip with token color (T1)**
Problem: `cat-list-bucket` is a plain text span. Bucket identity on Catalog is text-only while Today and Week use colored chips. Competitive §8 notes Akiflow's slot-based grouping by bucket as a borrowable pattern.
Proposed change: Apply the same `chip-project / chip-communication / chip-ci` class to `cat-list-bucket` using the shared `bucketMeta()` helper (when T1 ships). No layout change — only add the class.
Theme(s): T1.
Acceptance signal: Bucket labels in Catalog list view render with the same background/foreground token as Today's activity chips.

### Out of scope for this page
- Adding a verb-forward CTA ("Add to today's plan"): divergence call in UX_DESIGN_THEMES §3.2 defers this to a Catalog-specific pass.
- Quick-capture inbox (Akiflow pattern): Competitive §6 rank 2 rates this M effort; not raised by 7 lenses as a Today-review finding.
- Per-entry procedure detail or output schema display: already rendered via `renderEntryDetails` (Catalog.js:99+); no change proposed.
- Activity number sorting: already implemented (Catalog.js:67–72).
Re-open trigger: if Catalog is designated as a workflow entry point (not just configuration).

### Acceptance criteria
1. Catalog header renders h1 + "N of M entries enabled" + view toggle; count updates after any toggle action.
2. Non-optional entries render a screen-reader-accessible "Required" label; toggle button reads "Required" not "On."
3. Empty state has a named next step. Non-empty state shows a day-band tip for day 0–3 users.
4. Bucket labels in list view carry the same `chip-*` class as Today chips after T1 ships.
5. No regression on existing toggle On/Off behavior for optional entries.

---

## Page: Kaizen

### Current state
- Kaizen.js:74–86 — empty state renders h1 "Kaizen" + h2 "No active Kaizen" + body copy + "Start Weekly Reflection" button + open friction signals. This is the strongest empty state across all pages — it has a CTA and context.
- Kaizen.js:88–96 — non-empty state header renders h1 + "Start Weekly Reflection" button only when no active Kaizen exists; when an active Kaizen exists, the header has h1 only (no status signal, no primary action).
- Kaizen.js:56–61 — `activeBlock` renders an h2 + KaizenCard; KaizenCard has no time-elapsed or remeasurement-due signal (Growth §8, PM §6 rank 5).
- Kaizen.js:62–71 — `draftBlock` renders h2 + draft KaizenCards; no count signal in header ("Drafts" with no number).

### Theme application matrix
| Theme | Apply? | How | Effort | Risk | Dependency |
|---|---|---|---|---|---|
| T1 Bucket-Tone Token Consistency | PARTIAL | Kaizen phase tags should reference `:root` tokens if they carry bucket color; validate after T1 ships | S | Low | T1 prerequisite |
| T2 Stateful Card Mode | YES | KaizenCard baseline-lock step: when the lock form is open, other page content dims; only the lock field is active | S | Low | None |
| T3 Closure Ritual | YES | When a Kaizen moves to IN_REMEASUREMENT, surface a contextual strip: "Kaizen complete — capture your remeasurement to validate the result." | S | Low | None |
| T4 Morning Bridge | NO | Kaizen is not a daily-entry surface | NO | — | — |
| T5 Empty-State Warmth Ladder | PARTIAL | Empty state is already the strongest in the product; minor refinement: add a "N open friction signals queued" count to the empty state copy when `openSignals.length > 0` | S | Low | None |
| T6 Anchor + Secondary Affordance | YES | When an active Kaizen exists, the header has only h1 and no primary action. Add a state-driven primary CTA: "Capture remeasurement" (IN_REMEASUREMENT) or "Lock baseline" (DRAFT-with-filled-goal) | S | Low | None |
| T7 Page Header Trio | YES | Active Kaizen state: header has h1 but no status signal and no primary action. Add status: "Active: [Kaizen title]" and a primary CTA per state | S | Low | None |
| T8 Drawer Pattern | PARTIAL | WeeklyReflectionWizard is already a modal; apply `aria-modal="true"` + `aria-labelledby` if not already present | S | Low | QA §8 pattern 3 |
| T9 Day-Band Onboarding | YES | On day 0–13 empty state, add a day-band nudge: "Week 1 — capture friction signals this week; they become your first Kaizen candidate on Friday." Per Growth §9 day 3 and 7 bands | S | Low | `daysSinceSignup` prop needed |
| T10 Append-Only Variance | YES | Completed KaizenCard steps should remain visible with a struck/muted treatment, not hidden when done | S | Low | CSS only |

### Proposed deltas (ranked)

**1. State-driven primary CTA in header (T6, T7)**
Problem: When an active Kaizen exists, Kaizen.js:88–96 renders h1 only if `active` is truthy. No primary action appears. Users must find the CTA inside the KaizenCard itself.
Proposed change: Add a state-driven primary button to the header: if active Kaizen state is ACTIVE → "Lock remeasurement date"; if IN_REMEASUREMENT → "Capture remeasurement"; if DRAFT with a goal written → "Lock baseline." Button data-action matches existing handlers.
Theme(s): T6, T7.
Acceptance signal: Kaizen header always renders h1 + a status label + one state-appropriate primary CTA regardless of whether a Kaizen exists.

**2. Time-elapsed + remeasurement signal on KaizenCard (T5, Growth §8)**
Problem: ACTIVE KaizenCard shows state and title but no "N days since activation · remeasurement by [date]" signal. Users miss the remeasurement window (PM §6 rank 5, Growth §8).
Proposed change: Add an inline metadata line below the Kaizen title on ACTIVE cards: "Active for N days · Remeasurement suggested by [date]." Date is computed from `activatedAt + remeasurementOffsetDays` (constant per project type).
Theme(s): T5.
Acceptance signal: ACTIVE KaizenCard renders elapsed days and a suggested remeasurement date. Date turns red when it has passed.

**3. Closure strip for IN_REMEASUREMENT (T3)**
Problem: No visual signal when a Kaizen transitions to IN_REMEASUREMENT that action is required. Growth §8 and PM §6 rank 5 both flag this.
Proposed change: When `activeKaizen.state === 'IN_REMEASUREMENT'`, render a non-blocking strip above the KaizenCard: "Remeasurement captured — capture the result to validate this Kaizen and close it."
Theme(s): T3.
Acceptance signal: Strip appears when and only when state is IN_REMEASUREMENT. It does not appear in ACTIVE or DRAFT states.

**4. Day-band nudge in empty state (T9)**
Problem: Empty state for a day-3 user looks identical to a day-30 user. Growth §9 specifies day-3 and day-7 copy that belongs here.
Proposed change: Extend `KAIZEN_COPY.EMPTY_BODY` to be day-band conditional: day 0–6 → "Capture friction signals this week using the Weekly Reflection. Three signals in week 1 is the target." Day 7–13 → "Your first Weekly Reflection is this Friday. That is where your first Kaizen candidate surfaces." Day 14+ → existing copy.
Theme(s): T9.
Acceptance signal: Empty state copy differs for day-0–6, day-7–13, and day-14+ users. Requires `daysSinceSignup` prop on Kaizen.

**5. Completed step visibility (T10)**
Problem: KaizenCard completed steps may be hidden or removed from view when done. No append-only visual treatment confirmed in source.
Proposed change: Completed steps remain in the step list with a muted/struck CSS treatment (matching `.sa-block.sa-state-closed` pattern from Today). Not removed on completion.
Theme(s): T10.
Acceptance signal: Completing a KaizenCard step does not remove it from the list. Completed steps render with reduced opacity or strikethrough.

### Out of scope for this page
- WeeklyReflectionWizard content or step structure: owned by that component's own spec.
- Kaizen promotion from Portfolio: owned by Portfolio page.
- DMAIC vs Kaizen Accelerator copy differentiation: project-type concern, not a theme-pass item.
- Social sharing of Kaizen results: anti-theme A6.
Re-open trigger: if Kaizen is merged with Portfolio as a single project command center.

### Acceptance criteria
1. Kaizen header always renders h1 + a status label (active Kaizen title or "No active Kaizen") + one state-appropriate primary CTA.
2. ACTIVE KaizenCard renders elapsed days and a suggested remeasurement date; date renders in a warning color when past.
3. IN_REMEASUREMENT state renders a non-blocking closure strip above the KaizenCard.
4. Empty state copy is day-band conditional; day-0–6, day-7–13, day-14+ each render distinct copy.
5. Completed KaizenCard steps remain visible with a muted/struck treatment.

---

## Page: InsightsPortfolio

### Current state
- InsightsPortfolio.js:130–146 — `ip-header` renders h1 + count chips + filter controls + two action buttons (Reset filters, Export CSV). Both action buttons appear at equal visual weight.
- InsightsPortfolio.js:131–135 — count chips ("Validated: N · Showing M" + "Total Annual Benefits: $X") are informational but not labeled as a status signal in the reading order.
- InsightsPortfolio.js:28–34 — two empty state strings: EMPTY (filter-match) and EMPTY_UNIVERSE (no universe). Neither has a next-step CTA.
- No `aria-labelledby` or `aria-modal` on any filter panel; filter controls are inline in the header rather than in a drawer.

### Theme application matrix
| Theme | Apply? | How | Effort | Risk | Dependency |
|---|---|---|---|---|---|
| T1 Bucket-Tone Token Consistency | PARTIAL | Validated Kaizen rows carry project-type labels; if bucket color is used in variance rows, ensure `:root` tokens are referenced | S | Low | T1 prerequisite |
| T2 Stateful Card Mode | NO | InsightsPortfolio is a read-only browsing surface; no edit state | NO | — | — |
| T3 Closure Ritual | YES | After the last validated Kaizen row, add a next-step CTA: "Ready for your next improvement? Friday's reflection surfaces the next candidate." Per Growth §8 | S | Low | None |
| T4 Morning Bridge | NO | Not a daily-entry surface | NO | — | — |
| T5 Empty-State Warmth Ladder | YES | Both empty strings lack next-step CTAs. EMPTY_UNIVERSE should link to Kaizen; EMPTY (filter-match) should offer "Reset filters" as a named action | S | Low | None |
| T6 Anchor + Secondary Affordance | YES | Export CSV and Reset filters are two equal-weight buttons. Export CSV is the primary action; Reset filters is secondary (ghost). | S | Low | None |
| T7 Page Header Trio | YES | h1 + count chips provide title and status; the reading order is correct but count chips lack `role` context. "Export CSV" is the primary action. Order is correct; minor: ensure Export CSV is the dominant visual button | S | Low | None |
| T8 Drawer Pattern | FUTURE | If filter controls are promoted to a drawer (filter count grows), apply DrawerShell | FUTURE | — | — |
| T9 Day-Band Onboarding | NO | InsightsPortfolio is a data surface, not an onboarding surface | NO | — | — |
| T10 Append-Only Variance | YES | PARTIAL-close-kind Kaizens should remain visible in the portfolio alongside SUCCESS; never hidden by default filter | S | Low | Filter default state |

### Proposed deltas (ranked)

**1. Export CSV as sole primary action; Reset filters as secondary (T6, T7)**
Problem: Reset filters and Export CSV render at equal visual weight in `ip-actions` (InsightsPortfolio.js:138–143). Reset filters is a secondary utility action; Export CSV is the page's primary deliverable.
Proposed change: Export CSV renders as a filled primary button. Reset filters renders as a ghost/text button. No change to data-actions.
Theme(s): T6, T7.
Acceptance signal: Only Export CSV renders with primary button styling. Reset filters renders as ghost. Visual hierarchy is testable via button class inspection.

**2. Empty-state warmth (T5)**
Problem: EMPTY_UNIVERSE ("No Validated Kaizens yet — close one with SUCCESS or PARTIAL to see it here.") has no link or CTA. EMPTY (filter-match) ("No Validated Kaizens match these filters yet.") has no "Reset filters" affordance.
Proposed change: EMPTY_UNIVERSE: add "Close your first Kaizen on the Kaizen page →" with a `data-route="kaizen"` link. EMPTY (filter-match): add a "Reset filters" inline button using the existing `IP_RESET_FILTERS` action.
Theme(s): T5.
Acceptance signal: EMPTY_UNIVERSE renders a Kaizen-page link. Filter-match empty state renders a Reset filters inline button. Neither empty state ends with a period and nothing else.

**3. Next-step CTA after portfolio (T3)**
Problem: Users who view their closed Kaizen portfolio have no pull toward the next improvement loop. Growth §8 identifies this as a retention moment.
Proposed change: Below the last ValidatedKaizenCard (or at page bottom when the list is non-empty), add one line: "Ready for your next improvement? Friday's reflection is where the next candidate surfaces." This is static copy, no new data.
Theme(s): T3.
Acceptance signal: CTA appears when `visibleRows.length > 0`. Does not appear on either empty state.

**4. Count chips as labeled status (T7)**
Problem: Count chips (`ip-count-chip`, `ip-benefits-chip`) are informational but carry no `aria-label` identifying what they represent to screen readers.
Proposed change: Add `aria-label="N validated Kaizens"` and `aria-label="Total annual benefits: $X"` to the respective chip spans.
Theme(s): T7.
Acceptance signal: Screen reader announces chip contents with meaningful labels. Visual appearance unchanged.

**5. PARTIAL close-kind visible by default (T10)**
Problem: If the default filter state excludes PARTIAL close-kind, users do not see partial-success Kaizens without toggling a filter. Append-only visibility principle requires all records visible by default.
Proposed change: Confirm that the default `filterSet` includes both SUCCESS and PARTIAL. If the default excludes PARTIAL, change the default to include it. Verified via `parseFilterQuery` behavior.
Theme(s): T10.
Acceptance signal: On first page load with no locationHash, both SUCCESS and PARTIAL Kaizens render. Filter toggle state reflects "both on" as the default.

### Out of scope for this page
- Statistical significance badge (`TODO(E15)` in InsightsPortfolio.js:6): deferred to E15.
- Sparkline or week-over-week delta chart (Reclaim.ai comparator pattern): Competitive §8 borrowable pattern; not raised in the 7 lenses as a Today-review finding.
- Lead user filter behavior: already implemented; no change proposed.
- CSV export format: Analytics agent owns the payload; no UX change proposed.
Re-open trigger: if InsightsPortfolio is promoted to the product's primary KPI dashboard.

### Acceptance criteria
1. Export CSV renders as primary filled button; Reset filters renders as ghost button; visual hierarchy testable by class.
2. EMPTY_UNIVERSE renders a Kaizen-page link. Filter-match empty state renders an inline Reset filters action.
3. Next-step CTA renders below the portfolio list when `visibleRows.length > 0`.
4. Count chips carry `aria-label` attributes readable by screen readers.
5. Default filter state includes both SUCCESS and PARTIAL; both render on first page load without any filter interaction.

---

## Cross-Page Sequencing Recommendation

1. **Week** — Closest behavioral sibling to Today; shares UpNextRail, bucket chips, and the composition contract. T1 token fix is most impactful here and validates the shared `bucketMeta()` helper before it travels further. T7 status signal on Week is the fastest way to show the Page Header Trio pattern working across two pages.

2. **InsightsPortfolio** — Smallest delta surface (mostly T5, T6, T7). Can be completed in a single loop. Shipping the next-step CTA and empty-state warmth here closes the improvement loop from Kaizen → Portfolio → InsightsPortfolio, which is the product's highest-value retention path.

3. **Portfolio** — Three distinct sections (Projects, Opportunities, Validated Kaizens) each need T5 and T7 treatment. The intake modal a11y fix (T8) is the highest-risk item and should ship in this loop. KaizenCard time-elapsed signal is the most user-visible behavioral improvement.

4. **Kaizen** — State-driven primary CTA (T6/T7) and day-band empty state (T9) are the highest-leverage changes. Kaizen is also the page where T3 (Closure Ritual) first appears outside Today, establishing the pattern for other pages.

5. **Catalog** — Smallest behavioral delta. Configuration-only surface. T1 bucket chip classes and T7 status count are S effort. Save for last; Catalog's UX is stable relative to the other pages.

---

## Total Effort Estimate

| Theme pass | S items | M items | L items |
|---|---|---|---|
| Week | 4 | 1 | 0 |
| InsightsPortfolio | 5 | 0 | 0 |
| Portfolio | 3 | 2 | 0 |
| Kaizen | 4 | 1 | 0 |
| Catalog | 4 | 0 | 0 |
| **Total** | **20** | **4** | **0** |

BAM-X capacity assumption: 24h/week, treating S = 1–2h, M = 4–6h, L = 8–12h.
- 20 S items at 1.5h average = 30h
- 4 M items at 5h average = 20h
- Total: ~50h across all 5 pages

At 24h/week capacity, this is approximately 2 improvement loops (2 weeks). Recommended: run 3 loops of ~17h each to allow for test updates and QA review per loop.

Recommended improvement loops:
- Loop A: T1 (token fix, prerequisite) + Week + InsightsPortfolio (~16h)
- Loop B: Portfolio + Kaizen (~20h)
- Loop C: Catalog + cross-page a11y pass (T8 focus traps, T7 aria-labels) + QA regression (~14h)
