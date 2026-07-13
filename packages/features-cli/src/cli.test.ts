import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FEATURES_CLI_HELP, runIssuesManagerCli } from './cli';
import {
  type FeatureRecord,
  getFeatureDir,
  getFeaturesStatusPath,
} from './features-state';

const feature: FeatureRecord = {
  id: 1,
  slug: 'sample-feature',
  status: 'paused',
  phase: 'design',
  focusPath: null,
};

describe('features CLI progress commands', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'features-cli-'));
  });

  afterEach(async () => {
    jest.useRealTimers();
    await rm(cwd, { recursive: true, force: true });
  });

  async function seed(current: FeatureRecord = feature) {
    await mkdir(getFeatureDir(cwd, current.id, current.slug), {
      recursive: true,
    });
    await writeFile(
      getFeaturesStatusPath(cwd),
      `${JSON.stringify({ features: [current], nextFeatureId: 2, version: '2' }, null, 2)}\n`,
      'utf8',
    );
  }

  async function seedImplementationIssues(
    issues: Array<{
      id: number;
      status: string;
      complexity?: number;
      blockedBy?: number[];
      contract?: boolean;
    }>,
  ): Promise<FeatureRecord> {
    const current: FeatureRecord = {
      ...feature,
      status: 'in-progress',
      phase: 'implementation',
    };
    await seed(current);
    const featureDir = getFeatureDir(cwd, current.id, current.slug);

    for (const issue of issues) {
      const issueDir = join(
        featureDir,
        'issues',
        `${String(issue.id).padStart(2, '0')}-issue-${issue.id}`,
      );
      await mkdir(issueDir, { recursive: true });
      await writeFile(
        join(issueDir, 'issue.md'),
        [
          `Status: ${issue.status}`,
          'Method: tdd-solo',
          `Complexity: ${issue.complexity ?? 2}`,
          `BlockedBy: ${issue.blockedBy?.join(', ') || 'none'}`,
          'Milestone: work',
          `# Issue ${issue.id}`,
          '',
        ].join('\n'),
        'utf8',
      );
      if (issue.contract) {
        await writeFile(
          join(issueDir, 'change-contract.md'),
          '# Contract\n',
          'utf8',
        );
      }
    }

    const sync = await runIssuesManagerCli(
      ['sync-issues', '--feature', current.slug],
      { cwd },
    );
    expect(sync.exitCode).toBe(0);
    return current;
  }

  it('returns help without reading repository state', async () => {
    await expect(runIssuesManagerCli(['--help'], { cwd })).resolves.toEqual({
      exitCode: 0,
      stdout: FEATURES_CLI_HELP,
      stderr: '',
    });
  });

  it.each([feature.slug, '1', '001', '001-sample-feature'])(
    'emits exact JSON progress for an explicitly selected paused feature via %s',
    async (selector) => {
      await seed();
      const dir = getFeatureDir(cwd, feature.id, feature.slug);
      await Promise.all(
        ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((name) =>
          writeFile(join(dir, name), '# Artifact\n', 'utf8'),
        ),
      );

      const result = await runIssuesManagerCli(
        ['progress', '--json', '--feature', selector],
        { cwd },
      );
      expect(result).toMatchObject({ exitCode: 0, stderr: '' });
      expect(JSON.parse(result.stdout)).toMatchObject({
        feature: { slug: feature.slug, status: 'paused' },
        frontier: { kind: 'design-ready' },
      });
    },
  );

  it('synchronizes canonical issues for an explicit paused feature', async () => {
    await seed();
    const issueDir = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues',
      '01-one',
    );
    await mkdir(issueDir, { recursive: true });
    await writeFile(
      join(issueDir, 'issue.md'),
      'Status: ready-for-agent\nMethod: tdd\nComplexity: 1\nBlockedBy: none\n# One\n',
      'utf8',
    );

    const result = await runIssuesManagerCli(
      ['sync-issues', '--feature', '001-sample-feature'],
      { cwd },
    );
    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(
      JSON.parse(
        await readFile(
          join(
            getFeatureDir(cwd, feature.id, feature.slug),
            'issues-status.json',
          ),
          'utf8',
        ),
      ),
    ).toMatchObject({ featureStatus: 'paused', issues: [{ id: 1 }] });
  });

  it('marks a milestone through the CLI and keeps status free of legacy decomposed-issue wording', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-10T12:00:00.000Z'));
    const current = {
      ...feature,
      status: 'in-progress' as const,
      phase: 'implementation' as const,
    };
    await seed(current);
    const dir = getFeatureDir(cwd, current.id, current.slug);
    await Promise.all(
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((name) =>
        writeFile(join(dir, name), '# Artifact\n', 'utf8'),
      ),
    );
    await writeFile(
      join(dir, 'SPEC.md'),
      '<!-- milestone-plan:start -->\n### 1. Work — `work`\n- **DependsOn:** none\n- **Decomposed:** pending\n<!-- milestone-plan:end -->\n',
      'utf8',
    );
    const issueDir = join(dir, 'issues', '01-one');
    await mkdir(issueDir, { recursive: true });
    await writeFile(
      join(issueDir, 'issue.md'),
      'Status: done\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: work\n# One\n',
      'utf8',
    );

    expect(
      (
        await runIssuesManagerCli(
          ['mark-milestone-decomposed', 'work', '--feature', current.slug],
          { cwd },
        )
      ).exitCode,
    ).toBe(0);
    expect(await readFile(join(dir, 'SPEC.md'), 'utf8')).toContain(
      '2026-07-10T12:00:00.000Z',
    );
    const status = await runIssuesManagerCli(['status'], { cwd });
    expect(status.stdout).not.toContain('decomposed issues:');
    expect(status.stdout).toContain('Milestones: 1/1 decomposed');
  });

  it('reports an uncontracted next issue with contract as its next action', async () => {
    const current = await seedImplementationIssues([
      { id: 1, status: 'ready-for-agent' },
    ]);

    const result = await runIssuesManagerCli(
      ['get-issue', '--next', '--feature', current.slug],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('contracted: false');
    expect(result.stdout).toContain('nextAction: contract');
  });

  it('reports a contracted next issue with implement as its next action', async () => {
    const current = await seedImplementationIssues([
      { id: 1, status: 'ready-for-agent', contract: true },
    ]);

    const result = await runIssuesManagerCli(
      ['get-issue', '--next', '--feature', current.slug],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('contracted: true');
    expect(result.stdout).toContain('nextAction: implement');
  });

  it('selects the highest-priority contract-ready issue while implementation is active', async () => {
    const current = await seedImplementationIssues([
      { id: 1, status: 'in-progress', contract: true },
      {
        id: 2,
        status: 'ready-for-agent',
        complexity: 1,
        blockedBy: [1],
        contract: true,
      },
      { id: 3, status: 'ready-for-agent', complexity: 1, blockedBy: [2] },
      { id: 4, status: 'ready-for-agent', complexity: 2, blockedBy: [1] },
    ]);

    const result = await runIssuesManagerCli(
      ['get-issue', '--next-contract', '--feature', current.slug],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('Next contract issue');
    expect(result.stdout).toContain('id: 3');
    expect(result.stdout).toContain('contracted: false');
    expect(result.stdout).toContain('nextAction: contract');
  });

  it('returns a specific error when no contract-ready issue exists', async () => {
    const current = await seedImplementationIssues([
      { id: 1, status: 'in-progress' },
      { id: 2, status: 'ready-for-agent', blockedBy: [1] },
    ]);

    const result = await runIssuesManagerCli(
      ['get-issue', '--next-contract', '--feature', current.slug],
      { cwd },
    );

    expect(result).toEqual({
      exitCode: 1,
      stdout: '',
      stderr:
        'No contract-ready issues found. Uncontracted issues are blocked, not ready-for-agent, or already contracted.',
    });
  });
});
