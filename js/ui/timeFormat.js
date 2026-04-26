/**
 * Sprint 16a — pure time-formatting helpers shared across activity blocks.
 *
 * `formatTime` was previously defined inline in
 * `js/ui/components/ScheduledActivityBlock.js`. Sprint 16a adds the
 * companion `formatTimeRange` helper for the new "HH:MM–HH:MM" display on
 * Today and Week activity blocks, and lifts both into a single module so
 * the WeekGrid block + Today row can share identical semantics.
 *
 * No DOM. No deps. Pure functions only.
 */

/**
 * Format a planned start time (ISO timestamp or already-formatted HH:MM)
 * to a clean "HH:MM" string in UTC. Returns "" for missing / unparseable
 * input — callers downstream rely on the empty-string sentinel to skip
 * rendering when no start is available.
 *
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatTime(iso) {
  if (!iso) return '';
  // Accept raw HH:MM first (composer anchors come as e.g. '09:00').
  if (/^\d{2}:\d{2}$/.test(iso)) return iso;
  if (/^\d{2}:\d{2}:\d{2}$/.test(iso)) return iso.slice(0, 5);
  // ISO timestamp — extract HH:MM from Date().
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Convert a parsed HH:MM to the integer minute-of-day, or null if the
 * input couldn't be reduced to HH:MM via `formatTime`.
 *
 * @param {string | null | undefined} iso
 * @returns {number | null}
 */
function minutesOfDay(iso) {
  const formatted = formatTime(iso);
  if (formatted === '') return null;
  const hh = Number(formatted.slice(0, 2));
  const mm = Number(formatted.slice(3, 5));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

/**
 * Format a planned start + duration as "HH:MM–HH:MM" using an en-dash
 * (U+2013). Returns "" when the start is missing/unparseable; returns
 * just the start time when duration is missing, 0, or negative.
 *
 * Wraps gracefully across the 24-hour boundary (the composer doesn't
 * span midnight in practice, but defensive math keeps the helper pure
 * and total).
 *
 * @param {string | null | undefined} startIso  ISO timestamp OR HH:MM
 * @param {number | null | undefined} durationMinutes
 * @returns {string}
 */
export function formatTimeRange(startIso, durationMinutes) {
  const start = formatTime(startIso);
  if (start === '') return '';
  const dur = Number(durationMinutes);
  if (!Number.isFinite(dur) || dur <= 0) return start;
  const startMin = minutesOfDay(startIso);
  if (startMin === null) return start;
  // Wrap modulo 24h so 23:30 + 60 → 00:30 instead of 24:30.
  const endMin = ((startMin + Math.round(dur)) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(endMin / 60)).padStart(2, '0');
  const mm = String(endMin % 60).padStart(2, '0');
  return `${start}\u2013${hh}:${mm}`;
}
