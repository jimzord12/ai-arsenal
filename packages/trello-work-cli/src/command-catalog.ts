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
    id: 'skills-install',
    syntax: 'jz-trello-flow skills install',
    summary: 'Install or replace the four bundled managed Trello skills.',
    options: ['--dry-run', '--output'],
    mutating: true,
  },
  {
    id: 'boards-list',
    syntax: 'jz-trello-flow boards list',
    summary: 'List authenticated readable boards without mutation.',
    options: ['--hermes-env', '--output'],
    mutating: false,
  },
  {
    id: 'workflow-init',
    syntax: 'jz-trello-flow workflow init',
    summary: 'Create only missing canonical workflow lists.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-list',
    syntax: 'jz-trello-flow lists list',
    summary: 'List open and closed lists on the resolved board.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'lists-create',
    syntax: 'jz-trello-flow lists create --name <name>',
    summary: 'Create and verify one board-scoped list.',
    options: ['--name', '--position', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-update',
    syntax: 'jz-trello-flow lists update <list-id>',
    summary: 'Rename or reposition one board-scoped list.',
    options: ['--name', '--position', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'lists-close',
    syntax: 'jz-trello-flow lists close <list-id>',
    summary: 'Close/archive one empty board-scoped list.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'get',
    syntax: 'jz-trello-flow get <reference>',
    summary:
      'Read one Work Unit and attachment metadata; optionally download uploads.',
    options: ['--attachments-dir', '--output'],
    mutating: false,
  },
  {
    id: 'list',
    syntax: 'jz-trello-flow list',
    summary:
      'List normalized Work Units, or all visible member cards with --member.',
    options: [
      '--status',
      '--type',
      '--priority',
      '--owner',
      '--member',
      '--parent',
      '--label',
      '--output',
    ],
    mutating: false,
  },
  {
    id: 'inbox-list',
    syntax: 'jz-trello-flow inbox list',
    summary: 'List ordinary Inbox cards and Draft Work Units.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'draft-create',
    syntax: 'jz-trello-flow draft create --file <work-unit.md> | --stdin',
    summary: 'Create an agent-prepared Draft Work Unit in Inbox.',
    options: ['--file', '--stdin', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'design-start',
    syntax:
      'jz-trello-flow design start <card-reference> --file <work-unit.md>',
    summary: 'Convert one Inbox card in place into an In Design Work Unit.',
    options: ['--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'create',
    syntax: 'jz-trello-flow create --file <work-unit.md> | --stdin',
    summary: 'Deprecated alias for jz-trello-flow draft create.',
    options: ['--file', '--stdin', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'metadata-update',
    syntax:
      'jz-trello-flow metadata update <reference> --json <merge-patch> | --file <patch.json>',
    summary: 'Apply an authority-checked metadata merge patch.',
    options: ['--json', '--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'description-replace',
    syntax:
      'jz-trello-flow description replace <reference> --file <description.md>',
    summary: 'Replace a complete validated Work Unit description.',
    options: ['--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'description-patch',
    syntax:
      'jz-trello-flow description patch <reference> --section <section> --file <content.md>',
    summary: 'Replace one known Work Unit section safely.',
    options: ['--section', '--file', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'transition',
    syntax: 'jz-trello-flow transition <reference> <target-status>',
    summary: 'Apply a configured status transition and Trello list move.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'reconcile',
    syntax: 'jz-trello-flow reconcile <reference>',
    summary: 'Detect and repair configured representation drift.',
    options: [...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'validate-file',
    syntax: 'jz-trello-flow validate --file <work-unit.md>',
    summary: 'Validate a local Work Unit without Trello access.',
    options: ['--file', '--output'],
    mutating: false,
  },
  {
    id: 'validate-remote',
    syntax: 'jz-trello-flow validate <reference>',
    summary: 'Read and validate a remote Work Unit without mutation.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'checklist-list',
    syntax: 'jz-trello-flow checklist list <reference>',
    summary: 'List checklists and stable item IDs.',
    options: ['--output'],
    mutating: false,
  },
  {
    id: 'checklist-create',
    syntax: 'jz-trello-flow checklist create <reference> --name <name>',
    summary: 'Create one named checklist on a resolved card.',
    options: ['--name', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'checklist-update',
    syntax:
      'jz-trello-flow checklist update <reference> <checklist-id> --name <name>',
    summary: 'Rename a checklist addressed by stable Trello ID.',
    options: ['--name', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'checklist-item-set',
    syntax:
      'jz-trello-flow checklist item set <reference> <checklist-id> <item-id> --checked|--unchecked',
    summary: 'Set a checklist item state using stable Trello IDs.',
    options: ['--checked', '--unchecked', ...MUTATION_SAFETY, '--output'],
    mutating: true,
  },
  {
    id: 'doctor',
    syntax: 'jz-trello-flow doctor',
    summary:
      'Run read-only credential, API, board, list, and mapping diagnostics.',
    options: ['--hermes-env', '--output'],
    mutating: false,
  },
  {
    id: 'docs',
    syntax: 'jz-trello-flow docs',
    summary: 'Read this complete version-matched offline guide.',
    options: ['--list', '--topic', '--search', '--output'],
    mutating: false,
  },
];

export const COMMAND_CATALOG: CommandDefinition[] = BASE_COMMAND_CATALOG.map(
  (command) =>
    command.id === 'docs' ||
    command.id === 'validate-file' ||
    command.id === 'boards-list' ||
    command.id === 'skills-install'
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
