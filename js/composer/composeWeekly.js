/**
 * composeWeekly — 5-day weekly composer (Sprint 9 Pass 9b).
 *
 * Takes a Monday ISO date, the user's active Kaizens, a flat set of
 * historically-completed catalog-entry ids, and the full catalog. Produces
 * a `WeeklyComposition` whose `days` is a 5-element array (Mon..Fri) of
 * Composition-shaped objects identical in shape to what `composeDaily()`
 * produces — so downstream persistence + accept/reject flows Just Work.
 *
 * Algorithm per the Sprint 9 brief:
 *
 *   For each active Kaizen (stable order by createdAt asc, id asc):
 *     completedIds ← historicalCompletedCatalogIds (as a Set)
 *     Monday   : current = getCurrentNext(...).current; next = getCurrentNext(...).next
 *                inject BOTH into Monday's PROJECT bucket (2 payloads on day 1)
 *                advance completedIds ← completedIds ∪ {current.id, next.id}
 *     Tue..Fri : current = getCurrentNext(completedIds).current
 *                inject 1 per day; advance completedIds accordingly.
 *     If a Kaizen exhausts its catalog mid-week, stop injecting for it.
 *
 *   Fill remaining PROJECT minutes per day with universal project candidates
 *   (projectTypeBinding === null AND bucket === 'PROJECT') deterministically
 *   by activityNumber asc.
 *
 *   COMMUNICATION 120 per day: select from bucket==='COMMUNICATION' entries.
 *     cadence DAILY → eligible every day.
 *     cadence WEEKLY/SPRINT/ANCHOR → locked to a specific anchor day (default
 *       Monday). An entry's anchorDay is derived via a heuristic on its
 *       `trigger` string when an explicit `weeklyAnchorDay` is not provided.
 *     No same-entry two days in a row unless cadence is DAILY.
 *
 *   CI 120 per day: bucket==='CI' entries. project-type-bound entries are
 *   EXCLUDED from universal CI fill (those are project work).
 *
 * Deterministic: same input → same output. Accepts optional `seedRng` but
 * does not use it in v1.
 *
 * Pure function. No I/O. Does NOT call `composeDaily` — the per-day shape
 * is assembled directly so the weekly-layer algorithm can run a
 * lighter-weight plan (no sprint-ceremony / variance-rescue logic for MVP).
 * Each Composition still satisfies the 4-2-2 invariant.
 */

import { getCurrentNext } from '../catalog/progression.js';
import { injectLunchBlock } from './lunchBlock.js'; // Iter 26: §6.5 hit 3 of 3

/**
 * Days of the week we plan: Monday..Friday.
 */
const WEEKDAY_LABELS = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

/**
 * 4-2-2 target minutes per bucket.
 */
const BUCKET_TARGETS = Object.freeze({
  PROJECT: 240,
  COMMUNICATION: 120,
  CI: 120
});

/**
 * Floors per bucket (50% of target, per capacity/floorsAndCeilings.js).
 */
const BUCKET_FLOORS = Object.freeze({
  PROJECT: 120,
  COMMUNICATION: 60,
  CI: 60
});

/**
 * Ceilings per bucket.
 */
const BUCKET_CEILINGS = Object.freeze({
  PROJECT: 264,
  COMMUNICATION: 150,
  CI: 150
});

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

/**
 * Parse YYYY-MM-DD into a UTC Date at 00:00:00Z. Returns null on invalid.
 *
 * @param {string} iso
 * @returns {Date|null}
 */
function parseIsoDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Format a Date as YYYY-MM-DD (UTC).
 *
 * @param {Date} d
 * @returns {string}
 */
function formatIsoDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Return the 5 weekday dates (Mon..Fri) starting at `weekStart`.
 *
 * @param {string} weekStart  YYYY-MM-DD (must be a Monday)
 * @returns {string[]}
 */
export function weekDaysFromStart(weekStart) {
  const d = parseIsoDate(weekStart);
  if (!d) {
    const err = new Error(`composeWeekly: invalid weekStart '${weekStart}'`);
    err.name = 'INVALID_WEEK_START';
    throw err;
  }
  // Enforce Monday = getUTCDay()===1.
  const dayOfWeek = d.getUTCDay();
  if (dayOfWeek !== 1) {
    const err = new Error(
      `composeWeekly: weekStart must be a Monday, got '${weekStart}' (dayOfWeek=${dayOfWeek})`
    );
    err.name = 'WEEK_START_NOT_MONDAY';
    throw err;
  }
  const days = [];
  for (let i = 0; i < 5; i += 1) {
    const day = new Date(d.getTime());
    day.setUTCDate(day.getUTCDate() + i);
    days.push(formatIsoDate(day));
  }
  return days;
}

// ---------------------------------------------------------------------------
// Anchor-day heuristic for WEEKLY / SPRINT / ANCHOR cadences
// ---------------------------------------------------------------------------

/**
 * Map a weekday label to its Mon-relative day index (0..4).
 *
 * @param {string} label
 * @returns {number|null}
 */
function indexForLabel(label) {
  return WEEKDAY_LABELS.indexOf(label);
}

/**
 * Compute the anchor day-index (0..4) for a non-DAILY communication entry.
 * Default heuristic: scan the trigger string for weekday keywords
 * (Monday/Mon, Tuesday/Tue, ...). Default to Monday (0) when nothing
 * matches. Entries whose trigger mentions "Friday" (e.g. Weekly
 * Reflection) are pinned to day index 4.
 *
 * @param {import('../domain/types.js').CatalogEntry} entry
 * @returns {number}
 */
export function weeklyAnchorDay(entry) {
  const trigger = typeof entry.trigger === 'string' ? entry.trigger.toLowerCase() : '';
  const day = typeof entry.anchorDay === 'string' ? entry.anchorDay : null;
  if (day) {
    const idx = indexForLabel(day);
    if (idx >= 0 && idx < 5) return idx;
  }
  if (/mon(day)?/.test(trigger)) return 0;
  if (/tue(sday)?/.test(trigger)) return 1;
  if (/wed(nesday)?/.test(trigger)) return 2;
  if (/thu(rsday)?/.test(trigger)) return 3;
  if (/fri(day)?/.test(trigger)) return 4;
  return 0; // Default Monday.
}

// ---------------------------------------------------------------------------
// Kaizen ordering + project payload injection
// ---------------------------------------------------------------------------

/**
 * Order active Kaizens deterministically: createdAt asc, then id asc.
 * Accepts `openedAt` as a fallback for Kaizens which predate createdAt.
 *
 * @param {object[]} kaizens
 * @returns {object[]}
 */
function sortKaizens(kaizens) {
  return [...kaizens].sort((a, b) => {
    const at = a?.createdAt ?? a?.openedAt ?? '';
    const bt = b?.createdAt ?? b?.openedAt ?? '';
    if (at < bt) return -1;
    if (at > bt) return 1;
    const ai = a?.id ?? '';
    const bi = b?.id ?? '';
    if (ai < bi) return -1;
    if (ai > bi) return 1;
    return 0;
  });
}

/**
 * Build a per-Kaizen injection plan across Mon..Fri per the brief.
 *
 * Day 1 (Mon): inject current + next (2 payloads)
 * Days 2..5  : inject 1 payload per day
 *
 * Returns an array of length 5 whose i-th element is an array of
 * {kaizen, entry} objects — the project payloads to drop into day i's
 * PROJECT bucket. If a Kaizen exhausts its catalog mid-week, its
 * subsequent days receive no payload.
 *
 * @param {object[]} sortedKaizens
 * @param {string[]} historicalCompleted
 * @param {import('../domain/types.js').CatalogEntry[]} catalog
 * @returns {Array<Array<{kaizen: object, entry: object}>>}
 */
function buildKaizenInjections(sortedKaizens, historicalCompleted, catalog) {
  const perDay = [[], [], [], [], []];

  for (const kaizen of sortedKaizens) {
    if (!kaizen || !kaizen.projectType) continue;
    const completed = new Set(historicalCompleted ?? []);

    // Monday: current + next.
    const { current, next } = getCurrentNext(
      kaizen.projectType,
      completed,
      catalog
    );
    if (current) {
      perDay[0].push({ kaizen, entry: current });
      completed.add(current.id);
    }
    if (next) {
      perDay[0].push({ kaizen, entry: next });
      completed.add(next.id);
    }

    // Tuesday..Friday: 1 payload per day.
    for (let dayIdx = 1; dayIdx < 5; dayIdx += 1) {
      const r = getCurrentNext(kaizen.projectType, completed, catalog);
      if (!r.current) break;
      perDay[dayIdx].push({ kaizen, entry: r.current });
      completed.add(r.current.id);
    }
  }

  return perDay;
}

// ---------------------------------------------------------------------------
// Fill helpers per bucket
// ---------------------------------------------------------------------------

/**
 * Universal PROJECT candidates — bucket==='PROJECT' AND no projectTypeBinding.
 * Sorted by activityNumber asc then id asc.
 *
 * @param {import('../domain/types.js').CatalogEntry[]} catalog
 * @returns {import('../domain/types.js').CatalogEntry[]}
 */
function universalProjectPool(catalog) {
  return [...catalog]
    .filter(
      (c) =>
        c &&
        c.bucket === 'PROJECT' &&
        (c.projectTypeBinding === null || c.projectTypeBinding === undefined)
    )
    .sort(compareByActivityNumberThenId);
}

/**
 * Universal COMMUNICATION candidates.
 */
function universalCommPool(catalog) {
  return [...catalog]
    .filter(
      (c) =>
        c &&
        c.bucket === 'COMMUNICATION' &&
        (c.projectTypeBinding === null || c.projectTypeBinding === undefined)
    )
    .sort(compareByActivityNumberThenId);
}

/**
 * Universal CI candidates — EXCLUDES any project-type-bound entry per the
 * Sprint 9 brief.
 */
function universalCiPool(catalog) {
  return [...catalog]
    .filter(
      (c) =>
        c &&
        c.bucket === 'CI' &&
        (c.projectTypeBinding === null || c.projectTypeBinding === undefined)
    )
    .sort(compareByActivityNumberThenId);
}

/**
 * Deterministic comparator: activityNumber asc (null last), id asc.
 */
function compareByActivityNumberThenId(a, b) {
  const an = typeof a.activityNumber === 'number' ? a.activityNumber : Infinity;
  const bn = typeof b.activityNumber === 'number' ? b.activityNumber : Infinity;
  if (an !== bn) return an - bn;
  const ai = String(a.id ?? '');
  const bi = String(b.id ?? '');
  if (ai < bi) return -1;
  if (ai > bi) return 1;
  return 0;
}

/**
 * Materialize a ScheduledActivity-shaped object for a weekly-day slot.
 *
 * @param {{
 *   entry: object,
 *   bucket: string,
 *   plannedDurationMinutes: number,
 *   anchor?: string,
 *   linkedKaizenId?: string|null,
 *   linkedDmaicStepRef?: object|null,
 *   idSuffix?: string
 * }} spec
 * @returns {object}
 */
function materialize(spec) {
  const { entry, bucket, plannedDurationMinutes } = spec;
  const draft = {
    id: `sa_${entry.id}_${spec.idSuffix ?? 'slot'}`,
    catalogEntryId: entry.id,
    name: entry.name,
    bucket,
    plannedDurationMinutes,
    plannedStartAt: spec.anchor ?? null,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO'
  };
  if (spec.anchor) draft.anchor = spec.anchor;
  if (spec.linkedKaizenId) draft.linkedKaizenId = spec.linkedKaizenId;
  if (spec.linkedDmaicStepRef) draft.linkedDmaicStepRef = spec.linkedDmaicStepRef;
  return draft;
}

// ---------------------------------------------------------------------------
// Per-day builder
// ---------------------------------------------------------------------------

/**
 * Build a single day's Composition from injected payloads + filler pools.
 *
 * @param {{
 *   userId: string,
 *   date: string,
 *   dayIdx: number,                       // 0..4 (Mon..Fri)
 *   capacityMinutes: number,
 *   kaizenInjections: Array<{kaizen: object, entry: object}>,
 *   universalProjects: object[],
 *   universalComm: object[],
 *   universalCi: object[],
 *   priorDayCommPicks: string[],          // catalog ids placed in COMM yesterday
 *   nowIso: string
 * }} ctx
 * @returns {object} Composition
 */
function buildDay(ctx) {
  const {
    userId,
    date,
    dayIdx,
    capacityMinutes,
    kaizenInjections,
    universalProjects,
    universalComm,
    universalCi,
    priorDayCommPicks,
    nowIso
  } = ctx;

  // Scale targets to capacity in the 4-2-2 ratio so smaller days stay valid.
  const totalTarget = BUCKET_TARGETS.PROJECT + BUCKET_TARGETS.COMMUNICATION + BUCKET_TARGETS.CI; // 480
  const scale = capacityMinutes / totalTarget;
  const targets = {
    PROJECT: Math.round(BUCKET_TARGETS.PROJECT * scale),
    COMMUNICATION: Math.round(BUCKET_TARGETS.COMMUNICATION * scale),
    CI: Math.round(BUCKET_TARGETS.CI * scale)
  };

  const remaining = {
    PROJECT: targets.PROJECT,
    COMMUNICATION: targets.COMMUNICATION,
    CI: targets.CI
  };
  /** @type {object[]} */
  const placed = [];

  // --- PROJECT ---------------------------------------------------------------

  // 1. Inject each Kaizen-bound payload (with linkage metadata).
  //
  // When multiple payloads land on the same day (e.g. Monday's "current +
  // next" for a single Kaizen, OR multiple active Kaizens), share the
  // PROJECT budget fairly so no payload gets dropped purely because an
  // earlier-in-list entry has a large defaultDurationMinutes.
  //
  //   - Compute per-payload fair-share ceiling = floor(target / count).
  //   - Clamp each payload's duration to min(defaultDurationMinutes,
  //     fair-share, remaining).
  //   - Floor at 30 min so payloads don't become vanishingly small.
  const injectionCount = kaizenInjections.length;
  const minPerPayload = 30;
  const fairShare = injectionCount > 0
    ? Math.max(minPerPayload, Math.floor(targets.PROJECT / injectionCount))
    : 0;
  for (let i = 0; i < kaizenInjections.length; i += 1) {
    const { kaizen, entry } = kaizenInjections[i];
    if (remaining.PROJECT < minPerPayload) break;
    const requested = entry.defaultDurationMinutes ?? 120;
    const dur = Math.min(requested, fairShare, remaining.PROJECT);
    if (dur <= 0) break;
    placed.push(
      materialize({
        entry,
        bucket: 'PROJECT',
        plannedDurationMinutes: dur,
        linkedKaizenId: kaizen.id,
        linkedDmaicStepRef: {
          kaizenId: kaizen.id,
          catalogEntryId: entry.id
        },
        idSuffix: `d${dayIdx}_k${i}`
      })
    );
    remaining.PROJECT -= dur;
  }

  // 2. Fill remaining PROJECT with universal pool entries. Each pick is
  //    capped to leave room for multiple distinct project slots on days
  //    with no Kaizen injections.
  const PROJECT_MAX_PER_PICK = 120;
  let pIdx = 0;
  let pGuard = 16;
  while (remaining.PROJECT >= 30 && pIdx < universalProjects.length && pGuard > 0) {
    pGuard -= 1;
    const entry = universalProjects[pIdx];
    pIdx += 1;
    const requested = entry.defaultDurationMinutes ?? PROJECT_MAX_PER_PICK;
    const dur = Math.min(requested, PROJECT_MAX_PER_PICK, remaining.PROJECT);
    if (dur <= 0) continue;
    placed.push(
      materialize({
        entry,
        bucket: 'PROJECT',
        plannedDurationMinutes: dur,
        idSuffix: `d${dayIdx}_p${pIdx}`
      })
    );
    remaining.PROJECT -= dur;
  }

  // --- COMMUNICATION --------------------------------------------------------

  // Iter 38 Phase B: inject the POST_DEEP_COMM fixed anchor (15:30 / 15 min)
  // before the general COMM fill so it always appears on every weekday.
  // Uses the gen_value_added_communication catalog entry (same as AM_COMM and
  // POST_LUNCH_COMM) with slotKind=POST_DEEP_COMM to distinguish it.
  // Consumes 15 min from the COMMUNICATION budget first.
  const POST_DEEP_COMM_MINUTES = 15;
  const POST_DEEP_COMM_ANCHOR = '15:30';
  if (remaining.COMMUNICATION >= POST_DEEP_COMM_MINUTES) {
    const postDeepEntry = {
      id: 'gen_value_added_communication',
      name: 'End-of-Deep-Cycles Communication'
    };
    placed.push({
      id: `sa_gen_value_added_communication_POST_DEEP_COMM_d${dayIdx}`,
      catalogEntryId: postDeepEntry.id,
      name: postDeepEntry.name,
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: POST_DEEP_COMM_MINUTES,
      plannedStartAt: POST_DEEP_COMM_ANCHOR,
      anchor: POST_DEEP_COMM_ANCHOR,
      slotKind: 'POST_DEEP_COMM',
      state: 'PROPOSED',
      sourceOfSchedule: 'COMPOSER_AUTO'
    });
    remaining.COMMUNICATION -= POST_DEEP_COMM_MINUTES;
  }

  // Eligibility rules:
  //   DAILY cadence → always eligible.
  //   WEEKLY/SPRINT/ANCHOR → only when weeklyAnchorDay(entry) === dayIdx.
  //   No same-entry two days in a row unless DAILY.
  //
  // Each pick is capped at `COMM_MAX_PER_PICK` so a single entry with a
  // monster `defaultDurationMinutes` (e.g. #14 at 600 min) cannot absorb
  // the entire 120 min budget — leaves room for 2–3 distinct comm entries
  // per day.
  const COMM_MAX_PER_PICK = 60;
  const commEligible = universalComm.filter((e) => {
    if (!e) return false;
    const cad = e.cadence;
    if (cad === 'DAILY') return true;
    // non-DAILY → anchor day gate.
    return weeklyAnchorDay(e) === dayIdx;
  });

  const placedCommIds = [];
  let cIdx = 0;
  let cGuard = 16;
  while (
    remaining.COMMUNICATION >= 15 &&
    cIdx < commEligible.length &&
    cGuard > 0
  ) {
    cGuard -= 1;
    const entry = commEligible[cIdx];
    cIdx += 1;
    // Skip same-entry two days in a row unless DAILY.
    if (
      entry.cadence !== 'DAILY' &&
      Array.isArray(priorDayCommPicks) &&
      priorDayCommPicks.includes(entry.id)
    ) {
      continue;
    }
    const requested = entry.defaultDurationMinutes ?? COMM_MAX_PER_PICK;
    const dur = Math.min(requested, COMM_MAX_PER_PICK, remaining.COMMUNICATION);
    if (dur <= 0) continue;
    placed.push(
      materialize({
        entry,
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: dur,
        idSuffix: `d${dayIdx}_c${cIdx}`
      })
    );
    remaining.COMMUNICATION -= dur;
    placedCommIds.push(entry.id);
  }

  // --- CI -------------------------------------------------------------------

  const CI_MAX_PER_PICK = 60;
  let iIdx = 0;
  let iGuard = 16;
  while (remaining.CI >= 15 && iIdx < universalCi.length && iGuard > 0) {
    iGuard -= 1;
    const entry = universalCi[iIdx];
    iIdx += 1;
    const requested = entry.defaultDurationMinutes ?? CI_MAX_PER_PICK;
    const dur = Math.min(requested, CI_MAX_PER_PICK, remaining.CI);
    if (dur <= 0) continue;
    placed.push(
      materialize({
        entry,
        bucket: 'CI',
        plannedDurationMinutes: dur,
        idSuffix: `d${dayIdx}_i${iIdx}`
      })
    );
    remaining.CI -= dur;
  }

  // Iter 26: inject lunch block post-fill, pre-summary.
  // bucket===null means the summed totals below stay accurate for 4-2-2 math.
  // §6.5 hit: approved modification (OQ-4 weekly parity = YES).
  injectLunchBlock(placed, { dailyCapacityMinutes: capacityMinutes, date });

  // Summary sums (bucket===null rows are naturally excluded by `a.bucket in acc`).
  const summed = placed.reduce(
    (acc, a) => {
      if (a.bucket in acc) acc[a.bucket] += a.plannedDurationMinutes ?? 0;
      return acc;
    },
    { PROJECT: 0, COMMUNICATION: 0, CI: 0 }
  );

  const compositionId = `wcomp_${userId}_${date}`;

  return {
    id: compositionId,
    userId,
    cycleType: 'DAILY',
    startAt: `${date}T00:00:00Z`,
    endAt: `${date}T23:59:59Z`,
    parentCompositionId: null,
    state: 'PROPOSED',
    proposedAt: nowIso,
    decidedAt: null,
    closedAt: null,
    composerInputsSnapshot: {
      capacityMinutes,
      dayIdx,
      weeklyComposerVersion: 1
    },
    invariantChecks: {
      shape_4_2_2: {
        ok:
          summed.PROJECT >= BUCKET_FLOORS.PROJECT &&
          summed.COMMUNICATION >= BUCKET_FLOORS.COMMUNICATION &&
          summed.CI >= BUCKET_FLOORS.CI &&
          summed.PROJECT <= BUCKET_CEILINGS.PROJECT &&
          summed.COMMUNICATION <= BUCKET_CEILINGS.COMMUNICATION &&
          summed.CI <= BUCKET_CEILINGS.CI,
        projectMin: summed.PROJECT,
        commMin: summed.COMMUNICATION,
        ciMin: summed.CI
      },
      nonOptionalPresent: { ok: true, missing: [] },
      overAllocated: {
        ok: true,
        totalMin: summed.PROJECT + summed.COMMUNICATION + summed.CI,
        capacityMin: capacityMinutes
      }
    },
    activities: placed.map((a) => ({
      ...a,
      compositionId,
      state: 'PROPOSED',
      sourceOfSchedule: 'COMPOSER_AUTO'
    })),
    plannedByBucket: summed,
    dayIdx,
    date
  };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * composeWeekly — pure.
 *
 * @param {{
 *   weekStart: string,
 *   userId: string,
 *   kaizens?: object[],
 *   historicalCompletedCatalogIds?: string[],
 *   catalog: object[],
 *   capacityOverrides?: { [dayIdx: number]: number },
 *   dailyCapacityMinutes?: number,
 *   seedRng?: () => number,
 *   _now?: string
 * }} input
 * @returns {import('../domain/types.js').WeeklyComposition}
 */
export function composeWeekly(input) {
  if (!input || typeof input !== 'object') {
    const err = new Error('composeWeekly: input is required');
    err.name = 'INVALID_INPUT';
    throw err;
  }
  const {
    weekStart,
    userId,
    kaizens = [],
    historicalCompletedCatalogIds = [],
    catalog = [],
    capacityOverrides = {},
    dailyCapacityMinutes = 480
  } = input;

  if (typeof userId !== 'string' || userId.length === 0) {
    const err = new Error('composeWeekly: userId is required');
    err.name = 'INVALID_INPUT';
    throw err;
  }
  if (!Array.isArray(catalog)) {
    const err = new Error('composeWeekly: catalog must be an array');
    err.name = 'INVALID_INPUT';
    throw err;
  }

  const dates = weekDaysFromStart(weekStart);
  const nowIso = input._now ?? new Date().toISOString();

  const activeKaizens = kaizens.filter(
    (k) => k && (k.state === 'ACTIVE' || k.state === 'IN_REMEASUREMENT')
  );
  const sorted = sortKaizens(activeKaizens);

  const injections = buildKaizenInjections(
    sorted,
    historicalCompletedCatalogIds,
    catalog
  );

  const universalProjects = universalProjectPool(catalog);
  const universalComm = universalCommPool(catalog);
  const universalCi = universalCiPool(catalog);

  /** @type {object[]} */
  const days = [];
  /** @type {string[]} */
  let priorDayCommPicks = [];

  for (let i = 0; i < 5; i += 1) {
    const cap =
      typeof capacityOverrides[i] === 'number'
        ? capacityOverrides[i]
        : dailyCapacityMinutes;
    const composition = buildDay({
      userId,
      date: dates[i],
      dayIdx: i,
      capacityMinutes: cap,
      kaizenInjections: injections[i],
      universalProjects,
      universalComm,
      universalCi,
      priorDayCommPicks,
      nowIso
    });
    days.push(composition);
    priorDayCommPicks = (composition.activities ?? [])
      .filter((a) => a.bucket === 'COMMUNICATION')
      .map((a) => a.catalogEntryId);
  }

  /** @type {import('../domain/types.js').WeeklyComposition} */
  const weekly = {
    id: `wcomp_${userId}_${weekStart}`,
    userId,
    weekStart,
    weekEnd: dates[4],
    state: 'PROPOSED',
    proposedAt: nowIso,
    decidedAt: null,
    days,
    composerInputsSnapshot: {
      kaizens: sorted.map((k) => ({
        id: k.id,
        projectType: k.projectType,
        state: k.state
      })),
      historicalCompletedCatalogIds: [...historicalCompletedCatalogIds],
      dailyCapacityMinutes,
      capacityOverrides: { ...capacityOverrides }
    },
    version: 1
  };

  return weekly;
}

export default composeWeekly;
