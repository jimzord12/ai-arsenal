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
    id: 'create',
    syntax: 'work create --file <work-unit.md> | --stdin',
    summary: 'Create and verify exactly one Inbox card from a valid draft.',
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
    command.id === 'docs' || command.id === 'validate-file'
      ? command
      : {
          ...command,
          options: command.options.includes('--hermes-env')
            ? command.options
            : [...command.options, '--hermes-env'],
        },
);
