import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type FeatureRecord, getFeatureDir } from './features-state';
import { getFeatureProgress } from './progress-state';

const START = '<!-- milestone-plan:start -->';
const END = '<!-- milestone-plan:end -->';

function feature(overrides: Partial<FeatureRecord> = {}): FeatureRecord {
  return {
    id: 3,
    slug: 'sample-feature',
    status: 'in-progress',
    phase: 'implementation',
    focusPath: null,
    ...overrides,
  };
}

async function writeIssue(
  cwd: string,
  current: FeatureRecord,
  options: {
    id: number;
    status: string;
    complexity: number;
    blockedBy?: number[];
    milestone: string;
    contract?: boolean;
  },
) {
  const dir = join(
    getFeatureDir(cwd, current.id, current.slug),
    'issues',
    `${String(options.id).padStart(2, '0')}-issue-${options.id}`,
  );
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, 'issue.md'),
    [
      `Status: ${options.status}`,
      'Method: tdd',
      `Complexity: ${options.complexity}`,
      `BlockedBy: ${options.blockedBy?.join(', ') || 'none'}`,
      `Milestone: ${options.milestone}`,
      `# Issue ${options.id}`,
      '',
    ].join('\n'),
    'utf8',
  );
  if (options.contract) {
    await writeFile(join(dir, 'change-contract.md'), '# Contract\n', 'utf8');
  }
}

describe('getFeatureProgress', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'feature-progress-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('derives the Remote Logging topology and selects issue 6 for contracting', async () => {
    const current = feature();
    const dir = getFeatureDir(cwd, current.id, current.slug);
    await mkdir(dir, { recursive: true });
    await Promise.all(
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((name) =>
        writeFile(join(dir, name), `# ${name}\n`, 'utf8'),
      ),
    );
    await writeFile(
      join(dir, 'SPEC.md'),
      [
        '# Spec',
        START,
        '### 1. Capture — `capture-and-store`',
        '- **DependsOn:** none',
        '- **Decomposed:** 2026-07-10T12:00:00.000Z',
        '### 2. Send — `explicit-send`',
        '- **DependsOn:** `capture-and-store`',
        '- **Decomposed:** pending',
        '### 3. Manage — `manage-and-gate`',
        '- **DependsOn:** `explicit-send`',
        '- **Decomposed:** pending',
        END,
        '',
      ].join('\n'),
      'utf8',
    );

    await writeIssue(cwd, current, {
      id: 1,
      status: 'done',
      complexity: 1,
      milestone: 'capture-and-store',
      contract: true,
    });
    await writeIssue(cwd, current, {
      id: 2,
      status: 'ready-for-agent',
      complexity: 3,
      milestone: 'capture-and-store',
    });
    await writeIssue(cwd, current, {
      id: 3,
      status: 'ready-for-agent',
      complexity: 4,
      milestone: 'capture-and-store',
    });
    await writeIssue(cwd, current, {
      id: 4,
      status: 'ready-for-agent',
      complexity: 5,
      milestone: 'capture-and-store',
    });
    await writeIssue(cwd, current, {
      id: 5,
      status: 'ready-for-agent',
      complexity: 1,
      blockedBy: [2],
      milestone: 'capture-and-store',
    });
    await writeIssue(cwd, current, {
      id: 6,
      status: 'ready-for-agent',
      complexity: 2,
      blockedBy: [1],
      milestone: 'capture-and-store',
    });
    for (let id = 7; id <= 12; id += 1) {
      await writeIssue(cwd, current, {
        id,
        status: 'ready-for-agent',
        complexity: 1,
        blockedBy: [6],
        milestone: id < 10 ? 'explicit-send' : 'manage-and-gate',
      });
    }

    const progress = await getFeatureProgress({ cwd, feature: current });

    expect(progress.frontier).toMatchObject({
      kind: 'contract-issue',
      issueId: 6,
    });
    expect(progress.milestones).toMatchObject({
      planned: 3,
      decomposed: 1,
      pending: 2,
    });
    expect(progress.issues).toMatchObject({
      total: 12,
      done: 1,
      pending: 11,
      actionable: 4,
      blocked: 7,
      contracted: 1,
      nextIssueId: 6,
      resumableIssueId: null,
    });
  });

  it.each([
    [{ phase: 'design' as const }, [], 'write-prd'],
    [
      { phase: 'design' as const },
      ['PRD.md'],
      'grill-and-consolidate-decisions',
    ],
    [
      { phase: 'design' as const },
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'],
      'design-ready',
    ],
    [
      { phase: 'implementation' as const },
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'],
      'write-spec',
    ],
  ])('derives the early frontier %#', async (overrides, files, expected) => {
    const current = feature(overrides);
    const dir = getFeatureDir(cwd, current.id, current.slug);
    await mkdir(dir, { recursive: true });
    await Promise.all(
      files.map((name) => writeFile(join(dir, name), '# Artifact\n', 'utf8')),
    );

    expect(
      (await getFeatureProgress({ cwd, feature: current })).frontier.kind,
    ).toBe(expected);
  });

  it('short-circuits migration-required and archived features without parsing legacy artifacts', async () => {
    const migrating = feature();
    const migratingDir = getFeatureDir(cwd, migrating.id, migrating.slug);
    await mkdir(migratingDir, { recursive: true });
    await writeFile(
      join(migratingDir, 'WORKFLOW_MIGRATION_NOTE.md'),
      '# Migrate\n',
      'utf8',
    );
    await writeFile(
      join(migratingDir, 'SPEC.md'),
      'legacy malformed spec',
      'utf8',
    );
    expect(
      (await getFeatureProgress({ cwd, feature: migrating })).frontier.kind,
    ).toBe('migration-required');

    const archived = feature({
      id: 4,
      slug: 'archived-feature',
      status: 'archived',
    });
    await mkdir(getFeatureDir(cwd, archived.id, archived.slug), {
      recursive: true,
    });
    expect(
      (await getFeatureProgress({ cwd, feature: archived })).frontier.kind,
    ).toBe('archived');
  });

  it('prioritizes review over an in-progress issue and never rewrites derived issue state', async () => {
    const current = feature();
    const dir = getFeatureDir(cwd, current.id, current.slug);
    await mkdir(join(dir, 'issues', '01-one'), { recursive: true });
    await mkdir(join(dir, 'issues', '02-two'), { recursive: true });
    await Promise.all(
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((name) =>
        writeFile(join(dir, name), '# Artifact\n', 'utf8'),
      ),
    );
    await writeFile(
      join(dir, 'SPEC.md'),
      `${START}\n### 1. Work — \`work\`\n- **DependsOn:** none\n- **Decomposed:** pending\n${END}\n`,
      'utf8',
    );
    await writeFile(
      join(dir, 'issues', '01-one', 'issue.md'),
      'Status: in-progress\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: work\n# One\n',
      'utf8',
    );
    await writeFile(
      join(dir, 'issues', '02-two', 'issue.md'),
      'Status: in-review\nMethod: tdd\nComplexity: 1\nBlockedBy: none\nMilestone: work\n# Two\n',
      'utf8',
    );

    const progress = await getFeatureProgress({ cwd, feature: current });
    expect(progress.frontier).toMatchObject({
      kind: 'review-issue',
      issueId: 2,
    });
    await expect(
      readFile(join(dir, 'issues-status.json'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
