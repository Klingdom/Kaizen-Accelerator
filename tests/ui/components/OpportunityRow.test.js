/**
 * Tests for OpportunityRow (Sprint 7 P0-T5 sub-component).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  OpportunityRow,
  truncate,
  computeAgeInDays
} from '../../../js/ui/components/OpportunityRow.js';

function opp(overrides = {}) {
  return {
    id: 'opp_1',
    userId: 'u_1',
    title: 'Reduce meetings',
    problemStatement: 'Too many back-to-back meetings.',
    scope: null,
    proposedProjectType: 'DMAIC',
    status: 'INTAKE',
    promotedKaizenId: null,
    deferredUntil: null,
    rejectionReason: null,
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
    ...overrides
  };
}

describe('OpportunityRow — structure', () => {
  test('renders an <li>', () => {
    const html = OpportunityRow({ opportunity: opp(), nowIso: '2026-04-21T10:00:00Z' });
    assert.match(html, /^<li class="opp-row/);
  });

  test('includes title', () => {
    const html = OpportunityRow({ opportunity: opp(), nowIso: '2026-04-21T10:00:00Z' });
    assert.match(html, /Reduce meetings/);
  });

  test('escapes title', () => {
    const html = OpportunityRow({
      opportunity: opp({ title: '<script>x</script>' }),
      nowIso: '2026-04-21T10:00:00Z'
    });
    assert.ok(!html.includes('<script>x</script>'));
  });

  test('status chip shows status in lowercase', () => {
    const html = OpportunityRow({ opportunity: opp({ status: 'INTAKE' }) });
    assert.match(html, /opp-chip-status-intake/);
  });

  test('data attributes mirror opportunity fields', () => {
    const html = OpportunityRow({ opportunity: opp() });
    assert.match(html, /data-opportunity-id="opp_1"/);
    assert.match(html, /data-status="INTAKE"/);
  });

  test('action buttons fire OPP_PROMOTE / OPP_DEFER / OPP_REJECT', () => {
    const html = OpportunityRow({ opportunity: opp() });
    assert.match(html, /data-action="OPP_PROMOTE"/);
    assert.match(html, /data-action="OPP_DEFER"/);
    assert.match(html, /data-action="OPP_REJECT"/);
  });

  test('toggle button fires OPP_TOGGLE_EXPAND', () => {
    const html = OpportunityRow({ opportunity: opp() });
    assert.match(html, /data-action="OPP_TOGGLE_EXPAND"/);
  });
});

describe('OpportunityRow — terminal states disable actions', () => {
  for (const status of ['PROMOTED', 'DEFERRED', 'REJECTED']) {
    test(`actions disabled when status=${status}`, () => {
      const html = OpportunityRow({ opportunity: opp({ status }) });
      // All 3 actions should be disabled.
      const matches = html.match(/class="opp-action[^"]+" data-action="OPP_(PROMOTE|DEFER|REJECT)" data-payload='[^']+' disabled/g);
      assert.ok(matches && matches.length === 3, `expected 3 disabled actions for ${status}`);
    });
  }

  test('actions enabled when status=INTAKE', () => {
    const html = OpportunityRow({ opportunity: opp({ status: 'INTAKE' }) });
    assert.ok(!/class="opp-action[^"]+" data-action="OPP_PROMOTE" data-payload='[^']+' disabled/.test(html));
  });

  test('actions enabled when status=SCORED', () => {
    const html = OpportunityRow({ opportunity: opp({ status: 'SCORED' }) });
    assert.ok(!/class="opp-action[^"]+" data-action="OPP_PROMOTE" data-payload='[^']+' disabled/.test(html));
  });
});

describe('OpportunityRow — expanded panel', () => {
  test('expanded=false hides detail panel', () => {
    const html = OpportunityRow({ opportunity: opp(), expanded: false });
    assert.ok(!html.includes('opp-row-expanded'));
  });

  test('expanded=true shows full problem', () => {
    const html = OpportunityRow({
      opportunity: opp({ problemStatement: 'Full detailed problem' }),
      expanded: true
    });
    assert.match(html, /opp-row-expanded/);
    assert.match(html, /Full detailed problem/);
  });

  test('expanded=true with PROMOTED shows kaizen link', () => {
    const html = OpportunityRow({
      opportunity: opp({ status: 'PROMOTED', promotedKaizenId: 'k_xyz' }),
      expanded: true
    });
    assert.match(html, /data-kaizen-id="k_xyz"/);
  });

  test('expanded=true with REJECTED shows reason', () => {
    const html = OpportunityRow({
      opportunity: opp({ status: 'REJECTED', rejectionReason: 'Duplicate of existing' }),
      expanded: true
    });
    assert.match(html, /Duplicate of existing/);
  });

  test('expanded=true with DEFERRED shows deferredUntil', () => {
    const html = OpportunityRow({
      opportunity: opp({ status: 'DEFERRED', deferredUntil: '2026-06-01' }),
      expanded: true
    });
    assert.match(html, /2026-06-01/);
  });
});

describe('truncate helper', () => {
  test('returns string unchanged when short enough', () => {
    assert.equal(truncate('hi', 10), 'hi');
  });

  test('truncates and appends ellipsis', () => {
    assert.equal(truncate('abcdefghij', 5), 'abcd…');
  });

  test('handles non-string input', () => {
    assert.equal(truncate(null, 5), '');
    assert.equal(truncate(undefined, 5), '');
  });
});

describe('computeAgeInDays helper', () => {
  test('returns 0 for same day', () => {
    assert.equal(
      computeAgeInDays('2026-04-21T10:00:00Z', '2026-04-21T10:00:00Z'),
      0
    );
  });

  test('returns 6 for 6 days apart', () => {
    assert.equal(
      computeAgeInDays('2026-04-15T10:00:00Z', '2026-04-21T10:00:00Z'),
      6
    );
  });

  test('clamps negative ages to 0', () => {
    assert.equal(
      computeAgeInDays('2026-04-21T10:00:00Z', '2026-04-15T10:00:00Z'),
      0
    );
  });

  test('returns 0 on invalid input', () => {
    assert.equal(computeAgeInDays('bad', 'also bad'), 0);
  });
});

describe('OpportunityRow — empty input guard', () => {
  test('renders empty placeholder when opportunity missing', () => {
    const html = OpportunityRow({});
    assert.match(html, /opp-row-empty/);
  });
});

describe('OpportunityRow — age display', () => {
  test('shows Xd old from computeAgeInDays', () => {
    const html = OpportunityRow({
      opportunity: opp({ createdAt: '2026-04-15T10:00:00Z' }),
      nowIso: '2026-04-21T10:00:00Z'
    });
    assert.match(html, /6d old/);
  });
});
