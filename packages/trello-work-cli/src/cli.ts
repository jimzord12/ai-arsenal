import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  listReadableBoards,
  resolveBoardSelector,
  resolveWorkflowListMappings,
  validateBoardListMappings,
} from './board';
import {
  checklistCreate,
  checklistItemSet,
  checklistList,
  checklistUpdate,
} from './checklist';
import {
  credentialSecrets,
  loadWorkConfig,
  redactSecrets,
  type WorkConfig,
} from './config';
import { createWorkUnit } from './create';
import { renderDocs, renderShortHelp } from './docs';
import { asWorkCliError, formatWorkError, WorkCliError } from './errors';
import {
  closeBoardList,
  createBoardList,
  initializeBoardWorkflow,
  listManagedLists,
  updateBoardList,
  type ListPosition,
} from './list-management';
import {
  doctor,
  getWorkUnit,
  listWorkUnits,
  validateLocalWorkUnit,
  validateRemoteWorkUnit,
  type ListFilters,
} from './read-commands';
import { reconcileWorkUnit } from './reconcile';
import { transitionWorkUnit } from './transition';
import { TrelloClient } from './trello-client';
import { descriptionPatch, descriptionReplace, metadataUpdate } from './update';

export type CliResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

export type CliDependencies = {
  config?: WorkConfig;
  client?: TrelloClient;
  readFile?: (path: string) => Promise<string>;
  readStdin?: () => Promise<string>;
};

export const WORK_HELP = renderShortHelp();

const VALUE_OPTIONS = new Set([
  '--output',
  '--hermes-env',
  '--file',
  '--json',
  '--section',
  '--if-version',
  '--operation-id',
  '--status',
  '--type',
  '--priority',
  '--owner',
  '--parent',
  '--label',
  '--name',
  '--board',
  '--position',
  '--topic',
  '--search',
]);

function usage(message: string): never {
  throw new WorkCliError('USAGE_ERROR', message, { exitCode: 2 });
}

function commandOptions(command: string, positionals: string[]): Set<string> {
  const common = ['--output'];
  const configured = ['--board', '--hermes-env', ...common];
  const mutation = [
    '--dry-run',
    '--if-version',
    '--operation-id',
    ...configured,
  ];
  if (command === 'docs')
    return new Set(['--list', '--topic', '--search', ...common]);
  if (command === 'doctor') return new Set(configured);
  if (command === 'boards')
    return new Set(
      positionals[0] === 'list' ? ['--hermes-env', ...common] : common,
    );
  if (command === 'workflow') return new Set(mutation);
  if (command === 'lists') {
    if (positionals[0] === 'list') return new Set(configured);
    if (positionals[0] === 'create' || positionals[0] === 'update') {
      return new Set(['--name', '--position', ...mutation]);
    }
    if (positionals[0] === 'close') return new Set(mutation);
    return new Set(common);
  }
  if (command === 'create') return new Set(['--file', '--stdin', ...mutation]);
  if (command === 'validate') {
    return new Set(
      positionals.length === 0 ? ['--file', ...common] : configured,
    );
  }
  if (command === 'list') {
    return new Set([
      '--status',
      '--type',
      '--priority',
      '--owner',
      '--parent',
      '--label',
      ...configured,
    ]);
  }
  if (command === 'metadata') return new Set(['--json', '--file', ...mutation]);
  if (command === 'description')
    return new Set(['--file', '--section', ...mutation]);
  if (command === 'transition' || command === 'reconcile')
    return new Set(mutation);
  if (command === 'checklist') {
    return new Set([
      '--name',
      '--checked',
      '--unchecked',
      ...(positionals[0] === 'list' ? configured : mutation),
    ]);
  }
  if (command === 'get') return new Set(configured);
  return new Set(common);
}

function expectedPositionals(
  command: string,
  positionals: string[],
): number | undefined {
  if (command === 'docs' || command === 'create' || command === 'list')
    return 0;
  if (command === 'doctor') return 0;
  if (command === 'boards') {
    if (positionals[0] !== 'list') usage('Unknown boards command.');
    return 1;
  }
  if (command === 'workflow') {
    if (positionals[0] !== 'init') usage('Unknown workflow command.');
    return 1;
  }
  if (command === 'lists') {
    if (positionals[0] === 'list' || positionals[0] === 'create') return 1;
    if (positionals[0] === 'update' || positionals[0] === 'close') return 2;
    usage('Unknown lists command.');
  }
  if (command === 'validate') return positionals.length === 0 ? 0 : 1;
  if (command === 'get' || command === 'reconcile') return 1;
  if (command === 'metadata') {
    if (positionals[0] !== 'update') usage('Unknown metadata command.');
    return 2;
  }
  if (command === 'description') {
    if (!['replace', 'patch'].includes(positionals[0] ?? '')) {
      usage('Unknown description command.');
    }
    return 2;
  }
  if (command === 'transition') return 2;
  if (command === 'checklist') {
    if (positionals[0] === 'list' || positionals[0] === 'create') return 2;
    if (positionals[0] === 'update') return 3;
    if (positionals[0] === 'item' && positionals[1] === 'set') return 5;
    usage('Unknown checklist command.');
  }
  return undefined;
}

function validateAndNormalizeArgs(args: string[]): string[] {
  const command = args[0];
  const positionals: string[] = [];
  const optionTokens: string[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    if (seen.has(token)) usage(`${token} may be supplied only once.`);
    seen.add(token);
    optionTokens.push(token);
    if (VALUE_OPTIONS.has(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) usage(`${token} requires a value.`);
      optionTokens.push(value);
      index += 1;
    }
  }
  const allowed = commandOptions(command, positionals);
  for (const option of seen) {
    if (!allowed.has(option))
      usage(`Unknown option for ${command}: ${option}.`);
  }
  const expected = expectedPositionals(command, positionals);
  if (expected !== undefined && positionals.length !== expected) {
    usage(`Invalid positional arguments for ${command}.`);
  }
  return [command, ...positionals, ...optionTokens];
}

function optionIndexes(args: string[], option: string): number[] {
  return args.flatMap((value, index) => (value === option ? [index] : []));
}

function valueAfter(args: string[], option: string): string | undefined {
  const indexes = optionIndexes(args, option);
  if (indexes.length > 1) {
    throw new WorkCliError(
      'USAGE_ERROR',
      `${option} may be supplied only once.`,
      {
        exitCode: 2,
      },
    );
  }
  if (indexes.length === 0) return undefined;
  const value = args[indexes[0] + 1];
  if (!value || value.startsWith('--')) {
    throw new WorkCliError('USAGE_ERROR', `${option} requires a value.`, {
      exitCode: 2,
    });
  }
  return value;
}

function requiredValue(args: string[], option: string): string {
  const value = valueAfter(args, option);
  if (!value) {
    throw new WorkCliError('USAGE_ERROR', `${option} is required.`, {
      exitCode: 2,
    });
  }
  return value;
}

function jsonOutput(args: string[]): boolean {
  const output = valueAfter(args, '--output');
  if (output !== undefined && output !== 'json' && output !== 'text') {
    throw new WorkCliError('USAGE_ERROR', '--output must be text or json.', {
      exitCode: 2,
    });
  }
  return output === 'json';
}

function success(
  value: unknown,
  json: boolean,
  secrets: readonly string[] = [],
): CliResult {
  const rendered =
    typeof value === 'string'
      ? value.endsWith('\n')
        ? value
        : `${value}\n`
      : `${JSON.stringify(value, null, json ? 0 : 2)}\n`;
  return { exitCode: 0, stderr: '', stdout: redactSecrets(rendered, secrets) };
}

export function mutationCliResult(
  value: unknown,
  json: boolean,
  secrets: readonly string[] = [],
): CliResult {
  if (typeof value !== 'object' || value === null || !('outcome' in value)) {
    throw new WorkCliError(
      'MUTATION_INVALID_OUTCOME',
      'Mutation returned an invalid outcome.',
    );
  }
  const result = value as {
    outcome?: unknown;
    recovery?: Record<string, unknown>;
    plan?: unknown;
    draft?: unknown;
    value?: unknown;
    workUnit?: unknown;
  };
  if (result.outcome === 'partial' || result.outcome === 'ambiguous') {
    if (
      typeof result.recovery !== 'object' ||
      result.recovery === null ||
      Array.isArray(result.recovery) ||
      Object.keys(result.recovery).length === 0
    ) {
      throw new WorkCliError(
        'MUTATION_INVALID_OUTCOME',
        'Mutation returned an invalid outcome.',
      );
    }
    throw new WorkCliError(
      result.outcome === 'partial' ? 'MUTATION_PARTIAL' : 'MUTATION_AMBIGUOUS',
      result.outcome === 'partial'
        ? 'Mutation may have partially completed; reconcile before retrying.'
        : 'Mutation outcome is ambiguous; reconcile before retrying.',
      { recovery: result.recovery },
    );
  }
  const validPlanned =
    result.outcome === 'planned' &&
    (result.plan !== undefined || result.draft !== undefined);
  const validCompleted =
    (result.outcome === 'verified' || result.outcome === 'recovered') &&
    (result.value !== undefined || result.workUnit !== undefined);
  if (!validPlanned && !validCompleted) {
    throw new WorkCliError(
      'MUTATION_INVALID_OUTCOME',
      'Mutation returned an invalid outcome.',
    );
  }
  return success(value, json, secrets);
}

function parseJson(source: string, description: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    throw new WorkCliError(
      'INVALID_JSON',
      `${description} must be valid JSON.`,
      {
        exitCode: 2,
      },
    );
  }
}

function mutationOptions(args: string[]): {
  dryRun: boolean;
  ifVersion?: string;
  operationId: string;
} {
  const ifVersion = valueAfter(args, '--if-version');
  return {
    dryRun: args.includes('--dry-run'),
    ...(ifVersion ? { ifVersion } : {}),
    operationId: valueAfter(args, '--operation-id') ?? randomUUID(),
  };
}

function listPosition(args: string[]): ListPosition | undefined {
  const value = valueAfter(args, '--position');
  if (value === undefined || value === 'top' || value === 'bottom')
    return value;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new WorkCliError(
      'USAGE_ERROR',
      '--position must be top, bottom, or a non-negative number.',
      { exitCode: 2 },
    );
  }
  return numeric;
}

async function defaultReadStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let source = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      source += chunk;
    });
    process.stdin.once('end', () => resolve(source));
    process.stdin.once('error', reject);
  });
}

async function configuration(
  args: string[],
  dependencies: CliDependencies,
): Promise<WorkConfig> {
  if (dependencies.config) return dependencies.config;
  return loadWorkConfig({ hermesEnvPath: valueAfter(args, '--hermes-env') });
}

function remoteClient(
  config: WorkConfig,
  dependencies: CliDependencies,
): TrelloClient {
  if (dependencies.client) return dependencies.client;
  const { apiKey, apiToken } = config.credentials;
  if (!apiKey || !apiToken) {
    throw new WorkCliError(
      'TRELLO_CREDENTIALS_MISSING',
      'TRELLO_API_KEY and TRELLO_API_TOKEN are required.',
      { exitCode: 3 },
    );
  }
  return new TrelloClient({ apiKey, apiToken });
}

function referenceAt(args: string[], index: number): string {
  const reference = args[index];
  if (!reference || reference.startsWith('--')) {
    throw new WorkCliError(
      'USAGE_ERROR',
      'A Work Unit reference is required.',
      {
        exitCode: 2,
      },
    );
  }
  return reference;
}

async function sourceFromFileOrStdin(
  args: string[],
  dependencies: CliDependencies,
): Promise<string> {
  const path = valueAfter(args, '--file');
  const stdin = args.includes('--stdin');
  if (Boolean(path) === stdin) {
    throw new WorkCliError(
      'USAGE_ERROR',
      'Supply exactly one of --file <path> or --stdin.',
      { exitCode: 2 },
    );
  }
  if (path)
    return (dependencies.readFile ?? ((value) => readFile(value, 'utf8')))(
      path,
    );
  return (dependencies.readStdin ?? defaultReadStdin)();
}

export async function runWorkCli(
  args: string[],
  dependencies: CliDependencies = {},
): Promise<CliResult> {
  if (args.length === 0 || args[0] === '--help' || args[0] === 'help') {
    return { exitCode: 0, stderr: '', stdout: WORK_HELP };
  }
  let json = false;
  let secrets: string[] = [];
  try {
    const outputIndex = args.indexOf('--output');
    json = outputIndex >= 0 && args[outputIndex + 1] === 'json';
    args = validateAndNormalizeArgs(args);
    json = jsonOutput(args);
    const readText =
      dependencies.readFile ?? ((path: string) => readFile(path, 'utf8'));

    if (args[0] === 'docs') {
      const topic = valueAfter(args, '--topic');
      const search = valueAfter(args, '--search');
      const selectedModes = [
        args.includes('--list'),
        Boolean(topic),
        Boolean(search),
      ].filter(Boolean);
      if (selectedModes.length > 1) {
        throw new WorkCliError(
          'USAGE_ERROR',
          'Use only one of --list, --topic, or --search.',
          { exitCode: 2 },
        );
      }
      const mode = args.includes('--list')
        ? 'list'
        : topic
          ? 'topic'
          : search
            ? 'search'
            : 'default';
      return success(
        renderDocs({
          mode,
          value: topic ?? search,
          output: json ? 'json' : 'text',
        }),
        false,
      );
    }

    if (args[0] === 'validate' && args.includes('--file')) {
      return success(
        validateLocalWorkUnit(await readText(requiredValue(args, '--file'))),
        json,
      );
    }

    if (
      !new Set([
        'boards',
        'workflow',
        'lists',
        'doctor',
        'create',
        'validate',
        'get',
        'list',
        'metadata',
        'description',
        'transition',
        'reconcile',
        'checklist',
      ]).has(args[0])
    ) {
      throw new WorkCliError('USAGE_ERROR', `Unknown command: ${args[0]}.`, {
        exitCode: 2,
      });
    }

    const config = await configuration(args, dependencies);
    secrets = credentialSecrets(config);

    if (args[0] === 'boards' && args[1] === 'list') {
      return success(
        await listReadableBoards(remoteClient(config, dependencies)),
        json,
        secrets,
      );
    }

    const boardSelector = requiredValue(args, '--board');
    if (
      args[0] === 'doctor' &&
      (!config.credentials.apiKey || !config.credentials.apiToken) &&
      !dependencies.client
    ) {
      return success(await doctor(config), json, secrets);
    }
    const client = remoteClient(config, dependencies);
    const board = await resolveBoardSelector(boardSelector, client);
    const selectedConfig: WorkConfig = { ...config, boardId: board.id };

    if (args[0] === 'doctor') {
      return success(await doctor(selectedConfig, client), json, secrets);
    }

    if (args[0] === 'lists' && args[1] === 'list') {
      return success(await listManagedLists(board.id, client), json, secrets);
    }
    if (args[0] === 'lists' && args[1] === 'create') {
      const pos = listPosition(args);
      return mutationCliResult(
        await createBoardList(
          board.id,
          {
            name: requiredValue(args, '--name'),
            ...(pos === undefined ? {} : { pos }),
          },
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'lists' && args[1] === 'update') {
      const name = valueAfter(args, '--name');
      const pos = listPosition(args);
      if (name === undefined && pos === undefined) {
        usage('List update requires --name and/or --position.');
      }
      return mutationCliResult(
        await updateBoardList(
          board.id,
          args[2],
          {
            ...(name === undefined ? {} : { name }),
            ...(pos === undefined ? {} : { pos }),
          },
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'lists' && args[1] === 'close') {
      return mutationCliResult(
        await closeBoardList(board.id, args[2], client, mutationOptions(args)),
        json,
        secrets,
      );
    }

    if (args[0] === 'workflow' && args[1] === 'init') {
      return mutationCliResult(
        await initializeBoardWorkflow(
          board.id,
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }

    await validateBoardListMappings(board.id, selectedConfig.listIds, client);
    selectedConfig.listIds = await resolveWorkflowListMappings(
      board.id,
      selectedConfig.listIds,
      selectedConfig.listNames,
      client,
    );

    if (args[0] === 'create') {
      const source = await sourceFromFileOrStdin(args, dependencies);
      const options = mutationOptions(args);
      return mutationCliResult(
        await createWorkUnit(source, selectedConfig, client, options),
        json,
        secrets,
      );
    }

    const remoteFamilies = new Set([
      'validate',
      'get',
      'list',
      'metadata',
      'description',
      'transition',
      'reconcile',
      'checklist',
      'lists',
    ]);
    if (!remoteFamilies.has(args[0])) {
      throw new WorkCliError('USAGE_ERROR', `Unknown command: ${args[0]}.`, {
        exitCode: 2,
      });
    }
    if (args[0] === 'validate') {
      return success(
        await validateRemoteWorkUnit(
          referenceAt(args, 1),
          selectedConfig,
          client,
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'get') {
      return success(
        await getWorkUnit(referenceAt(args, 1), selectedConfig, client),
        json,
        secrets,
      );
    }
    if (args[0] === 'list') {
      const filters: ListFilters = {};
      for (const [option, key] of [
        ['--status', 'status'],
        ['--type', 'type'],
        ['--priority', 'priority'],
        ['--owner', 'owner'],
        ['--parent', 'parent'],
        ['--label', 'label'],
      ] as const) {
        const value = valueAfter(args, option);
        if (value !== undefined)
          (filters as Record<string, string>)[key] = value;
      }
      return success(
        await listWorkUnits(filters, selectedConfig, client),
        json,
        secrets,
      );
    }
    if (args[0] === 'metadata' && args[1] === 'update') {
      const inline = valueAfter(args, '--json');
      const path = valueAfter(args, '--file');
      if (Boolean(inline) === Boolean(path)) {
        throw new WorkCliError(
          'USAGE_ERROR',
          'Supply exactly one metadata patch using --json or --file.',
          { exitCode: 2 },
        );
      }
      const patch = parseJson(
        inline ?? (await readText(path as string)),
        'Metadata patch',
      );
      return mutationCliResult(
        await metadataUpdate(
          referenceAt(args, 2),
          patch,
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'description' && args[1] === 'replace') {
      return mutationCliResult(
        await descriptionReplace(
          referenceAt(args, 2),
          await readText(requiredValue(args, '--file')),
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'description' && args[1] === 'patch') {
      return mutationCliResult(
        await descriptionPatch(
          referenceAt(args, 2),
          requiredValue(args, '--section'),
          await readText(requiredValue(args, '--file')),
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'transition') {
      const target = args[2];
      if (!target || target.startsWith('--')) {
        throw new WorkCliError('USAGE_ERROR', 'A target status is required.', {
          exitCode: 2,
        });
      }
      return mutationCliResult(
        await transitionWorkUnit(
          referenceAt(args, 1),
          target,
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'reconcile') {
      return mutationCliResult(
        await reconcileWorkUnit(
          referenceAt(args, 1),
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'checklist' && args[1] === 'list') {
      return success(
        await checklistList(referenceAt(args, 2), selectedConfig, client),
        json,
        secrets,
      );
    }
    if (args[0] === 'checklist' && args[1] === 'create') {
      return mutationCliResult(
        await checklistCreate(
          referenceAt(args, 2),
          requiredValue(args, '--name'),
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'checklist' && args[1] === 'update') {
      const checklistId = args[3];
      if (!checklistId) {
        throw new WorkCliError('USAGE_ERROR', 'A checklist ID is required.', {
          exitCode: 2,
        });
      }
      return mutationCliResult(
        await checklistUpdate(
          referenceAt(args, 2),
          checklistId,
          requiredValue(args, '--name'),
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    if (args[0] === 'checklist' && args[1] === 'item' && args[2] === 'set') {
      const checklistId = args[4];
      const itemId = args[5];
      const checked = args.includes('--checked');
      const unchecked = args.includes('--unchecked');
      if (!checklistId || !itemId || checked === unchecked) {
        throw new WorkCliError(
          'USAGE_ERROR',
          'Checklist item set requires checklist ID, item ID, and exactly one checked state.',
          { exitCode: 2 },
        );
      }
      return mutationCliResult(
        await checklistItemSet(
          referenceAt(args, 3),
          checklistId,
          itemId,
          checked,
          selectedConfig,
          client,
          mutationOptions(args),
        ),
        json,
        secrets,
      );
    }
    throw new WorkCliError('USAGE_ERROR', `Unknown command: ${args[0]}.`, {
      exitCode: 2,
    });
  } catch (error) {
    const stable = asWorkCliError(error);
    return {
      exitCode: stable.exitCode,
      stderr: formatWorkError(stable, json, secrets),
      stdout: '',
    };
  }
}

export async function runWorkCliMain(args: string[]): Promise<number> {
  const result = await runWorkCli(args);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.exitCode;
}
