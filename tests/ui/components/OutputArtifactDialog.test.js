/**
 * Tests for OutputArtifactDialog (Sprint 5 P0-T6).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  OutputArtifactDialog,
  parseArtifactFields,
  DIALOG_TITLES
} from '../../../js/ui/components/OutputArtifactDialog.js';

describe('OutputArtifactDialog — structure', () => {
  test('renders a <section role=dialog> with aria-modal', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, /<section[^>]*class="oad-modal"/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  });

  test('carries the activity id + schema on data-attrs', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, /data-activity-id="sa_1"/);
    assert.match(html, /data-schema="TEXT"/);
  });

  test('renders a submit button wired to SUBMIT_CLOSE_DIALOG', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, /data-action="SUBMIT_CLOSE_DIALOG"/);
    assert.match(html, /<button[^>]*class="oad-submit"/);
  });

  test('renders a Cancel button', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, /<button[^>]*class="oad-cancel"/);
    assert.match(html, /data-action="CLOSE_CLOSE_DIALOG"/);
  });
});

describe('OutputArtifactDialog — schema-specific fields', () => {
  test('TEXT → renders a textarea named "value"', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, /<textarea[^>]*name="value"/);
  });

  test('TEXT dialog title', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TEXT' });
    assert.match(html, new RegExp(DIALOG_TITLES.TEXT));
  });

  test('TWO_LIST → renders two textareas (left + right)', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'TWO_LIST' });
    assert.match(html, /name="left"/);
    assert.match(html, /name="right"/);
  });

  test('NUMERIC → renders a number input', () => {
    const html = OutputArtifactDialog({
      activityId: 'sa_1',
      schema: 'NUMERIC',
      artifactDef: { name: 'Cycle time', unit: 'min' }
    });
    assert.match(html, /<input[^>]*type="number"/);
    assert.match(html, /name="amount"/);
    assert.match(html, />min</);
  });

  test('DOCUMENT → renders url + title inputs', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'DOCUMENT' });
    assert.match(html, /name="url"/);
    assert.match(html, /name="title"/);
    assert.match(html, /<input[^>]*type="url"/);
  });

  test('CHART → renders url + title inputs', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'CHART' });
    assert.match(html, /name="url"/);
    assert.match(html, /name="title"/);
  });

  test('unknown schema → diagnostic markup', () => {
    const html = OutputArtifactDialog({ activityId: 'sa_1', schema: 'LOL' });
    assert.match(html, /oad-unknown/);
    assert.match(html, /LOL/);
  });
});

describe('OutputArtifactDialog — XSS', () => {
  test('activity id is HTML-escaped', () => {
    const html = OutputArtifactDialog({
      activityId: 'sa"<script>alert(1)</script>',
      schema: 'TEXT'
    });
    assert.ok(!html.includes('<script>alert'));
    assert.match(html, /&quot;&lt;script&gt;/);
  });
});

describe('parseArtifactFields', () => {
  test('TEXT returns a string value', () => {
    const r = parseArtifactFields('TEXT', { value: 'Done.' });
    assert.deepEqual(r, { schema: 'TEXT', value: 'Done.' });
  });

  test('TEXT coerces missing value to empty string', () => {
    const r = parseArtifactFields('TEXT', {});
    assert.equal(r.value, '');
  });

  test('TWO_LIST splits newlines and trims', () => {
    const r = parseArtifactFields('TWO_LIST', {
      left: 'a\nb\n\n  c  ',
      right: 'd\ne'
    });
    assert.deepEqual(r, {
      schema: 'TWO_LIST',
      value: { left: ['a', 'b', 'c'], right: ['d', 'e'] }
    });
  });

  test('NUMERIC coerces amount to Number', () => {
    const r = parseArtifactFields('NUMERIC', { amount: '42.5', unit: 'min' });
    assert.equal(r.value.amount, 42.5);
    assert.equal(r.value.unit, 'min');
  });

  test('DOCUMENT carries url + title', () => {
    const r = parseArtifactFields('DOCUMENT', {
      url: 'https://…',
      title: 'Draft'
    });
    assert.equal(r.value.url, 'https://…');
    assert.equal(r.value.title, 'Draft');
  });

  test('CHART carries url + title', () => {
    const r = parseArtifactFields('CHART', { url: 'x', title: 'y' });
    assert.deepEqual(r.value, { url: 'x', title: 'y' });
  });

  test('unknown schema → passthrough value', () => {
    const r = parseArtifactFields('LOL', { x: 1 });
    assert.deepEqual(r.value, { x: 1 });
  });
});
