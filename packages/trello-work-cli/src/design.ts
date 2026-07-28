import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import {
  operationRecord,
  operationRecordState,
  validateOperationId,
} from './mutation';
import { normalizeRemoteCard, resolveCard } from './read-commands';
import type { TrelloCard } from './trello-types';
import { assertCurrentVersion } from './version';
import {
  parseWorkUnit,
  renderWorkUnit,
  type WorkUnitDocument,
} from './work-unit';

export interface DesignClient {
  getCard(reference: string): Promise<TrelloCard>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  updateCard(
    cardId: string,
    input: { name?: string; desc?: string; idList?: string },
  ): Promise<TrelloCard>;
}
export type DesignOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
  now?: string;
};

export async function startDesign(
  reference: string,
  source: string,
  config: WorkConfig,
  client: DesignClient,
  options: DesignOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  if (!config.boardId || !config.listIds.inbox || !config.listIds.in_design) {
    throw new WorkCliError(
      'TRELLO_CONFIGURATION_MISSING',
      'Board, Inbox, and In Design list mappings are required.',
    );
  }
  const card = await resolveCard(reference, config, client);
  const template = parseWorkUnit(source);
  if (template.metadata.id !== null || template.metadata.status !== 'inbox') {
    throw new WorkCliError(
      'DESIGN_START_REQUIRES_DRAFT',
      'Design content must be a canonical Inbox draft.',
    );
  }
  const postcondition = {
    operation: 'design-start',
    cardId: card.id,
    targetListId: config.listIds.in_design,
    source: renderWorkUnit(template),
  };
  const conflictingCard = (await client.listBoardCards(config.boardId)).find(
    (candidate) =>
      candidate.id !== card.id &&
      operationRecordState(
        candidate.desc,
        options.operationId,
        postcondition,
      ) !== 'absent',
  );
  if (conflictingCard) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        conflictingCardId: conflictingCard.id,
        action: 'reconcile',
      },
    };
  }
  const state = operationRecordState(
    card.desc,
    options.operationId,
    postcondition,
  );
  if (state !== 'absent') {
    try {
      const workUnit = normalizeRemoteCard(card);
      if (
        state === 'match' &&
        card.idList === config.listIds.in_design &&
        workUnit.metadata.status === 'in_design'
      ) {
        return {
          outcome: 'recovered',
          operationId: options.operationId,
          workUnit,
        };
      }
    } catch {
      /* return recovery below */
    }
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        action: 'reconcile',
      },
    };
  }
  if (card.idList !== config.listIds.inbox)
    throw new WorkCliError(
      'DESIGN_START_REQUIRES_INBOX',
      'Design start requires an Inbox card.',
    );
  const now = options.now ?? new Date().toISOString();
  assertCurrentVersion(options.ifVersion, card.dateLastActivity);
  const marker = operationRecord(options.operationId, postcondition);
  const document: WorkUnitDocument = {
    ...template,
    metadata: {
      ...template.metadata,
      id: `WU-${card.idShort}`,
      trello_card_id: card.id,
      title: card.name,
      status: 'in_design',
      created_at: card.dateLastActivity,
      updated_at: now,
    },
    sections: {
      ...template.sections,
      Context: `${template.sections.Context}\n\n${marker}`,
    },
  };
  const desc = renderWorkUnit(document);
  if (options.dryRun)
    return {
      outcome: 'planned',
      operationId: options.operationId,
      proposed: { cardId: card.id, idList: config.listIds.in_design, desc },
    };
  try {
    await client.updateCard(card.id, {
      desc,
      idList: config.listIds.in_design,
    });
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    )
      return {
        outcome: 'ambiguous',
        recovery: {
          operationId: options.operationId,
          cardId: card.id,
          action: 'reconcile',
        },
      };
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
        action: 'reconcile',
      },
    };
  }
  if (
    readBack.id !== card.id ||
    readBack.idList !== config.listIds.in_design ||
    readBack.desc !== desc
  )
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        action: 'reconcile',
      },
    };
  return {
    outcome: 'verified',
    operationId: options.operationId,
    workUnit: normalizeRemoteCard(readBack),
  };
}
