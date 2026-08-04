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
    id: 'skills',
    title: 'Managed Trello Agent Skills installation',
    content:
      "jz-trello-flow skills install is self-contained: it asks Git for the actual Git top level and replaces exactly trello-work-orchestrator, trello-work-design, trello-work-deliver, and trello-work-recover beneath that repository's .agents/skills directory using only the payload bundled with the executing CLI package. It rejects a symbolic link or junction in the managed path, preserves unrelated skill directories, stages and structurally validates the complete transformed payload before mutation, and needs no Python, external checkout, network, or Trello credentials. Use --dry-run to report installed or replaced actions without changing the repository. If restoration fails, the error ends with Recovery data preserved at: <exact path>; retain that path for manual recovery. Official skills-ref validation pinned to commit 38a2ff82958afee88dadf4831509e6f7e9d8ef4e is performed against the exact transformed payload during development and release verification, not at runtime.",
  },
  {
    id: 'concepts',
    title: 'Concepts and canonical Work Units',
    content:
      'A Work Unit is one Trello card whose description is a canonical # Work Unit Markdown document. WU-N comes from Trello idShort after creation. Draft IDs and timestamps are null; persisted identifiers and timestamps are paired. parent and blocked_by always use WU-N identifiers. Trello card members are plural native assignments used for attention and notifications; the metadata owner is the single stable agent or worker execution claim. get, list, and inbox list expose deterministic member objects with id, username, and fullName. Without --member, jz-trello-flow list retains its normalized Work Unit output. With --member, it searches all visible board cards and returns ordinary cards and Work Units using the Inbox discriminated shapes; archived cards are excluded. --member matches an exact member ID or case-insensitive exact username and does not match display names or substrings. Work Unit metadata filters such as exact --owner exclude ordinary cards and compose conjunctively. List accepts at most one --label filter.',
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
      'Recommended human workflow: validate a draft, inspect jz-trello-flow create --dry-run, then execute once with an operation ID and preserve the recovery result. Recommended agent workflow: prefer --output json, pass --if-version from the latest read, use a durable operation ID, and call jz-trello-flow reconcile after a partial or ambiguous outcome.',
  },
  {
    id: 'safety',
    title: 'Safety, concurrency, and idempotency',
    content:
      "Mutations validate current and proposed state, honor dry-run without writes, preflight each exact final card description against Trello's documented 16384-character limit, perform best-effort optimistic concurrency through a check-before-write --if-version comparison (not an atomic conditional Trello write), preserve an operation ID through --operation-id, perform minimum Trello operations, and read back before success. DESCRIPTION_BUDGET_EXCEEDED includes non-secret current/proposed character and UTF-8 byte sizes plus compact operation-record contribution and confirms no write was attempted. New versioned records bind canonical postconditions by SHA-256 digest; legacy full records remain readable. List delete means close/archive; a nonempty list is never closed. Boards are read-only. Unsupported transitions, wrong-board resources, and unresolved board/list configuration fail before mutation.",
  },
  {
    id: 'output',
    title: 'Output and Exit codes',
    content:
      'Every command accepts --output json. Machine-readable success data goes to stdout. Diagnostics and structured failures go to stderr. Exit code 0 means success; 1 means validation/API/verification failure; 2 means usage error; 3 means credentials/authentication failure; 4 means optimistic-concurrency rejection. Codes and messages are stable and never include credential values.',
  },
  {
    id: 'attachments',
    title: 'Attachment metadata and downloads',
    content:
      'Every jz-trello-flow get result includes attachmentCount and complete ordered attachment metadata. Ordinary get does not download or write files. Use --attachments-dir <directory> only on get to download uploaded attachments with authenticated binary-safe transport. External links remain metadata-only and are never fetched. Downloads stay inside the explicit destination, reject unsafe filenames, deterministically disambiguate duplicate names, and never overwrite existing files. A partial download exits nonzero and reports the failed attachment plus only the paths already completed.',
  },
  {
    id: 'recovery',
    title: 'Recovery and reconciliation',
    content:
      'A partial or ambiguous mutation is not blindly retried. Preserve its operation ID, card/reference data, expected version, and recovery payload. Run jz-trello-flow get and then jz-trello-flow reconcile --dry-run. A deterministic remote description size/value rejection and any dry-run wrapper/rendering error require read-back before classification; do not discard content or recovery markers. Reconciliation detects description/metadata and status/list drift and applies only an explicitly configured source-of-truth policy.',
  },
  {
    id: 'doctor',
    title: 'Doctor diagnostics',
    content:
      'jz-trello-flow doctor is read-only. It reports credential availability, Trello authentication reachability, board/list configuration, required-list presence, and mapping validity. It does not print credential values and does not create, update, move, or delete cards.',
  },
  {
    id: 'lists',
    title: 'Board discovery and guarded list management',
    content:
      'jz-trello-flow boards list is read-only. jz-trello-flow workflow init creates only missing canonical lists after full ambiguity and override preflight, preserving every existing list. jz-trello-flow lists list includes open and closed lists with stable IDs, positions, and state. jz-trello-flow lists create, jz-trello-flow lists update, and jz-trello-flow lists close require --board plus dry-run and operation identity. Exact replay verifies the recorded postcondition; collisions and ambiguous or partial outcomes return recovery evidence and are not blindly retried.',
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
      'Examples: jz-trello-flow boards list --output json; jz-trello-flow lists create --board Testing --name Disposable --dry-run --operation-id list-42; jz-trello-flow validate --file draft.md --output json; jz-trello-flow create --board Testing --file draft.md --dry-run --operation-id planning-42; jz-trello-flow get WU-42 --board Testing --output json; jz-trello-flow list --board Testing --member dev-one --owner codex:worker-1 --output json; jz-trello-flow transition WU-42 ready --board Testing --if-version <version> --operation-id transition-42; jz-trello-flow reconcile WU-42 --board Testing --dry-run.',
  },
];

export function renderShortHelp(): string {
  return [
    'jz-trello-flow commands:',
    ...COMMAND_CATALOG.map(
      (command) => `  ${command.syntax}\n      ${command.summary}`,
    ),
    '',
    'Every command supports --output json. Run jz-trello-flow docs for the offline guide.',
    '',
  ].join('\n');
}

function commandPath(command: CommandDefinition): string[] {
  const tokens = command.syntax.slice('jz-trello-flow '.length).split(' ');
  const argumentIndex = tokens.findIndex(
    (token) => token.startsWith('--') || token.startsWith('<') || token === '|',
  );
  return argumentIndex === -1 ? tokens : tokens.slice(0, argumentIndex);
}

export function renderCommandHelp(
  requestedPath: readonly string[],
): string | undefined {
  const matches = COMMAND_CATALOG.filter((command) => {
    const path = commandPath(command);
    return (
      requestedPath.length > 0 &&
      requestedPath.length <= path.length &&
      requestedPath.every((token, index) => token === path[index])
    );
  });
  if (matches.length === 0) return undefined;

  return [
    'jz-trello-flow command help:',
    '',
    ...matches.flatMap((command) => [
      command.syntax,
      command.summary,
      `Options: ${command.options.join(', ') || 'none'}`,
      `Example: ${command.example}`,
      '',
    ]),
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
