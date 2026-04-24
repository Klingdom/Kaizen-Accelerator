/**
 * editMode — pure helpers for Sprint 12 Edit-mode swap mechanic.
 *
 * No DOM. No I/O. Every function either returns a new array/object or a
 * boolean/numeric result. State lives in `state.editMode` inside `app.js`;
 * this module only computes what that state should become after each
 * interaction.
 *
 * Protected blocks (never swappable/removable per user spec):
 *   - non-optional slots (DAILY_NON_OPTIONAL_SET): Daily Standup,
 *     AM High-value Communication, Post-lunch High-value Communication,
 *     End-of-Activity Reflection
 *   - sprint ceremonies (SPRINT_CEREMONIES): planning, mid-sprint review,
 *     sprint review, retrospective
 *   - strategic Deep payload  (`a.strategic === true`, bucket PROJECT)
 *   - R2 rescues (`a.carriedOver === true`)
 *
 * Identified by id OR name OR slotKind OR carriedOver OR strategic, so we
 * stay resilient to the minor naming differences between composer output
 * and catalog seed.
 */

/** Protected catalog-entry ids (non-optional + sprint ceremonies). */
export const PROTECTED_CATALOG_IDS = Object.freeze(new Set([
  'cer_daily_standup',
  'cer_sprint_planning',
  'cer_mid_sprint_review',
  'cer_sprint_review',
  'cer_sprint_retrospective',
  'gen_end_of_activity_reflection'
]));

/** Protected activity names (mirror composer DAILY_NON_OPTIONAL_SET). */
export const PROTECTED_NAMES = Object.freeze(new Set([
  'Daily Standup',
  'AM High-value Communication',
  'Post-lunch High-value Communication',
  'End-of-Activity Reflection',
  'Sprint Planning',
  'Mid-Sprint Review',
  'Sprint Review',
  'Sprint Retrospective'
]));

/** Protected slot-kind markers (composer anchors the two COMM fillers). */
export const PROTECTED_SLOT_KINDS = Object.freeze(new Set([
  'AM_COMM',
  'POST_LUNCH_COMM'
]));

/**
 * True when an activity must not be swapped or removed in edit mode.
 *
 * @param {object} activity   a ScheduledActivity row (may be DRAFT)
 * @param {object} [_composition]   optional — reserved for future rules
 * @returns {boolean}
 */
export function isProtectedBlock(activity, _composition) {
  if (!activity || typeof activity !== 'object') return false;
  if (PROTECTED_CATALOG_IDS.has(activity.catalogEntryId)) return true;
  if (PROTECTED_NAMES.has(activity.name)) return true;
  if (activity.slotKind && PROTECTED_SLOT_KINDS.has(activity.slotKind)) return true;
  if (activity.carriedOver === true) return true;
  if (activity.bucket === 'PROJECT' && activity.strategic === true) return true;
  return false;
}

/**
 * Build a ScheduledActivity draft from a catalog entry, preserving the
 * source slot's scheduling anchor when swapping in place.
 *
 * @param {object} catalogEntry
 * @param {object|null} sourceSlot   the slot being replaced (null for adds)
 * @param {string} nowIso            ISO timestamp for createdAt/updatedAt
 * @param {string} [newId]           id to assign; auto-generated if omitted
 * @returns {object}
 */
export function activityFromCatalogEntry(catalogEntry, sourceSlot, nowIso, newId) {
  if (!catalogEntry || typeof catalogEntry !== 'object') {
    const err = new Error('editMode.activityFromCatalogEntry: catalogEntry required');
    err.name = 'INVALID_ENTRY';
    throw err;
  }
  const id = newId ?? `sa_edit_${catalogEntry.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const draft = {
    id,
    catalogEntryId: catalogEntry.id,
    name: catalogEntry.name ?? catalogEntry.id,
    bucket: catalogEntry.bucket,
    plannedDurationMinutes:
      typeof catalogEntry.defaultDurationMinutes === 'number'
        ? catalogEntry.defaultDurationMinutes
        : sourceSlot?.plannedDurationMinutes ?? 30,
    plannedStartAt: sourceSlot?.plannedStartAt ?? null,
    state: sourceSlot?.state ?? 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_EDIT',
    updatedAt: nowIso ?? null
  };
  if (sourceSlot?.anchor) draft.anchor = sourceSlot.anchor;
  if (sourceSlot?.slotKind) draft.slotKind = sourceSlot.slotKind;
  if (sourceSlot?.compositionId) draft.compositionId = sourceSlot.compositionId;
  return draft;
}

/**
 * Replace the slot identified by `slotActivityId` with a new activity
 * materialized from `catalogEntry`. If the slot is not found, returns the
 * original activities array (no-op). If the slot is protected, caller
 * should check via `isProtectedBlock` first — this helper does NOT gate.
 *
 * @param {object[]} activities
 * @param {string} slotActivityId
 * @param {object} catalogEntry
 * @param {string} nowIso
 * @returns {object[]}
 */
export function applySwap(activities, slotActivityId, catalogEntry, nowIso) {
  if (!Array.isArray(activities)) return [];
  const idx = activities.findIndex((a) => a && a.id === slotActivityId);
  if (idx < 0) return activities.slice();
  const source = activities[idx];
  const replacement = activityFromCatalogEntry(catalogEntry, source, nowIso);
  const next = activities.slice();
  next[idx] = replacement;
  return next;
}

/**
 * Remove the slot identified by `slotActivityId`. Returns a new array.
 *
 * @param {object[]} activities
 * @param {string} slotActivityId
 * @returns {object[]}
 */
export function applyRemove(activities, slotActivityId) {
  if (!Array.isArray(activities)) return [];
  return activities.filter((a) => !a || a.id !== slotActivityId);
}

/**
 * Append a new slot materialized from `catalogEntry` at the end. Returns a
 * new array.
 *
 * @param {object[]} activities
 * @param {object} catalogEntry
 * @param {string} nowIso
 * @returns {object[]}
 */
export function applyAdd(activities, catalogEntry, nowIso) {
  if (!Array.isArray(activities)) activities = [];
  const draft = activityFromCatalogEntry(catalogEntry, null, nowIso);
  return [...activities, draft];
}

/**
 * Sum planned duration minutes per bucket, skipping SKIPPED/DROPPED rows.
 *
 * @param {object[]} activities
 * @returns {{PROJECT: number, COMMUNICATION: number, CI: number}}
 */
export function computePlannedByBucket(activities) {
  const sums = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  if (!Array.isArray(activities)) return sums;
  for (const a of activities) {
    if (!a || typeof a !== 'object') continue;
    if (a.state === 'SKIPPED' || a.state === 'DROPPED') continue;
    const b = a.bucket;
    if (!(b in sums)) continue;
    sums[b] += Number(a.plannedDurationMinutes ?? 0);
  }
  return sums;
}

/**
 * Validate that a draft activities array still satisfies bucket floors /
 * ceilings. Returns `{ok, violations: [{bucket, code, actual, bound}]}`.
 *
 * Codes:
 *   UNDER_FLOOR — planned < floors[bucket]
 *   OVER_CEILING — planned > ceilings[bucket]
 *
 * Unlike validateComposition, this helper does NOT check capacity or
 * non-optionals (edit mode explicitly protects those via isProtectedBlock).
 *
 * @param {object[]} activities
 * @param {object} _targets
 * @param {{PROJECT:number, COMMUNICATION:number, CI:number}} floors
 * @param {{PROJECT:number, COMMUNICATION:number, CI:number}} ceilings
 * @returns {{ok: boolean, violations: Array<{bucket:string, code:string, actual:number, bound:number}>}}
 */
export function validateEditState(activities, _targets, floors, ceilings) {
  const sums = computePlannedByBucket(activities);
  const violations = [];
  for (const b of ['PROJECT', 'COMMUNICATION', 'CI']) {
    const floor = floors?.[b];
    const ceiling = ceilings?.[b];
    if (typeof floor === 'number' && sums[b] < floor) {
      violations.push({ bucket: b, code: 'UNDER_FLOOR', actual: sums[b], bound: floor });
    }
    if (typeof ceiling === 'number' && sums[b] > ceiling) {
      violations.push({ bucket: b, code: 'OVER_CEILING', actual: sums[b], bound: ceiling });
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Push an undo snapshot onto the stack (cap at `maxSteps`). Returns a new
 * array — does not mutate the input.
 *
 * @param {Array<object[]>} stack   each entry is a prior activities array
 * @param {object[]} snapshot
 * @param {number} [maxSteps=20]
 * @returns {Array<object[]>}
 */
export function pushUndo(stack, snapshot, maxSteps = 20) {
  const next = Array.isArray(stack) ? stack.slice() : [];
  next.push(snapshot);
  while (next.length > maxSteps) next.shift();
  return next;
}

/**
 * Pop the most recent undo snapshot. Returns `{stack, snapshot}` where
 * `snapshot` is `null` if the stack was empty.
 *
 * @param {Array<object[]>} stack
 * @returns {{stack: Array<object[]>, snapshot: object[] | null}}
 */
export function popUndo(stack) {
  const arr = Array.isArray(stack) ? stack.slice() : [];
  if (arr.length === 0) return { stack: arr, snapshot: null };
  const snapshot = arr.pop();
  return { stack: arr, snapshot };
}

/**
 * Compute the duration delta (target − source). Positive numbers mean the
 * catalog entry would ADD minutes to that slot; negative means it would
 * SHRINK the slot. Returns 0 if either input is missing.
 *
 * @param {object|null|undefined} sourceSlot
 * @param {object|null|undefined} catalogEntry
 * @returns {number}
 */
export function durationDelta(sourceSlot, catalogEntry) {
  if (!sourceSlot || !catalogEntry) return 0;
  const a = Number(sourceSlot.plannedDurationMinutes ?? 0);
  const b = Number(catalogEntry.defaultDurationMinutes ?? 0);
  return b - a;
}

/**
 * Filter catalog entries for the drawer. Empty search + `all` filter
 * returns the whole list (after the `enabledByUser !== false` cut). The
 * search matches name / procedure (joined) / activityNumber, case-
 * insensitive. `projectTypeFilter` narrows the PROJECT bucket only.
 *
 * @param {object[]} catalog
 * @param {{search?: string, projectTypeFilter?: string}} [opts]
 * @returns {object[]}
 */
export function filterCatalog(catalog, opts = {}) {
  if (!Array.isArray(catalog)) return [];
  const q = String(opts.search ?? '').trim().toLowerCase();
  const pt = opts.projectTypeFilter ?? 'all';
  return catalog.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    if (e.enabledByUser === false) return false;
    if (q) {
      const haystack = [
        e.name ?? '',
        e.activityNumber != null ? `#${e.activityNumber}` : '',
        Array.isArray(e.procedure) ? e.procedure.join(' ') : (e.procedure ?? ''),
        e.id ?? ''
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (pt && pt !== 'all' && e.bucket === 'PROJECT') {
      const binding = Array.isArray(e.projectTypeBinding)
        ? e.projectTypeBinding
        : e.projectTypeBinding != null ? [e.projectTypeBinding] : [];
      if (pt === 'AD_HOC') {
        // entries with null or empty binding are treated as AD_HOC
        if (binding.length > 0) return false;
      } else if (pt === 'KAIZEN_EVENT_90D') {
        if (!binding.includes('KAIZEN_EVENT_90D') && !binding.includes('KAIZEN_EVENT')) {
          return false;
        }
      } else {
        if (!binding.includes(pt)) return false;
      }
    }
    return true;
  });
}

/**
 * True when `catalogEntryId` is currently in the activities array (i.e.,
 * the drawer card should show an "In today" badge).
 *
 * @param {object[]} activities
 * @param {string} catalogEntryId
 * @returns {boolean}
 */
export function isInToday(activities, catalogEntryId) {
  if (!Array.isArray(activities)) return false;
  if (typeof catalogEntryId !== 'string' || catalogEntryId.length === 0) return false;
  return activities.some((a) => a && a.catalogEntryId === catalogEntryId);
}

export default {
  isProtectedBlock,
  applySwap,
  applyRemove,
  applyAdd,
  activityFromCatalogEntry,
  computePlannedByBucket,
  validateEditState,
  pushUndo,
  popUndo,
  durationDelta,
  filterCatalog,
  isInToday,
  PROTECTED_CATALOG_IDS,
  PROTECTED_NAMES,
  PROTECTED_SLOT_KINDS
};
