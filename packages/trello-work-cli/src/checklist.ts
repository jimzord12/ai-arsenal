import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { resolveCard } from './read-commands';
import type {
  TrelloCard,
  TrelloChecklist,
  TrelloChecklistItem,
} from './trello-types';
import { assertCurrentVersion } from './version';
import {
  operationRecord,
  operationRecordPresent,
  operationRecordState,
  operationRecordValue,
  preflightDescription,
  validateOperationId,
} from './mutation';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

export interface ChecklistClient {
  getCard(reference: string): Promise<TrelloCard>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  listChecklists(cardId: string): Promise<TrelloChecklist[]>;

  createChecklist(cardId: string, name: string): Promise<TrelloChecklist>;
  updateChecklist(checklistId: string, name: string): Promise<TrelloChecklist>;
  setChecklistItemState(
    cardId: string,
    itemId: string,
    checked: boolean,
  ): Promise<TrelloChecklistItem>;
  updateCard(cardId: string, input: { desc?: string }): Promise<TrelloCard>;
}

export type ChecklistMutationOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
};

const TRELLO_ID = /^[0-9a-fA-F]{24}$/;

function requireConfiguration(config: WorkConfig): void {
  if (!config.boardId) {
    throw new WorkCliError(
      'TRELLO_CONFIGURATION_MISSING',
      'TRELLO_BOARD_ID is required for checklist operations.',
    );
  }
}

function validateName(name: string): string {
  const normalized = name.trim();
  if (!normalized || normalized !== name || /[\r\n]/.test(name)) {
    throw new WorkCliError(
      'INVALID_CHECKLIST_NAME',
      'Checklist name must be a non-empty single line without outer whitespace.',
      { exitCode: 2 },
    );
  }
  return normalized;
}

function validateStableId(
  id: string,
  kind: 'CHECKLIST' | 'CHECKLIST_ITEM',
): void {
  if (!TRELLO_ID.test(id)) {
    throw new WorkCliError(
      `INVALID_${kind}_ID`,
      `${kind === 'CHECKLIST' ? 'Checklist' : 'Checklist item'} must be addressed by a stable 24-character Trello ID.`,
      { exitCode: 2 },
    );
  }
}

async function currentCard(
  reference: string,
  config: WorkConfig,
  client: ChecklistClient,
  options?: ChecklistMutationOptions,
): Promise<TrelloCard> {
  if (options) validateOperationId(options.operationId);
  requireConfiguration(config);
  const card = await resolveCard(reference, config, client);
  return card;
}

function partial(
  options: ChecklistMutationOptions,
  cardId: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    outcome: 'partial',
    recovery: {
      operationId: options.operationId,
      cardId,
      action: 'reconcile',
      ...extra,
    },
  };
}

type ChecklistRecord = {
  family: 'checklist-create' | 'checklist-update' | 'checklist-item-set';
  cardId: string;
  checklistId: string;
  itemId?: string;
  requested: Record<string, unknown>;
};

function sameRequest(
  value: unknown,
  family: ChecklistRecord['family'],
  cardId: string,
  requested: Record<string, unknown>,
): value is ChecklistRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ChecklistRecord>;
  return (
    record.family === family &&
    record.cardId === cardId &&
    JSON.stringify(record.requested) === JSON.stringify(requested) &&
    typeof record.checklistId === 'string'
  );
}

async function persistRecord(
  card: TrelloCard,
  client: ChecklistClient,
  operationId: string,
  record: ChecklistRecord,
): Promise<void> {
  const desc = preflightChecklistRecord(card, operationId, record);
  await client.updateCard(card.id, { desc });
}

function preflightChecklistRecord(
  card: TrelloCard,
  operationId: string,
  record: ChecklistRecord,
): string {
  const document = parseWorkUnit(card.desc);
  const marker = operationRecord(operationId, record);
  document.sections.Context = `${document.sections.Context}\n\n${marker}`;
  const desc = renderWorkUnit(document);
  preflightDescription({
    current: card.desc,
    proposed: desc,
    operation: record.family,
    operationRecord: marker,
  });
  return desc;
}

function conflict(
  options: ChecklistMutationOptions,
  cardId: string,
): Record<string, unknown> {
  return partial(options, cardId, {
    reason: 'operation ID conflicts with a different checklist request',
  });
}

export async function checklistList(
  reference: string,
  config: WorkConfig,
  client: ChecklistClient,
): Promise<{ cardId: string; checklists: TrelloChecklist[] }> {
  const card = await currentCard(reference, config, client);
  return { cardId: card.id, checklists: await client.listChecklists(card.id) };
}

export async function checklistCreate(
  reference: string,
  nameInput: string,
  config: WorkConfig,
  client: ChecklistClient,
  options: ChecklistMutationOptions,
): Promise<Record<string, unknown>> {
  const name = validateName(nameInput);
  const card = await currentCard(reference, config, client, options);
  const requested = { name };
  const recorded = operationRecordValue(card.desc, options.operationId);
  if (
    recorded &&
    typeof recorded === 'object' &&
    (recorded as { version?: unknown }).version === 2
  ) {
    const existing = (await client.listChecklists(card.id)).find(
      (candidate) =>
        candidate.name === name &&
        operationRecordState(card.desc, options.operationId, {
          family: 'checklist-create',
          cardId: card.id,
          checklistId: candidate.id,
          requested,
        }) === 'match',
    );
    return existing
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          checklist: existing,
          value: { checklist: existing },
        }
      : conflict(options, card.id);
  }
  if (recorded !== null) {
    if (!sameRequest(recorded, 'checklist-create', card.id, requested))
      return conflict(options, card.id);
    const existing = (await client.listChecklists(card.id)).find(
      (candidate) => candidate.id === recorded.checklistId,
    );
    return existing
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          checklist: existing,
          value: { checklist: existing },
        }
      : partial(options, card.id, { checklistId: recorded.checklistId });
  }
  assertCurrentVersion(options.ifVersion, card.dateLastActivity);
  const before = await client.listChecklists(card.id);
  const matches = before.filter((checklist) => checklist.name === name);
  if (matches.length > 1) {
    throw new WorkCliError(
      'CHECKLIST_CREATE_AMBIGUOUS',
      'Multiple existing checklists have the requested name; refusing to create another.',
      { recovery: { operationId: options.operationId, cardId: card.id } },
    );
  }
  preflightChecklistRecord(card, options.operationId, {
    family: 'checklist-create',
    cardId: card.id,
    checklistId: '000000000000000000000000',
    requested,
  });
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operationId: options.operationId,
      cardId: card.id,
      name,
      plan: { operationId: options.operationId, cardId: card.id, name },
    };
  }
  let created: TrelloChecklist;
  try {
    created = await client.createChecklist(card.id, name);
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return {
        outcome: 'ambiguous',
        recovery: {
          operationId: options.operationId,
          cardId: card.id,
          name,
          action: 'reconcile',
        },
      };
    }
    throw error;
  }
  let readBack: TrelloChecklist[];
  try {
    readBack = await client.listChecklists(card.id);
  } catch {
    return partial(options, card.id, { checklistId: created.id });
  }
  const verified = readBack.find(
    (checklist) => checklist.id === created.id && checklist.name === name,
  );
  if (!verified) return partial(options, card.id, { checklistId: created.id });
  try {
    await persistRecord(card, client, options.operationId, {
      family: 'checklist-create',
      cardId: card.id,
      checklistId: verified.id,
      requested,
    });
  } catch {
    return partial(options, card.id, { checklistId: created.id });
  }
  return {
    outcome: 'verified',
    operationId: options.operationId,
    checklist: verified,
    value: { checklist: verified },
  };
}

export async function checklistUpdate(
  reference: string,
  checklistId: string,
  nameInput: string,
  config: WorkConfig,
  client: ChecklistClient,
  options: ChecklistMutationOptions,
): Promise<Record<string, unknown>> {
  validateStableId(checklistId, 'CHECKLIST');
  const name = validateName(nameInput);
  const card = await currentCard(reference, config, client, options);
  const requested = { checklistId, name };
  const expectedRecord: ChecklistRecord = {
    family: 'checklist-update',
    cardId: card.id,
    checklistId,
    requested,
  };
  const recorded = operationRecordValue(card.desc, options.operationId);
  if (operationRecordPresent(card.desc, options.operationId)) {
    if (
      operationRecordState(card.desc, options.operationId, expectedRecord) !==
        'match' &&
      !sameRequest(recorded, 'checklist-update', card.id, requested)
    )
      return conflict(options, card.id);
    const existing = (await client.listChecklists(card.id)).find(
      (candidate) => candidate.id === checklistId && candidate.name === name,
    );
    return existing
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          checklist: existing,
          value: { checklist: existing },
        }
      : partial(options, card.id, { checklistId });
  }
  assertCurrentVersion(options.ifVersion, card.dateLastActivity);
  const before = await client.listChecklists(card.id);
  const current = before.find((checklist) => checklist.id === checklistId);
  if (!current) {
    throw new WorkCliError(
      'CHECKLIST_NOT_FOUND',
      `Checklist ${checklistId} was not found.`,
    );
  }
  preflightChecklistRecord(card, options.operationId, expectedRecord);
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operationId: options.operationId,
      checklistId,
      name,
      plan: { operationId: options.operationId, checklistId, name },
    };
  }
  try {
    await client.updateChecklist(checklistId, name);
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return partial(options, card.id, { checklistId, ambiguous: true });
    }
    throw error;
  }
  let readBack: TrelloChecklist[];
  try {
    readBack = await client.listChecklists(card.id);
  } catch {
    return partial(options, card.id, { checklistId });
  }
  const verified = readBack.find(
    (checklist) => checklist.id === checklistId && checklist.name === name,
  );
  if (!verified) return partial(options, card.id, { checklistId });
  try {
    await persistRecord(card, client, options.operationId, {
      family: 'checklist-update',
      cardId: card.id,
      checklistId,
      requested,
    });
  } catch {
    return partial(options, card.id, { checklistId });
  }
  return {
    outcome: 'verified',
    operationId: options.operationId,
    checklist: verified,
    value: { checklist: verified },
  };
}

export async function checklistItemSet(
  reference: string,
  checklistId: string,
  itemId: string,
  checked: boolean,
  config: WorkConfig,
  client: ChecklistClient,
  options: ChecklistMutationOptions,
): Promise<Record<string, unknown>> {
  validateStableId(checklistId, 'CHECKLIST');
  validateStableId(itemId, 'CHECKLIST_ITEM');
  const card = await currentCard(reference, config, client, options);
  const expectedState = checked ? 'complete' : 'incomplete';
  const requested = { checklistId, itemId, state: expectedState };
  const expectedRecord: ChecklistRecord = {
    family: 'checklist-item-set',
    cardId: card.id,
    checklistId,
    itemId,
    requested,
  };
  const recorded = operationRecordValue(card.desc, options.operationId);
  if (operationRecordPresent(card.desc, options.operationId)) {
    if (
      operationRecordState(card.desc, options.operationId, expectedRecord) !==
        'match' &&
      !sameRequest(recorded, 'checklist-item-set', card.id, requested)
    )
      return conflict(options, card.id);
    const existing = (await client.listChecklists(card.id))
      .find((candidate) => candidate.id === checklistId)
      ?.checkItems.find(
        (candidate) =>
          candidate.id === itemId && candidate.state === expectedState,
      );
    return existing
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          item: existing,
          value: { item: existing },
        }
      : partial(options, card.id, { checklistId, itemId });
  }
  assertCurrentVersion(options.ifVersion, card.dateLastActivity);
  const before = await client.listChecklists(card.id);
  const checklist = before.find((candidate) => candidate.id === checklistId);
  const item = checklist?.checkItems.find(
    (candidate) => candidate.id === itemId,
  );
  if (!checklist || !item) {
    throw new WorkCliError(
      'CHECKLIST_ITEM_NOT_FOUND',
      `Checklist item ${itemId} was not found in checklist ${checklistId}.`,
    );
  }
  preflightChecklistRecord(card, options.operationId, expectedRecord);
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operationId: options.operationId,
      checklistId,
      itemId,
      state: expectedState,
      plan: {
        operationId: options.operationId,
        checklistId,
        itemId,
        state: expectedState,
      },
    };
  }
  try {
    await client.setChecklistItemState(card.id, itemId, checked);
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return partial(options, card.id, {
        checklistId,
        itemId,
        ambiguous: true,
      });
    }
    throw error;
  }
  let readBack: TrelloChecklist[];
  try {
    readBack = await client.listChecklists(card.id);
  } catch {
    return partial(options, card.id, { checklistId, itemId });
  }
  const verified = readBack
    .find((candidate) => candidate.id === checklistId)
    ?.checkItems.find(
      (candidate) =>
        candidate.id === itemId && candidate.state === expectedState,
    );
  if (!verified) return partial(options, card.id, { checklistId, itemId });
  try {
    await persistRecord(card, client, options.operationId, {
      family: 'checklist-item-set',
      cardId: card.id,
      checklistId,
      itemId,
      requested,
    });
  } catch {
    return partial(options, card.id, { checklistId, itemId });
  }
  return {
    outcome: 'verified',
    operationId: options.operationId,
    item: verified,
    value: { item: verified },
  };
}
