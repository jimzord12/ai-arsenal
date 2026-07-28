import { WorkCliError } from './errors';
import type { TrelloBoard, TrelloList } from './trello-types';
import type { WorkUnitStatus } from './work-unit';

export interface BoardClient {
  listMemberBoards(): Promise<TrelloBoard[]>;
  getBoard(boardId: string): Promise<TrelloBoard>;
}

const BOARD_ID = /^[0-9a-fA-F]{24}$/;

export async function listReadableBoards(
  client: Pick<BoardClient, 'listMemberBoards'>,
): Promise<{ boards: TrelloBoard[] }> {
  return { boards: await client.listMemberBoards() };
}

export async function resolveBoardSelector(
  selectorInput: string,
  client: BoardClient,
): Promise<TrelloBoard> {
  const selector = selectorInput.trim();
  if (!selector) {
    throw new WorkCliError(
      'BOARD_SELECTOR_INVALID',
      'Board selector is empty.',
      {
        exitCode: 2,
      },
    );
  }
  if (BOARD_ID.test(selector)) {
    const board = await client.getBoard(selector);
    if (board.id.toLowerCase() !== selector.toLowerCase()) {
      throw new WorkCliError(
        'BOARD_ID_MISMATCH',
        'Trello returned a different board than the requested board ID.',
      );
    }
    return board;
  }

  const matches = (await client.listMemberBoards()).filter(
    (board) => board.name === selector,
  );
  if (matches.length === 0) {
    throw new WorkCliError(
      'BOARD_NOT_FOUND',
      `No readable board has the exact name ${JSON.stringify(selector)}.`,
    );
  }
  if (matches.length > 1) {
    throw new WorkCliError(
      'BOARD_NAME_AMBIGUOUS',
      `Multiple readable boards have the exact name ${JSON.stringify(selector)}; use a board ID.`,
      {
        recovery: {
          matches: matches.map(({ id, name }) => ({ id, name })),
          action: 'retry-with-board-id',
        },
      },
    );
  }
  return matches[0];
}

export async function validateBoardListMappings(
  boardId: string,
  listIds: Partial<Record<WorkUnitStatus, string>>,
  client: { listBoardLists(boardId: string): Promise<TrelloList[]> },
): Promise<void> {
  const configured = Object.values(listIds).filter(
    (id): id is string => id !== undefined,
  );
  if (configured.length === 0) return;
  const boardLists = await client.listBoardLists(boardId);
  const readable = new Set(
    boardLists
      .filter((list) => list.idBoard === boardId)
      .map((list) => list.id),
  );
  const outside = configured.filter((id) => !readable.has(id));
  if (outside.length > 0) {
    throw new WorkCliError(
      'LIST_BOARD_MISMATCH',
      'One or more configured status lists do not belong to the resolved board.',
      { recovery: { boardId, listIds: outside } },
    );
  }
}

export async function resolveWorkflowListMappings(
  boardId: string,
  overrides: Partial<Record<WorkUnitStatus, string>>,
  names: Record<WorkUnitStatus, string>,
  client: { listBoardLists(boardId: string): Promise<TrelloList[]> },
): Promise<Record<WorkUnitStatus, string>> {
  const lists = await client.listBoardLists(boardId);
  const result = {} as Record<WorkUnitStatus, string>;
  for (const status of Object.keys(names) as WorkUnitStatus[]) {
    const override = overrides[status];
    if (override) {
      const list = lists.find((candidate) => candidate.id === override);
      if (!list || list.idBoard !== boardId) {
        throw new WorkCliError(
          'LIST_BOARD_MISMATCH',
          `Configured ${status} list does not belong to the resolved board.`,
          {
            recovery: { boardId, listId: override, status },
          },
        );
      }
      result[status] = override;
      continue;
    }
    const matches = lists.filter(
      (list) => list.idBoard === boardId && list.name === names[status],
    );
    if (matches.length > 1) {
      throw new WorkCliError(
        'WORKFLOW_LIST_AMBIGUOUS',
        `Multiple lists have the exact canonical name ${JSON.stringify(names[status])}.`,
        {
          recovery: {
            boardId,
            status,
            listIds: matches.map((list) => list.id),
          },
        },
      );
    }
    if (matches.length === 0) {
      throw new WorkCliError(
        'WORKFLOW_LIST_MISSING',
        `No list has the exact canonical name ${JSON.stringify(names[status])}.`,
        {
          recovery: { boardId, status, action: 'run-workflow-init' },
        },
      );
    }
    result[status] = matches[0].id;
  }
  return result;
}
