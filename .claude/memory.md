# MEMORY.md — System Memory

## 1. Project Identity

Name: Compassion Benchmark
Type: Website + SaaS Platform
Purpose: Measure, benchmark, and operationalize compassion across organizations using structured, evidence-based scoring systems.

Core Capabilities:

* Public benchmark indexes (countries, companies, AI labs, etc.)
* Self-assessment and organizational scoring
* AI evaluation suite
* Research and data products

---

## 2. Current System State

### Architecture

* Frontend: Next.js (App Router)
* Deployment: Docker + Nginx (VPS)
* Data Layer: JSON-first (transitioning to structured models)

### Status

* Legacy HTML content being migrated
* Index pages being converted to structured datasets
* Core site shell in progress

---

## 3. Key Decisions (Compressed)

* Use **Next.js App Router** for scalability and routing
* Use **JSON/data-first approach** for all index pages
* Avoid raw HTML duplication — convert to components
* Prioritize **static-first + dynamic where necessary**
* Docker-based deployment for reproducibility

---

## 4. Active Focus Areas

* Migrate all legacy HTML pages
* Build reusable index/table components
* Define data schemas for benchmark entities
* Stand up production Docker deployment

---

## 5. Known Constraints

* Must maintain SEO quality
* Must support future SaaS features
* Must remain simple enough for rapid iteration
* Avoid over-engineering early backend

---

## 6. Patterns That Work

* Converting content → structured JSON → UI components
* Reusable table components for all index pages
* Clear separation of data, presentation, and logic
* Incremental page-by-page migration

---

## 7. Patterns to Avoid

* Copy-pasting large HTML blocks
* Hardcoding data directly into UI
* Mixing data transformation with rendering
* Premature backend complexity

---

## 8. Data Model Direction

All index data should follow:

* Entity-based structure
* Fields:

  * name
  * rank
  * score
  * category
  * attributes (extensible)

Goal:
Enable filtering, sorting, and reuse across pages and tools.

---

## 9. Open Questions

* When to introduce database vs stay JSON-based?
* How to standardize scoring methodology across all indexes?
* What level of interactivity is required for the Explorer?

---

## 10. Recent Learnings

* Structured data dramatically improves flexibility
* HTML-first approach slows long-term scalability
* Early investment in clean architecture reduces rework

---

## 11. Next High-Impact Moves

1. Convert all index pages to structured datasets
2. Build a universal table + filtering component
3. Normalize scoring and entity schemas
4. Finalize Docker deployment pipeline

---

## 12. System Reminders

* Always check existing patterns before creating new ones
* Prefer extending systems over replacing them
* Optimize for long-term maintainability
* Every change should improve the system, not just complete a task

---

End of MEMORY.md
