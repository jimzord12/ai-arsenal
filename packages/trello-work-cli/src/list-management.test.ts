import {
  closeBoardList,
  createBoardList,
  initializeBoardWorkflow,
  listManagedLists,
  updateBoardList,
  type ListManagementClient,
} from './list-management';
import { WorkCliError } from './errors';
import type { TrelloCard, TrelloList, TrelloListAction } from './trello-types';

const boardId = '111111111111111111111111';
const otherBoardId = '222222222222222222222222';

function storedList(overrides: Partial<TrelloList> = {}): TrelloList {
  return {
    id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    idBoard: boardId,
    name: 'Disposable',
    pos: 1024,
    closed: false,
    ...overrides,
  };
}

class FakeListClient implements ListManagementClient {
  lists: TrelloList[];
  actions: TrelloListAction[] = [];
  cards: TrelloCard[] = [];
  calls: string[] = [];
  failWriteAt: number | null = null;
  corruptReadBack = false;
  private writeCount = 0;

  constructor(...lists: TrelloList[]) {
    this.lists = lists;
  }

  async listBoardLists(id: string): Promise<TrelloList[]> {
    this.calls.push(`listBoardLists:${id}`);
    return this.lists.filter((list) => list.idBoard === id);
  }

  async getList(id: string): Promise<TrelloList> {
    this.calls.push(`getList:${id}`);
    const list = this.lists.find((candidate) => candidate.id === id);
    if (!list) throw new Error('missing list');
    return this.corruptReadBack && this.writeCount > 0
      ? { ...list, name: `${list.name}-drifted` }
      : { ...list };
  }

  async createList(input: {
    idBoard: string;
    name: string;
    pos?: string | number;
  }): Promise<TrelloList> {
    this.calls.push(`createList:${input.idBoard}:${input.name}`);
    this.writeCount += 1;
    if (this.failWriteAt === this.writeCount) {
      throw new WorkCliError(
        'TRELLO_MUTATION_AMBIGUOUS',
        'injected create failure',
      );
    }
    const list = storedList({
      id: this.lists.length.toString(16).padStart(24, 'b').slice(-24),
      idBoard: input.idBoard,
      name: input.name,
      pos: typeof input.pos === 'number' ? input.pos : 65535,
    });
    this.lists.push(list);
    this.actions.push({ listId: list.id, names: [list.name] });
    return { ...list };
  }

  async updateList(
    id: string,
    input: { name?: string; pos?: string | number; closed?: boolean },
  ): Promise<TrelloList> {
    this.calls.push(`updateList:${id}:${JSON.stringify(input)}`);
    this.writeCount += 1;
    if (this.failWriteAt === this.writeCount) {
      throw new WorkCliError(
        'TRELLO_MUTATION_AMBIGUOUS',
        'injected update failure',
      );
    }
    const index = this.lists.findIndex((candidate) => candidate.id === id);
    if (index < 0) throw new Error('missing list');
    const current = this.lists[index];
    let numericPosition: number | undefined;
    if (input.pos === 'top') {
      numericPosition = Math.min(...this.lists.map((list) => list.pos)) - 1024;
    } else if (input.pos === 'bottom') {
      numericPosition = Math.max(...this.lists.map((list) => list.pos)) + 1024;
    } else if (typeof input.pos === 'number') {
      numericPosition = input.pos;
    }
    const updated = {
      ...current,
      ...input,
      pos: numericPosition ?? current.pos,
    };
    this.lists[index] = updated;
    this.actions.push({
      listId: id,
      names: [updated.name, current.name],
    });
    return { ...updated };
  }

  async listBoardListActions(): Promise<TrelloListAction[]> {
    this.calls.push('listBoardListActions');
    return this.actions;
  }

  async listListCards(id: string): Promise<TrelloCard[]> {
    this.calls.push(`listListCards:${id}`);
    return this.cards.filter((card) => card.idList === id);
  }
}

describe('board-scoped list management', () => {
  const canonicalNames = {
    inbox: 'Inbox',
    ready: 'Ready',
    in_progress: 'In Progress',
    review: 'Review',
    blocked: 'Blocked',
    done: 'Done',
  } as const;

  it('initializes only missing canonical lists and is idempotent', async () => {
    const api = new FakeListClient(storedList({ name: 'Inbox' }));
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        {
          operationId: 'workflow-init-1',
        },
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    expect(
      api.calls.filter((call) => call.startsWith('createList:')),
    ).toHaveLength(5);
    const writes = api.calls.filter((call) =>
      call.startsWith('createList:'),
    ).length;
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        {
          operationId: 'workflow-init-2',
        },
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    expect(
      api.calls.filter((call) => call.startsWith('createList:')),
    ).toHaveLength(writes);
  });

  it('returns a verified mutation-free no-op when the workflow is complete without a parent marker', async () => {
    const api = new FakeListClient(
      ...Object.entries(canonicalNames).map(([, name], index) =>
        storedList({
          id: (index + 1).toString(16).padStart(24, 'd'),
          name,
          pos: (index + 1) * 1024,
        }),
      ),
    );

    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        { operationId: 'workflow-complete-no-marker' },
      ),
    ).resolves.toMatchObject({
      outcome: 'verified',
      operationId: 'workflow-complete-no-marker',
      value: { boardId },
    });
    expect(
      api.calls.filter(
        (call) =>
          call.startsWith('createList:') || call.startsWith('updateList:'),
      ),
    ).toEqual([]);
  });

  it('recovers an exact workflow-init replay without child writes and collides on changed parent intent', async () => {
    const api = new FakeListClient(storedList({ name: 'Inbox' }));
    const options = { operationId: 'workflow-parent-replay' };
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    const writes = api.calls.filter(
      (call) =>
        call.startsWith('createList:') || call.startsWith('updateList:'),
    );

    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(
      api.calls.filter(
        (call) =>
          call.startsWith('createList:') || call.startsWith('updateList:'),
      ),
    ).toEqual(writes);

    await expect(
      initializeBoardWorkflow(
        boardId,
        {
          listNames: { ...canonicalNames, done: 'Completed' },
          listIds: {
            inbox: api.lists.find((list) => list.name === 'Inbox')!.id,
          },
        },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: options.operationId, boardId },
    });
    expect(
      api.calls.filter(
        (call) =>
          call.startsWith('createList:') || call.startsWith('updateList:'),
      ),
    ).toEqual(writes);
  });

  it('resumes a partial workflow-init replay and recovers only after all mappings are verified', async () => {
    const api = new FakeListClient(storedList({ name: 'Inbox' }));
    const options = { operationId: 'workflow-partial-replay' };
    api.failWriteAt = 3;

    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'ambiguous' });
    expect(api.lists.map((list) => list.name)).toEqual(['Inbox', 'Ready']);

    api.failWriteAt = null;
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'recovered',
      operationId: options.operationId,
      value: {
        boardId,
        listIds: {
          inbox: expect.any(String),
          ready: expect.any(String),
          in_progress: expect.any(String),
          review: expect.any(String),
          blocked: expect.any(String),
          done: expect.any(String),
        },
      },
    });
    expect(api.lists.map((list) => list.name)).toEqual([
      'Inbox',
      'Ready',
      'In Progress',
      'Review',
      'Blocked',
      'Done',
    ]);
  });

  it('keeps an unresolved partial workflow-init replay non-successful with credential-free child evidence', async () => {
    const api = new FakeListClient(storedList({ name: 'Inbox' }));
    const options = { operationId: 'workflow-partial-unresolved' };
    api.failWriteAt = 3;

    await initializeBoardWorkflow(
      boardId,
      { listNames: canonicalNames, listIds: {} },
      api,
      options,
    );
    api.failWriteAt = 4;
    const replayed = await initializeBoardWorkflow(
      boardId,
      { listNames: canonicalNames, listIds: {} },
      api,
      options,
    );

    expect(replayed).toMatchObject({
      outcome: 'ambiguous',
      recovery: {
        operationId: expect.stringMatching(/^workflow-[0-9a-f]{32}$/),
        boardId,
        requested: { name: 'In Progress', closed: false },
        action: 'inspect-list-and-board-actions-before-retry',
      },
    });
    expect(JSON.stringify(replayed)).not.toMatch(/api-key|api-token/i);
    expect(api.lists.map((list) => list.name)).toEqual(['Inbox', 'Ready']);
  });

  it('fails initialization before mutation for duplicate names and wrong-board overrides', async () => {
    const duplicate = new FakeListClient(
      storedList({ name: 'Inbox' }),
      storedList({ id: 'cccccccccccccccccccccccc', name: 'Inbox' }),
    );
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: {} },
        duplicate,
        { operationId: 'workflow-duplicate' },
      ),
    ).rejects.toMatchObject({ code: 'WORKFLOW_LIST_AMBIGUOUS' });
    expect(duplicate.calls.some((call) => call.startsWith('createList:'))).toBe(
      false,
    );
    const wrong = new FakeListClient(storedList({ idBoard: otherBoardId }));
    await expect(
      initializeBoardWorkflow(
        boardId,
        { listNames: canonicalNames, listIds: { inbox: wrong.lists[0].id } },
        wrong,
        { operationId: 'workflow-wrong' },
      ),
    ).rejects.toMatchObject({ code: 'LIST_BOARD_MISMATCH' });
    expect(wrong.calls.some((call) => call.startsWith('createList:'))).toBe(
      false,
    );
  });

  it('lists open and closed lists with stable board identity and position', async () => {
    const api = new FakeListClient(
      storedList(),
      storedList({
        id: 'cccccccccccccccccccccccc',
        name: 'Closed',
        pos: 2048,
        closed: true,
      }),
    );
    await expect(listManagedLists(boardId, api)).resolves.toEqual({
      boardId,
      lists: api.lists,
    });
  });

  it('dry-runs list creation without a write', async () => {
    const api = new FakeListClient();
    await expect(
      createBoardList(boardId, { name: 'Disposable', pos: 'bottom' }, api, {
        dryRun: true,
        operationId: 'list-create-1',
      }),
    ).resolves.toMatchObject({
      outcome: 'planned',
      plan: {
        operationId: 'list-create-1',
        boardId,
        requested: { name: 'Disposable', pos: 'bottom', closed: false },
      },
    });
    expect(api.calls).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^createList:/)]),
    );
  });

  it.each([false, true])(
    'rejects an exact duplicate list name when the existing list closed=%s before create',
    async (closed) => {
      const api = new FakeListClient(
        storedList({ name: 'Disposable', closed }),
      );
      await expect(
        createBoardList(boardId, { name: 'Disposable' }, api, {
          operationId: `list-create-duplicate-${closed}`,
        }),
      ).rejects.toMatchObject({ code: 'LIST_NAME_EXISTS' });
      expect(api.calls).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^createList:/)]),
      );
    },
  );

  it('verifies create, exact replay, and operation-ID collision without another create', async () => {
    const api = new FakeListClient();
    const options = { operationId: 'list-create-2' };
    await expect(
      createBoardList(
        boardId,
        { name: 'Disposable', pos: 'bottom' },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'verified',
      value: { name: 'Disposable', idBoard: boardId, closed: false },
    });
    const createCalls = api.calls.filter((call) =>
      call.startsWith('createList:'),
    );

    await expect(
      createBoardList(
        boardId,
        { name: 'Disposable', pos: 'bottom' },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(api.calls.filter((call) => call.startsWith('createList:'))).toEqual(
      createCalls,
    );

    await expect(
      createBoardList(
        boardId,
        { name: 'Different', pos: 'bottom' },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: 'list-create-2', boardId },
    });
  });

  it('rejects wrong-board list mutation before any write', async () => {
    const api = new FakeListClient(storedList({ idBoard: otherBoardId }));
    await expect(
      updateBoardList(boardId, api.lists[0].id, { name: 'Renamed' }, api, {
        operationId: 'list-update-1',
      }),
    ).rejects.toMatchObject({ code: 'LIST_BOARD_MISMATCH' });
    expect(api.calls).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^updateList:/)]),
    );
  });

  it('renames and repositions with read-back verification', async () => {
    const api = new FakeListClient(storedList());
    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed', pos: 4096 },
        api,
        { operationId: 'list-update-2' },
      ),
    ).resolves.toMatchObject({
      outcome: 'verified',
      value: { name: 'Renamed', pos: 4096 },
    });
  });

  it('recovers an exact symbolic top update replay after numeric Trello read-back', async () => {
    const api = new FakeListClient(
      storedList({ pos: 2048 }),
      storedList({ id: 'cccccccccccccccccccccccc', name: 'Other', pos: 1024 }),
    );
    const options = { operationId: 'list-update-symbolic-top-replay' };

    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed', pos: 'top' },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    const writes = api.calls.filter((call) => call.startsWith('updateList:'));

    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed', pos: 'top' },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(api.calls.filter((call) => call.startsWith('updateList:'))).toEqual(
      writes,
    );
  });

  it('replays list update exactly and rejects a changed request using the same operation ID', async () => {
    const api = new FakeListClient(storedList());
    const options = { operationId: 'list-update-replay' };
    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed', pos: 4096 },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    const writes = api.calls.filter((call) => call.startsWith('updateList:'));
    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed', pos: 4096 },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(api.calls.filter((call) => call.startsWith('updateList:'))).toEqual(
      writes,
    );
    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Different', pos: 4096 },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: options.operationId, boardId },
    });
  });

  it('matches update replay from caller intent when an omitted position drifts and reports postcondition drift', async () => {
    const api = new FakeListClient(storedList());
    const options = { operationId: 'list-update-omitted-position-drift' };
    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed' },
        api,
        options,
      ),
    ).resolves.toMatchObject({ outcome: 'verified' });
    api.lists[0] = { ...api.lists[0], pos: 8192 };
    const writes = api.calls.filter((call) => call.startsWith('updateList:'));

    await expect(
      updateBoardList(
        boardId,
        api.lists[0].id,
        { name: 'Renamed' },
        api,
        options,
      ),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        reason: 'recorded list operation no longer satisfies its postcondition',
      },
    });
    expect(api.calls.filter((call) => call.startsWith('updateList:'))).toEqual(
      writes,
    );
  });

  it.each([
    ['create', 'list-create-failure'],
    ['update', 'list-update-failure'],
    ['close', 'list-close-failure'],
  ])(
    'returns credential-free ambiguous recovery for injected %s transport failure',
    async (family, operationId) => {
      const api = new FakeListClient(storedList());
      api.failWriteAt = 1;
      const result =
        family === 'create'
          ? await createBoardList(boardId, { name: 'Created' }, api, {
              operationId,
            })
          : family === 'update'
            ? await updateBoardList(
                boardId,
                api.lists[0].id,
                { name: 'Renamed' },
                api,
                { operationId },
              )
            : await closeBoardList(boardId, api.lists[0].id, api, {
                operationId,
              });
      expect(result).toMatchObject({
        outcome: 'ambiguous',
        recovery: {
          operationId,
          boardId,
          requested: expect.any(Object),
          action: 'inspect-list-and-board-actions-before-retry',
        },
      });
      expect(JSON.stringify(result)).not.toMatch(/api-key|api-token/i);
    },
  );

  it.each(['create', 'update', 'close'])(
    'returns partial recovery when %s read-back verification drifts',
    async (family) => {
      const api = new FakeListClient(storedList());
      api.corruptReadBack = true;
      const operationId = `list-${family}-drift`;
      const result =
        family === 'create'
          ? await createBoardList(boardId, { name: 'Created' }, api, {
              operationId,
            })
          : family === 'update'
            ? await updateBoardList(
                boardId,
                api.lists[0].id,
                { name: 'Renamed' },
                api,
                { operationId },
              )
            : await closeBoardList(boardId, api.lists[0].id, api, {
                operationId,
              });
      expect(result).toMatchObject({
        outcome: 'partial',
        recovery: {
          operationId,
          boardId,
          requested: expect.any(Object),
        },
      });
    },
  );

  it('blocks nonempty list close before mutation and reports only card count', async () => {
    const api = new FakeListClient(storedList());
    api.cards = [
      {
        id: 'dddddddddddddddddddddddd',
        idShort: 9,
        name: 'secret card title',
        desc: 'secret card body',
        idList: api.lists[0].id,
        dateLastActivity: '2026-07-27T00:00:00.000Z',
        shortUrl: 'https://trello.com/c/example',
      },
    ];
    await expect(
      closeBoardList(boardId, api.lists[0].id, api, {
        operationId: 'list-close-1',
      }),
    ).rejects.toMatchObject({
      code: 'LIST_NOT_EMPTY',
      recovery: { boardId, listId: api.lists[0].id, blockingCardCount: 1 },
    });
    expect(api.calls).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^updateList:/)]),
    );
  });

  it('closes only an empty selected-board list and verifies the closed state', async () => {
    const api = new FakeListClient(storedList());
    await expect(
      closeBoardList(boardId, api.lists[0].id, api, {
        operationId: 'list-close-2',
      }),
    ).resolves.toMatchObject({
      outcome: 'verified',
      value: { closed: true, idBoard: boardId },
    });
  });

  it('replays close exactly and treats reuse on another list as a collision', async () => {
    const first = storedList();
    const second = storedList({
      id: 'eeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Second',
      pos: 2048,
    });
    const api = new FakeListClient(first, second);
    const options = { operationId: 'list-close-replay' };
    await expect(
      closeBoardList(boardId, first.id, api, options),
    ).resolves.toMatchObject({ outcome: 'verified' });
    const writes = api.calls.filter((call) => call.startsWith('updateList:'));
    await expect(
      closeBoardList(boardId, first.id, api, options),
    ).resolves.toMatchObject({ outcome: 'recovered' });
    expect(api.calls.filter((call) => call.startsWith('updateList:'))).toEqual(
      writes,
    );
    await expect(
      closeBoardList(boardId, second.id, api, options),
    ).resolves.toMatchObject({
      outcome: 'partial',
      recovery: { operationId: options.operationId, boardId },
    });
  });
});
