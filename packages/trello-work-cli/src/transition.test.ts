import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import type { TrelloCard } from './trello-types';
import { transitionWorkUnit, type TransitionClient } from './transition';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const cardId = '0123456789abcdef01234567';

async function card(): Promise<TrelloCard> {
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
        created_at: '2026-07-26T12:00:00.000Z',
        updated_at: '2026-07-26T12:00:00.000Z',
      },
      sections,
    }),
    idList: 'list-inbox',
    dateLastActivity: 'v1',
    shortUrl: 'https://trello.com/c/AbCd1234/work-unit',
  };
}

function config(configured = true): WorkConfig {
  return {
    credentials: { apiKey: 'key', apiToken: 'token' },
    boardId: configured ? 'board-1' : null,
    listIds: configured
      ? {
          inbox: 'list-inbox',
          in_design: 'list-in-design',
          ready: 'list-ready',
          in_progress: 'list-in-progress',
          review: 'list-review',
          blocked: 'list-blocked',
          done: 'list-done',
        }
      : {},
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: configured
      ? { ...structuredClone(DEFAULT_TRANSITION_GRAPH), inbox: ['ready'] }
      : structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
}

class FakeTransitionClient implements TransitionClient {
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

describe('configured transitions', () => {
  it('updates status and list together then verifies both representations', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();
    const result = await transitionWorkUnit(
      'WU-42',
      'ready',
      config(),
      client,
      {
        operationId: 'transition-42',
        ifVersion: 'v1',
        now: '2026-07-26T12:05:00.000Z',
      },
    );
    expect(result).toMatchObject({
      outcome: 'verified',
      workUnit: {
        metadata: { status: 'ready' },
        card: { idList: 'list-ready' },
      },
    });
    expect(client.calls).toEqual(['list', 'update', 'get']);
  });

  it('rejects In Design to Ready while pending content or Open Questions remain', async () => {
    const client = new FakeTransitionClient();
    const current = await card();
    const document = parseWorkUnit(current.desc);
    client.card = {
      ...current,
      idList: 'list-in-design',
      desc: renderWorkUnit({
        ...document,
        metadata: { ...document.metadata, status: 'in_design' },
        sections: {
          ...document.sections,
          Objective: 'Pending: define the outcome.',
          'Open Questions': '- What evidence is required?',
        },
      }),
    };

    await expect(
      transitionWorkUnit(cardId, 'ready', config(), client, {
        operationId: 'ready-gate-pending',
      }),
    ).rejects.toMatchObject({ code: 'WORK_UNIT_NOT_READY' });
    expect(client.calls).toEqual(['get']);
  });

  it('returns a dry-run plan without writes', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();
    const result = await transitionWorkUnit(cardId, 'ready', config(), client, {
      operationId: 'transition-42',
      dryRun: true,
      now: '2026-07-26T12:05:00.000Z',
    });
    expect(result).toMatchObject({
      outcome: 'planned',
      from: 'inbox',
      to: 'ready',
      targetListId: 'list-ready',
    });
    expect(client.calls).toEqual(['get']);
  });

  it('fails unconfigured or unsupported policy before mutation', async () => {
    const unconfigured = new FakeTransitionClient();
    unconfigured.card = await card();
    await expect(
      transitionWorkUnit(cardId, 'ready', config(false), unconfigured, {
        operationId: 'transition-42',
      }),
    ).rejects.toMatchObject({ code: 'TRANSITION_POLICY_UNCONFIGURED' });
    expect(unconfigured.calls).toEqual([]);

    const unsupported = new FakeTransitionClient();
    unsupported.card = await card();
    await expect(
      transitionWorkUnit(cardId, 'done', config(), unsupported, {
        operationId: 'transition-42',
      }),
    ).rejects.toMatchObject({ code: 'TRANSITION_UNSUPPORTED' });
    expect(unsupported.calls).toEqual(['get']);
  });

  it('reports a partial outcome when read-back does not match', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();
    client.mismatch = true;
    await expect(
      transitionWorkUnit(cardId, 'ready', config(), client, {
        operationId: 'transition-42',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'transition-42', cardId },
    });
  });

  it('returns partial recovery when post-write read-back throws', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();
    client.failReadBack = true;
    await expect(
      transitionWorkUnit(cardId, 'ready', config(), client, {
        operationId: 'transition-42',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'transition-42', cardId, action: 'reconcile' },
    });
  });

  it('recovers an exact replay from the target state without a self-loop or fixed now', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();
    await transitionWorkUnit(cardId, 'ready', config(), client, {
      operationId: 'durable-transition',
      ifVersion: 'v1',
    });
    client.calls.length = 0;
    await expect(
      transitionWorkUnit(cardId, 'ready', config(), client, {
        operationId: 'durable-transition',
        ifVersion: 'v1',
      }),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(client.calls).toEqual(['get']);
  });

  it('supports sequential transitions after rendering ready status', async () => {
    const client = new FakeTransitionClient();
    client.card = await card();

    await expect(
      transitionWorkUnit(cardId, 'ready', config(), client, {
        operationId: 'sequential-ready',
        now: '2026-07-26T12:05:00.000Z',
      }),
    ).resolves.toMatchObject({ outcome: 'verified' });
    await expect(
      transitionWorkUnit(cardId, 'in_progress', config(), client, {
        operationId: 'sequential-in-progress',
        now: '2026-07-26T12:06:00.000Z',
      }),
    ).resolves.toMatchObject({ outcome: 'verified' });
  });
});
