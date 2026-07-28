import {
  listReadableBoards,
  resolveBoardSelector,
  resolveWorkflowListMappings,
  validateBoardListMappings,
  type BoardClient,
} from './board';
import type { TrelloBoard } from './trello-types';

const boards: TrelloBoard[] = [
  { id: '111111111111111111111111', name: 'Testing' },
  { id: '222222222222222222222222', name: 'Other' },
];

function client(readable: TrelloBoard[] = boards): BoardClient & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    async listMemberBoards() {
      calls.push('listMemberBoards');
      return readable;
    },
    async getBoard(boardId) {
      calls.push(`getBoard:${boardId}`);
      const board = readable.find((candidate) => candidate.id === boardId);
      if (!board) throw new Error('unreadable board');
      return board;
    },
  };
}

describe('stateless board discovery and resolution', () => {
  it('lists authenticated readable boards without mutation', async () => {
    const api = client();
    await expect(listReadableBoards(api)).resolves.toEqual({ boards });
    expect(api.calls).toEqual(['listMemberBoards']);
  });

  it('verifies a 24-character board ID directly on every invocation', async () => {
    const api = client();
    await expect(
      resolveBoardSelector('111111111111111111111111', api),
    ).resolves.toEqual(boards[0]);
    expect(api.calls).toEqual(['getBoard:111111111111111111111111']);
  });

  it('uses exact name matching and fails closed for zero or duplicate matches', async () => {
    await expect(
      resolveBoardSelector('testing', client()),
    ).rejects.toMatchObject({ code: 'BOARD_NOT_FOUND' });

    const duplicate = client([
      boards[0],
      { id: '333333333333333333333333', name: 'Testing' },
    ]);
    await expect(
      resolveBoardSelector('Testing', duplicate),
    ).rejects.toMatchObject({
      code: 'BOARD_NAME_AMBIGUOUS',
      recovery: {
        matches: [
          { id: '111111111111111111111111', name: 'Testing' },
          { id: '333333333333333333333333', name: 'Testing' },
        ],
      },
    });
  });

  it('resolves overrides independently and falls back to unique exact canonical names', async () => {
    const boardId = '111111111111111111111111';
    const lists = [
      {
        id: 'inbox-id',
        idBoard: boardId,
        name: 'Inbox',
        pos: 1,
        closed: false,
      },
      {
        id: 'design-id',
        idBoard: boardId,
        name: 'In Design',
        pos: 2,
        closed: false,
      },
      {
        id: 'ready-id',
        idBoard: boardId,
        name: 'Ready',
        pos: 3,
        closed: false,
      },
      {
        id: 'progress-id',
        idBoard: boardId,
        name: 'In Progress',
        pos: 3,
        closed: false,
      },
      {
        id: 'review-id',
        idBoard: boardId,
        name: 'Review',
        pos: 4,
        closed: false,
      },
      {
        id: 'blocked-id',
        idBoard: boardId,
        name: 'Blocked',
        pos: 5,
        closed: false,
      },
      { id: 'done-id', idBoard: boardId, name: 'Done', pos: 6, closed: false },
    ];
    await expect(
      resolveWorkflowListMappings(
        boardId,
        { review: 'review-id' },
        {
          inbox: 'Inbox',
          in_design: 'In Design',
          ready: 'Ready',
          in_progress: 'In Progress',
          review: 'Review',
          blocked: 'Blocked',
          done: 'Done',
        },
        {
          async listBoardLists() {
            return lists;
          },
        },
      ),
    ).resolves.toEqual({
      inbox: 'inbox-id',
      in_design: 'design-id',
      ready: 'ready-id',
      in_progress: 'progress-id',
      review: 'review-id',
      blocked: 'blocked-id',
      done: 'done-id',
    });
  });

  it('rejects duplicate canonical exact names', async () => {
    const boardId = '111111111111111111111111';
    await expect(
      resolveWorkflowListMappings(
        boardId,
        {},
        {
          inbox: 'Inbox',
          in_design: 'In Design',
          ready: 'Ready',
          in_progress: 'In Progress',
          review: 'Review',
          blocked: 'Blocked',
          done: 'Done',
        },
        {
          async listBoardLists() {
            return [
              {
                id: 'one',
                idBoard: boardId,
                name: 'Inbox',
                pos: 1,
                closed: false,
              },
              {
                id: 'two',
                idBoard: boardId,
                name: 'Inbox',
                pos: 2,
                closed: false,
              },
            ];
          },
        },
      ),
    ).rejects.toMatchObject({ code: 'WORKFLOW_LIST_AMBIGUOUS' });
  });

  it('rejects configured status-list IDs outside the resolved board before mutation', async () => {
    await expect(
      validateBoardListMappings(
        '111111111111111111111111',
        { inbox: 'outside-list' },
        {
          async listBoardLists() {
            return [
              {
                id: 'inside-list',
                idBoard: '111111111111111111111111',
                name: 'Inbox',
                pos: 1024,
                closed: false,
              },
            ];
          },
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIST_BOARD_MISMATCH',
      recovery: {
        boardId: '111111111111111111111111',
        listIds: ['outside-list'],
      },
    });
  });
});
