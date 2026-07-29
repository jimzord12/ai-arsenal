import { redactSecrets } from './config';
import { WorkCliError } from './errors';
import type {
  TransportRequest,
  TransportResponse,
  TrelloAttachment,
  TrelloBoard,
  TrelloCard,
  TrelloChecklist,
  TrelloChecklistItem,
  TrelloList,
  TrelloListAction,
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
      return {
        status: response.status,
        body:
          request.responseType === 'binary'
            ? new Uint8Array(await response.arrayBuffer())
            : await response.text(),
      };
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
  if (typeof list.pos !== 'number' || !Number.isFinite(list.pos)) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello list response is missing pos.',
    );
  }
  return {
    id: requireString(list, 'id', 'list response'),
    idBoard: requireString(list, 'idBoard', 'list response'),
    name: requireString(list, 'name', 'list response'),
    pos: list.pos,
    closed: list.closed,
  };
}

function normalizeBoard(value: unknown): TrelloBoard {
  const board = requireObject(value, 'board response');
  return {
    id: requireString(board, 'id', 'board response'),
    name: requireString(board, 'name', 'board response'),
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

function requireSafeAttachmentUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello attachment response has an invalid URL.',
    );
  }
  const credentialParameters = new Set([
    'key',
    'token',
    'api_key',
    'api_token',
    'oauth_token',
    'oauth_consumer_key',
  ]);
  if (
    url.username ||
    url.password ||
    [...url.searchParams.keys()].some((key) =>
      credentialParameters.has(key.toLowerCase()),
    )
  ) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello attachment response contains a credential-bearing URL.',
    );
  }
  return value;
}

function normalizeAttachment(value: unknown): TrelloAttachment {
  const attachment = requireObject(value, 'attachment response');
  if (
    typeof attachment.bytes !== 'number' ||
    !Number.isFinite(attachment.bytes) ||
    attachment.bytes < 0
  ) {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello attachment response is missing bytes.',
    );
  }
  if (typeof attachment.isUpload !== 'boolean') {
    throw new WorkCliError(
      'TRELLO_RESPONSE_INVALID',
      'Trello attachment response is missing isUpload.',
    );
  }
  return {
    id: requireString(attachment, 'id', 'attachment response'),
    name: requireString(attachment, 'name', 'attachment response'),
    url: requireSafeAttachmentUrl(
      requireString(attachment, 'url', 'attachment response'),
    ),
    mimeType: requireString(attachment, 'mimeType', 'attachment response'),
    bytes: attachment.bytes,
    date: requireString(attachment, 'date', 'attachment response'),
    isUpload: attachment.isUpload,
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
    if (typeof response.body !== 'string') {
      throw new WorkCliError(
        'TRELLO_RESPONSE_INVALID',
        'Trello returned binary data for a JSON request.',
      );
    }
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
      normalizeBoard,
    );
  }

  listMemberBoards(): Promise<TrelloBoard[]> {
    return this.request(
      'GET',
      '/members/me/boards',
      { fields: 'id,name', filter: 'all' },
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid board collection.',
          );
        }
        return value.map(normalizeBoard);
      },
    );
  }

  listBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.request(
      'GET',
      `/boards/${encodeURIComponent(boardId)}/lists`,
      { fields: 'id,idBoard,name,pos,closed', filter: 'all' },
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

  getList(listId: string): Promise<TrelloList> {
    return this.request(
      'GET',
      `/lists/${encodeURIComponent(listId)}`,
      { fields: 'id,idBoard,name,pos,closed' },
      normalizeList,
    );
  }

  createList(input: {
    idBoard: string;
    name: string;
    pos?: string | number;
  }): Promise<TrelloList> {
    return this.request('POST', '/lists', input, normalizeList);
  }

  updateList(
    listId: string,
    input: { name?: string; pos?: string | number; closed?: boolean },
  ): Promise<TrelloList> {
    return this.request(
      'PUT',
      `/lists/${encodeURIComponent(listId)}`,
      input,
      normalizeList,
    );
  }

  async listBoardListActions(boardId: string): Promise<TrelloListAction[]> {
    const actions: TrelloListAction[] = [];
    let before: string | undefined;
    for (;;) {
      const page = await this.request(
        'GET',
        `/boards/${encodeURIComponent(boardId)}/actions`,
        { filter: 'createList,updateList', limit: 1000, before },
        (value) => {
          if (!Array.isArray(value)) {
            throw new WorkCliError(
              'TRELLO_RESPONSE_INVALID',
              'Trello returned an invalid list action collection.',
            );
          }
          const items = value.map((entry) => {
            const action = requireObject(entry, 'list action');
            const data = requireObject(action.data, 'list action data');
            const list = requireObject(data.list, 'list action list');
            const old =
              typeof data.old === 'object' &&
              data.old !== null &&
              !Array.isArray(data.old)
                ? (data.old as Record<string, unknown>)
                : {};
            const names = [list.name, old.name].filter(
              (name): name is string => typeof name === 'string',
            );
            return {
              actionId: typeof action.id === 'string' ? action.id : null,
              value: {
                listId: requireString(list, 'id', 'list action'),
                names: [...new Set(names)],
              },
            };
          });
          return {
            values: items.map((item) => item.value),
            cursor: items.at(-1)?.actionId ?? null,
          };
        },
      );
      actions.push(...page.values);
      if (page.values.length < 1000) return actions;
      if (!page.cursor) {
        throw new WorkCliError(
          'TRELLO_RESPONSE_INVALID',
          'Trello list action pagination is missing an action cursor.',
        );
      }
      before = page.cursor;
    }
  }

  listListCards(listId: string): Promise<Array<Pick<TrelloCard, 'id'>>> {
    return this.request(
      'GET',
      `/lists/${encodeURIComponent(listId)}/cards`,
      { fields: 'id', filter: 'all' },
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid list card collection.',
          );
        }
        return value.map((entry) => {
          const card = requireObject(entry, 'list card');
          return { id: requireString(card, 'id', 'list card') };
        });
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

  listCardAttachments(cardId: string): Promise<TrelloAttachment[]> {
    return this.request(
      'GET',
      `/cards/${encodeURIComponent(cardId)}/attachments`,
      { fields: 'id,name,url,mimeType,bytes,date,isUpload' },
      (value) => {
        if (!Array.isArray(value)) {
          throw new WorkCliError(
            'TRELLO_RESPONSE_INVALID',
            'Trello returned an invalid attachment collection.',
          );
        }
        return value.map(normalizeAttachment);
      },
    );
  }

  async downloadAttachment(url: string): Promise<Uint8Array> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new WorkCliError(
        'ATTACHMENT_URL_UNSAFE',
        'The uploaded attachment URL is invalid.',
      );
    }
    if (
      parsed.protocol !== 'https:' ||
      (parsed.hostname !== 'trello.com' &&
        !parsed.hostname.endsWith('.trello.com')) ||
      parsed.username ||
      parsed.password
    ) {
      throw new WorkCliError(
        'ATTACHMENT_URL_UNSAFE',
        'The uploaded attachment URL is not an approved Trello HTTPS URL.',
      );
    }
    let response: TransportResponse;
    try {
      response = await this.transport.request({
        method: 'GET',
        url,
        headers: {
          authorization: `OAuth oauth_consumer_key="${this.apiKey}", oauth_token="${this.apiToken}"`,
        },
        responseType: 'binary',
      });
    } catch (error) {
      const message = redactSecrets(
        error instanceof Error ? error.message : String(error),
        [this.apiKey, this.apiToken],
      );
      throw new WorkCliError(
        'TRELLO_NETWORK_ERROR',
        `Trello attachment download failed: ${message}`,
        { cause: error },
      );
    }
    if (response.status < 200 || response.status >= 300) {
      throw new WorkCliError(
        'TRELLO_API_ERROR',
        `Trello attachment download failed with HTTP ${response.status}.`,
        { exitCode: response.status === 401 ? 3 : 1 },
      );
    }
    if (!(response.body instanceof Uint8Array)) {
      throw new WorkCliError(
        'TRELLO_RESPONSE_INVALID',
        'Trello attachment download returned non-binary data.',
      );
    }
    return response.body;
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

  createChecklistItem(
    checklistId: string,
    name: string,
  ): Promise<TrelloChecklistItem> {
    return this.request(
      'POST',
      `/checklists/${encodeURIComponent(checklistId)}/checkItems`,
      { name, checked: false },
      normalizeChecklistItem,
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
