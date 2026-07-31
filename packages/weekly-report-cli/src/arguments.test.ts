import { parseGitCollectionArguments } from './arguments.js';

it('parses a complete Git collection request without normalizing caller values', () => {
  expect(
    parseGitCollectionArguments([
      '--repository',
      'C:/temporary/repository with spaces',
      '--remote',
      'upstream',
      '--default-branch',
      'trunk',
      '--since',
      '2026-07-20T00:00:00+03:00',
      '--until',
      '2026-07-26T23:59:59+03:00',
    ]),
  ).toEqual({
    ok: true,
    value: {
      repository: 'C:/temporary/repository with spaces',
      remote: 'upstream',
      defaultBranch: 'trunk',
      since: '2026-07-20T00:00:00+03:00',
      until: '2026-07-26T23:59:59+03:00',
    },
  });
});

it('reports the first missing required option', () => {
  expect(parseGitCollectionArguments([])).toEqual({
    error: 'Missing required option: --repository.',
    ok: false,
  });
});

it('rejects a duplicate option instead of silently overriding it', () => {
  expect(
    parseGitCollectionArguments([
      '--repository',
      'first',
      '--repository',
      'second',
    ]),
  ).toEqual({
    error: 'Duplicate option: --repository.',
    ok: false,
  });
});

const completeArguments = [
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
];

it('requires ISO instants with explicit timezone offsets', () => {
  const args = [...completeArguments];
  args[7] = '2026-07-20';

  expect(parseGitCollectionArguments(args)).toEqual({
    error: 'Invalid ISO instant for --since.',
    ok: false,
  });
});

it('requires the interval to end at or after its start', () => {
  const args = [...completeArguments];
  args[7] = '2026-07-27T00:00:00Z';

  expect(parseGitCollectionArguments(args)).toEqual({
    error: '--until must be at or after --since.',
    ok: false,
  });
});

it('rejects empty option values', () => {
  const args = [...completeArguments];
  args[3] = '';

  expect(parseGitCollectionArguments(args)).toEqual({
    error: 'Option value must not be empty: --remote.',
    ok: false,
  });
});

it.each([
  'https://account:private-token@example.invalid/repository.git',
  'ssh://example.invalid/repository.git',
  'account@example.invalid:repository.git',
  'origin\nunsafe',
  'origin\u0000unsafe',
  '../origin',
  '-origin',
  'a..b',
  'foo.lock',
  'a/b.LOCK',
])('rejects an unsafe remote name without echoing it: %s', (remote) => {
  const args = [...completeArguments];
  args[3] = remote;

  expect(parseGitCollectionArguments(args)).toEqual({
    error: 'Invalid remote name.',
    ok: false,
  });
});

it.each([
  'https://account:private-token@example.invalid/repository.git',
  'feature\nprivate-token',
  'a..b',
  'feature.lock',
])('rejects an unsafe default branch without echoing it: %s', (branch) => {
  const args = [...completeArguments];
  args[5] = branch;

  expect(parseGitCollectionArguments(args)).toEqual({
    error: 'Invalid default branch name.',
    ok: false,
  });
});

it.each([
  '2026-02-29T00:00:00Z',
  '2026-02-30T00:00:00Z',
  '2026-04-31T00:00:00Z',
  '2026-01-01T24:00:00Z',
  '2026-01-01T23:60:00Z',
  '2026-01-01T23:59:60Z',
  '2026-01-01T00:00:00+14:01',
  '2026-01-01T00:00:00+15:00',
])('rejects an impossible calendar or clock instant: %s', (instant) => {
  const args = [...completeArguments];
  args[7] = instant;

  expect(parseGitCollectionArguments(args)).toEqual({
    error: 'Invalid ISO instant for --since.',
    ok: false,
  });
});

it.each([
  '2024-02-29T23:59:59.123Z',
  '2026-01-01T00:00:00+14:00',
  '2026-01-01T00:00:00-14:00',
])('accepts a strict valid ISO instant boundary: %s', (instant) => {
  const args = [...completeArguments];
  args[7] = instant;

  expect(parseGitCollectionArguments(args)).toMatchObject({
    ok: true,
    value: { since: instant },
  });
});
