/**
 * relaxConfigurable — step-9 retry helper for composeDaily (Sprint 3).
 *
 * Implements coordinator ruling #2 (priority chain for shrinking / dropping
 * configurables when validateComposition fails with OVER_CAPACITY,
 * *_OVERPACKED, or *_UNDER_FLOOR). The rules apply in order:
 *
 *   1. CI rotation tail — drop blocks with ciPriority ≤ 20 first
 *      (Weekly Reflection spillover, continuous-monthly CI).
 *   2. CI rotation head — drop blocks with ciPriority 40–60 next
 *      (L&D, continuous).
 *   3. COMM fillers — generic Value-Added Communication first, then 1:1,
 *      then team meeting.
 *   4. Non-strategic DMAIC Deep payload — drop Deep slices where the linked
 *      action is NOT flagged `strategic=true`.
 *   5. NEVER relax: strategic-flagged Deep actions, non-optional ceremonies,
 *      Deep anchors, the daily non-optional set.
 *
 * If relaxation exhausts without a feasible composition, the caller builds
 * an `InfeasibleResult` per ENGINE_DESIGN §4.7.
 *
 * Pure; no I/O. Returns a NEW array (does not mutate the input).
 */

/** Names that must never be dropped. */
const PROTECTED_NAMES = Object.freeze(new Set([
  'Daily Standup',
  'AM High-value Communication',
  'Post-lunch High-value Communication',
  // Iter 38 Phase B: POST_DEEP_COMM anchor protected by name.
  'End-of-Deep-Cycles Communication',
  'End-of-Activity Reflection',
  'Sprint Planning',
  'Mid-Sprint Review',
  'Sprint Review',
  'Sprint Retrospective'
]));

/** Ids that must never be dropped (non-optional ceremonies). */
const PROTECTED_IDS = Object.freeze(new Set([
  'cer_daily_standup',
  'cer_sprint_planning',
  'cer_mid_sprint_review',
  'cer_sprint_review',
  'cer_sprint_retrospective',
  'gen_end_of_activity_reflection'
]));

/**
 * True when `a` is a protected non-optional that must survive relaxation.
 *
 * @param {object} a
 */
function isProtected(a) {
  if (!a) return false;
  if (PROTECTED_IDS.has(a.catalogEntryId)) return true;
  if (PROTECTED_NAMES.has(a.name)) return true;
  if (a.slotKind === 'AM_COMM' || a.slotKind === 'POST_LUNCH_COMM' || a.slotKind === 'POST_DEEP_COMM') return true;
  if (a.carriedOver === true) return true; // R2 rescues survive relaxation
  // Strategic-flagged Deep payload survives.
  if (a.bucket === 'PROJECT' && a.strategic === true) return true;
  return false;
}

/**
 * Rank a block for relaxation priority — LOWER rank drops first.
 *
 *   1 — CI with ciPriority ≤ 20 (Weekly Reflection spillover, low-priority
 *       CI). Marked by `whyRule === 'R_CI_ROTATION'` AND `whyDetail` hinting
 *       low priority, or by priority field on the block.
 *   2 — CI with ciPriority 40–60 (L&D, continuous).
 *   3 — COMM generic filler (gen_value_added_communication).
 *   4 — COMM 1:1.
 *   5 — COMM team meeting.
 *   6 — Non-strategic DMAIC Deep payload (PROJECT, not strategic).
 *   99 — protected (should never reach this codepath).
 *
 * @param {object} a
 */
function relaxRank(a) {
  if (isProtected(a)) return 99;

  if (a.bucket === 'CI') {
    const p = typeof a.ciPriority === 'number' ? a.ciPriority : null;
    if (p !== null && p <= 20) return 1;
    if (p !== null && p >= 40 && p <= 60) return 2;
    // Unknown CI priority — default to rank-2 (safer than rank-1).
    return 2;
  }

  if (a.bucket === 'COMMUNICATION') {
    if (a.catalogEntryId === 'gen_value_added_communication') return 3;
    if (a.catalogEntryId === 'cat_16_connecting_w_teammates' || a.name === 'Connecting w/ teammates') return 4;
    if (a.catalogEntryId === 'cat_15_high_value_team_meetings' || a.name === 'High-value team meetings') return 5;
    return 5; // default COMM filler
  }

  if (a.bucket === 'PROJECT') {
    // Strategic Deep payload is protected; non-strategic is rank-6.
    if (a.strategic === true) return 99;
    return 6;
  }

  return 99;
}

/**
 * Try one relaxation step against the current `placed[]` set and the
 * validation failure code. Returns `{ placed, dropped }` on success (a NEW
 * placed[] array with one fewer block), or `null` when no relaxable block
 * remains.
 *
 * @param {object[]} placed
 * @param {string} failureCode
 * @returns {{placed: object[], dropped: object}|null}
 */
export function relaxOnce(placed, failureCode) {
  if (!Array.isArray(placed) || placed.length === 0) return null;

  // For OVERPACKED / OVER_CAPACITY — drop a block from the overpacked bucket.
  // For UNDER_FLOOR — cannot be fixed by dropping; caller may handle via a
  // different strategy (adding more). This relaxer focuses on dropping.
  const bucketHint = (() => {
    if (failureCode === 'PROJECT_OVERPACKED') return 'PROJECT';
    if (failureCode === 'COMM_OVERPACKED') return 'COMMUNICATION';
    if (failureCode === 'CI_OVERPACKED') return 'CI';
    return null;
  })();

  // Build candidates — include rank and a stable secondary key.
  const candidates = placed.map((a, idx) => ({
    a,
    idx,
    rank: relaxRank(a),
    bucket: a.bucket
  }));

  // First try to drop from the hinted bucket; else fall back to any.
  let eligible = candidates.filter((c) => c.rank < 99);
  if (bucketHint) {
    const inBucket = eligible.filter((c) => c.bucket === bucketHint);
    if (inBucket.length > 0) eligible = inBucket;
  }

  if (eligible.length === 0) return null;

  eligible.sort(
    (a, b) => a.rank - b.rank || a.idx - b.idx
  );

  const target = eligible[0];
  const next = placed.slice();
  next.splice(target.idx, 1);
  return { placed: next, dropped: target.a };
}

/**
 * Iteratively drop blocks until `validateFn(placed)` returns ok OR no more
 * blocks can be relaxed. Returns `{ placed, dropped[], result }` where
 * `result` is the final validateFn return.
 *
 * @param {object[]} placed
 * @param {(acts: object[]) => {ok: boolean, failureCode: string|null, detail: object}} validateFn
 * @param {number} [maxPasses=16]
 * @returns {{placed: object[], dropped: object[], result: {ok: boolean, failureCode: string|null, detail: object}}}
 */
export function relaxConfigurable(placed, validateFn, maxPasses = 16) {
  let current = placed.slice();
  const dropped = [];
  let result = validateFn(current);
  let passes = 0;

  while (!result.ok && passes < maxPasses) {
    const step = relaxOnce(current, result.failureCode);
    if (!step) break;
    current = step.placed;
    dropped.push(step.dropped);
    result = validateFn(current);
    passes += 1;
  }

  return { placed: current, dropped, result };
}

export default relaxConfigurable;
