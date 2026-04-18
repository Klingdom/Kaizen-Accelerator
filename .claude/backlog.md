# BACKLOG.md — Prioritized Work System

## Purpose

Define all work in a structured, prioritized, and agent-executable format.

Rules:

* Only items in **Ready Now — High Confidence** are eligible for autonomous execution
* Items must be **clear, bounded, and testable**
* Avoid vague or strategic work in executable sections

---

## Ready Now — High Confidence

### Site Foundation

* [ ] Convert Home page into Next.js App Router structure
* [ ] Implement global layout (header, footer, navigation)
* [ ] Add SEO metadata support to all pages

### Index System

* [ ] Convert Countries Index HTML → structured JSON dataset
* [ ] Convert Fortune 500 Index HTML → structured JSON dataset
* [ ] Convert AI Labs Index HTML → structured JSON dataset
* [ ] Build reusable table component with:

  * sorting
  * filtering
  * pagination

### Content Migration

* [ ] Migrate About page into component-based structure
* [ ] Migrate Methodology page into structured sections
* [ ] Migrate Research page

### DevOps

* [ ] Create production Dockerfile for Next.js app
* [ ] Create docker-compose.yml
* [ ] Verify container runs locally

---

## Ready Soon — Medium Confidence

* [ ] Normalize scoring schema across all index datasets
* [ ] Create shared data model for all benchmark entities
* [ ] Add structured metadata (OpenGraph, SEO)
* [ ] Build reusable page layout templates
* [ ] Add error handling and loading states

---

## Needs Human Judgment

* [ ] Define final scoring methodology across all benchmarks
* [ ] Design Compassion Benchmark Explorer UX
* [ ] Define pricing and product packaging
* [ ] Decide database vs JSON long-term strategy
* [ ] Define AI Evaluation Suite feature set

---

## Blocked

* [ ] Backend API design (depends on product decisions)
* [ ] Authentication system (depends on SaaS scope)

---

## Done

(Completed items are moved here automatically)

---

## Task Definition Standard

Each task must:

* Be executable in one loop cycle
* Have a clear output
* Be verifiable

Bad:

* “Improve UI”

Good:

* “Add sorting + filtering to index table component”

---

## Execution Rules

Agents MUST:

* Only pull from Ready Now unless explicitly instructed
* Complete one task per loop cycle
* Validate before marking complete
* Commit after completion

---

End of BACKLOG.md
