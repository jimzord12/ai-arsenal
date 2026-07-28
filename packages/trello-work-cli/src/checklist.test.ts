import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import { runWorkCli } from './cli';
import { WorkCliError } from './errors';
import type { TrelloClient } from './trello-client';
import {
  checklistCreate,
  checklistItemSet,
  checklistList,
  checklistUpdate,
  type ChecklistClient,
} from './checklist';
import type {
  TrelloBoard,
  TrelloCard,
  TrelloChecklist,
  TrelloChecklistItem,
  TrelloList,
} from './trello-types';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const cardId = '0123456789abcdef01234567';
const checklistId = 'abcdefabcdefabcdefabcdef';
const itemId = '111111111111111111111111';

async function card(): Promise<TrelloCard> {
  const draft = parseWorkUnit(
    await readFile(
      resolve(__dirname, '..', 'test', 'fixtures', 'valid-draft.md'),
      'utf8',
    ),
  );
  return {
    id: cardId,
    idShort: 42,
    name: draft.metadata.title,
    desc: renderWorkUnit({
      ...draft,
      metadata: {
        ...draft.metadata,
        id: 'WU-42',
        trello_card_id: cardId,
        created_at: '2026-07-26T12:00:00.000Z',
        updated_at: '2026-07-26T12:00:00.000Z',
      },
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
          ready: 'list-ready',
          in_progress: 'list-in-progress',
          review: 'list-review',
          blocked: 'list-blocked',
          done: 'list-done',
        }
      : {},
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
}

class FakeChecklistClient implements ChecklistClient {
  readonly calls: string[] = [];
  card!: TrelloCard;
  checklists: TrelloChecklist[] = [];
  mismatch = false;
  failReadBack = false;
  createError?: WorkCliError;

  async getBoard(id: string): Promise<TrelloBoard> {
    return { id, name: 'Testing' };
  }
  async listBoardLists(id: string): Promise<TrelloList[]> {
    return Object.entries(CANONICAL_LIST_NAMES).map(
      ([status, name], index) => ({
        id: `list-${status.replace('_', '-')}`,
        idBoard: id,
        name,
        pos: (index + 1) * 1024,
        closed: false,
      }),
    );
  }

  async getCard(): Promise<TrelloCard> {
    this.calls.push('get-card');
    return this.card;
  }
  async listBoardCards(): Promise<TrelloCard[]> {
    this.calls.push('list-cards');
    return [this.card];
  }
  async listChecklists(): Promise<TrelloChecklist[]> {
    this.calls.push('list-checklists');
    if (
      this.failReadBack &&
      this.calls.some((call) => ['create', 'update', 'item-set'].includes(call))
    )
      throw new Error('read failed');
    return this.checklists;
  }
  async createChecklist(
    _cardId: string,
    name: string,
  ): Promise<TrelloChecklist> {
    this.calls.push('create');
    if (this.createError) throw this.createError;
    const created = { id: checklistId, idCard: cardId, name, checkItems: [] };
    if (!this.mismatch) this.checklists = [created];
    return created;
  }
  async updateChecklist(id: string, name: string): Promise<TrelloChecklist> {
    this.calls.push('update');
    const current = this.checklists.find((checklist) => checklist.id === id)!;
    const updated = { ...current, name };
    if (!this.mismatch) this.checklists = [updated];
    return updated;
  }
  async updateCard(_id: string, input: { desc?: string }): Promise<TrelloCard> {
    this.calls.push('record');
    this.card = { ...this.card, ...input, dateLastActivity: 'v2' };
    return this.card;
  }
  async setChecklistItemState(
    _cardId: string,
    id: string,
    checked: boolean,
  ): Promise<TrelloChecklistItem> {
    this.calls.push('item-set');
    const item = this.checklists[0].checkItems.find(
      (candidate) => candidate.id === id,
    )!;
    const updated = {
      ...item,
      state: checked ? ('complete' as const) : ('incomplete' as const),
    };
    if (!this.mismatch) this.checklists[0].checkItems = [updated];
    return updated;
  }
}

const options = { operationId: 'checklist-42', ifVersion: 'v1' };

async function setup(withChecklist = false): Promise<FakeChecklistClient> {
  const client = new FakeChecklistClient();
  client.card = await card();
  if (withChecklist) {
    client.checklists = [
      {
        id: checklistId,
        idCard: cardId,
        name: 'Verification',
        checkItems: [{ id: itemId, name: 'Tests', state: 'incomplete' }],
      },
    ];
  }
  return client;
}

describe('basic checklist operations', () => {
  it('lists stable checklist and item IDs without mutation', async () => {
    const client = await setup(true);
    await expect(
      checklistList(cardId, config(), client),
    ).resolves.toMatchObject({
      checklists: [{ id: checklistId, checkItems: [{ id: itemId }] }],
    });
    expect(client.calls).toEqual(['get-card', 'list-checklists']);
  });

  it('creates one named checklist and verifies it, while dry-run writes nothing', async () => {
    const dry = await setup();
    await expect(
      checklistCreate(cardId, 'Verification', config(), dry, {
        ...options,
        dryRun: true,
      }),
    ).resolves.toMatchObject({ outcome: 'planned', name: 'Verification' });
    expect(dry.calls).toEqual(['get-card', 'list-checklists']);

    const live = await setup();
    await expect(
      checklistCreate(cardId, 'Verification', config(), live, options),
    ).resolves.toMatchObject({
      outcome: 'verified',
      checklist: { id: checklistId, name: 'Verification' },
    });
    expect(live.calls).toEqual([
      'get-card',
      'list-checklists',
      'create',
      'list-checklists',
      'record',
    ]);
  });

  it('renames by stable checklist ID and sets an item by stable item ID', async () => {
    const client = await setup(true);
    await expect(
      checklistUpdate(
        cardId,
        checklistId,
        'Release checks',
        config(),
        client,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'verified',
      checklist: { name: 'Release checks' },
    });
    await expect(
      checklistItemSet(cardId, checklistId, itemId, true, config(), client, {
        ...options,
        operationId: 'checklist-item-42',
        ifVersion: 'v2',
      }),
    ).resolves.toMatchObject({
      outcome: 'verified',
      item: { id: itemId, state: 'complete' },
    });
    expect(client.calls.filter((call) => call === 'update')).toHaveLength(1);
    expect(client.calls.filter((call) => call === 'item-set')).toHaveLength(1);
  });

  it('rejects display names, invalid payloads, stale versions, and missing configuration before writes', async () => {
    const client = await setup(true);
    await expect(
      checklistUpdate(cardId, 'Verification', 'New', config(), client, options),
    ).rejects.toMatchObject({ code: 'INVALID_CHECKLIST_ID' });
    await expect(
      checklistItemSet(
        cardId,
        checklistId,
        'Tests',
        true,
        config(),
        client,
        options,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CHECKLIST_ITEM_ID' });
    await expect(
      checklistCreate(cardId, '  ', config(), client, options),
    ).rejects.toMatchObject({ code: 'INVALID_CHECKLIST_NAME' });
    await expect(
      checklistUpdate(cardId, checklistId, 'New', config(), client, {
        ...options,
        ifVersion: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
    const writes = client.calls.filter((call) =>
      ['create', 'update', 'item-set'].includes(call),
    );
    expect(writes).toEqual([]);

    const missing = await setup();
    await expect(
      checklistCreate(cardId, 'Verification', config(false), missing, options),
    ).rejects.toMatchObject({ code: 'TRELLO_CONFIGURATION_MISSING' });
    expect(missing.calls).toEqual([]);
  });

  it('returns partial recovery on checklist verification mismatch and creates no automatic checklist', async () => {
    const client = await setup();
    client.mismatch = true;
    await expect(
      checklistCreate(cardId, 'Verification', config(), client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'checklist-42', cardId, action: 'reconcile' },
    });
    expect(client.checklists).toEqual([]);
  });
  it('does not recover checklist creation by display name alone', async () => {
    const client = await setup(true);
    await expect(
      checklistCreate(cardId, 'Verification', config(), client, options),
    ).resolves.not.toMatchObject({ outcome: 'recovered' });
  });

  it('durably replays and conflicts write-free through fresh clients for all mutation families', async () => {
    const cases = [
      {
        seed: false,
        exact: (client: FakeChecklistClient) =>
          checklistCreate(cardId, 'New', config(), client, options),
        conflict: (client: FakeChecklistClient) =>
          checklistCreate(cardId, 'Other', config(), client, options),
      },
      {
        seed: true,
        exact: (client: FakeChecklistClient) =>
          checklistUpdate(
            cardId,
            checklistId,
            'New',
            config(),
            client,
            options,
          ),
        conflict: (client: FakeChecklistClient) =>
          checklistUpdate(
            cardId,
            checklistId,
            'Other',
            config(),
            client,
            options,
          ),
      },
      {
        seed: true,
        exact: (client: FakeChecklistClient) =>
          checklistItemSet(
            cardId,
            checklistId,
            itemId,
            true,
            config(),
            client,
            options,
          ),
        conflict: (client: FakeChecklistClient) =>
          checklistItemSet(
            cardId,
            checklistId,
            itemId,
            false,
            config(),
            client,
            options,
          ),
      },
    ];
    for (const testCase of cases) {
      const original = await setup(testCase.seed);
      await expect(testCase.exact(original)).resolves.toMatchObject({
        outcome: 'verified',
      });
      const fresh = await setup();
      fresh.card = structuredClone(original.card);
      fresh.checklists = structuredClone(original.checklists);
      await expect(testCase.exact(fresh)).resolves.toMatchObject({
        outcome: 'recovered',
      });
      await expect(testCase.conflict(fresh)).resolves.toMatchObject({
        outcome: 'partial',
        recovery: { reason: expect.stringContaining('conflicts') },
      });
      expect(
        fresh.calls.filter((call) =>
          ['create', 'update', 'item-set', 'record'].includes(call),
        ),
      ).toEqual([]);
    }
  });

  it('returns partial recovery for every checklist post-write read-back exception', async () => {
    for (const kind of ['create', 'update', 'item'] as const) {
      const client = await setup(kind !== 'create');
      client.failReadBack = true;
      const result =
        kind === 'create'
          ? checklistCreate(cardId, 'New', config(), client, options)
          : kind === 'update'
            ? checklistUpdate(
                cardId,
                checklistId,
                'New',
                config(),
                client,
                options,
              )
            : checklistItemSet(
                cardId,
                checklistId,
                itemId,
                true,
                config(),
                client,
                options,
              );
      await expect(result).resolves.toMatchObject({
        outcome: 'partial',
        recovery: { operationId: 'checklist-42', cardId, action: 'reconcile' },
      });
    }
  });
});

describe('production checklist CLI boundary', () => {
  const args = (extra: string[]) => [
    'checklist',
    'create',
    cardId,
    '--name',
    'CLI checks',
    '--board',
    '111111111111111111111111',
    '--operation-id',
    'cli-checklist',
    '--output',
    'json',
    ...extra,
  ];
  const dependencies = (client: FakeChecklistClient) => ({
    config: config(),
    client: client as unknown as TrelloClient,
  });

  it('routes real planned, verified, recovered, partial, and ambiguous handler shapes', async () => {
    const dry = await setup();
    await expect(
      runWorkCli(args(['--dry-run']), dependencies(dry)),
    ).resolves.toMatchObject({ exitCode: 0, stderr: '' });
    const live = await setup();
    await expect(
      runWorkCli(args([]), dependencies(live)),
    ).resolves.toMatchObject({ exitCode: 0, stderr: '' });
    await expect(
      runWorkCli(args([]), dependencies(live)),
    ).resolves.toMatchObject({ exitCode: 0, stderr: '' });
    const partialClient = await setup();
    partialClient.mismatch = true;
    await expect(
      runWorkCli(args([]), dependencies(partialClient)),
    ).resolves.toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('MUTATION_PARTIAL'),
    });
    const ambiguousClient = await setup();
    ambiguousClient.createError = new WorkCliError(
      'TRELLO_MUTATION_AMBIGUOUS',
      'timeout',
    );
    await expect(
      runWorkCli(args([]), dependencies(ambiguousClient)),
    ).resolves.toMatchObject({
      exitCode: 1,
      stdout: '',
      stderr: expect.stringContaining('MUTATION_AMBIGUOUS'),
    });
  });
});
