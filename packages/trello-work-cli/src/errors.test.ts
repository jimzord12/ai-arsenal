import { asWorkCliError, formatWorkError, WorkCliError } from './errors';
import { WorkUnitError } from './work-unit';

describe('stable Work CLI errors', () => {
  it('renders structured JSON with a stable code and recovery data', () => {
    const error = new WorkCliError('STALE_VERSION', 'Expected v1, found v2.', {
      exitCode: 4,
      recovery: { currentVersion: 'v2' },
    });
    expect(JSON.parse(formatWorkError(error, true))).toEqual({
      error: {
        code: 'STALE_VERSION',
        message: 'Expected v1, found v2.',
        recovery: { currentVersion: 'v2' },
      },
    });
    expect(error.exitCode).toBe(4);
  });

  it('redacts secrets from human and JSON failures, including recovery JSON', () => {
    const error = new WorkCliError('API_FAILURE', 'token-value was rejected', {
      recovery: {
        operationId: 'safe-id',
        nested: { detail: 'token-value' },
      },
    });
    for (const json of [false, true]) {
      expect(formatWorkError(error, json, ['token-value'])).not.toContain(
        'token-value',
      );
    }
    expect(JSON.parse(formatWorkError(error, true, ['token-value']))).toEqual({
      error: {
        code: 'API_FAILURE',
        message: '[REDACTED] was rejected',
        recovery: {
          operationId: 'safe-id',
          nested: { detail: '[REDACTED]' },
        },
      },
    });
  });

  it('maps Work Unit validation failures to INVALID_WORK_UNIT', () => {
    const error = asWorkCliError(new WorkUnitError('unsafe metadata'));
    expect(error).toMatchObject({
      code: 'INVALID_WORK_UNIT',
      exitCode: 1,
      message: 'unsafe metadata',
    });
  });
});
