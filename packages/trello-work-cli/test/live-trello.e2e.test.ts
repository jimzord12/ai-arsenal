import {
  createRunCardConfig,
  createRunWorkflowFixture,
  loadLiveE2EConfig,
  moveRunCardToDone,
  prepareLiveWorkUnitDraft,
  runLiveTrelloScenario,
  type LiveE2EConfig,
} from './live-support';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseWorkUnit, renderWorkUnit } from '../src/work-unit';
import {
  CANONICAL_LIST_NAMES,
  DEFAULT_TRANSITION_GRAPH,
  type WorkConfig,
} from '../src/config';
import type { TrelloCard } from '../src/trello-types';
import { resolveBoardSelector } from '../src/board';
import {
  createBoardList,
  initializeBoardWorkflow,
  updateBoardList,
  type ListManagementClient,
} from '../src/list-management';
import type { TrelloList } from '../src/trello-types';

const completeEnvironment = {
  TRELLO_LIVE_E2E: '1',
  TRELLO_LIVE_CREDENTIAL_SOURCE: 'process-env',
  TRELLO_LIVE_BOARD_SELECTOR: 'Dedicated Testing Board',
  TRELLO_LIVE_BOARD_ID: '111111111111111111111111',
  TRELLO_API_KEY: 'test-key',
  TRELLO_API_TOKEN: 'test-token',
  TRELLO_LIST_INBOX_ID: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  TRELLO_LIST_READY_ID: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  TRELLO_LIST_IN_PROGRESS_ID: 'cccccccccccccccccccccccc',
  TRELLO_LIST_REVIEW_ID: 'dddddddddddddddddddddddd',
  TRELLO_LIST_BLOCKED_ID: 'eeeeeeeeeeeeeeeeeeeeeeee',
  TRELLO_LIST_DONE_ID: 'ffffffffffffffffffffffff',
  TRELLO_TRANSITIONS_JSON: JSON.stringify({
    inbox: ['ready'],
    ready: ['in_progress'],
    in_progress: ['review'],
    review: ['done'],
    blocked: ['ready'],
    done: [],
  }),
  TRELLO_RECONCILE_SOURCE: 'description',
};

const defaultedEnvironment = {
  TRELLO_LIVE_E2E: '1',
  TRELLO_LIVE_CREDENTIAL_SOURCE: 'process-env',
  TRELLO_LIVE_BOARD_SELECTOR: 'Dedicated Testing Board',
  TRELLO_LIVE_BOARD_ID: '111111111111111111111111',
  TRELLO_API_KEY: 'test-key',
  TRELLO_API_TOKEN: 'test-token',
};

describe('live Trello E2E preflight', () => {
  it('keeps canonical complete initialization write-free while a six-list run workflow owns replay and collision markers', async () => {
    const canonicalLists = Object.entries(CANONICAL_LIST_NAMES).map(
      ([, name], index) => ({
        id: `canonical-${index}`,
        idBoard: 'board-1',
        name,
        pos: (index + 1) * 1024,
        closed: false,
      }),
    );
    const lists: TrelloList[] = [...canonicalLists];
    const actions: Array<{ listId: string; names: string[] }> = [];
    const writes: string[] = [];
    const client = injectedListClient({
      listBoardLists: async () => lists,
      getList: async (id) => lists.find((list) => list.id === id)!,
      createList: async (input) => {
        writes.push(input.name);
        const list: TrelloList = {
          id: `temporary-${writes.length}`,
          idBoard: input.idBoard,
          name: input.name,
          pos: lists.length * 1024,
          closed: false,
        };
        lists.push(list);
        actions.push({ listId: list.id, names: [list.name] });
        return list;
      },
      updateList: async (id, input) => {
        const list = lists.find((candidate) => candidate.id === id)!;
        const previousName = list.name;
        Object.assign(list, input);
        actions.push({ listId: id, names: [list.name, previousName] });
        return list;
      },
      listBoardListActions: async () => actions,
    });
    const canonical = await initializeBoardWorkflow(
      'board-1',
      { listNames: CANONICAL_LIST_NAMES, listIds: {} },
      client,
      { operationId: 'canonical-no-op' },
    );
    expect(canonical.outcome).toBe('verified');
    expect(writes).toEqual([]);

    const fixture = await createRunWorkflowFixture(
      'board-1',
      { listNames: CANONICAL_LIST_NAMES, listIds: {} } as WorkConfig,
      '[work-live-run:offline-split]',
      'offline-split-workflow-init',
      client,
    );

    expect(fixture.listIds).toHaveLength(6);
    expect(writes).toHaveLength(6);
    expect(
      writes.every((name) => name.includes('[work-live-run:offline-split]')),
    ).toBe(true);
  });

  it('cleans a run card through production transitions with its temporary Inbox mapping', async () => {
    const draft = prepareLiveWorkUnitDraft(
      parseWorkUnit(
        await readFile(
          resolve(__dirname, 'fixtures', 'valid-draft.md'),
          'utf8',
        ),
      ),
      'cleanup-regression',
      '[cleanup-regression]',
    );
    const canonicalConfig: WorkConfig = {
      credentials: {
        ['api' + 'Key']: 'key',
        ['api' + 'Token']: 'token',
      } as WorkConfig['credentials'],
      boardId: 'board-1',
      listIds: {
        inbox: 'canonical-inbox',
        ready: 'ready',
        in_progress: 'in-progress',
        review: 'review',
        blocked: 'blocked',
        done: 'done',
      },
      listNames: { ...CANONICAL_LIST_NAMES },
      transitionGraph: structuredClone(DEFAULT_TRANSITION_GRAPH),
      reconcileSource: 'description',
      loadedHermesEnv: false,
      hermesEnvPath: null,
    };
    const effectiveConfig = createRunCardConfig(
      canonicalConfig,
      'disposable-inbox',
    );
    const card: TrelloCard = {
      id: '0123456789abcdef01234567',
      idShort: 1,
      name: draft.metadata.title,
      desc: renderWorkUnit({
        ...draft,
        metadata: {
          ...draft.metadata,
          id: 'WU-1',
          trello_card_id: '0123456789abcdef01234567',
          created_at: '2026-07-28T00:00:00.000Z',
          updated_at: '2026-07-28T00:00:00.000Z',
        },
      }),
      idList: 'disposable-inbox',
      dateLastActivity: 'v1',
      shortUrl: 'https://trello.com/c/test/card',
    };
    const client = {
      getCard: async () => card,
      listBoardCards: async () => [card],
      updateCard: async (
        _cardId: string,
        input: { desc?: string; idList?: string },
      ) => {
        Object.assign(card, input, { dateLastActivity: 'next' });
        return card;
      },
    };

    await moveRunCardToDone(
      card.id,
      'cleanup-regression',
      effectiveConfig,
      client,
    );

    expect(parseWorkUnit(card.desc).metadata.status).toBe('done');
    expect(card.idList).toBe(canonicalConfig.listIds.done);
  });

  it('removes inbox-only Open Questions before the live card enters the transition path', async () => {
    const draft = parseWorkUnit(
      await readFile(resolve(__dirname, 'fixtures', 'valid-draft.md'), 'utf8'),
    );

    const prepared = prepareLiveWorkUnitDraft(
      draft,
      'live-regression',
      '[run]',
    );

    expect(prepared.sections['Open Questions']).toBeUndefined();
  });

  it('fails closed without explicit opt-in before constructing a client', async () => {
    await expect(loadLiveE2EConfig({})).rejects.toMatchObject({
      code: 'LIVE_E2E_NOT_ENABLED',
    });
  });

  it('reports all missing confirmation fields without credential values', async () => {
    let message = '';
    try {
      await loadLiveE2EConfig({
        TRELLO_LIVE_E2E: '1',
        TRELLO_API_KEY: 'must-not-appear',
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('TRELLO_LIVE_BOARD_SELECTOR');
    expect(message).toContain('TRELLO_LIVE_CREDENTIAL_SOURCE');
    expect(message).not.toContain('must-not-appear');
  });

  it('accepts only a complete process-environment configuration shape', async () => {
    const config = await loadLiveE2EConfig(completeEnvironment);
    expect(config).toMatchObject({
      boardSelector: 'Dedicated Testing Board',
      allowlistedBoardId: '111111111111111111111111',
      credentialSource: 'process-env',
      workConfig: {
        boardId: null,
        reconcileSource: 'description',
      },
    });
    expect(JSON.stringify(config)).not.toContain('test-key');
    expect(JSON.stringify(config)).not.toContain('test-token');
  });

  it('uses canonical workflow defaults when no workflow overrides are supplied', async () => {
    const config = await loadLiveE2EConfig(defaultedEnvironment);
    expect(config.workConfig).toMatchObject({
      listIds: {},
      listNames: {
        inbox: 'Inbox',
        ready: 'Ready',
        in_progress: 'In Progress',
        review: 'Review',
        blocked: 'Blocked',
        done: 'Done',
      },
      transitionGraph: {
        inbox: ['ready'],
        ready: ['in_progress'],
        in_progress: ['review', 'blocked'],
        review: ['done', 'in_progress'],
        blocked: ['ready', 'in_progress'],
        done: [],
      },
      reconcileSource: 'description',
    });
  });
});

function injectedListClient(
  overrides: Partial<ListManagementClient> = {},
): ListManagementClient {
  return {
    listBoardLists: async () => [],
    getList: async () => {
      throw new Error('unexpected getList');
    },
    createList: async () => {
      throw new Error('unexpected createList');
    },
    updateList: async () => {
      throw new Error('unexpected updateList');
    },
    listBoardListActions: async () => [],
    listListCards: async () => [],
    ...overrides,
  };
}

const injectedList: TrelloList = {
  id: 'list-1',
  idBoard: 'board-1',
  name: 'Run list',
  pos: 1024,
  closed: false,
};

describe('structured injected production boundaries', () => {
  it('calls exact-name board resolution and rejects ambiguous production results', async () => {
    await expect(
      resolveBoardSelector('Duplicate', {
        getBoard: async () => ({ id: 'unused', name: 'unused' }),
        listMemberBoards: async () => [
          { id: 'board-1', name: 'Duplicate' },
          { id: 'board-2', name: 'Duplicate' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'BOARD_NAME_AMBIGUOUS' });
  });

  it('calls list update ownership guard before any production write', async () => {
    const updateList = jest.fn();
    await expect(
      updateBoardList(
        'board-1',
        'outside-list',
        { name: 'Changed' },
        injectedListClient({
          getList: async () => ({ ...injectedList, idBoard: 'board-2' }),
          updateList,
        }),
        { operationId: 'wrong-board-production-seam' },
      ),
    ).rejects.toMatchObject({ code: 'LIST_BOARD_MISMATCH' });
    expect(updateList).not.toHaveBeenCalled();
  });

  it('calls list creation and returns ambiguous recovery on a transport failure', async () => {
    const result = await createBoardList(
      'board-1',
      { name: 'Run list' },
      injectedListClient({
        createList: async () => {
          throw new Error('response lost');
        },
      }),
      { operationId: 'ambiguous-production-seam' },
    );
    expect(result).toMatchObject({
      outcome: 'ambiguous',
      recovery: {
        operationId: 'ambiguous-production-seam',
        boardId: 'board-1',
        action: 'inspect-list-and-board-actions-before-retry',
      },
    });
  });

  it('calls post-write read-back and returns partial recovery when verification is unavailable', async () => {
    let reads = 0;
    const result = await createBoardList(
      'board-1',
      { name: 'Run list' },
      injectedListClient({
        createList: async () => injectedList,
        updateList: async () => injectedList,
        getList: async () => {
          reads += 1;
          throw new Error('read-back unavailable');
        },
      }),
      { operationId: 'partial-production-seam' },
    );
    expect(reads).toBe(1);
    expect(result).toMatchObject({
      outcome: 'partial',
      recovery: {
        operationId: 'partial-production-seam',
        boardId: 'board-1',
        listId: 'list-1',
        action: 'inspect-list-and-board-actions-before-retry',
      },
    });
  });
});

const liveTest = process.env.TRELLO_LIVE_E2E === '1' ? it : it.skip;

describe('explicit live Trello E2E scenario', () => {
  liveTest(
    'uses only the allowlisted board, moves run cards to Done, and closes only empty run lists',
    async () => {
      const config: LiveE2EConfig = await loadLiveE2EConfig(process.env);
      const result = await runLiveTrelloScenario(config);
      expect(result).toMatchObject({
        boardId: config.allowlistedBoardId,
        cardsVerifiedInDone: true,
        disposableListsVerifiedClosed: true,
        leakedResources: [],
      });
    },
    120_000,
  );
});
