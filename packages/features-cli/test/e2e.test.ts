import { spawn } from 'node:child_process';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

type ProcessResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

const packageRoot = resolve(__dirname, '..');
const binPath = join(packageRoot, 'src', 'bin.ts');
const bunCommand = process.platform === 'win32' ? 'bun.exe' : 'bun';
const pnpmCommand = process.platform === 'win32' ? process.execPath : 'pnpm';
const pnpmEntrypoint = join(
  dirname(process.execPath),
  'node_modules',
  'corepack',
  'dist',
  'pnpm.js',
);

jest.setTimeout(120_000);

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  env = process.env,
): Promise<ProcessResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (exitCode) => {
      if (exitCode === null) {
        reject(new Error(`${command} exited without an exit code.`));
        return;
      }

      resolvePromise({ exitCode, stderr, stdout });
    });
  });
}

function runCli(cwd: string, args: string[]): Promise<ProcessResult> {
  return runProcess(bunCommand, [binPath, ...args], cwd);
}

function runPnpm(cwd: string, args: string[]): Promise<ProcessResult> {
  const commandArgs =
    process.platform === 'win32' ? [pnpmEntrypoint, ...args] : args;
  return runProcess(pnpmCommand, commandArgs, cwd, {
    ...process.env,
    COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
  });
}

async function createWorkspace(
  prefix = 'features cli e2e-Δ-',
): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

async function expectCliSuccess(cwd: string, args: string[]) {
  const result = await runCli(cwd, args);
  expect(result).toMatchObject({ exitCode: 0, stderr: '' });
  return result;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

async function waitForFile(path: string): Promise<void> {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (await pathExists(path)) {
      return;
    }

    await new Promise<void>((resolvePromise) => {
      setTimeout(resolvePromise, 5);
    });
  }

  throw new Error(`Timed out waiting for ${path}.`);
}

async function seedIssueWorkspace(cwd: string): Promise<{
  featureDir: string;
  issuePath: string;
}> {
  await expectCliSuccess(cwd, ['init']);
  await expectCliSuccess(cwd, ['create-feature', 'sample-feature']);
  await expectCliSuccess(cwd, [
    'update-feature',
    'sample-feature',
    '--status',
    'in-progress',
    '--phase',
    'implementation',
  ]);

  const featureDir = join(cwd, '.scratch', 'features', '001-sample-feature');
  const issuePath = join(featureDir, 'issues', '01-process-issue', 'issue.md');
  await mkdir(dirname(issuePath), { recursive: true });
  await writeFile(
    issuePath,
    [
      'Status: ready-for-agent',
      'Method: tdd',
      'Complexity: 1',
      'BlockedBy: none',
      'Milestone: delivery',
      '# Process issue',
      '',
      'User-authored body remains canonical.',
      '',
    ].join('\n'),
    'utf8',
  );

  return { featureDir, issuePath };
}

async function seedLargeFeatureState(cwd: string): Promise<void> {
  const features = Array.from({ length: 32_000 }, (_, index) => ({
    finalStatus: null,
    focusPath: null,
    id: index + 1,
    lastUpdated: '2026-07-12T00:00:00.000Z',
    phase: 'implementation',
    slug: index === 0 ? 'sample-feature' : `feature-${index + 1}`,
    status: index === 0 ? 'in-progress' : 'todo',
  }));

  await mkdir(join(cwd, '.scratch', 'features', '001-sample-feature'), {
    recursive: true,
  });
  await writeFile(
    join(cwd, '.scratch', 'features-status.json'),
    `${JSON.stringify(
      {
        features,
        lastUpdated: '2026-07-12T00:00:00.000Z',
        nextFeatureId: features.length + 1,
        version: '2',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function expectContendedWriter(
  cwd: string,
  firstArgs: string[],
  secondArgs: string[],
): Promise<void> {
  const first = runCli(cwd, firstArgs);
  await waitForFile(join(cwd, '.scratch', 'features-status.lock'));
  const second = await runCli(cwd, secondArgs);
  const firstResult = await first;

  expect(firstResult).toMatchObject({ exitCode: 0, stderr: '' });
  expect(second).toMatchObject({
    exitCode: 1,
    stdout: '',
    stderr: expect.stringContaining('already in progress'),
  });
}

async function expectSimultaneousWriters(
  cwd: string,
  firstArgs: string[],
  secondArgs: string[],
): Promise<void> {
  const results = await Promise.all([
    runCli(cwd, firstArgs),
    runCli(cwd, secondArgs),
  ]);
  const successful = results.filter((result) => result.exitCode === 0);
  const failed = results.filter((result) => result.exitCode === 1);

  expect(successful).toHaveLength(1);
  expect(failed).toHaveLength(1);
  expect(failed[0]).toMatchObject({
    stdout: '',
    stderr: expect.stringContaining('already in progress'),
  });
}

describe('features-cli process E2E', () => {
  const workspaces: string[] = [];

  afterEach(async () => {
    await Promise.all(
      workspaces
        .splice(0)
        .map((workspace) => rm(workspace, { force: true, recursive: true })),
    );
  });

  async function workspace(prefix?: string) {
    const cwd = await createWorkspace(prefix);
    workspaces.push(cwd);
    return cwd;
  }

  it('runs the pinned Bun runtime and CLI help through their real processes', async () => {
    const runtime = await runProcess(bunCommand, ['--version'], packageRoot);
    expect(runtime).toMatchObject({ exitCode: 0, stderr: '' });
    expect(runtime.stdout.trim()).toBe('1.3.14');

    const cwd = await workspace();
    const help = await runCli(cwd, ['--help']);
    expect(help).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: expect.stringContaining('features-cli commands:'),
    });
  });

  it('rejects the unsupported version flag through the CLI parser', async () => {
    const cwd = await workspace();

    await expect(runCli(cwd, ['--version'])).resolves.toEqual({
      exitCode: 1,
      stderr: 'Unknown command. Run --help for supported commands.\n',
      stdout: '',
    });
  });

  it('persists a feature lifecycle and leaves repeated initialization unchanged', async () => {
    const cwd = await workspace();
    const firstInit = await expectCliSuccess(cwd, ['init']);
    const secondInit = await expectCliSuccess(cwd, ['init']);
    await expectCliSuccess(cwd, ['create-feature', 'sample-feature']);
    await expectCliSuccess(cwd, [
      'update-feature',
      'sample-feature',
      '--status',
      'in-progress',
      '--phase',
      'design',
    ]);
    const current = await expectCliSuccess(cwd, ['get-feature']);

    expect(firstInit.stdout).toBe(
      'Initialized pipeline state at .scratch/features-status.json\n',
    );
    expect(secondInit.stdout).toBe(
      'Pipeline state already exists at .scratch/features-status.json (left unchanged)\n',
    );
    expect(current.stdout).toContain('slug: sample-feature');
    await expect(
      readFile(join(cwd, '.scratch', 'features-status.json'), 'utf8'),
    ).resolves.toContain('"version": "2"');
  });

  it('runs the issue lifecycle and regenerates canonical derived state', async () => {
    const cwd = await workspace();
    const { issuePath } = await seedIssueWorkspace(cwd);
    const unrelatedPath = join(cwd, 'unrelated.txt');
    await writeFile(unrelatedPath, 'preserve me\n', 'utf8');

    await expectCliSuccess(cwd, ['sync-issues', '--feature', 'sample-feature']);
    await expectCliSuccess(cwd, [
      'update-status',
      '1',
      '--status',
      'in-progress',
      '--feature',
      'sample-feature',
    ]);
    const resumable = await expectCliSuccess(cwd, [
      'get-issue',
      '--resume',
      '--feature',
      'sample-feature',
    ]);
    await expectCliSuccess(cwd, [
      'update-status',
      '1',
      '--status',
      'in-review',
      '--feature',
      'sample-feature',
    ]);
    await expectCliSuccess(cwd, [
      'reopen-issue',
      '1',
      '--phase',
      'green',
      '--reason',
      'The process-level regression failed.',
      '--feature',
      'sample-feature',
    ]);

    expect(resumable.stdout).toContain('Resumable issue');
    await expect(readFile(issuePath, 'utf8')).resolves.toContain(
      'Status: ready-for-agent',
    );
    await expect(readFile(issuePath, 'utf8')).resolves.toContain('Reopens: 1');
    await expect(readFile(issuePath, 'utf8')).resolves.toContain(
      'User-authored body remains canonical.',
    );
    await expect(readFile(unrelatedPath, 'utf8')).resolves.toBe(
      'preserve me\n',
    );
    await expect(
      readFile(
        join(
          cwd,
          '.scratch',
          'features',
          '001-sample-feature',
          'issues-status.json',
        ),
        'utf8',
      ),
    ).resolves.toContain('"status": "ready-for-agent"');
  });

  it('fails missing and invalid commands without mutating feature state', async () => {
    const cwd = await workspace();
    const missing = await runCli(cwd, ['get-feature']);
    expect(missing).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('Missing feature state'),
    });

    await expectCliSuccess(cwd, ['init']);
    const before = await readFile(
      join(cwd, '.scratch', 'features-status.json'),
      'utf8',
    );
    const invalid = await runCli(cwd, [
      'update-feature',
      'missing-feature',
      '--status',
      'paused',
    ]);

    expect(invalid).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('Unknown feature "missing-feature"'),
    });
    await expect(
      readFile(join(cwd, '.scratch', 'features-status.json'), 'utf8'),
    ).resolves.toBe(before);
  });

  it('fails corrupt feature state without rewriting it', async () => {
    const cwd = await workspace();
    const statePath = join(cwd, '.scratch', 'features-status.json');
    await mkdir(dirname(statePath), { recursive: true });
    await writeFile(statePath, '{ not json\n', 'utf8');

    const result = await runCli(cwd, ['status']);
    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('Malformed feature state'),
    });
    await expect(readFile(statePath, 'utf8')).resolves.toBe('{ not json\n');
  });

  it('roots state strictly at a nested cwd with spaces and Unicode', async () => {
    const root = await workspace('features cli root-Δ-');
    const nested = join(root, 'nested workspace', '子');
    await mkdir(nested, { recursive: true });

    await expectCliSuccess(nested, ['init']);

    await expect(
      readFile(join(nested, '.scratch', 'features-status.json'), 'utf8'),
    ).resolves.toContain('"version": "2"');
    expect(
      await pathExists(join(root, '.scratch', 'features-status.json')),
    ).toBe(false);
  });

  it('fails closed while a recovery journal exists and leaves it untouched', async () => {
    const cwd = await workspace();
    await expectCliSuccess(cwd, ['init']);
    const recoveryPath = join(
      cwd,
      '.scratch',
      'features-status.recovery-required.json',
    );
    await writeFile(recoveryPath, '{"status":"pending"}\n', 'utf8');

    const result = await runCli(cwd, ['status']);
    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('Recovery required'),
    });
    await expect(readFile(recoveryPath, 'utf8')).resolves.toBe(
      '{"status":"pending"}\n',
    );
  });

  it('fails fast on a stale lock and preserves the lock and feature state', async () => {
    const cwd = await workspace();
    await expectCliSuccess(cwd, ['init']);
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    const statePath = join(cwd, '.scratch', 'features-status.json');
    const before = await readFile(statePath, 'utf8');
    await writeFile(lockPath, 'stale lock\n', 'utf8');

    const result = await runCli(cwd, ['create-feature', 'blocked-feature']);
    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('already in progress'),
    });
    await expect(readFile(lockPath, 'utf8')).resolves.toBe('stale lock\n');
    await expect(readFile(statePath, 'utf8')).resolves.toBe(before);
  });

  it('characterizes the process-level direct issue-write partial failure boundary', async () => {
    const cwd = await workspace();
    const { featureDir, issuePath } = await seedIssueWorkspace(cwd);
    await expectCliSuccess(cwd, ['sync-issues', '--feature', 'sample-feature']);

    const featuresStatusPath = join(cwd, '.scratch', 'features-status.json');
    const beforeFeaturesState = await readFile(featuresStatusPath, 'utf8');
    const issuesStatusPath = join(featureDir, 'issues-status.json');
    await rm(issuesStatusPath);
    await mkdir(issuesStatusPath);

    const result = await runCli(cwd, [
      'update-status',
      '1',
      '--status',
      'in-progress',
      '--feature',
      'sample-feature',
    ]);

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(result.stderr).not.toBe('');
    await expect(readFile(issuePath, 'utf8')).resolves.toContain(
      'Status: in-progress',
    );
    await expect(readFile(featuresStatusPath, 'utf8')).resolves.toBe(
      beforeFeaturesState,
    );
    expect(
      await pathExists(join(cwd, '.scratch', 'features-status.lock')),
    ).toBe(false);
  });

  it('allows one real feature writer while a concurrent process fails fast', async () => {
    const cwd = await workspace();
    await seedLargeFeatureState(cwd);

    await expectContendedWriter(
      cwd,
      ['update-feature', 'sample-feature', '--phase', 'design'],
      ['update-feature', 'sample-feature', '--status', 'paused'],
    );
  });

  it('allows one real issue writer while a concurrent process fails fast', async () => {
    const cwd = await workspace();
    await seedLargeFeatureState(cwd);
    const issuePath = join(
      cwd,
      '.scratch',
      'features',
      '001-sample-feature',
      'issues',
      '01-process-issue',
      'issue.md',
    );
    await mkdir(dirname(issuePath), { recursive: true });
    await writeFile(
      issuePath,
      'Status: ready-for-agent\nMethod: tdd\nComplexity: 1\nBlockedBy: none\n# Process issue\n',
      'utf8',
    );

    await expectSimultaneousWriters(
      cwd,
      [
        'update-status',
        '1',
        '--status',
        'in-progress',
        '--feature',
        'sample-feature',
      ],
      ['sync-issues', '--feature', 'sample-feature'],
    );
  });

  it('allows one real milestone writer while a concurrent process fails fast', async () => {
    const cwd = await workspace();
    const { featureDir, issuePath } = await seedIssueWorkspace(cwd);
    const specPath = join(featureDir, 'SPEC.md');
    await writeFile(
      specPath,
      [
        '<!-- milestone-plan:start -->',
        '### 1. Delivery — `delivery`',
        '- **DependsOn:** none',
        '- **Decomposed:** pending',
        '<!-- milestone-plan:end -->',
        '',
        'x'.repeat(16 * 1024 * 1024),
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      issuePath,
      'Status: done\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: delivery\n# Process issue\n',
      'utf8',
    );

    await expectContendedWriter(
      cwd,
      ['mark-milestone-decomposed', 'delivery', '--feature', 'sample-feature'],
      ['mark-milestone-decomposed', 'delivery', '--feature', 'sample-feature'],
    );
  });

  it('installs and invokes the freshly packed artifact from a clean consumer', async () => {
    const artifactsDir = await workspace('features-cli-artifacts-');
    const consumerDir = await workspace('features cli consumer-Δ-');
    const packed = await runPnpm(packageRoot, [
      'pack',
      '--pack-destination',
      artifactsDir,
    ]);
    expect(packed).toMatchObject({ exitCode: 0, stderr: '' });

    const tarballs = (await readdir(artifactsDir))
      .filter((entry) => entry.endsWith('.tgz'))
      .map((entry) => join(artifactsDir, entry));
    expect(tarballs).toHaveLength(1);
    await writeFile(
      join(consumerDir, 'package.json'),
      '{"name":"features-cli-clean-consumer","private":true}\n',
      'utf8',
    );

    const installed = await runPnpm(consumerDir, [
      'install',
      '--ignore-scripts',
      tarballs[0],
    ]);
    expect(installed).toMatchObject({ exitCode: 0, stderr: '' });

    const help = await runPnpm(consumerDir, ['exec', 'features-cli', '--help']);
    expect(help).toMatchObject({
      exitCode: 0,
      stderr: '',
      stdout: expect.stringContaining('features-cli commands:'),
    });
    const init = await runPnpm(consumerDir, ['exec', 'features-cli', 'init']);
    expect(init).toMatchObject({ exitCode: 0, stderr: '' });
    await expect(
      readFile(join(consumerDir, '.scratch', 'features-status.json'), 'utf8'),
    ).resolves.toContain('"version": "2"');
  });
});
