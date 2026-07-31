import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectGitEvidence, GitCollectionFailure } from './git-collector.js';

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

async function commit(
  repository: string,
  subject: string,
  date: string,
): Promise<string> {
  await writeFile(join(repository, 'evidence.txt'), `${subject}\n`, {
    flag: 'a',
  });
  git(repository, ['add', 'evidence.txt']);
  git(repository, ['commit', '-m', subject], date);
  return git(repository, ['rev-parse', 'HEAD']);
}

jest.setTimeout(30_000);

it('collects interval commits and active unmerged remote branches', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git evidence collector '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target with spaces');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    await commit(seed, 'before interval', '2026-07-19T10:00:00Z');
    const mergedSha = await commit(
      seed,
      'merged outcome',
      '2026-07-20T00:00:00Z',
    );
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);

    git(seed, ['checkout', '-b', 'feature-active']);
    const branchSha = await commit(
      seed,
      'active branch work',
      '2026-07-22T12:00:00Z',
    );
    git(seed, ['push', 'origin', 'feature-active']);

    git(seed, ['checkout', 'main']);
    git(seed, ['checkout', '-b', 'feature-inactive']);
    const inactiveSha = await commit(
      seed,
      'older unmerged work',
      '2026-07-18T12:00:00Z',
    );
    git(seed, ['push', 'origin', 'feature-inactive']);

    git(seed, ['checkout', 'main']);
    git(seed, ['checkout', '-b', 'stale-remote-branch']);
    await commit(seed, 'branch removed upstream', '2026-07-23T12:00:00Z');
    git(seed, ['push', 'origin', 'stale-remote-branch']);
    git(target, ['fetch', 'origin']);
    git(seed, ['push', 'origin', '--delete', 'stale-remote-branch']);

    const evidence = collectGitEvidence({
      defaultBranch: 'main',
      remote: 'origin',
      repository: target,
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    });

    expect(evidence).toMatchObject({
      branches: [
        {
          activity: 'active',
          aheadBy: 1,
          behindBy: 0,
          headSha: branchSha,
          intervalCommits: [{ sha: branchSha, subject: 'active branch work' }],
          name: 'feature-active',
        },
        {
          activity: 'inactive',
          aheadBy: 1,
          behindBy: 0,
          headSha: inactiveSha,
          intervalCommits: [],
          name: 'feature-inactive',
        },
      ],
      collector: 'git',
      defaultBranchCommits: [{ sha: mergedSha, subject: 'merged outcome' }],
      schemaVersion: '1',
      source: { defaultBranch: 'main', remote: 'origin' },
      status: 'verified',
    });
    expect(evidence.branches.map((branch) => branch.name)).not.toContain(
      'stale-remote-branch',
    );
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('keeps merged commits on the default branch and out of branch-only work', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git merged evidence '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    await commit(seed, 'base', '2026-07-19T10:00:00Z');
    git(seed, ['checkout', '-b', 'feature-merged']);
    const featureSha = await commit(
      seed,
      'completed branch work',
      '2026-07-21T10:00:00Z',
    );
    git(seed, ['checkout', 'main']);
    git(
      seed,
      ['merge', '--no-ff', 'feature-merged', '-m', 'merge completed work'],
      '2026-07-22T10:00:00Z',
    );
    const mergeSha = git(seed, ['rev-parse', 'HEAD']);
    const intervalEndSha = await commit(
      seed,
      'at interval end',
      '2026-07-26T23:59:59Z',
    );
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main', 'feature-merged']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);

    const evidence = collectGitEvidence({
      defaultBranch: 'main',
      remote: 'origin',
      repository: target,
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    });

    expect(evidence.branches).toEqual([]);
    expect(evidence.defaultBranchCommits.map((commit) => commit.sha)).toEqual([
      featureSha,
      mergeSha,
      intervalEndSha,
    ]);

    const emptyEvidence = collectGitEvidence({
      defaultBranch: 'main',
      remote: 'origin',
      repository: target,
      since: '2026-07-27T00:00:00Z',
      until: '2026-08-02T23:59:59Z',
    });
    expect(emptyEvidence).toMatchObject({
      branches: [],
      defaultBranchCommits: [],
      status: 'verified',
    });
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('reports only the rewritten branch commit after a rebase', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git rebased evidence '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    await commit(seed, 'base', '2026-07-19T10:00:00Z');
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main']);

    git(seed, ['checkout', '-b', 'feature-rebased']);
    const originalSha = await commit(
      seed,
      'rebased branch work',
      '2026-07-20T10:00:00Z',
    );
    git(seed, ['push', '-u', 'origin', 'feature-rebased']);

    git(seed, ['checkout', 'main']);
    await writeFile(join(seed, 'main-only.txt'), 'main moved forward\n');
    git(seed, ['add', 'main-only.txt']);
    git(seed, ['commit', '-m', 'main moved forward'], '2026-07-21T10:00:00Z');
    const mainHead = git(seed, ['rev-parse', 'HEAD']);
    git(seed, ['push', 'origin', 'main']);
    git(seed, ['checkout', 'feature-rebased']);
    git(seed, ['rebase', 'main'], '2026-07-22T10:00:00Z');
    const rebasedSha = git(seed, ['rev-parse', 'HEAD']);
    git(seed, ['push', '--force-with-lease', 'origin', 'feature-rebased']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);

    const evidence = collectGitEvidence({
      defaultBranch: 'main',
      remote: 'origin',
      repository: target,
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    });

    expect(rebasedSha).not.toBe(originalSha);
    expect(evidence.branches).toMatchObject([
      {
        activity: 'active',
        aheadBy: 1,
        behindBy: 0,
        commits: [{ sha: rebasedSha }],
        headSha: rebasedSha,
        mergeBaseShas: [mainHead],
        name: 'feature-rebased',
      },
    ]);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('reports an unrelated remote branch as explicit unverifiable evidence', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git unrelated evidence '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const unrelated = join(workspace, 'unrelated');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', remote]);
    for (const repository of [seed, unrelated]) {
      git(workspace, ['init', repository]);
      git(repository, ['config', 'user.name', 'Synthetic User']);
      git(repository, ['config', 'user.email', 'synthetic@example.invalid']);
    }

    git(seed, ['checkout', '-b', 'main']);
    await commit(seed, 'main history', '2026-07-20T10:00:00Z');
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);

    git(unrelated, ['checkout', '-b', 'unrelated-history']);
    await commit(unrelated, 'unrelated work', '2026-07-21T10:00:00Z');
    git(unrelated, ['remote', 'add', 'origin', remote]);
    git(unrelated, ['push', 'origin', 'unrelated-history']);
    git(workspace, ['clone', remote, target]);

    expect(() =>
      collectGitEvidence({
        defaultBranch: 'main',
        remote: 'origin',
        repository: target,
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'GIT_BRANCH_UNRELATED',
        message:
          'Remote branch unrelated-history has no shared history with the configured default branch.',
      }),
    );
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('rejects overlapping remote namespaces before fetch mutates tracking refs', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git remote namespace '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    const originalSha = await commit(
      seed,
      'original main',
      '2026-07-20T10:00:00Z',
    );
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);
    git(target, ['remote', 'rename', 'origin', 'foo']);
    git(target, ['remote', 'add', 'foo/bar', join(workspace, 'unused.git')]);

    await commit(seed, 'new remote main', '2026-07-21T10:00:00Z');
    git(seed, ['push', 'origin', 'main']);
    expect(git(target, ['rev-parse', 'refs/remotes/foo/main'])).toBe(
      originalSha,
    );
    const fetchHeadPath = join(target, '.git', 'FETCH_HEAD');
    const fetchHeadBefore = await readFile(fetchHeadPath, 'utf8').catch(
      () => null,
    );

    expect(() =>
      collectGitEvidence({
        defaultBranch: 'main',
        remote: 'foo',
        repository: target,
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'GIT_REMOTE_NAMESPACE_CONFLICT',
        message: 'Configured remote namespace overlaps another remote.',
      }),
    );
    expect(git(target, ['rev-parse', 'refs/remotes/foo/main'])).toBe(
      originalSha,
    );
    const fetchHeadAfter = await readFile(fetchHeadPath, 'utf8').catch(
      () => null,
    );
    expect(fetchHeadAfter).toBe(fetchHeadBefore);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('rejects case-folded remote namespace overlap before tracking-ref mutation', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git case-folded namespace '));
  const remote = join(workspace, 'remote.git');
  const seed = join(workspace, 'seed');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', remote]);
    git(workspace, ['init', seed]);
    git(seed, ['config', 'user.name', 'Synthetic User']);
    git(seed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(seed, ['checkout', '-b', 'main']);
    const originalSha = await commit(
      seed,
      'original main',
      '2026-07-20T10:00:00Z',
    );
    git(seed, ['checkout', '-b', 'bar/main']);
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, ['push', '-u', 'origin', 'main', 'bar/main']);
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, ['clone', remote, target]);
    git(target, ['remote', 'rename', 'origin', 'foo']);
    git(target, ['remote', 'add', 'Foo/bar', join(workspace, 'unused.git')]);

    await commit(seed, 'new nested branch', '2026-07-21T10:00:00Z');
    git(seed, ['push', 'origin', 'bar/main']);
    const trackingRef = 'refs/remotes/foo/bar/main';
    expect(git(target, ['rev-parse', trackingRef])).toBe(originalSha);

    let failure: unknown;
    try {
      collectGitEvidence({
        defaultBranch: 'main',
        remote: 'foo',
        repository: target,
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({
      code: 'GIT_REMOTE_NAMESPACE_CONFLICT',
      message: 'Configured remote namespace overlaps another remote.',
    });
    expect(git(target, ['rev-parse', trackingRef])).toBe(originalSha);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('does not recurse into submodule remotes when repository config enables it', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git submodule fetch scope '));
  const submoduleRemote = join(workspace, 'submodule.git');
  const submoduleSeed = join(workspace, 'submodule-seed');
  const superRemote = join(workspace, 'super.git');
  const superSeed = join(workspace, 'super-seed');
  const target = join(workspace, 'target');

  try {
    git(workspace, ['init', '--bare', submoduleRemote]);
    git(workspace, ['init', submoduleSeed]);
    git(submoduleSeed, ['config', 'user.name', 'Synthetic User']);
    git(submoduleSeed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(submoduleSeed, ['checkout', '-b', 'main']);
    const originalSubmoduleSha = await commit(
      submoduleSeed,
      'original dependency',
      '2026-07-19T10:00:00Z',
    );
    git(submoduleSeed, ['remote', 'add', 'origin', submoduleRemote]);
    git(submoduleSeed, ['push', '-u', 'origin', 'main']);
    git(submoduleRemote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);

    git(workspace, ['init', '--bare', superRemote]);
    git(workspace, ['init', superSeed]);
    git(superSeed, ['config', 'user.name', 'Synthetic User']);
    git(superSeed, ['config', 'user.email', 'synthetic@example.invalid']);
    git(superSeed, ['checkout', '-b', 'main']);
    git(superSeed, [
      '-c',
      'protocol.file.allow=always',
      'submodule',
      'add',
      submoduleRemote,
      'modules/dependency',
    ]);
    git(superSeed, ['commit', '-am', 'add dependency'], '2026-07-20T10:00:00Z');
    git(superSeed, ['remote', 'add', 'origin', superRemote]);
    git(superSeed, ['push', '-u', 'origin', 'main']);
    git(superRemote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(workspace, [
      '-c',
      'protocol.file.allow=always',
      'clone',
      '--recurse-submodules',
      superRemote,
      target,
    ]);
    git(target, ['config', 'fetch.recurseSubmodules', 'true']);

    const newSubmoduleSha = await commit(
      submoduleSeed,
      'new dependency',
      '2026-07-21T10:00:00Z',
    );
    git(submoduleSeed, ['push', 'origin', 'main']);
    const superSubmodule = join(superSeed, 'modules', 'dependency');
    git(superSubmodule, ['fetch', 'origin']);
    git(superSubmodule, ['checkout', newSubmoduleSha]);
    git(
      superSeed,
      ['commit', '-am', 'update dependency'],
      '2026-07-22T10:00:00Z',
    );
    git(superSeed, ['push', 'origin', 'main']);

    const targetSubmodule = join(target, 'modules', 'dependency');
    git(targetSubmodule, [
      'remote',
      'set-url',
      'origin',
      join(workspace, 'must-not-be-contacted.git'),
    ]);
    expect(
      git(targetSubmodule, ['rev-parse', 'refs/remotes/origin/main']),
    ).toBe(originalSubmoduleSha);

    const evidence = collectGitEvidence({
      defaultBranch: 'main',
      remote: 'origin',
      repository: target,
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    });

    expect(evidence.status).toBe('verified');
    expect(
      git(targetSubmodule, ['rev-parse', 'refs/remotes/origin/main']),
    ).toBe(originalSubmoduleSha);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});

it('distinguishes missing remotes, fetch failures, and missing default refs', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'git collection failures '));
  const repository = join(workspace, 'repository');
  const emptyRemote = join(workspace, 'empty.git');
  const request = {
    defaultBranch: 'main',
    remote: 'origin',
    repository,
    since: '2026-07-20T00:00:00Z',
    until: '2026-07-26T23:59:59Z',
  };

  function collectFailure(): GitCollectionFailure {
    try {
      collectGitEvidence(request);
      throw new Error('Expected collection to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(GitCollectionFailure);
      return error as GitCollectionFailure;
    }
  }

  try {
    git(workspace, ['init', repository]);
    expect(collectFailure().code).toBe('GIT_REMOTE_NOT_FOUND');

    git(repository, [
      'remote',
      'add',
      'origin',
      join(workspace, 'missing.git'),
    ]);
    expect(collectFailure()).toMatchObject({
      code: 'GIT_FETCH_FAILED',
      detail: undefined,
    });

    git(workspace, ['init', '--bare', emptyRemote]);
    git(repository, ['remote', 'set-url', 'origin', emptyRemote]);
    expect(collectFailure().code).toBe('GIT_DEFAULT_REF_NOT_FOUND');
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
});
