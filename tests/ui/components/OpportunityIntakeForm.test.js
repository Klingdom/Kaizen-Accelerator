/**
 * Tests for OpportunityIntakeForm (Sprint 7 P0-T6).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  OpportunityIntakeForm,
  PROJECT_TYPE_HELP
} from '../../../js/ui/components/OpportunityIntakeForm.js';

describe('OpportunityIntakeForm — structure', () => {
  test('renders a dialog with aria-modal=true', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /data-dialog="opportunity-intake"/);
  });

  test('contains title input with data-action on form', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="title"/);
    assert.match(html, /data-action="OPP_SUBMIT_INTAKE"/);
  });

  test('contains problemStatement textarea', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="problemStatement"/);
  });

  test('contains scope textarea', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="scope"/);
  });

  test('contains proposedProjectType select with all 5 options', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /name="proposedProjectType"/);
    for (const pt of ['DMAIC', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D', 'KAIZEN_ACCELERATOR_30D', 'AD_HOC']) {
      assert.ok(html.includes(`value="${pt}"`), `missing option ${pt}`);
    }
  });

  test('has Capture + Discard buttons', () => {
    const html = OpportunityIntakeForm();
    assert.match(html, /Capture Opportunity/);
    assert.match(html, /Discard/);
    assert.match(html, /data-action="OPP_CANCEL_INTAKE"/);
  });
});

describe('OpportunityIntakeForm — prefilled values', () => {
  test('renders title value from props', () => {
    const html = OpportunityIntakeForm({ title: 'My title' });
    assert.match(html, /value="My title"/);
  });

  test('renders problemStatement content', () => {
    const html = OpportunityIntakeForm({ problemStatement: 'Problem goes here' });
    assert.match(html, /Problem goes here/);
  });

  test('renders scope content', () => {
    const html = OpportunityIntakeForm({ scope: 'Only PM meetings' });
    assert.match(html, /Only PM meetings/);
  });

  test('selects proposedProjectType in the dropdown', () => {
    const html = OpportunityIntakeForm({ proposedProjectType: 'KAIZEN_EVENT' });
    // Selected option comes out as: <option value="KAIZEN_EVENT" selected>...
    assert.match(html, /value="KAIZEN_EVENT"\s+selected/);
  });

  test('escapes dangerous characters in the title', () => {
    const html = OpportunityIntakeForm({ title: '<script>alert(1)</script>' });
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.match(html, /&lt;script&gt;/);
  });
});

describe('OpportunityIntakeForm — validation feedback', () => {
  test('submit disabled when title too short', () => {
    const html = OpportunityIntakeForm({ title: 'ab', problemStatement: 'x'.repeat(50) });
    // Find the submit button line.
    assert.match(html, /class="oif-submit"\s+disabled/);
  });

  test('submit disabled when problem too short', () => {
    const html = OpportunityIntakeForm({ title: 'abcdef', problemStatement: 'short' });
    assert.match(html, /class="oif-submit"\s+disabled/);
  });

  test('submit disabled when scope too long', () => {
    const html = OpportunityIntakeForm({
      title: 'abcdef',
      problemStatement: 'x'.repeat(50),
      scope: 'x'.repeat(301)
    });
    assert.match(html, /class="oif-submit"\s+disabled/);
  });

  test('submit enabled when everything passes', () => {
    const html = OpportunityIntakeForm({
      title: 'Valid title',
      problemStatement: 'Problem statement that is long enough',
      scope: 'Some scope'
    });
    assert.ok(!/class="oif-submit"\s+disabled/.test(html));
  });

  test('counter reflects current lengths', () => {
    const html = OpportunityIntakeForm({
      title: 'abcdef',
      problemStatement: 'x'.repeat(50)
    });
    assert.match(html, /6 \/ 80/);
    assert.match(html, /50 \/ 500/);
  });

  test('renders error block when errorName provided', () => {
    const html = OpportunityIntakeForm({
      errorName: 'TITLE_LENGTH',
      errorMessage: 'too short'
    });
    assert.match(html, /role="alert"/);
    assert.match(html, /TITLE_LENGTH/);
    assert.match(html, /too short/);
  });

  test('no error block by default', () => {
    const html = OpportunityIntakeForm();
    assert.ok(!/role="alert"/.test(html));
  });
});

describe('OpportunityIntakeForm — help text', () => {
  test('shows help text for selected project type', () => {
    const html = OpportunityIntakeForm({ proposedProjectType: 'DMAIC' });
    // Should include part of the DMAIC help text.
    assert.match(html, /Six Sigma/);
  });

  test('PROJECT_TYPE_HELP has entries for all 5 types', () => {
    for (const pt of ['DMAIC', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D', 'KAIZEN_ACCELERATOR_30D', 'AD_HOC']) {
      assert.ok(PROJECT_TYPE_HELP[pt]);
      assert.ok(PROJECT_TYPE_HELP[pt].length > 10);
    }
  });
});
