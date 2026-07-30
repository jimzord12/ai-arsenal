import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
      stdout: 'weekly-report-cli 0.0.0\n',
    });
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});
