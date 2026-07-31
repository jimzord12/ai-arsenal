import { serializeGitEvidence } from './evidence-schema.js';

it('serializes a valid empty verified evidence document', () => {
  const document = {
    branches: [],
    collector: 'git' as const,
    defaultBranchCommits: [],
    interval: {
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    },
    schemaVersion: '1' as const,
    source: { defaultBranch: 'main', remote: 'origin' },
    status: 'verified' as const,
  };

  expect(serializeGitEvidence(document)).toBe(`${JSON.stringify(document)}\n`);
});

it('rejects an invalid evidence document before serialization', () => {
  expect(() =>
    serializeGitEvidence({
      collector: 'git',
      interval: {
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      },
      schemaVersion: '1',
      source: { defaultBranch: 'main', remote: 'origin' },
      status: 'verified',
    }),
  ).toThrow('Invalid Git evidence: branches must be an array.');
});

function validEvidenceWithCommit() {
  const commit = {
    committedAt: '2026-07-21T10:00:00Z',
    parentShas: ['b'.repeat(40)],
    sha: 'a'.repeat(40),
    subject: 'synthetic outcome',
  };
  return {
    branches: [
      {
        activity: 'active' as const,
        aheadBy: 1,
        behindBy: 0,
        commits: [commit],
        headSha: 'c'.repeat(40),
        intervalCommits: [commit],
        mergeBaseShas: ['d'.repeat(40)],
        name: 'feature',
      },
    ],
    collector: 'git' as const,
    defaultBranchCommits: [commit],
    interval: {
      since: '2026-07-20T00:00:00Z',
      until: '2026-07-26T23:59:59Z',
    },
    schemaVersion: '1' as const,
    source: { defaultBranch: 'main', remote: 'origin' },
    status: 'verified' as const,
  };
}

it.each([
  [
    'commit SHA',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.defaultBranchCommits[0].sha = 'not-an-object-id';
    },
  ],
  [
    'parent SHA',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.defaultBranchCommits[0].parentShas = ['1234'];
    },
  ],
  [
    'commit timestamp',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.defaultBranchCommits[0].committedAt = '2026-02-30T00:00:00Z';
    },
  ],
  [
    'branch head SHA',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.branches[0].headSha = 'not-an-object-id';
    },
  ],
  [
    'merge-base SHA',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.branches[0].mergeBaseShas = ['1234'];
    },
  ],
  [
    'interval timestamp',
    (value: ReturnType<typeof validEvidenceWithCommit>) => {
      value.interval.since = '2026-04-31T00:00:00Z';
    },
  ],
])('rejects a malformed %s', (_name, mutate) => {
  const value = validEvidenceWithCommit();
  mutate(value);
  expect(() => serializeGitEvidence(value)).toThrow('Invalid Git evidence:');
});

it('accepts full SHA-256 object IDs', () => {
  const value = validEvidenceWithCommit();
  const sha256 = 'a'.repeat(64);
  value.defaultBranchCommits[0].sha = sha256;
  value.defaultBranchCommits[0].parentShas = [sha256];
  value.branches[0].headSha = sha256;
  value.branches[0].mergeBaseShas = [sha256];

  expect(() => serializeGitEvidence(value)).not.toThrow();
});
