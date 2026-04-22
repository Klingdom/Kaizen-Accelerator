/**
 * Tests for ReflectionSheet component (Sprint 6 P0-T3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ReflectionSheet,
  FRICTION_TAG_LABELS,
  formatPlanDelta
} from '../../../js/ui/components/ReflectionSheet.js';

describe('formatPlanDelta', () => {
  test('zero → on plan', () => {
    assert.equal(formatPlanDelta(0), 'on plan');
  });
  test('positive → over', () => {
    assert.equal(formatPlanDelta(12), '+12m over');
  });
  test('negative → under', () => {
    assert.equal(formatPlanDelta(-7), '-7m under');
  });
  test('NaN / undefined → on plan', () => {
    assert.equal(formatPlanDelta(NaN), 'on plan');
    assert.equal(formatPlanDelta(undefined), 'on plan');
  });
});

describe('FRICTION_TAG_LABELS', () => {
  test('has six entries matching the spec', () => {
    assert.equal(FRICTION_TAG_LABELS.length, 6);
    const codes = FRICTION_TAG_LABELS.map((t) => t.code);
    assert.deepEqual(codes, [
      'MEETING_LOAD',
      'CONTEXT_SWITCH',
      'BLOCKED_DEP',
      'TOOL_FRICTION',
      'PRIORITY_INVERSION',
      'OTHER'
    ]);
  });
});

describe('ReflectionSheet — fresh render', () => {
  test('returns a string containing the dialog role', () => {
    const html = ReflectionSheet({
      reflectionId: 'ref_sa_1',
      activityId: 'sa_1',
      activityName: 'Deep Work',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 12
    });
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('Reflection (60 sec)'));
    assert.ok(html.includes('Deep Work'));
  });

  test('shows plan vs actual summary', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 12
    });
    assert.ok(html.includes('Planned 60m'));
    assert.ok(html.includes('+12m over'));
    assert.ok(html.includes('Actual 72m'));
  });

  test('does not render friction fields when unchecked', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      frictionChecked: false
    });
    assert.ok(!html.includes('frictionTag'));
    assert.ok(!html.includes('frictionSummary'));
  });
});

describe('ReflectionSheet — friction fields', () => {
  test('renders friction tag dropdown when checked', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      frictionChecked: true
    });
    assert.ok(html.includes('name="frictionTag"'));
    assert.ok(html.includes('name="frictionSummary"'));
    assert.ok(html.includes('MEETING_LOAD'));
    assert.ok(html.includes('OTHER'));
  });

  test('pre-selects a tag when passed selectedFrictionTag', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      frictionChecked: true,
      selectedFrictionTag: 'CONTEXT_SWITCH'
    });
    // Match <option value="CONTEXT_SWITCH" selected>...
    assert.match(html, /value="CONTEXT_SWITCH"\s+selected/);
  });
});

describe('ReflectionSheet — skip button gating', () => {
  test('optional activity → skip button enabled', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      isNonOptional: false
    });
    // Look for the skip button; ensure the button tag does NOT contain
    // `disabled`. Inspect from data-action forward to </button>.
    const skipIdx = html.indexOf('data-action="SKIP_REFLECTION"');
    assert.ok(skipIdx > 0);
    const endIdx = html.indexOf('</button>', skipIdx);
    const slice = html.slice(skipIdx, endIdx);
    assert.ok(!slice.includes('disabled'));
  });

  test('non-optional activity → skip button is disabled with title tooltip', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      isNonOptional: true
    });
    const skipIdx = html.indexOf('data-action="SKIP_REFLECTION"');
    // Widen window to the closing </button> since the disabled attr sits
    // in the same tag after the data-payload.
    const endIdx = html.indexOf('</button>', skipIdx);
    const slice = html.slice(skipIdx, endIdx);
    assert.ok(slice.includes('disabled'));
    assert.ok(slice.includes('title='));
  });
});

describe('ReflectionSheet — form payload', () => {
  test('data-payload on the form carries reflectionId + activityId', () => {
    const html = ReflectionSheet({
      reflectionId: 'ref_foo',
      activityId: 'sa_foo',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0
    });
    // The payload is HTML-escaped JSON.
    assert.match(
      html,
      /data-action="SUBMIT_REFLECTION"\s+data-payload='\{&quot;reflectionId&quot;:&quot;ref_foo&quot;,&quot;activityId&quot;:&quot;sa_foo&quot;\}'/
    );
  });

  test('escapes dangerous characters in activityName', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      activityName: '<script>',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });
});

describe('ReflectionSheet — textarea pre-fills', () => {
  test('renders prior whatWentWell / whatToImprove', () => {
    const html = ReflectionSheet({
      reflectionId: 'r',
      activityId: 'a',
      plannedDurationMinutes: 60,
      planVsActualMinutes: 0,
      whatWentWell: 'focus',
      whatToImprove: 'breaks'
    });
    assert.ok(html.includes('>focus</textarea>'));
    assert.ok(html.includes('>breaks</textarea>'));
  });
});
