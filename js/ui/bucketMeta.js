/**
 * bucketMeta — single source of truth for bucket-tone class derivation.
 *
 * Pure function. No DOM, no globals, no clock/random reads.
 *
 * @module bucketMeta
 */

const META = Object.freeze({
  PROJECT: Object.freeze({
    chipClass: 'chip-project',
    dotClass:  'chip-project',
    label:     'Project',
    vars: Object.freeze({ bg: 'var(--project-bg)', fg: 'var(--project-fg)', fill: 'var(--project-fill)' })
  }),
  COMMUNICATION: Object.freeze({
    chipClass: 'chip-communication',
    dotClass:  'chip-communication',
    label:     'Communication',
    vars: Object.freeze({ bg: 'var(--communication-bg)', fg: 'var(--communication-fg)', fill: 'var(--communication-fill)' })
  }),
  CI: Object.freeze({
    chipClass: 'chip-ci',
    dotClass:  'chip-ci',
    label:     'Continuous Improvement',
    vars: Object.freeze({ bg: 'var(--ci-bg)', fg: 'var(--ci-fg)', fill: 'var(--ci-fill)' })
  })
});

const UNKNOWN = Object.freeze({
  chipClass: 'chip-unknown',
  dotClass:  'chip-unknown',
  label:     'Unscheduled',
  vars: Object.freeze({ bg: 'var(--color-surface-muted)', fg: 'var(--color-text-muted)', fill: 'var(--color-border-strong)' })
});

/**
 * Return display metadata for a bucket value.
 *
 * Bucket comparison is uppercase-strict internally; callers may pass either
 * casing form. Any unrecognised input (including null, undefined, empty
 * string, or a lowercased variant not in the known set) falls back to UNKNOWN.
 *
 * @param {string|null|undefined} bucket  expected: 'PROJECT' | 'COMMUNICATION' | 'CI'
 * @returns {{
 *   bucket: 'PROJECT' | 'COMMUNICATION' | 'CI' | 'UNKNOWN',
 *   chipClass: string,
 *   dotClass: string,
 *   label: string,
 *   vars: { bg: string, fg: string, fill: string }
 * }}
 */
export default function bucketMeta(bucket) {
  const key = typeof bucket === 'string' ? bucket.toUpperCase() : null;
  const m = (key && META[key]) || UNKNOWN;
  return {
    bucket: (key && META[key]) ? key : 'UNKNOWN',
    chipClass: m.chipClass,
    dotClass:  m.dotClass,
    label:     m.label,
    vars:      m.vars
  };
}

// Named export so callers can use: import bucketMeta from './bucketMeta.js'
// or: import { bucketMeta } from './bucketMeta.js'
export { bucketMeta };

// ---------------------------------------------------------------------------
// Legacy back-compat exports — deprecated, do not use in new code.
// These exist so any file that imported the old per-component constant keeps
// compiling until callers are migrated (Iteration 15+ sweep).
// ---------------------------------------------------------------------------
export const BUCKET_CHIP_CLASS = Object.freeze({
  PROJECT:       'chip-project',
  COMMUNICATION: 'chip-communication',
  CI:            'chip-ci'
});

export const BUCKET_DOT_CLASS = Object.freeze({
  PROJECT:       'chip-project',
  COMMUNICATION: 'chip-communication',
  CI:            'chip-ci'
});

export const BUCKET_LABELS = Object.freeze({
  PROJECT:       'Project',
  COMMUNICATION: 'Communication',
  CI:            'Continuous Improvement'
});
