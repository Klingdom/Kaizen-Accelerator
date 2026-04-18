# METRICS.md — System Evaluation Framework

## Purpose

Define objective criteria for evaluating system quality and progress.

All improvements must map to one or more metrics.

---

## 1. Product Metrics

### Page Quality

* All core pages render without error
* No broken links or routes
* Consistent layout across pages

### SEO

* Each page has:

  * title
  * meta description
  * OpenGraph tags

### UX

* Navigation is consistent
* Tables support sorting and filtering
* Pages load quickly (<2 seconds target)

---

## 2. Data Quality

### Structure

* All index pages use structured datasets (JSON or TS)
* No large hardcoded data blocks in UI components

### Consistency

* All entities follow the same schema:

  * name
  * rank
  * score
  * category

### Reusability

* Data is reusable across multiple pages/components

---

## 3. Engineering Metrics

### Code Quality

* No duplicated large HTML blocks
* Components are reusable
* Clear separation:

  * data
  * logic
  * presentation

### Build Health

* App builds successfully
* No runtime errors in console

### Simplicity

* Minimal unnecessary dependencies
* Readable, maintainable structure

---

## 4. DevOps Metrics

* Docker container builds successfully
* App runs in container without errors
* Environment is reproducible

---

## 5. Continuous Improvement Metrics

* Each loop produces:

  * 1 completed task OR
  * 1 validated improvement

* Experiments are logged when hypotheses are tested

* Memory is updated only with durable insights

---

## 6. Anti-Metrics (Things to Avoid)

* Increasing duplication
* Growing unstructured HTML
* Mixing data and UI logic
* Large, unvalidated changes

---

## Evaluation Rule

Every loop must answer:

* Did this improve at least one metric?
* Did this introduce any regressions?

---

End of METRICS.md
