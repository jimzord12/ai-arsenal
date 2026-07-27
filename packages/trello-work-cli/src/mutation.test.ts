import { WorkCliError } from './errors';
import { executeMutation, planMutation } from './mutation';

type State = { value: string; version: string; operationId?: string };

const current: State = { value: 'before', version: 'v1' };

describe('mutation planning and execution', () => {
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
