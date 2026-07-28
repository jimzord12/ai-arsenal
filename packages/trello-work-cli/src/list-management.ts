import { createHash } from 'node:crypto';
import { WorkCliError } from './errors';
import { validateOperationId } from './mutation';
import type { TrelloList, TrelloListAction } from './trello-types';
import { assertCurrentVersion } from './version';
import type { WorkUnitStatus } from './work-unit';

export type ListPosition = 'top' | 'bottom' | number;

export interface ListManagementClient {
  listBoardLists(boardId: string): Promise<TrelloList[]>;
  getList(listId: string): Promise<TrelloList>;
  createList(input: {
    idBoard: string;
    name: string;
    pos?: ListPosition;
  }): Promise<TrelloList>;
  updateList(
    listId: string,
    input: { name?: string; pos?: ListPosition; closed?: boolean },
  ): Promise<TrelloList>;
  listBoardListActions(boardId: string): Promise<TrelloListAction[]>;
  listListCards(listId: string): Promise<Array<{ id: string }>>;
}

export type ListMutationOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
  parentRecord?: { operationId: string; request: ListRequest };
};

type ListRequest = {
  family: 'list-create' | 'list-update' | 'list-close' | 'workflow-init';
  boardId: string;
  listId?: string;
  intent: Record<string, unknown>;
  requested: {
    name: string;
    pos: ListPosition;
    closed: boolean;
  };
};

const MARKER = /\[work-op:([0-9a-f]{32}):([0-9a-f]{32}):([0-9a-f]{32})\]/;
const MARKERS = /\[work-op:([0-9a-f]{32}):([0-9a-f]{32}):([0-9a-f]{32})\]/g;

function digest(value: unknown): string {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value), 'utf8')
    .digest('hex');
}

function operationKey(operationId: string): string {
  return digest(operationId).slice(0, 32);
}

function requestKey(request: ListRequest): string {
  return digest({
    family: request.family,
    boardId: request.boardId,
    listId: request.listId,
    intent: request.intent,
  }).slice(0, 32);
}

function marker(operationId: string, request: ListRequest): string {
  const postconditionKey = digest(request.requested).slice(0, 32);
  return `[work-op:${operationKey(operationId)}:${requestKey(request)}:${postconditionKey}]`;
}

function taggedName(
  name: string,
  operationId: string,
  request: ListRequest,
): string {
  return `${name} ${marker(operationId, request)}`;
}

function normalizeName(input: string): string {
  const name = input.trim();
  if (!name || name !== input || /[\r\n]/.test(name) || MARKER.test(name)) {
    throw new WorkCliError(
      'INVALID_LIST_NAME',
      'List name must be a non-empty single line without outer whitespace or reserved operation markers.',
      { exitCode: 2 },
    );
  }
  return name;
}

function normalizePosition(input: ListPosition | undefined): ListPosition {
  if (input === undefined) return 'bottom';
  if (
    input === 'top' ||
    input === 'bottom' ||
    (typeof input === 'number' && Number.isFinite(input) && input >= 0)
  ) {
    return input;
  }
  throw new WorkCliError(
    'INVALID_LIST_POSITION',
    'List position must be top, bottom, or a non-negative finite number.',
    { exitCode: 2 },
  );
}

export function listVersion(list: TrelloList): string {
  return digest({
    id: list.id,
    idBoard: list.idBoard,
    name: list.name,
    pos: list.pos,
    closed: list.closed,
  });
}

function assertBoard(list: TrelloList, boardId: string): void {
  if (list.idBoard !== boardId) {
    throw new WorkCliError(
      'LIST_BOARD_MISMATCH',
      `List ${list.id} does not belong to the resolved board.`,
      { recovery: { boardId, listId: list.id } },
    );
  }
}

async function recordedOperation(
  boardId: string,
  operationId: string,
  request: ListRequest,
  client: Pick<ListManagementClient, 'listBoardListActions'>,
): Promise<
  | { state: 'absent' }
  | {
      state: 'match' | 'conflict';
      listIds: string[];
      postconditionKeys: string[];
    }
> {
  const key = operationKey(operationId);
  const expected = requestKey(request);
  const matches = (await client.listBoardListActions(boardId)).flatMap(
    (action) =>
      action.names.flatMap((name) =>
        [...name.matchAll(MARKERS)].flatMap((found) =>
          found[1] === key
            ? [
                {
                  listId: action.listId,
                  requestKey: found[2],
                  postconditionKey: found[3],
                },
              ]
            : [],
        ),
      ),
  );
  if (matches.length === 0) return { state: 'absent' };
  return {
    state: matches.every((match) => match.requestKey === expected)
      ? 'match'
      : 'conflict',
    listIds: [...new Set(matches.map((match) => match.listId))],
    postconditionKeys: [
      ...new Set(matches.map((match) => match.postconditionKey)),
    ],
  };
}

async function positionMatches(
  list: TrelloList,
  requested: ListPosition,
  client: Pick<ListManagementClient, 'listBoardLists'>,
): Promise<boolean> {
  if (typeof requested === 'number') return list.pos === requested;
  const open = (await client.listBoardLists(list.idBoard)).filter(
    (candidate) => !candidate.closed,
  );
  if (open.length === 0) return false;
  const positions = open.map((candidate) => candidate.pos);
  return requested === 'top'
    ? list.pos === Math.min(...positions)
    : list.pos === Math.max(...positions);
}

async function verify(
  list: TrelloList,
  request: ListRequest,
  client: Pick<ListManagementClient, 'listBoardLists'>,
): Promise<boolean> {
  return (
    list.idBoard === request.boardId &&
    list.name === request.requested.name &&
    list.closed === request.requested.closed &&
    (await positionMatches(list, request.requested.pos, client))
  );
}

function recovery(
  outcome: 'partial' | 'ambiguous',
  operationId: string,
  request: ListRequest,
  listId?: string,
  reason?: string,
): Record<string, unknown> {
  return {
    outcome,
    recovery: {
      operationId,
      boardId: request.boardId,
      ...(listId ? { listId } : {}),
      requested: request.requested,
      ...(reason ? { reason } : {}),
      action: 'inspect-list-and-board-actions-before-retry',
    },
  };
}

async function replay(
  request: ListRequest,
  client: ListManagementClient,
  options: ListMutationOptions,
): Promise<Record<string, unknown> | null> {
  const recorded = await recordedOperation(
    request.boardId,
    options.operationId,
    request,
    client,
  );
  if (recorded.state === 'absent') return null;
  const listId = recorded.listIds[0];
  if (
    recorded.state === 'conflict' ||
    recorded.listIds.length !== 1 ||
    recorded.postconditionKeys.length !== 1
  ) {
    return recovery(
      'partial',
      options.operationId,
      request,
      listId,
      'operation ID conflicts with a different or ambiguous list request',
    );
  }
  try {
    const current = await client.getList(listId);
    const currentPostconditionKey = digest({
      name: current.name,
      pos: current.pos,
      closed: current.closed,
    }).slice(0, 32);
    if (
      request.family === 'list-update' &&
      typeof request.requested.pos === 'number' &&
      currentPostconditionKey !== recorded.postconditionKeys[0]
    ) {
      return recovery(
        'partial',
        options.operationId,
        request,
        listId,
        'recorded list operation no longer satisfies its postcondition',
      );
    }
    return (await verify(current, request, client))
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          value: current,
        }
      : recovery(
          'partial',
          options.operationId,
          request,
          listId,
          'recorded list operation no longer satisfies its postcondition',
        );
  } catch {
    return recovery(
      'partial',
      options.operationId,
      request,
      listId,
      'recorded list could not be read back',
    );
  }
}

export async function listManagedLists(
  boardId: string,
  client: Pick<ListManagementClient, 'listBoardLists'>,
): Promise<{ boardId: string; lists: TrelloList[] }> {
  return { boardId, lists: await client.listBoardLists(boardId) };
}

export async function initializeBoardWorkflow(
  boardId: string,
  workflow: {
    listNames: Record<WorkUnitStatus, string>;
    listIds: Partial<Record<WorkUnitStatus, string>>;
  },
  client: ListManagementClient,
  options: ListMutationOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const parentRequest: ListRequest = {
    family: 'workflow-init',
    boardId,
    intent: {
      boardId,
      canonicalListNames: workflow.listNames,
      overrideListIds: workflow.listIds,
    },
    requested: { name: 'workflow-init', pos: 'bottom', closed: false },
  };
  const lists = await client.listBoardLists(boardId);
  const missing: WorkUnitStatus[] = [];
  const resolved: Partial<Record<WorkUnitStatus, string>> = {};
  for (const status of Object.keys(workflow.listNames) as WorkUnitStatus[]) {
    const override = workflow.listIds[status];
    if (override) {
      const match = lists.find((list) => list.id === override);
      if (!match || match.idBoard !== boardId) {
        throw new WorkCliError(
          'LIST_BOARD_MISMATCH',
          `Configured ${status} list does not belong to the resolved board.`,
          {
            recovery: { boardId, listId: override, status },
          },
        );
      }
      if (match.closed) {
        throw new WorkCliError(
          'WORKFLOW_LIST_CLOSED',
          `Configured ${status} list is archived and cannot be used for active workflow operations.`,
          { recovery: { boardId, listId: override, status } },
        );
      }
      resolved[status] = override;
      continue;
    }
    const matches = lists.filter(
      (list) =>
        list.idBoard === boardId &&
        !list.closed &&
        list.name === workflow.listNames[status],
    );
    if (matches.length > 1) {
      throw new WorkCliError(
        'WORKFLOW_LIST_AMBIGUOUS',
        `Multiple lists have the exact canonical name ${JSON.stringify(workflow.listNames[status])}.`,
        {
          recovery: {
            boardId,
            status,
            listIds: matches.map((list) => list.id),
          },
        },
      );
    }
    if (matches.length === 1) resolved[status] = matches[0].id;
    else missing.push(status);
  }
  const parent = await recordedOperation(
    boardId,
    options.operationId,
    parentRequest,
    client,
  );
  const replayIdentityMatched = parent.state === 'match';
  if (parent.state === 'conflict') {
    return recovery(
      'partial',
      options.operationId,
      parentRequest,
      parent.listIds[0],
      'operation ID conflicts with a different workflow-init intent',
    );
  }
  if (options.dryRun) {
    return {
      outcome: 'planned',
      plan: {
        operation: 'workflow-init',
        operationId: options.operationId,
        boardId,
        missing,
        preserved: resolved,
      },
    };
  }
  for (const [index, status] of missing.entries()) {
    const childId = `workflow-${digest(`${options.operationId}:${status}`).slice(0, 32)}`;
    const result = await createBoardList(
      boardId,
      { name: workflow.listNames[status] },
      client,
      {
        operationId: childId,
        ...(index === 0
          ? {
              parentRecord: {
                operationId: options.operationId,
                request: parentRequest,
              },
            }
          : {}),
      },
    );
    if (result.outcome === 'partial' || result.outcome === 'ambiguous')
      return result;
    const value = result.value as TrelloList;
    resolved[status] = value.id;
  }
  const verifiedLists = await client.listBoardLists(boardId);
  const unresolvedStatus = (
    Object.keys(workflow.listNames) as WorkUnitStatus[]
  ).find((status) => {
    const listId = resolved[status];
    if (!listId) return true;
    const current = verifiedLists.find((list) => list.id === listId);
    return (
      !current ||
      current.idBoard !== boardId ||
      current.closed ||
      (!workflow.listIds[status] && current.name !== workflow.listNames[status])
    );
  });
  if (unresolvedStatus) {
    return recovery(
      'partial',
      options.operationId,
      parentRequest,
      resolved[unresolvedStatus],
      `workflow mapping for ${unresolvedStatus} could not be verified`,
    );
  }
  return {
    outcome: replayIdentityMatched ? 'recovered' : 'verified',
    operationId: options.operationId,
    value: { boardId, listIds: resolved },
  };
}

export async function createBoardList(
  boardId: string,
  input: { name: string; pos?: ListPosition },
  client: ListManagementClient,
  options: ListMutationOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const name = normalizeName(input.name);
  const pos = normalizePosition(input.pos);
  const request: ListRequest = {
    family: 'list-create',
    boardId,
    intent: { name, pos },
    requested: {
      name,
      pos,
      closed: false,
    },
  };
  const prior = await replay(request, client, options);
  if (prior) return prior;
  if (options.ifVersion !== undefined) {
    throw new WorkCliError(
      'STALE_VERSION',
      'A list create operation has no existing version matching --if-version.',
      {
        exitCode: 4,
        recovery: {
          expectedVersion: options.ifVersion,
          currentVersion: null,
        },
      },
    );
  }
  const duplicate = (await client.listBoardLists(boardId)).find(
    (list) =>
      list.name === request.requested.name &&
      (!options.parentRecord || !list.closed),
  );
  if (duplicate) {
    throw new WorkCliError(
      'LIST_NAME_EXISTS',
      `A list named ${request.requested.name} already exists on the resolved board.`,
      { recovery: { boardId, listId: duplicate.id, closed: duplicate.closed } },
    );
  }
  const plan = {
    operation: request.family,
    operationId: options.operationId,
    boardId,
    requested: request.requested,
  };
  if (options.dryRun) return { outcome: 'planned', plan };

  let created: TrelloList;
  try {
    created = await client.createList({
      idBoard: boardId,
      name: `${taggedName(request.requested.name, options.operationId, request)}${
        options.parentRecord
          ? ` ${marker(options.parentRecord.operationId, options.parentRecord.request)}`
          : ''
      }`,
      pos: request.requested.pos,
    });
  } catch {
    return recovery('ambiguous', options.operationId, request);
  }
  try {
    await client.updateList(created.id, { name: request.requested.name });
  } catch {
    return recovery('ambiguous', options.operationId, request, created.id);
  }
  try {
    const readBack = await client.getList(created.id);
    return (await verify(readBack, request, client))
      ? {
          outcome: 'verified',
          operationId: options.operationId,
          value: readBack,
        }
      : recovery(
          'partial',
          options.operationId,
          request,
          created.id,
          'read-back verification mismatch',
        );
  } catch {
    return recovery('partial', options.operationId, request, created.id);
  }
}

export async function updateBoardList(
  boardId: string,
  listId: string,
  input: { name?: string; pos?: ListPosition },
  client: ListManagementClient,
  options: ListMutationOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const current = await client.getList(listId);
  assertBoard(current, boardId);
  if (current.closed) {
    throw new WorkCliError('LIST_CLOSED', `List ${listId} is already closed.`);
  }
  const requestedName =
    input.name === undefined ? current.name : normalizeName(input.name);
  const requestedPos =
    input.pos === undefined ? current.pos : normalizePosition(input.pos);
  const request: ListRequest = {
    family: 'list-update',
    boardId,
    listId,
    intent: {
      ...(input.name === undefined ? {} : { name: requestedName }),
      ...(input.pos === undefined ? {} : { pos: requestedPos }),
    },
    requested: {
      name: requestedName,
      pos: requestedPos,
      closed: false,
    },
  };
  const prior = await replay(request, client, options);
  if (prior) return prior;
  assertCurrentVersion(options.ifVersion, listVersion(current));
  const plan = {
    operation: request.family,
    operationId: options.operationId,
    boardId,
    listId,
    currentVersion: listVersion(current),
    requested: request.requested,
  };
  if (options.dryRun) return { outcome: 'planned', plan };

  try {
    await client.updateList(listId, {
      name: taggedName(current.name, options.operationId, request),
    });
    await client.updateList(listId, {
      name: request.requested.name,
      pos: request.requested.pos,
    });
  } catch {
    return recovery('ambiguous', options.operationId, request, listId);
  }
  try {
    const readBack = await client.getList(listId);
    return (await verify(readBack, request, client))
      ? {
          outcome: 'verified',
          operationId: options.operationId,
          value: readBack,
        }
      : recovery(
          'partial',
          options.operationId,
          request,
          listId,
          'read-back verification mismatch',
        );
  } catch {
    return recovery('partial', options.operationId, request, listId);
  }
}

export async function closeBoardList(
  boardId: string,
  listId: string,
  client: ListManagementClient,
  options: ListMutationOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const current = await client.getList(listId);
  assertBoard(current, boardId);
  const request: ListRequest = {
    family: 'list-close',
    boardId,
    listId,
    intent: { closed: true },
    requested: {
      name: current.name,
      pos: current.pos,
      closed: true,
    },
  };
  const prior = await replay(request, client, options);
  if (prior) return prior;
  assertCurrentVersion(options.ifVersion, listVersion(current));
  const cards = await client.listListCards(listId);
  if (cards.length > 0) {
    throw new WorkCliError(
      'LIST_NOT_EMPTY',
      `List ${listId} contains ${cards.length} card(s) and cannot be closed.`,
      {
        recovery: {
          boardId,
          listId,
          blockingCardCount: cards.length,
          action: 'move-cards-before-close',
        },
      },
    );
  }
  const plan = {
    operation: request.family,
    operationId: options.operationId,
    boardId,
    listId,
    currentVersion: listVersion(current),
    requested: request.requested,
  };
  if (options.dryRun) return { outcome: 'planned', plan };
  try {
    await client.updateList(listId, {
      name: taggedName(current.name, options.operationId, request),
    });
    await client.updateList(listId, { name: current.name, closed: true });
  } catch {
    return recovery('ambiguous', options.operationId, request, listId);
  }
  try {
    const readBack = await client.getList(listId);
    return (await verify(readBack, request, client))
      ? {
          outcome: 'verified',
          operationId: options.operationId,
          value: readBack,
        }
      : recovery(
          'partial',
          options.operationId,
          request,
          listId,
          'read-back verification mismatch',
        );
  } catch {
    return recovery('partial', options.operationId, request, listId);
  }
}
