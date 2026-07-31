import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };

const packageRoot = resolve(__dirname, '..');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

jest.setTimeout(120_000);

function run(command: string, args: string[], cwd: string) {
  const common = {
    cwd,
    encoding: 'utf8' as const,
    env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' },
    windowsHide: true,
  };

  if (process.platform === 'win32') {
    return spawnSync(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', 'call', command, ...args],
      common,
    );
  }

  return spawnSync(command, args, common);
}

it('installs and runs the clean packed artifact with Node.js', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'weekly report cli '));
  const artifacts = join(workspace, 'artifacts');
  const consumer = join(workspace, 'consumer');

  try {
    const packed = run(
      pnpmCommand,
      ['pack', '--pack-destination', artifacts],
      packageRoot,
    );
    if (packed.status !== 0) {
      throw new Error(
        `pack failed (${packed.status}): ${packed.stderr || packed.stdout}`,
      );
    }

    const tarballs = (await readdir(artifacts)).filter((name) =>
      name.endsWith('.tgz'),
    );
    expect(tarballs).toHaveLength(1);

    await mkdir(consumer, { recursive: true });
    await writeFile(
      join(consumer, 'package.json'),
      '{"private":true}\n',
      'utf8',
    );

    const tarball = join(artifacts, tarballs[0]);
    const listing = run('tar', ['-tf', tarballs[0]], artifacts);
    if (listing.status !== 0) {
      throw new Error(
        `tar listing failed (${listing.status}): ${listing.stderr || listing.stdout}`,
      );
    }
    expect(listing.stdout.trim().split(/\r?\n/u).sort()).toEqual([
      'package/README.md',
      'package/dist/arguments.js',
      'package/dist/bin.js',
      'package/dist/cli.js',
      'package/dist/evidence-schema.js',
      'package/dist/git-collector.js',
      'package/dist/redaction.js',
      'package/package.json',
    ]);

    const installed = run(pnpmCommand, ['add', tarball], consumer);
    expect(installed.status).toBe(0);

    const shim = join(
      consumer,
      'node_modules',
      '.bin',
      process.platform === 'win32'
        ? 'weekly-report-cli.CMD'
        : 'weekly-report-cli',
    );
    const help = run(shim, ['--help'], consumer);
    expect(help).toMatchObject({ status: 0, stderr: '' });
    expect(help.stdout).toContain('weekly-report-cli');

    const version = run(shim, ['--version'], consumer);
    expect(version).toMatchObject({
      status: 0,
      stderr: '',
      stdout: `weekly-report-cli ${packageJson.version}\n`,
    });

    const remote = join(workspace, 'synthetic remote.git');
    const seed = join(workspace, 'synthetic seed');
    const target = join(workspace, 'synthetic target with spaces');
    expect(run('git', ['init', '--bare', remote], workspace).status).toBe(0);
    expect(run('git', ['init', seed], workspace).status).toBe(0);
    expect(
      run('git', ['config', 'user.name', 'Synthetic User'], seed).status,
    ).toBe(0);
    expect(
      run('git', ['config', 'user.email', 'synthetic@example.invalid'], seed)
        .status,
    ).toBe(0);
    expect(run('git', ['checkout', '-b', 'main'], seed).status).toBe(0);
    await writeFile(join(seed, 'evidence.txt'), 'packed evidence\n', 'utf8');
    expect(run('git', ['add', 'evidence.txt'], seed).status).toBe(0);
    expect(run('git', ['commit', '-m', 'packed evidence'], seed).status).toBe(
      0,
    );
    expect(run('git', ['remote', 'add', 'origin', remote], seed).status).toBe(
      0,
    );
    expect(run('git', ['push', '-u', 'origin', 'main'], seed).status).toBe(0);
    expect(
      run('git', ['symbolic-ref', 'HEAD', 'refs/heads/main'], remote).status,
    ).toBe(0);
    expect(run('git', ['clone', remote, target], workspace).status).toBe(0);

    const collected = run(
      shim,
      [
        'collect',
        'git',
        '--repository',
        target,
        '--remote',
        'origin',
        '--default-branch',
        'main',
        '--since',
        '2000-01-01T00:00:00Z',
        '--until',
        '2100-01-01T00:00:00Z',
      ],
      consumer,
    );
    expect(collected).toMatchObject({ status: 0, stderr: '' });
    expect(JSON.parse(collected.stdout)).toMatchObject({
      branches: [],
      defaultBranchCommits: [{ subject: 'packed evidence' }],
      status: 'verified',
    });
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});
