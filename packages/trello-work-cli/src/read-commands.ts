import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { parseReference } from './reference';
import type { TrelloBoard, TrelloCard, TrelloList } from './trello-types';
import {
  parseWorkUnit,
  type WorkUnitDocument,
  type WorkUnitPriority,
  type WorkUnitStatus,
  type WorkUnitType,
} from './work-unit';

export interface ReadCommandClient {
  getMemberMe(): Promise<{ id: string; username: string }>;
  getBoard(boardId: string): Promise<TrelloBoard>;
  listBoardLists(boardId: string): Promise<TrelloList[]>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  getCard(reference: string): Promise<TrelloCard>;
}

export type NormalizedWorkUnit = WorkUnitDocument & {
  card: Pick<TrelloCard, 'id' | 'idShort' | 'idList' | 'name' | 'shortUrl'>;
  version: string;
};

export type ListFilters = {
  status?: WorkUnitStatus;
  type?: WorkUnitType;
  priority?: WorkUnitPriority;
  owner?: string | null;
  parent?: string | null;
  label?: string;
};

function configurationMissing(names: string[]): never {
  throw new WorkCliError(
    'TRELLO_CONFIGURATION_MISSING',
    `Required Trello configuration is missing: ${names.join(', ')}.`,
  );
}

function requireBoard(config: WorkConfig): string {
  if (!config.boardId) configurationMissing(['TRELLO_BOARD_ID']);
  return config.boardId;
}

export function normalizeRemoteCard(card: TrelloCard): NormalizedWorkUnit {
  try {
    const document = parseWorkUnit(card.desc);
    if (
      document.metadata.id !== `WU-${card.idShort}` ||
      document.metadata.trello_card_id?.toLowerCase() !== card.id.toLowerCase()
    ) {
      throw new Error('description identifiers do not match the Trello card');
    }
    return {
      ...document,
      card: {
        id: card.id,
        idShort: card.idShort,
        idList: card.idList,
        name: card.name,
        shortUrl: card.shortUrl,
      },
      version: card.dateLastActivity,
    };
  } catch (error) {
    throw new WorkCliError(
      'INVALID_REMOTE_WORK_UNIT',
      `Trello card ${card.id} does not contain a valid matching Work Unit.`,
      { cause: error },
    );
  }
}

export async function resolveCard(
  referenceInput: string,
  config: WorkConfig,
  client: Pick<ReadCommandClient, 'getCard' | 'listBoardCards'>,
): Promise<TrelloCard> {
  const reference = parseReference(referenceInput);
  if (reference.kind === 'cardId') return client.getCard(reference.value);
  if (reference.kind === 'cardUrl') return client.getCard(reference.shortLink);

  const boardId = requireBoard(config);
  const idShort = Number(reference.value.slice(3));
  const cards = await client.listBoardCards(boardId);
  const matches = cards.filter((card) => card.idShort === idShort);
  if (matches.length !== 1) {
    throw new WorkCliError(
      matches.length === 0 ? 'WORK_UNIT_NOT_FOUND' : 'REFERENCE_AMBIGUOUS',
      matches.length === 0
        ? `Work Unit ${reference.value} was not found.`
        : `Work Unit ${reference.value} resolved ambiguously.`,
    );
  }
  return matches[0];
}

export function validateLocalWorkUnit(source: string): {
  valid: true;
  kind: 'draft' | 'persisted';
  metadata: WorkUnitDocument['metadata'];
} {
  const document = parseWorkUnit(source);
  return {
    valid: true,
    kind: document.metadata.id === null ? 'draft' : 'persisted',
    metadata: document.metadata,
  };
}

export async function getWorkUnit(
  reference: string,
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<NormalizedWorkUnit> {
  return normalizeRemoteCard(await resolveCard(reference, config, client));
}

export type RemoteValidationFinding = {
  code:
    | 'REMOTE_STRUCTURE_INVALID'
    | 'REMOTE_ID_PAIRING_MISMATCH'
    | 'REMOTE_TITLE_MISMATCH'
    | 'REMOTE_STATUS_LIST_DRIFT';
  message: string;
};

export async function validateRemoteWorkUnit(
  reference: string,
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{
  valid: boolean;
  kind: 'persisted';
  metadata?: WorkUnitDocument['metadata'];
  findings: RemoteValidationFinding[];
}> {
  const card = await resolveCard(reference, config, client);
  let document: WorkUnitDocument;
  try {
    document = parseWorkUnit(card.desc);
  } catch {
    return {
      valid: false,
      kind: 'persisted',
      findings: [
        {
          code: 'REMOTE_STRUCTURE_INVALID',
          message:
            'The card description is not a canonical Work Unit document.',
        },
      ],
    };
  }
  const findings: RemoteValidationFinding[] = [];
  if (
    document.metadata.id !== `WU-${card.idShort}` ||
    document.metadata.trello_card_id?.toLowerCase() !== card.id.toLowerCase()
  ) {
    findings.push({
      code: 'REMOTE_ID_PAIRING_MISMATCH',
      message: 'Description identifiers do not match the Trello card.',
    });
  }
  if (document.metadata.title !== card.name) {
    findings.push({
      code: 'REMOTE_TITLE_MISMATCH',
      message: 'Description title does not match the Trello card title.',
    });
  }
  const configuredList = config.listIds[document.metadata.status];
  if (configuredList !== undefined && configuredList !== card.idList) {
    findings.push({
      code: 'REMOTE_STATUS_LIST_DRIFT',
      message: 'Description status does not match the configured Trello list.',
    });
  }
  return {
    valid: findings.length === 0,
    kind: 'persisted',
    metadata: document.metadata,
    findings,
  };
}

export async function listWorkUnits(
  filters: ListFilters,
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{ filters: ListFilters; items: NormalizedWorkUnit[] }> {
  const boardId = requireBoard(config);
  const items = (await client.listBoardCards(boardId))
    .map(normalizeRemoteCard)
    .filter((item) => {
      const metadata = item.metadata;
      return (
        (filters.status === undefined || metadata.status === filters.status) &&
        (filters.type === undefined || metadata.type === filters.type) &&
        (filters.priority === undefined ||
          metadata.priority === filters.priority) &&
        (filters.owner === undefined || metadata.owner === filters.owner) &&
        (filters.parent === undefined || metadata.parent === filters.parent) &&
        (filters.label === undefined || metadata.labels.includes(filters.label))
      );
    });
  return { filters, items };
}

export type DoctorResult = {
  credentials: { available: boolean };
  authentication: { reachable: boolean; username?: string; error?: string };
  board: {
    configured: boolean;
    reachable: boolean;
    id?: string;
    error?: string;
  };
  mappings: {
    valid: boolean;
    configured: number;
    missing: string[];
    invalid: string[];
  };
};

export async function doctor(
  config: WorkConfig,
  client?: ReadCommandClient,
): Promise<DoctorResult> {
  const credentialsAvailable = Boolean(
    config.credentials.apiKey && config.credentials.apiToken,
  );
  const result: DoctorResult = {
    credentials: { available: credentialsAvailable },
    authentication: { reachable: false },
    board: { configured: Boolean(config.boardId), reachable: false },
    mappings: {
      valid: false,
      configured: Object.keys(config.listIds).length,
      missing: [],
      invalid: [],
    },
  };
  const allStatuses: WorkUnitStatus[] = [
    'inbox',
    'ready',
    'in_progress',
    'review',
    'blocked',
    'done',
  ];
  result.mappings.missing = allStatuses.filter(
    (status) => !config.listIds[status],
  );
  if (!credentialsAvailable || !client) {
    result.authentication.error = 'Trello API credentials are unavailable.';
    return result;
  }
  try {
    const member = await client.getMemberMe();
    result.authentication = { reachable: true, username: member.username };
  } catch (error) {
    result.authentication.error =
      error instanceof Error ? error.message : String(error);
    return result;
  }
  if (!config.boardId) return result;
  try {
    const board = await client.getBoard(config.boardId);
    const lists = await client.listBoardLists(config.boardId);
    result.board = { configured: true, reachable: true, id: board.id };
    const availableIds = new Set(
      lists.filter((list) => !list.closed).map((list) => list.id),
    );
    const configuredIds = Object.values(config.listIds).filter(
      (id): id is string => id !== undefined,
    );
    result.mappings.invalid = configuredIds.filter(
      (id) => !availableIds.has(id),
    );
    if (new Set(configuredIds).size !== configuredIds.length) {
      result.mappings.invalid.push('duplicate-list-id');
    }
    result.mappings.valid =
      result.mappings.missing.length === 0 &&
      result.mappings.invalid.length === 0;
  } catch (error) {
    result.board.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}
