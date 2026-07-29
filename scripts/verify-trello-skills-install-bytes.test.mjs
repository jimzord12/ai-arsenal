import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import test from 'node:test';
import { createHash } from 'node:crypto';

const script = fileURLToPath(
  new URL('./verify-trello-skills-install-bytes.mjs', import.meta.url),
);
const names = [
  'trello-work-orchestrator',
  'trello-work-design',
  'trello-work-deliver',
  'trello-work-recover',
];
const canonical =
  '../../../packages/trello-work-cli/assets/agent-workflow-protocol.md';
const installed = 'references/agent-workflow-protocol.md';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'trello-byte-proof-'));
  const payload = join(root, 'payload');
  const repo = join(root, 'repo');
  const protocol = '# protocol\n';
  await mkdir(payload, { recursive: true });
  await writeFile(join(payload, 'agent-workflow-protocol.md'), protocol);
  for (const name of names) {
    await mkdir(join(payload, name), { recursive: true });
    const source = `# ${name}\nSee ${canonical}.\n`;
    await writeFile(join(payload, name, 'SKILL.md'), source);
    const target = join(repo, '.agents', 'skills', name);
    await mkdir(join(target, 'references'), { recursive: true });
    await writeFile(
      join(target, 'SKILL.md'),
      source.replace(canonical, installed),
    );
    await writeFile(
      join(target, 'references', 'agent-workflow-protocol.md'),
      protocol,
    );
    await writeFile(
      join(target, '.jz-trello-flow-managed.json'),
      `${JSON.stringify({ managedBy: 'jz-trello-flow', replaceable: true, skill: name, version: 1 })}\n`,
    );
  }
  const sentinel = join(repo, '.agents', 'skills', 'unrelated', 'sentinel.txt');
  await mkdir(join(repo, '.agents', 'skills', 'unrelated'), {
    recursive: true,
  });
  await writeFile(sentinel, 'preserve me\n');
  return {
    root,
    payload,
    repo,
    sentinel,
    sentinelSha: sha(await readFile(sentinel)),
  };
}

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

test('proves transformed bytes, sentinel, and repeat manifest', async () => {
  const f = await fixture();
  try {
    const manifest = join(f.root, 'first.json');
    const common = [
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      f.sentinel,
      '--sentinel-sha256',
      f.sentinelSha,
    ];
    const first = run([...common, '--write-manifest', manifest]);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /verified 12 managed files across 4 skills/);
    const repeat = run([...common, '--compare-manifest', manifest]);
    assert.equal(repeat.status, 0, repeat.stderr);
    assert.match(repeat.stdout, /repeat manifest identical/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test('rejects byte mismatch and extra managed file', async () => {
  const f = await fixture();
  try {
    const skill = join(f.repo, '.agents', 'skills', names[0]);
    await writeFile(join(skill, 'SKILL.md'), 'wrong\n');
    let result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      f.sentinel,
      '--sentinel-sha256',
      f.sentinelSha,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /byte mismatch/);
    await writeFile(
      join(skill, 'SKILL.md'),
      `# ${names[0]}\nSee ${installed}.\n`,
    );
    await writeFile(join(skill, 'extra.txt'), 'extra');
    result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      f.sentinel,
      '--sentinel-sha256',
      f.sentinelSha,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unexpected managed file/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test('rejects changed unrelated sentinel', async () => {
  const f = await fixture();
  try {
    await writeFile(f.sentinel, 'changed\n');
    const result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      f.sentinel,
      '--sentinel-sha256',
      f.sentinelSha,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /sentinel SHA-256 mismatch/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test('rejects a redirected managed skill root', async () => {
  const f = await fixture();
  try {
    const managed = join(f.repo, '.agents', 'skills', names[0]);
    const redirected = join(f.root, 'redirected-skill');
    await rm(managed, { recursive: true });
    await mkdir(redirected);
    await symlink(redirected, managed, 'junction');
    const result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      f.sentinel,
      '--sentinel-sha256',
      f.sentinelSha,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /redirected or invalid .* managed root/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test('rejects a sentinel beneath a junction-redirected parent', async () => {
  const f = await fixture();
  try {
    const redirected = join(f.root, 'redirected-sentinel-parent');
    const parent = join(f.repo, '.agents', 'skills', 'redirected-unrelated');
    const sentinel = join(parent, 'sentinel.txt');
    await mkdir(redirected);
    await writeFile(join(redirected, 'sentinel.txt'), 'redirected\n');
    await symlink(redirected, parent, 'junction');
    const result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      sentinel,
      '--sentinel-sha256',
      sha(await readFile(sentinel)),
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /redirected or invalid sentinel parent/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test(
  'rejects final-component sentinel symlinks to internal and escaping files',
  {
    skip:
      process.platform === 'win32'
        ? 'ordinary file symlinks require Windows developer privilege'
        : false,
  },
  async () => {
    const f = await fixture();
    try {
      const internal = join(
        f.repo,
        '.agents',
        'skills',
        'unrelated',
        'internal.txt',
      );
      const outside = join(f.root, 'outside-sentinel.txt');
      const sentinel = join(
        f.repo,
        '.agents',
        'skills',
        'unrelated',
        'linked.txt',
      );
      await writeFile(internal, 'internal\n');
      await writeFile(outside, 'outside\n');
      for (const target of [internal, outside]) {
        await rm(sentinel, { force: true });
        await symlink(target, sentinel, 'file');
        const result = run([
          '--payload-root',
          f.payload,
          '--repo-root',
          f.repo,
          '--sentinel',
          sentinel,
          '--sentinel-sha256',
          sha(await readFile(target)),
        ]);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /redirected or invalid sentinel/);
      }
    } finally {
      await rm(f.root, { recursive: true, force: true });
    }
  },
);

test('rejects sentinel escape and invalid sentinel type', async () => {
  const f = await fixture();
  try {
    const outside = join(f.root, 'outside-sentinel.txt');
    await writeFile(outside, 'preserve me\n');
    let result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      outside,
      '--sentinel-sha256',
      sha(await readFile(outside)),
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /redirected or invalid sentinel parent/);

    const invalid = join(f.repo, '.agents', 'skills', 'unrelated');
    result = run([
      '--payload-root',
      f.payload,
      '--repo-root',
      f.repo,
      '--sentinel',
      invalid,
      '--sentinel-sha256',
      f.sentinelSha,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /redirected or invalid sentinel/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
