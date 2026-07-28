import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadWorkConfig,
  missingMutationConfiguration,
  redactSecrets,
} from './config';

describe('Work CLI configuration', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'work-config-'));
  });

  afterEach(async () => {
    await rm(directory, { force: true, recursive: true });
  });

  it('loads an explicit Hermes env file while process environment wins', async () => {
    const envPath = join(directory, '.env');
    await writeFile(
      envPath,
      [
        'TRELLO_API_KEY=file-key',
        'TRELLO_API_TOKEN=file-token',
        'TRELLO_BOARD_ID=must-not-select-a-board',
        'TRELLO_LIST_INBOX_ID=inbox-from-file',
      ].join('\n'),
      'utf8',
    );

    const config = await loadWorkConfig({
      env: { TRELLO_API_KEY: 'process-key' },
      hermesEnvPath: envPath,
    });

    expect(config.credentials).toEqual({
      apiKey: 'process-key',
      apiToken: 'file-token',
    });
    expect(config.boardId).toBeNull();
    expect(config.listIds.inbox).toBe('inbox-from-file');
    expect(config.loadedHermesEnv).toBe(true);
  });

  it('does not assume or read an env file unless its path is explicitly provided', async () => {
    await writeFile(
      join(directory, '.env'),
      'TRELLO_API_KEY=must-not-load\nTRELLO_API_TOKEN=must-not-load\n',
      'utf8',
    );

    const config = await loadWorkConfig({ env: {}, cwd: directory });

    expect(config.credentials).toEqual({ apiKey: null, apiToken: null });
    expect(config.loadedHermesEnv).toBe(false);
  });

  it('never uses ambient board selection and reports the runtime board as unresolved', async () => {
    const config = await loadWorkConfig({
      env: {
        TRELLO_API_KEY: 'key',
        TRELLO_API_TOKEN: 'token',
        TRELLO_BOARD_ID: 'must-not-select-a-board',
      },
    });
    expect(config.boardId).toBeNull();
    expect(missingMutationConfiguration(config, ['inbox'])).toEqual([
      'TRELLO_BOARD_ID',
      'TRELLO_LIST_INBOX_ID',
    ]);
  });

  it('uses the canonical workflow defaults while independently honoring list overrides', async () => {
    const config = await loadWorkConfig({
      env: { TRELLO_LIST_REVIEW_ID: 'review-override' },
    });
    expect(config.listIds).toEqual({ review: 'review-override' });
    expect(config.listNames).toEqual({
      inbox: 'Inbox',
      ready: 'Ready',
      in_progress: 'In Progress',
      review: 'Review',
      blocked: 'Blocked',
      done: 'Done',
    });
    expect(config.transitionGraph).toEqual({
      inbox: ['ready'],
      ready: ['in_progress'],
      in_progress: ['review', 'blocked'],
      review: ['done', 'in_progress'],
      blocked: ['ready', 'in_progress'],
      done: [],
    });
    expect(config.reconcileSource).toBe('description');
  });

  it.each([
    ['unknown key', { inbox: ['ready'], archived: [] }],
    ['missing key', { inbox: ['ready'] }],
    ['non-array targets', { inbox: 'ready' }],
    ['unknown target', { inbox: ['archived'] }],
    ['duplicate target', { inbox: ['ready', 'ready'] }],
  ])(
    'rejects an invalid transition graph with a stable configuration error: %s',
    async (_name, graph) => {
      await expect(
        loadWorkConfig({
          env: { TRELLO_TRANSITIONS_JSON: JSON.stringify(graph) },
        }),
      ).rejects.toThrow(/^TRELLO_TRANSITIONS_JSON_INVALID:/);
    },
  );

  it('accepts a complete transition graph with exact known statuses', async () => {
    const graph = {
      inbox: ['ready'],
      ready: ['in_progress'],
      in_progress: ['review'],
      review: ['done'],
      blocked: ['ready'],
      done: [],
    };
    await expect(
      loadWorkConfig({
        env: { TRELLO_TRANSITIONS_JSON: JSON.stringify(graph) },
      }),
    ).resolves.toMatchObject({ transitionGraph: graph });
  });

  it('redacts credential values and credential-bearing query parameters', () => {
    const output = redactSecrets(
      'request failed key=key-value&token=token-value TRELLO_API_SECRET=secret-value',
      ['key-value', 'token-value', 'secret-value'],
    );
    expect(output).not.toMatch(/key-value|token-value|secret-value/);
    expect(output).toContain('[REDACTED]');
  });
});
