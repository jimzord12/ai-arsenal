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
