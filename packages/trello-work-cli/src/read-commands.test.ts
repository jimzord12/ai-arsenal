import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from './config';
import {
  doctor,
  getWorkUnit,
  listInboxCards,
  listWorkUnits,
  validateLocalWorkUnit,
  validateRemoteWorkUnit,
  type ReadCommandClient,
} from './read-commands';
import type { TrelloAttachment, TrelloCard, TrelloList } from './trello-types';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

const cardId = '0123456789abcdef01234567';
const draftPath = resolve(
  __dirname,
  '..',
  'test',
  'fixtures',
  'valid-draft.md',
);

async function persistedDescription(
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const draft = parseWorkUnit(await readFile(draftPath, 'utf8'));
  return renderWorkUnit({
    ...draft,
    metadata: {
      ...draft.metadata,
      id: 'WU-42',
      trello_card_id: cardId,
      created_at: '2026-07-26T12:00:00.000Z',
      updated_at: '2026-07-26T12:00:00.000Z',
      ...overrides,
    },
  });
}

function config(overrides: Partial<WorkConfig> = {}): WorkConfig {
  return {
    credentials: { apiKey: 'present', apiToken: 'present' },
    boardId: 'board-1',
    listIds: { inbox: 'list-inbox', ready: 'list-ready' },
    listNames: { ...CANONICAL_LIST_NAMES },
    transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
    ...overrides,
  };
}

function fakeClient(
  cards: TrelloCard[],
  lists: TrelloList[] = [],
): ReadCommandClient & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    async getMemberMe() {
      calls.push('getMemberMe');
      return { id: 'member-1', username: 'jim' };
    },
    async getBoard(id) {
      calls.push(`getBoard:${id}`);
      return { id, name: 'Work' };
    },
    async listBoardLists(id) {
      calls.push(`listBoardLists:${id}`);
      return lists;
    },
    async listBoardCards(id) {
      calls.push(`listBoardCards:${id}`);
      return cards;
    },
    async getCard(reference) {
      calls.push(`getCard:${reference}`);
      const card = cards.find(
        (candidate) =>
          candidate.id === reference || candidate.shortUrl.includes(reference),
      );
      if (!card) throw new Error('missing fake card');
      return card;
    },
    async listCardAttachments(id) {
      calls.push(`listCardAttachments:${id}`);
      return [];
    },
    async downloadAttachment(url) {
      calls.push(`downloadAttachment:${url}`);
      throw new Error('unexpected attachment download');
    },
  };
}

async function card(overrides: Partial<TrelloCard> = {}): Promise<TrelloCard> {
  return {
    id: cardId,
    idShort: 42,
    name: 'Ship a safe Trello Work Unit CLI',
    desc: await persistedDescription(),
    idList: 'list-inbox',
    dateLastActivity: '2026-07-26T12:01:00.000Z',
    shortUrl: 'https://trello.com/c/AbCd1234/work-unit',
    members: [],
    ...overrides,
  };
}

describe('read-only commands', () => {
  it('validates a local draft without a client', async () => {
    const source = await readFile(draftPath, 'utf8');
    expect(validateLocalWorkUnit(source)).toMatchObject({
      valid: true,
      kind: 'draft',
    });
  });

  it('resolves WU IDs, normalizes get results, and validates remote cards', async () => {
    const remote = await card();
    const client = fakeClient([remote]);

    await expect(getWorkUnit('WU-42', config(), client)).resolves.toMatchObject(
      {
        version: remote.dateLastActivity,
        metadata: { id: 'WU-42', trello_card_id: cardId },
        attachmentCount: 0,
        attachments: [],
      },
    );
    await expect(
      validateRemoteWorkUnit(cardId, config(), client),
    ).resolves.toMatchObject({
      valid: true,
      kind: 'persisted',
      findings: [],
    });
    expect(client.calls).toEqual([
      'listBoardCards:board-1',
      `listCardAttachments:${cardId}`,
      `getCard:${cardId}`,
    ]);
  });

  it('adds ordered attachment metadata and count to get without downloading by default', async () => {
    const remote = await card();
    const attachments: TrelloAttachment[] = [
      {
        id: 'attachment-1',
        name: 'evidence.bin',
        url: 'https://trello.com/1/cards/card/attachments/attachment-1/download/evidence.bin',
        mimeType: 'application/octet-stream',
        bytes: 5,
        date: '2026-07-29T10:00:00.000Z',
        isUpload: true,
      },
      {
        id: 'attachment-2',
        name: 'reference',
        url: 'https://example.com/reference',
        mimeType: 'text/html',
        bytes: 0,
        date: '2026-07-29T10:01:00.000Z',
        isUpload: false,
      },
    ];
    const downloadAttachment = jest.fn();
    const client = {
      ...fakeClient([remote]),
      listCardAttachments: jest.fn(async () => attachments),
      downloadAttachment,
    };

    await expect(getWorkUnit('WU-42', config(), client)).resolves.toMatchObject(
      {
        attachmentCount: 2,
        attachments: [
          { id: 'attachment-1', urlType: 'uploaded', downloaded: false },
          { id: 'attachment-2', urlType: 'external', downloaded: false },
        ],
      },
    );
    expect(client.listCardAttachments).toHaveBeenCalledWith(remote.id);
    expect(downloadAttachment).not.toHaveBeenCalled();
  });

  it('downloads uploaded attachments when get receives an explicit destination', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-get-attachments-'));
    const remote = await card();
    const attachment: TrelloAttachment = {
      id: 'attachment-1',
      name: 'evidence.bin',
      url: 'https://trello.com/1/cards/card/attachments/attachment-1/download/evidence.bin',
      mimeType: 'application/octet-stream',
      bytes: 3,
      date: '2026-07-29T10:00:00.000Z',
      isUpload: true,
    };
    const client = {
      ...fakeClient([remote]),
      listCardAttachments: jest.fn(async () => [attachment]),
      downloadAttachment: jest.fn(async () => Uint8Array.from([0, 255, 1])),
    };
    try {
      const result = await getWorkUnit('WU-42', config(), client, {
        attachmentsDirectory: root,
      });

      expect(result.attachments[0]).toMatchObject({
        downloaded: true,
        downloadedPath: join(root, attachment.name),
      });
      await expect(readFile(join(root, attachment.name))).resolves.toEqual(
        Buffer.from([0, 255, 1]),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns deterministic structured remote validation findings without writes', async () => {
    const drifted = await card({
      idShort: 43,
      name: 'Wrong title',
      idList: 'list-ready',
    });
    await expect(
      validateRemoteWorkUnit(cardId, config(), fakeClient([drifted])),
    ).resolves.toMatchObject({
      valid: false,
      findings: [
        { code: 'REMOTE_ID_PAIRING_MISMATCH' },
        { code: 'REMOTE_TITLE_MISMATCH' },
        { code: 'REMOTE_STATUS_LIST_DRIFT' },
      ],
    });
    const malformed = await card({ desc: '# Work Unit\n' });
    await expect(
      validateRemoteWorkUnit(cardId, config(), fakeClient([malformed])),
    ).resolves.toMatchObject({
      valid: false,
      findings: [{ code: 'REMOTE_STRUCTURE_INVALID' }],
    });
  });

  it('fails closed for malformed or mismatched remote cards', async () => {
    const malformed = await card({ desc: '# Work Unit\n' });
    await expect(
      getWorkUnit(cardId, config(), fakeClient([malformed])),
    ).rejects.toMatchObject({ code: 'INVALID_REMOTE_WORK_UNIT' });

    const mismatched = await card({ idShort: 43 });
    await expect(
      getWorkUnit(cardId, config(), fakeClient([mismatched])),
    ).rejects.toMatchObject({ code: 'INVALID_REMOTE_WORK_UNIT' });
  });

  it('serializes all supported list filters against normalized metadata', async () => {
    const matching = await card();
    const other = await card({
      id: 'abcdefabcdefabcdefabcdef',
      idShort: 43,
      desc: await persistedDescription({
        id: 'WU-43',
        trello_card_id: 'abcdefabcdefabcdefabcdef',
        priority: 'low',
        labels: ['other'],
      }),
    });
    const result = await listWorkUnits(
      {
        status: 'inbox',
        type: 'task',
        priority: 'normal',
        owner: null,
        parent: null,
        label: 'trello',
      },
      config(),
      fakeClient([matching, other]),
    );
    expect(result.items.map((item) => item.metadata.id)).toEqual(['WU-42']);
    expect(result.filters).toEqual({
      status: 'inbox',
      type: 'task',
      priority: 'normal',
      owner: null,
      parent: null,
      label: 'trello',
    });
  });

  it('filters native card members separately from exact metadata owner', async () => {
    const matching = await card({
      desc: await persistedDescription({ owner: 'codex:worker-1' }),
      members: [
        { id: 'member-1', username: 'Dev-One', fullName: 'Developer One' },
      ],
    });
    const other = await card({
      id: 'abcdefabcdefabcdefabcdef',
      idShort: 43,
      desc: await persistedDescription({
        id: 'WU-43',
        trello_card_id: 'abcdefabcdefabcdefabcdef',
        owner: 'codex:worker-2',
      }),
      members: [{ id: 'member-2', username: 'alex', fullName: 'Alex Example' }],
    });
    const client = fakeClient([matching, other]);

    await expect(
      listWorkUnits({ member: 'dev-one' }, config(), client),
    ).resolves.toMatchObject({
      filters: { member: 'dev-one' },
      items: [{ card: { members: [{ id: 'member-1' }] } }],
    });
    await expect(
      listWorkUnits({ member: 'MEMBER-1' }, config(), client),
    ).resolves.toMatchObject({ items: [{ metadata: { id: 'WU-42' } }] });
    await expect(
      listWorkUnits({ owner: 'codex:worker-1' }, config(), client),
    ).resolves.toMatchObject({ items: [{ metadata: { id: 'WU-42' } }] });
    await expect(
      listWorkUnits(
        { member: 'dev-one', owner: 'codex:worker-1' },
        config(),
        client,
      ),
    ).resolves.toMatchObject({ items: [{ metadata: { id: 'WU-42' } }] });
    await expect(
      listWorkUnits(
        { member: 'dev-one', owner: 'codex:worker-2' },
        config(),
        client,
      ),
    ).resolves.toMatchObject({ items: [] });
    await expect(
      listWorkUnits({ member: 'Developer One' }, config(), client),
    ).resolves.toMatchObject({ items: [] });
    await expect(
      listWorkUnits({ member: 'dev' }, config(), client),
    ).resolves.toMatchObject({
      items: [],
    });
    await expect(
      listWorkUnits(
        { member: 'dev-one' },
        config(),
        fakeClient([await card()]),
      ),
    ).resolves.toMatchObject({ items: [] });
  });

  it('lists ordinary Inbox cards while Work Unit listing skips them', async () => {
    const ordinary = await card({
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      idShort: 44,
      name: 'Investigate onboarding',
      desc: 'A plain Trello intake note.',
    });
    const persisted = await card();
    const client = fakeClient([ordinary, persisted]);

    await expect(listInboxCards(config(), client)).resolves.toMatchObject({
      items: [
        { id: ordinary.id, kind: 'ordinary', members: [] },
        { id: persisted.id, kind: 'work-unit', members: [] },
      ],
    });
    await expect(listWorkUnits({}, config(), client)).resolves.toMatchObject({
      items: [{ metadata: { id: 'WU-42' } }],
    });
  });

  it('rejects malformed Inbox cards that retain a durable operation marker', async () => {
    const malformed = await card({
      desc: 'Damaged content\n<!-- work-operation: design-start-1 deadbeef -->',
    });
    const client = fakeClient([malformed]);

    await expect(listInboxCards(config(), client)).rejects.toMatchObject({
      code: 'INVALID_REMOTE_WORK_UNIT',
    });
  });

  it('fails board-dependent reads before any client call when unconfigured', async () => {
    const client = fakeClient([]);
    await expect(
      listWorkUnits({}, config({ boardId: null }), client),
    ).rejects.toMatchObject({ code: 'TRELLO_CONFIGURATION_MISSING' });
    await expect(
      getWorkUnit('WU-9', config({ boardId: null }), client),
    ).rejects.toMatchObject({
      code: 'TRELLO_CONFIGURATION_MISSING',
    });
    expect(client.calls).toEqual([]);
  });

  it('rejects a direct card reference from a different resolved board', async () => {
    const remote = await card({ idList: 'outside-list' });
    const client = fakeClient([]);
    client.getCard = async () => remote;
    await expect(getWorkUnit(cardId, config(), client)).rejects.toMatchObject({
      code: 'CARD_BOARD_MISMATCH',
    });
    expect(client.calls).toContain('listBoardCards:board-1');
  });

  it('reports doctor diagnostics read-only and never includes secret values', async () => {
    const client = fakeClient(
      [],
      [
        {
          id: 'list-inbox',
          idBoard: 'board-1',
          name: 'Inbox',
          pos: 1024,
          closed: false,
        },
        {
          id: 'list-ready',
          idBoard: 'board-1',
          name: 'Ready',
          pos: 2048,
          closed: false,
        },
      ],
    );
    const result = await doctor(config(), client);
    expect(result).toMatchObject({
      credentials: { available: true },
      authentication: { reachable: true },
      board: { configured: true, reachable: true },
      mappings: {
        valid: false,
        missing: ['in_design', 'in_progress', 'review', 'blocked', 'done'],
      },
    });
    expect(JSON.stringify(result)).not.toContain('present');
    expect(client.calls).toEqual([
      'getMemberMe',
      'getBoard:board-1',
      'listBoardLists:board-1',
    ]);
  });

  it('marks doctor mappings valid only when every required list is unique, present, and open', async () => {
    const listIds = {
      inbox: 'li',
      in_design: 'ldesign',
      ready: 'lr',
      in_progress: 'lp',
      review: 'lv',
      blocked: 'lb',
      done: 'ld',
    };
    const lists = Object.values(listIds).map((id, index) => ({
      id,
      idBoard: 'board-1',
      name: id,
      pos: (index + 1) * 1024,
      closed: false,
    }));
    await expect(
      doctor(config({ listIds }), fakeClient([], lists)),
    ).resolves.toMatchObject({
      mappings: { valid: true, missing: [], invalid: [] },
    });
    await expect(
      doctor(
        config({ listIds: { ...listIds, done: 'li' } }),
        fakeClient([], lists),
      ),
    ).resolves.toMatchObject({
      mappings: { valid: false, invalid: ['duplicate-list-id'] },
    });
    await expect(
      doctor(
        config({ listIds }),
        fakeClient(
          [],
          lists.map((list) =>
            list.id === 'ld' ? { ...list, closed: true } : list,
          ),
        ),
      ),
    ).resolves.toMatchObject({ mappings: { valid: false, invalid: ['ld'] } });
  });
});
