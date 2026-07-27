import { WorkCliError } from './errors';
import { assertCurrentVersion, cardVersion } from './version';

const card = { dateLastActivity: '2026-07-26T12:00:00.000Z' };

describe('optimistic versions', () => {
  it('uses Trello last activity as the opaque version', () => {
    expect(cardVersion(card)).toBe('2026-07-26T12:00:00.000Z');
  });

  it('rejects a stale expected version with stable recovery before mutation', () => {
    expect(() => assertCurrentVersion('older', cardVersion(card))).toThrow(
      expect.objectContaining<Partial<WorkCliError>>({
        code: 'STALE_VERSION',
        exitCode: 4,
        recovery: {
          expectedVersion: 'older',
          currentVersion: '2026-07-26T12:00:00.000Z',
        },
      }),
    );
  });

  it('accepts an absent or matching expected version', () => {
    expect(() =>
      assertCurrentVersion(undefined, cardVersion(card)),
    ).not.toThrow();
    expect(() =>
      assertCurrentVersion('2026-07-26T12:00:00.000Z', cardVersion(card)),
    ).not.toThrow();
  });
});
