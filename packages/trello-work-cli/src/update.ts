import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import {
  normalizeRemoteCard,
  resolveCard,
  type NormalizedWorkUnit,
} from './read-commands';
import type { TrelloCard } from './trello-types';
import { assertCurrentVersion } from './version';
import {
  operationRecord,
  operationRecordState,
  validateOperationId,
} from './mutation';
import {
  applyMetadataMergePatch,
  parseWorkUnit,
  renderWorkUnit,
  REQUIRED_SECTIONS,
  type WorkUnitDocument,
} from './work-unit';

export interface UpdateClient {
  getCard(reference: string): Promise<TrelloCard>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  updateCard(
    cardId: string,
    input: { name?: string; desc?: string; idList?: string },
  ): Promise<TrelloCard>;
}

export type UpdateOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
  now?: string;
};

const SYSTEM_FIELDS = [
  'id',
  'trello_card_id',
  'status',
  'created_at',
  'updated_at',
] as const;
const ALL_SECTIONS = [...REQUIRED_SECTIONS, 'Open Questions'];

function validateOptions(options: UpdateOptions): void {
  validateOperationId(options.operationId);
}

function withMutationIdentity(
  document: WorkUnitDocument,
  operationId: string,
  now: string,
  postcondition: unknown,
): WorkUnitDocument {
  const marker = operationRecord(operationId, postcondition);
  const context = document.sections.Context.includes(marker)
    ? document.sections.Context
    : `${document.sections.Context}\n\n${marker}`;
  return {
    ...document,
    metadata: { ...document.metadata, updated_at: now },
    sections: { ...document.sections, Context: context },
  };
}

async function mutateDescription(
  reference: string,
  proposed: WorkUnitDocument,
  config: WorkConfig,
  client: UpdateClient,
  options: UpdateOptions,
  operation: string,
  capturedCard?: TrelloCard,
): Promise<Record<string, unknown>> {
  validateOptions(options);
  const card = capturedCard ?? (await resolveCard(reference, config, client));
  const current = normalizeRemoteCard(card);
  const now = options.now ?? new Date().toISOString();
  const sections = Object.fromEntries(
    Object.entries(proposed.sections).map(([key, value]) => [
      key,
      value.replace(/\n*<!-- work-operation: [^>]+ -->/g, ''),
    ]),
  );
  const requestedMetadata = Object.fromEntries(
    Object.entries(proposed.metadata).filter(([key]) => key !== 'updated_at'),
  );
  const postcondition = {
    operation,
    metadata: requestedMetadata,
    sections,
  };
  const operationState = operationRecordState(
    card.desc,
    options.operationId,
    postcondition,
  );
  if (operationState !== 'absent') {
    const currentMetadata = Object.fromEntries(
      Object.entries(current.metadata).filter(([key]) => key !== 'updated_at'),
    );
    const currentSections = Object.fromEntries(
      Object.entries(current.sections).map(([key, value]) => [
        key,
        value.replace(/\n*<!-- work-operation: [^>]+ -->/g, ''),
      ]),
    );
    const exact =
      operationState === 'match' &&
      card.name === proposed.metadata.title &&
      JSON.stringify(currentMetadata) === JSON.stringify(requestedMetadata) &&
      JSON.stringify(currentSections) === JSON.stringify(sections);
    return exact
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          workUnit: current,
        }
      : {
          outcome: 'partial',
          recovery: {
            operationId: options.operationId,
            cardId: card.id,
            action: 'reconcile',
            reason:
              operationState === 'match'
                ? 'current Work Unit drifted from the recorded postcondition'
                : 'operation ID conflicts with a different requested postcondition',
          },
        };
  }
  assertCurrentVersion(options.ifVersion, current.version);
  const finalDocument = withMutationIdentity(
    proposed,
    options.operationId,
    now,
    postcondition,
  );
  const description = renderWorkUnit(finalDocument);
  parseWorkUnit(description);
  if (options.dryRun) {
    return {
      outcome: 'planned',
      operation,
      operationId: options.operationId,
      currentVersion: current.version,
      proposed: finalDocument,
    };
  }
  try {
    await client.updateCard(card.id, {
      name: finalDocument.metadata.title,
      desc: description,
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
          cardId: card.id,
          action: 'reconcile',
        },
      };
    }
    throw error;
  }
  let readBack: TrelloCard;
  try {
    readBack = await client.getCard(card.id);
  } catch (error) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        action: 'reconcile',
        reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
  if (
    readBack.desc !== description ||
    readBack.name !== finalDocument.metadata.title
  ) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        expectedVersion: current.version,
        actualVersion: readBack.dateLastActivity,
        action: 'reconcile',
      },
    };
  }
  const workUnit: NormalizedWorkUnit = normalizeRemoteCard(readBack);
  return { outcome: 'verified', operationId: options.operationId, workUnit };
}

export async function metadataUpdate(
  reference: string,
  patch: unknown,
  config: WorkConfig,
  client: UpdateClient,
  options: UpdateOptions,
): Promise<Record<string, unknown>> {
  validateOptions(options);
  const card = await resolveCard(reference, config, client);
  const current = normalizeRemoteCard(card);
  const metadata = applyMetadataMergePatch(current.metadata, patch);
  const proposed: WorkUnitDocument = {
    metadata,
    sections: current.sections,
  };
  const result = await mutateDescription(
    card.id,
    proposed,
    config,
    client,
    options,
    'metadata update',
    card,
  );
  return result;
}

export async function descriptionReplace(
  reference: string,
  source: string,
  config: WorkConfig,
  client: UpdateClient,
  options: UpdateOptions,
): Promise<Record<string, unknown>> {
  const replacement = parseWorkUnit(source);
  const card = await resolveCard(reference, config, client);
  const current = normalizeRemoteCard(card);
  for (const field of SYSTEM_FIELDS) {
    if (replacement.metadata[field] !== current.metadata[field]) {
      throw new WorkCliError(
        'SYSTEM_FIELD_CHANGE_FORBIDDEN',
        `Description replacement cannot change system-managed field ${field}.`,
      );
    }
  }
  return mutateDescription(
    card.id,
    replacement,
    config,
    client,
    options,
    'description replace',
    card,
  );
}

export async function descriptionPatch(
  reference: string,
  section: string,
  content: string,
  config: WorkConfig,
  client: UpdateClient,
  options: UpdateOptions,
): Promise<Record<string, unknown>> {
  if (!ALL_SECTIONS.includes(section as (typeof ALL_SECTIONS)[number])) {
    throw new WorkCliError(
      'INVALID_SECTION',
      `Unknown Work Unit section: ${section}.`,
    );
  }
  if (!content.trim() || /^#{1,6}\s/m.test(content)) {
    throw new WorkCliError(
      'INVALID_SECTION_CONTENT',
      'Section content must be non-empty and cannot contain Markdown headings.',
    );
  }
  const card = await resolveCard(reference, config, client);
  const current = normalizeRemoteCard(card);
  const proposed: WorkUnitDocument = {
    metadata: current.metadata,
    sections: { ...current.sections, [section]: content.trim() },
  };
  return mutateDescription(
    card.id,
    proposed,
    config,
    client,
    options,
    'description patch',
    card,
  );
}
