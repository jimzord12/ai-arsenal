import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

import { calculateReviewSnapshot } from './calculate-review-snapshot.mjs';

const workItemRelativePath =
  'docs/work-items/2026-07-31-deterministic-review-snapshot/work-item.md';
const snapshotModulePath = fileURLToPath(
  new URL('./calculate-review-snapshot.mjs', import.meta.url),
);

function git(root, arguments_) {
  const result = spawnSync('git', arguments_, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(
    result.status,
    0,
    `git ${arguments_.join(' ')} failed\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
  );
  return result.stdout.trim();
}

function write(root, relativePath, contents) {
  const absolutePath = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function workItem({
  goal = 'Review deterministic bytes.',
  stage = 'review',
} = {}) {
  return `# Work Item

Work item: 2026-07-31-deterministic-review-snapshot
Workflow: 2
Stage: ${stage}
Status: active
Started at: 2026-07-31T13:46:08+03:00
Max time: 5 hours
Last time check: 2026-07-31T13:46:08+03:00
Turns since time check: 2
Review cycles: 0
Review status: pending
Review snapshot: pending
Review batch: pending
Review expected: pending
Review received: pending
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

${goal}

## Non-goals

- Review-batch orchestration.

## Acceptance criteria

- The candidate is deterministic.

## Implementation summary

Implemented the snapshot function.

## Review findings and repairs

Pending.

## Final verification

Result: pending
`;
}

function createRepository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-snapshot-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.email', 'tests@example.invalid']);
  git(root, ['config', 'user.name', 'Workflow Tests']);
  write(root, '.gitignore', 'ignored/\n');
  write(root, 'NEXT.md', '# NEXT\n\nRouting state.\n');
  write(root, workItemRelativePath, workItem());
  write(root, 'src/base.txt', 'base\n');
  git(root, ['add', '--all']);
  git(root, ['commit', '--quiet', '-m', 'fixture']);
  return root;
}

function snapshot(root, options = {}) {
  return calculateReviewSnapshot({
    repositoryRoot: options.repositoryRoot ?? root,
    workItemPath: options.workItemPath ?? workItemRelativePath,
  });
}

test('identical candidate state is stable and returns only a prefixed digest', (t) => {
  const root = createRepository(t);
  write(root, 'src/change.bin', Buffer.from([0xff, 0x00, 0x61, 0x62]));

  const first = snapshot(root);
  const second = snapshot(root);

  assert.match(first, /^sha256:[0-9a-f]{64}$/);
  assert.equal(second, first);
  assert.doesNotMatch(first, /change|src|ff00/i);
});

test('the command interface emits exactly the reusable function result', (t) => {
  const root = createRepository(t);
  write(root, 'src/change.txt', 'candidate\n');

  const result = spawnSync(
    process.execPath,
    [
      snapshotModulePath,
      '--repository-root',
      root,
      '--work-item',
      workItemRelativePath,
    ],
    { encoding: 'utf8', windowsHide: true },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, `${snapshot(root)}\n`);
});

test('included content changes the digest', (t) => {
  const root = createRepository(t);
  write(root, 'src/base.txt', 'first\n');
  const first = snapshot(root);

  write(root, 'src/base.txt', 'second\n');

  assert.notEqual(snapshot(root), first);
});

test('non-ignored additions change the digest while ignored additions do not', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);

  write(root, 'ignored/cache.txt', 'not reviewed\n');
  assert.equal(snapshot(root), baseline);

  write(root, 'src/new.txt', 'reviewed\n');
  assert.notEqual(snapshot(root), baseline);
});

test('staging unchanged candidate bytes does not change the digest', (t) => {
  const root = createRepository(t);
  write(root, 'src/new.txt', 'reviewed\n');
  write(root, 'src/base.txt', 'modified\n');
  const unstaged = snapshot(root);

  git(root, ['add', '--all']);

  assert.equal(snapshot(root), unstaged);
});

test('deletions change the digest without reading the absent path', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);

  fs.rmSync(path.join(root, 'src', 'base.txt'));

  assert.notEqual(snapshot(root), baseline);
});

test('deletions bind the reviewed baseline object identity', (t) => {
  const firstRoot = createRepository(t);
  write(firstRoot, 'src/base.txt', 'first baseline\n');
  git(firstRoot, ['add', '--all']);
  git(firstRoot, ['commit', '--quiet', '-m', 'first deletion baseline']);
  fs.rmSync(path.join(firstRoot, 'src', 'base.txt'));

  const secondRoot = createRepository(t);
  write(secondRoot, 'src/base.txt', 'second baseline\n');
  git(secondRoot, ['add', '--all']);
  git(secondRoot, ['commit', '--quiet', '-m', 'second deletion baseline']);
  fs.rmSync(path.join(secondRoot, 'src', 'base.txt'));

  assert.notEqual(snapshot(secondRoot), snapshot(firstRoot));
});

test('a rename is represented as a deterministic deletion plus addition', (t) => {
  const root = createRepository(t);
  fs.renameSync(
    path.join(root, 'src', 'base.txt'),
    path.join(root, 'src', 'renamed.txt'),
  );
  const renamed = snapshot(root);

  const equivalentRoot = createRepository(t);
  fs.rmSync(path.join(equivalentRoot, 'src', 'base.txt'));
  write(equivalentRoot, 'src/renamed.txt', 'base\n');

  assert.equal(snapshot(equivalentRoot), renamed);
});

test('file mode changes alter the digest when Git reports the mode change', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);

  git(root, ['update-index', '--chmod=+x', 'src/base.txt']);

  assert.notEqual(snapshot(root), baseline);
});

test(
  'file type changes alter the digest with unchanged raw entry bytes',
  { skip: process.platform === 'win32' },
  (t) => {
    const root = createRepository(t);
    write(root, 'src/base.txt', 'target');
    git(root, ['add', '--all']);
    git(root, ['commit', '--quiet', '-m', 'normalize fixture bytes']);
    const baseline = snapshot(root);

    fs.rmSync(path.join(root, 'src', 'base.txt'));
    fs.symlinkSync('target', path.join(root, 'src', 'base.txt'));

    assert.notEqual(snapshot(root), baseline);
  },
);

test('discovery order does not affect ordinal entry ordering', (t) => {
  const firstRoot = createRepository(t);
  write(firstRoot, 'z-last.txt', 'z\n');
  write(firstRoot, 'a-first.txt', 'a\n');

  const secondRoot = createRepository(t);
  write(secondRoot, 'a-first.txt', 'a\n');
  write(secondRoot, 'z-last.txt', 'z\n');

  assert.equal(snapshot(secondRoot), snapshot(firstRoot));
});

test('repository and work-item path spelling normalize to one snapshot', (t) => {
  const root = createRepository(t);
  write(root, 'nested/path.txt', 'candidate\n');
  const canonical = snapshot(root);
  const alternateRoot = `${root}${path.sep}.`;
  const alternateWorkItem = workItemRelativePath.replaceAll('/', path.sep);

  assert.equal(
    snapshot(root, {
      repositoryRoot: alternateRoot,
      workItemPath: alternateWorkItem,
    }),
    canonical,
  );
});

test('length-delimited entry framing distinguishes ambiguous concatenations', (t) => {
  const firstRoot = createRepository(t);
  write(firstRoot, 'a', 'bc');

  const secondRoot = createRepository(t);
  write(secondRoot, 'ab', 'c');

  assert.notEqual(snapshot(secondRoot), snapshot(firstRoot));
});

test('reviewed work-item intent and implementation description change the digest', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);

  write(
    root,
    workItemRelativePath,
    workItem({ goal: 'Review different intent.' }),
  );
  const changedGoal = snapshot(root);
  assert.notEqual(changedGoal, baseline);

  write(
    root,
    workItemRelativePath,
    workItem().replace(
      'Implemented the snapshot function.',
      'Implemented different candidate behavior.',
    ),
  );
  assert.notEqual(snapshot(root), baseline);
});

test('permitted work-item control and evidence updates do not self-invalidate', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);
  const controlOnlyUpdate = workItem({ stage: 'verify' })
    .replace('Status: active', 'Status: delivered')
    .replace('2026-07-31T13:46:08+03:00', '2026-07-31T15:00:00+03:00')
    .replace('Turns since time check: 2', 'Turns since time check: 0')
    .replace('Review cycles: 0', 'Review cycles: 1')
    .replace('Review status: pending', 'Review status: passed')
    .replace(
      'Review snapshot: pending',
      `Review snapshot: sha256:${'a'.repeat(64)}`,
    )
    .replace('Review batch: pending', 'Review batch: review-example-01')
    .replace(
      'Review expected: pending',
      'Review expected: ["contract","quality"]',
    )
    .replace(
      'Review received: pending',
      'Review received: [{"reviewer":"contract","outcome":"passed"}]',
    )
    .replace('Pending.', 'No required findings.')
    .replace('Result: pending', 'Result: passed');

  write(root, workItemRelativePath, controlOnlyUpdate);

  assert.equal(snapshot(root), baseline);
});

test('NEXT routing-only updates do not affect the candidate digest', (t) => {
  const root = createRepository(t);
  const baseline = snapshot(root);

  write(root, 'NEXT.md', '# NEXT\n\nDifferent routing state.\n');

  assert.equal(snapshot(root), baseline);
});
