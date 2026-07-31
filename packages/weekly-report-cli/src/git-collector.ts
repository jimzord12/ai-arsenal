import { spawnSync } from 'node:child_process';
import type { GitCollectionArguments } from './arguments.js';
import type {
  GitBranchEvidence,
  GitCommitEvidence,
  VerifiedGitEvidence,
} from './evidence-schema.js';
import { redactSensitiveText } from './redaction.js';

const COMMIT_FORMAT = '%H%x00%P%x00%cI%x00%s';

export class GitCollectionFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'GitCollectionFailure';
  }
}

function runGit(
  repository: string,
  operation: string,
  args: readonly string[],
): string {
  const result = spawnSync('git', args, {
    cwd: repository,
    encoding: 'utf8',
    env: {
      ...process.env,
      GCM_INTERACTIVE: 'Never',
      GIT_TERMINAL_PROMPT: '0',
      LC_ALL: 'C',
    },
    windowsHide: true,
  });

  if (result.status !== 0) {
    const rawDetail =
      result.stderr || result.stdout || result.error?.message || '';
    const detail = redactSensitiveText(rawDetail).trim().slice(0, 2_000);
    throw new GitCollectionFailure(
      `GIT_${operation.toUpperCase()}_FAILED`,
      `Git ${operation} failed.`,
      detail || undefined,
    );
  }

  return result.stdout;
}

function parseCommits(output: string): GitCommitEvidence[] {
  if (output.length === 0) return [];
  const fields = output.split('\0');
  if (fields.at(-1) === '') fields.pop();
  if (fields.length % 4 !== 0) {
    throw new GitCollectionFailure(
      'GIT_OUTPUT_INVALID',
      'Git returned malformed commit evidence.',
    );
  }

  const commits: GitCommitEvidence[] = [];
  for (let index = 0; index < fields.length; index += 4) {
    commits.push({
      committedAt: fields[index + 2],
      parentShas: fields[index + 1] ? fields[index + 1].split(' ') : [],
      sha: fields[index],
      subject: fields[index + 3],
    });
  }
  return commits;
}

function commitsForRange(
  repository: string,
  revision: string,
): GitCommitEvidence[] {
  return parseCommits(
    runGit(repository, 'log', [
      'log',
      '-z',
      '--reverse',
      '--topo-order',
      `--format=${COMMIT_FORMAT}`,
      revision,
    ]),
  );
}

function inInterval(
  commit: GitCommitEvidence,
  since: number,
  until: number,
): boolean {
  const timestamp = Date.parse(commit.committedAt);
  return timestamp >= since && timestamp <= until;
}

function remoteBranchRefs(repository: string, prefix: string): string[] {
  const output = runGit(repository, 'list_refs', [
    'for-each-ref',
    '--format=%(refname)%09%(symref)',
    prefix,
  ]);

  return output
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.split('\t'))
    .filter(([, symref]) => !symref)
    .map(([ref]) => ref)
    .sort((left, right) => left.localeCompare(right, 'en'));
}

function divergence(
  repository: string,
  defaultRef: string,
  branchRef: string,
): { aheadBy: number; behindBy: number } {
  const output = runGit(repository, 'divergence', [
    'rev-list',
    '--left-right',
    '--count',
    `${defaultRef}...${branchRef}`,
  ]).trim();
  const [behind, ahead] = output.split(/\s+/u).map(Number);
  if (!Number.isSafeInteger(ahead) || !Number.isSafeInteger(behind)) {
    throw new GitCollectionFailure(
      'GIT_OUTPUT_INVALID',
      'Git returned malformed divergence evidence.',
    );
  }
  return { aheadBy: ahead, behindBy: behind };
}

function collectBranch(
  request: GitCollectionArguments,
  defaultRef: string,
  branchRef: string,
  since: number,
  until: number,
): GitBranchEvidence | null {
  const commits = commitsForRange(
    request.repository,
    `${defaultRef}..${branchRef}`,
  );
  if (commits.length === 0) return null;

  const intervalCommits = commits.filter((commit) =>
    inInterval(commit, since, until),
  );
  const { aheadBy, behindBy } = divergence(
    request.repository,
    defaultRef,
    branchRef,
  );
  let mergeBaseShas: string[];
  try {
    mergeBaseShas = runGit(request.repository, 'merge_base', [
      'merge-base',
      '--all',
      defaultRef,
      branchRef,
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .sort();
  } catch (error) {
    if (
      error instanceof GitCollectionFailure &&
      error.code === 'GIT_MERGE_BASE_FAILED' &&
      error.detail === undefined
    ) {
      throw new GitCollectionFailure(
        'GIT_BRANCH_UNRELATED',
        `Remote branch ${branchRef.slice(`refs/remotes/${request.remote}/`.length)} has no shared history with the configured default branch.`,
      );
    }
    throw error;
  }
  if (mergeBaseShas.length === 0) {
    throw new GitCollectionFailure(
      'GIT_OUTPUT_INVALID',
      'Git returned no merge base for an unmerged branch.',
    );
  }

  return {
    activity: intervalCommits.length > 0 ? 'active' : 'inactive',
    aheadBy,
    behindBy,
    commits,
    headSha: runGit(request.repository, 'resolve_ref', [
      'rev-parse',
      '--verify',
      branchRef,
    ]).trim(),
    intervalCommits,
    mergeBaseShas,
    name: branchRef.slice(`refs/remotes/${request.remote}/`.length),
  };
}

export function collectGitEvidence(
  request: GitCollectionArguments,
): VerifiedGitEvidence {
  let insideWorkTree: string;
  try {
    insideWorkTree = runGit(request.repository, 'repository_check', [
      'rev-parse',
      '--is-inside-work-tree',
    ]).trim();
  } catch (error) {
    if (error instanceof GitCollectionFailure) {
      throw new GitCollectionFailure(
        'GIT_REPOSITORY_INVALID',
        'The target is not a Git working tree.',
        error.detail,
      );
    }
    throw error;
  }
  if (insideWorkTree !== 'true') {
    throw new GitCollectionFailure(
      'GIT_REPOSITORY_INVALID',
      'The target is not a Git working tree.',
    );
  }

  const remotes = runGit(request.repository, 'list_remotes', ['remote'])
    .split(/\r?\n/u)
    .filter(Boolean);
  if (!remotes.includes(request.remote)) {
    throw new GitCollectionFailure(
      'GIT_REMOTE_NOT_FOUND',
      `Configured remote was not found: ${request.remote}.`,
    );
  }
  const selectedRemoteNamespace = request.remote.toLowerCase();
  const hasNamespaceConflict = remotes.some((otherRemote) => {
    if (otherRemote === request.remote) return false;
    const otherNamespace = otherRemote.toLowerCase();
    return (
      otherNamespace === selectedRemoteNamespace ||
      otherNamespace.startsWith(`${selectedRemoteNamespace}/`) ||
      selectedRemoteNamespace.startsWith(`${otherNamespace}/`)
    );
  });
  if (hasNamespaceConflict) {
    throw new GitCollectionFailure(
      'GIT_REMOTE_NAMESPACE_CONFLICT',
      'Configured remote namespace overlaps another remote.',
    );
  }

  try {
    runGit(request.repository, 'fetch', [
      'fetch',
      '--prune',
      '--no-tags',
      '--no-recurse-submodules',
      '--no-write-fetch-head',
      '--no-auto-maintenance',
      '--',
      request.remote,
      `+refs/heads/*:refs/remotes/${request.remote}/*`,
    ]);
  } catch (error) {
    if (error instanceof GitCollectionFailure) {
      throw new GitCollectionFailure('GIT_FETCH_FAILED', 'Git fetch failed.');
    }
    throw error;
  }

  const defaultRef = `refs/remotes/${request.remote}/${request.defaultBranch}`;
  try {
    runGit(request.repository, 'default_ref', [
      'show-ref',
      '--verify',
      defaultRef,
    ]);
  } catch (error) {
    if (error instanceof GitCollectionFailure) {
      throw new GitCollectionFailure(
        'GIT_DEFAULT_REF_NOT_FOUND',
        'The configured remote default branch was not found.',
        error.detail,
      );
    }
    throw error;
  }

  const since = Date.parse(request.since);
  const until = Date.parse(request.until);
  const defaultBranchCommits = commitsForRange(
    request.repository,
    defaultRef,
  ).filter((commit) => inInterval(commit, since, until));

  const prefix = `refs/remotes/${request.remote}/`;
  const branches = remoteBranchRefs(request.repository, prefix)
    .filter((branchRef) => branchRef !== defaultRef)
    .map((branchRef) =>
      collectBranch(request, defaultRef, branchRef, since, until),
    )
    .filter((branch): branch is GitBranchEvidence => branch !== null);

  return {
    branches,
    collector: 'git',
    defaultBranchCommits,
    interval: { since: request.since, until: request.until },
    schemaVersion: '1',
    source: {
      defaultBranch: request.defaultBranch,
      remote: request.remote,
    },
    status: 'verified',
  };
}
