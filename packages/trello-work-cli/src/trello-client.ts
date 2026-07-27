import { redactSecrets } from './config';
import { WorkCliError } from './errors';
import type {
  TransportRequest,
  TransportResponse,
  TrelloBoard,
  TrelloCard,
  TrelloChecklist,
  TrelloChecklistItem,
  TrelloList,
  TrelloTransport,
} from './trello-types';

const CARD_FIELDS = [
  'id',
  'idShort',
  'name',
  'desc',
  'idList',
  'dateLastActivity',
  'shortUrl',
].join(',');

export class FetchTrelloTransport implements TrelloTransport {
  constructor(private readonly timeoutMs = 15_000) {}

  async request(request: TransportRequest): Promise<TransportResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: controller.signal,
      });
      return { status: response.status, body: await response.text() };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export type TrelloClientOptions = {
  apiKey: string;
  apiToken: string;
  apiSecret?: string;
  transport?: TrelloTransport;
  baseUrl?: string;
};

type CardUpdate = Partial<Pick<TrelloCard, 'name' | 'desc' | 'idList'>>;

function requireObject(
  value: unknown,
  description: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      `Trello returned an invalid ${description}.`,
    );
  }
  return value as Record<string, unknown>;
}

function requireString(
  value: Record<string, unknown>,
  field: string,
  description: string,
): string {
  if (typeof value[field] !== 'string') {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      `Trello ${description} is missing ${field}.`,
    );
  }
  return value[field] as string;
}

function normalizeCard(value: unknown): TrelloCard {
  const card = requireObject(value, 'card response');
  if (!Number.isInteger(card.idShort)) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello card response is missing idShort.',
    );
  }
  return {
    id: requireString(card, 'id', 'card response'),
    idShort: card.idShort as number,
    name: requireString(card, 'name', 'card response'),
    desc: requireString(card, 'desc', 'card response'),
    idList: requireString(card, 'idList', 'card response'),
    dateLastActivity: requireString(card, 'dateLastActivity', 'card response'),
    shortUrl: requireString(card, 'shortUrl', 'card response'),
  };
}

function normalizeList(value: unknown): TrelloList {
  const list = requireObject(value, 'list response');
  if (typeof list.closed !== 'boolean') {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello list response is missing closed.',
    );
  }
  return {
    id: requireString(list, 'id', 'list response'),
    name: requireString(list, 'name', 'list response'),
    closed: list.closed,
  };
}

function normalizeChecklistItem(value: unknown): TrelloChecklistItem {
  const item = requireObject(value, 'checklist item response');
  const state = requireString(item, 'state', 'checklist item response');
  if (state !== 'complete' && state !== 'incomplete') {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello checklist item has an invalid state.',
    );
  }
  return {
    id: requireString(item, 'id', 'checklist item response'),
    name: requireString(item, 'name', 'checklist item response'),
    state,
  };
}

function normalizeChecklist(value: unknown): TrelloChecklist {
  const checklist = requireObject(value, 'checklist response');
  if (!Array.isArray(checklist.checkItems)) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello checklist response is missing checkItems.',
    );
  }
  return {
    id: requireString(checklist, 'id', 'checklist response'),
    idCard: requireString(checklist, 'idCard', 'checklist response'),
    name: requireString(checklist, 'name', 'checklist response'),
    checkItems: checklist.checkItems.map(normalizeChecklistItem),
  };
}

export class TrelloClient {
  private readonly apiKey: string;
  private readonly apiToken: string;
  private readonly transport: TrelloTransport;
  private readonly baseUrl: string;

  constructor(options: TrelloClientOptions) {
    if (!options.apiKey || !options.apiToken) {
      throw new WorkCliError(
        'TRELLO_CREDENTIALS_MISSING',
        'TRELLO_API_KEY and TRELLO_API_TOKEN are required.',
      );
    }
    this.apiKey = options.apiKey;
    this.apiToken = options.apiToken;
    this.transport = options.transport ?? new FetchTrelloTransport();
    this.baseUrl = (options.baseUrl ?? 'https://api.trello.com/1').replace(
      /\/$/,
      '',
    );
  }

  private async request<T>(
    method: TransportRequest['method'],
    path: string,
    parameters: Record<string, string | number | boolean | undefined>,
    normalize: (value: unknown) => T,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries({
      key: this.apiKey,
      token: this.apiToken,
    })) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const mutation = method !== 'GET';
    const encoded = new URLSearchParams();
    for (const [key, value] of Object.entries(parameters)) {
      if (value === undefined) continue;
      if (mutation) encoded.set(key, String(value));
      else url.searchParams.set(key, String(value));
    }
    let response: TransportResponse;
    try {
      response = await this.transport.request({
        method,
        url: url.toString(),
        ...(mutation
          ? {
              headers: {
                'content-type':
                  'application/x-www-form-urlencoded;charset=UTF-8',
              },
              body: encoded.toString(),
            }
          : {}),
      });
    } catch (error) {
      if (error instanceof WorkCliError) throw error;
      const message = redactSecrets(
        error instanceof Error ? error.message : String(error),
        [this.apiKey, this.apiToken],
      );
      throw new WorkCliError(
        mutation ? 'TRELLO_MUTATION_AMBIGUOUS' : 'TRELLO_NETWORK_ERROR',
        mutation
          ? `Trello mutation outcome is ambiguous: ${message}`
          : `Trello request failed: ${message}`,
        mutation
          ? { recovery: { requestPath: path }, cause: error }
          : { cause: error },
      );
    }
    let body: unknown = null;
    if (response.body) {
      try {
        body = JSON.parse(response.body);
      } catch {
        throw new WorkCliError(
          'TRELLO_RESPONSE_INVALID',
          `Trello returned non-JSON data with HTTP ${response.status}.`,
        );
      }
    }
    if (response.status < 200 || response.status >= 300) {
      const object =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : {};
      const detail =
        typeof object.message === 'string'
          ? redactSecrets(object.message, [this.apiKey, this.apiToken])
          : 'request rejected';
      throw new WorkCliError(
        'TRELLO_API_ERROR',
        `Trello API HTTP ${response.status}: ${detail}`,
        { exitCode: response.status === 401 ? 3 : 1 },
      );
    }
    return normalize(body);
  }

  getMemberMe(): Promise<{ id: string; username: string }> {
    return this.request(
      'GET',
      '/members/me',
      { fields: 'id,username' },
      (value) => {
        const member = requireObject(value, 'member response');
        return {
          id: requireString(member, 'id', 'member response'),
          username: requireString(member, 'username', 'member response'),
        };
      },
    );
  }

  getBoard(boardId: string): Promise<TrelloBoard> {
    return this.request(
      'GET',
      `/boards/${encodeURIComponent(boardId)}`,
      { fields: 'id,name' },
      (value) => {
        const board = requireObject(value, 'board response');
        return {
          id: requireString(board, 'id', 'board response'),
          name: requireString(board, 'name', 'board response'),
        };
      },
    );
  }

  listBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.request(
      'GET',
      `/boards/${encodeURIComponent(boardId)}/lists`,
      { fields: 'id,name,closed' },
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid list collection.',
          );
        }
        return value.map(normalizeList);
      },
    );
  }

  listBoardCards(boardId: string): Promise<TrelloCard[]> {
    return this.request(
      'GET',
      `/boards/${encodeURIComponent(boardId)}/cards`,
      { fields: CARD_FIELDS },
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid card collection.',
          );
        }
        return value.map(normalizeCard);
      },
    );
  }

  getCard(reference: string): Promise<TrelloCard> {
    return this.request(
      'GET',
      `/cards/${encodeURIComponent(reference)}`,
      { fields: CARD_FIELDS },
      normalizeCard,
    );
  }

  createCard(input: {
    idList: string;
    name: string;
    desc: string;
  }): Promise<TrelloCard> {
    return this.request(
      'POST',
      '/cards',
      { idList: input.idList, name: input.name, desc: input.desc },
      normalizeCard,
    );
  }

  updateCard(cardId: string, input: CardUpdate): Promise<TrelloCard> {
    return this.request(
      'PUT',
      `/cards/${encodeURIComponent(cardId)}`,
      input,
      normalizeCard,
    );
  }

  listChecklists(cardId: string): Promise<TrelloChecklist[]> {
    return this.request(
      'GET',
      `/cards/${encodeURIComponent(cardId)}/checklists`,
      {},
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid checklist collection.',
          );
        }
        return value.map(normalizeChecklist);
      },
    );
  }

  createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    return this.request(
      'POST',
      '/checklists',
      { idCard: cardId, name },
      normalizeChecklist,
    );
  }

  updateChecklist(checklistId: string, name: string): Promise<TrelloChecklist> {
    return this.request(
      'PUT',
      `/checklists/${encodeURIComponent(checklistId)}`,
      { name },
      normalizeChecklist,
    );
  }

  setChecklistItemState(
    cardId: string,
    itemId: string,
    checked: boolean,
  ): Promise<TrelloChecklistItem> {
    return this.request(
      'PUT',
      `/cards/${encodeURIComponent(cardId)}/checkItem/${encodeURIComponent(itemId)}`,
      { state: checked ? 'complete' : 'incomplete' },
      normalizeChecklistItem,
    );
  }
}
