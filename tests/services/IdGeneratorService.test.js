/**
 * Tests for IdGeneratorService (C-SA-1).
 *
 * Covers:
 *   - createDeterministicIdGenerator returns same id sequence from same seed
 *   - createDeterministicIdGenerator increments per call (uniqueness)
 *   - IdGeneratorService (production) returns unique ids across calls
 *   - Both generators preserve the prefix at the start of the id
 *   - Both generators reject empty / non-string prefix
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  IdGeneratorService,
  createDeterministicIdGenerator
} from '../../js/services/IdGeneratorService.js';

describe('createDeterministicIdGenerator', () => {
  test('same seed produces same first id', () => {
    const gen1 = createDeterministicIdGenerator(0);
    const gen2 = createDeterministicIdGenerator(0);
    assert.equal(gen1('sa_edit'), gen2('sa_edit'));
  });

  test('same seed produces same sequence of ids (replayability)', () => {
    const gen1 = createDeterministicIdGenerator(5);
    const gen2 = createDeterministicIdGenerator(5);
    for (let i = 0; i < 5; i += 1) {
      assert.equal(gen1('sa_edit'), gen2('sa_edit'), `mismatch at call ${i}`);
    }
  });

  test('consecutive calls return different ids (uniqueness)', () => {
    const gen = createDeterministicIdGenerator(0);
    const id1 = gen('sa_edit');
    const id2 = gen('sa_edit');
    assert.notEqual(id1, id2);
  });

  test('prefix is preserved at the start of the id', () => {
    const gen = createDeterministicIdGenerator(0);
    const id = gen('sa_edit');
    assert.ok(id.startsWith('sa_edit_'), `id "${id}" does not start with "sa_edit_"`);
  });

  test('different prefixes produce different id strings', () => {
    const gen = createDeterministicIdGenerator(0);
    const id1 = gen('sa_edit');
    const gen2 = createDeterministicIdGenerator(0);
    const id2 = gen2('other');
    assert.notEqual(id1, id2);
  });

  test('rejects empty string prefix', () => {
    const gen = createDeterministicIdGenerator(0);
    assert.throws(
      () => gen(''),
      (err) => err.name === 'INVALID_PREFIX'
    );
  });

  test('rejects non-string prefix (number)', () => {
    const gen = createDeterministicIdGenerator(0);
    assert.throws(
      () => gen(42),
      (err) => err.name === 'INVALID_PREFIX'
    );
  });

  test('rejects non-string prefix (null)', () => {
    const gen = createDeterministicIdGenerator(0);
    assert.throws(
      () => gen(null),
      (err) => err.name === 'INVALID_PREFIX'
    );
  });
});

describe('IdGeneratorService (production)', () => {
  test('generate returns a string', () => {
    const svc = new IdGeneratorService();
    const id = svc.generate('sa_edit');
    assert.equal(typeof id, 'string');
    assert.ok(id.length > 0);
  });

  test('prefix is preserved at the start of the id', () => {
    const svc = new IdGeneratorService();
    const id = svc.generate('sa_edit');
    assert.ok(id.startsWith('sa_edit_'), `id "${id}" does not start with "sa_edit_"`);
  });

  test('consecutive calls produce unique ids', () => {
    const svc = new IdGeneratorService();
    const ids = new Set();
    for (let i = 0; i < 20; i += 1) {
      ids.add(svc.generate('sa_edit'));
    }
    assert.equal(ids.size, 20, 'expected 20 unique ids');
  });

  test('rejects empty string prefix', () => {
    const svc = new IdGeneratorService();
    assert.throws(
      () => svc.generate(''),
      (err) => err.name === 'INVALID_PREFIX'
    );
  });

  test('rejects non-string prefix (number)', () => {
    const svc = new IdGeneratorService();
    assert.throws(
      () => svc.generate(99),
      (err) => err.name === 'INVALID_PREFIX'
    );
  });
});
