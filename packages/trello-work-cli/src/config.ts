import { readFile } from 'node:fs/promises';
import type { WorkUnitStatus } from './work-unit';

export type TrelloCredentials = {
  apiKey: string | null;
  apiToken: string | null;
};

export type WorkConfig = {
  credentials: TrelloCredentials;
  boardId: string | null;
  listIds: Partial<Record<WorkUnitStatus, string>>;
  transitionGraph: Partial<Record<WorkUnitStatus, WorkUnitStatus[]>> | null;
  reconcileSource: 'description' | 'list' | null;
  loadedHermesEnv: boolean;
  hermesEnvPath: string | null;
};

export type LoadWorkConfigOptions = {
  env?: Record<string, string | undefined>;
  cwd?: string;
  hermesEnvPath?: string;
};

const LIST_VARIABLES: Record<WorkUnitStatus, string> = {
  inbox: 'TRELLO_LIST_INBOX_ID',
  ready: 'TRELLO_LIST_READY_ID',
  in_progress: 'TRELLO_LIST_IN_PROGRESS_ID',
  review: 'TRELLO_LIST_REVIEW_ID',
  blocked: 'TRELLO_LIST_BLOCKED_ID',
  done: 'TRELLO_LIST_DONE_ID',
};
const STATUSES = Object.keys(LIST_VARIABLES) as WorkUnitStatus[];

function invalidTransitionGraph(detail: string): never {
  throw new Error(`TRELLO_TRANSITIONS_JSON_INVALID: ${detail}`);
}

function parseDotEnv(source: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [index, raw] of source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .entries()) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const separator = line.indexOf('=');
    if (separator <= 0)
      throw new Error(`Invalid env entry on line ${index + 1}.`);
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid env variable name on line ${index + 1}.`);
    }
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function optionalValue(
  merged: Record<string, string | undefined>,
  key: string,
): string | null {
  const value = merged[key];
  return value && value.trim() ? value.trim() : null;
}

function parseTransitionGraph(
  value: string | null,
): WorkConfig['transitionGraph'] {
  if (value === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    invalidTransitionGraph('must be valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    invalidTransitionGraph('must be an object.');
  }
  const input = parsed as Record<string, unknown>;
  const keys = Object.keys(input);
  if (
    keys.length !== STATUSES.length ||
    keys.some((key) => !STATUSES.includes(key as WorkUnitStatus))
  ) {
    invalidTransitionGraph(
      `must contain exactly these status keys: ${STATUSES.join(', ')}.`,
    );
  }
  const graph = {} as Record<WorkUnitStatus, WorkUnitStatus[]>;
  for (const status of STATUSES) {
    const targets = input[status];
    if (!Array.isArray(targets)) {
      invalidTransitionGraph(`${status} must be an array.`);
    }
    if (
      targets.some(
        (target) =>
          typeof target !== 'string' ||
          !STATUSES.includes(target as WorkUnitStatus),
      )
    ) {
      invalidTransitionGraph(`${status} contains an unknown status target.`);
    }
    if (new Set(targets).size !== targets.length) {
      invalidTransitionGraph(`${status} contains duplicate targets.`);
    }
    graph[status] = [...targets] as WorkUnitStatus[];
  }
  return graph;
}

export async function loadWorkConfig(
  options: LoadWorkConfigOptions = {},
): Promise<WorkConfig> {
  const processValues = options.env ?? process.env;
  let fileValues: Record<string, string> = {};
  if (options.hermesEnvPath) {
    fileValues = parseDotEnv(await readFile(options.hermesEnvPath, 'utf8'));
  }
  const merged: Record<string, string | undefined> = {
    ...fileValues,
    ...Object.fromEntries(
      Object.entries(processValues).filter(([, value]) => value !== undefined),
    ),
  };
  const listIds: WorkConfig['listIds'] = {};
  for (const [status, variable] of Object.entries(LIST_VARIABLES) as [
    WorkUnitStatus,
    string,
  ][]) {
    const value = optionalValue(merged, variable);
    if (value !== null) listIds[status] = value;
  }
  const source = optionalValue(merged, 'TRELLO_RECONCILE_SOURCE');
  if (source !== null && source !== 'description' && source !== 'list') {
    throw new Error('TRELLO_RECONCILE_SOURCE must be description or list.');
  }
  return {
    credentials: {
      apiKey: optionalValue(merged, 'TRELLO_API_KEY'),
      apiToken: optionalValue(merged, 'TRELLO_API_TOKEN'),
    },
    boardId: optionalValue(merged, 'TRELLO_BOARD_ID'),
    listIds,
    transitionGraph: parseTransitionGraph(
      optionalValue(merged, 'TRELLO_TRANSITIONS_JSON'),
    ),
    reconcileSource: source,
    loadedHermesEnv: Boolean(options.hermesEnvPath),
    hermesEnvPath: options.hermesEnvPath ?? null,
  };
}

export function credentialSecrets(config: WorkConfig): string[] {
  return [config.credentials.apiKey, config.credentials.apiToken].filter(
    (value): value is string => value !== null,
  );
}

export function missingMutationConfiguration(
  config: WorkConfig,
  requiredStatuses: WorkUnitStatus[],
): string[] {
  const missing: string[] = [];
  if (config.boardId === null) missing.push('TRELLO_BOARD_ID');
  for (const status of requiredStatuses) {
    if (!config.listIds[status]) missing.push(LIST_VARIABLES[status]);
  }
  return missing;
}

export function redactSecrets(
  input: string,
  secrets: readonly string[] = [],
): string {
  let output = input;
  for (const secret of [...secrets].sort((a, b) => b.length - a.length)) {
    if (secret) output = output.split(secret).join('[REDACTED]');
  }
  return output
    .replace(/([?&](?:key|token)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(
      /(TRELLO_API_(?:KEY|TOKEN|SECRET)\s*=\s*)[^\s]+/gi,
      '$1[REDACTED]',
    );
}
