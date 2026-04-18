# DECISIONS.md — Architectural Decisions

## Purpose

Record key decisions to prevent rework and maintain consistency.

Rules:

* Only record significant decisions
* Keep entries concise
* Include reasoning and tradeoffs

---

## Decision Template

### Decision:

### Status: (Approved / Proposed)

### Context:

(What problem are we solving?)

### Decision:

(What was chosen?)

### Reasoning:

(Why?)

### Tradeoffs:

(What are the downsides?)

---

## Decisions

---

### Decision 001 — Framework

Status: Approved

Context:
Need a scalable frontend framework for website + SaaS

Decision:
Use Next.js App Router

Reasoning:

* Built-in routing
* Supports server + client components
* Strong ecosystem

Tradeoffs:

* Learning curve
* Requires structured architecture

---

### Decision 002 — Data Strategy

Status: Approved

Context:
Index pages currently use raw HTML

Decision:
Adopt JSON-first structured data model

Reasoning:

* Enables reuse
* Supports filtering and sorting
* Easier to maintain

Tradeoffs:

* Requires initial conversion effort

---

### Decision 003 — Deployment

Status: Approved

Context:
Need consistent deployment across environments

Decision:
Use Docker + VPS deployment

Reasoning:

* Reproducible environments
* Scalable hosting
* Aligns with DevOps best practices

Tradeoffs:

* Requires Docker setup and management

---

### Decision 004 — Backend Timing

Status: Approved

Context:
Early-stage product, limited need for backend

Decision:
Delay backend/API until necessary

Reasoning:

* Keep system simple
* Focus on frontend + data first

Tradeoffs:

* May require later refactor

---

## Rules for Agents

* Do NOT override approved decisions
* Propose new decisions when:

  * introducing new technology
  * changing architecture
  * adding major dependencies

---

End of DECISIONS.md
