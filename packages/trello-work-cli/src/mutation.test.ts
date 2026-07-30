import { WorkCliError } from './errors';
import {
  executeMutation,
  operationRecord,
  operationRecordState,
  operationRecordValue,
  planMutation,
} from './mutation';

type State = { value: string; version: string; operationId?: string };

const current: State = { value: 'before', version: 'v1' };

describe('mutation planning and execution', () => {
  it('writes bounded canonical v2 records and still recognizes legacy records', () => {
    const large = {
      operation: 'metadata update',
      sections: { Scope: 'x'.repeat(20_000) },
      metadata: { z: 1, a: 2 },
    };
    const reordered = {
      metadata: { a: 2, z: 1 },
      sections: { Scope: 'x'.repeat(20_000) },
      operation: 'metadata update',
    };
    const marker = operationRecord('compact-1', large);

    expect(marker).toContain('<!-- work-operation: compact-1 v2 ');
    expect(marker.length).toBeLessThan(180);
    expect(operationRecord('compact-1', reordered)).toBe(marker);
    expect(operationRecordState(marker, 'compact-1', reordered)).toBe('match');
    expect(
      operationRecordState(marker, 'compact-1', {
        ...large,
        metadata: { a: 3, z: 1 },
      }),
    ).toBe('conflict');
    expect(operationRecordValue(marker, 'compact-1')).toMatchObject({
      version: 2,
      operation: 'metadata update',
    });

    const legacyPayload = Buffer.from(JSON.stringify(large), 'utf8').toString(
      'base64url',
    );
    const legacy = `<!-- work-operation: legacy-1 ${legacyPayload} -->`;
    expect(operationRecordState(legacy, 'legacy-1', large)).toBe('match');
    expect(operationRecordValue(legacy, 'legacy-1')).toEqual(large);

    const malformed = '<!-- work-operation: broken-1 v2 bm9wZQ short -->';
    expect(operationRecordState(malformed, 'broken-1', large)).toBe('conflict');
    expect(operationRecordValue(malformed, 'broken-1')).toBeNull();
  });

  it('returns deterministic dry-run plans with zero transport calls', async () => {
    const writes: State[] = [];
    const plan = planMutation(
      'rename',
      current,
      { value: 'after' },
      {
        dryRun: true,
        operationId: 'op-1',
      },
    );
    const result = await executeMutation({
      plan,
      current,
      write: async (proposed) => {
        writes.push(proposed);
        return proposed;
      },
      readBack: async () => current,
      verify: () => true,
    });

    expect(result).toEqual({ outcome: 'planned', plan });
    expect(writes).toEqual([]);
  });

  it('rejects stale versions before duplicate lookup or writes', async () => {
    const calls: string[] = [];
    const plan = planMutation(
      'rename',
      current,
      { value: 'after' },
      {
        ifVersion: 'stale',
        operationId: 'op-2',
      },
    );
    await expect(
      executeMutation({
        plan,
        current,
        findByOperationId: async () => {
          calls.push('find');
          return null;
        },
        write: async (proposed) => {
          calls.push('write');
          return proposed;
        },
        readBack: async () => current,
        verify: () => true,
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION', exitCode: 4 });
    expect(calls).toEqual([]);
  });

  it('reconciles a duplicate operation ID rather than recreating', async () => {
    const recovered: State = {
      value: 'after',
      version: 'v2',
      operationId: 'op-3',
    };
    const calls: string[] = [];
    const result = await executeMutation({
      plan: planMutation(
        'create',
        current,
        { value: 'after' },
        { operationId: 'op-3' },
      ),
      current,
      findByOperationId: async () => {
        calls.push('find');
        return recovered;
      },
      write: async (proposed) => {
        calls.push('write');
        return proposed;
      },
      readBack: async () => recovered,
      verify: (state) => state.value === 'after',
    });
    expect(result).toMatchObject({ outcome: 'recovered', value: recovered });
    expect(calls).toEqual(['find']);
  });

  it('reads back and reports verified success', async () => {
    const written: State = {
      value: 'after',
      version: 'v2',
      operationId: 'op-4',
    };
    const result = await executeMutation({
      plan: planMutation(
        'rename',
        current,
        { value: 'after' },
        { operationId: 'op-4' },
      ),
      current,
      write: async () => written,
      readBack: async () => written,
      verify: (state) => state.value === 'after',
    });
    expect(result).toEqual({ outcome: 'verified', value: written });
  });

  it('returns stable recovery data for read-back mismatch and ambiguous writes', async () => {
    const mismatch = await executeMutation({
      plan: planMutation(
        'rename',
        current,
        { value: 'after' },
        { operationId: 'op-5' },
      ),
      current,
      write: async () => ({ value: 'after', version: 'v2' }),
      readBack: async () => current,
      verify: () => false,
    });
    expect(mismatch).toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'op-5', currentVersion: 'v1' },
    });

    const ambiguous = await executeMutation({
      plan: planMutation(
        'rename',
        current,
        { value: 'after' },
        { operationId: 'op-6' },
      ),
      current,
      write: async () => {
        throw new WorkCliError('TRELLO_MUTATION_AMBIGUOUS', 'timeout', {
          recovery: { requestPath: '/cards/1' },
        });
      },
      readBack: async () => current,
      verify: () => false,
    });
    expect(ambiguous).toMatchObject({
      outcome: 'ambiguous',
      recovery: { operationId: 'op-6', requestPath: '/cards/1' },
    });
  });
});
