import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mutationCliResult } from './cli';
import { WorkCliError } from './errors';

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
        reject(new Error('work exited without an exit code.'));
        return;
      }
      resolvePromise({ exitCode, stderr, stdout });
    });
  });
}

describe('work process command contract', () => {
  it('lists every approved V1 command family in short help', async () => {
    const result = await runCli(['--help']);

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    for (const syntax of [
      'work get <reference>',
      'work list',
      'work create',
      'work metadata update',
      'work description replace',
      'work description patch',
      'work transition',
      'work reconcile',
      'work validate',
      'work checklist list',
      'work checklist create',
      'work checklist update',
      'work checklist item set',
      'work doctor',
      'work docs',
    ]) {
      expect(result.stdout).toContain(syntax);
    }
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

  it('plans create dry-run without credentials, configuration, or Trello access', async () => {
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

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'planned',
      operationId: 'cli-create-1',
      missingConfiguration: ['TRELLO_BOARD_ID', 'TRELLO_LIST_INBOX_ID'],
    });
  });

  it('reports doctor and remote credential failures as stable JSON without network access', async () => {
    const diagnostics = await runCli(['doctor', '--output', 'json']);
    expect(diagnostics).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(diagnostics.stdout)).toMatchObject({
      credentials: { available: false },
      authentication: { reachable: false },
    });

    const remote = await runCli([
      'get',
      '0123456789abcdef01234567',
      '--output',
      'json',
    ]);
    expect(remote).toMatchObject({ exitCode: 3, stdout: '' });
    expect(JSON.parse(remote.stderr)).toMatchObject({
      error: { code: 'TRELLO_CREDENTIALS_MISSING' },
    });
  });
});

describe('mutation family CLI outcomes', () => {
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
