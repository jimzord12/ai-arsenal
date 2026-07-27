import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { normalizeRemoteCard, resolveCard } from './read-commands';
import type { TrelloCard } from './trello-types';
import { assertCurrentVersion } from './version';
import {
  operationRecord,
  operationRecordState,
  validateOperationId,
} from './mutation';
import {
  parseWorkUnit,
  renderWorkUnit,
  type WorkUnitStatus,
} from './work-unit';

export interface ReconcileClient {
  getCard(reference: string): Promise<TrelloCard>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  updateCard(
    cardId: string,
    input: { desc?: string; idList?: string },
  ): Promise<TrelloCard>;
}

export type ReconcileOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
  now?: string;
};

function requirePolicy(config: WorkConfig): 'description' | 'list' {
  if (
    !config.boardId ||
    !config.reconcileSource ||
    Object.keys(config.listIds).length === 0
  ) {
    throw new WorkCliError(
      'RECONCILE_POLICY_UNCONFIGURED',
      'Board, list mappings, and reconciliation source must be configured.',
    );
  }
  const ids = Object.values(config.listIds).filter(
    (id): id is string => id !== undefined,
  );
  if (new Set(ids).size !== ids.length) {
    throw new WorkCliError(
      'RECONCILE_POLICY_UNCONFIGURED',
      'Reconciliation list mappings must be unique.',
    );
  }
  return config.reconcileSource;
}

function statusForList(
  config: WorkConfig,
  listId: string,
): WorkUnitStatus | null {
  const entry = Object.entries(config.listIds).find(([, id]) => id === listId);
  return (entry?.[0] as WorkUnitStatus | undefined) ?? null;
}

function withStatusAndOperation(
  card: TrelloCard,
  status: WorkUnitStatus,
  operationId: string,
  now: string,
  postcondition: unknown,
): string {
  const current = normalizeRemoteCard(card);
  const marker = operationRecord(operationId, postcondition);
  const document = {
    metadata: { ...current.metadata, status, updated_at: now },
    sections: {
      ...current.sections,
      Context: current.sections.Context.includes(marker)
        ? current.sections.Context
        : `${current.sections.Context}\n\n${marker}`,
    },
  };
  const desc = renderWorkUnit(document);
  parseWorkUnit(desc);
  return desc;
}

export async function reconcileWorkUnit(
  reference: string,
  config: WorkConfig,
  client: ReconcileClient,
  options: ReconcileOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const source = requirePolicy(config);
  const card = await resolveCard(reference, config, client);
  const current = normalizeRemoteCard(card);
  const listStatus = statusForList(config, card.idList);
  const descriptionStatus = current.metadata.status;
  if (!listStatus || !config.listIds[descriptionStatus]) {
    throw new WorkCliError(
      'RECONCILE_POLICY_UNCONFIGURED',
      'Current list or description status has no configured mapping.',
    );
  }
  const targetStatus =
    source === 'description' ? descriptionStatus : listStatus;
  const targetListId = config.listIds[targetStatus] as string;
  const postcondition = {
    operation: 'reconcile',
    source,
    targetStatus,
    targetListId,
  };
  const operationState = operationRecordState(
    card.desc,
    options.operationId,
    postcondition,
  );
  if (operationState !== 'absent') {
    const exact =
      operationState === 'match' &&
      descriptionStatus === targetStatus &&
      card.idList === targetListId;
    return exact
      ? {
          outcome: 'recovered',
          repaired: true,
          operationId: options.operationId,
          workUnit: current,
        }
      : {
          outcome: 'partial',
          recovery: {
            operationId: options.operationId,
            cardId: card.id,
            action: 'reconcile',
            reason: 'operation record conflicts with requested repair',
          },
        };
  }
  assertCurrentVersion(options.ifVersion, current.version);
  if (descriptionStatus === listStatus) {
    return {
      outcome: 'verified',
      repaired: false,
      operationId: options.operationId,
      workUnit: current,
    };
  }
  const now = options.now ?? new Date().toISOString();
  const desc = withStatusAndOperation(
    card,
    targetStatus,
    options.operationId,
    now,
    postcondition,
  );
  const repair = { source, targetStatus, targetListId };
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operationId: options.operationId,
      drift: { descriptionStatus, listStatus },
      repair,
    };
  }
  try {
    await client.updateCard(card.id, { desc, idList: targetListId });
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return {
        outcome: 'ambiguous',
        recovery: { operationId: options.operationId, cardId: card.id, repair },
      };
    }
    throw error;
  }
  let readBack: TrelloCard;
  try {
    readBack = await client.getCard(card.id);
  } catch {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        repair,
        action: 'reconcile',
      },
    };
  }
  let verified: boolean;
  try {
    verified =
      readBack.desc === desc &&
      readBack.idList === targetListId &&
      normalizeRemoteCard(readBack).metadata.status === targetStatus;
  } catch {
    verified = false;
  }
  if (!verified) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        repair,
        action: 'reconcile',
      },
    };
  }
  return {
    outcome: 'verified',
    repaired: true,
    operationId: options.operationId,
    workUnit: normalizeRemoteCard(readBack),
  };
}
