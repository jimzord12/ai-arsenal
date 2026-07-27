import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { normalizeRemoteCard, type NormalizedWorkUnit } from './read-commands';
import type { TrelloCard } from './trello-types';
import { operationRecord, validateOperationId } from './mutation';
import {
  parseWorkUnit,
  renderWorkUnit,
  type WorkUnitDocument,
} from './work-unit';

export interface CreateClient {
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  createCard(input: {
    idList: string;
    name: string;
    desc: string;
  }): Promise<TrelloCard>;
  updateCard(
    cardId: string,
    input: { name?: string; desc?: string; idList?: string },
  ): Promise<TrelloCard>;
  getCard(cardId: string): Promise<TrelloCard>;
}

export type CreateOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
};

function createRequest(
  draft: WorkUnitDocument,
  inboxId: string | null,
): Record<string, unknown> {
  return {
    operation: 'create',
    title: draft.metadata.title,
    body: renderWorkUnit(draft),
    listId: inboxId,
    metadata: draft.metadata,
  };
}

function operationMarker(
  operationId: string,
  request: Record<string, unknown>,
): string {
  return operationRecord(operationId, request);
}

function withOperationMarker(
  document: WorkUnitDocument,
  operationId: string,
  request: Record<string, unknown>,
): WorkUnitDocument {
  const marker = operationMarker(operationId, request);
  const context = document.sections.Context.includes(marker)
    ? document.sections.Context
    : `${document.sections.Context}\n\n${marker}`;
  return { ...document, sections: { ...document.sections, Context: context } };
}

function missingConfiguration(config: WorkConfig): string[] {
  const missing: string[] = [];
  if (!config.boardId) missing.push('TRELLO_BOARD_ID');
  if (!config.listIds.inbox) missing.push('TRELLO_LIST_INBOX_ID');
  return missing;
}

function persistedDocument(
  draft: WorkUnitDocument,
  card: TrelloCard,
): WorkUnitDocument {
  return {
    ...draft,
    metadata: {
      ...draft.metadata,
      id: `WU-${card.idShort}`,
      trello_card_id: card.id,
      created_at: card.dateLastActivity,
      updated_at: card.dateLastActivity,
    },
  };
}

async function finalizeAndVerify(
  draft: WorkUnitDocument,
  card: TrelloCard,
  client: CreateClient,
  operationId: string,
  request: Record<string, unknown>,
): Promise<NormalizedWorkUnit> {
  let expectedDocument = persistedDocument(draft, card);
  let description = renderWorkUnit(expectedDocument);
  let finalCard = card;
  if (
    card.desc !== description ||
    card.name !== expectedDocument.metadata.title
  ) {
    try {
      const updated = await client.updateCard(card.id, {
        name: expectedDocument.metadata.title,
        desc: description,
        idList: request.listId as string,
      });
      finalCard = updated;
      expectedDocument = {
        ...expectedDocument,
        metadata: {
          ...expectedDocument.metadata,
          updated_at: updated.dateLastActivity,
        },
      };
      description = renderWorkUnit(expectedDocument);
      if (updated.desc !== description) {
        finalCard = await client.updateCard(card.id, { desc: description });
      }
    } catch (error) {
      if (
        error instanceof WorkCliError &&
        error.code === 'TRELLO_MUTATION_AMBIGUOUS'
      ) {
        throw new WorkCliError(
          'CREATE_PARTIAL',
          'Card exists but final description is ambiguous.',
          {
            recovery: { operationId, cardId: card.id, action: 'reconcile' },
            cause: error,
          },
        );
      }
      throw error;
    }
  }
  const readBack = await client.getCard(card.id);
  const normalized = normalizeRemoteCard(readBack);
  if (
    readBack.name !== expectedDocument.metadata.title ||
    readBack.idList !== request.listId ||
    readBack.desc !== description ||
    readBack.id !== card.id ||
    readBack.idShort !== card.idShort ||
    normalized.metadata.id !== `WU-${card.idShort}` ||
    normalized.metadata.trello_card_id !== card.id ||
    normalized.metadata.created_at !== card.dateLastActivity ||
    normalized.metadata.updated_at !== expectedDocument.metadata.updated_at ||
    readBack.dateLastActivity !== finalCard.dateLastActivity ||
    normalized.metadata.status !== 'inbox' ||
    !readBack.desc.includes(operationMarker(operationId, request))
  ) {
    throw new WorkCliError(
      'CREATE_VERIFICATION_FAILED',
      'Created card failed read-back verification.',
      {
        recovery: { operationId, cardId: card.id, action: 'reconcile' },
      },
    );
  }
  return normalized;
}

function isCompleteCreatePostcondition(
  draft: WorkUnitDocument,
  card: TrelloCard,
  workUnit: NormalizedWorkUnit,
  inboxId: string,
  marker: string,
): boolean {
  const generatedMetadata = new Set([
    'id',
    'trello_card_id',
    'created_at',
    'updated_at',
  ]);
  const callerMetadataMatches = Object.entries(draft.metadata).every(
    ([key, value]) =>
      generatedMetadata.has(key) ||
      JSON.stringify(workUnit.metadata[key as keyof typeof draft.metadata]) ===
        JSON.stringify(value),
  );
  return (
    card.name === draft.metadata.title &&
    card.idList === inboxId &&
    workUnit.metadata.id === `WU-${card.idShort}` &&
    workUnit.metadata.trello_card_id?.toLowerCase() === card.id.toLowerCase() &&
    workUnit.metadata.created_at !== null &&
    workUnit.metadata.updated_at !== null &&
    callerMetadataMatches &&
    card.desc === renderWorkUnit(workUnit) &&
    JSON.stringify(workUnit.sections) === JSON.stringify(draft.sections) &&
    card.desc.includes(marker)
  );
}

export async function createWorkUnit(
  source: string,
  config: WorkConfig,
  client: CreateClient,
  options: CreateOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const parsed = parseWorkUnit(source);
  if (parsed.metadata.id !== null) {
    throw new WorkCliError(
      'CREATE_REQUIRES_DRAFT',
      'Create input must be a draft Work Unit.',
    );
  }
  const missing = missingConfiguration(config);
  const request = createRequest(parsed, config.listIds.inbox ?? null);
  const draft = withOperationMarker(parsed, options.operationId, request);
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operationId: options.operationId,
      idStrategy: 'WU-<Trello idShort>',
      missingConfiguration: missing,
      transaction: [
        'create exactly one Inbox card',
        'derive WU-N',
        'persist',
        'read back',
      ],
      draft,
    };
  }
  if (missing.length > 0) {
    throw new WorkCliError(
      'TRELLO_CONFIGURATION_MISSING',
      `Required Trello configuration is missing: ${missing.join(', ')}.`,
    );
  }
  const boardId = config.boardId as string;
  const inboxId = config.listIds.inbox as string;
  const marker = operationMarker(options.operationId, request);
  const matches = (await client.listBoardCards(boardId)).filter((card) =>
    card.desc.includes(`<!-- work-operation: ${options.operationId} `),
  );
  if (matches.length > 1) {
    throw new WorkCliError(
      'OPERATION_ID_AMBIGUOUS',
      'Operation ID matches multiple cards.',
      {
        recovery: {
          operationId: options.operationId,
          cardIds: matches.map((card) => card.id),
        },
      },
    );
  }
  if (matches[0]) {
    if (!matches[0].desc.includes(marker)) {
      return {
        outcome: 'partial',
        recovery: {
          operationId: options.operationId,
          cardId: matches[0].id,
          reason: 'operation ID conflicts with a different create draft',
        },
      };
    }
    const readBack = await client.getCard(matches[0].id);
    try {
      const workUnit = normalizeRemoteCard(readBack);
      if (
        isCompleteCreatePostcondition(
          draft,
          readBack,
          workUnit,
          inboxId,
          marker,
        )
      ) {
        return {
          outcome: 'recovered',
          operationId: options.operationId,
          workUnit,
        };
      }
    } catch {
      // Report the marked but invalid postcondition below.
    }
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: matches[0].id,
        reason:
          'marked create does not match the complete requested postcondition',
        action: 'reconcile',
      },
    };
  }
  if (options.ifVersion !== undefined) {
    throw new WorkCliError(
      'STALE_VERSION',
      'A create operation has no existing version matching --if-version.',
      {
        exitCode: 4,
        recovery: { expectedVersion: options.ifVersion, currentVersion: null },
      },
    );
  }

  let created: TrelloCard;
  try {
    created = await client.createCard({
      idList: inboxId,
      name: draft.metadata.title,
      desc: renderWorkUnit(draft),
    });
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return {
        outcome: 'ambiguous',
        recovery: {
          operationId: options.operationId,
          action: 'reconcile',
          reason: error.message,
        },
      };
    }
    throw error;
  }
  try {
    const workUnit = await finalizeAndVerify(
      draft,
      created,
      client,
      options.operationId,
      request,
    );
    return { outcome: 'verified', operationId: options.operationId, workUnit };
  } catch {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: created.id,
        cardUrl: created.shortUrl,
        expected: {
          title: draft.metadata.title,
          listId: inboxId,
          id: `WU-${created.idShort}`,
          operationMarker: marker,
        },
        action: 'reconcile',
      },
    };
  }
}
