import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runIssuesManagerCli } from '../src/cli';

const fixturesDir = join(__dirname, 'fixtures');

describe('CLI migration characterization', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'features-cli-characterization-'));
  });

  afterEach(async () => {
    jest.useRealTimers();
    await rm(cwd, { force: true, recursive: true });
  });

  async function run(args: string[], directory = cwd) {
    return runIssuesManagerCli(args, { cwd: directory });
  }

  async function seedFeatureFixture(
    status: 'paused' | 'in-progress' = 'paused',
    phase: 'design' | 'implementation' = 'design',
  ) {
    const state = JSON.parse(
      await readFile(join(fixturesDir, 'features-status.json'), 'utf8'),
    ) as {
      features: Array<{ status: string; phase: string }>;
    };
    state.features[0].status = status;
    state.features[0].phase = phase;
    await mkdir(join(cwd, '.scratch', 'features', '001-sample-feature'), {
      recursive: true,
    });
    await writeFile(
      join(cwd, '.scratch', 'features-status.json'),
      `${JSON.stringify(state, null, 2)}\n`,
      'utf8',
    );
  }

  async function seedIssue(content?: string) {
    const issuePath = join(
      cwd,
      '.scratch',
      'features',
      '001-sample-feature',
      'issues',
      '01-characterized',
      'issue.md',
    );
    await mkdir(dirname(issuePath), { recursive: true });
    await writeFile(
      issuePath,
      content ?? (await readFile(join(fixturesDir, 'issue.md'), 'utf8')),
      'utf8',
    );
    return issuePath;
  }

  it('preserves the exact help command contract without repository state', async () => {
    const expectedHelp = (
      await readFile(join(fixturesDir, 'help.txt'), 'utf8')
    ).trimEnd();
    await expect(run(['--help'])).resolves.toEqual({
      exitCode: 0,
      stderr: '',
      stdout: expectedHelp,
    });
  });

  it('preserves schema v2 through the feature lifecycle', async () => {
    expect(await run(['init'])).toMatchObject({ exitCode: 0, stderr: '' });
    expect(await run(['create-feature', 'sample-feature'])).toMatchObject({
      exitCode: 0,
      stderr: '',
    });
    expect(
      await run([
        'update-feature',
        'sample-feature',
        '--status',
        'in-progress',
        '--phase',
        'design',
      ]),
    ).toMatchObject({ exitCode: 0, stderr: '' });
    expect(await run(['get-feature'])).toMatchObject({
      exitCode: 0,
      stderr: '',
      stdout: expect.stringContaining('slug: sample-feature'),
    });

    const state = JSON.parse(
      await readFile(join(cwd, '.scratch', 'features-status.json'), 'utf8'),
    ) as {
      version: string;
      features: Array<{ status: string; phase: string }>;
    };
    expect(state).toMatchObject({
      version: '2',
      features: [{ status: 'in-progress', phase: 'design' }],
    });
  });

  it('preserves status output and machine-readable progress routing', async () => {
    await seedFeatureFixture();
    const featureDir = join(cwd, '.scratch', 'features', '001-sample-feature');
    await Promise.all(
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((file) =>
        writeFile(join(featureDir, file), '# Ready\n', 'utf8'),
      ),
    );

    const status = await run(['status']);
    const progress = await run([
      'progress',
      '--feature',
      'sample-feature',
      '--json',
    ]);

    expect(status).toMatchObject({
      exitCode: 0,
      stderr: '',
      stdout: expect.stringContaining('001-sample-feature'),
    });
    expect(JSON.parse(progress.stdout)).toMatchObject({
      feature: { slug: 'sample-feature', status: 'paused' },
      frontier: { kind: 'design-ready' },
    });
  });

  it('preserves canonical issue lifecycle and derived JSON coupling', async () => {
    await seedFeatureFixture('in-progress', 'implementation');
    const issuePath = await seedIssue();

    expect(
      await run(['sync-issues', '--feature', 'sample-feature']),
    ).toMatchObject({ exitCode: 0, stderr: '' });
    expect(
      await run([
        'update-status',
        '1',
        '--status',
        'in-progress',
        '--feature',
        'sample-feature',
      ]),
    ).toMatchObject({ exitCode: 0, stderr: '' });
    expect(await readFile(issuePath, 'utf8')).toContain('Status: in-progress');

    const derived = JSON.parse(
      await readFile(
        join(
          cwd,
          '.scratch',
          'features',
          '001-sample-feature',
          'issues-status.json',
        ),
        'utf8',
      ),
    ) as { issues: Array<{ id: number; status: string }> };
    expect(derived.issues).toEqual([
      expect.objectContaining({ id: 1, status: 'in-progress' }),
    ]);
  });

  it('rejects invalid input with exit 1 and no filesystem mutation', async () => {
    const result = await run(['definitely-invalid']);

    expect(result).toEqual({
      exitCode: 1,
      stderr: 'Unknown command. Run --help for supported commands.',
      stdout: '',
    });
    await expect(
      readFile(join(cwd, '.scratch', 'features-status.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails closed while recovery is required', async () => {
    await seedFeatureFixture();
    const recoveryPath = join(
      cwd,
      '.scratch',
      'features-status.recovery-required.json',
    );
    await writeFile(recoveryPath, '{}\n', 'utf8');

    const result = await run(['status']);

    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('features-status.recovery-required.json'),
    });
    await expect(readFile(recoveryPath, 'utf8')).resolves.toBe('{}\n');
  });

  it('roots state strictly at the invocation cwd', async () => {
    const nested = join(cwd, 'nested');
    await mkdir(nested);

    expect(await run(['init'], nested)).toMatchObject({
      exitCode: 0,
      stderr: '',
    });
    await expect(
      readFile(join(nested, '.scratch', 'features-status.json'), 'utf8'),
    ).resolves.toContain('"version": "2"');
    await expect(
      readFile(join(cwd, '.scratch', 'features-status.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves BOM, CRLF, and user-authored bytes during milestone mutation', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-10T12:00:00.000Z'));
    await seedFeatureFixture('in-progress', 'implementation');
    const featureDir = join(cwd, '.scratch', 'features', '001-sample-feature');
    const specPath = join(featureDir, 'SPEC.md');
    const before =
      '\ufeff# Spec with  two spaces  \r\n<!-- milestone-plan:start -->\r\n### 1. Slice — `slice`\r\n- **DependsOn:** none\r\n- **Decomposed:** pending\r\n<!-- milestone-plan:end -->\r\nTail\tcontent\r\n';
    await writeFile(specPath, before, 'utf8');
    await seedIssue(
      'Status: done\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: slice\n# Characterized issue\n',
    );

    expect(
      await run([
        'mark-milestone-decomposed',
        'slice',
        '--feature',
        'sample-feature',
      ]),
    ).toMatchObject({ exitCode: 0, stderr: '' });
    expect(await readFile(specPath, 'utf8')).toBe(
      before.replace(
        '- **Decomposed:** pending',
        '- **Decomposed:** 2026-07-10T12:00:00.000Z',
      ),
    );
  });

  it('fails milestone mutation through the command boundary while the shared lock is held', async () => {
    await seedFeatureFixture('in-progress', 'implementation');
    const featureDir = join(cwd, '.scratch', 'features', '001-sample-feature');
    const specPath = join(featureDir, 'SPEC.md');
    const before =
      '# Spec\n<!-- milestone-plan:start -->\n### 1. Slice — `slice`\n- **DependsOn:** none\n- **Decomposed:** pending\n<!-- milestone-plan:end -->\n';
    await writeFile(specPath, before, 'utf8');
    await seedIssue(
      'Status: done\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: slice\n# Characterized issue\n',
    );
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held\n', 'utf8');

    const result = await run([
      'mark-milestone-decomposed',
      'slice',
      '--feature',
      'sample-feature',
    ]);

    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('lock'),
    });
    await expect(readFile(specPath, 'utf8')).resolves.toBe(before);
    await expect(readFile(lockPath, 'utf8')).resolves.toBe('held\n');
  });

  it('fails immediately without modifying state while the shared lock is held', async () => {
    await mkdir(join(cwd, '.scratch'), { recursive: true });
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held\n', 'utf8');

    const result = await run(['init']);

    expect(result).toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('lock'),
    });
    await expect(readFile(lockPath, 'utf8')).resolves.toBe('held\n');
    await expect(
      readFile(join(cwd, '.scratch', 'features-status.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
