import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  resolveBoardSelector,
  resolveWorkflowListMappings,
} from '../src/board';
import {
  checklistCreate,
  checklistItemSet,
  checklistUpdate,
} from '../src/checklist';
import { loadWorkConfig, type WorkConfig } from '../src/config';
import { createWorkUnit } from '../src/create';
import { WorkCliError } from '../src/errors';
import {
  closeBoardList,
  createBoardList,
  initializeBoardWorkflow,
  updateBoardList,
  type ListManagementClient,
} from '../src/list-management';
import { metadataUpdate } from '../src/update';
import { reconcileWorkUnit } from '../src/reconcile';
import { normalizeRemoteCard } from '../src/read-commands';
import { transitionWorkUnit, type TransitionClient } from '../src/transition';
import { TrelloClient } from '../src/trello-client';
import {
  parseWorkUnit,
  renderWorkUnit,
  type WorkUnitDocument,
  type WorkUnitStatus,
} from '../src/work-unit';

const BOARD_ID = /^[0-9a-fA-F]{24}$/;
const STATUSES: WorkUnitStatus[] = [
  'inbox',
  'ready',
  'in_progress',
  'review',
  'blocked',
  'done',
];

export type LiveE2EConfig = {
  boardSelector: string;
  allowlistedBoardId: string;
  credentialSource: 'process-env';
  workConfig: WorkConfig;
  createClient: () => TrelloClient;
};

export type LiveE2EResult = {
  runId: string;
  boardId: string;
  cardsVerifiedInDone: boolean;
  disposableListsVerifiedClosed: boolean;
  leakedResources: Array<Record<string, unknown>>;
};

function required(
  env: Record<string, string | undefined>,
  name: string,
): string | null {
  const value = env[name]?.trim();
  return value ? value : null;
}

export async function loadLiveE2EConfig(
  env: Record<string, string | undefined>,
): Promise<LiveE2EConfig> {
  if (env.TRELLO_LIVE_E2E !== '1') {
    throw new WorkCliError(
      'LIVE_E2E_NOT_ENABLED',
      'Live Trello E2E requires TRELLO_LIVE_E2E=1.',
      { exitCode: 2 },
    );
  }
  const requiredNames = [
    'TRELLO_LIVE_CREDENTIAL_SOURCE',
    'TRELLO_LIVE_BOARD_SELECTOR',
    'TRELLO_LIVE_BOARD_ID',
    'TRELLO_API_KEY',
    'TRELLO_API_TOKEN',
  ];
  const missing = requiredNames.filter((name) => required(env, name) === null);
  if (missing.length > 0) {
    throw new WorkCliError(
      'LIVE_E2E_CONFIGURATION_MISSING',
      `Live Trello E2E configuration is missing: ${missing.join(', ')}.`,
      { exitCode: 2 },
    );
  }
  if (env.TRELLO_LIVE_CREDENTIAL_SOURCE !== 'process-env') {
    throw new WorkCliError(
      'LIVE_E2E_CREDENTIAL_SOURCE_UNCONFIRMED',
      'TRELLO_LIVE_CREDENTIAL_SOURCE must be process-env.',
      { exitCode: 2 },
    );
  }
  const allowlistedBoardId = required(env, 'TRELLO_LIVE_BOARD_ID') as string;
  if (!BOARD_ID.test(allowlistedBoardId)) {
    throw new WorkCliError(
      'LIVE_E2E_BOARD_ALLOWLIST_INVALID',
      'TRELLO_LIVE_BOARD_ID must be an exact 24-character board ID.',
      { exitCode: 2 },
    );
  }
  const loaded = await loadWorkConfig({ env });
  if (!loaded.transitionGraph || !loaded.reconcileSource) {
    throw new WorkCliError(
      'LIVE_E2E_POLICY_UNCONFIRMED',
      'Live Trello E2E requires a complete transition graph and reconciliation source.',
      { exitCode: 2 },
    );
  }
  const apiKey = required(env, 'TRELLO_API_KEY') as string;
  const apiToken = required(env, 'TRELLO_API_TOKEN') as string;
  return {
    boardSelector: required(env, 'TRELLO_LIVE_BOARD_SELECTOR') as string,
    allowlistedBoardId: allowlistedBoardId.toLowerCase(),
    credentialSource: 'process-env',
    workConfig: {
      ...loaded,
      credentials: { apiKey: null, apiToken: null },
      boardId: null,
    },
    createClient: () => new TrelloClient({ apiKey, apiToken }),
  };
}

async function verifiedLiveConfig(
  config: LiveE2EConfig,
  client: TrelloClient,
  runId: string,
): Promise<WorkConfig> {
  await client.getMemberMe();
  try {
    await resolveBoardSelector(`__work-live-no-match-${runId}__`, client);
    throw new WorkCliError(
      'LIVE_E2E_UNKNOWN_BOARD_UNEXPECTEDLY_RESOLVED',
      'The run-unique unknown board selector unexpectedly resolved.',
    );
  } catch (error) {
    if (!(error instanceof WorkCliError) || error.code !== 'BOARD_NOT_FOUND') {
      throw error;
    }
  }
  const board = await resolveBoardSelector(config.boardSelector, client);
  if (board.id.toLowerCase() !== config.allowlistedBoardId) {
    throw new WorkCliError(
      'LIVE_E2E_BOARD_ALLOWLIST_MISMATCH',
      'Resolved board does not match the exact live-E2E allowlisted board ID.',
      {
        recovery: {
          resolvedBoard: { id: board.id, name: board.name },
          allowlistedBoardId: config.allowlistedBoardId,
        },
      },
    );
  }
  const initialized = await initializeBoardWorkflow(
    board.id,
    config.workConfig,
    client,
    { operationId: `${runId}-workflow-init` },
  );
  if (!['verified', 'recovered'].includes(String(initialized.outcome))) {
    throw new WorkCliError(
      'LIVE_E2E_WORKFLOW_INIT_UNVERIFIED',
      'Canonical workflow initialization could not be verified.',
      { recovery: initialized.recovery as Record<string, unknown> },
    );
  }
  const effectiveListIds = await resolveWorkflowListMappings(
    board.id,
    config.workConfig.listIds,
    config.workConfig.listNames,
    client,
  );
  const lists = await client.listBoardLists(board.id);
  const listById = new Map(lists.map((list) => [list.id, list]));
  const configured = STATUSES.map((status) => effectiveListIds[status]);
  const missing = configured.filter((id) => !listById.has(id));
  const closed = configured.filter((id) => listById.get(id)?.closed);
  if (
    missing.length > 0 ||
    closed.length > 0 ||
    new Set(configured).size !== configured.length
  ) {
    throw new WorkCliError(
      'LIVE_E2E_LIST_MAPPING_INVALID',
      'Every live-E2E status list must be unique, open, and belong to the allowlisted board.',
      {
        recovery: {
          boardId: board.id,
          missingListIds: missing,
          closedListIds: closed,
        },
      },
    );
  }
  return {
    ...config.workConfig,
    boardId: board.id,
    listIds: effectiveListIds,
  };
}

export async function createRunWorkflowFixture(
  boardId: string,
  config: Pick<WorkConfig, 'listNames' | 'listIds'>,
  marker: string,
  operationId: string,
  client: ListManagementClient,
): Promise<{ listIds: string[] }> {
  const listNames = Object.fromEntries(
    STATUSES.map((status) => [status, `${marker} ${config.listNames[status]}`]),
  ) as WorkConfig['listNames'];
  const runWorkflow = { listNames, listIds: {} };
  const initialized = await initializeBoardWorkflow(
    boardId,
    runWorkflow,
    client,
    {
      operationId,
    },
  );
  const replay = await initializeBoardWorkflow(boardId, runWorkflow, client, {
    operationId,
  });
  const collision = await initializeBoardWorkflow(
    boardId,
    {
      ...runWorkflow,
      listNames: { ...listNames, done: `${marker} Changed Done` },
    },
    client,
    { operationId },
  );
  if (
    initialized.outcome !== 'verified' ||
    replay.outcome !== 'recovered' ||
    collision.outcome !== 'partial'
  ) {
    throw new WorkCliError(
      'LIVE_E2E_WORKFLOW_INIT_IDENTITY_FAILED',
      'Run-owned workflow initialization parent replay/collision behavior was not verified.',
    );
  }
  const lists = await client.listBoardLists(boardId);
  const listIds = STATUSES.map((status) => {
    const matches = lists.filter(
      (list) => !list.closed && list.name === listNames[status],
    );
    if (matches.length !== 1) {
      throw new WorkCliError(
        'LIVE_E2E_RUN_WORKFLOW_OWNERSHIP_UNVERIFIED',
        'Every temporary workflow list must be uniquely run-owned and open.',
      );
    }
    return matches[0].id;
  });
  return { listIds };
}

export function prepareLiveWorkUnitDraft(
  draft: WorkUnitDocument,
  runId: string,
  marker: string,
): WorkUnitDocument {
  const sections = { ...draft.sections };
  delete sections['Open Questions'];
  return {
    metadata: {
      ...draft.metadata,
      title: `${marker} Work Unit`,
      labels: [...new Set([...draft.metadata.labels, runId])],
    },
    sections: {
      ...sections,
      Context: `${sections.Context}\n\n${marker}`,
    },
  };
}

function pathToDone(
  from: WorkUnitStatus,
  graph: NonNullable<WorkConfig['transitionGraph']>,
): WorkUnitStatus[] {
  const queue: Array<{ status: WorkUnitStatus; path: WorkUnitStatus[] }> = [
    { status: from, path: [] },
  ];
  const visited = new Set<WorkUnitStatus>([from]);
  while (queue.length > 0) {
    const current = queue.shift() as {
      status: WorkUnitStatus;
      path: WorkUnitStatus[];
    };
    if (current.status === 'done') return current.path;
    for (const target of graph[current.status] ?? []) {
      if (visited.has(target)) continue;
      visited.add(target);
      queue.push({ status: target, path: [...current.path, target] });
    }
  }
  throw new WorkCliError(
    'LIVE_E2E_DONE_UNREACHABLE',
    `Configured transitions cannot move ${from} to done.`,
  );
}

export function createRunCardConfig(
  config: WorkConfig,
  inboxListId: string,
): WorkConfig {
  return {
    ...config,
    listIds: { ...config.listIds, inbox: inboxListId },
  };
}

export async function moveRunCardToDone(
  cardId: string,
  runId: string,
  config: WorkConfig,
  client: TransitionClient,
): Promise<void> {
  const current = normalizeRemoteCard(await client.getCard(cardId));
  const graph = config.transitionGraph as NonNullable<
    WorkConfig['transitionGraph']
  >;
  let step = 0;
  for (const target of pathToDone(current.metadata.status, graph)) {
    const result = await transitionWorkUnit(cardId, target, config, client, {
      operationId: `${runId}-cleanup-transition-${step}`,
    });
    if (!['verified', 'recovered'].includes(String(result.outcome))) {
      throw new WorkCliError(
        'LIVE_E2E_CARD_CLEANUP_FAILED',
        'Run card could not be verified through a status transition to Done.',
        {
          recovery: {
            runId,
            boardId: config.boardId,
            resourceId: cardId,
            currentState: target,
            action: 'resume-status-transitions-to-done',
          },
        },
      );
    }
    step += 1;
  }
}

export async function runLiveTrelloScenario(
  input: LiveE2EConfig,
): Promise<LiveE2EResult> {
  const client = input.createClient();
  const runId = `live-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const config = await verifiedLiveConfig(input, client, runId);
  const boardId = config.boardId as string;
  const marker = `[work-live-run:${runId}]`;
  const leakedResources: Array<Record<string, unknown>> = [];
  let disposableListId: string | null = null;
  const runOwnedListIds = new Set<string>();
  let effectiveCardConfig = config;
  let scenarioError: unknown = null;

  try {
    const workflowFixture = await createRunWorkflowFixture(
      boardId,
      config,
      marker,
      `${runId}-run-workflow-init`,
      client,
    );
    workflowFixture.listIds.forEach((id) => runOwnedListIds.add(id));
    const createdList = await createBoardList(
      boardId,
      { name: `${marker} disposable`, pos: 'bottom' },
      client,
      { operationId: `${runId}-list-create` },
    );
    if (createdList.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_LIST_CREATE_FAILED',
        'Disposable list creation was not verified.',
        { recovery: createdList.recovery as Record<string, unknown> },
      );
    }
    disposableListId = (createdList.value as { id: string }).id;
    runOwnedListIds.add(disposableListId);
    const replay = await createBoardList(
      boardId,
      { name: `${marker} disposable`, pos: 'bottom' },
      client,
      { operationId: `${runId}-list-create` },
    );
    const collision = await createBoardList(
      boardId,
      { name: `${marker} collision`, pos: 'bottom' },
      client,
      { operationId: `${runId}-list-create` },
    );
    if (replay.outcome !== 'recovered' || collision.outcome !== 'partial') {
      throw new WorkCliError(
        'LIVE_E2E_LIST_REPLAY_FAILED',
        'List operation replay/collision behavior was not verified.',
      );
    }
    const createDryRun = await createBoardList(
      boardId,
      { name: `${marker} dry-run-only`, pos: 'bottom' },
      client,
      { dryRun: true, operationId: `${runId}-list-create-dry-run` },
    );
    if (createDryRun.outcome !== 'planned') {
      throw new WorkCliError(
        'LIVE_E2E_LIST_CREATE_DRY_RUN_FAILED',
        'List create dry-run did not return a production plan.',
      );
    }
    const updateDryRun = await updateBoardList(
      boardId,
      disposableListId,
      { name: `${marker} disposable renamed`, pos: 'top' },
      client,
      { dryRun: true, operationId: `${runId}-list-update-dry-run` },
    );
    if (updateDryRun.outcome !== 'planned') {
      throw new WorkCliError(
        'LIVE_E2E_LIST_UPDATE_DRY_RUN_FAILED',
        'List update dry-run did not return a production plan.',
      );
    }
    try {
      await updateBoardList(
        boardId,
        disposableListId,
        { name: `${marker} stale-version`, pos: 'top' },
        client,
        {
          ifVersion: 'stale-live-version',
          operationId: `${runId}-list-update-stale`,
        },
      );
      throw new WorkCliError(
        'LIVE_E2E_STALE_VERSION_UNEXPECTEDLY_ACCEPTED',
        'A stale live list version was unexpectedly accepted.',
      );
    } catch (error) {
      if (!(error instanceof WorkCliError) || error.code !== 'STALE_VERSION') {
        throw error;
      }
    }
    const updatedList = await updateBoardList(
      boardId,
      disposableListId,
      { name: `${marker} disposable renamed`, pos: 'top' },
      client,
      { operationId: `${runId}-list-update` },
    );
    const updateReplay = await updateBoardList(
      boardId,
      disposableListId,
      { name: `${marker} disposable renamed`, pos: 'top' },
      client,
      { operationId: `${runId}-list-update` },
    );
    const updateCollision = await updateBoardList(
      boardId,
      disposableListId,
      { name: `${marker} changed update`, pos: 'top' },
      client,
      { operationId: `${runId}-list-update` },
    );
    if (
      updatedList.outcome !== 'verified' ||
      updateReplay.outcome !== 'recovered' ||
      updateCollision.outcome !== 'partial'
    ) {
      throw new WorkCliError(
        'LIVE_E2E_LIST_UPDATE_FAILED',
        'Disposable list update/replay/collision behavior was not verified.',
      );
    }

    const draftPath = resolve(__dirname, 'fixtures', 'valid-draft.md');
    const draft = prepareLiveWorkUnitDraft(
      parseWorkUnit(await readFile(draftPath, 'utf8')),
      runId,
      marker,
    );
    effectiveCardConfig = createRunCardConfig(config, disposableListId);
    const created = await createWorkUnit(
      renderWorkUnit(draft),
      effectiveCardConfig,
      client,
      {
        operationId: `${runId}-card-create`,
      },
    );
    if (created.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_CARD_CREATE_FAILED',
        'Run card creation was not verified.',
        { recovery: created.recovery as Record<string, unknown> },
      );
    }
    const cardId = (created.workUnit as { card: { id: string } }).card.id;
    const cardReplay = await createWorkUnit(
      renderWorkUnit(draft),
      effectiveCardConfig,
      client,
      { operationId: `${runId}-card-create` },
    );
    if (cardReplay.outcome !== 'recovered') {
      throw new WorkCliError(
        'LIVE_E2E_WORK_UNIT_REPLAY_FAILED',
        'Exact Work Unit operation replay was not recovered by production code.',
      );
    }
    try {
      await closeBoardList(boardId, disposableListId, client, {
        operationId: `${runId}-list-close-occupied`,
      });
      throw new WorkCliError(
        'LIVE_E2E_OCCUPIED_LIST_UNEXPECTEDLY_CLOSED',
        'An occupied run-owned list was unexpectedly closed.',
      );
    } catch (error) {
      if (!(error instanceof WorkCliError) || error.code !== 'LIST_NOT_EMPTY') {
        throw error;
      }
    }
    const updated = await metadataUpdate(
      cardId,
      { priority: 'high' },
      config,
      client,
      { operationId: `${runId}-metadata-update` },
    );
    if (updated.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_CARD_UPDATE_FAILED',
        'Run card metadata update was not verified.',
      );
    }

    const checklist = await checklistCreate(
      cardId,
      `${marker} verification`,
      config,
      client,
      { operationId: `${runId}-checklist-create` },
    );
    if (checklist.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_CHECKLIST_CREATE_FAILED',
        'Run checklist creation was not verified.',
      );
    }
    const checklistId = (checklist.checklist as { id: string }).id;
    const renamedChecklist = await checklistUpdate(
      cardId,
      checklistId,
      `${marker} verified`,
      config,
      client,
      { operationId: `${runId}-checklist-update` },
    );
    if (renamedChecklist.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_CHECKLIST_UPDATE_FAILED',
        'Run checklist update was not verified.',
      );
    }
    const item = await client.createChecklistItem(
      checklistId,
      `${marker} item`,
    );
    const checkedItem = await checklistItemSet(
      cardId,
      checklistId,
      item.id,
      true,
      config,
      client,
      { operationId: `${runId}-checklist-item-set` },
    );
    if (checkedItem.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_CHECKLIST_ITEM_FAILED',
        'Run checklist item update was not verified.',
      );
    }

    await moveRunCardToDone(cardId, runId, effectiveCardConfig, client);
    const reconciled = await reconcileWorkUnit(cardId, config, client, {
      operationId: `${runId}-reconcile`,
    });
    if (reconciled.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_RECONCILE_FAILED',
        'Run card reconciliation was not verified.',
      );
    }
    const closeDryRun = await closeBoardList(
      boardId,
      disposableListId,
      client,
      { dryRun: true, operationId: `${runId}-list-close-dry-run` },
    );
    const closedList = await closeBoardList(boardId, disposableListId, client, {
      operationId: `${runId}-list-close`,
    });
    const closeReplay = await closeBoardList(
      boardId,
      disposableListId,
      client,
      { operationId: `${runId}-list-close` },
    );
    const closeCollisionTarget = await createBoardList(
      boardId,
      { name: `${marker} close collision target`, pos: 'bottom' },
      client,
      { operationId: `${runId}-list-close-collision-target-create` },
    );
    if (closeCollisionTarget.outcome !== 'verified') {
      throw new WorkCliError(
        'LIVE_E2E_LIST_CLOSE_COLLISION_FIXTURE_FAILED',
        'Could not verify the run-owned close-collision target list.',
      );
    }
    const closeCollision = await closeBoardList(
      boardId,
      (closeCollisionTarget.value as { id: string }).id,
      client,
      { operationId: `${runId}-list-close` },
    );
    if (
      closeDryRun.outcome !== 'planned' ||
      closedList.outcome !== 'verified' ||
      closeReplay.outcome !== 'recovered' ||
      closeCollision.outcome !== 'partial'
    ) {
      throw new WorkCliError(
        'LIVE_E2E_LIST_CLOSE_IDENTITY_FAILED',
        'List close dry-run/replay/changed-intent behavior was not verified.',
      );
    }
  } catch (error) {
    scenarioError = error;
  } finally {
    const runCards = (await client.listBoardCards(boardId)).filter(
      (card) => card.name.includes(marker) || card.desc.includes(marker),
    );
    for (const card of runCards) {
      try {
        await moveRunCardToDone(card.id, runId, effectiveCardConfig, client);
        const readBack = normalizeRemoteCard(await client.getCard(card.id));
        if (
          readBack.metadata.status !== 'done' ||
          readBack.card.idList !== config.listIds.done
        ) {
          leakedResources.push({
            runId,
            boardId,
            resourceId: card.id,
            currentState: 'not-verified-in-done',
            action: 'resume-status-transitions-to-done',
          });
        }
      } catch {
        leakedResources.push({
          runId,
          boardId,
          resourceId: card.id,
          currentState: 'not-verified-in-done',
          action: 'resume-status-transitions-to-done',
        });
      }
    }
    const runLists = (await client.listBoardLists(boardId)).filter(
      (list) =>
        list.name.includes(marker) ||
        runOwnedListIds.has(list.id) ||
        (disposableListId !== null && list.id === disposableListId),
    );
    for (const list of runLists) {
      try {
        const cards = await client.listListCards(list.id);
        if (cards.length > 0) {
          leakedResources.push({
            runId,
            boardId,
            resourceId: list.id,
            currentState: { closed: false, blockingCardCount: cards.length },
            action: 'move-run-cards-to-done-then-close-list',
          });
        } else if (list.closed) {
          continue;
        } else {
          const closed = await closeBoardList(boardId, list.id, client, {
            operationId: `${runId}-list-close-${list.id.slice(-8)}`,
          });
          if (
            !['verified', 'recovered'].includes(String(closed.outcome)) ||
            !(await client.getList(list.id)).closed
          ) {
            leakedResources.push({
              runId,
              boardId,
              resourceId: list.id,
              currentState: 'close-not-verified',
              action: 'verify-empty-then-close-list',
            });
          }
        }
      } catch {
        leakedResources.push({
          runId,
          boardId,
          resourceId: list.id,
          currentState: 'close-not-verified',
          action: 'verify-empty-then-close-list',
        });
      }
    }
  }

  if (scenarioError || leakedResources.length > 0) {
    throw new WorkCliError(
      'LIVE_E2E_FAILED',
      'Live Trello E2E failed; preserve the recovery record and do not blindly retry.',
      {
        recovery: {
          runId,
          boardId,
          leakedResources,
          action: 'run-approved-recovery-with-the-same-run-id',
        },
        cause: scenarioError,
      },
    );
  }
  return {
    runId,
    boardId,
    cardsVerifiedInDone: true,
    disposableListsVerifiedClosed: true,
    leakedResources,
  };
}
