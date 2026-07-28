import { COMMAND_CATALOG, type CommandDefinition } from './command-catalog';
import { WorkCliError } from './errors';

export type DocsTopic = {
  id: string;
  title: string;
  content: string;
};

export type DocsOptions = {
  mode: 'default' | 'list' | 'topic' | 'search';
  value?: string;
  output: 'text' | 'json';
};

export const DOCS_TOPICS: DocsTopic[] = [
  {
    id: 'concepts',
    title: 'Concepts and canonical Work Units',
    content:
      'A Work Unit is one Trello card whose description is a canonical # Work Unit Markdown document. WU-N comes from Trello idShort after creation. Draft IDs and timestamps are null; persisted identifiers and timestamps are paired. parent and blocked_by always use WU-N identifiers. work list accepts at most one --label filter and requires that label to be present.',
  },
  {
    id: 'configuration',
    title: 'Configuration and credentials',
    content:
      'Normal API calls require TRELLO_API_KEY and TRELLO_API_TOKEN. TRELLO_API_SECRET is never sent. Every board-dependent invocation requires --board <id-or-exact-name>; an exact board name must resolve to one readable board, while duplicate names require a board ID. TRELLO_BOARD_ID is ignored for selection. Missing per-status list-ID variables resolve the exact canonical names Inbox, Ready, In Progress, Review, Blocked, and Done. The built-in transition graph supports the canonical workflow and reconciliation defaults to description; TRELLO_TRANSITIONS_JSON and TRELLO_RECONCILE_SOURCE replace those policies. Process environment wins. Use --hermes-env <path> to explicitly load a Hermes env file; a working-directory .env is never assumed.',
  },
  {
    id: 'workflows',
    title: 'Recommended workflows',
    content:
      'Recommended human workflow: validate a draft, inspect work create --dry-run, then execute once with an operation ID and preserve the recovery result. Recommended agent workflow: prefer --output json, pass --if-version from the latest read, use a durable operation ID, and call work reconcile after a partial or ambiguous outcome.',
  },
  {
    id: 'safety',
    title: 'Safety, concurrency, and idempotency',
    content:
      'Mutations validate current and proposed state, honor dry-run without writes, perform best-effort optimistic concurrency through a check-before-write --if-version comparison (not an atomic conditional Trello write), preserve an operation ID through --operation-id, perform minimum Trello operations, and read back before success. List delete means close/archive; a nonempty list is never closed. Boards are read-only. Unsupported transitions, wrong-board resources, and unresolved board/list configuration fail before mutation.',
  },
  {
    id: 'output',
    title: 'Output and Exit codes',
    content:
      'Every command accepts --output json. Machine-readable success data goes to stdout. Diagnostics and structured failures go to stderr. Exit code 0 means success; 1 means validation/API/verification failure; 2 means usage error; 3 means credentials/authentication failure; 4 means optimistic-concurrency rejection. Codes and messages are stable and never include credential values.',
  },
  {
    id: 'recovery',
    title: 'Recovery and reconciliation',
    content:
      'A partial or ambiguous mutation is not blindly retried. Preserve its operation ID, card/reference data, expected version, and recovery payload. Run work get and then work reconcile --dry-run. Reconciliation detects description/metadata and status/list drift and applies only an explicitly configured source-of-truth policy.',
  },
  {
    id: 'doctor',
    title: 'Doctor diagnostics',
    content:
      'work doctor is read-only. It reports credential availability, Trello authentication reachability, board/list configuration, required-list presence, and mapping validity. It does not print credential values and does not create, update, move, or delete cards.',
  },
  {
    id: 'lists',
    title: 'Board discovery and guarded list management',
    content:
      'work boards list is read-only. work workflow init creates only missing canonical lists after full ambiguity and override preflight, preserving every existing list. work lists list includes open and closed lists with stable IDs, positions, and state. work lists create, work lists update, and work lists close require --board plus dry-run and operation identity. Exact replay verifies the recorded postcondition; collisions and ambiguous or partial outcomes return recovery evidence and are not blindly retried.',
  },
  {
    id: 'live-e2e',
    title: 'Explicit live E2E preflight and cleanup',
    content:
      'Live tests require TRELLO_LIVE_E2E=1, process-env credential-source confirmation, and an exact allowlisted board ID plus selector. Preflight uses the effective built-in-or-overridden six-list mapping, transition policy, and reconciliation source; guarded initialization creates only missing canonical lists. Missing mandatory confirmation fails before access. The run tags every resource, moves disposable cards to Done, closes only empty run-created lists, and reports credential-free recovery records for anything unresolved. Normal package tests never run the live scenario.',
  },
  {
    id: 'examples',
    title: 'Examples',
    content:
      'Examples: work boards list --output json; work lists create --board Testing --name Disposable --dry-run --operation-id list-42; work validate --file draft.md --output json; work create --board Testing --file draft.md --dry-run --operation-id planning-42; work get WU-42 --board Testing --output json; work transition WU-42 ready --board Testing --if-version <version> --operation-id transition-42; work reconcile WU-42 --board Testing --dry-run.',
  },
];

export function renderShortHelp(): string {
  return [
    'work commands:',
    ...COMMAND_CATALOG.map(
      (command) => `  ${command.syntax}\n      ${command.summary}`,
    ),
    '',
    'Every command supports --output json. Run work docs for the offline guide.',
    '',
  ].join('\n');
}

function commandText(command: CommandDefinition): string {
  return [
    `### ${command.syntax}`,
    '',
    command.summary,
    '',
    `Options: ${command.options.join(', ') || 'none'}`,
  ].join('\n');
}

function topicText(topic: DocsTopic): string {
  return [`## ${topic.title}`, '', topic.content].join('\n');
}

function selected(options: DocsOptions): {
  topics: DocsTopic[];
  commands: CommandDefinition[];
} {
  if (options.mode === 'default' || options.mode === 'list') {
    return { topics: DOCS_TOPICS, commands: COMMAND_CATALOG };
  }
  if (!options.value?.trim()) {
    throw new WorkCliError(
      'DOCS_VALUE_REQUIRED',
      'A docs topic or search value is required.',
    );
  }
  if (options.mode === 'topic') {
    const topic = DOCS_TOPICS.find(
      (candidate) =>
        candidate.id.toLowerCase() === options.value?.toLowerCase(),
    );
    if (!topic) {
      throw new WorkCliError(
        'DOCS_TOPIC_NOT_FOUND',
        'Documentation topic was not found.',
      );
    }
    return { topics: [topic], commands: [] };
  }
  const words = options.value.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (value: string) =>
    words.every((word) => value.toLowerCase().includes(word));
  return {
    topics: DOCS_TOPICS.filter((topic) =>
      matches(`${topic.id} ${topic.title} ${topic.content}`),
    ),
    commands: COMMAND_CATALOG.filter((command) =>
      matches(
        `${command.id} ${command.syntax} ${command.summary} ${command.options.join(' ')}`,
      ),
    ),
  };
}

export function renderDocs(options: DocsOptions): string {
  const result = selected(options);
  if (options.output === 'json') {
    return `${JSON.stringify({
      version: 1,
      mode: options.mode,
      topics: result.topics,
      commands: result.commands,
    })}\n`;
  }
  if (options.mode === 'list') {
    return `${DOCS_TOPICS.map((topic) => `${topic.id}\t${topic.title}`).join('\n')}\n`;
  }
  if (
    options.mode === 'search' &&
    result.topics.length + result.commands.length === 0
  ) {
    return 'No documentation matches.\n';
  }
  const sections = [
    ...result.topics.map(topicText),
    ...result.commands.map(commandText),
  ];
  return `# Work CLI Offline Guide\n\n${sections.join('\n\n')}\n`;
}
