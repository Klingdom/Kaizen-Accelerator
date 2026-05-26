# Product Name — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-05-26_

---

## 0. Source Artifacts

| Lens | Artifact | Top Pick |
|---|---|---|
| Growth Strategist | `PRODUCT_NAME_GROWTH.md` | **Standa** (names the standard-work moat) |
| Market Research | `PRODUCT_NAME_RESEARCH.md` | **Cadex** (invented portmanteau; highest brand ceiling) |
| Product Manager | `PRODUCT_NAME_PM.md` | **No name pick** — flags structural decision must come first |

**Lens count: 3 → ConvergenceBonus cap = +3**

---

## 1. Phil's Directive

> "The subagents should get together and create a cohesive product/tool name."

Current state: **4 names across user-facing surfaces.** Production brand fragmentation.

---

## 2. THE GATE — Structural Decision Must Come First (PM Lens)

All 3 lenses converge on this: **Phil must decide one-brand-or-two BEFORE picking a name.**

PM identifies that the repo contains **two distinct products** that don't currently interact:

1. **Kaizen Accelerator** — $20K/$35K productized consulting engagement (10 marketing HTMLs; sales funnel; Phil delivers personally; no app attached)
2. **CadencePlan** — standalone SPA (85-entry standard-work catalog, Today calendar, composer, kaizen tracking; no monetization, no intake, no connection to consulting)

**Three structural options:**

| Option | Description | Implication |
|---|---|---|
| **A. One name, both products** | Single master brand covers consulting + SaaS (e.g., "[Name]" = product; "[Name] Accelerator" = consulting tier) | Linear / Notion model. Cleanest brand. Highest investment in one identity. |
| **B. Parent + sub-brand** | One parent name; consulting becomes "[Parent] Accelerator"; app becomes "[Parent]" or "[Parent] Plan" | PM's recommendation. Matches Notion + Notion AI pattern. Best fit for solo operator. |
| **C. Two separate brands** | Consulting practice has one name (could remain "Kaizen Accelerator"); app has its own name; they reference each other | Doubles marketing surface. Hard for solo operator to sustain. |

**PM recommends Option B.** Growth + Market implicitly assume Option A/B (their candidates apply to a unified brand).

---

## 3. CONVERGENT — Decisions All 3 Lenses Agree On

### 3.1 BAM-X must die externally
**3/3 lenses agree.** Internal codename only. Not viable as market brand. Weak prefix, possible trademark collision with "BAM" entities. Drop from every user-facing surface.

### 3.2 "Kaizen" carries trademark risk
**3/3 lenses agree.** Kaizen Institute (global consulting firm) holds marks in multiple jurisdictions AND markets a product called "Kaizen Accelerator" — direct name conflict with current marketing brand. Cease-and-desist risk is material at any scale.

### 3.3 "BAM-X Kaizen OS" combines two risks
Worst of both worlds. Drop entirely (package.json + design previews + internal docs).

### 3.4 The right naming pattern is short + invented (4–8 chars)
Growth and Market converge: Linear / Notion / Mem / Tana model. Descriptive compounds (CadencePlan, Kaizen Accelerator, Productboard) cap brand ceiling at "feature-name energy." This product's differentiation is structural (4-2-2 invariant, deterministic composer, standard-work catalog) — invisible until used. Short + abstract maximizes brand ceiling for a product whose value reveals itself in use.

---

## 4. DIVERGENT — Lens Picks (Same DNA, Different Word)

### Growth's pick: **Standa**
- Evokes "standard work" (the 85-entry catalog moat)
- Short (6 chars), invented, no category collision
- No competitor owns "standard work" in SaaS — uncontested positioning
- Doesn't lock to Kaizen heritage
- Domain availability unknown

### Market's pick: **Cadex**
- Evokes "cadence + execute / index"
- Short (5 chars), invented, no SaaS collision known
- One risk: Cadex Electronics (Canadian battery co, different category) — trademark search needed
- Phonetic adjacency to "Codex" (Microsoft AI) — minor noise in developer searches
- cadex.ai / cadex.io plausibly available; cadex.com unknown

### Both lenses' shared pattern
Short + invented + abstract + no Kaizen heritage + no descriptive compound. The disagreement is purely on which evocation:
- Standa → standard-work moat (CI heritage)
- Cadex → scheduling + structured execution

Phil's preference between these is a **values question**, not a tactical one:
- "Standa" signals you're proud of the Toyota-Production-System lineage
- "Cadex" signals you're a productivity SaaS that happens to enforce standards

---

## 5. Safe Defaults If New Name Doesn't Land

### CadencePlan (existing app shell name)
**Pros:** Retains internal alignment. Already on app.html. Some practitioner search intent ("cadence plan" reads as feature). Lowest transition cost.
**Cons:** Descriptive compound caps brand ceiling. Cadence Design Systems trademark adjacency requires clearance. Growth + Market both flag as compromise, not win.

**Use only if:** Phil decides the naming exercise isn't worth the rename cost AND wants to harden the current name.

### Drop options (all 3 lenses agree)
- **BAM-X** / **BAM-X Kaizen OS** — internal only, never external
- **Kaizen Accelerator** as standalone product brand — keep as tier name under parent brand at most
- **Kaizen-Accelerator** (repo name) — rename to match whatever wins

---

## 6. Rename Scope Estimate (PM Lens)

PM mapped this precisely:

| Drop this name | Files | Occurrences | Hours | Risk |
|---|---|---|---|---|
| CadencePlan | app.html + 2 previews + 23 JS + 26 internal .md | ~242 | 3–5 | Low — not publicly indexed |
| Kaizen Accelerator | 10 marketing HTML files | 33 user-facing | 4–8 | **High — SEO risk** |
| BAM-X Kaizen OS | package.json + 66 .md + fullCatalog.json | ~487 | 2–4 | Low — internal only |
| Kaizen-Accelerator (repo) | GitHub + README | 1 action + audit | 1–2 | Medium — bookmark breakage |

**Total: 10–19 hours mechanical work.** Largest single chunk is renaming BAM-X across 487 internal occurrences (institutional memory documents). Marketing site SEO risk is the biggest external concern.

---

## 7. What Phil Cannot Decide Without External Verification

All 3 lenses flag this: **No name can be finalized without:**

1. **Live WHOIS lookup** on `.com`, `.ai`, `.io` for the chosen name
2. **USPTO TESS trademark search** (USA) + WIPO Global Brand Database (international) for clearance
3. **(Optional) ICP user recall test** — does target audience associate the chosen evocation positively?

These are external checks I cannot perform. Phil (or a paralegal / domain broker) needs to execute them before lock.

---

## 8. Open Questions for Phil (in priority order)

| Q | Question | Blocks |
|---|---|---|
| **Q1** | One brand or two? (One = Option A/B; Two = Option C) | All naming work |
| **Q2** | Is the "Kaizen Accelerator" offering brand being retired, or kept as a tier under a new parent? | Marketing site rename + funnel positioning |
| **Q3** | Must the new name preserve kaizen heritage, or is walking away acceptable? | Short-list selection (Standa keeps heritage; Cadex doesn't) |
| **Q4** | Is this cosmetic rename only, or simultaneous with marketing site refresh? | Scope (10-19 hr vs much larger) |
| **Q5** | Does BAM-X survive as internal shorthand after external rename, or fully retired? | Internal doc cleanup scope |
| **Q6** | If Standa or Cadex is the pick — willing to fund WHOIS + trademark clearance before commit? | Final lock |

---

## 9. Recommended Path

**Step 1 (you, now):** Answer Q1 and Q2. These two answers gate everything else. Without them, no lens can finalize a recommendation.

**Step 2 (after Q1/Q2):** Pick between Standa / Cadex / CadencePlan based on values (Q3). I will not pick this for you — it's taste.

**Step 3 (after Step 2):** External verification (WHOIS + USPTO + WIPO). If chosen name fails, fall back to next on shortlist.

**Step 4 (after Step 3):** Dispatch rename in 3 phases per PM §6:
- Phase 1: code + package + GitHub (mechanical, ~3 hr)
- Phase 2: user-facing surfaces (marketing site, app titles, ~4-8 hr)
- Phase 3: external (domain, social, repo redirects, ~2-4 hr)

---

## 10. Decision Required

Phil to answer Q1 + Q2 first:

- **Q1 answer choices:**
  - (a) One brand covers everything (Option A)
  - (b) Parent + sub-brand structure (Option B — PM recommended)
  - (c) Two completely separate brands (Option C)

- **Q2 answer choices:**
  - (a) Retire Kaizen Accelerator brand entirely; new name covers the consulting tier
  - (b) Keep Kaizen Accelerator as the tier name under a new parent brand
  - (c) Keep Kaizen Accelerator as a separate brand (only if Q1=c)

After Q1+Q2, I can either:
- **Dispatch lens agents to refine the shortlist** under your chosen structure
- **Present Standa vs Cadex vs CadencePlan head-to-head** for your taste pick
- **Pause until you've done external WHOIS/trademark verification**

---

## 11. Bystander Notes

- Deploy queue: 4-deep currently (pending push of preview port). Naming work doesn't add to deploy queue — it's planning, not shipping.
- The naming decision affects all future marketing/docs work. Resolving it before the next feature dispatch saves rework.
- No SW-Q or META amendment is blocked by this; the catalog gap-fill, dependsOn wiring, and SW-Q resolutions can all proceed under any name.
- The 2-lens divergence (Standa vs Cadex) is HEALTHY signal — both are valid; they evoke different values. Picking is a Phil-taste decision, not a coordinator decision.

---

## 12. My Honest Read

Three lenses largely agree on the diagnosis: brand fragmentation is real, BAM-X is dead, Kaizen carries trademark risk, short+invented is the right pattern. They differ only on which short invented word.

If you want me to push past my neutrality and recommend one: **Cadex** narrowly. It has the cleaner brand ceiling, the more defensible trademark posture (Standa is dictionary-adjacent in several Slavic languages and may have unexpected meanings; Cadex is genuinely invented), and the evocation maps better to what the product actually DOES (it's a scheduling product first, a CI product second — your code doesn't enforce kaizen, it enforces cadence).

But the structural questions (Q1/Q2) outrank the name pick. Answer those first.
