export type CommandDefinition = {
  id: string;
  syntax: string;
  summary: string;
  options: string[];
  mutating: boolean;
};

const MUTATION_SAFETY = ['--dry-run', '--if-version', '--operation-id'];

const BASE_COMMAND_CATALOG: CommandDefinition[] = [
  {
    id: 'boards-list',
    syntax: 'work boards list',
    summary: 'List authenticated readable boards without mutation.',
    options: ['--hermes-env', '--output'],
    mutating: false,
  },
  {
    id: 'workflow-init',
    syntax: 'work workflow init',
    summary: 'Create only missing canonical workflow lists.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-list',
    syntax: 'work lists list',
    summary: 'List open and closed lists on the resolved board.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'lists-create',
    syntax: 'work lists create --name <name>',
    summary: 'Create and verify one board-scoped list.',
    options: ['--name', '--position', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-update',
    syntax: 'work lists update <list-id>',
    summary: 'Rename or reposition one board-scoped list.',
    options: ['--name', '--position', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-close',
    syntax: 'work lists close <list-id>',
    summary: 'Close/archive one empty board-scoped list.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'get',
    syntax: 'work get <reference>',
    summary: 'Read and normalize one Work Unit.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'list',
    syntax: 'work list',
    summary: 'List normalized Work Units with optional filters.',
    options: [
      '--status',
      '--type',
      '--priority',
      '--owner',
      '--parent',
      '--label',
      '--output',
    ],
    mutating: false,
  },
  {
    id: 'inbox-list',
    syntax: 'work inbox list',
    summary: 'List ordinary Inbox cards and Draft Work Units.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'draft-create',
    syntax: 'work draft create --file <work-unit.md> | --stdin',
    summary: 'Create an agent-prepared Draft Work Unit in Inbox.',
    options: ['--file', '--stdin', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'design-start',
    syntax: 'work design start <card-reference> --file <work-unit.md>',
    summary: 'Convert one Inbox card in place into an In Design Work Unit.',
    options: ['--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'create',
    syntax: 'work create --file <work-unit.md> | --stdin',
    summary: 'Deprecated alias for work draft create.',
    options: ['--file', '--stdin', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'metadata-update',
    syntax:
      'work metadata update <reference> --json <merge-patch> | --file <patch.json>',
    summary: 'Apply an authority-checked metadata merge patch.',
    options: ['--json', '--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'description-replace',
    syntax: 'work description replace <reference> --file <description.md>',
    summary: 'Replace a complete validated Work Unit description.',
    options: ['--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'description-patch',
    syntax:
      'work description patch <reference> --section <section> --file <content.md>',
    summary: 'Replace one known Work Unit section safely.',
    options: ['--section', '--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'transition',
    syntax: 'work transition <reference> <target-status>',
    summary: 'Apply a configured status transition and Trello list move.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'reconcile',
    syntax: 'work reconcile <reference>',
    summary: 'Detect and repair configured representation drift.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'validate-file',
    syntax: 'work validate --file <work-unit.md>',
    summary: 'Validate a local Work Unit without Trello access.',
    options: ['--file', '--output'],
    mutating: false,
  },
  {
    id: 'validate-remote',
    syntax: 'work validate <reference>',
    summary: 'Read and validate a remote Work Unit without mutation.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'checklist-list',
    syntax: 'work checklist list <reference>',
    summary: 'List checklists and stable item IDs.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'checklist-create',
    syntax: 'work checklist create <reference> --name <name>',
    summary: 'Create one named checklist on a resolved card.',
    options: ['--name', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'checklist-update',
    syntax: 'work checklist update <reference> <checklist-id> --name <name>',
    summary: 'Rename a checklist addressed by stable Trello ID.',
    options: ['--name', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'checklist-item-set',
    syntax:
      'work checklist item set <reference> <checklist-id> <item-id> --checked|--unchecked',
    summary: 'Set a checklist item state using stable Trello IDs.',
    options: ['--checked', '--unchecked', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'doctor',
    syntax: 'work doctor',
    summary:
      'Run read-only credential, API, board, list, and mapping diagnostics.',
    options: ['--hermes-env', '--output'],
    mutating: false,
  },
  {
    id: 'docs',
    syntax: 'work docs',
    summary: 'Read this complete version-matched offline guide.',
    options: ['--list', '--topic', '--search', '--output'],
    mutating: false,
  },
];

export const COMMAND_CATALOG: CommandDefinition[] = BASE_COMMAND_CATALOG.map(
  (command) =>
    command.id === 'docs' ||
    command.id === 'validate-file' ||
    command.id === 'boards-list'
      ? command
      : {
          ...command,
          syntax: `${command.syntax} --board <id-or-exact-name>`,
          options: [
            ...command.options,
            ...(command.options.includes('--hermes-env')
              ? []
              : ['--hermes-env']),
            '--board',
          ],
        },
);
