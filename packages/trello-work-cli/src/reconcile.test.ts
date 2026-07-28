import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import { reconcileWorkUnit, type ReconcileClient } from './reconcile';
import type { TrelloCard } from './trello-types';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const cardId = '0123456789abcdef01234567';

async function card(
  status: 'inbox' | 'ready' = 'inbox',
  idList = 'list-ready',
): Promise<TrelloCard> {
  const draft = parseWorkUnit(
    await readFile(
      resolve(__dirname, '..', 'test', 'fixtures', 'valid-draft.md'),
      'utf8',
    ),
  );
  const sections = { ...draft.sections };
  delete sections['Open Questions'];
  return {
    id: cardId,
    idShort: 42,
    name: draft.metadata.title,
    desc: renderWorkUnit({
      metadata: {
        ...draft.metadata,
        id: 'WU-42',
        trello_card_id: cardId,
        status,
        created_at: '2026-07-26T12:00:00.000Z',
        updated_at: '2026-07-26T12:00:00.000Z',
      },
      sections,
    }),
    idList,
    dateLastActivity: 'v1',
    shortUrl: 'https://trello.com/c/AbCd1234/work-unit',
  };
}

function config(source: 'description' | 'list'): WorkConfig {
  return {
    credentials: { apiKey: 'key', apiToken: 'token' },
    boardId: 'board-1',
    listIds: { inbox: 'list-inbox', ready: 'list-ready' },
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: source,
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
}

class FakeReconcileClient implements ReconcileClient {
  readonly calls: string[] = [];
  card!: TrelloCard;
  mismatch = false;
  failReadBack = false;
  async getCard(): Promise<TrelloCard> {
    this.calls.push('get');
    if (this.failReadBack && this.calls.includes('update'))
      throw new Error('read failed');
    return this.card;
  }
  async listBoardCards(): Promise<TrelloCard[]> {
    this.calls.push('list');
    return [this.card];
  }
  async updateCard(
    _id: string,
    input: { desc?: string; idList?: string },
  ): Promise<TrelloCard> {
    this.calls.push('update');
    if (!this.mismatch)
      this.card = { ...this.card, ...input, dateLastActivity: 'v2' };
    return this.card;
  }
}

describe('representation reconciliation', () => {
  it('detects drift and previews a deterministic description-authoritative repair', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('inbox', 'list-ready');
    const result = await reconcileWorkUnit(
      cardId,
      config('description'),
      client,
      {
        operationId: 'reconcile-42',
        dryRun: true,
        now: '2026-07-26T12:05:00.000Z',
      },
    );
    expect(result).toMatchObject({
      outcome: 'planned',
      drift: { descriptionStatus: 'inbox', listStatus: 'ready' },
      repair: { source: 'description', targetListId: 'list-inbox' },
    });
    expect(client.calls).toEqual(['get']);
  });

  it('applies only the configured list-authoritative policy and verifies it', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('inbox', 'list-ready');
    const result = await reconcileWorkUnit(cardId, config('list'), client, {
      operationId: 'reconcile-42',
      now: '2026-07-26T12:05:00.000Z',
    });
    expect(result).toMatchObject({
      outcome: 'verified',
      workUnit: {
        metadata: { status: 'ready' },
        card: { idList: 'list-ready' },
      },
    });
    expect(client.calls).toEqual(['get', 'update', 'get']);
  });

  it('is a verified no-op when representations agree', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('ready', 'list-ready');
    await expect(
      reconcileWorkUnit(cardId, config('list'), client, {
        operationId: 'reconcile-42',
      }),
    ).resolves.toMatchObject({ outcome: 'verified', repaired: false });
    expect(client.calls).toEqual(['get']);
  });

  it('replays an exact repair without a fixed clock and detects conflict before no-drift return', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('inbox', 'list-ready');
    await expect(
      reconcileWorkUnit(cardId, config('description'), client, {
        operationId: 'reconcile-replay',
        ifVersion: 'v1',
      }),
    ).resolves.toMatchObject({ outcome: 'verified' });
    client.calls.length = 0;
    await expect(
      reconcileWorkUnit(cardId, config('description'), client, {
        operationId: 'reconcile-replay',
        ifVersion: 'v1',
      }),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(client.calls).toEqual(['get']);
    await expect(
      reconcileWorkUnit(cardId, config('list'), client, {
        operationId: 'reconcile-replay',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { reason: expect.stringContaining('conflict') },
    });
    expect(client.calls).toEqual(['get', 'get']);
  });

  it('fails before mutation when source policy, board, or list mapping is unavailable', async () => {
    const client = new FakeReconcileClient();
    client.card = await card();
    const missingSource = {
      ...config('description'),
      reconcileSource: null,
    } as unknown as WorkConfig;
    await expect(
      reconcileWorkUnit(cardId, missingSource, client, {
        operationId: 'reconcile-42',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILE_POLICY_UNCONFIGURED' });
    expect(client.calls).toEqual([]);

    const missingList = config('description');
    missingList.listIds = {};
    await expect(
      reconcileWorkUnit(cardId, missingList, client, {
        operationId: 'reconcile-42',
      }),
    ).rejects.toMatchObject({ code: 'RECONCILE_POLICY_UNCONFIGURED' });
    expect(client.calls).toEqual([]);
  });

  it('returns partial recovery when an applied repair does not read back', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('inbox', 'list-ready');
    client.mismatch = true;
    await expect(
      reconcileWorkUnit(cardId, config('description'), client, {
        operationId: 'reconcile-42',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'reconcile-42', cardId },
    });
  });
  it('returns partial recovery when repair read-back throws', async () => {
    const client = new FakeReconcileClient();
    client.card = await card('inbox', 'list-ready');
    client.failReadBack = true;
    await expect(
      reconcileWorkUnit(cardId, config('description'), client, {
        operationId: 'reconcile-42',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'reconcile-42', cardId, action: 'reconcile' },
    });
  });
});
