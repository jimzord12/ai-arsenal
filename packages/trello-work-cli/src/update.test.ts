import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import type { TrelloCard } from './trello-types';
import {
  descriptionPatch,
  descriptionReplace,
  metadataUpdate,
  type UpdateClient,
} from './update';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const cardId = '0123456789abcdef01234567';
const draftPath = resolve(
  __dirname,
  '..',
  'test',
  'fixtures',
  'valid-draft.md',
);

function config(): WorkConfig {
  return {
    credentials: { apiKey: 'key', apiToken: 'token' },
    boardId: 'board-1',
    listIds: { inbox: 'list-inbox' },
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
}

async function persistedCard(): Promise<TrelloCard> {
  const draft = parseWorkUnit(await readFile(draftPath, 'utf8'));
  const desc = renderWorkUnit({
    ...draft,
    metadata: {
      ...draft.metadata,
      id: 'WU-42',
      trello_card_id: cardId,
      created_at: '2026-07-26T12:00:00.000Z',
      updated_at: '2026-07-26T12:00:00.000Z',
    },
  });
  return {
    id: cardId,
    idShort: 42,
    name: draft.metadata.title,
    desc,
    idList: 'list-inbox',
    dateLastActivity: 'v1',
    shortUrl: 'https://trello.com/c/AbCd1234/work-unit',
  };
}

class FakeUpdateClient implements UpdateClient {
  readonly calls: string[] = [];
  card!: TrelloCard;
  mismatch = false;
  failReadBack = false;

  async getCard(): Promise<TrelloCard> {
    this.calls.push('get');
    if (this.failReadBack && this.calls.includes('update'))
      throw new Error('secret read failure');
    return this.card;
  }
  async listBoardCards(): Promise<TrelloCard[]> {
    this.calls.push('list');
    return [this.card];
  }
  async updateCard(
    _id: string,
    input: { name?: string; desc?: string },
  ): Promise<TrelloCard> {
    this.calls.push('update');
    if (!this.mismatch)
      this.card = { ...this.card, ...input, dateLastActivity: 'v2' };
    return this.card;
  }
}

async function setup(): Promise<FakeUpdateClient> {
  const client = new FakeUpdateClient();
  client.card = await persistedCard();
  return client;
}

const options = {
  operationId: 'update-42',
  now: '2026-07-26T12:05:00.000Z',
};

describe('metadata and description mutations', () => {
  it('applies an authority-checked metadata patch and verifies it', async () => {
    const client = await setup();
    const result = await metadataUpdate(
      cardId,
      { priority: 'high', owner: 'jim' },
      config(),
      client,
      options,
    );
    expect(result).toMatchObject({
      outcome: 'verified',
      workUnit: {
        metadata: { priority: 'high', owner: 'jim', updated_at: options.now },
      },
    });
    expect(client.calls).toEqual(['get', 'update', 'get']);
  });

  it.each([{ status: 'done' }, { id: 'WU-99' }, { unknown: true }])(
    'rejects protected or unknown metadata patch %# before writing',
    async (patch) => {
      const client = await setup();
      await expect(
        metadataUpdate(cardId, patch, config(), client, options),
      ).rejects.toMatchObject({ code: 'INVALID_WORK_UNIT' });
      expect(client.calls).toEqual(['get']);
    },
  );

  it('rejects stale versions before writing', async () => {
    const client = await setup();
    await expect(
      metadataUpdate(cardId, { priority: 'high' }, config(), client, {
        ...options,
        ifVersion: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION', exitCode: 4 });
    expect(client.calls).toEqual(['get']);
  });

  it('replaces a valid description but rejects system-field changes', async () => {
    const client = await setup();
    const current = parseWorkUnit(client.card.desc);
    const replacement = renderWorkUnit({
      ...current,
      sections: { ...current.sections, Scope: 'Replacement scope.' },
    });
    await expect(
      descriptionReplace(cardId, replacement, config(), client, options),
    ).resolves.toMatchObject({
      outcome: 'verified',
      workUnit: { sections: { Scope: 'Replacement scope.' } },
    });

    const latest = parseWorkUnit(client.card.desc);
    const safeSections = { ...latest.sections };
    delete safeSections['Open Questions'];
    const unsafe = renderWorkUnit({
      ...latest,
      sections: safeSections,
      metadata: { ...latest.metadata, status: 'done' },
    });
    client.calls.length = 0;
    await expect(
      descriptionReplace(cardId, unsafe, config(), client, options),
    ).rejects.toMatchObject({ code: 'SYSTEM_FIELD_CHANGE_FORBIDDEN' });
    expect(client.calls).toEqual(['get']);
  });

  it('patches one known section and rejects headings or unknown sections', async () => {
    const client = await setup();
    await expect(
      descriptionPatch(
        cardId,
        'Verification',
        'Run every focused test.',
        config(),
        client,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'verified',
      workUnit: { sections: { Verification: 'Run every focused test.' } },
    });

    client.calls.length = 0;
    await expect(
      descriptionPatch(cardId, 'Unknown', 'content', config(), client, options),
    ).rejects.toMatchObject({ code: 'INVALID_SECTION' });
    await expect(
      descriptionPatch(
        cardId,
        'Scope',
        '## Context\nunsafe',
        config(),
        client,
        options,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_SECTION_CONTENT' });
    expect(client.calls).toEqual([]);
  });

  it('returns partial recovery data on read-back mismatch', async () => {
    const client = await setup();
    client.mismatch = true;
    const result = await metadataUpdate(
      cardId,
      { priority: 'high' },
      config(),
      client,
      options,
    );
    expect(result).toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'update-42', cardId },
    });
  });

  it('replays the same exact operation without writing and conflicts on a changed request', async () => {
    const client = await setup();
    const replayOptions = { ...options, ifVersion: 'v1' };
    await metadataUpdate(
      cardId,
      { priority: 'high' },
      config(),
      client,
      replayOptions,
    );
    client.calls.length = 0;
    await expect(
      metadataUpdate(
        cardId,
        { priority: 'high' },
        config(),
        client,
        replayOptions,
      ),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(client.calls).toEqual(['get']);
    await expect(
      metadataUpdate(cardId, { priority: 'low' }, config(), client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'update-42' },
    });
    expect(client.calls).toEqual(['get', 'get']);
  });

  it('does not recover a matching operation marker when current state drifted', async () => {
    const client = await setup();
    await metadataUpdate(
      cardId,
      { priority: 'high' },
      config(),
      client,
      options,
    );
    client.card = { ...client.card, name: 'Drifted title' };
    client.calls.length = 0;
    await expect(
      metadataUpdate(cardId, { priority: 'high' }, config(), client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'update-42', cardId },
    });
    expect(client.calls).toEqual(['get']);
  });

  it('sanitizes post-write read-back exceptions into partial recovery', async () => {
    const client = await setup();
    client.failReadBack = true;
    await expect(
      metadataUpdate(cardId, { priority: 'high' }, config(), client, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'update-42', cardId, action: 'reconcile' },
    });
  });
});
