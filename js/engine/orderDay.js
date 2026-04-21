/**
 * orderDay — step-8 helper for composeDaily (Sprint 3).
 *
 * Implements ENGINE_DESIGN §1.7. Fixed ceremony anchors + packing rules:
 *
 *   09:00 — Daily Standup (anchor)
 *   09:15 — AM High-value Communication (anchor)
 *   09:30 — Sprint Planning (anchor — PLANNING_DAY only)
 *   13:00 — Post-lunch High-value Communication (anchor)
 *   14:00 — Sprint Review (anchor — REVIEW_DAY Wk2)
 *   15:00 — Mid-Sprint Review (anchor — MID_SPRINT_DAY) / Sprint Retrospective
 *   16:30 — Weekly Reflection (anchor — Fri PM only)
 *   17:00 — End-of-Activity Reflection (anchor — always last)
 *
 *   Deep Work slices pack before lunch (first slice contiguous with AM
 *   Communication end) and after Post-lunch Comm; CI blocks pack toward EOD;
 *   COMM fillers use any remaining morning/afternoon slot.
 *
 * Mutates `placed[]` in place by setting `plannedStartAt` (HH:MM local). Does
 * not re-order the array; the array order is preserved for audit parity.
 *
 * Pure-ish (only modifies its argument) — no I/O.
 */

/** Anchors keyed by matcher. Order is meaningful. */
const CEREMONY_ANCHORS = Object.freeze({
  DAILY_STANDUP: '09:00',
  AM_COMM: '09:15',
  SPRINT_PLANNING: '09:30',
  POST_LUNCH_COMM: '13:00',
  SPRINT_REVIEW: '14:00',
  MID_SPRINT_REVIEW: '15:00',
  SPRINT_RETROSPECTIVE: '15:30',
  WEEKLY_REFLECTION: '16:30',
  END_OF_ACTIVITY_REFLECTION: '17:00'
});

/** Minutes-since-midnight helper. */
function parseClock(hhmm) {
  const [h, m] = hhmm.split(':').map((n) => Number.parseInt(n, 10));
  return h * 60 + m;
}

/** Inverse of parseClock. */
function formatClock(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Identify whether a placed block is a ceremony anchor and return the
 * anchor time (HH:MM) if so. Otherwise null.
 *
 * @param {object} p
 * @returns {string|null}
 */
function ceremonyAnchorFor(p) {
  if (p.anchor && typeof p.anchor === 'string') return p.anchor;
  if (p.slotKind === 'AM_COMM') return CEREMONY_ANCHORS.AM_COMM;
  if (p.slotKind === 'POST_LUNCH_COMM') return CEREMONY_ANCHORS.POST_LUNCH_COMM;
  if (p.catalogEntryId === 'cer_daily_standup') return CEREMONY_ANCHORS.DAILY_STANDUP;
  if (p.catalogEntryId === 'cer_sprint_planning') return CEREMONY_ANCHORS.SPRINT_PLANNING;
  if (p.catalogEntryId === 'cer_sprint_review') return CEREMONY_ANCHORS.SPRINT_REVIEW;
  if (p.catalogEntryId === 'cer_mid_sprint_review') return CEREMONY_ANCHORS.MID_SPRINT_REVIEW;
  if (p.catalogEntryId === 'cer_sprint_retrospective') return CEREMONY_ANCHORS.SPRINT_RETROSPECTIVE;
  if (p.catalogEntryId === 'gen_weekly_reflection') return CEREMONY_ANCHORS.WEEKLY_REFLECTION;
  if (p.catalogEntryId === 'gen_end_of_activity_reflection' || p.name === 'End-of-Activity Reflection')
    return CEREMONY_ANCHORS.END_OF_ACTIVITY_REFLECTION;
  return null;
}

/**
 * Partition placed blocks into { anchored, deep, comm, ci } in stable
 * iteration order.
 *
 * @param {object[]} placed
 */
function partition(placed) {
  /** @type {object[]} */
  const anchored = [];
  /** @type {object[]} */
  const deep = [];
  /** @type {object[]} */
  const comm = [];
  /** @type {object[]} */
  const ci = [];
  for (const p of placed) {
    const anchor = ceremonyAnchorFor(p);
    if (anchor) {
      p._anchorTime = anchor;
      anchored.push(p);
      continue;
    }
    if (p.bucket === 'PROJECT') deep.push(p);
    else if (p.bucket === 'COMMUNICATION') comm.push(p);
    else if (p.bucket === 'CI') ci.push(p);
  }
  return { anchored, deep, comm, ci };
}

/**
 * Order the day per ENGINE_DESIGN §1.7. Mutates `placed` in place by
 * setting `plannedStartAt` as HH:MM strings (local wall-clock).
 *
 * @param {object[]} placed
 * @param {object} input ComposerInput-shaped
 * @returns {object[]} the same array for chain-friendly use
 */
export function orderDay(placed, input) {
  if (!Array.isArray(placed)) return placed;

  const { anchored, deep, comm, ci } = partition(placed);

  // 1) Apply anchor times.
  for (const p of anchored) {
    p.plannedStartAt = p._anchorTime;
    delete p._anchorTime;
  }

  // 2) Compute where Deep blocks pack.
  //
  //    Deep before lunch: first Deep slice starts immediately after AM Comm
  //    ends (AM Comm starts at 09:15). We compute a "deep start morning" and
  //    pack slices contiguously, skipping over 12:00 lunch and the 13:00
  //    Post-lunch Comm anchor.
  const amComm = anchored.find((p) => p.slotKind === 'AM_COMM');
  const postComm = anchored.find((p) => p.slotKind === 'POST_LUNCH_COMM');
  const lunchMins = 12 * 60;
  const morningDeepStart = amComm
    ? parseClock(amComm.plannedStartAt) + amComm.plannedDurationMinutes
    : parseClock('10:15');
  const afternoonDeepStart = postComm
    ? parseClock(postComm.plannedStartAt) + postComm.plannedDurationMinutes
    : parseClock('13:30');

  // 3) Pack Deep slices — morning first until lunch, then afternoon.
  let cursorMorning = morningDeepStart;
  let cursorAfternoon = afternoonDeepStart;
  const reflectionStart = parseClock(CEREMONY_ANCHORS.END_OF_ACTIVITY_REFLECTION);
  // Weekly Reflection on Fri PM eats the 16:30 slot — cap afternoon cursor at 16:30 in that case.
  const hasWeeklyRefl = anchored.some((p) => p.catalogEntryId === 'gen_weekly_reflection');
  const afternoonCap = hasWeeklyRefl
    ? parseClock(CEREMONY_ANCHORS.WEEKLY_REFLECTION)
    : reflectionStart;

  for (const d of deep) {
    // Try morning first.
    if (cursorMorning + d.plannedDurationMinutes <= lunchMins) {
      d.plannedStartAt = formatClock(cursorMorning);
      cursorMorning += d.plannedDurationMinutes;
    } else if (cursorAfternoon + d.plannedDurationMinutes <= afternoonCap) {
      d.plannedStartAt = formatClock(cursorAfternoon);
      cursorAfternoon += d.plannedDurationMinutes;
    } else {
      // No room — still place at the latest reachable slot (validator catches).
      d.plannedStartAt = formatClock(cursorAfternoon);
      cursorAfternoon += d.plannedDurationMinutes;
    }
  }

  // 4) Pack COMMUNICATION fillers in morning/afternoon free slots (after
  //    AM Comm, before lunch; after Post-lunch Comm, before CI block).
  //    We use the same cursors as Deep but extended.
  for (const c of comm) {
    if (cursorMorning + c.plannedDurationMinutes <= lunchMins) {
      c.plannedStartAt = formatClock(cursorMorning);
      cursorMorning += c.plannedDurationMinutes;
    } else if (cursorAfternoon + c.plannedDurationMinutes <= afternoonCap) {
      c.plannedStartAt = formatClock(cursorAfternoon);
      cursorAfternoon += c.plannedDurationMinutes;
    } else {
      c.plannedStartAt = formatClock(cursorAfternoon);
      cursorAfternoon += c.plannedDurationMinutes;
    }
  }

  // 5) Pack CI blocks toward end-of-day (after Deep slices). Start from
  //    afternoonDeepStart if no Deep slices placed; otherwise pack from
  //    cursorAfternoon back down to reflectionStart-sized slot.
  let ciCursor = Math.max(cursorAfternoon, afternoonDeepStart);
  for (const c of ci) {
    if (ciCursor + c.plannedDurationMinutes > reflectionStart) {
      // past reflection anchor — still place (validator surfaces)
    }
    c.plannedStartAt = formatClock(ciCursor);
    ciCursor += c.plannedDurationMinutes;
  }

  return placed;
}

export { CEREMONY_ANCHORS };
export default orderDay;
