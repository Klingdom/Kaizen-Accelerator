/**
 * dragController — pointer-event drag-and-drop controller for TodayGrid (Iter 35 Phase 2).
 *
 * Pure controller. Dependency-injectable for testability (matching Iter 24's
 * installFocusTrap precedent). No DOM access inside the math helpers; the
 * controller itself owns all DOM reads.
 *
 * Design:
 *   - pointerdown on .cycle-block-positioned (not protected, not in-progress): begin drag
 *   - pointerdown on .cycle-block-resize-handle: begin resize
 *   - pointermove: update ghost block via inline style (no rerender)
 *   - pointerup: commit or queue pending based on composition state
 *   - pointercancel: restore original position
 *
 * Snap interval: 15 min (SW-Q-CAL batch decision, Iter 35).
 *
 * Commit semantics (SW-Q-CAL-01):
 *   - composition.state === 'PROPOSED' → queue pending; call onDragPending
 *   - composition.state ∈ {'ACCEPTED','EDITED',...} → immediate; call onDragCommit
 *
 * Safety gates:
 *   - Protected blocks: no drag handles rendered (enforced in TodayGrid.js).
 *     Guard deferred to onPointerMove (same pattern as IN_PROGRESS, Iter 41/44).
 *   - IN_PROGRESS activities: guard deferred to onPointerMove after CLICK_THRESHOLD_PX
 *   - PROPOSED pending: updates dragSession slice only, no immediate state mutation
 *
 * §6.5 boundary: this file lives in js/ui/ — frontend only.
 *
 * @param {Element} rootEl — the .cycle-timeline element to attach listeners to
 * @param {{
 *   getCompositionState:  () => string,
 *   isProtected:          (activityId: string) => boolean,
 *   isInProgress:         (activityId: string) => boolean,
 *   onDragPreview:        (preview: {activityId, proposedStart, proposedDuration}) => void,
 *   onDragCommit:         (result: {activityId, newStart: string, newDuration: number, mode: string}) => void,
 *   onDragPending:        (result: {activityId, newStart: string, newDuration: number, originalStart: string, originalDuration: number, mode: string}) => void,
 *   onProtectedAttempt?:  () => void,
 *   onInProgressAttempt?: () => void,
 *   gridStartHour?:       number,
 *   gridEndHour?:         number,
 *   rowHeightPx?:         number,
 *   snapMinutes?:         number,
 *   _doc?:                Document   (optional document injection for testability)
 * }} options
 * @returns {{ release: () => void }}
 */

import {
  DEFAULT_GRID_START_HOUR,
  DEFAULT_GRID_END_HOUR,
  DEFAULT_ROW_HEIGHT_PX
} from './weekGridMath.js';

/** Minimum drag movement (px) before a press is treated as drag vs click. */
const CLICK_THRESHOLD_PX = 5;

/** Minimum block duration (minutes) — a resize cannot shrink below this. */
const MIN_DURATION_MINUTES = 15;

/**
 * Convert a pixel delta (Δy) to minutes, snapped to the nearest snapInterval.
 *
 * @param {number} deltaY
 * @param {number} rowHeightPx
 * @param {number} snapInterval
 * @returns {number}
 */
export function pxToSnappedMinutes(deltaY, rowHeightPx, snapInterval) {
  const rawMinutes = (deltaY / rowHeightPx) * 60;
  return Math.round(rawMinutes / snapInterval) * snapInterval;
}

/**
 * Clamp minutes-of-day to the grid window.
 *
 * @param {number} minutesOfDay
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @returns {number}
 */
export function clampToGrid(minutesOfDay, gridStartHour, gridEndHour) {
  const min = gridStartHour * 60;
  const max = gridEndHour * 60;
  return Math.max(min, Math.min(max, minutesOfDay));
}

/**
 * Convert minutes-of-day to a HH:MM string.
 *
 * @param {number} minutesOfDay
 * @returns {string}
 */
export function minutesToHHMM(minutesOfDay) {
  const h = Math.floor(minutesOfDay / 60);
  const m = minutesOfDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Parse HH:MM or HH:MM:SS or ISO timestamp to minutes of day.
 * Returns null on failure.
 *
 * @param {string|null|undefined} value
 * @returns {number|null}
 */
function parseMinutesOfDay(value) {
  if (!value || typeof value !== 'string') return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Detect time-range overlap between two activities (pure function).
 *
 * Returns null when no overlap; returns a descriptor when there is one.
 * Adjacent blocks (end === next start) are NOT overlapping.
 *
 * @param {object[]} activities  — full activities array
 * @param {string}   candidateId — the activity being moved
 * @param {number}   candidateStartMin — proposed start (minutes of day)
 * @param {number}   candidateDurationMin — proposed duration (minutes)
 * @returns {null | {againstId: string, againstName: string, againstStartHHMM: string}}
 */
export function detectOverlap(activities, candidateId, candidateStartMin, candidateDurationMin) {
  if (!Array.isArray(activities)) return null;
  const candidateEnd = candidateStartMin + candidateDurationMin;
  for (const a of activities) {
    if (!a || a.id === candidateId) continue;
    const aStart = parseMinutesOfDay(a.plannedStartAt ?? null);
    if (aStart === null) continue;
    const aDur = Number(a.plannedDurationMinutes ?? 0);
    const aEnd = aStart + aDur;
    // Overlap when intervals intersect (strictly — adjacent is OK).
    if (candidateStartMin < aEnd && candidateEnd > aStart) {
      return {
        againstId: a.id,
        againstName: a.name ?? a.catalogEntryId ?? a.id,
        againstStartHHMM: minutesToHHMM(aStart)
      };
    }
  }
  return null;
}

/**
 * Install a drag controller on a grid timeline element.
 *
 * @param {Element} rootEl
 * @param {object} options
 * @returns {{ release: () => void }}
 */
export function installDragController(rootEl, options = {}) {
  // _doc is accepted for optional injection (test compatibility per Iter 24 pattern)
  // but is not used internally — the controller only attaches listeners to rootEl.
  // Guard only on rootEl being present; _doc is irrelevant for the pointer lifecycle.
  if (!rootEl) {
    return { release() {} };
  }

  const gridStartHour = Number.isFinite(options.gridStartHour) ? options.gridStartHour : DEFAULT_GRID_START_HOUR;
  const gridEndHour   = Number.isFinite(options.gridEndHour)   ? options.gridEndHour   : DEFAULT_GRID_END_HOUR;
  const rowHeightPx   = Number.isFinite(options.rowHeightPx)   ? options.rowHeightPx   : DEFAULT_ROW_HEIGHT_PX;
  const snapInterval  = Number.isFinite(options.snapMinutes)    ? options.snapMinutes    : 15;

  const getCompositionState  = typeof options.getCompositionState === 'function'  ? options.getCompositionState  : () => 'ACCEPTED';
  const isProtected          = typeof options.isProtected === 'function'          ? options.isProtected          : () => false;
  const isInProgress         = typeof options.isInProgress === 'function'         ? options.isInProgress         : () => false;
  const onDragPreview        = typeof options.onDragPreview === 'function'        ? options.onDragPreview        : () => {};
  const onDragCommit         = typeof options.onDragCommit === 'function'         ? options.onDragCommit         : () => {};
  const onDragPending        = typeof options.onDragPending === 'function'        ? options.onDragPending        : () => {};
  const onProtectedAttempt   = typeof options.onProtectedAttempt === 'function'   ? options.onProtectedAttempt   : () => {};
  const onInProgressAttempt  = typeof options.onInProgressAttempt === 'function'  ? options.onInProgressAttempt  : () => {};

  /** Active drag session — null when not dragging. */
  let session = null;

  // -------------------------------------------------------------------------
  // pointerdown — initiate drag or resize
  // -------------------------------------------------------------------------
  function onPointerDown(ev) {
    // Only react to primary pointer (left mouse button or first touch).
    if (ev.button !== undefined && ev.button !== 0) return;

    // Determine mode from target element's class.
    const target = ev.target;
    if (!target || typeof target.closest !== 'function') return;

    // Find the block article.
    const blockEl = target.closest('.cycle-block-positioned');
    if (!blockEl) return;

    const activityId = blockEl.getAttribute('data-activity-id');
    if (!activityId) return;

    // Safety gate 1: IN_PROGRESS activities cannot be dragged, but they CAN be
    // clicked. We do NOT bail here — the session is tracked so that:
    //   • a pure click (no movement) propagates normally to OPEN_BLOCK_DETAIL.
    //   • an actual drag attempt (movement > CLICK_THRESHOLD_PX) is caught in
    //     onPointerMove, which fires onInProgressAttempt and cancels the session.

    // Safety gate 2: protected blocks — same deferred pattern as IN_PROGRESS
    // (Iter 44 / META §A.2). We do NOT bail here; a pure click must propagate
    // to OPEN_BLOCK_DETAIL. onProtectedAttempt is fired only when the pointer
    // moves past CLICK_THRESHOLD_PX in onPointerMove.

    // Determine mode: resize if on the handle, otherwise move.
    const isResizeHandle = target.closest('.cycle-block-resize-handle') !== null;
    const mode = isResizeHandle ? 'resize' : 'move';

    // Capture the grid's bounding rect for coordinate math.
    const gridRect = rootEl.getBoundingClientRect
      ? rootEl.getBoundingClientRect()
      : { top: 0, left: 0 };

    const blockRect = blockEl.getBoundingClientRect
      ? blockEl.getBoundingClientRect()
      : { top: gridRect.top, height: 60 };

    // Read the original start + duration from the block's data attributes or
    // from the block's current visual position (more reliable).
    const startAttr = blockEl.getAttribute('data-activity-start') ?? null;
    const durAttr   = blockEl.getAttribute('data-activity-duration') ?? null;
    const originalStartMin  = startAttr !== null ? Number(startAttr) : null;
    const originalDuration  = durAttr   !== null ? Number(durAttr)   : null;

    // Capture pointer so move/up are routed even when pointer leaves blockEl.
    if (typeof blockEl.setPointerCapture === 'function') {
      try { blockEl.setPointerCapture(ev.pointerId); } catch (_) { /* non-fatal */ }
    }

    session = {
      activityId,
      mode,
      startClientY:   ev.clientY,
      startClientX:   ev.clientX,
      originalStartMin,
      originalDuration,
      gridTop:  gridRect.top,
      blockTop: blockRect.top - gridRect.top,
      blockHeight: blockRect.height,
      blockEl,
      hasMoved:   false,
      pointerId:  ev.pointerId
    };

    // Visual: mark the block as dragging.
    blockEl.classList.add('cycle-block-dragging');
  }

  // -------------------------------------------------------------------------
  // pointermove — update ghost block
  // -------------------------------------------------------------------------
  function onPointerMove(ev) {
    if (!session) return;

    const deltaY = ev.clientY - session.startClientY;
    const deltaX = ev.clientX - session.startClientX;

    // Classify as moved once past the click threshold.
    if (!session.hasMoved && Math.sqrt(deltaY * deltaY + deltaX * deltaX) >= CLICK_THRESHOLD_PX) {
      session.hasMoved = true;
    }
    if (!session.hasMoved) return;

    // Safety gate: IN_PROGRESS check deferred from pointerdown so that pure
    // clicks are never interrupted. Now that we know the user is actually
    // dragging, block + notify.
    if (isInProgress(session.activityId)) {
      onInProgressAttempt();
      // Cancel the session without committing.
      const s = session;
      session = null;
      if (s.blockEl) {
        if (typeof s.blockEl.releasePointerCapture === 'function') {
          try { s.blockEl.releasePointerCapture(ev.pointerId); } catch (_) { /* non-fatal */ }
        }
        s.blockEl.classList.remove('cycle-block-dragging');
        _restoreBlock(s);
      }
      return;
    }

    // Safety gate: protected blocks — same deferred pattern (Iter 44 / META §A.2).
    // Toast fires only when the user has genuinely started a drag; pure clicks
    // propagate normally (session.hasMoved remains false → pointerup returns early).
    if (isProtected(session.activityId)) {
      onProtectedAttempt();
      // Cancel the session without committing.
      const sp = session;
      session = null;
      if (sp.blockEl) {
        if (typeof sp.blockEl.releasePointerCapture === 'function') {
          try { sp.blockEl.releasePointerCapture(ev.pointerId); } catch (_) { /* non-fatal */ }
        }
        sp.blockEl.classList.remove('cycle-block-dragging');
        _restoreBlock(sp);
      }
      return;
    }

    const snappedDelta = pxToSnappedMinutes(deltaY, rowHeightPx, snapInterval);

    if (session.mode === 'move') {
      if (session.originalStartMin === null) return;
      const proposedStart = clampToGrid(
        session.originalStartMin + snappedDelta,
        gridStartHour,
        gridEndHour
      );
      const proposedTopPx = (proposedStart - gridStartHour * 60) * (rowHeightPx / 60);

      // Update ghost position via inline style — no rerender.
      session.blockEl.style.top = `${proposedTopPx}px`;

      onDragPreview({
        activityId: session.activityId,
        proposedStart,
        proposedDuration: session.originalDuration
      });
    } else if (session.mode === 'resize') {
      if (session.originalDuration === null) return;
      // Resize: only height changes; top stays fixed.
      const snappedDurationDelta = pxToSnappedMinutes(deltaY, rowHeightPx, snapInterval);
      const proposedDuration = Math.max(
        MIN_DURATION_MINUTES,
        session.originalDuration + snappedDurationDelta
      );
      const proposedHeightPx = proposedDuration * (rowHeightPx / 60);

      session.blockEl.style.height = `${proposedHeightPx}px`;

      onDragPreview({
        activityId: session.activityId,
        proposedStart: session.originalStartMin,
        proposedDuration
      });
    }
  }

  // -------------------------------------------------------------------------
  // pointerup — commit or queue
  // -------------------------------------------------------------------------
  function onPointerUp(ev) {
    if (!session) return;
    if (ev.pointerId !== undefined && ev.pointerId !== session.pointerId) return;

    const s = session;
    session = null;

    // Release capture.
    if (s.blockEl && typeof s.blockEl.releasePointerCapture === 'function') {
      try { s.blockEl.releasePointerCapture(ev.pointerId); } catch (_) { /* non-fatal */ }
    }

    // Remove dragging class.
    if (s.blockEl) s.blockEl.classList.remove('cycle-block-dragging');

    // If not moved, treat as a click — do nothing (OPEN_BLOCK_DETAIL is
    // handled by the existing click delegate on the block via data-action).
    if (!s.hasMoved) return;

    const deltaY = ev.clientY - s.startClientY;
    const snappedDelta = pxToSnappedMinutes(deltaY, rowHeightPx, snapInterval);

    let newStart = s.originalStartMin;
    let newDuration = s.originalDuration;

    if (s.mode === 'move') {
      if (s.originalStartMin === null) {
        _restoreBlock(s);
        return;
      }
      newStart = clampToGrid(s.originalStartMin + snappedDelta, gridStartHour, gridEndHour);
      newDuration = s.originalDuration;
    } else if (s.mode === 'resize') {
      if (s.originalDuration === null) {
        _restoreBlock(s);
        return;
      }
      const durationDelta = pxToSnappedMinutes(deltaY, rowHeightPx, snapInterval);
      newDuration = Math.max(MIN_DURATION_MINUTES, s.originalDuration + durationDelta);
      newStart = s.originalStartMin;
    }

    const newStartHHMM = newStart !== null ? minutesToHHMM(newStart) : null;
    if (!newStartHHMM) {
      _restoreBlock(s);
      return;
    }

    const compState = getCompositionState();
    const isProposed = compState === 'PROPOSED';

    if (isProposed) {
      // PROPOSED path: queue pending. Do not commit immediately.
      // Restore the visual position — pending-confirm banner takes over.
      _restoreBlock(s);
      onDragPending({
        activityId: s.activityId,
        newStart:   newStartHHMM,
        newDuration,
        originalStart:    s.originalStartMin !== null ? minutesToHHMM(s.originalStartMin) : newStartHHMM,
        originalDuration: s.originalDuration ?? newDuration,
        mode: s.mode
      });
    } else {
      // ACCEPTED / EDITED path: commit immediately.
      onDragCommit({
        activityId: s.activityId,
        newStart:   newStartHHMM,
        newDuration,
        mode: s.mode
      });
    }
  }

  // -------------------------------------------------------------------------
  // pointercancel — abort the drag
  // -------------------------------------------------------------------------
  function onPointerCancel(ev) {
    if (!session) return;
    const s = session;
    session = null;
    if (s.blockEl) s.blockEl.classList.remove('cycle-block-dragging');
    _restoreBlock(s);
  }

  // -------------------------------------------------------------------------
  // Restore block to its original visual position.
  // -------------------------------------------------------------------------
  function _restoreBlock(s) {
    if (!s.blockEl) return;
    if (s.originalStartMin !== null) {
      const originalTopPx = (s.originalStartMin - gridStartHour * 60) * (rowHeightPx / 60);
      s.blockEl.style.top = `${originalTopPx}px`;
    }
    if (s.originalDuration !== null) {
      const originalHeightPx = s.originalDuration * (rowHeightPx / 60);
      s.blockEl.style.height = `${originalHeightPx}px`;
    }
  }

  // -------------------------------------------------------------------------
  // Attach event listeners
  // -------------------------------------------------------------------------
  rootEl.addEventListener('pointerdown', onPointerDown);
  rootEl.addEventListener('pointermove', onPointerMove);
  rootEl.addEventListener('pointerup',   onPointerUp);
  rootEl.addEventListener('pointercancel', onPointerCancel);

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------
  function release() {
    if (session) {
      if (session.blockEl) session.blockEl.classList.remove('cycle-block-dragging');
      session = null;
    }
    rootEl.removeEventListener('pointerdown', onPointerDown);
    rootEl.removeEventListener('pointermove', onPointerMove);
    rootEl.removeEventListener('pointerup',   onPointerUp);
    rootEl.removeEventListener('pointercancel', onPointerCancel);
  }

  return { release };
}

export default installDragController;
