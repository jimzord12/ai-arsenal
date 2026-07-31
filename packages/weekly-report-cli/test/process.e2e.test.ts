import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };

const packageRoot = resolve(__dirname, '..');
const binPath = resolve(packageRoot, 'dist', 'bin.js');

function git(cwd: string, args: string[], date?: string): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_DATE: date,
      GIT_TERMINAL_PROMPT: '0',
    },
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

it('runs help through the compiled Node.js process', () => {
  const result = spawnSync(process.execPath, [binPath, '--help'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });

  expect(result).toMatchObject({
    status: 0,
    stderr: '',
  });
  expect(result.stdout).toContain('weekly-report-cli');
  expect(result.stdout).toContain(
    'Successful collection writes validated JSON evidence to stdout.',
  );
});

it('keeps stdout and stderr separated for version and usage results', () => {
  const version = spawnSync(process.execPath, [binPath, '--version'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  expect(version).toMatchObject({
    status: 0,
    stderr: '',
    stdout: `weekly-report-cli ${packageJson.version}\n`,
  });

  const unknown = spawnSync(process.execPath, [binPath, 'deploy'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  expect(unknown).toMatchObject({
    status: 2,
    stderr: 'USAGE_ERROR: Unknown command.\n',
    stdout: '',
  });
});

it.each([
  'https://account:private-token@example.invalid/repository.git',
  'origin\nprivate-token',
  'a..b',
  'foo.lock',
  'a/b.LOCK',
])('rejects unsafe remote input without exposing it: %s', (remote) => {
  const result = spawnSync(
    process.execPath,
    [
      binPath,
      'collect',
      'git',
      '--repository',
      'unused',
      '--remote',
      remote,
      '--default-branch',
      'main',
      '--since',
      '2026-07-20T00:00:00Z',
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    { cwd: packageRoot, encoding: 'utf8', windowsHide: true },
  );

  expect(result).toMatchObject({
    status: 2,
    stderr: 'USAGE_ERROR: Invalid remote name.\n',
    stdout: '',
  });
  expect(`${result.stdout}${result.stderr}`).not.toContain(remote);
  expect(`${result.stdout}${result.stderr}`).not.toContain('private-token');
  expect(`${result.stdout}${result.stderr}`).not.toContain(
    'https://account:private-token@example.invalid/repository.git',
  );
});

it.each([
  [
    'credential-bearing since',
    [
      'collect',
      'git',
      '--repository',
      'unused',
      '--remote',
      'origin',
      '--default-branch',
      'main',
      '--since',
      'https://account:private-token@example.invalid/since',
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    'USAGE_ERROR: Invalid ISO instant for --since.\n',
  ],
  [
    'credential-bearing until',
    [
      'collect',
      'git',
      '--repository',
      'unused',
      '--remote',
      'origin',
      '--default-branch',
      'main',
      '--since',
      '2026-07-20T00:00:00Z',
      '--until',
      'https://account:private-token@example.invalid/until',
    ],
    'USAGE_ERROR: Invalid ISO instant for --until.\n',
  ],
  [
    'credential-bearing default branch',
    [
      'collect',
      'git',
      '--repository',
      'unused',
      '--remote',
      'origin',
      '--default-branch',
      'https://account:private-token@example.invalid/branch',
      '--since',
      '2026-07-20T00:00:00Z',
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    'USAGE_ERROR: Invalid default branch name.\n',
  ],
  [
    'credential-bearing unknown command',
    ['https://account:private-token@example.invalid/command'],
    'USAGE_ERROR: Unknown command.\n',
  ],
  [
    'credential-bearing unknown option',
    [
      'collect',
      'git',
      'https://account:private-token@example.invalid/option',
      'value',
    ],
    'USAGE_ERROR: Unknown or incomplete option.\n',
  ],
])('does not disclose %s', (_name, args, stderr) => {
  const result = spawnSync(process.execPath, [binPath, ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });

  expect(result).toMatchObject({ status: 2, stderr, stdout: '' });
  expect(`${result.stdout}${result.stderr}`).not.toContain('private-token');
  expect(`${result.stdout}${result.stderr}`).not.toContain('https://account:');
});

it('rejects impossible instants as stderr-only usage errors', () => {
  const impossible = '2026-02-30T00:00:00Z';
  const result = spawnSync(
    process.execPath,
    [
      binPath,
      'collect',
      'git',
      '--repository',
      'unused',
      '--remote',
      'origin',
      '--default-branch',
      'main',
      '--since',
      impossible,
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    { cwd: packageRoot, encoding: 'utf8', windowsHide: true },
  );

  expect(result).toMatchObject({
    status: 2,
    stderr: 'USAGE_ERROR: Invalid ISO instant for --since.\n',
    stdout: '',
  });
});

it('collects verified JSON through the compiled process without changing the worktree', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'compiled git collector '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target with spaces');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    writeFileSync(join(seed, 'evidence.txt'), 'compiled evidence\n');
    git(seed, ['add', 'evidence.txt']);
    git(seed, ['commit', '-m', 'compiled evidence'], '2026-07-21T10:00:00Z');
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);
    const headBefore = git(target, ['rev-parse', 'HEAD']);
    const fetchHeadPath = join(target, '.git', 'FETCH_HEAD');
    const fetchHeadBefore = existsSync(fetchHeadPath)
      ? readFileSync(fetchHeadPath, 'utf8')
      : null;

    const result = spawnSync(
      process.execPath,
      [
        binPath,
        'collect',
        'git',
        '--repository',
        target,
        '--remote',
        'origin',
        '--default-branch',
        'main',
        '--since',
        '2026-07-20T00:00:00Z',
        '--until',
        '2026-07-26T23:59:59Z',
      ],
      {
        cwd: packageRoot,
        encoding: 'utf8',
        windowsHide: true,
      },
    );

    expect(result).toMatchObject({ status: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      branches: [],
      defaultBranchCommits: [{ subject: 'compiled evidence' }],
      status: 'verified',
    });
    expect(git(target, ['rev-parse', 'HEAD'])).toBe(headBefore);
    expect(git(target, ['status', '--porcelain'])).toBe('');
    expect(
      existsSync(fetchHeadPath) ? readFileSync(fetchHeadPath, 'utf8') : null,
    ).toBe(fetchHeadBefore);
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

it('returns explicit unverifiable evidence for a non-repository target', () => {
  const target = mkdtempSync(join(tmpdir(), 'not a git repository '));
  try {
    const result = spawnSync(
      process.execPath,
      [
        binPath,
        'collect',
        'git',
        '--repository',
        target,
        '--remote',
        'origin',
        '--default-branch',
        'main',
        '--since',
        '2026-07-20T00:00:00Z',
        '--until',
        '2026-07-26T23:59:59Z',
      ],
      { encoding: 'utf8', windowsHide: true },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('COLLECTION_ERROR GIT_REPOSITORY_INVALID');
    expect(JSON.parse(result.stdout)).toMatchObject({
      errors: [{ code: 'GIT_REPOSITORY_INVALID' }],
      status: 'unverifiable',
    });
  } finally {
    rmSync(target, { force: true, recursive: true });
  }
});
