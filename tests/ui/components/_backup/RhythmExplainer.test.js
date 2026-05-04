/**
 * Tests for RhythmExplainer (Sprint 10 backlog #3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  RhythmExplainer,
  RHYTHM_EXPLAINER_COPY
} from '../../../../js/ui/components/_backup/RhythmExplainer.js';

describe('RhythmExplainer', () => {
  test('renders heading, body, and dismiss button when not dismissed', () => {
    const html = RhythmExplainer({ dismissed: false });
    assert.match(html, /rhythm-explainer/);
    assert.match(html, /Your 4-2-2 daily rhythm/);
    assert.match(html, /240 min/);
    assert.match(html, /120 min/);
    assert.match(html, /RHYTHM_EXPLAINER_DISMISS/);
    assert.match(html, /Got it/);
  });

  test('returns empty string when dismissed', () => {
    assert.equal(RhythmExplainer({ dismissed: true }), '');
  });

  test('defaults to not-dismissed when no props supplied', () => {
    const html = RhythmExplainer();
    assert.ok(html.length > 0);
    assert.match(html, /rhythm-explainer/);
  });

  test('copy constants are exposed for tests', () => {
    assert.ok(RHYTHM_EXPLAINER_COPY.HEADING.length > 0);
    assert.ok(RHYTHM_EXPLAINER_COPY.BODY.length > 0);
    assert.ok(RHYTHM_EXPLAINER_COPY.DISMISS.length > 0);
  });
});
