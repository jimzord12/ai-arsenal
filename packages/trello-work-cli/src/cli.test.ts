import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { mutationCliResult, runWorkCli } from './cli';
import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { parseWorkUnit, renderWorkUnit } from './work-unit';

type ProcessResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

const packageRoot = resolve(__dirname, '..');
const binPath = join(packageRoot, 'src', 'bin.ts');
const bunCommand = process.platform === 'win32' ? 'bun.exe' : 'bun';

function runCli(args: string[]): Promise<ProcessResult> {
  return new Promise((resolvePromise, reject) => {
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key.startsWith('TRELLO_')) delete env[key];
    }
    const child = spawn(bunCommand, [binPath, ...args], {
      cwd: packageRoot,
      env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (exitCode) => {
      if (exitCode === null) {
        reject(new Error('jz-trello-flow exited without an exit code.'));
        return;
      }
      resolvePromise({ exitCode, stderr, stdout });
    });
  });
}

describe('jz-trello-flow process command contract', () => {
  it('packs only the jz-trello-flow executable', () => {
    const packDirectory = mkdtempSync(join(tmpdir(), 'trello-flow-pack-'));
    try {
      if (process.platform === 'win32') {
        execFileSync(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/s', '/c', `pnpm pack --pack-destination ${packDirectory}`],
          { cwd: packageRoot, stdio: 'pipe' },
        );
      } else {
        execFileSync('pnpm', ['pack', '--pack-destination', packDirectory], {
          cwd: packageRoot,
          stdio: 'pipe',
        });
      }
      const tarball = join(
        packDirectory,
        readdirSync(packDirectory).find((name) => name.endsWith('.tgz'))!,
      );
      const archive = gunzipSync(readFileSync(tarball));
      let packedManifest: { bin: Record<string, string> } | undefined;
      const packedPaths: string[] = [];
      for (let offset = 0; offset + 512 <= archive.length;) {
        const header = archive.subarray(offset, offset + 512);
        const name = header
          .subarray(0, 100)
          .toString('utf8')
          .replace(/\0.*$/, '');
        const sizeText = header
          .subarray(124, 136)
          .toString('ascii')
          .replace(/\0.*$/, '')
          .trim();
        const size = Number.parseInt(sizeText || '0', 8);
        offset += 512;
        if (name) packedPaths.push(name);
        if (name === 'package/package.json') {
          packedManifest = JSON.parse(
            archive.subarray(offset, offset + size).toString('utf8'),
          ) as { bin: Record<string, string> };
        }
        offset += Math.ceil(size / 512) * 512;
      }

      expect(packedManifest?.bin).toEqual({
        'jz-trello-flow': 'src/bin.ts',
      });
      expect(packedManifest?.bin).not.toHaveProperty('work');
      expect(packedPaths).toContain('package/src/attachments.ts');
      expect(packedPaths).not.toContain('package/src/attachments.test.ts');
    } finally {
      rmSync(packDirectory, { recursive: true, force: true });
    }
  });

  it('lists every approved V1 command family in short help', async () => {
    const result = await runCli(['--help']);

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    for (const syntax of [
      'jz-trello-flow get <reference>',
      'jz-trello-flow list',
      'jz-trello-flow inbox list',
      'jz-trello-flow draft create',
      'jz-trello-flow design start',
      'jz-trello-flow create',
      'jz-trello-flow metadata update',
      'jz-trello-flow description replace',
      'jz-trello-flow description patch',
      'jz-trello-flow transition',
      'jz-trello-flow reconcile',
      'jz-trello-flow validate',
      'jz-trello-flow checklist list',
      'jz-trello-flow checklist create',
      'jz-trello-flow checklist update',
      'jz-trello-flow checklist item set',
      'jz-trello-flow doctor',
      'jz-trello-flow docs',
      'jz-trello-flow boards list',
      'jz-trello-flow workflow init',
      'jz-trello-flow lists list',
      'jz-trello-flow lists create',
      'jz-trello-flow lists update',
      'jz-trello-flow lists close',
    ]) {
      expect(result.stdout).toContain(syntax);
    }
  });

  it('requires an explicit board selector for every board-dependent command', async () => {
    const config: WorkConfig = {
      credentials: { apiKey: 'key', apiToken: 'token' },
      boardId: null,
      listIds: {},
      listNames: {
        inbox: 'Inbox',
        in_design: 'In Design',
        ready: 'Ready',
        in_progress: 'In Progress',
        review: 'Review',
        blocked: 'Blocked',
        done: 'Done',
      },
      transitionGraph: {
        inbox: ['in_design'],
        in_design: ['ready'],
        ready: ['in_progress'],
        in_progress: ['review', 'blocked'],
        review: ['done', 'in_progress'],
        blocked: ['ready', 'in_progress'],
        done: [],
      },
      reconcileSource: 'description',
      loadedHermesEnv: false,
      hermesEnvPath: null,
    };
    const result = await runWorkCli(['get', 'WU-1', '--output', 'json'], {
      config,
      client: {} as never,
    });
    expect(result).toMatchObject({ exitCode: 2, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'USAGE_ERROR', message: '--board is required.' },
    });
  });

  it('routes board listing and exact board selection without persisted state', async () => {
    const config: WorkConfig = {
      credentials: { apiKey: 'key', apiToken: 'token' },
      boardId: null,
      listIds: {},
      listNames: {
        inbox: 'Inbox',
        in_design: 'In Design',
        ready: 'Ready',
        in_progress: 'In Progress',
        review: 'Review',
        blocked: 'Blocked',
        done: 'Done',
      },
      transitionGraph: {
        inbox: ['in_design'],
        in_design: ['ready'],
        ready: ['in_progress'],
        in_progress: ['review', 'blocked'],
        review: ['done', 'in_progress'],
        blocked: ['ready', 'in_progress'],
        done: [],
      },
      reconcileSource: 'description',
      loadedHermesEnv: false,
      hermesEnvPath: null,
    };
    const client = {
      async listMemberBoards() {
        return [{ id: '111111111111111111111111', name: 'Testing' }];
      },
      async getBoard(id: string) {
        return { id, name: 'Testing' };
      },
      async listBoardLists() {
        return [];
      },
    };
    await expect(
      runWorkCli(['boards', 'list', '--output', 'json'], {
        config,
        client: client as never,
      }),
    ).resolves.toMatchObject({ exitCode: 0, stderr: '' });
    await expect(
      runWorkCli(['lists', 'list', '--board', 'Testing', '--output', 'json'], {
        config,
        client: client as never,
      }),
    ).resolves.toMatchObject({ exitCode: 0, stderr: '' });
    expect(config.boardId).toBeNull();
  });

  it('validates a local fixture as JSON without credentials or diagnostics', async () => {
    const fixture = join(packageRoot, 'test', 'fixtures', 'valid-draft.md');
    const result = await runCli([
      'validate',
      '--file',
      fixture,
      '--output',
      'json',
    ]);

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: true,
      kind: 'draft',
    });
  });

  it('accepts documented local-validation option order', async () => {
    const fixture = join(packageRoot, 'test', 'fixtures', 'valid-draft.md');
    const result = await runCli([
      'validate',
      '--output',
      'json',
      '--file',
      fixture,
    ]);
    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({ valid: true });
  });

  it('reports invalid local files as INVALID_WORK_UNIT on stderr only', async () => {
    const fixture = join(packageRoot, 'test', 'fixtures', 'invalid-draft.md');
    const result = await runCli([
      'validate',
      '--file',
      fixture,
      '--output',
      'json',
    ]);
    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'INVALID_WORK_UNIT' },
    });
  });

  it.each([
    [
      'validate',
      '--file',
      'test/fixtures/valid-draft.md',
      '--bogus',
      '--output',
      'json',
    ],
    [
      'validate',
      '--file',
      'test/fixtures/valid-draft.md',
      'extra',
      '--output',
      'json',
    ],
    [
      'create',
      '--file',
      'test/fixtures/valid-draft.md',
      '--dry-run',
      '--dry-run',
      '--output',
      'json',
    ],
    ['doctor', '--output', 'json', '--output', 'json'],
    ['docs', '--list', '--list', '--output', 'json'],
    ['get', 'WU-1', 'extra', '--output', 'json'],
    ['metadata', 'remove', 'WU-1', '--output', 'json'],
    ['description', 'remove', 'WU-1', '--output', 'json'],
    ['checklist', 'remove', 'WU-1', '--output', 'json'],
    ['create', '--file', 'a', '--stdin', '--dry-run', '--output', 'json'],
  ])('rejects unconsumed or duplicate arguments: %p', async (...args) => {
    const result = await runCli(args);
    expect(result).toMatchObject({ exitCode: 2, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'USAGE_ERROR' },
    });
  });

  it('writes stable JSON usage errors only to stderr', async () => {
    const result = await runCli(['unknown', '--output', 'json']);

    expect(result).toMatchObject({ exitCode: 2, stdout: '' });
    expect(JSON.parse(result.stderr)).toEqual({
      error: {
        code: 'USAGE_ERROR',
        message: 'Unknown command: unknown.',
      },
    });
  });

  it('fails create dry-run closed before credentials or Trello access without --board', async () => {
    const fixture = join(packageRoot, 'test', 'fixtures', 'valid-draft.md');
    const result = await runCli([
      'create',
      '--file',
      fixture,
      '--dry-run',
      '--operation-id',
      'cli-create-1',
      '--output',
      'json',
    ]);

    expect(result).toMatchObject({ exitCode: 2, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'USAGE_ERROR', message: '--board is required.' },
    });
  });

  it('reports doctor and remote credential failures as stable JSON without network access', async () => {
    const diagnostics = await runCli([
      'doctor',
      '--board',
      'Testing',
      '--output',
      'json',
    ]);
    expect(diagnostics).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(diagnostics.stdout)).toMatchObject({
      credentials: { available: false },
      authentication: { reachable: false },
    });

    const remote = await runCli([
      'get',
      '0123456789abcdef01234567',
      '--board',
      '111111111111111111111111',
      '--output',
      'json',
    ]);
    expect(remote).toMatchObject({ exitCode: 3, stdout: '' });
    expect(JSON.parse(remote.stderr)).toMatchObject({
      error: { code: 'TRELLO_CREDENTIALS_MISSING' },
    });
  });

  it('routes inbox list through runWorkCli', async () => {
    const { config, client } = routingFixture();
    const result = await runWorkCli(
      ['inbox', 'list', '--board', 'Testing', '--output', 'json'],
      { config, client: client as never },
    );
    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      items: [{ kind: 'ordinary', id: '0123456789abcdef01234567' }],
    });
  });

  it('routes get attachment downloads and rejects the option on unrelated commands', async () => {
    const root = mkdtempSync(join(tmpdir(), 'trello-cli-attachments-'));
    const fixture = routingFixture();
    const parsed = parseWorkUnit(fixture.draft);
    fixture.card.desc = renderWorkUnit({
      ...parsed,
      metadata: {
        ...parsed.metadata,
        id: 'WU-42',
        trello_card_id: fixture.card.id,
        created_at: '2026-07-29T10:00:00.000Z',
        updated_at: '2026-07-29T10:00:00.000Z',
      },
    });
    Object.assign(fixture.client, {
      listCardAttachments: jest.fn(async () => [
        {
          id: 'attachment-1',
          name: 'evidence.bin',
          url: 'https://trello.com/1/cards/card/attachments/attachment-1/download/evidence.bin',
          mimeType: 'application/octet-stream',
          bytes: 3,
          date: '2026-07-29T10:01:00.000Z',
          isUpload: true,
        },
      ]),
      downloadAttachment: jest.fn(async () => Uint8Array.from([0, 255, 1])),
    });
    try {
      const result = await runWorkCli(
        [
          'get',
          'WU-42',
          '--attachments-dir',
          root,
          '--board',
          'Testing',
          '--output',
          'json',
        ],
        { config: fixture.config, client: fixture.client as never },
      );

      expect(result).toMatchObject({ exitCode: 0, stderr: '' });
      expect(JSON.parse(result.stdout)).toMatchObject({
        attachmentCount: 1,
        attachments: [
          {
            id: 'attachment-1',
            downloaded: true,
            downloadedPath: join(root, 'evidence.bin'),
          },
        ],
      });
      expect(readFileSync(join(root, 'evidence.bin'))).toEqual(
        Buffer.from([0, 255, 1]),
      );

      const rejected = await runWorkCli([
        'list',
        '--attachments-dir',
        root,
        '--output',
        'json',
      ]);
      expect(rejected).toMatchObject({ exitCode: 2, stdout: '' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('renders attachment count and one complete metadata line per attachment in text output', async () => {
    const fixture = routingFixture();
    const parsed = parseWorkUnit(fixture.draft);
    fixture.card.desc = renderWorkUnit({
      ...parsed,
      metadata: {
        ...parsed.metadata,
        id: 'WU-42',
        trello_card_id: fixture.card.id,
        created_at: '2026-07-29T10:00:00.000Z',
        updated_at: '2026-07-29T10:00:00.000Z',
      },
    });
    Object.assign(fixture.client, {
      listCardAttachments: jest.fn(async () => [
        {
          id: 'attachment-1',
          name: 'evidence\nline.bin',
          url: 'https://example.com/reference',
          mimeType: 'application/octet-stream',
          bytes: 3,
          date: '2026-07-29T10:01:00.000Z',
          isUpload: false,
        },
      ]),
      downloadAttachment: jest.fn(),
    });

    const result = await runWorkCli(
      ['get', 'WU-42', '--board', 'Testing', '--output', 'text'],
      { config: fixture.config, client: fixture.client as never },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('Attachments: 1\n');
    const metadataLines = result.stdout
      .split('\n')
      .filter((line) => line.startsWith('Attachment: '));
    expect(metadataLines).toHaveLength(1);
    expect(JSON.parse(metadataLines[0].slice('Attachment: '.length))).toEqual({
      id: 'attachment-1',
      name: 'evidence\nline.bin',
      url: 'https://example.com/reference',
      mimeType: 'application/octet-stream',
      bytes: 3,
      date: '2026-07-29T10:01:00.000Z',
      isUpload: false,
      urlType: 'external',
      downloaded: false,
      downloadedPath: null,
    });
  });

  it('returns truthful JSON recovery when an attachment download partially fails', async () => {
    const root = mkdtempSync(join(tmpdir(), 'trello-cli-attachments-'));
    const fixture = routingFixture();
    const parsed = parseWorkUnit(fixture.draft);
    fixture.card.desc = renderWorkUnit({
      ...parsed,
      metadata: {
        ...parsed.metadata,
        id: 'WU-42',
        trello_card_id: fixture.card.id,
        created_at: '2026-07-29T10:00:00.000Z',
        updated_at: '2026-07-29T10:00:00.000Z',
      },
    });
    const attachments = ['first.bin', 'second.bin'].map((name, index) => ({
      id: `attachment-${index + 1}`,
      name,
      url: `https://trello.com/1/cards/card/attachments/attachment-${index + 1}/download/${name}`,
      mimeType: 'application/octet-stream',
      bytes: 1,
      date: `2026-07-29T10:0${index}:00.000Z`,
      isUpload: true,
    }));
    Object.assign(fixture.client, {
      listCardAttachments: jest.fn(async () => attachments),
      downloadAttachment: jest
        .fn<Promise<Uint8Array>, [string]>()
        .mockResolvedValueOnce(Uint8Array.from([1]))
        .mockRejectedValueOnce(new Error('download failed token')),
    });
    try {
      const result = await runWorkCli(
        [
          'get',
          'WU-42',
          '--attachments-dir',
          root,
          '--board',
          'Testing',
          '--output',
          'json',
        ],
        { config: fixture.config, client: fixture.client as never },
      );

      expect(result).toMatchObject({ exitCode: 1, stdout: '' });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error: {
          code: 'ATTACHMENT_DOWNLOAD_PARTIAL',
          recovery: {
            failedAttachment: { id: 'attachment-2', name: 'second.bin' },
            completedPaths: [join(root, 'first.bin')],
            downloadedCount: 1,
            uploadedCount: 2,
          },
        },
      });
      expect(readFileSync(join(root, 'first.bin'))).toEqual(Buffer.from([1]));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([['draft', 'create'], ['create']])(
    'routes %p dry-run from injected file input',
    async (...command) => {
      const { config, client, draft } = routingFixture();
      const result = await runWorkCli(
        [
          ...command,
          '--file',
          'draft.md',
          '--dry-run',
          '--operation-id',
          'routing-draft-1',
          '--board',
          'Testing',
          '--output',
          'json',
        ],
        { config, client: client as never, readFile: async () => draft },
      );
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ outcome: 'planned' });
      expect(result.stderr).toBe(
        command[0] === 'create'
          ? 'DEPRECATED: jz-trello-flow create; use jz-trello-flow draft create.\n'
          : '',
      );
    },
  );

  it('routes design start with injected file input and preserves JSON separation', async () => {
    const { config, client, draft } = routingFixture();
    const result = await runWorkCli(
      [
        'design',
        'start',
        '0123456789abcdef01234567',
        '--file',
        'partial.md',
        '--dry-run',
        '--operation-id',
        'routing-design-1',
        '--board',
        'Testing',
        '--output',
        'json',
      ],
      { config, client: client as never, readFile: async () => draft },
    );
    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'planned',
      proposed: { cardId: '0123456789abcdef01234567' },
    });
  });

  it.each([
    ['draft', 'create', '--board', 'Testing'],
    ['draft', 'create', '--file', 'a', '--stdin', '--board', 'Testing'],
    ['design', 'start', 'card', '--stdin', '--board', 'Testing'],
    ['inbox', 'list', '--file', 'a', '--board', 'Testing'],
    ['design', 'start', '--file', 'a', '--board', 'Testing'],
  ])(
    'rejects new-command parser errors before routing: %p',
    async (...args) => {
      const result = await runWorkCli([...args, '--output', 'json']);
      expect(result).toMatchObject({ exitCode: 2, stdout: '' });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error: { code: 'USAGE_ERROR' },
      });
    },
  );
});

function routingFixture() {
  const config: WorkConfig = {
    credentials: { apiKey: 'key', apiToken: 'token' },
    boardId: null,
    listIds: {
      inbox: 'list-inbox',
      in_design: 'list-design',
      ready: 'list-ready',
      in_progress: 'list-progress',
      review: 'list-review',
      blocked: 'list-blocked',
      done: 'list-done',
    },
    listNames: {
      inbox: 'Inbox',
      in_design: 'In Design',
      ready: 'Ready',
      in_progress: 'In Progress',
      review: 'Review',
      blocked: 'Blocked',
      done: 'Done',
    },
    transitionGraph: {
      inbox: ['in_design'],
      in_design: ['ready'],
      ready: ['in_progress'],
      in_progress: ['review', 'blocked'],
      review: ['done', 'in_progress'],
      blocked: ['ready', 'in_progress'],
      done: [],
    },
    reconcileSource: 'description',
    loadedHermesEnv: false,
    hermesEnvPath: null,
  };
  const card = {
    id: '0123456789abcdef01234567',
    idShort: 42,
    name: 'Ordinary intake',
    desc: 'Plain intake notes.',
    idList: 'list-inbox',
    dateLastActivity: '2026-07-28T12:00:00.000Z',
    shortUrl: 'https://trello.com/c/test/card',
  };
  const lists = Object.entries(config.listIds).map(([status, id]) => ({
    id: id as string,
    idBoard: 'board-id',
    name: config.listNames[status as keyof typeof config.listNames],
    pos: 1,
    closed: false,
  }));
  const client = {
    getBoard: async () => ({ id: 'board-id', name: 'Testing' }),
    listMemberBoards: async () => [{ id: 'board-id', name: 'Testing' }],
    listBoardLists: async () => lists,
    listBoardCards: async () => [card],
    getCard: async () => card,
  };
  const draft = readFileSync(
    join(packageRoot, 'test', 'fixtures', 'valid-draft.md'),
    'utf8',
  );
  return { config, client, draft, card };
}

describe('list filters', () => {
  it('routes member and owner as distinct conjunctive filters', async () => {
    const fixture = routingFixture();
    const draft = parseWorkUnit(fixture.draft);
    const card = {
      ...fixture.card,
      desc: renderWorkUnit({
        ...draft,
        metadata: {
          ...draft.metadata,
          id: 'WU-42',
          trello_card_id: fixture.card.id,
          owner: 'codex:worker-1',
          created_at: '2026-07-28T12:00:00.000Z',
          updated_at: '2026-07-28T12:00:00.000Z',
        },
      }),
      members: [
        { id: 'member-1', username: 'dev-one', fullName: 'Developer One' },
      ],
    };
    const ordinary = {
      ...fixture.card,
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      idShort: 43,
      name: 'Ordinary assigned card',
      desc: 'Plain Trello intake.',
      members: [
        { id: 'member-1', username: 'dev-one', fullName: 'Developer One' },
      ],
    };
    const client = {
      ...fixture.client,
      listBoardCards: async () => [ordinary, card],
    };

    const memberResult = await runWorkCli(
      ['list', '--board', 'Testing', '--member', 'DEV-ONE', '--output', 'json'],
      { config: fixture.config, client: client as never },
    );

    expect(memberResult).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(memberResult.stdout)).toMatchObject({
      filters: { member: 'DEV-ONE' },
      items: [
        { id: ordinary.id, kind: 'ordinary' },
        {
          id: card.id,
          kind: 'work-unit',
          workUnit: { metadata: { owner: 'codex:worker-1' } },
        },
      ],
    });

    const result = await runWorkCli(
      [
        'list',
        '--board',
        'Testing',
        '--member',
        'DEV-ONE',
        '--owner',
        'codex:worker-1',
        '--output',
        'json',
      ],
      { config: fixture.config, client: client as never },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      filters: { member: 'DEV-ONE', owner: 'codex:worker-1' },
      items: [
        {
          id: card.id,
          kind: 'work-unit',
          members: [{ id: 'member-1' }],
          workUnit: { metadata: { owner: 'codex:worker-1' } },
        },
      ],
    });
  });
});

describe('mutation family CLI outcomes', () => {
  it.each(['json', 'text'] as const)(
    'reports transition dry-run through the executable in %s mode',
    async (output) => {
      const fixture = routingFixture();
      const draft = parseWorkUnit(fixture.draft);
      const sections = { ...draft.sections };
      delete sections['Open Questions'];
      const canonicalCard = {
        ...fixture.card,
        desc: renderWorkUnit({
          metadata: {
            ...draft.metadata,
            id: 'WU-42',
            trello_card_id: fixture.card.id,
            created_at: '2026-07-28T12:00:00.000Z',
            updated_at: '2026-07-28T12:00:00.000Z',
          },
          sections,
        }),
      };
      const updateCard = jest.fn();
      const result = await runWorkCli(
        [
          'transition',
          'WU-42',
          'in_design',
          '--dry-run',
          '--operation-id',
          `cli-transition-${output}`,
          '--board',
          'Testing',
          '--output',
          output,
        ],
        {
          config: fixture.config,
          client: {
            ...fixture.client,
            listBoardCards: async () => [canonicalCard],
            getCard: async () => canonicalCard,
            updateCard,
          } as never,
        },
      );

      expect(result).toMatchObject({ exitCode: 0, stderr: '' });
      expect(result.stdout).toContain('planned');
      expect(result.stdout).toContain('proposedDescription');
      expect(updateCard).not.toHaveBeenCalled();
    },
  );

  it('rejects an archived transition target before card access or mutation', async () => {
    const { config, client } = routingFixture();
    const lists = await client.listBoardLists();
    const archived = lists.map((list) =>
      list.id === config.listIds.done ? { ...list, closed: true } : list,
    );
    const guardedClient = {
      ...client,
      listBoardLists: async () => archived,
      getCard: jest.fn(),
      updateCard: jest.fn(),
    };

    const result = await runWorkCli(
      [
        'transition',
        'WU-42',
        'done',
        '--board',
        'Testing',
        '--operation-id',
        'archived-transition-target',
        '--output',
        'json',
      ],
      { config, client: guardedClient as never },
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: 'WORKFLOW_LIST_CLOSED' },
    });
    expect(guardedClient.getCard).not.toHaveBeenCalled();
    expect(guardedClient.updateCard).not.toHaveBeenCalled();
  });

  it.each([
    'create',
    'metadata-update',
    'description-replace',
    'description-patch',
    'transition',
    'reconcile',
    'checklist-create',
    'checklist-update',
    'checklist-item-set',
  ])('fails closed for %s partial and ambiguous outcomes', (family) => {
    for (const outcome of ['partial', 'ambiguous'] as const) {
      expect(() =>
        mutationCliResult(
          {
            outcome,
            recovery: { family, operationId: `${family}-1` },
          },
          true,
        ),
      ).toThrow(
        expect.objectContaining({
          code:
            outcome === 'partial' ? 'MUTATION_PARTIAL' : 'MUTATION_AMBIGUOUS',
          exitCode: 1,
        }) as WorkCliError,
      );
    }
  });

  it.each([
    ['planned', { plan: {} }],
    ['planned', { proposed: {} }],
    ['verified', { value: {} }],
    ['recovered', { value: {} }],
  ] as const)('permits the valid %s outcome', (outcome, payload) => {
    expect(mutationCliResult({ outcome, ...payload }, true)).toMatchObject({
      exitCode: 0,
      stderr: '',
    });
  });

  it.each([
    null,
    {},
    { outcome: 'recovered' },
    { outcome: 'verified' },
    { outcome: 'invented' },
  ])('rejects an invalid successful mutation result: %p', (result) => {
    expect(() => mutationCliResult(result, true)).toThrow(
      expect.objectContaining({
        code: 'MUTATION_INVALID_OUTCOME',
      }) as WorkCliError,
    );
  });

  it.each([
    { outcome: 'partial' },
    { outcome: 'ambiguous', recovery: null },
    { outcome: 'partial', recovery: [] },
    { outcome: 'ambiguous', recovery: {} },
    { outcome: 'partial', recovery: 'reconcile' },
  ])('rejects a malformed failure mutation result: %p', (result) => {
    expect(() => mutationCliResult(result, true)).toThrow(
      expect.objectContaining({
        code: 'MUTATION_INVALID_OUTCOME',
      }) as WorkCliError,
    );
  });
});

describe('skills install CLI route', () => {
  it('routes the offline dry run without loading Trello configuration', async () => {
    const installed = {
      dryRun: true,
      repositoryRoot: 'C:\\repo',
      skills: [
        {
          action: 'installed' as const,
          name: 'trello-work-orchestrator' as const,
          target: 'C:\\repo\\.agents\\skills\\trello-work-orchestrator',
        },
      ],
    };
    const install = jest.fn(async () => installed);

    const result = await runWorkCli(
      ['skills', 'install', '--dry-run', '--output', 'json'],
      { installSkills: install } as never,
    );

    expect(result).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: `${JSON.stringify(installed)}\n`,
    });
    expect(install).toHaveBeenCalledWith({
      cwd: process.cwd(),
      dryRun: true,
    });
  });
});
