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
    error: 'Invalid ISO instant for --since: 2026-07-20.',
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
