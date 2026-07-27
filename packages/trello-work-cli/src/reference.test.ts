import { parseReference } from './reference';

describe('Work Unit references', () => {
  it.each([
    ['WU-17', { kind: 'workUnitId', value: 'WU-17' }],
    [
      '0123456789ABCDEF01234567',
      { kind: 'cardId', value: '0123456789abcdef01234567' },
    ],
    [
      'https://trello.com/c/AbCd1234/outcome-title',
      {
        kind: 'cardUrl',
        shortLink: 'AbCd1234',
        value: 'https://trello.com/c/AbCd1234/outcome-title',
      },
    ],
  ])('parses %s deterministically', (input, expected) => {
    expect(parseReference(input)).toEqual(expected);
  });

  it.each([
    '',
    ' WU-1',
    'WU-01',
    '01234',
    'https://example.com/c/AbCd1234/name',
    'https://trello.com/b/AbCd1234/board',
    'https://trello.com/c/x/name?token=secret',
  ])('rejects invalid or ambiguous reference %j', (input) => {
    expect(() => parseReference(input)).toThrow(/reference/i);
  });
});
