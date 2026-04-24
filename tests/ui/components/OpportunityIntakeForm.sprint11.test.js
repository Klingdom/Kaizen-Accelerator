/**
 * Sprint 11 P1-T1 — OpportunityIntakeForm expansion: currentState,
 * desiredState, primaryStakeholder.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { OpportunityIntakeForm } from '../../../js/ui/components/OpportunityIntakeForm.js';
import {
  STATE_FIELD_MAX_LENGTH,
  STAKEHOLDER_MAX_LENGTH
} from '../../../js/services/OpportunityService.js';

describe('OpportunityIntakeForm — richer intake fields render', () => {
  test('renders a currentState textarea', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="currentState"/);
  });

  test('renders a desiredState textarea', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="desiredState"/);
  });

  test('renders a primaryStakeholder input', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="primaryStakeholder"/);
  });

  test('currentState respects maxlength', () => {
    const html = OpportunityIntakeForm();
    assert.match(
      html,
      new RegExp(`name="currentState"[^>]*maxlength="${STATE_FIELD_MAX_LENGTH}"`)
    );
  });

  test('primaryStakeholder respects maxlength', () => {
    const html = OpportunityIntakeForm();
    assert.match(
      html,
      new RegExp(`name="primaryStakeholder"[^>]*maxlength="${STAKEHOLDER_MAX_LENGTH}"`)
    );
  });

  test('labels carry "(optional)" qualifier', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /Current state \(optional\)/);
    assert.match(html, /Desired state \(optional\)/);
    assert.match(html, /Primary stakeholder \(optional\)/);
  });
});

describe('OpportunityIntakeForm — prefilled optional fields', () => {
  test('renders currentState value', () => {
    const html = OpportunityIntakeForm({
      currentState: 'Manual runs take 30 minutes per week.'
    });
    assert.match(html, /Manual runs take 30 minutes per week\./);
  });

  test('renders desiredState value', () => {
    const html = OpportunityIntakeForm({
      desiredState: 'Fully automated under 3 minutes.'
    });
    assert.match(html, /Fully automated under 3 minutes\./);
  });

  test('renders primaryStakeholder value', () => {
    const html = OpportunityIntakeForm({
      primaryStakeholder: 'Ops Team Lead'
    });
    assert.match(html, /value="Ops Team Lead"/);
  });

  test('escapes dangerous characters in primaryStakeholder', () => {
    const html = OpportunityIntakeForm({
      primaryStakeholder: '<script>x</script>'
    });
    assert.ok(!html.includes('<script>x</script>'));
  });

  test('empty optional fields do not disable submit', () => {
    const html = OpportunityIntakeForm({
      title: 'Valid title',
      problemStatement: 'A valid problem statement long enough to pass.'
    });
    // Submit should NOT carry `disabled`; the 3 optional fields being
    // empty must not block.
    assert.ok(!/class="oif-submit"\s+disabled/.test(html));
  });

  test('optional field below min disables submit', () => {
    const html = OpportunityIntakeForm({
      title: 'Valid title',
      problemStatement: 'A valid problem statement long enough to pass.',
      currentState: 'x' // too short
    });
    assert.match(html, /class="oif-submit"\s+disabled/);
  });

  test('optional field at exact min does NOT disable submit', () => {
    const html = OpportunityIntakeForm({
      title: 'Valid title',
      problemStatement: 'A valid problem statement long enough to pass.',
      currentState: 'x'.repeat(10)
    });
    assert.ok(!/class="oif-submit"\s+disabled/.test(html));
  });
});

describe('OpportunityIntakeForm — counters', () => {
  test('currentState counter shows length / max', () => {
    const html = OpportunityIntakeForm({
      currentState: 'A reasonable current state description.'
    });
    assert.match(
      html,
      new RegExp(`>39 / ${STATE_FIELD_MAX_LENGTH}<`)
    );
  });

  test('primaryStakeholder counter shows length / max', () => {
    const html = OpportunityIntakeForm({
      primaryStakeholder: 'Someone'
    });
    assert.match(
      html,
      new RegExp(`>7 / ${STAKEHOLDER_MAX_LENGTH}<`)
    );
  });
});
