import { WorkCliError } from './errors';
import { TrelloClient } from './trello-client';
import type {
  TransportRequest,
  TransportResponse,
  TrelloTransport,
} from './trello-types';

class FakeTransport implements TrelloTransport {
  readonly requests: TransportRequest[] = [];
  readonly outcomes: Array<TransportResponse | Error>;

  constructor(...outcomes: Array<TransportResponse | Error>) {
    this.outcomes = outcomes;
  }

  async request(request: TransportRequest): Promise<TransportResponse> {
    this.requests.push(request);
    const outcome = this.outcomes.shift();
    if (!outcome) throw new Error('Fake transport has no queued outcome.');
    if (outcome instanceof Error) throw outcome;
    return outcome;
  }
}

function json(body: unknown, status = 200): TransportResponse {
  return { status, body: JSON.stringify(body) };
}

const card = {
  id: '0123456789abcdef01234567',
  idShort: 42,
  name: 'Outcome',
  desc: '# Work Unit',
  idList: 'list-1',
  dateLastActivity: '2026-07-26T12:00:00.000Z',
  shortUrl: 'https://trello.com/c/AbCd1234/outcome',
};

function client(transport: TrelloTransport): TrelloClient {
  return new TrelloClient({
    apiKey: 'api-key-value',
    apiToken: 'api-token-value',
    apiSecret: 'must-not-send',
    transport,
  });
}

describe('Trello REST API v1 client', () => {
  it('constructs an authenticated card read and normalizes its response', async () => {
    const transport = new FakeTransport(json(card));
    const result = await client(transport).getCard(card.id);

    expect(result).toEqual(card);
    expect(transport.requests).toHaveLength(1);
    const request = transport.requests[0];
    expect(request.method).toBe('GET');
    const url = new URL(request.url);
    expect(url.origin + url.pathname).toBe(
      `https://api.trello.com/1/cards/${card.id}`,
    );
    expect(url.searchParams.get('key')).toBe('api-key-value');
    expect(url.searchParams.get('token')).toBe('api-token-value');
    expect(request.url).not.toContain('must-not-send');
    expect(url.searchParams.get('fields')).toContain('idShort');
  });

  it('lists complete attachment metadata in Trello order and rejects malformed entries', async () => {
    const attachments = [
      {
        id: 'attachment-1',
        name: 'evidence.bin',
        url: 'https://trello.com/1/cards/card/attachments/attachment-1/download/evidence.bin',
        mimeType: 'application/octet-stream',
        bytes: 4,
        date: '2026-07-29T10:00:00.000Z',
        isUpload: true,
      },
      {
        id: 'attachment-2',
        name: 'reference',
        url: 'https://example.com/reference',
        mimeType: '',
        bytes: 0,
        date: '2026-07-29T10:01:00.000Z',
        isUpload: false,
      },
    ];
    const transport = new FakeTransport(
      json(attachments),
      json([{ ...attachments[0], bytes: '4' }]),
    );
    const api = client(transport);

    await expect(api.listCardAttachments(card.id)).resolves.toEqual(
      attachments,
    );
    expect(new URL(transport.requests[0].url).pathname).toBe(
      `/1/cards/${card.id}/attachments`,
    );
    await expect(api.listCardAttachments(card.id)).rejects.toMatchObject({
      code: 'TRELLO_RESPONSE_INVALID',
    });
  });

  it('downloads attachment bytes with OAuth header authentication and no credential URL', async () => {
    const bytes = Uint8Array.from([0, 255, 13, 10, 128]);
    const transport = new FakeTransport({ status: 200, body: bytes });
    const downloadUrl =
      'https://trello.com/1/cards/card/attachments/attachment/download/evidence.bin';

    await expect(
      client(transport).downloadAttachment(downloadUrl),
    ).resolves.toEqual(bytes);
    expect(transport.requests).toEqual([
      {
        method: 'GET',
        url: downloadUrl,
        headers: {
          authorization:
            'OAuth oauth_consumer_key="api-key-value", oauth_token="api-token-value"',
        },
        responseType: 'binary',
      },
    ]);
    expect(transport.requests[0].url).not.toContain('api-key-value');
    expect(transport.requests[0].url).not.toContain('api-token-value');
    expect(transport.requests[0].url).not.toContain('must-not-send');
  });

  it('rejects non-Trello download URLs before sending an OAuth header', async () => {
    const transport = new FakeTransport();

    await expect(
      client(transport).downloadAttachment('https://example.com/file.bin'),
    ).rejects.toMatchObject({ code: 'ATTACHMENT_URL_UNSAFE' });
    expect(transport.requests).toHaveLength(0);
  });

  it('rejects credential-bearing attachment metadata URLs', async () => {
    const transport = new FakeTransport(
      json([
        {
          id: 'attachment-1',
          name: 'evidence.bin',
          url: 'https://trello.com/file?token=api-token-value',
          mimeType: 'application/octet-stream',
          bytes: 4,
          date: '2026-07-29T10:00:00.000Z',
          isUpload: true,
        },
      ]),
    );

    await expect(
      client(transport).listCardAttachments(card.id),
    ).rejects.toMatchObject({ code: 'TRELLO_RESPONSE_INVALID' });
  });

  it('supports board discovery, board/list reads, and authentication reads', async () => {
    const transport = new FakeTransport(
      json({ id: 'me', username: 'jim' }),
      json([{ id: 'board-1', name: 'Work' }]),
      json({ id: 'board-1', name: 'Work' }),
      json([
        {
          id: 'list-1',
          idBoard: 'board-1',
          name: 'Inbox',
          pos: 1024,
          closed: false,
        },
      ]),
      json([card]),
    );
    const api = client(transport);

    await expect(api.getMemberMe()).resolves.toEqual({
      id: 'me',
      username: 'jim',
    });
    await expect(api.listMemberBoards()).resolves.toEqual([
      { id: 'board-1', name: 'Work' },
    ]);
    await expect(api.getBoard('board-1')).resolves.toEqual({
      id: 'board-1',
      name: 'Work',
    });
    await expect(api.listBoardLists('board-1')).resolves.toHaveLength(1);
    await expect(api.listBoardCards('board-1')).resolves.toEqual([card]);
    expect(
      transport.requests.map((request) => new URL(request.url).pathname),
    ).toEqual([
      '/1/members/me',
      '/1/members/me/boards',
      '/1/boards/board-1',
      '/1/boards/board-1/lists',
      '/1/boards/board-1/cards',
    ]);
  });

  it('constructs list create, read, update, action, and occupancy requests', async () => {
    const list = {
      id: 'list-1',
      idBoard: 'board-1',
      name: 'Disposable',
      pos: 1024,
      closed: false,
    };
    const transport = new FakeTransport(
      json(list),
      json(list),
      json({ ...list, name: 'Renamed', pos: 2048 }),
      json([
        {
          data: {
            list: { id: 'list-1', name: 'Renamed' },
            old: { name: 'Disposable' },
          },
        },
      ]),
      json([{ id: card.id }]),
    );
    const api = client(transport);

    await api.createList({
      idBoard: 'board-1',
      name: 'Disposable',
      pos: 'bottom',
    });
    await api.getList('list-1');
    await api.updateList('list-1', { name: 'Renamed', pos: 2048 });
    await expect(api.listBoardListActions('board-1')).resolves.toEqual([
      { listId: 'list-1', names: ['Renamed', 'Disposable'] },
    ]);
    await expect(api.listListCards('list-1')).resolves.toEqual([
      { id: card.id },
    ]);

    expect(
      transport.requests.map((request) => [
        request.method,
        new URL(request.url).pathname,
      ]),
    ).toEqual([
      ['POST', '/1/lists'],
      ['GET', '/1/lists/list-1'],
      ['PUT', '/1/lists/list-1'],
      ['GET', '/1/boards/board-1/actions'],
      ['GET', '/1/lists/list-1/cards'],
    ]);
  });

  it('performs the minimum card create/update operations', async () => {
    const transport = new FakeTransport(
      json(card),
      json({ ...card, idList: 'list-2' }),
    );
    const api = client(transport);

    await api.createCard({
      idList: 'list-1',
      name: 'Outcome',
      desc: '# Work Unit',
    });
    await api.updateCard(card.id, { idList: 'list-2', desc: '# Updated' });

    expect(transport.requests).toHaveLength(2);
    const create = new URL(transport.requests[0].url);
    expect(transport.requests[0].method).toBe('POST');
    expect(create.pathname).toBe('/1/cards');
    expect(create.searchParams.get('idList')).toBeNull();
    expect(create.searchParams.get('desc')).toBeNull();
    expect(transport.requests[0].headers).toEqual({
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    });
    expect(new URLSearchParams(transport.requests[0].body)).toEqual(
      new URLSearchParams({
        idList: 'list-1',
        name: 'Outcome',
        desc: '# Work Unit',
      }),
    );
    const update = new URL(transport.requests[1].url);
    expect(transport.requests[1].method).toBe('PUT');
    expect(update.pathname).toBe(`/1/cards/${card.id}`);
    expect(update.searchParams.get('idList')).toBeNull();
    expect(new URLSearchParams(transport.requests[1].body).get('idList')).toBe(
      'list-2',
    );
  });

  it('keeps a long Work Unit description out of the mutation URL', async () => {
    const transport = new FakeTransport(json(card));
    const desc = `# Work Unit\n\n${'long description '.repeat(2000)}`;
    await client(transport).createCard({
      idList: 'list-1',
      name: 'Long',
      desc,
    });
    const request = transport.requests[0];
    expect(request.url.length).toBeLessThan(200);
    expect(request.url).not.toContain('description');
    expect(new URLSearchParams(request.body).get('desc')).toBe(desc);
  });

  it('addresses checklists and checklist items by stable IDs', async () => {
    const checklist = {
      id: 'check-1',
      idCard: card.id,
      name: 'Verification',
      checkItems: [{ id: 'item-1', name: 'Tests', state: 'incomplete' }],
    };
    const transport = new FakeTransport(
      json([checklist]),
      json(checklist),
      json(checklist.checkItems[0]),
      json({ ...checklist, name: 'Done' }),
      json({ ...checklist.checkItems[0], state: 'complete' }),
    );
    const api = client(transport);

    await api.listChecklists(card.id);
    await api.createChecklist(card.id, 'Verification');
    await api.createChecklistItem('check-1', 'Tests');
    await api.updateChecklist('check-1', 'Done');
    await api.setChecklistItemState(card.id, 'item-1', true);

    expect(
      transport.requests.map((request) => new URL(request.url).pathname),
    ).toEqual([
      `/1/cards/${card.id}/checklists`,
      '/1/checklists',
      '/1/checklists/check-1/checkItems',
      '/1/checklists/check-1',
      `/1/cards/${card.id}/checkItem/item-1`,
    ]);
    expect(new URLSearchParams(transport.requests[4].body).get('state')).toBe(
      'complete',
    );
  });

  it('maps API and ambiguous network failures without leaking credentials or retrying writes', async () => {
    const apiFailure = new FakeTransport(
      json({ message: 'token api-token-value rejected' }, 401),
    );
    await expect(client(apiFailure).getCard(card.id)).rejects.toMatchObject({
      code: 'TRELLO_API_ERROR',
    });
    await client(apiFailure)
      .getCard(card.id)
      .catch((error: unknown) => {
        expect((error as Error).message).not.toContain('api-token-value');
      });

    const ambiguous = new FakeTransport(
      new Error('network timeout api-token-value'),
    );
    await expect(
      client(ambiguous).createCard({
        idList: 'list-1',
        name: 'Outcome',
        desc: '# Work Unit',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<WorkCliError>>({
        code: 'TRELLO_MUTATION_AMBIGUOUS',
      }),
    );
    expect(ambiguous.requests).toHaveLength(1);
  });
});
