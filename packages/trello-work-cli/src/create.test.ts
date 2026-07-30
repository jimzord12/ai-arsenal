import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import { createWorkUnit, type CreateClient } from './create';
import { WorkCliError } from './errors';
import type { TrelloCard } from './trello-types';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const draftPath = resolve(
  __dirname,
  '..',
  'test',
  'fixtures',
  'valid-draft.md',
);
const cardId = '0123456789abcdef01234567';

function config(configured = true): WorkConfig {
  return {
    credentials: { apiKey: 'key', apiToken: 'token' },
    boardId: configured ? 'board-1' : null,
    listIds: configured ? { inbox: 'list-inbox' } : {},
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
}

class FakeCreateClient implements CreateClient {
  readonly calls: string[] = [];
  cards: TrelloCard[] = [];
  createError?: Error;

  async listBoardCards(): Promise<TrelloCard[]> {
    this.calls.push('list');
    return this.cards;
  }

  async createCard(input: {
    idList: string;
    name: string;
    desc: string;
  }): Promise<TrelloCard> {
    this.calls.push('create');
    if (this.createError) throw this.createError;
    const created: TrelloCard = {
      id: cardId,
      idShort: 42,
      name: input.name,
      desc: input.desc,
      idList: input.idList,
      dateLastActivity: '2026-07-26T12:00:00.000Z',
      shortUrl: 'https://trello.com/c/AbCd1234/work-unit',
    };
    this.cards = [created];
    return created;
  }

  async updateCard(
    id: string,
    input: { name?: string; desc?: string; idList?: string },
  ): Promise<TrelloCard> {
    this.calls.push('update');
    const existing = this.cards.find((card) => card.id === id);
    if (!existing) throw new Error('missing fake card');
    const updated = {
      ...existing,
      ...input,
      dateLastActivity: '2026-07-26T12:01:00.000Z',
    };
    this.cards = [updated];
    return updated;
  }

  async getCard(id: string): Promise<TrelloCard> {
    this.calls.push('get');
    const existing = this.cards.find((card) => card.id === id);
    if (!existing) throw new Error('missing fake card');
    return existing;
  }
}

class AdvancingCreateClient extends FakeCreateClient {
  private updateCount = 0;

  override async updateCard(
    id: string,
    input: { name?: string; desc?: string; idList?: string },
  ): Promise<TrelloCard> {
    const updated = await super.updateCard(id, input);
    this.updateCount += 1;
    const advanced = {
      ...updated,
      dateLastActivity: `2026-07-26T12:0${this.updateCount}:00.000Z`,
    };
    this.cards = [advanced];
    return advanced;
  }
}

describe('verified Inbox creation', () => {
  it('plans a deterministic dry run without any client call or predicted WU ID', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    const result = await createWorkUnit(source, config(false), client, {
      dryRun: true,
      operationId: 'create-42',
    });

    expect(result).toMatchObject({
      outcome: 'planned',
      operationId: 'create-42',
      idStrategy: 'WU-<Trello idShort>',
      missingConfiguration: ['TRELLO_BOARD_ID', 'TRELLO_LIST_INBOX_ID'],
      draft: { metadata: { id: null, status: 'inbox' } },
    });
    expect(JSON.stringify(result)).not.toContain('WU-42');
    expect(client.calls).toEqual([]);
  });

  it('creates exactly one card, derives idShort, persists IDs/timestamps, and verifies read-back', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    const result = await createWorkUnit(source, config(), client, {
      operationId: 'create-42',
    });

    expect(result).toMatchObject({
      outcome: 'verified',
      operationId: 'create-42',
      workUnit: { metadata: { id: 'WU-42', trello_card_id: cardId } },
    });
    expect(client.calls).toEqual(['list', 'create', 'update', 'update', 'get']);
    const persisted = parseWorkUnit(client.cards[0].desc);
    expect(persisted.metadata.created_at).toBe('2026-07-26T12:00:00.000Z');
    expect(persisted.metadata.updated_at).toBe('2026-07-26T12:01:00.000Z');
    expect(persisted.metadata.updated_at).toBe(
      client.cards[0].dateLastActivity,
    );
    expect(client.cards[0]).toMatchObject({
      id: cardId,
      idShort: 42,
      name: persisted.metadata.title,
      idList: 'list-inbox',
    });
    expect(client.cards[0].desc).toContain('work-operation: create-42');
  });

  it('recovers an existing operation ID without creating a duplicate', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    await createWorkUnit(source, config(), client, {
      operationId: 'same-operation',
    });
    client.calls.length = 0;

    const result = await createWorkUnit(source, config(), client, {
      operationId: 'same-operation',
    });
    expect(result).toMatchObject({
      outcome: 'recovered',
      operationId: 'same-operation',
    });
    expect(client.calls).toEqual(['list', 'get']);
  });

  it('recovers a complete card carrying the legacy full create marker', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    await createWorkUnit(source, config(), client, {
      operationId: 'legacy-create',
    });
    const parsed = parseWorkUnit(source);
    const request = {
      operation: 'create',
      title: parsed.metadata.title,
      body: renderWorkUnit(parsed),
      listId: 'list-inbox',
      metadata: parsed.metadata,
    };
    const encoded = Buffer.from(JSON.stringify(request), 'utf8').toString(
      'base64url',
    );
    client.cards[0] = {
      ...client.cards[0],
      desc: client.cards[0].desc.replace(
        /<!-- work-operation: legacy-create v2 [^>]+ -->/,
        `<!-- work-operation: legacy-create ${encoded} -->`,
      ),
    };
    client.calls.length = 0;

    await expect(
      createWorkUnit(source, config(), client, {
        operationId: 'legacy-create',
      }),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(client.calls).toEqual(['list', 'get']);
  });

  it.each([
    ['title', (card: TrelloCard) => ({ ...card, name: 'Drifted title' })],
    ['list', (card: TrelloCard) => ({ ...card, idList: 'list-ready' })],
    [
      'metadata',
      (card: TrelloCard) => ({
        ...card,
        desc: card.desc.replace('priority: normal', 'priority: high'),
      }),
    ],
    [
      'description',
      (card: TrelloCard) => ({
        ...card,
        desc: card.desc.replace(
          'Provide a deterministic command boundary.',
          'Drifted objective.',
        ),
      }),
    ],
  ] as const)(
    'does not recover an exact-marker card with %s drift or create a duplicate',
    async (_kind, drift) => {
      const source = await readFile(draftPath, 'utf8');
      const client = new FakeCreateClient();
      await createWorkUnit(source, config(), client, {
        operationId: 'drift-operation',
      });
      client.cards = [drift(client.cards[0])];
      client.calls.length = 0;

      await expect(
        createWorkUnit(source, config(), client, {
          operationId: 'drift-operation',
        }),
      ).resolves.toMatchObject({
        outcome: 'partial',
        recovery: {
          operationId: 'drift-operation',
          cardId,
          action: 'reconcile',
        },
      });
      expect(client.calls).toEqual(['list', 'get']);
    },
  );

  it('tracks final Trello activity separately from embedded canonical updated_at', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new AdvancingCreateClient();
    const result = await createWorkUnit(source, config(), client, {
      operationId: 'advancing-timestamps',
    });

    expect(result).toMatchObject({
      outcome: 'verified',
      workUnit: {
        metadata: {
          created_at: '2026-07-26T12:00:00.000Z',
          updated_at: '2026-07-26T12:01:00.000Z',
        },
        version: '2026-07-26T12:02:00.000Z',
      },
    });
    expect(parseWorkUnit(client.cards[0].desc).metadata.updated_at).toBe(
      '2026-07-26T12:01:00.000Z',
    );
    expect(client.cards[0].dateLastActivity).toBe('2026-07-26T12:02:00.000Z');
  });

  it('rejects the same operation ID with a different valid draft without writing', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    await createWorkUnit(source, config(), client, {
      operationId: 'same-operation',
    });
    client.calls.length = 0;
    const different = source.replace(
      'Ship a safe Trello Work Unit CLI',
      'Ship another valid Trello CLI',
    );
    await expect(
      createWorkUnit(different, config(), client, {
        operationId: 'same-operation',
      }),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { reason: expect.stringContaining('conflicts') },
    });
    expect(client.calls).toEqual(['list']);
  });

  it('returns ambiguous recovery without blindly retrying a create', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    client.createError = new WorkCliError(
      'TRELLO_MUTATION_AMBIGUOUS',
      'timeout',
    );
    const result = await createWorkUnit(source, config(), client, {
      operationId: 'ambiguous-create',
    });
    expect(result).toMatchObject({
      outcome: 'ambiguous',
      recovery: { operationId: 'ambiguous-create', action: 'reconcile' },
    });
    expect(client.calls).toEqual(['list', 'create']);
  });

  it('fails missing live configuration before any client call', async () => {
    const source = await readFile(draftPath, 'utf8');
    const client = new FakeCreateClient();
    await expect(
      createWorkUnit(source, config(false), client, {
        operationId: 'create-42',
      }),
    ).rejects.toMatchObject({ code: 'TRELLO_CONFIGURATION_MISSING' });
    expect(client.calls).toEqual([]);
  });
});
