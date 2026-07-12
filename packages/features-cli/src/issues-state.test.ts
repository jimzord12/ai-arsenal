import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type FeatureRecord, getFeaturesStatusPath } from './features-state';
import {
  deriveIssuesStateFromIssueFiles,
  IssueStateError,
  readIssuesState,
  regenerateIssuesStateFromIssueFiles,
  type IssueRecord,
  type IssuesState,
  selectNextContractIssue,
  selectNextIssue,
  selectResumableIssue,
  updateIssueStatus,
  validateIssuesState,
  validateStatusTransition,
} from './issues-state';

const fsPromises =
  jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');

// Pure state-machine regression coverage for the V3 review-gate + reopen changes.
// The fs-backed reopenIssue flow is exercised end-to-end via the CLI fixture, not here.

function makeIssue(overrides: Partial<IssueRecord>): IssueRecord {
  return {
    id: 1,
    title: 'Sample',
    status: 'ready-for-agent',
    method: 'tdd',
    complexity: 2,
    blockedBy: [],
    filePath: 'issues/01-sample.md',
    ...overrides,
  };
}

function makeState(issues: IssueRecord[]): IssuesState {
  return { featureId: 1, featureSlug: 'sample', issues };
}

describe('validateStatusTransition (V3 review gate)', () => {
  it('forbids skipping review: in-progress → done', () => {
    expect(() => validateStatusTransition('in-progress', 'done')).toThrow(
      IssueStateError,
    );
  });

  it('allows in-progress → in-review', () => {
    expect(() =>
      validateStatusTransition('in-progress', 'in-review'),
    ).not.toThrow();
  });

  it('allows the review verdicts: in-review → done and in-review → ready-for-agent', () => {
    expect(() => validateStatusTransition('in-review', 'done')).not.toThrow();
    expect(() =>
      validateStatusTransition('in-review', 'ready-for-agent'),
    ).not.toThrow();
  });

  it('keeps done terminal', () => {
    expect(() => validateStatusTransition('done', 'ready-for-agent')).toThrow(
      IssueStateError,
    );
  });

  it('still honors --force as the human override', () => {
    expect(() =>
      validateStatusTransition('in-progress', 'done', { force: true }),
    ).not.toThrow();
  });
});

describe('issue validation (new optional fields)', () => {
  it('accepts a legacy record with no phase/reopens/reviewed', () => {
    const state = validateIssuesState(makeState([makeIssue({})]), 'test');
    expect(state.issues[0].phase).toBeUndefined();
    expect(state.issues[0].reopens).toBeUndefined();
  });

  it('accepts phase, reopens, reviewed when present', () => {
    const state = validateIssuesState(
      makeState([
        makeIssue({ phase: 'green', reopens: 2, reviewed: '2026-06-30' }),
      ]),
      'test',
    );
    expect(state.issues[0].phase).toBe('green');
    expect(state.issues[0].reopens).toBe(2);
    expect(state.issues[0].reviewed).toBe('2026-06-30');
  });

  it('rejects an unknown phase', () => {
    expect(() =>
      validateIssuesState(
        makeState([makeIssue({ phase: 'purple' as never })]),
        'test',
      ),
    ).toThrow(IssueStateError);
  });

  it('rejects a negative reopens count', () => {
    expect(() =>
      validateIssuesState(makeState([makeIssue({ reopens: -1 })]), 'test'),
    ).toThrow(IssueStateError);
  });
});

describe('selectNextIssue (reopened-first tie-break)', () => {
  it('picks a reopened issue ahead of a lower-complexity fresh one', () => {
    const state = makeState([
      makeIssue({ id: 1, complexity: 2, reopens: 0 }),
      makeIssue({ id: 2, complexity: 3, reopens: 1 }),
    ]);
    const result = selectNextIssue(state);
    expect(result.kind).toBe('winner');
    expect(result.kind === 'winner' && result.issue.id).toBe(2);
  });
});

describe('selectNextContractIssue', () => {
  it('allows a candidate whose blocker is already contracted', () => {
    const state = makeState([
      makeIssue({ id: 1, status: 'in-progress' }),
      makeIssue({ id: 2, blockedBy: [1] }),
    ]);

    const result = selectNextContractIssue(state, new Set([1]));

    expect(result.kind === 'winner' && result.issue.id).toBe(2);
  });

  it('skips a candidate with an uncontracted non-terminal blocker', () => {
    const state = makeState([
      makeIssue({ id: 1, status: 'in-progress' }),
      makeIssue({ id: 2, complexity: 1, blockedBy: [1] }),
      makeIssue({ id: 3, complexity: 2 }),
    ]);

    const result = selectNextContractIssue(state, new Set());

    expect(result.kind === 'winner' && result.issue.id).toBe(3);
  });

  it('accepts terminal blockers and excludes candidates already contracted', () => {
    const state = makeState([
      makeIssue({ id: 1, status: 'done' }),
      makeIssue({ id: 2, blockedBy: [1] }),
      makeIssue({ id: 3, complexity: 1 }),
    ]);

    const result = selectNextContractIssue(state, new Set([3]));

    expect(result.kind === 'winner' && result.issue.id).toBe(2);
  });

  it('uses reopened, complexity, and id priority for eligible candidates', () => {
    const state = makeState([
      makeIssue({ id: 1, complexity: 1 }),
      makeIssue({ id: 2, complexity: 4, reopens: 1 }),
      makeIssue({ id: 3, complexity: 1 }),
    ]);

    const reopenedResult = selectNextContractIssue(state, new Set());
    const complexityAndIdResult = selectNextContractIssue(
      makeState([state.issues[2], state.issues[0]]),
      new Set(),
    );

    expect(reopenedResult.kind === 'winner' && reopenedResult.issue.id).toBe(2);
    expect(
      complexityAndIdResult.kind === 'winner' && complexityAndIdResult.issue.id,
    ).toBe(1);
  });

  it('returns no winner when remaining issues are not ready or already contracted', () => {
    const state = makeState([
      makeIssue({ id: 1, status: 'in-progress' }),
      makeIssue({ id: 2 }),
    ]);

    expect(selectNextContractIssue(state, new Set([2]))).toEqual({
      kind: 'no-winner',
      reason: 'no-actionable',
    });
  });
});

describe('selectResumableIssue (crash recovery)', () => {
  it('returns a mid-flight in-review issue', () => {
    const state = makeState([
      makeIssue({ id: 1, status: 'done' }),
      makeIssue({ id: 2, status: 'in-review', phase: 'review' }),
    ]);
    const result = selectResumableIssue(state);
    expect(result.kind === 'winner' && result.issue.id).toBe(2);
  });

  it('returns no winner when nothing is mid-flight', () => {
    const state = makeState([makeIssue({ id: 1, status: 'done' })]);
    expect(selectResumableIssue(state).kind).toBe('no-winner');
  });
});

describe('canonical issue source discovery', () => {
  let cwd: string;
  const feature: FeatureRecord = {
    id: 1,
    slug: 'sample',
    status: 'todo',
    phase: 'design',
    focusPath: null,
  };

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'issues-state-sources-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  function issueMarkdown(title = 'Sample issue') {
    return [
      'Status: ready-for-agent',
      'Method: tdd',
      'Complexity: 1',
      'BlockedBy: none',
      `# ${title}`,
      '',
    ].join('\n');
  }

  async function writeRegistry(registeredFeature: FeatureRecord = feature) {
    await mkdir(join(cwd, '.scratch', 'features', '001-sample'), {
      recursive: true,
    });
    await writeFile(
      getFeaturesStatusPath(cwd),
      `${JSON.stringify({ features: [registeredFeature], nextFeatureId: 2, version: '2' }, null, 2)}\n`,
      'utf8',
    );
  }

  async function writeFlatIssue(fileName = '01-sample.md') {
    const issuesDir = join(cwd, '.scratch', 'features', '001-sample', 'issues');
    await mkdir(issuesDir, { recursive: true });
    const issuePath = join(issuesDir, fileName);
    await writeFile(issuePath, issueMarkdown(), 'utf8');
    return issuePath;
  }

  it('fails when a numbered canonical issue directory has no readable issue.md', async () => {
    const issueDir = join(
      cwd,
      '.scratch',
      'features',
      '001-sample',
      'issues',
      '01-missing-canonical-file',
    );
    await mkdir(issueDir, { recursive: true });

    await expect(
      deriveIssuesStateFromIssueFiles({ cwd, feature }),
    ).rejects.toThrow('readable issue.md');
  });

  it('continues to parse legacy flat issue files', async () => {
    const issuesDir = join(cwd, '.scratch', 'features', '001-sample', 'issues');
    await mkdir(issuesDir, { recursive: true });
    await writeFile(
      join(issuesDir, '01-legacy-flat.md'),
      [
        'Status: ready-for-agent',
        'Method: tdd',
        'Complexity: 1',
        'BlockedBy: none',
        '# Legacy flat issue',
        '',
      ].join('\n'),
      'utf8',
    );

    const state = await deriveIssuesStateFromIssueFiles({ cwd, feature });

    expect(state.issues).toHaveLength(1);
    expect(state.issues[0]).toMatchObject({
      id: 1,
      title: 'Legacy flat issue',
    });
  });

  it('rejects two canonical issue directories with the same numeric id', async () => {
    const issuesDir = join(cwd, '.scratch', 'features', '001-sample', 'issues');
    const first = join(issuesDir, '01-first');
    const second = join(issuesDir, '01-second');
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    await writeFile(join(first, 'issue.md'), issueMarkdown('First'), 'utf8');
    await writeFile(join(second, 'issue.md'), issueMarkdown('Second'), 'utf8');

    await expect(
      deriveIssuesStateFromIssueFiles({ cwd, feature }),
    ).rejects.toThrow('Duplicate canonical issue id 1');
  });

  it('rejects a flat issue and canonical directory with the same numeric id', async () => {
    const issuesDir = join(cwd, '.scratch', 'features', '001-sample', 'issues');
    const directoryIssue = join(issuesDir, '01-directory');
    await mkdir(directoryIssue, { recursive: true });
    await writeFile(
      join(directoryIssue, 'issue.md'),
      issueMarkdown('Directory'),
      'utf8',
    );
    await writeFile(
      join(issuesDir, '01-flat.md'),
      issueMarkdown('Flat'),
      'utf8',
    );

    await expect(
      deriveIssuesStateFromIssueFiles({ cwd, feature }),
    ).rejects.toThrow('Duplicate canonical issue id 1');
  });

  it('rejects malformed derived issue JSON without repairing it', async () => {
    await writeRegistry();
    const derivedPath = join(
      cwd,
      '.scratch',
      'features',
      '001-sample',
      'issues-status.json',
    );
    const corrupted = '{"issues":\n';
    await writeFile(derivedPath, corrupted, 'utf8');

    await expect(readIssuesState(cwd, feature)).rejects.toThrow(
      'Malformed derived issue state',
    );
    await expect(readFile(derivedPath, 'utf8')).resolves.toBe(corrupted);
  });

  it('rejects derived-state regeneration while the repository lock is held', async () => {
    await writeRegistry();
    await writeFlatIssue();
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held by another updater\n', 'utf8');

    await expect(
      regenerateIssuesStateFromIssueFiles({ cwd, feature }),
    ).rejects.toThrow('already in progress');

    await expect(
      readFile(
        join(cwd, '.scratch', 'features', '001-sample', 'issues-status.json'),
        'utf8',
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects issue mutation while the repository lock is held', async () => {
    await writeRegistry();
    const issuePath = await writeFlatIssue();
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held by another updater\n', 'utf8');

    await expect(
      updateIssueStatus({ cwd, feature, issueId: 1, status: 'in-progress' }),
    ).rejects.toThrow('already in progress');

    await expect(readFile(issuePath, 'utf8')).resolves.toContain(
      'Status: ready-for-agent',
    );
  });

  it('characterizes direct issue mutation failure as a partial write with lock cleanup', async () => {
    await writeRegistry();
    const issuePath = await writeFlatIssue();
    const derivedPath = join(
      cwd,
      '.scratch',
      'features',
      '001-sample',
      'issues-status.json',
    );
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    const registryBefore = await readFile(getFeaturesStatusPath(cwd), 'utf8');
    const originalWriteFile = fsPromises.writeFile;
    const writeSpy = jest
      .spyOn(fsPromises, 'writeFile')
      .mockImplementation(async (file, data, options) => {
        if (String(file) === derivedPath) {
          throw Object.assign(
            new Error('injected derived issue-state write failure'),
            { code: 'EACCES' },
          );
        }

        return originalWriteFile(file, data, options);
      });

    try {
      await expect(
        updateIssueStatus({ cwd, feature, issueId: 1, status: 'in-progress' }),
      ).rejects.toThrow('injected derived issue-state write failure');
    } finally {
      writeSpy.mockRestore();
    }

    await expect(readFile(issuePath, 'utf8')).resolves.toContain(
      'Status: in-progress',
    );
    await expect(readFile(derivedPath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      registryBefore,
    );
    await expect(readFile(lockPath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('refreshes a stale caller-supplied feature status from the registry while locked', async () => {
    const registeredFeature: FeatureRecord = { ...feature, status: 'paused' };
    const staleFeature: FeatureRecord = { ...feature, status: 'todo' };
    await writeRegistry(registeredFeature);
    await writeFlatIssue();

    const state = await regenerateIssuesStateFromIssueFiles({
      cwd,
      feature: staleFeature,
    });

    expect(state.featureStatus).toBe('paused');
    const persisted = JSON.parse(
      await readFile(
        join(cwd, '.scratch', 'features', '001-sample', 'issues-status.json'),
        'utf8',
      ),
    );
    expect(persisted.featureStatus).toBe('paused');
  });
});
