import { HELP, runCli, VERSION } from './cli.js';
import { GitCollectionFailure } from './git-collector.js';

describe('weekly-report-cli help', () => {
  it('documents the Git collection command when no arguments are supplied', () => {
    expect(runCli([])).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: [
        'weekly-report-cli',
        '',
        'Usage:',
        '  weekly-report-cli --help',
        '  weekly-report-cli --version',
        '  weekly-report-cli collect git --repository <path> --remote <name> --default-branch <name> --since <instant> --until <instant>',
        '',
        'Successful collection writes validated JSON evidence to stdout.',
        '',
      ].join('\n'),
    });
  });

  it.each([['--help'], ['help']])('returns the same help for %s', (...args) => {
    expect(runCli(args)).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: HELP,
    });
  });
});

describe('weekly-report-cli version', () => {
  it.each([['--version'], ['version']])(
    'returns its package version for %s',
    (...args) => {
      expect(runCli(args)).toEqual({
        exitCode: 0,
        stderr: '',
        stdout: `weekly-report-cli ${VERSION}\n`,
      });
    },
  );
});

describe('weekly-report-cli usage failures', () => {
  it('writes a structured diagnostic to stderr for an unknown command', () => {
    expect(runCli(['deploy'])).toEqual({
      exitCode: 2,
      stderr: 'USAGE_ERROR: Unknown command.\n',
      stdout: '',
    });
  });

  it('names the first missing Git collection option', () => {
    expect(runCli(['collect', 'git'])).toEqual({
      exitCode: 2,
      stderr: 'USAGE_ERROR: Missing required option: --repository.\n',
      stdout: '',
    });
  });
});

it('serializes verified Git evidence returned by the collector', () => {
  const evidence = {
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
  const collector = jest.fn(() => evidence);

  expect(
    runCli(
      [
        'collect',
        'git',
        '--repository',
        'repository with spaces',
        '--remote',
        'origin',
        '--default-branch',
        'main',
        '--since',
        '2026-07-20T00:00:00Z',
        '--until',
        '2026-07-26T23:59:59Z',
      ],
      collector,
    ),
  ).toEqual({
    exitCode: 0,
    stderr: '',
    stdout: `${JSON.stringify(evidence)}\n`,
  });
  expect(collector).toHaveBeenCalledWith({
    defaultBranch: 'main',
    remote: 'origin',
    repository: 'repository with spaces',
    since: '2026-07-20T00:00:00Z',
    until: '2026-07-26T23:59:59Z',
  });
});

it('emits validated unverifiable evidence and diagnostics for collection failures', () => {
  const result = runCli(
    [
      'collect',
      'git',
      '--repository',
      'repository',
      '--remote',
      'origin',
      '--default-branch',
      'main',
      '--since',
      '2026-07-20T00:00:00Z',
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    () => {
      throw new GitCollectionFailure(
        'GIT_FETCH_FAILED',
        'Git fetch failed.',
        'fatal: https://[REDACTED]@example.invalid/repo.git',
      );
    },
  );

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toBe(
    'COLLECTION_ERROR GIT_FETCH_FAILED: Git fetch failed.\n' +
      'fatal: https://[REDACTED]@example.invalid/repo.git\n',
  );
  expect(JSON.parse(result.stdout)).toMatchObject({
    errors: [{ code: 'GIT_FETCH_FAILED', message: 'Git fetch failed.' }],
    status: 'unverifiable',
  });
});

it('converts invalid collector output into explicit validation failure evidence', () => {
  const result = runCli(
    [
      'collect',
      'git',
      '--repository',
      'repository',
      '--remote',
      'origin',
      '--default-branch',
      'main',
      '--since',
      '2026-07-20T00:00:00Z',
      '--until',
      '2026-07-26T23:59:59Z',
    ],
    () => ({}),
  );

  expect(result).toMatchObject({
    exitCode: 1,
    stderr:
      'COLLECTION_ERROR GIT_OUTPUT_VALIDATION_FAILED: Git evidence collection failed.\n',
  });
  expect(JSON.parse(result.stdout)).toMatchObject({
    errors: [{ code: 'GIT_OUTPUT_VALIDATION_FAILED' }],
    status: 'unverifiable',
  });
});

it.each([
  [
    'malformed commit SHA',
    {
      branches: [],
      collector: 'git',
      defaultBranchCommits: [
        {
          committedAt: '2026-07-21T10:00:00Z',
          parentShas: [],
          sha: 'not-an-object-id',
          subject: 'synthetic outcome',
        },
      ],
      interval: {
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      },
      schemaVersion: '1',
      source: { defaultBranch: 'main', remote: 'origin' },
      status: 'verified',
    },
  ],
  [
    'malformed commit timestamp',
    {
      branches: [],
      collector: 'git',
      defaultBranchCommits: [
        {
          committedAt: 'not-an-instant',
          parentShas: [],
          sha: 'a'.repeat(40),
          subject: 'synthetic outcome',
        },
      ],
      interval: {
        since: '2026-07-20T00:00:00Z',
        until: '2026-07-26T23:59:59Z',
      },
      schemaVersion: '1',
      source: { defaultBranch: 'main', remote: 'origin' },
      status: 'verified',
    },
  ],
  [
    'malformed interval timestamp',
    {
      branches: [],
      collector: 'git',
      defaultBranchCommits: [],
      interval: { since: 'not-an-instant', until: '2026-07-26T23:59:59Z' },
      schemaVersion: '1',
      source: { defaultBranch: 'main', remote: 'origin' },
      status: 'verified',
    },
  ],
])(
  'turns %s from the collector into a CLI validation failure',
  (_name, evidence) => {
    const result = runCli(
      [
        'collect',
        'git',
        '--repository',
        'repository',
        '--remote',
        'origin',
        '--default-branch',
        'main',
        '--since',
        '2026-07-20T00:00:00Z',
        '--until',
        '2026-07-26T23:59:59Z',
      ],
      () => evidence,
    );

    expect(result).toMatchObject({
      exitCode: 1,
      stderr:
        'COLLECTION_ERROR GIT_OUTPUT_VALIDATION_FAILED: Git evidence collection failed.\n',
    });
    expect(JSON.parse(result.stdout)).toMatchObject({
      errors: [{ code: 'GIT_OUTPUT_VALIDATION_FAILED' }],
      status: 'unverifiable',
    });
  },
);
