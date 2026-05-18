/**
 * dragController.test.js — Iter 35 Phase 2 drag-and-drop unit tests.
 *
 * Tests cover:
 *   Pure math helpers:
 *     DC-M1: pxToSnappedMinutes — snap to 15-min grid
 *     DC-M2: clampToGrid — boundary clamping
 *     DC-M3: minutesToHHMM — format conversion
 *     DC-M4: detectOverlap — time-range intersection
 *
 *   Controller lifecycle (via _doc injection, matching Iter 24 focusTrap pattern):
 *     DC-L1: pointerdown on block initiates drag session (mode=move)
 *     DC-L2: pointerdown on resize handle initiates drag session (mode=resize)
 *     DC-L3: pointermove updates block style.top (move)
 *     DC-L4: pointermove updates block style.height (resize)
 *     DC-L5: pointerup without movement is treated as click (no commit)
 *     DC-L6: pointerup with movement fires onDragCommit (ACCEPTED state)
 *     DC-L7: pointerup with movement fires onDragPending (PROPOSED state)
 *     DC-L8: pointercancel restores original position
 *     DC-L9: isInProgress guard — pointerdown bails, fires onInProgressAttempt
 *     DC-L10: isProtected guard — pointerdown bails, fires onProtectedAttempt
 *     DC-L11: release() teardown removes all listeners
 *
 *   Safety gates (AC6, AC7, AC8, AC9):
 *     DC-S1: PROPOSED state → onDragPending called, not onDragCommit
 *     DC-S2: ACCEPTED state → onDragCommit called, not onDragPending
 *     DC-S3: IN_PROGRESS activity → drag blocked
 *     DC-S4: protected activity → drag blocked
 *
 *   Snap math:
 *     DC-SN1: 60px delta → 60min at 60px/hr (1px=1min)
 *     DC-SN2: 45px delta → 45min raw → snapped to 45 (already 15-min aligned)
 *     DC-SN3: 50px delta → 50min raw → snapped to 45min (nearest 15)
 *     DC-SN4: 7px delta → 7min raw → snapped to 15min (nearest 15)
 *     DC-SN5: -7px delta → -7min → snapped to 0 (nearest 15 = 0 when close to zero)
 *     DC-SN6: clamping prevents start < gridStartHour
 *     DC-SN7: minimum resize duration floor (15 min)
 *
 *   Conflict detection:
 *     DC-CD1: exact overlap returns descriptor
 *     DC-CD2: adjacent blocks (end === next start) → no overlap
 *     DC-CD3: candidate's own activity is excluded from overlap check
 *     DC-CD4: empty activities list → no overlap
 *     DC-CD5: partial overlap (starts mid-block) → overlap detected
 *     DC-CD6: protected block can still be detected as overlap target
 *
 * Pattern: all DOM interactions use stub elements; no real browser required.
 * Matches the _doc injection pattern from tests/ui/focusTrap.test.js.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  pxToSnappedMinutes,
  clampToGrid,
  minutesToHHMM,
  detectOverlap,
  installDragController
} from '../../js/ui/dragController.js';

// ---------------------------------------------------------------------------
// Stub builders — mimic the focusTrap test pattern (Iter 24)
// ---------------------------------------------------------------------------

/**
 * Make a minimal stub element representing a .cycle-block-positioned article.
 *
 * @param {{
 *   activityId?: string,
 *   startMin?:   number,
 *   duration?:   number,
 *   isResizeHandle?: boolean
 * }} opts
 * @returns {object}
 */
function makeBlockEl(opts = {}) {
  const listeners = {};
  const el = {
    _classes: new Set(['cycle-block-positioned']),
    style: { top: '120px', height: '60px' },
    getAttribute(name) {
      if (name === 'data-activity-id') return opts.activityId ?? 'sa_test';
      if (name === 'data-activity-start') return opts.startMin != null ? String(opts.startMin) : null;
      if (name === 'data-activity-duration') return opts.duration != null ? String(opts.duration) : null;
      return null;
    },
    classList: {
      add(cls)    { el._classes.add(cls); },
      remove(cls) { el._classes.delete(cls); },
      has(cls)    { return el._classes.has(cls); }
    },
    setPointerCapture(_id) {},
    releasePointerCapture(_id) {},
    getBoundingClientRect() {
      return { top: 120, left: 0, height: 60, width: 200 };
    },
    closest(selector) {
      if (selector === '.cycle-block-positioned') return el;
      if (selector === '.cycle-block-resize-handle') {
        return opts.isResizeHandle ? el : null;
      }
      return null;
    },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    }
  };
  return el;
}

/**
 * Make a stub timeline element (.cycle-timeline) that acts as the rootEl.
 * Its getBoundingClientRect reports top = 0 (grid starts at y=0).
 *
 * @param {object} [blockEl]  — pre-created block to return from querySelector
 * @returns {object}
 */
function makeTimelineEl(blockEl = null) {
  const listeners = {};
  const el = {
    style: {},
    getBoundingClientRect() { return { top: 0, left: 0 }; },
    querySelector(sel) {
      if (blockEl && sel === '.cycle-block-positioned') return blockEl;
      return null;
    },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    _dispatch(type, ev) {
      for (const fn of (listeners[type] ?? [])) fn(ev);
    },
    _listenerCount(type) { return (listeners[type] ?? []).length; }
  };
  return el;
}

/**
 * Create a minimal pointer event stub.
 */
function makePointerEvent(type, overrides = {}) {
  return {
    type,
    button: 0,
    pointerId: 1,
    clientY: overrides.clientY ?? 120,
    clientX: overrides.clientX ?? 50,
    target: overrides.target ?? null,
    preventDefault() {},
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// DC-M1: pxToSnappedMinutes
// ---------------------------------------------------------------------------
describe('dragController — pxToSnappedMinutes (DC-M1)', () => {
  const ROW = 60; // 60px per hour = 1px per minute
  const SNAP = 15;

  test('DC-M1a: 60px → 60min (exact)', () => {
    assert.equal(pxToSnappedMinutes(60, ROW, SNAP), 60);
  });

  test('DC-M1b: 0px → 0min', () => {
    assert.equal(pxToSnappedMinutes(0, ROW, SNAP), 0);
  });

  test('DC-M1c: 45px → 45min (already 15-aligned)', () => {
    assert.equal(pxToSnappedMinutes(45, ROW, SNAP), 45);
  });

  test('DC-M1d: 50px → snapped to 45min (nearest 15)', () => {
    // 50 min raw → round(50/15)*15 = round(3.33)*15 = 3*15 = 45
    assert.equal(pxToSnappedMinutes(50, ROW, SNAP), 45);
  });

  test('DC-M1e: 7px → snapped to 0min (nearest 15, round(0.47)=0)', () => {
    // 7min raw → round(7/15)*15 = round(0.47)*15 = 0
    assert.equal(pxToSnappedMinutes(7, ROW, SNAP), 0);
  });

  test('DC-M1f: 8px → snapped to 15min (nearest 15, round(0.53)=1)', () => {
    // 8min raw → round(8/15)*15 = round(0.53)*15 = 1*15 = 15
    assert.equal(pxToSnappedMinutes(8, ROW, SNAP), 15);
  });

  test('DC-M1g: -60px → -60min (move backward, exact)', () => {
    assert.equal(pxToSnappedMinutes(-60, ROW, SNAP), -60);
  });

  test('DC-M1h: -7px → 0min (nearest 15 is 0)', () => {
    // Math.round(-0.47)*15 = 0; result may be -0 (signed zero) — normalize.
    assert.equal(pxToSnappedMinutes(-7, ROW, SNAP) + 0, 0);
  });

  test('DC-M1i: -8px → -15min (nearest 15 is -15)', () => {
    assert.equal(pxToSnappedMinutes(-8, ROW, SNAP), -15);
  });

  test('DC-M1j: fractional rowHeightPx scales correctly', () => {
    // 40px/hr → 1px = 1.5min; 30px = 45min → snap to 45
    assert.equal(pxToSnappedMinutes(30, 40, SNAP), 45);
  });
});

// ---------------------------------------------------------------------------
// DC-M2: clampToGrid
// ---------------------------------------------------------------------------
describe('dragController — clampToGrid (DC-M2)', () => {
  const START = 7; // 7:00 = 420min
  const END   = 19; // 19:00 = 1140min

  test('DC-M2a: value within grid returns unchanged', () => {
    assert.equal(clampToGrid(600, START, END), 600);
  });

  test('DC-M2b: value below grid start clamps to grid start', () => {
    assert.equal(clampToGrid(300, START, END), 420); // 7*60=420
  });

  test('DC-M2c: value above grid end clamps to grid end', () => {
    assert.equal(clampToGrid(1200, START, END), 1140); // 19*60=1140
  });

  test('DC-M2d: exactly at grid start → returned as-is', () => {
    assert.equal(clampToGrid(420, START, END), 420);
  });

  test('DC-M2e: exactly at grid end → returned as-is', () => {
    assert.equal(clampToGrid(1140, START, END), 1140);
  });
});

// ---------------------------------------------------------------------------
// DC-M3: minutesToHHMM
// ---------------------------------------------------------------------------
describe('dragController — minutesToHHMM (DC-M3)', () => {
  test('DC-M3a: 0 → 00:00', () => {
    assert.equal(minutesToHHMM(0), '00:00');
  });

  test('DC-M3b: 540 (9h) → 09:00', () => {
    assert.equal(minutesToHHMM(540), '09:00');
  });

  test('DC-M3c: 615 (10h15m) → 10:15', () => {
    assert.equal(minutesToHHMM(615), '10:15');
  });

  test('DC-M3d: 1140 (19h) → 19:00', () => {
    assert.equal(minutesToHHMM(1140), '19:00');
  });

  test('DC-M3e: 1439 (23h59m) → 23:59', () => {
    assert.equal(minutesToHHMM(1439), '23:59');
  });
});

// ---------------------------------------------------------------------------
// DC-M4: detectOverlap
// ---------------------------------------------------------------------------
describe('dragController — detectOverlap (DC-CD1..CD6)', () => {
  function mkAct(id, startHHMM, duration) {
    return { id, name: `Act ${id}`, plannedStartAt: startHHMM, plannedDurationMinutes: duration };
  }

  // DC-CD1: exact overlap
  test('DC-CD1: overlapping activities returns conflict descriptor', () => {
    const acts = [
      mkAct('sa_a', '09:00', 60),
      mkAct('sa_b', '09:30', 60)
    ];
    const result = detectOverlap(acts, 'sa_a', 9 * 60, 60);
    assert.ok(result !== null, 'Expected overlap detected');
    assert.equal(result.againstId, 'sa_b');
    assert.equal(result.againstName, 'Act sa_b');
  });

  // DC-CD2: adjacent blocks (end === next start) → no overlap
  test('DC-CD2: adjacent blocks (end === start) → no overlap', () => {
    const acts = [
      mkAct('sa_a', '09:00', 60),
      mkAct('sa_b', '10:00', 60)
    ];
    const result = detectOverlap(acts, 'sa_a', 9 * 60, 60);
    assert.equal(result, null, 'Adjacent blocks must not overlap');
  });

  // DC-CD3: own activity excluded
  test('DC-CD3: candidate activity is excluded from its own check', () => {
    const acts = [mkAct('sa_a', '09:00', 60)];
    const result = detectOverlap(acts, 'sa_a', 9 * 60, 60);
    assert.equal(result, null, 'Activity must not overlap with itself');
  });

  // DC-CD4: empty list
  test('DC-CD4: empty activities list → no overlap', () => {
    const result = detectOverlap([], 'sa_any', 9 * 60, 60);
    assert.equal(result, null);
  });

  // DC-CD5: partial overlap (candidate starts mid-existing block)
  test('DC-CD5: candidate starts inside existing block → overlap', () => {
    const acts = [mkAct('sa_existing', '09:00', 120)]; // 09:00-11:00
    const result = detectOverlap(acts, 'sa_new', 10 * 60, 60); // 10:00-11:00
    assert.ok(result !== null, 'Partial overlap must be detected');
    assert.equal(result.againstId, 'sa_existing');
  });

  // DC-CD6: protected block can still be an overlap target
  test('DC-CD6: protected block detected as overlap target', () => {
    const acts = [
      { id: 'sa_standup', name: 'Daily Standup', plannedStartAt: '09:00', plannedDurationMinutes: 30, catalogEntryId: 'cer_daily_standup' }
    ];
    const result = detectOverlap(acts, 'sa_mover', 9 * 60, 60);
    assert.ok(result !== null, 'Protected block can still be an overlap target');
    assert.equal(result.againstId, 'sa_standup');
  });

  test('DC-CD: null activities → no overlap', () => {
    const result = detectOverlap(null, 'sa_x', 9 * 60, 60);
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// DC-L: Controller lifecycle tests (stub-based, matching focusTrap pattern)
// ---------------------------------------------------------------------------
describe('dragController — controller lifecycle', () => {

  // DC-L1: pointerdown on block (mode=move)
  test('DC-L1: pointerdown on block initiates move drag session', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let previewCalled = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() { previewCalled = true; },
      onDragCommit() {},
      onDragPending() {}
    });

    // Simulate pointerdown on the block (non-resize target).
    const downEv = makePointerEvent('pointerdown', {
      clientY: 120,
      target: blockEl
    });
    blockEl.closest = (sel) => {
      if (sel === '.cycle-block-positioned') return blockEl;
      if (sel === '.cycle-block-resize-handle') return null;
      return null;
    };
    timelineEl._dispatch('pointerdown', downEv);

    assert.ok(blockEl.classList.has('cycle-block-dragging'), 'Block must gain cycle-block-dragging class on pointerdown');
    handle.release();
  });

  // DC-L2: pointerdown on resize handle (mode=resize)
  test('DC-L2: pointerdown on resize handle initiates resize drag session', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60, isResizeHandle: true });
    const timelineEl = makeTimelineEl(blockEl);

    let commitMode = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit(result) { commitMode = result.mode; },
      onDragPending() {}
    });

    // pointerdown on the resize handle.
    const downEv = makePointerEvent('pointerdown', { clientY: 180, target: blockEl });
    timelineEl._dispatch('pointerdown', downEv);

    // pointermove — 60px down.
    const moveEv = makePointerEvent('pointermove', { clientY: 186, target: blockEl });
    timelineEl._dispatch('pointermove', moveEv);

    // pointerup.
    const upEv = makePointerEvent('pointerup', { clientY: 240, target: blockEl });
    timelineEl._dispatch('pointerup', upEv);

    assert.equal(commitMode, 'resize', 'Resize-handle drag must produce mode=resize in commit');
    handle.release();
  });

  // DC-L3: pointermove updates block style.top (move)
  test('DC-L3: pointermove updates style.top during move drag', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : (sel === '.cycle-block-resize-handle' ? null : null);
    const timelineEl = makeTimelineEl(blockEl);

    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {}
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    // Move 30px down (30min at 60px/hr = 30min, snapped to 30 which is 2×15 OK)
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 150, target: blockEl }));

    // style.top should have changed from '120px' to something.
    // Original top = (600 - 420) * 1 = 180px; after +30min = 210px.
    assert.ok(blockEl.style.top !== '120px', 'style.top must update during move drag');
    handle.release();
  });

  // DC-L4: pointermove updates style.height (resize)
  test('DC-L4: pointermove updates style.height during resize drag', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60, isResizeHandle: true });
    const timelineEl = makeTimelineEl(blockEl);

    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {}
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 210, target: blockEl }));

    // 30px move at 60px/hr = 30min increase; height should not be '60px' anymore.
    assert.ok(blockEl.style.height !== '60px', 'style.height must update during resize drag');
    handle.release();
  });

  // DC-L5: pointerup without movement is a click (no commit)
  test('DC-L5: pointerup without movement is treated as click — no commit', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let commitCalled = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() { commitCalled = true; },
      onDragPending() {}
    });

    const pos = { clientY: 120, target: blockEl };
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', pos));
    // No movement — up at same position.
    timelineEl._dispatch('pointerup', makePointerEvent('pointerup', pos));

    assert.ok(!commitCalled, 'No commit when pointer has not moved (click behavior)');
    handle.release();
  });

  // DC-L6: pointerup with movement fires onDragCommit (ACCEPTED state)
  test('DC-L6: pointerup with sufficient movement fires onDragCommit in ACCEPTED state', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : (sel === '.cycle-block-resize-handle' ? null : null);
    const timelineEl = makeTimelineEl(blockEl);

    let commitResult = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit(result) { commitResult = result; },
      onDragPending() {}
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    // Move 60px = 60min.
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(commitResult !== null, 'onDragCommit must fire on pointerup after movement');
    assert.equal(commitResult.activityId, 'sa_deep');
    assert.equal(commitResult.mode, 'move');
    handle.release();
  });

  // DC-L7: pointerup with movement fires onDragPending (PROPOSED state)
  test('DC-L7: pointerup fires onDragPending (not onDragCommit) when PROPOSED', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let commitCalled = false;
    let pendingResult = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'PROPOSED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() { commitCalled = true; },
      onDragPending(result) { pendingResult = result; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(!commitCalled, 'onDragCommit must NOT fire in PROPOSED state');
    assert.ok(pendingResult !== null, 'onDragPending must fire in PROPOSED state');
    assert.equal(pendingResult.activityId, 'sa_deep');
    handle.release();
  });

  // DC-L8: pointercancel restores original position
  test('DC-L8: pointercancel restores original block position', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_deep', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    blockEl.style.top = '180px'; // (600-420)*1 = 180px original
    const timelineEl = makeTimelineEl(blockEl);

    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {}
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 240, target: blockEl }));
    // Cancel
    timelineEl._dispatch('pointercancel', makePointerEvent('pointercancel', { clientY: 240, target: blockEl }));

    // style.top should be restored to the original 180px.
    assert.equal(blockEl.style.top, '180px', 'Block must be restored to original top on pointercancel');
    assert.ok(!blockEl.classList.has('cycle-block-dragging'), 'Dragging class removed on cancel');
    handle.release();
  });

  // DC-L9: isInProgress guard — pointerdown alone (pure click) must NOT fire the toast.
  // The guard fires only when movement exceeds CLICK_THRESHOLD_PX (see DC-IP tests below).
  test('DC-L9: IN_PROGRESS activity — pointerdown alone does NOT fire onInProgressAttempt (click must be allowed)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_active', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let inProgressCalled = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: (id) => id === 'sa_active',
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onInProgressAttempt() { inProgressCalled = true; }
    });

    // Only pointerdown — no move, no up.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));

    // The toast must never fire from pointerdown alone (click path).
    // The dragging class may be present at this point (session is open) — it will
    // be removed on pointerup/pointercancel. What matters is that no toast fired.
    assert.ok(!inProgressCalled, 'onInProgressAttempt must NOT fire on pointerdown-only (click path)');
    handle.release();
  });

  // DC-L10: isProtected guard — deferred to onPointerMove (Iter 44 / META §A.2).
  // A pure pointerdown on a protected block must NOT fire the toast; it must be
  // allowed to propagate as a click so BlockDetailDialog can open.
  // The toast only fires when the user actually drags past CLICK_THRESHOLD_PX.
  test('DC-L10: protected activity — pointerdown alone does NOT fire onProtectedAttempt (click must be allowed)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_standup', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let protectedCalled = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  (id) => id === 'sa_standup',
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onProtectedAttempt() { protectedCalled = true; }
    });

    // Only pointerdown — no move, no up.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));

    assert.ok(!protectedCalled, 'DC-L10: onProtectedAttempt must NOT fire on pointerdown-only (click path)');
    handle.release();
  });

  // DC-L11: release() teardown
  test('DC-L11: release() removes all event listeners from timeline', () => {
    const timelineEl = makeTimelineEl();
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {}
    });

    const countBefore = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
      .reduce((n, t) => n + timelineEl._listenerCount(t), 0);
    assert.ok(countBefore > 0, 'Listeners must be attached before release()');

    handle.release();

    const countAfter = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
      .reduce((n, t) => n + timelineEl._listenerCount(t), 0);
    assert.equal(countAfter, 0, 'All listeners must be removed after release()');
  });

  // DC-SN: Additional snap math edge cases
  test('DC-SN6: clamp prevents move above gridStartHour (07:00 = 420min)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_early', startMin: 420, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let commitResult = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit(r) { commitResult = r; },
      onDragPending() {}
    });

    // Try to drag 120px UP (= -120min → would be 420-120=300min = 05:00, below grid).
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 420, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 300, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 300, target: blockEl }));

    assert.ok(commitResult !== null, 'Commit fires after move');
    // newStart should be clamped to 07:00 minimum.
    assert.equal(commitResult.newStart, '07:00', 'Move above grid start must clamp to 07:00');
    handle.release();
  });

  test('DC-SN7: resize cannot shrink block below 15 min floor', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_short', startMin: 540, duration: 30, isResizeHandle: true });
    const timelineEl = makeTimelineEl(blockEl);

    let commitResult = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit(r) { commitResult = r; },
      onDragPending() {}
    });

    // Drag 120px UP (= -120min → 30-120 = -90min → floor to 15min).
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 200, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 130, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 80, target: blockEl }));

    assert.ok(commitResult !== null, 'Commit fires after resize');
    assert.ok(commitResult.newDuration >= 15, `Resize must not go below 15min floor; got ${commitResult.newDuration}`);
    handle.release();
  });
});

// ---------------------------------------------------------------------------
// DC-S: Safety gates
// ---------------------------------------------------------------------------
describe('dragController — safety gates (AC6/AC7/AC8/AC9)', () => {
  test('DC-S1: PROPOSED state → onDragPending, NOT onDragCommit (AC8)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_x', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let pendingFired = false, commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'PROPOSED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit()  { commitFired  = true; },
      onDragPending() { pendingFired = true; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(pendingFired, 'PROPOSED drag must call onDragPending');
    assert.ok(!commitFired, 'PROPOSED drag must NOT call onDragCommit');
    handle.release();
  });

  test('DC-S2: ACCEPTED state → onDragCommit, NOT onDragPending (AC9)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_y', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let pendingFired = false, commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit()  { commitFired  = true; },
      onDragPending() { pendingFired = true; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(commitFired, 'ACCEPTED drag must call onDragCommit');
    assert.ok(!pendingFired, 'ACCEPTED drag must NOT call onDragPending');
    handle.release();
  });

  test('DC-S3: IN_PROGRESS activity → drag entirely blocked (AC7)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_wip', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let previewFired = false, commitFired = false, pendingFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: () => true,  // ALL are in-progress
      onDragPreview() { previewFired = true; },
      onDragCommit()  { commitFired  = true; },
      onDragPending() { pendingFired = true; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(!previewFired, 'IN_PROGRESS: no preview should fire');
    assert.ok(!commitFired,  'IN_PROGRESS: no commit should fire');
    assert.ok(!pendingFired, 'IN_PROGRESS: no pending should fire');
    handle.release();
  });

  test('DC-S4: protected activity — drag > threshold blocked and toast fires (AC6)', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_prot', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let commitFired = false;
    let protectedFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => true,  // ALL are protected
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit()  { commitFired = true; },
      onDragPending() {},
      onProtectedAttempt() { protectedFired = true; }
    });

    // 60px move — well above the 5px CLICK_THRESHOLD_PX.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(!commitFired,    'Protected activity: drag must be fully blocked (no commit)');
    assert.ok(protectedFired,  'Protected activity: onProtectedAttempt must fire when dragged > threshold');
    handle.release();
  });

  test('DC-S5: installDragController with null rootEl returns no-op handle', () => {
    const handle = installDragController(null, {});
    assert.ok(typeof handle.release === 'function', 'release() must be callable even on null rootEl');
    handle.release(); // Should not throw.
  });
});

// ---------------------------------------------------------------------------
// Pending result shape
// ---------------------------------------------------------------------------
describe('dragController — pending result shape (AC8)', () => {
  test('pending result includes activityId, newStart, newDuration, originalStart, originalDuration, mode', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_check', startMin: 600, duration: 60 });
    blockEl.closest = (sel) => sel === '.cycle-block-positioned' ? blockEl : null;
    const timelineEl = makeTimelineEl(blockEl);

    let pendingResult = null;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'PROPOSED',
      isProtected:  () => false,
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending(r) { pendingResult = r; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   { clientY: 180, target: blockEl }));

    assert.ok(pendingResult !== null);
    assert.ok(typeof pendingResult.activityId === 'string',    'pendingResult.activityId is string');
    assert.ok(typeof pendingResult.newStart === 'string',      'pendingResult.newStart is HH:MM string');
    assert.ok(typeof pendingResult.newDuration === 'number',   'pendingResult.newDuration is number');
    assert.ok(typeof pendingResult.originalStart === 'string', 'pendingResult.originalStart is HH:MM string');
    assert.ok(typeof pendingResult.originalDuration === 'number', 'pendingResult.originalDuration is number');
    assert.ok(typeof pendingResult.mode === 'string',          'pendingResult.mode is string');
    handle.release();
  });
});

// ---------------------------------------------------------------------------
// DC-IP: IN_PROGRESS click vs drag regression tests (P0 bug fix, Iter 36)
//
//   DC-IP1: pointerdown only  → no toast (click allowed)
//   DC-IP2: pointerdown + move > threshold → toast fires, drag cancelled
//   DC-IP3: pointerdown + move < threshold → no toast (treated as click jitter)
//   DC-IP4: pointerdown + pointerup (no move) → no toast, click propagates
// ---------------------------------------------------------------------------
describe('dragController — IN_PROGRESS click vs drag regression (DC-IP)', () => {

  // DC-IP1: pure pointerdown — no toast
  test('DC-IP1: IN_PROGRESS block pointerdown only does NOT fire onInProgressAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_wip', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: (id) => id === 'sa_wip',
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onInProgressAttempt() { toastFired = true; }
    });

    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    // No pointermove, no pointerup.

    assert.ok(!toastFired, 'DC-IP1: toast must NOT fire on pointerdown alone for IN_PROGRESS block');
    handle.release();
  });

  // DC-IP2: pointerdown + move > threshold → toast fires, session cancelled
  test('DC-IP2: IN_PROGRESS block with move > threshold fires onInProgressAttempt and cancels drag', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_wip', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    let commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: (id) => id === 'sa_wip',
      onDragPreview() {},
      onDragCommit()  { commitFired = true; },
      onDragPending() {},
      onInProgressAttempt() { toastFired = true; }
    });

    // 60px move is well above the 5px CLICK_THRESHOLD_PX.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));

    assert.ok(toastFired,  'DC-IP2: toast MUST fire when IN_PROGRESS block is dragged > threshold');
    assert.ok(!commitFired, 'DC-IP2: commit must NOT fire — drag cancelled by IN_PROGRESS guard');
    handle.release();
  });

  // DC-IP3: pointerdown + move < threshold → no toast (jitter treated as click)
  test('DC-IP3: IN_PROGRESS block with move < threshold does NOT fire onInProgressAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_wip', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: (id) => id === 'sa_wip',
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onInProgressAttempt() { toastFired = true; }
    });

    // 3px move is below the 5px CLICK_THRESHOLD_PX.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 123, target: blockEl }));

    assert.ok(!toastFired, 'DC-IP3: toast must NOT fire when movement is below click threshold (jitter)');
    handle.release();
  });

  // DC-IP4: pointerdown + pointerup (no move) → no toast, click can propagate
  test('DC-IP4: IN_PROGRESS block pointerdown + pointerup without move does NOT fire onInProgressAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_wip', startMin: 600, duration: 60 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    let commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  () => false,
      isInProgress: (id) => id === 'sa_wip',
      onDragPreview() {},
      onDragCommit()  { commitFired = true; },
      onDragPending() {},
      onInProgressAttempt() { toastFired = true; }
    });

    const pos = { clientY: 120, target: blockEl };
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', pos));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   pos));

    assert.ok(!toastFired,  'DC-IP4: toast must NOT fire on click (pointerdown + pointerup, no move)');
    assert.ok(!commitFired, 'DC-IP4: dragCommit must not fire for IN_PROGRESS block even without the guard toast');
    handle.release();
  });
});

// ---------------------------------------------------------------------------
// DC-PR: Protected block click vs drag regression tests (P0 bug fix, Iter 44)
//
// Mirror of DC-IP1-4 for the isProtected guard. META §A.2 orthogonal-case rule:
// structurally-identical sibling guards must receive identical treatment.
//
//   DC-PR1: pointerdown only  → no toast (click allowed, BlockDetailDialog can open)
//   DC-PR2: pointerdown + move > threshold → toast fires, drag cancelled
//   DC-PR3: pointerdown + move < threshold → no toast (treated as click jitter)
//   DC-PR4: pointerdown + pointerup (no move) → no toast, hasMoved=false, click propagates
// ---------------------------------------------------------------------------
describe('dragController — Protected block click vs drag regression (DC-PR)', () => {

  // DC-PR1: pure pointerdown — no toast
  test('DC-PR1: protected block pointerdown only does NOT fire onProtectedAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_standup', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  (id) => id === 'sa_standup',
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onProtectedAttempt() { toastFired = true; }
    });

    // Only pointerdown — no pointermove, no pointerup.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));

    assert.ok(!toastFired, 'DC-PR1: toast must NOT fire on pointerdown alone for protected block');
    handle.release();
  });

  // DC-PR2: pointerdown + move > threshold → toast fires, session cancelled
  test('DC-PR2: protected block with move > threshold fires onProtectedAttempt and cancels drag', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_standup', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    let commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  (id) => id === 'sa_standup',
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit()  { commitFired = true; },
      onDragPending() {},
      onProtectedAttempt() { toastFired = true; }
    });

    // 60px move is well above the 5px CLICK_THRESHOLD_PX.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 180, target: blockEl }));

    assert.ok(toastFired,  'DC-PR2: toast MUST fire when protected block is dragged > threshold');
    assert.ok(!commitFired, 'DC-PR2: commit must NOT fire — drag cancelled by protected guard');
    handle.release();
  });

  // DC-PR3: pointerdown + move < threshold → no toast (jitter treated as click)
  test('DC-PR3: protected block with move < threshold does NOT fire onProtectedAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_standup', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  (id) => id === 'sa_standup',
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit() {},
      onDragPending() {},
      onProtectedAttempt() { toastFired = true; }
    });

    // 3px move is below the 5px CLICK_THRESHOLD_PX.
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', { clientY: 120, target: blockEl }));
    timelineEl._dispatch('pointermove', makePointerEvent('pointermove', { clientY: 123, target: blockEl }));

    assert.ok(!toastFired, 'DC-PR3: toast must NOT fire when movement is below click threshold (jitter)');
    handle.release();
  });

  // DC-PR4: pointerdown + pointerup (no move) → no toast, click propagates
  test('DC-PR4: protected block pointerdown + pointerup without move does NOT fire onProtectedAttempt', () => {
    const blockEl = makeBlockEl({ activityId: 'sa_standup', startMin: 540, duration: 15 });
    const timelineEl = makeTimelineEl(blockEl);

    let toastFired = false;
    let commitFired = false;
    const handle = installDragController(timelineEl, {
      getCompositionState: () => 'ACCEPTED',
      isProtected:  (id) => id === 'sa_standup',
      isInProgress: () => false,
      onDragPreview() {},
      onDragCommit()  { commitFired = true; },
      onDragPending() {},
      onProtectedAttempt() { toastFired = true; }
    });

    // Simulate a click: pointerdown then pointerup at the same position.
    const pos = { clientY: 120, target: blockEl };
    timelineEl._dispatch('pointerdown', makePointerEvent('pointerdown', pos));
    timelineEl._dispatch('pointerup',   makePointerEvent('pointerup',   pos));

    assert.ok(!toastFired,  'DC-PR4: toast must NOT fire on click (pointerdown + pointerup, no move)');
    assert.ok(!commitFired, 'DC-PR4: dragCommit must not fire for protected block (no drag committed)');
    handle.release();
  });
});
