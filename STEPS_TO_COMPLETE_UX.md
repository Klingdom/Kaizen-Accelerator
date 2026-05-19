# STEPS_TO_COMPLETE_UX.md
# Steps to Complete — UX Specification for BlockDetailDialog

**Author:** UX Designer subagent
**Date:** 2026-05-18
**Scope:** Steps section inside BlockDetailDialog for PROJECT and CI blocks; single-line guidance for COMMUNICATION

---

## 1. Visual Design

### Heading Font and Size

Use Geist (body font, `var(--font-sans)`), not Instrument Serif or DM Serif Display.
The dialog title (`bdd-title`) already uses `var(--font-display)` at 18px. The steps heading must be subordinate — a section label, not a competing title.

- Font: `var(--font-mono)` — same as `.bdd-label` (11px, uppercase, `--ink-400`, `letter-spacing: 0.06em`)
- This matches the existing label row pattern exactly. The steps heading visually reads as another detail row label, which is correct — it is.
- No new typographic style introduced.

### Heading Copy — Three Candidates

1. "How to complete" — reads like a tooltip instruction, slightly patronizing
2. "Steps" — too terse; gives the user no context for what kind of steps
3. "Steps to complete" — direct, matches the product voice, tells the user what the list is for without preamble

**Selected: "Steps to complete"**

Rationale: Phil's voice is direct and specific. "Steps to complete" describes the list's function without softening it ("guidance") or inflating it ("How to achieve this"). It mirrors the section header pattern already in the dialog (`bdd-label` rows like "Who's involved", "What kicks this off"). Three words. No verb hedging.

### List Format

**Format: numbered list (`<ol>`)**

Not checkboxes. Reason: Phase 1 is reference-only. Checkboxes with no persistence state create a false affordance — the user checks them and the next time they open the dialog they are unchecked. This is worse UX than showing nothing interactive. Numbered list communicates sequence without implying state.

Not unordered list. Steps have an implied order — numbered reinforces that the user should do them in sequence, which is the goal of standard work.

**Item spacing: compact**

Each `<li>` gets `margin-bottom: 4px` with `line-height: 1.45`. The dialog is a popover, not a document. Comfortable spacing (8px between items) will force scroll on any list longer than 5 items in a 360px-wide panel. 4px is readable and doesn't bloat the panel.

**Optional steps visual treatment:**

Optional steps are rendered in `var(--text-muted)` (the dimmer of the two secondary tokens) with a parenthetical suffix: "(optional)". Do not use italics alone — italics are a style signal but carry no semantic weight for screen readers. The parenthetical is both visible and readable by assistive tech.

Example: `3. Write test cases for edge path (optional)`

The `(optional)` string is part of the text node, not a separate element. This avoids aria complexity and renders cleanly in Geist at 13px.

### Per-Bucket Color Treatment

The steps section stays **neutral** — it does not adopt the block's bucket color (green/yellow/purple).

Reason: The color bar at the top of the dialog already signals bucket identity. Repeating the color in the steps section creates a third instance of the same signal (block fill, color bar, and now steps heading). The steps section is informational content, not a bucket badge. Neutral treatment keeps the section subordinate to the activity name and time row.

The step text uses `var(--fg)` (primary text). The heading label uses `var(--ink-400)` uppercase mono, same as other `bdd-label` instances.

---

## 2. Information Hierarchy in the Dialog

Current stack (post-Iter 47):

```
1. Color bar
2. [Header] Activity name (h2, bdd-title)
3. [Body / dl] Time
4. [Body / dl] Expected output (when present)
5. [Body / dl] Who's involved (COMM only, when present)
6. [Body / dl] What kicks this off (COMM only, when present)
7. [Body / dl] Kaizen (when linked)
8. [Rationale section] Rationale sentence (COMM, CI ceremonies, EoAR)
9. [Footer] Edit button or Start Reflection button
```

**Proposed stack with steps section:**

```
1. Color bar
2. [Header] Activity name (h2, bdd-title)
3. [Body / dl] Time
4. [Body / dl] Expected output (when present)
5. [Body / dl] Who's involved (COMM only)
6. [Body / dl] What kicks this off (COMM only)
7. [Body / dl] Kaizen (when linked)
8. [Steps section] Steps to complete — numbered list (PROJECT, CI)
              OR  Communication guidance — single line (COMM)
9. [Rationale section] Rationale sentence (COMM, CI ceremonies, EoAR)
10. [Footer] Edit button or Start Reflection button
```

**Justification:** Steps appear after the identity rows (time, output, participants) and before the rationale sentence. This ordering matches reading intent: the user first knows what the activity is, when it happens, and who it involves — then they see how to execute it, then they see any system commentary (rationale). Steps are actionable content; rationale is contextual commentary. Actionable content precedes commentary.

The steps section is outside the `<dl>` element. It gets its own `<section class="bdd-steps-section">` wrapper to avoid forcing the list into a definition list pattern, which is semantically wrong.

---

## 3. Empty States

**PROJECT with no `completionSteps` defined:**
> No steps defined for this work type yet.

**CI with no `completionSteps` defined:**
> No steps defined for this improvement activity yet.

**User-added activity with no catalog entry (no `catalogEntry` prop passed):**
> No standard steps defined. Add steps to make this repeatable.

Tone notes: Each line is a statement of fact followed by a one-clause call to action or neutral observation. No apology ("Sorry, no steps..."). No excessive padding ("This section will show steps when..."). Phil's voice: state the condition, state what it means or what to do.

Empty state text uses `.bdd-steps-empty` class: font-size 0.8rem, color `var(--text-muted)`, font-style italic. Italic is acceptable here because this is a clearly labeled null state, not step content — the semantic role is different from optional step items.

---

## 4. COMMUNICATION Single-Line Treatment

COMM blocks do not get a numbered step list. They get a single prose guidance string sourced from `catalogEntry.communicationGuidance` (a new field to be added to the catalog schema). If none is defined, fall through to the rationale sentence that already exists in Iter 47.

**Heading:** "Communication guidance" — not "How to communicate". Same typographic style as "Steps to complete": `var(--font-mono)`, 11px, uppercase, `--ink-400`.

Rationale for "Communication guidance" over "How to communicate": it is a noun phrase (consistent with all other bdd-label headings) rather than an instruction (verb phrase). Every existing label in the dialog is a noun phrase: "Time", "Expected output", "Who's involved", "What kicks this off". "How to communicate" breaks that pattern.

**Visual weight:** Same weight as a steps-section empty state — lighter than the numbered list. Single `<p>` element inside `.bdd-steps-section` using `var(--text-secondary)` at 0.875rem, no italic. This is a guidance sentence, not a null state.

**Empty state when no `communicationGuidance` is defined:**

Do not render the section at all. The rationale sentence (Iter 47's COMM rationale — "Start-of-day high-value communication.", etc.) already fills this semantic slot. Adding a second empty section underneath the rationale adds noise. Rule: if `communicationGuidance` is null or absent, skip the `.bdd-steps-section` entirely for COMM blocks.

---

## 5. Long-List Behavior

**Max-height before scroll: 160px**

At 4px item spacing and 1.45 line-height on 13px text, a single-line step item is approximately 23px tall. 160px fits approximately 6–7 single-line steps before scroll. This is the right threshold: most standard work is 3–7 steps. If a catalog entry has 10+ steps, the section scrolls internally with `overflow-y: auto` on `.bdd-steps-list`.

Do not truncate with "show more". A "show more" toggle inside a popover dialog that is already scroll-capable is a navigation trap — the user must scroll, click, and re-scroll. Internal scroll on the `<ol>` element is simpler and keeps all steps accessible without an extra interaction.

**The dialog panel itself does not scroll.** The steps list scrolls internally. The footer (Edit button) must remain pinned and always visible. If the `.bdd-panel` were allowed to grow unboundedly, the Edit button could fall below the viewport on small screens or short windows. Containing the scroll to the list preserves the footer visibility guarantee.

CSS values:
```css
.bdd-steps-list {
  max-height: 160px;
  overflow-y: auto;
  padding-right: 4px; /* prevent scrollbar from clipping text */
}
```

---

## 6. Accessibility

### Heading Level

The dialog uses `<h2 class="bdd-title" id="bdd-title">` for the activity name. The steps heading must be `<h3>` — one level below, because the steps section is a subdivision of the dialog's content, not a peer of the activity name.

```html
<h3 class="bdd-steps-heading">Steps to complete</h3>
```

Do not use a `<dt>` element for this heading. `<dt>` belongs inside `<dl>` and carries definition-list semantics. The steps section lives outside the `<dl class="bdd-body">`, so the heading must be a proper `<h3>`.

### List Element

Use `<ol>` for PROJECT and CI steps. Use `<ul>` only if the steps are explicitly unordered (none are in Phase 1). Do not use `<div>` with manual numbering.

### Optional Steps ARIA

Optional steps include the parenthetical `(optional)` in the text node. This is sufficient — screen readers read the full text node. Do not add `aria-label="optional step"` as an attribute — that would override the visible text, creating a mismatch between what is spoken and what is visible. The parenthetical approach is both visible and machine-readable.

### Reduced Motion

The steps section has no entrance animation in Phase 1. It is static content revealed when the dialog opens. The dialog's own `dialogEnter` animation (`app.css:3610`) already respects `data-motion="reduced"` via the blanket suppression at `app.css:3958–3965`. No additional motion handling needed for the steps section.

If a future iteration adds a step-reveal stagger animation, it must be wrapped in:
```css
@media (prefers-reduced-motion: no-preference) {
  /* stagger keyframes here */
}
```
and guarded by `[data-motion="reduced"]` overrides.

### Dark Mode Contrast — Optional Step Dimming

The optional step text uses `var(--text-muted)`. Per the R3 audit (Improvement 2), use `var(--text-muted)` not `var(--color-text-secondary, #6b7280)`. The latter is not declared in the dark theme overrides and will fall back to mid-gray on dark surfaces, potentially failing contrast.

`--text-muted` in dark mode maps to `#57534e`-equivalent on a `--surface-1` dark background — verify against the project's T1 token declarations before shipping. The R3 audit confirmed the `var(--text-secondary, #57534e)` fix for `.bdd-rationale` at `app.css:743`. Use the same corrected token.

---

## 7. Per-Type Render Spec

| Type | Section shown | Heading | Format | Empty state copy |
|---|---|---|---|---|
| PROJECT | Yes | "Steps to complete" | `<ol>` numbered list, `<h3>` | "No steps defined for this work type yet." |
| COMMUNICATION | Yes (if `communicationGuidance` present) | "Communication guidance" | Single `<p>`, `var(--text-secondary)` | Omit section entirely — rationale sentence covers it |
| CI | Yes | "Steps to complete" | `<ol>` numbered list, `<h3>` | "No steps defined for this improvement activity yet." |
| LUNCH | No | — | — | — |
| PROTECTED | No | — | — | — |

Note on PROTECTED: Protected blocks (EoAR, sprint ceremonies, standup) are system-defined rituals with fixed behaviors. Showing step lists for them would imply user-driven execution variability that does not exist. The rationale sentence already covers their purpose. Steps are omitted entirely.

Note on user-added activity without a catalog entry: The `catalogEntry` prop will be null. Both PROJECT and CI paths fall to the null-catalog empty state: "No standard steps defined. Add steps to make this repeatable."

---

## 8. Visual Risks

### Risk 1: Dialog height grows unboundedly

Mitigated by Section 5. The `<ol>` has `max-height: 160px; overflow-y: auto`. The `bdd-panel` keeps its `max-width: 360px` and does not gain a max-height constraint — instead the list is the pressure valve. Footer remains pinned at bottom of panel.

### Risk 2: Optional step dim styling fails dark mode contrast

Mitigated by using `var(--text-muted)` (verified T1 token) not `var(--color-text-secondary, #6b7280)` (non-theme token). This is the same class of bug documented in R3 Improvement 2 for `.bdd-rationale`. Do not repeat it here. QA must verify the optional step color in dark mode before shipping.

### Risk 3: Long step text wrap and clip

Step text wraps to multiple lines inside the `<li>` — this is correct behavior. Do not clip with `text-overflow: ellipsis`. A clipped step is useless; a wrapped step is readable. The list's internal scroll accommodates tall items. The `padding-right: 4px` on `.bdd-steps-list` ensures the scrollbar does not overlap the last character of long lines.

### Risk 4: Steps section renders on user-added COMM blocks

COMM gets the section only when `communicationGuidance` is non-null on the catalog entry. User-added COMM without a catalog entry has no `communicationGuidance` — section is omitted. Guard in the render function: `if (isComm && catalogEntry?.communicationGuidance)`.

---

## 9. Mock — Verbal Wireframe

The following describes a PROJECT block with 4 steps and a linked Kaizen. Width: 360px.

```
┌──────────────────────────────────────────┐
│▓▓▓▓ [4px green gradient bar] ▓▓▓▓▓▓▓▓▓▓▓│  ← bdd-color-bar-project
├──────────────────────────────────────────┤
│ Write Investor Brief          [×]         │  ← h2 bdd-title (DM Serif Display 18px)
│                                           │  ← bdd-header, border-bottom
├──────────────────────────────────────────┤
│ TIME          09:00–10:00 (60 min)        │  ← bdd-label + bdd-value
│ EXPECTED OUTPUT  Investor deck draft      │
│ KAIZEN        [Series A Prep ●]           │  ← bdd-kaizen-chip
├──────────────────────────────────────────┤
│ STEPS TO COMPLETE                         │  ← h3, font-mono 11px uppercase ink-400
│  1. Pull last month's financials          │  ← ol li, geist 13px, var(--fg)
│  2. Draft executive summary              │
│  3. Write market opportunity section      │
│  4. Proofread and export PDF             │
│     (steps list scrolls if > ~7 items)   │
├──────────────────────────────────────────┤
│ [Edit]                                    │  ← bdd-footer, border-top
└──────────────────────────────────────────┘
```

Empty state variant (no steps defined):

```
├──────────────────────────────────────────┤
│ STEPS TO COMPLETE                         │
│  No steps defined for this work type yet. │  ← bdd-steps-empty, italic, text-muted
├──────────────────────────────────────────┤
```

COMMUNICATION block with guidance:

```
├──────────────────────────────────────────┤
│ COMMUNICATION GUIDANCE                    │  ← h3, same label style
│  Keep to 3 items max. Drive to decision.  │  ← p, text-secondary, 0.875rem
├──────────────────────────────────────────┤
│  Quick sync on yesterday → today →        │  ← bdd-rationale-section (existing)
│  blockers.                                │
├──────────────────────────────────────────┤
```

---

## Assumptions for Engineering

1. `CatalogEntry` schema must gain two new optional fields: `completionSteps: string[]` and `communicationGuidance: string`. Neither is required; absence is the empty state.

2. Optional steps are identified by the presence of the string `"(optional)"` in the step text itself (author-time convention) OR by a future `isOptional: boolean` per-step object. Phase 1: string convention. Rendering logic strips nothing — displays the step text as authored.

3. The `BlockDetailDialog` component receives `catalogEntry` as a prop (already established in Iter 46 Phase 1). No new prop is needed. Steps are read from `props.catalogEntry?.completionSteps ?? null`.

4. PROTECTED blocks are detected via `isProtectedBlock(activity)` (already in scope at `BlockDetailDialog.js:189`). This guards the PROTECTED skip without additional logic.

5. User-added activities with no catalog entry: `props.catalogEntry` will be null. The null-catalog empty state copy applies to PROJECT and CI buckets. COMM with no catalog entry skips the section entirely.
