import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runIssuesManagerCli } from './cli';
import {
  createFeature,
  type FeatureRecord,
  type FeaturesState,
  getFeatureDir,
  getFeaturesStatusPath,
  initFeaturesState,
  readFeaturesState,
  resolveCurrentFeature,
  updateFeature,
  validateFeaturesState,
} from './features-state';
import { resolveFeatureForIssueRead } from './issues-state';

const fsPromises =
  jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');

function makeFeature(overrides: Partial<FeatureRecord> = {}): FeatureRecord {
  return {
    id: 1,
    slug: 'sample-feature',
    status: 'todo',
    phase: 'design',
    focusPath: null,
    finalStatus: null,
    ...overrides,
  };
}

function makeState(features: FeatureRecord[]): FeaturesState {
  return {
    features,
    nextFeatureId: Math.max(0, ...features.map((feature) => feature.id)) + 1,
    version: '2',
  };
}

async function writeState(cwd: string, features: FeatureRecord[]) {
  await mkdir(join(cwd, '.scratch', 'features'), { recursive: true });
  await writeFile(
    getFeaturesStatusPath(cwd),
    `${JSON.stringify(makeState(features), null, 2)}\n`,
    'utf8',
  );

  await Promise.all(
    features.map((feature) =>
      mkdir(getFeatureDir(cwd, feature.id, feature.slug), { recursive: true }),
    ),
  );
}

async function writeIssue(
  cwd: string,
  feature: FeatureRecord,
  fileName = '01-sample.md',
) {
  const issuesDir = join(
    getFeatureDir(cwd, feature.id, feature.slug),
    'issues',
  );
  await mkdir(issuesDir, { recursive: true });
  await writeFile(
    join(issuesDir, fileName),
    [
      'Status: ready-for-agent',
      'Method: tdd',
      'Complexity: 1',
      'BlockedBy: none',
      '# Sample issue',
      '',
    ].join('\n'),
    'utf8',
  );
}

describe('feature state schema v2', () => {
  it('accepts paused lifecycle, implementation phase, and feature-relative focus', () => {
    const version2State = makeState([
      makeFeature({
        status: 'paused',
        phase: 'implementation',
        focusPath: 'WORKFLOW_MIGRATION_NOTE.md',
      }),
    ]);

    expect(validateFeaturesState(version2State).features[0]).toMatchObject({
      status: 'paused',
      phase: 'implementation',
      focusPath: 'WORKFLOW_MIGRATION_NOTE.md',
    });
  });

  it('rejects an unknown phase', () => {
    const stateWithUnknownPhase = makeState([
      makeFeature({ phase: 'testing' as never }),
    ]);

    expect(() => validateFeaturesState(stateWithUnknownPhase)).toThrow(
      'Phase must be one of',
    );
  });

  it('rejects a focus path that escapes the feature workspace syntactically', () => {
    const stateWithEscapingFocus = makeState([
      makeFeature({ focusPath: '../outside.md' }),
    ]);

    expect(() => validateFeaturesState(stateWithEscapingFocus)).toThrow(
      'feature-relative',
    );
  });

  it('keeps pure JSON validation limited to path syntax', () => {
    const state = makeState([
      makeFeature({ focusPath: 'not-created-yet/NOTES.md' }),
    ]);

    expect(validateFeaturesState(state).features[0].focusPath).toBe(
      'not-created-yet/NOTES.md',
    );
  });

  it('rejects multiple current features', () => {
    const state = makeState([
      makeFeature({ status: 'in-progress' }),
      makeFeature({ id: 2, slug: 'other-feature', status: 'in-progress' }),
    ]);

    expect(() => validateFeaturesState(state)).toThrow(
      'Only one feature may be in-progress',
    );
  });

  it('rejects an unsafe persisted slug before it can reach filesystem path joins', () => {
    const state = makeState([makeFeature({ slug: '../../outside' })]);

    expect(() => validateFeaturesState(state)).toThrow('kebab-case');
  });
});

describe('feature state filesystem operations', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'features-state-v2-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('initializes schema v2 and gives new features the lifecycle defaults', async () => {
    const initialized = await initFeaturesState({ cwd });
    const created = await createFeature({ cwd, slug: 'new-feature' });
    const stored = await readFeaturesState(cwd);

    expect(initialized.state.version).toBe('2');
    expect(created.feature).toMatchObject({
      status: 'todo',
      phase: 'design',
      focusPath: null,
    });
    expect(stored.features[0]).toMatchObject(created.feature);
  });

  it('rejects malformed persisted feature JSON without repairing it', async () => {
    const statePath = getFeaturesStatusPath(cwd);
    const corrupted = '{not-json\n';
    await mkdir(join(cwd, '.scratch'), { recursive: true });
    await writeFile(statePath, corrupted, 'utf8');

    await expect(readFeaturesState(cwd)).rejects.toThrow(
      'Malformed feature state',
    );
    await expect(readFile(statePath, 'utf8')).resolves.toBe(corrupted);
  });

  it('rejects an invalid new feature slug without mutating existing state', async () => {
    await initFeaturesState({ cwd });
    const before = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(createFeature({ cwd, slug: 'Bad Slug' })).rejects.toThrow(
      'Invalid slug',
    );

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      before,
    );
    expect((await readFeaturesState(cwd)).features).toHaveLength(0);
  });

  it('rejects initialization while the repository feature-state lock is held', async () => {
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await mkdir(join(cwd, '.scratch'), { recursive: true });
    await writeFile(lockPath, 'held by another updater\n', 'utf8');

    await expect(initFeaturesState({ cwd })).rejects.toThrow(
      'already in progress',
    );

    await expect(
      readFile(getFeaturesStatusPath(cwd), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects feature creation while the repository feature-state lock is held', async () => {
    await initFeaturesState({ cwd });
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held by another updater\n', 'utf8');

    await expect(
      createFeature({ cwd, slug: 'blocked-create' }),
    ).rejects.toThrow('already in progress');

    expect((await readFeaturesState(cwd)).features).toHaveLength(0);
  });

  it('treats stale-looking lock files as manual recovery instead of auto-removing them', async () => {
    await initFeaturesState({ cwd });
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    const staleLock = '{"pid":0,"startedAt":"2000-01-01T00:00:00.000Z"}\n';
    await writeFile(lockPath, staleLock, 'utf8');

    await expect(createFeature({ cwd, slug: 'still-blocked' })).rejects.toThrow(
      'already in progress',
    );

    await expect(readFile(lockPath, 'utf8')).resolves.toBe(staleLock);
    expect((await readFeaturesState(cwd)).features).toHaveLength(0);
  });

  it('allows an explicit read of a paused feature without selecting it as current', async () => {
    const paused = makeFeature({ status: 'paused' });
    const current = makeFeature({
      id: 2,
      slug: 'current-feature',
      status: 'in-progress',
    });
    await writeState(cwd, [paused, current]);

    const state = await readFeaturesState(cwd);

    expect(resolveFeatureForIssueRead(state, paused.slug)).toMatchObject({
      slug: paused.slug,
      status: 'paused',
    });
    expect(resolveCurrentFeature(state).slug).toBe(current.slug);
  });

  it('resolves an explicit feature by slug, plain or padded id, and full directory name', async () => {
    const selected = makeFeature({
      id: 3,
      slug: 'remote-logging-mvp-v2',
      status: 'paused',
    });
    const current = makeFeature({
      id: 4,
      slug: 'current-feature',
      status: 'in-progress',
    });
    await writeState(cwd, [selected, current]);

    const state = await readFeaturesState(cwd);

    for (const selector of [
      selected.slug,
      '3',
      '003',
      '003-remote-logging-mvp-v2',
    ]) {
      expect(resolveFeatureForIssueRead(state, selector)).toMatchObject({
        id: selected.id,
        slug: selected.slug,
      });
    }
  });

  it('preserves exact numeric slugs and rejects mismatched full directory names', async () => {
    const selected = makeFeature({
      id: 3,
      slug: 'remote-logging-mvp-v2',
      status: 'paused',
    });
    const numericSlug = makeFeature({
      id: 4,
      slug: '003',
      status: 'in-progress',
    });
    await writeState(cwd, [selected, numericSlug]);

    const state = await readFeaturesState(cwd);

    expect(resolveFeatureForIssueRead(state, '003')).toMatchObject({
      id: numericSlug.id,
      slug: numericSlug.slug,
    });
    expect(() =>
      resolveFeatureForIssueRead(state, '003-other-feature'),
    ).toThrow('does not match its registered slug');
  });

  it('supports partial phase and focus updates without changing lifecycle status', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    await writeFile(
      join(getFeatureDir(cwd, feature.id, feature.slug), 'SPEC.md'),
      '# Spec\n',
      'utf8',
    );

    const result = await runIssuesManagerCli(
      [
        'update-feature',
        feature.slug,
        '--phase',
        'implementation',
        '--focus',
        'SPEC.md',
      ],
      { cwd },
    );
    const stored = await readFeaturesState(cwd);

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(stored.features[0]).toMatchObject({
      status: 'todo',
      phase: 'implementation',
      focusPath: 'SPEC.md',
    });
  });

  it('validates an explicitly supplied focus even when it matches the stored path', async () => {
    const feature = makeFeature({ focusPath: 'MISSING.md' });
    await writeState(cwd, [feature]);

    await expect(
      updateFeature({
        cwd,
        slug: feature.slug,
        phase: 'implementation',
        focusPath: 'MISSING.md',
      }),
    ).rejects.toThrow('does not exist');

    expect((await readFeaturesState(cwd)).features[0].phase).toBe('design');
  });

  it('maps --focus none to a persisted null focus', async () => {
    const feature = makeFeature({ focusPath: 'SPEC.md' });
    await writeState(cwd, [feature]);
    await writeFile(
      join(getFeatureDir(cwd, feature.id, feature.slug), 'SPEC.md'),
      '# Spec\n',
      'utf8',
    );

    const result = await runIssuesManagerCli(
      ['update-feature', feature.slug, '--focus', 'none'],
      { cwd },
    );

    expect(result.exitCode).toBe(0);
    await expect(readFeaturesState(cwd)).resolves.toMatchObject({
      features: [{ focusPath: null }],
    });
  });

  it('rejects an update that would not change status, phase, or focus', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);

    const result = await runIssuesManagerCli(
      ['update-feature', feature.slug, '--phase', 'design'],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(result.stderr).toContain('No-op update');
  });

  it('activates a feature without --pause-current when no feature is current', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);

    const result = await runIssuesManagerCli(
      ['update-feature', feature.slug, '--status', 'in-progress'],
      { cwd },
    );

    expect(result.exitCode).toBe(0);
    expect(resolveCurrentFeature(await readFeaturesState(cwd)).slug).toBe(
      feature.slug,
    );
  });

  it('rejects status-only activation when the target retains a missing focus', async () => {
    const feature = makeFeature({ focusPath: 'MISSING.md' });
    await writeState(cwd, [feature]);
    const before = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(
      updateFeature({ cwd, slug: feature.slug, status: 'in-progress' }),
    ).rejects.toThrow('does not exist');

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      before,
    );
  });

  it('rejects --pause-current when a different current feature does not exist', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);

    const result = await runIssuesManagerCli(
      [
        'update-feature',
        feature.slug,
        '--status',
        'in-progress',
        '--pause-current',
      ],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(result.stderr).toContain(
      '--pause-current requires a different feature to be in-progress',
    );
    expect((await readFeaturesState(cwd)).features[0].status).toBe('todo');
  });

  it('refuses to replace the current feature without --pause-current', async () => {
    const current = makeFeature({ status: 'in-progress' });
    const target = makeFeature({
      id: 2,
      slug: 'target-feature',
      status: 'paused',
    });
    await writeState(cwd, [current, target]);

    const result = await runIssuesManagerCli(
      ['update-feature', target.slug, '--status', 'in-progress'],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(result.stderr).toContain('--pause-current');
    expect(resolveCurrentFeature(await readFeaturesState(cwd)).slug).toBe(
      current.slug,
    );
  });

  it('rejects an approved switch when the current feature retains a focus retargeted outside its workspace', async () => {
    const current = makeFeature({
      status: 'in-progress',
      focusPath: 'escape/SECRET.md',
    });
    const target = makeFeature({
      id: 2,
      slug: 'target-feature',
      status: 'paused',
    });
    await writeState(cwd, [current, target]);
    const outsideDir = join(cwd, 'outside-current');
    const linkPath = join(
      getFeatureDir(cwd, current.id, current.slug),
      'escape',
    );
    await mkdir(outsideDir);
    await writeFile(join(outsideDir, 'SECRET.md'), '# Outside\n', 'utf8');

    try {
      await symlink(outsideDir, linkPath, 'junction');
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOSYS') {
        return;
      }
      throw error;
    }

    const before = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(
      updateFeature({
        cwd,
        slug: target.slug,
        status: 'in-progress',
        pauseCurrent: true,
      }),
    ).rejects.toThrow('feature-relative');

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      before,
    );
  });

  it('atomically pauses the current feature, preserves its phase/focus, activates the target, and refreshes derived issue status', async () => {
    const current = makeFeature({
      status: 'in-progress',
      phase: 'implementation',
      focusPath: 'CURRENT_NOTES.md',
    });
    const target = makeFeature({
      id: 2,
      slug: 'target-feature',
      status: 'paused',
      phase: 'implementation',
    });
    await writeState(cwd, [current, target]);
    await writeFile(
      join(getFeatureDir(cwd, current.id, current.slug), 'CURRENT_NOTES.md'),
      '# Notes\n',
      'utf8',
    );
    await writeIssue(cwd, current);
    await writeIssue(cwd, target);

    const result = await runIssuesManagerCli(
      [
        'update-feature',
        target.slug,
        '--status',
        'in-progress',
        '--pause-current',
      ],
      { cwd },
    );
    const state = await readFeaturesState(cwd);
    const paused = state.features.find(
      (feature) => feature.slug === current.slug,
    );
    const activated = state.features.find(
      (feature) => feature.slug === target.slug,
    );
    const currentIssues = JSON.parse(
      await readFile(
        join(
          getFeatureDir(cwd, current.id, current.slug),
          'issues-status.json',
        ),
        'utf8',
      ),
    );
    const targetIssues = JSON.parse(
      await readFile(
        join(getFeatureDir(cwd, target.id, target.slug), 'issues-status.json'),
        'utf8',
      ),
    );

    expect(result.exitCode).toBe(0);
    expect(paused).toMatchObject({
      status: 'paused',
      phase: 'implementation',
      focusPath: 'CURRENT_NOTES.md',
    });
    expect(activated).toMatchObject({
      status: 'in-progress',
      phase: 'implementation',
      focusPath: null,
    });
    expect(currentIssues.featureStatus).toBe('paused');
    expect(targetIssues.featureStatus).toBe('in-progress');
  });

  it('prevalidates canonical issue state before changing the feature registry', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    const issuesDir = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues',
    );
    await mkdir(issuesDir, { recursive: true });
    await writeFile(
      join(issuesDir, '01-invalid.md'),
      '# Missing metadata\n',
      'utf8',
    );
    const before = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(
      updateFeature({ cwd, slug: feature.slug, phase: 'implementation' }),
    ).rejects.toThrow('Expected a Status header');

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      before,
    );
  });

  it('rejects an unsafe non-regular state target before any write', async () => {
    const current = makeFeature({ status: 'in-progress' });
    const target = makeFeature({
      id: 2,
      slug: 'target-feature',
      status: 'paused',
    });
    await writeState(cwd, [current, target]);
    await writeIssue(cwd, current);
    await writeIssue(cwd, target);

    const currentIssuesPath = join(
      getFeatureDir(cwd, current.id, current.slug),
      'issues-status.json',
    );
    const targetIssuesPath = join(
      getFeatureDir(cwd, target.id, target.slug),
      'issues-status.json',
    );
    const sentinel = '{"sentinel":"preserve-me"}\n';
    await writeFile(currentIssuesPath, sentinel, 'utf8');
    await mkdir(targetIssuesPath);
    const registryBefore = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(
      updateFeature({
        cwd,
        slug: target.slug,
        status: 'in-progress',
        pauseCurrent: true,
      }),
    ).rejects.toThrow('regular file');

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      registryBefore,
    );
    await expect(readFile(currentIssuesPath, 'utf8')).resolves.toBe(sentinel);
  });

  it('journals a final registry-write failure, restores derived state, and removes the journal after successful rollback', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    await writeIssue(cwd, feature);
    const registryPath = getFeaturesStatusPath(cwd);
    const issuesStatePath = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues-status.json',
    );
    const recoveryPath = join(
      cwd,
      '.scratch',
      'features-status.recovery-required.json',
    );
    const sentinel = '{"sentinel":"original-derived-state"}\n';
    await writeFile(issuesStatePath, sentinel, 'utf8');
    const registryBefore = await readFile(registryPath, 'utf8');
    const originalWriteFile = fsPromises.writeFile;
    let registryWriteAttempts = 0;
    let recoveryPathModuleWrites = 0;
    const writeSpy = jest
      .spyOn(fsPromises, 'writeFile')
      .mockImplementation(async (file, data, options) => {
        const filePath = String(file);

        if (filePath === recoveryPath) {
          recoveryPathModuleWrites += 1;
        }

        if (filePath === registryPath && registryWriteAttempts++ === 0) {
          throw Object.assign(
            new Error('injected final registry write failure'),
            { code: 'EACCES' },
          );
        }

        return originalWriteFile(file, data, options);
      });

    try {
      await expect(
        updateFeature({ cwd, slug: feature.slug, phase: 'implementation' }),
      ).rejects.toThrow('Feature state update failed');
    } finally {
      writeSpy.mockRestore();
    }

    expect(recoveryPathModuleWrites).toBe(0);
    await expect(readFile(registryPath, 'utf8')).resolves.toBe(registryBefore);
    await expect(readFile(issuesStatePath, 'utf8')).resolves.toBe(sentinel);
    await expect(readFile(recoveryPath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('retains the transaction journal and makes state reads fail closed when rollback cannot restore a derived file', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    await writeIssue(cwd, feature);
    const registryPath = getFeaturesStatusPath(cwd);
    const issuesStatePath = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues-status.json',
    );
    const recoveryPath = join(
      cwd,
      '.scratch',
      'features-status.recovery-required.json',
    );
    const sentinel = '{"sentinel":"before"}\n';
    await writeFile(issuesStatePath, sentinel, 'utf8');
    const registryBefore = await readFile(registryPath, 'utf8');
    const originalWriteFile = fsPromises.writeFile;
    let registryWriteAttempts = 0;
    let issueWriteAttempts = 0;
    let recoveryPathModuleWrites = 0;
    const writeSpy = jest
      .spyOn(fsPromises, 'writeFile')
      .mockImplementation(async (file, data, options) => {
        const filePath = String(file);

        if (filePath === recoveryPath) {
          recoveryPathModuleWrites += 1;
        }

        if (filePath === registryPath && registryWriteAttempts++ === 0) {
          throw Object.assign(
            new Error('injected final registry write failure'),
            { code: 'EACCES' },
          );
        }

        if (filePath === issuesStatePath && issueWriteAttempts++ === 1) {
          throw Object.assign(new Error('injected derived rollback failure'), {
            code: 'EACCES',
          });
        }

        return originalWriteFile(file, data, options);
      });

    try {
      await expect(
        updateFeature({ cwd, slug: feature.slug, phase: 'implementation' }),
      ).rejects.toThrow('Recovery required');
    } finally {
      writeSpy.mockRestore();
    }

    expect(recoveryPathModuleWrites).toBe(0);
    const journalRaw = await readFile(recoveryPath, 'utf8');
    const journal = JSON.parse(journalRaw);
    expect(journal).toMatchObject({ version: '1', status: 'pending' });
    expect(journal.restore).toEqual(
      expect.arrayContaining([
        {
          filePath: issuesStatePath,
          snapshot: { kind: 'file', contents: sentinel },
        },
        {
          filePath: registryPath,
          snapshot: { kind: 'file', contents: registryBefore },
        },
      ]),
    );
    await expect(readFeaturesState(cwd)).rejects.toThrow('Recovery required');
  });

  it('fails closed when the repository feature-state lock is already held', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    const lockPath = join(cwd, '.scratch', 'features-status.lock');
    await writeFile(lockPath, 'held by another updater\n', 'utf8');
    const before = await readFile(getFeaturesStatusPath(cwd), 'utf8');

    await expect(
      updateFeature({ cwd, slug: feature.slug, phase: 'implementation' }),
    ).rejects.toThrow('already in progress');

    await expect(readFile(getFeaturesStatusPath(cwd), 'utf8')).resolves.toBe(
      before,
    );
  });

  it('rejects a focus whose real path escapes through a junction or symlink', async () => {
    const feature = makeFeature();
    await writeState(cwd, [feature]);
    const outsideDir = join(cwd, 'outside');
    const linkPath = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'escape',
    );
    await mkdir(outsideDir);
    await writeFile(join(outsideDir, 'SECRET.md'), '# Outside\n', 'utf8');

    try {
      await symlink(outsideDir, linkPath, 'junction');
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOSYS') {
        return;
      }
      throw error;
    }

    await expect(
      updateFeature({ cwd, slug: feature.slug, focusPath: 'escape/SECRET.md' }),
    ).rejects.toThrow('feature-relative');
    expect((await readFeaturesState(cwd)).features[0].focusPath).toBeNull();
  });
});
