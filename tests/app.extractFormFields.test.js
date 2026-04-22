/**
 * Sprint 5 — tests for app.extractFormFields helper.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { extractFormFields } from '../js/app.js';

/**
 * Minimal stub form that supports `querySelectorAll` returning iterable
 * input-like objects.
 */
function stubForm(fields) {
  return {
    querySelectorAll(_selector) {
      return fields;
    },
    closest() {
      return null;
    }
  };
}

describe('extractFormFields', () => {
  test('empty form → {}', () => {
    assert.deepEqual(extractFormFields(stubForm([])), {});
  });

  test('extracts text input values', () => {
    const form = stubForm([
      { name: 'title', type: 'text', value: 'Hello' },
      { name: 'url', type: 'url', value: 'https://x' }
    ]);
    assert.deepEqual(extractFormFields(form), { title: 'Hello', url: 'https://x' });
  });

  test('extracts textarea values', () => {
    const form = stubForm([{ name: 'value', type: 'textarea', value: 'body' }]);
    assert.deepEqual(extractFormFields(form), { value: 'body' });
  });

  test('radio: only checked radio contributes', () => {
    const form = stubForm([
      { name: 'reasonCode', type: 'radio', value: 'SICK', checked: false },
      { name: 'reasonCode', type: 'radio', value: 'BLOCKED', checked: true },
      { name: 'reasonCode', type: 'radio', value: 'OTHER', checked: false }
    ]);
    assert.deepEqual(extractFormFields(form), { reasonCode: 'BLOCKED' });
  });

  test('unchecked checkbox is skipped', () => {
    const form = stubForm([
      { name: 'agree', type: 'checkbox', value: 'yes', checked: false }
    ]);
    assert.deepEqual(extractFormFields(form), {});
  });

  test('null form → {}', () => {
    assert.deepEqual(extractFormFields(null), {});
  });

  test('form without querySelectorAll → {}', () => {
    assert.deepEqual(extractFormFields({}), {});
  });
});
