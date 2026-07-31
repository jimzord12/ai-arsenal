import {
  describeAttachments,
  downloadAttachments,
  type AttachmentResult,
} from './attachments';
import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { parseReference } from './reference';
import type {
  TrelloAttachment,
  TrelloBoard,
  TrelloCard,
  TrelloList,
} from './trello-types';
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
  listCardAttachments(cardId: string): Promise<TrelloAttachment[]>;
  downloadAttachment(url: string): Promise<Uint8Array>;
}

export type NormalizedWorkUnit = WorkUnitDocument & {
  card: Pick<
    TrelloCard,
    'id' | 'idShort' | 'idList' | 'name' | 'shortUrl' | 'members'
  >;
  version: string;
};

export type GetWorkUnitResult = NormalizedWorkUnit & {
  attachmentCount: number;
  attachments: AttachmentResult[];
};

type BasicCard = Pick<
  TrelloCard,
  'id' | 'idShort' | 'idList' | 'name' | 'shortUrl' | 'members'
>;

export type ClassifiedCard =
  | (BasicCard & { kind: 'ordinary' })
  | (BasicCard & { kind: 'work-unit'; workUnit: NormalizedWorkUnit });

export type ListFilters = {
  status?: WorkUnitStatus;
  type?: WorkUnitType;
  priority?: WorkUnitPriority;
  owner?: string | null;
  parent?: string | null;
  label?: string;
  member?: string;
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
        members: card.members,
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

function classifyCard(card: TrelloCard): ClassifiedCard {
  const basic: BasicCard = {
    id: card.id,
    idShort: card.idShort,
    idList: card.idList,
    name: card.name,
    shortUrl: card.shortUrl,
    members: card.members,
  };
  try {
    return {
      ...basic,
      kind: 'work-unit',
      workUnit: normalizeRemoteCard(card),
    };
  } catch (error) {
    const claimsWorkUnit =
      card.desc.trimStart().startsWith('# Work Unit') ||
      card.desc.includes('<!-- work-operation:');
    if (claimsWorkUnit) throw error;
    return { ...basic, kind: 'ordinary' };
  }
}

function matchesMetadataFilters(
  item: NormalizedWorkUnit,
  filters: ListFilters,
): boolean {
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
}

function matchesMember(card: TrelloCard, selector: string): boolean {
  const normalized = selector.toLowerCase();
  return card.members.some(
    (member) =>
      member.id.toLowerCase() === normalized ||
      member.username.toLowerCase() === normalized,
  );
}

export async function resolveCard(
  referenceInput: string,
  config: WorkConfig,
  client: Pick<ReadCommandClient, 'getCard' | 'listBoardCards'>,
): Promise<TrelloCard> {
  const reference = parseReference(referenceInput);
  const boardId = requireBoard(config);
  if (reference.kind === 'cardId' || reference.kind === 'cardUrl') {
    const card = await client.getCard(
      reference.kind === 'cardId' ? reference.value : reference.shortLink,
    );
    const configuredListIds = new Set(Object.values(config.listIds));
    const belongsToBoard =
      configuredListIds.has(card.idList) ||
      (await client.listBoardCards(boardId)).some(
        (candidate) => candidate.id.toLowerCase() === card.id.toLowerCase(),
      );
    if (!belongsToBoard) {
      throw new WorkCliError(
        'CARD_BOARD_MISMATCH',
        `Card ${card.id} does not belong to the resolved board.`,
        { recovery: { boardId, cardId: card.id } },
      );
    }
    return card;
  }

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
  options: { attachmentsDirectory?: string } = {},
): Promise<GetWorkUnitResult> {
  const workUnit = normalizeRemoteCard(
    await resolveCard(reference, config, client),
  );
  const attachments = await client.listCardAttachments(workUnit.card.id);
  return {
    ...workUnit,
    attachmentCount: attachments.length,
    attachments: options.attachmentsDirectory
      ? await downloadAttachments(
          attachments,
          options.attachmentsDirectory,
          (url) => client.downloadAttachment(url),
        )
      : describeAttachments(attachments),
  };
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

export function listWorkUnits(
  filters: ListFilters & { member: string },
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{ filters: ListFilters; items: ClassifiedCard[] }>;
export function listWorkUnits(
  filters: ListFilters & { member?: undefined },
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{ filters: ListFilters; items: NormalizedWorkUnit[] }>;
export function listWorkUnits(
  filters: ListFilters,
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{
  filters: ListFilters;
  items: Array<NormalizedWorkUnit | ClassifiedCard>;
}>;
export async function listWorkUnits(
  filters: ListFilters,
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{
  filters: ListFilters;
  items: Array<NormalizedWorkUnit | ClassifiedCard>;
}> {
  const boardId = requireBoard(config);
  const cards = await client.listBoardCards(boardId);
  if (filters.member !== undefined) {
    const metadataFilterActive = [
      filters.status,
      filters.type,
      filters.priority,
      filters.owner,
      filters.parent,
      filters.label,
    ].some((value) => value !== undefined);
    const items = cards
      .filter((card) => matchesMember(card, filters.member as string))
      .flatMap<ClassifiedCard>((card): ClassifiedCard[] => {
        const classified = classifyCard(card);
        if (classified.kind === 'ordinary') {
          return metadataFilterActive ? [] : [classified];
        }
        return matchesMetadataFilters(classified.workUnit, filters)
          ? [classified]
          : [];
      });
    return { filters, items };
  }
  const items = cards
    .flatMap((card) => {
      try {
        return [normalizeRemoteCard(card)];
      } catch (error) {
        const claimsWorkUnit =
          card.desc.trimStart().startsWith('# Work Unit') ||
          card.desc.includes('<!-- work-operation:');
        if (claimsWorkUnit) throw error;
        return [];
      }
    })
    .filter((item) => matchesMetadataFilters(item, filters));
  return { filters, items };
}

export async function listInboxCards(
  config: WorkConfig,
  client: ReadCommandClient,
): Promise<{
  items: ClassifiedCard[];
}> {
  const boardId = requireBoard(config);
  const inboxId = config.listIds.inbox;
  if (!inboxId) configurationMissing(['TRELLO_LIST_INBOX_ID']);
  const cards = (await client.listBoardCards(boardId)).filter(
    (card) => card.idList === inboxId,
  );
  return {
    items: cards.map(classifyCard),
  };
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
    'in_design',
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
