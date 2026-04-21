/**
 * Tests for AcceptEditRejectTriad — pure render + event wiring via
 * data-action + data-payload.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AcceptEditRejectTriad } from '../../../js/ui/components/AcceptEditRejectTriad.js';

describe('AcceptEditRejectTriad — structure', () => {
  test('missing compositionId renders placeholder', () => {
    const html = AcceptEditRejectTriad();
    assert.match(html, /triad-missing/);
  });

  test('renders a triad wrapper', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /class="triad"/);
    assert.match(html, /aria-label="Daily cadence actions"/);
  });

  test('renders exactly three buttons', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    const count = (html.match(/<button /g) ?? []).length;
    assert.equal(count, 3);
  });

  test('button labels are verbatim (Accept, Edit, Reject)', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, />Accept</);
    assert.match(html, />Edit</);
    assert.match(html, />Reject</);
  });

  test('button order: Accept → Edit → Reject (UX_FLOWS §4.1 lock)', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    const idxA = html.indexOf('Accept');
    const idxE = html.indexOf('Edit');
    const idxR = html.indexOf('Reject');
    assert.ok(idxA < idxE);
    assert.ok(idxE < idxR);
  });

  test('Accept has primary class', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /triad-accept primary/);
  });

  test('Edit has secondary class', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /triad-edit secondary/);
  });

  test('Reject has danger class', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /triad-reject danger/);
  });
});

describe('AcceptEditRejectTriad — data-action wiring', () => {
  test('Accept carries data-action="ACCEPT"', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /data-action="ACCEPT"/);
  });

  test('Edit carries data-action="EDIT"', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /data-action="EDIT"/);
  });

  test('Reject carries data-action="REJECT"', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    assert.match(html, /data-action="REJECT"/);
  });

  test('every button carries the compositionId in data-payload', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c42' });
    const matches = html.match(/compositionId[^"]*c42/g) ?? [];
    assert.equal(matches.length, 3);
  });

  test('data-payload is valid JSON (parseable)', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    // Extract the Accept button's data-payload (first one).
    const m = html.match(/data-payload='([^']+)'/);
    assert.ok(m);
    const parsed = JSON.parse(m[1].replace(/&quot;/g, '"'));
    assert.deepEqual(parsed, { compositionId: 'c1' });
  });
});

describe('AcceptEditRejectTriad — disabled variant', () => {
  test('disabled=true → Accept button marked disabled', () => {
    const html = AcceptEditRejectTriad({
      compositionId: 'c1',
      disabled: true
    });
    assert.match(html, /triad-accept[^>]*disabled/);
    assert.match(html, /aria-disabled="true"/);
  });

  test('disabled=true + reason → tooltip set on Accept', () => {
    const html = AcceptEditRejectTriad({
      compositionId: 'c1',
      disabled: true,
      acceptDisabledReason: 'PROJECT under floor'
    });
    assert.match(html, /title="PROJECT under floor"/);
  });

  test('Edit and Reject remain enabled even when Accept disabled', () => {
    const html = AcceptEditRejectTriad({
      compositionId: 'c1',
      disabled: true
    });
    const editMatch = html.match(/triad-edit[^>]*>Edit/);
    const rejectMatch = html.match(/triad-reject[^>]*>Reject/);
    assert.ok(editMatch);
    assert.ok(rejectMatch);
    // Edit button shouldn't carry disabled.
    assert.ok(!editMatch[0].includes('disabled'));
  });

  test('disabled=false → Accept not disabled', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c1' });
    const acceptFrag = html.match(/<button[^>]*triad-accept[^>]*>/)[0];
    assert.ok(!acceptFrag.includes('disabled'));
  });
});

describe('AcceptEditRejectTriad — XSS protection', () => {
  test('compositionId with quotes escapes inside data-payload', () => {
    const html = AcceptEditRejectTriad({ compositionId: 'c"1' });
    assert.ok(!html.includes('c"1'));
    // The inner quotes should survive JSON but be HTML-escaped.
    assert.match(html, /&quot;/);
  });

  test('disabled reason escapes HTML', () => {
    const html = AcceptEditRejectTriad({
      compositionId: 'c1',
      disabled: true,
      acceptDisabledReason: '<script>x</script>'
    });
    assert.ok(!html.includes('<script>'));
    assert.match(html, /&lt;script&gt;/);
  });
});
