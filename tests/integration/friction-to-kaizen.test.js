/**
 * Integration — Sprint 6 friction → cluster → Kaizen promotion.
 *
 * Flow:
 *   3 friction signals with same tag → cluster count=3
 *   KaizenService.promote(cluster.signalIds)
 *   → Kaizen in DRAFT
 *   → all signals flipped to PROMOTED_TO_KAIZEN
 *   → KaizenPromoted event fires
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { FrictionService, FRICTION_SIGNALS_KEY } from '../../js/services/FrictionService.js';
import {
  KaizenService,
  KAIZENS_KEY,
  BASELINE_METRICS_KEY
} from '../../js/services/KaizenService.js';
import {
  KaizenPromoted,
  KaizenBaselineLocked
} from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T10:00:00Z';

function buildEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
  const frictionService = new FrictionService({ repo, bus, clock });
  const kaizenService = new KaizenService({ repo, bus, clock, frictionService });
  return { repo, bus, clock, frictionService, kaizenService };
}

describe('Integration — friction-to-kaizen', () => {
  test('3 same-tag signals cluster → promote → DRAFT Kaizen + signals PROMOTED', () => {
    const env = buildEnv();
    // Seed 3 signals with MEETING_LOAD.
    const seeded = [];
    for (let i = 0; i < 3; i += 1) {
      seeded.push(
        env.frictionService.capture({
          reflectionId: `ref_${i}`,
          scheduledActivityId: `sa_${i}`,
          userId: 'u_phil',
          summary: `meeting friction ${i}`,
          tag: 'MEETING_LOAD'
        })
      );
    }
    // Cluster.
    const clusters = env.frictionService.clusterByTag('u_phil', 7);
    assert.ok(clusters.length >= 1);
    const top = clusters[0];
    assert.equal(top.tag, 'MEETING_LOAD');
    assert.equal(top.count, 3);
    assert.equal(top.signalIds.length, 3);

    // Capture events.
    const promotedEvents = [];
    env.bus.subscribe(KaizenPromoted, (p) => promotedEvents.push(p));

    const { kaizen, promotedSignals } = env.kaizenService.promote({
      userId: 'u_phil',
      fromFrictionClusterSignalIds: top.signalIds,
      problemStatement: 'Back-to-back meetings are blocking deep work',
      title: 'Reclaim mornings'
    });

    // 1. Kaizen created in DRAFT.
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.title, 'Reclaim mornings');

    // 2. All 3 signals flipped to PROMOTED_TO_KAIZEN + kaizenId set.
    assert.equal(promotedSignals.length, 3);
    const signalMap = env.repo.read(FRICTION_SIGNALS_KEY);
    for (const s of seeded) {
      assert.equal(signalMap[s.id].status, 'PROMOTED_TO_KAIZEN');
      assert.equal(signalMap[s.id].kaizenId, kaizen.id);
    }

    // 3. KaizenPromoted event fired post-persist.
    assert.equal(promotedEvents.length, 1);
    assert.equal(promotedEvents[0].kaizenId, kaizen.id);
    assert.deepEqual(promotedEvents[0].sourceFrictionSignalIds, top.signalIds);

    // 4. The Kaizen persisted in bamx:v1:kaizens.
    const kmap = env.repo.read(KAIZENS_KEY);
    assert.ok(kmap[kaizen.id]);
    assert.equal(kmap[kaizen.id].state, 'DRAFT');
  });

  test('after promotion, the same cluster re-query excludes promoted signals', () => {
    const env = buildEnv();
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      const s = env.frictionService.capture({
        reflectionId: `r_${i}`,
        scheduledActivityId: `sa_${i}`,
        userId: 'u_phil',
        summary: 's',
        tag: 'TOOL_FRICTION'
      });
      ids.push(s.id);
    }
    env.kaizenService.promote({
      userId: 'u_phil',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'Tool friction blocking flow state'
    });
    // After promotion, clusterByTag returns no clusters (all terminal).
    const clusters = env.frictionService.clusterByTag('u_phil', 7);
    assert.equal(clusters.length, 0);
  });
});

describe('Integration — baseline lock: DRAFT → ACTIVE', () => {
  test('set goal + action + lockBaseline → ACTIVE + BaselineMetric locked + event fires', () => {
    const env = buildEnv();
    // Seed + promote.
    const ids = [];
    for (let i = 0; i < 2; i += 1) {
      const s = env.frictionService.capture({
        reflectionId: `r_${i}`,
        scheduledActivityId: `sa_${i}`,
        userId: 'u_phil',
        summary: 's',
        tag: 'MEETING_LOAD'
      });
      ids.push(s.id);
    }
    const { kaizen } = env.kaizenService.promote({
      userId: 'u_phil',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    });

    // Set goal + one action.
    env.kaizenService.setGoalStatement(kaizen.id, 'Target 40% reduction');
    env.kaizenService.addAction(kaizen.id, {
      name: 'Block AM focus time',
      ownerRef: 'u_phil',
      dueDate: '2026-05-01'
    });

    const lockEvents = [];
    env.bus.subscribe(KaizenBaselineLocked, (p) => lockEvents.push(p));

    const res = env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'Meetings per AM',
      unit: 'count',
      operationalDefinition: 'Count meetings 09:00-12:00 daily',
      sampleSize: 5,
      method: 'Manual count from calendar',
      value: 5
    });

    // 1. State transitioned DRAFT → ACTIVE.
    assert.equal(res.kaizen.state, 'ACTIVE');
    assert.ok(res.kaizen.baselineMetricId);

    // 2. BaselineMetric persisted + locked=true.
    const bmMap = env.repo.read(BASELINE_METRICS_KEY);
    const bm = bmMap[res.baseline.id];
    assert.ok(bm);
    assert.equal(bm.locked, true);
    assert.equal(bm.value, 5);
    assert.equal(bm.metricDefinition.name, 'Meetings per AM');

    // 3. KaizenBaselineLocked event fired.
    assert.equal(lockEvents.length, 1);
    assert.equal(lockEvents[0].kaizenId, kaizen.id);
    assert.equal(lockEvents[0].value, 5);

    // 4. Re-read persisted Kaizen confirms state.
    const kmap = env.repo.read(KAIZENS_KEY);
    assert.equal(kmap[kaizen.id].state, 'ACTIVE');
  });

  test('cannot lock baseline a second time — guards fire', () => {
    const env = buildEnv();
    const ids = [];
    for (let i = 0; i < 1; i += 1) {
      const s = env.frictionService.capture({
        reflectionId: `r_${i}`,
        scheduledActivityId: `sa_${i}`,
        userId: 'u_phil',
        summary: 's',
        tag: 'MEETING_LOAD'
      });
      ids.push(s.id);
    }
    const { kaizen } = env.kaizenService.promote({
      userId: 'u_phil',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    });
    env.kaizenService.setGoalStatement(kaizen.id, 'g');
    env.kaizenService.addAction(kaizen.id, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'm',
      unit: 'u',
      operationalDefinition: 'o',
      sampleSize: 1,
      method: 'm',
      value: 1
    });
    assert.throws(
      () =>
        env.kaizenService.lockBaseline(kaizen.id, {
          metricName: 'm',
          unit: 'u',
          operationalDefinition: 'o',
          sampleSize: 1,
          method: 'm',
          value: 1
        }),
      (e) => e.name === 'KAIZEN_NOT_IN_DRAFT'
    );
  });
});
