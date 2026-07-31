import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { reconcileReviewBatch } from './reconcile-review-batch.mjs';

const snapshot = `sha256:${'a'.repeat(64)}`;
const otherSnapshot = `sha256:${'b'.repeat(64)}`;
const batchId = 'review-20260731-01';
const expectedReviewers = ['contract', 'quality'];

function result(reviewer, outcome = 'passed', overrides = {}) {
  return {
    reviewer,
    outcome,
    batchId,
    snapshot,
    ...overrides,
  };
}

function reconcile(receivedResults, overrides = {}) {
  return reconcileReviewBatch({
    batchId,
    snapshot,
    expectedReviewers,
    receivedResults,
    ...overrides,
  });
}

test('complete immediate and later-arriving batches reconcile identically', () => {
  const immediate = reconcile([result('quality'), result('contract')]);
  const partial = reconcile([result('quality')]);
  const resumed = reconcile([...partial.receivedResults, result('contract')]);

  assert.equal(partial.status, 'pending');
  assert.deepEqual(resumed, immediate);
  assert.equal(immediate.status, 'passed');
  assert.deepEqual(immediate.expectedReviewers, ['contract', 'quality']);
  assert.deepEqual(
    immediate.receivedResults.map(({ reviewer }) => reviewer),
    ['contract', 'quality'],
  );
  assert.deepEqual(immediate.blockers, []);
});

test('dispatch, local tests, missing, and partial results remain pending', () => {
  for (const receivedResults of [[], [result('contract')]]) {
    const evidence = reconcile(receivedResults);
    assert.equal(evidence.status, 'pending');
    assert.match(evidence.blockers.join('\n'), /missing required reviewer/);
  }
});

test('a complete matching batch with an unsuccessful result fails', () => {
  for (const outcome of ['failed', 'cancelled', 'unknown']) {
    const evidence = reconcile([
      result('contract'),
      result('quality', outcome),
    ]);

    assert.equal(evidence.status, 'failed');
    assert.match(evidence.blockers.join('\n'), new RegExp(outcome));
  }
});

test('duplicate and unexpected reviewer evidence cannot pass', () => {
  const cases = [
    [result('contract'), result('contract'), result('quality')],
    [result('contract'), result('quality'), result('security')],
  ];

  for (const receivedResults of cases) {
    const evidence = reconcile(receivedResults);
    assert.equal(evidence.status, 'pending');
    assert.notDeepEqual(evidence.blockers, []);
  }
});

test('wrong-batch or wrong-snapshot evidence cannot pass', () => {
  const cases = [
    [
      result('contract'),
      result('quality', 'passed', { batchId: 'review-another-batch' }),
    ],
    [
      result('contract'),
      result('quality', 'passed', { snapshot: otherSnapshot }),
    ],
  ];

  for (const receivedResults of cases) {
    const evidence = reconcile(receivedResults);
    assert.equal(evidence.status, 'pending');
    assert.notDeepEqual(evidence.blockers, []);
  }
});

test('invalid batch definitions fail closed', () => {
  const cases = [
    { batchId: 'pending' },
    { snapshot: 'pending' },
    { expectedReviewers: [] },
    { expectedReviewers: ['contract', 'contract'] },
  ];

  for (const overrides of cases) {
    assert.throws(() => reconcile([], overrides));
  }
});

test('template and review skill define pending defaults and full-batch reset', async () => {
  const [template, skill] = await Promise.all([
    readFile('docs/workflow/templates/work-item/work-item.md', 'utf8'),
    readFile('.agents/skills/review-monorepo-change/SKILL.md', 'utf8'),
  ]);

  for (const field of [
    'Review batch: pending',
    'Review expected: pending',
    'Review received: pending',
  ]) {
    assert.match(template, new RegExp(field));
  }

  assert.match(skill, /record.*batch.*expected.*before.*dispatch/is);
  assert.match(skill, /every expected reviewer.*exactly once/is);
  assert.match(skill, /synchronous.*later-arriving/is);
  assert.match(
    skill,
    /reset.*status.*snapshot.*batch.*expected.*received.*pending/is,
  );
});
