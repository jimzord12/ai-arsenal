import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import { startDesign, type DesignClient } from './design';
import { WorkCliError } from './errors';
import type { TrelloCard } from './trello-types';

const original: TrelloCard = {
  id: '0123456789abcdef01234567',
  idShort: 42,
  name: 'Investigate onboarding',
  desc: 'Plain intake notes.',
  idList: 'inbox',
  dateLastActivity: '2026-07-28T12:00:00.000Z',
  shortUrl: 'https://trello.com/c/AbCd1234/card',
  members: [],
};
const config: WorkConfig = {
  credentials: { apiKey: null, apiToken: null },
  boardId: 'board',
  listIds: { inbox: 'inbox', in_design: 'design' },
  listNames: { ...CANONICAL_LIST_NAMES },
  transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
  reconcileSource: 'description',
  loadedHermesEnv: false,
  hermesEnvPath: null,
};

class FakeDesignClient implements DesignClient {
  current = { ...original };
  writes = 0;
  ambiguous = false;
  failReadBack = false;
  corruptReadBack = false;

  async getCard(): Promise<TrelloCard> {
    if (this.failReadBack && this.writes > 0) throw new Error('read failed');
    return this.corruptReadBack && this.writes > 0
      ? { ...this.current, idList: 'inbox' }
      : this.current;
  }
  async listBoardCards(): Promise<TrelloCard[]> {
    return [this.current];
  }
  async updateCard(
    id: string,
    input: { desc?: string; idList?: string; name?: string },
  ): Promise<TrelloCard> {
    this.writes += 1;
    if (this.ambiguous) {
      throw new WorkCliError('TRELLO_MUTATION_AMBIGUOUS', 'unclear write');
    }
    this.current = {
      ...this.current,
      ...input,
      id,
      dateLastActivity: '2026-07-28T12:01:00.000Z',
    };
    return this.current;
  }
}

async function template(): Promise<string> {
  return readFile(
    resolve(__dirname, '..', 'test', 'fixtures', 'valid-draft.md'),
    'utf8',
  );
}

describe('design start', () => {
  it('converts an ordinary Inbox card in place into canonical In Design content', async () => {
    const client = new FakeDesignClient();
    const result = await startDesign(
      original.id,
      await template(),
      config,
      client,
      {
        operationId: 'design-start-1',
        ifVersion: original.dateLastActivity,
        now: '2026-07-28T12:01:00.000Z',
      },
    );
    expect(result).toMatchObject({
      outcome: 'verified',
      workUnit: { metadata: { status: 'in_design' } },
    });
    expect(client.current).toMatchObject({ id: original.id, idList: 'design' });
    expect(client.writes).toBe(1);
  });

  it('recovers an identical replay on the same card without another write', async () => {
    const client = new FakeDesignClient();
    const source = await template();
    const options = {
      operationId: 'design-replay-1',
      ifVersion: original.dateLastActivity,
      now: '2026-07-28T12:01:00.000Z',
    };
    await startDesign(original.id, source, config, client, options);
    await expect(
      startDesign(original.id, source, config, client, options),
    ).resolves.toMatchObject({
      outcome: 'recovered',
      workUnit: { card: { id: original.id } },
    });
    expect(client.writes).toBe(1);
  });

  it('reports operation collision for changed intent without another write', async () => {
    const client = new FakeDesignClient();
    const source = await template();
    const options = { operationId: 'design-collision-1' };
    await startDesign(original.id, source, config, client, options);
    const changed = source.replace(
      'Provide a deterministic command boundary.',
      'Define a changed outcome.',
    );
    await expect(
      startDesign(original.id, changed, config, client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: options.operationId, cardId: original.id },
    });
    expect(client.writes).toBe(1);
  });

  it('rejects a board-wide operation ID collision on another card without writing', async () => {
    const client = new FakeDesignClient();
    const source = await template();
    const options = { operationId: 'design-board-collision-1' };
    await startDesign(original.id, source, config, client, options);
    const first = { ...client.current };
    const second = {
      ...original,
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      idShort: 43,
      name: 'Another intake',
    };
    client.current = second;
    client.listBoardCards = async () => [first, second];

    await expect(
      startDesign(second.id, source, config, client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: second.id,
        conflictingCardId: first.id,
      },
    });
    expect(client.writes).toBe(1);
  });

  it('checks version before the first write', async () => {
    const client = new FakeDesignClient();
    await expect(
      startDesign(original.id, await template(), config, client, {
        operationId: 'design-stale-1',
        ifVersion: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(client.writes).toBe(0);
  });

  it('returns credential-free ambiguous recovery without retrying the write', async () => {
    const client = new FakeDesignClient();
    client.ambiguous = true;
    await expect(
      startDesign(original.id, await template(), config, client, {
        operationId: 'design-ambiguous-1',
      }),
    ).resolves.toEqual({
      outcome: 'ambiguous',
      recovery: {
        operationId: 'design-ambiguous-1',
        cardId: original.id,
        action: 'reconcile',
      },
    });
    expect(client.writes).toBe(1);
  });

  it.each(['wrong state', 'read failure'])(
    'returns partial recovery when post-write read-back has %s',
    async (failure) => {
      const client = new FakeDesignClient();
      client.corruptReadBack = failure === 'wrong state';
      client.failReadBack = failure === 'read failure';
      await expect(
        startDesign(original.id, await template(), config, client, {
          operationId: `design-read-back-${failure.replace(' ', '-')}`,
        }),
      ).resolves.toMatchObject({
        outcome: 'partial',
        recovery: { cardId: original.id, action: 'reconcile' },
      });
      expect(client.writes).toBe(1);
    },
  );
});
