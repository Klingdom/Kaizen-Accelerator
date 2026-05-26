# PRODUCT_NAME_PM.md
# Product Identity Assessment + Rename Scope
_PM lens — 2026-05-18_

---

## 1. Product Identity Assessment

**What does the product DO today?**
There are two distinct artifacts sharing a GitHub repo. The first is a structured 30-day consulting engagement (Define / Expose / Redesign / Execute) sold at fixed fees of $20K (Standard) and $35K+ (Premium) to Founders and COOs who need measurable improvement in one mission-critical business process. This engagement is delivered by Phil personally and includes executive intake, KPI selection, Kaizen week facilitation, and a sustainment package. The second is a standalone SPA — currently titled CadencePlan — that is a daily cadence planner with a 60-entry standard-work catalog covering PROJECT, COMMUNICATION, and CI buckets. The SPA has a week-view hour grid, a Now pane, a Cadence Pressure Ring, a composer, and Kaizen tracking at the block level. As of Sprint 16a it renders time-ranges on every activity block. These two things do not yet interact in any user-visible way: the consulting engagement has no in-app experience, and the SPA has no checkout or intake flow pointing into the consulting engagement.

**Who pays for what?**
The consulting engagement is a B2B services sale. The buyer is an executive (Founder, COO) at a company with a process problem worth fixing. The SPA has no monetization wired in. There is no subscription, no paywall, no pricing page for the app. The marketing site sells the consulting engagement; the app is a separate product shell that has been built out substantially but is not connected to a revenue model yet. The app's standard-work catalog is methodologically coherent with the consulting engagement (DMAIC, Kaizen, PDCA, CI ceremonies), which suggests the intent is integration, but that integration does not exist in code or in the marketing funnel today.

**Are these one product or two?**
They are currently two products behaving as one codebase. The consulting engagement is a productized service with a defined scope, pricing, and delivery model. The SPA is a continuity tool — the kind of software a client might use after the engagement ends to maintain operating discipline. However, this is not stated anywhere in the marketing site, not built into the app, and not part of the intake or sustainment flow. The naming fragmentation (four names across eight surfaces) is a symptom of this unresolved identity question, not a cause. Phil has built a capable app and a capable consulting offer; the relationship between them is undefined, which makes naming impossible to resolve cleanly without first resolving the structure question.

---

## 2. Naming Implications

The naming structure must follow the product structure. Three options:

**Option A — Single unified name.**
Works if the consulting engagement and the app are meant to be one brand. Example model: HubSpot (company = product = brand). The engagement becomes "the onboarding tier" and the app is the ongoing platform. Risk: the $20K–$35K fixed-fee consulting is a very different commercial motion than a SaaS app. Mixing them under one brand creates buyer confusion — a COO googling a process consultant does not expect to land on a SaaS pricing page, and a SaaS user does not expect a $20K minimum.

**Option B — Parent brand + sub-brand.**
Works if Phil wants one master identity with two distinct offerings underneath. Example: "Cadence OS" as parent, "Cadence Accelerator" as the consulting engagement sub-brand, "Cadence" or "CadencePlan" as the app sub-brand. This is the model used by Notion (Notion + Notion AI + Notion Calendar). It preserves flexibility to market each thing separately while maintaining a coherent master brand. This is the recommended structure given current product reality.

**Option C — Two separate brands.**
Works if the consulting practice and the SaaS app will genuinely serve different audiences on different growth paths. Example: "Kling Consulting" for the engagement (personal brand, services context) and "CadencePlan" or a new name for the app. Risk: Phil is a solo operator right now; maintaining two brand identities doubles the marketing surface area for one person.

**Recommendation: Option B, parent brand + sub-brand.**
Pick one parent name. Put the app under it. Put the consulting engagement under it as "the Accelerator." This resolves the four-name fragmentation into two names with a clear hierarchy and does not require dismantling the methodological identity (kaizen, continuous improvement, standard work) that is embedded in 60+ catalog entries and the entire internal codebase.

---

## 3. Rename Scope Estimate

The counts below are based on grep across the repo as of 2026-05-18.

| Drop this name | Files to touch | Occurrences | Estimated hours | Risk |
|---|---|---|---|---|
| CadencePlan | `app.html` (title, noscript, fallback text — 4 hits); `assets/today-redesign-preview.html` (4 hits); `assets/today-futuristic-preview.html` (2 hits); 23 JS source files (89 total hits in comments/strings); 26 internal `.md` files (143 hits) | ~242 total | 3–5 hrs (mechanical find-replace; preview files are non-production) | Low — app is not yet publicly indexed under this name |
| Kaizen Accelerator | 10 marketing HTML files (33 occurrences in visible copy, nav, and `<title>` tags): `index.html`, `kaizen-accelerator.html`, `premium.html`, `how-it-works.html`, `about.html`, `faq.html`, `intake.html`, `target-processes.html`, `roi.html`, `thanks.html` | 33 user-facing | 4–8 hrs | High — if the marketing site is live and indexed, changing page titles and h1 copy affects any SEO equity already accumulated. The filename `kaizen-accelerator.html` creates a URL that also changes. |
| BAM-X Kaizen OS | `package.json` (name + description fields — 2 hits); 66 internal `.md` files (387 hits — predominantly architecture docs, UX deltas, sprint notes, CHANGELOG); `js/catalog/seed/fullCatalog.json` (8 hits in sourceRef strings); 23 JS source files (89 hits overlap with CadencePlan count above — some files have both) | ~487 internal | 2–4 hrs (all internal; no user-facing surface carries this name) | Low — purely internal. The `sourceRef` strings in fullCatalog.json reference it but those are traceability fields, not user-visible. |
| Kaizen-Accelerator (GitHub repo) | GitHub repo rename (1 action in GitHub settings); any external documentation, CI webhooks, or clone URLs that reference the repo by name | 1 settings action + audit of any outbound links in `README.md` (13 BAM-X hits) | 1–2 hrs + verification | Medium — GitHub creates permanent redirects from old repo name to new, so clone URLs and bookmarks continue to work. Risk is only if external sites or partner documents have hardcoded the old URL. |

**Total estimated rename effort across all four names: 10–19 hours** depending on scope of internal-doc cleanup. The mechanical code rename is the small part. The large part is deciding what to do with 387 BAM-X occurrences in architecture and UX documents that serve as the team's institutional memory.

---

## 4. Acceptance Criteria for the Rename

**AC-1.** Every user-facing HTML `<title>` tag, `<h1>`, and nav brand label carries exactly one canonical name. Zero occurrences of the deprecated names in rendered user surfaces.

**AC-2.** `package.json` `name` and `description` fields reflect the canonical name. npm/Node tooling resolves the package without error after rename.

**AC-3.** The GitHub repository is renamed to the canonical slug. `README.md` updated to reflect the new name. Any CI configuration referencing the old repo path is updated.

**AC-4.** Internal documents (`.md` files) that are actively referenced in development (ARCHITECTURE.md, CHANGELOG.md, GLOSSARY.md, DELIVERY_PLAN.md) are updated to the canonical name. Historical sprint notes and UX delta files may retain old names with a header note: "This document predates the rename to [canonical name]."

**AC-5.** The marketing site filename `kaizen-accelerator.html` is either renamed to a URL matching the new brand, or an HTML `<meta http-equiv="refresh">` or server-side redirect is in place from the old URL to the new one.

**AC-6.** No test assertion fails due to a hardcoded deprecated name string. Any test that asserts on `<title>` content or visible app name strings is updated to the new canonical name.

**AC-7.** The `js/catalog/seed/fullCatalog.json` sourceRef strings are updated or annotated to indicate the new repo/project name, so catalog traceability is not broken.

**AC-8.** A `RENAME_LOG.md` entry is added to the repo noting the effective date of the rename, the four prior names, and where each was used. This protects the team from confusion when reading historical commits.

---

## 5. Synthesis Questions for Phil

These questions must be answered before the rename can be dispatched to engineering. The naming structure and name candidates from the growth-strategist and market-research lenses are inputs; these questions determine which structure those names plug into.

**Q1: One brand or two?**
Is the Kaizen Accelerator consulting engagement meant to live under the same brand as the app, or is it Phil Kling's personal consulting practice (personal brand) with the app as a separately branded SaaS product? This is the highest-leverage question. Everything else cascades from it.

**Q2: Is "kaizen" in the name a requirement?**
The word "kaizen" is embedded in 60+ catalog entry IDs, internal architecture docs, the GitHub repo name, and the consulting engagement brand. Dropping it entirely from the external name is technically feasible but creates a mismatch between what users see and what the internal team calls things. Walking away from kaizen heritage is a legitimate choice — it broadens the addressable market — but it adds internal rename cost and risks confusing clients who were sold on the methodology.

**Q3: Retire or re-tier the Accelerator brand?**
Is the "Kaizen Accelerator" offer being retired when the rename happens, or is it being preserved as a named tier within a new parent brand (e.g., "[New Parent] Accelerator")? If it is re-tiered, the marketing site copy changes are cosmetic. If it is retired and folded into a new offering structure, the copy changes are substantive and require a new sales narrative.

**Q4: Simultaneous marketing refresh or cosmetic rename only?**
Is this rename coupled to a redesign of the marketing site, or is it a find-and-replace pass on existing copy? A simultaneous redesign changes the project scope by an order of magnitude. A cosmetic rename can ship in one sprint. Phil needs to decide which problem is being solved: brand fragmentation (cosmetic rename) or brand + positioning (redesign + rename).

**Q5: Does BAM-X survive internally?**
BAM-X appears 387 times in internal docs and is deeply embedded in the team's working vocabulary (BAM-X Kaizen OS, bamx- in package.json). Is this internal shorthand being retired, or is it kept as a dev-facing alias even after the external-facing rename? Keeping it internally reduces rename effort but perpetuates fragmentation in a different layer.

---

## 6. Phased Rename Plan

Picking a name is an afternoon. Executing the rename is a sprint. Propose three phases:

**Phase 1 — Internal tooling and metadata (1–2 days)**
Targets: `package.json`, internal shorthand in JS source files where it appears in log strings or comments, `CHANGELOG.md`, `GLOSSARY.md`, `ARCHITECTURE.md`, `README.md`. These have zero user-facing impact and can ship without a marketing decision. Goal: establish the canonical name in the codebase before it appears in any user surface. This phase is unblocked by any decision other than "what is the new name."

**Phase 2 — User-facing surfaces (1–3 days)**
Targets: `app.html` (title, noscript, loading text), `assets/today-redesign-preview.html`, `assets/today-futuristic-preview.html`, all 10 marketing HTML files (title tags, nav brand labels, h1 headings, page-level copy that names the offering). Requires the Q3 and Q4 decisions above (retire vs. re-tier, cosmetic vs. redesign). This phase is the one with visible user impact and any SEO risk. Run it after Phase 1 is stable.

**Phase 3 — External and permanent artifacts (1 day + verification)**
Targets: GitHub repo rename, any domain or redirect configuration, `RENAME_LOG.md` creation, update of any external links (if the marketing site is live on a custom domain, coordinate domain redirects in this phase). This phase has the longest tail because external links in client-facing materials (PDFs, email signatures, decks) are outside the codebase. Phil owns that audit manually.

---

_Note: The two naming-lens outputs (growth-strategist + market-research) should feed name candidates into the structure defined in §2 Option B. The PM assessment does not pick the name; it picks the structure and flags the cost. Phil picks the name._
