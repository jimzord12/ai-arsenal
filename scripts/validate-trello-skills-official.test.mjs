import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

test('official skill validation rejects an unpinned validator checkout before invoking Python', () => {
  const root = mkdtempSync(join(tmpdir(), 'jz-skills-official-test-'));
  try {
    execFileSync('git', ['init', '--quiet', root]);
    const marker = join(root, 'python-was-invoked');
    const result = spawnSync(
      'bun',
      [
        resolve('scripts/validate-trello-skills-official.ts'),
        '--checkout',
        root,
        '--python',
        marker,
      ],
      { encoding: 'utf8', windowsHide: true },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /SKILLS_VALIDATOR_PROVENANCE/);
    assert.doesNotMatch(result.stderr, /ENOENT.*python-was-invoked/);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('official skill validation rejects unknown arguments instead of validating the default payload', () => {
  const result = spawnSync(
    'bun',
    [
      resolve('scripts/validate-trello-skills-official.ts'),
      '--checkout',
      'unused',
      '--python',
      'unused',
      '--payload-rooot',
      'misspelled',
    ],
    { encoding: 'utf8', windowsHide: true },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid argument: --payload-rooot/);
  assert.doesNotMatch(result.stderr, /SKILLS_VALIDATOR_PROVENANCE/);
});
