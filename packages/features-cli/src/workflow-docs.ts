import type { FeatureProgress, FrontierKind } from './progress-state';

export type DocsCommand = {
  key: string;
  signature: string;
};

export type DocsTopic = {
  index: number;
  name: string;
  aliases: string[];
  description: string;
  purpose: string;
  when: string[];
  inputs: string[];
  artifacts: Array<{
    path: string;
    role: string;
    owner: string;
    authority: string;
  }>;
  commandKeys: string[];
  owners: string[];
  completion: string[];
  commonMistakes: string[];
  prohibitedMutations: string[];
  relatedTopics: string[];
};

export const FEATURES_CLI_COMMANDS: DocsCommand[] = [
  { key: 'init', signature: 'init' },
  { key: 'create-feature', signature: 'create-feature <slug>' },
  { key: 'status', signature: 'status' },
  { key: 'progress', signature: 'progress [--feature <selector>] [--json]' },
  { key: 'docs', signature: 'docs [--index] [<topic>] [--json]' },
  {
    key: 'list-issues',
    signature: 'list-issues [--feature <selector>] [--actionable]',
  },
  {
    key: 'get-issue',
    signature:
      'get-issue <--next|--next-contract|--resume> [--feature <selector>]',
  },
  { key: 'get-feature', signature: 'get-feature' },
  {
    key: 'update-feature',
    signature:
      'update-feature <slug> [--status <status>] [--phase <phase>] [--focus <path|none>] [--pause-current]',
  },
  {
    key: 'mark-milestone-decomposed',
    signature:
      'mark-milestone-decomposed <milestone-slug> [--feature <selector>]',
  },
  { key: 'sync-issues', signature: 'sync-issues [--feature <selector>]' },
  {
    key: 'update-blockers',
    signature:
      'update-blockers <id> --blockers <none|id[,id...]> [--feature <selector>]',
  },
  {
    key: 'update-status',
    signature:
      'update-status <id> --status <status> [--feature <selector>] [--force]',
  },
  {
    key: 'reopen-issue',
    signature:
      'reopen-issue <id> --phase <red|green> <--reason <text>|--reason-file <path>> [--feature <selector>] [--force]',
  },
  { key: 'help', signature: 'help | --help' },
];

export const FEATURES_CLI_HELP = `features-cli commands:\n${FEATURES_CLI_COMMANDS.map(
  (command) => `  ${command.signature}`,
).join('\n')}`;

const commandSignature = (key: string): string => {
  const command = FEATURES_CLI_COMMANDS.find(
    (candidate) => candidate.key === key,
  );
  if (!command) {
    throw new Error(`Unknown documentation command key: ${key}`);
  }
  return command.signature;
};

const topic = (
  index: number,
  name: string,
  description: string,
  purpose: string,
  commandKeys: string[],
  owners: string[],
  relatedTopics: string[],
  artifacts: DocsTopic['artifacts'],
  completion: string[],
  commonMistakes: string[],
  prohibitedMutations: string[],
): DocsTopic => ({
  index,
  name,
  aliases: [String(index)],
  description,
  purpose,
  when: [purpose],
  inputs: artifacts.map((artifact) => artifact.path),
  artifacts,
  commandKeys,
  owners,
  completion,
  commonMistakes,
  prohibitedMutations,
  relatedTopics,
});

export const DOCS_TOPICS: DocsTopic[] = [
  topic(
    1,
    'workflow',
    'Sequence, routing, and transition ownership.',
    'Understand the supported Spec-to-Ship sequence and who owns each transition.',
    ['progress'],
    ['jz-feature-grilling', 'jz-write-spec', 'jz-implement-contract'],
    ['artifacts', 'features', 'execution'],
    [
      {
        path: 'SPEC.md',
        role: 'Implementation-ready feature specification.',
        owner: 'jz-write-spec',
        authority: 'packages/jz-skills/jz-write-spec/SKILL.md',
      },
    ],
    ['Use the frontier reported by progress before choosing a stage skill.'],
    ['Treating derived JSON as an editable workflow plan.'],
    ['Do not manually edit generated JSON or skip a required stage.'],
  ),
  topic(
    2,
    'artifacts',
    'Generated artifacts and what each one owns.',
    'Locate feature artifacts and their canonical owners.',
    ['progress'],
    ['jz-feature-grilling', 'jz-write-spec'],
    ['workflow', 'design', 'planning'],
    [
      {
        path: 'DECISIONS.md',
        role: 'Durable design decisions.',
        owner: 'jz-feature-grilling',
        authority: 'packages/jz-skills/jz-feature-grilling/SKILL.md',
      },
      {
        path: 'issues/<NN>-<slug>/issue.md',
        role: 'Canonical issue metadata and acceptance slice.',
        owner: 'jz-milestone-to-issues',
        authority:
          'packages/jz-skills/jz-milestone-to-issues/references/issue-file-format.md',
      },
    ],
    ['Let the owning skill create or update its artifact.'],
    ['Replacing canonical Markdown with derived state.'],
    ['Do not hand-edit issues-status.json.'],
  ),
  topic(
    3,
    'features',
    'Feature selectors, status, phase, and focus.',
    'Choose and inspect a feature without changing its state.',
    ['status', 'progress', 'get-feature'],
    ['features-cli'],
    ['workflow', 'commands', 'recovery'],
    [
      {
        path: '.scratch/features-status.json',
        role: 'Version 2 feature registry.',
        owner: 'features-cli',
        authority: 'packages/features-cli/src/features-state.ts',
      },
    ],
    ['Use exact slug, ID, padded ID, or full ID-slug selectors.'],
    ['Assuming a paused feature becomes active when read.'],
    ['Do not activate or pause a feature from documentation commands.'],
  ),
  topic(
    4,
    'design',
    'PRD, grilling, decisions, and SPEC handoff.',
    'Prepare a feature design before implementation planning.',
    ['progress'],
    ['jz-feature-grilling', 'jz-write-spec'],
    ['artifacts', 'planning', 'workflow'],
    [
      {
        path: 'PRD.md',
        role: 'Problem and product framing when supplied.',
        owner: 'jz-feature-grilling',
        authority: 'packages/jz-skills/jz-feature-grilling/SKILL.md',
      },
      {
        path: 'GRILL_SESSION.md',
        role: 'Design exploration record.',
        owner: 'jz-feature-grilling',
        authority: 'packages/jz-skills/jz-feature-grilling/SKILL.md',
      },
    ],
    ['Record settled decisions before writing SPEC.md.'],
    ['Assuming a dedicated PRD authoring procedure is installed.'],
    ['Do not invent missing workflow ownership.'],
  ),
  topic(
    5,
    'planning',
    'SPEC milestones and decomposition.',
    'Turn an approved specification into a dependency-aware milestone plan.',
    ['progress', 'mark-milestone-decomposed'],
    ['jz-write-spec', 'jz-spec-to-milestones', 'jz-milestone-to-issues'],
    ['design', 'issues', 'workflow'],
    [
      {
        path: 'SPEC.md',
        role: 'Specification and fenced milestone plan.',
        owner: 'jz-spec-to-milestones',
        authority: 'packages/jz-skills/jz-spec-to-milestones/SKILL.md',
      },
    ],
    ['Decompose only a milestone whose dependencies are complete.'],
    ['Marking a milestone decomposed because an issue happens to exist.'],
    ['Do not bypass the fenced milestone plan.'],
  ),
  topic(
    6,
    'issues',
    'Issues, blockers, contracts, and selection.',
    'Understand issue state and the contract boundary before implementation.',
    ['get-issue', 'list-issues', 'progress'],
    ['jz-milestone-to-issues', 'jz-issue-to-contract'],
    ['planning', 'execution', 'commands'],
    [
      {
        path: 'issues/<NN>-<slug>/issue.md',
        role: 'Canonical issue metadata and acceptance slice.',
        owner: 'jz-milestone-to-issues',
        authority:
          'packages/jz-skills/jz-milestone-to-issues/references/issue-file-format.md',
      },
      {
        path: 'issues/<NN>-<slug>/change-contract.md',
        role: 'Implementation contract for one selected issue.',
        owner: 'jz-issue-to-contract',
        authority: 'packages/jz-skills/jz-issue-to-contract/SKILL.md',
      },
    ],
    ['Create a contract before implementing an uncontracted issue.'],
    ['Treating issues-status.json as the editable source.'],
    ['Do not hand-edit issues-status.json.'],
  ),
  topic(
    7,
    'execution',
    'Implementation, review, reopen, and completion.',
    'Execute a contracted issue through its approved method and review gate.',
    ['get-issue', 'progress'],
    ['jz-implement-contract', 'jz-code-review-super-fast'],
    ['issues', 'workflow', 'recovery'],
    [
      {
        path: 'implementation-report.md',
        role: 'Implementation evidence for a contracted issue.',
        owner: 'jz-implement-contract',
        authority: 'packages/jz-skills/jz-implement-contract/SKILL.md',
      },
    ],
    ['Complete issue review before treating issue work as done.'],
    ['Inventing an installed owner for feature review.'],
    ['Do not archive a feature from the issue execution stage.'],
  ),
  topic(
    8,
    'commands',
    'CLI signatures and safe usage.',
    'Find supported read and mutation commands without relying on shell history.',
    ['progress', 'status', 'docs', 'get-issue'],
    ['features-cli'],
    ['features', 'issues', 'recovery'],
    [
      {
        path: 'src/cli.ts',
        role: 'CLI command dispatch.',
        owner: 'features-cli',
        authority: 'packages/features-cli/src/cli.ts',
      },
    ],
    ['Use --help for the full command surface.'],
    ['Using --docs as though it were a supported flag.'],
    ['Do not rely on fuzzy topic lookup or undocumented flags.'],
  ),
  topic(
    9,
    'recovery',
    'Stops, corrupt state, migration, and recovery.',
    'Recognize fail-closed conditions and preserve canonical recovery evidence.',
    ['progress', 'status'],
    ['features-cli'],
    ['features', 'workflow', 'execution'],
    [
      {
        path: '.scratch/features-status.recovery-required.json',
        role: 'Interrupted writer recovery journal.',
        owner: 'features-cli',
        authority: 'packages/features-cli/src/features-state.ts',
      },
      {
        path: 'WORKFLOW_MIGRATION_NOTE.md',
        role: 'Legacy workflow migration stop.',
        owner: 'feature maintainer',
        authority: 'packages/features-cli/src/progress-state.ts',
      },
    ],
    ['Stop on corrupt, unsupported, or recovery-required state.'],
    ['Deleting a recovery journal to make a command proceed.'],
    ['Do not bypass recovery or migration requirements.'],
  ),
];

export function resolveDocsTopic(value: string): DocsTopic | undefined {
  return DOCS_TOPICS.find(
    (candidate) =>
      candidate.name === value || candidate.aliases.includes(value),
  );
}

export function renderDocsOverview(): string {
  return [
    'JZ Spec-to-Ship',
    '',
    'PRD -> grilling and decisions -> SPEC -> milestones -> issues ->',
    'issue contracts -> implementation and review -> feature review',
    '',
    'The CLI stores durable lifecycle facts and derives the safe workflow frontier.',
    'Documentation is offline and read-only.',
    '',
    'Browse:  features-cli docs --index',
    'Learn:   features-cli docs workflow',
    'Current: features-cli docs current --feature <selector>',
  ].join('\n');
}

export function renderDocsIndex(options: { json: boolean }): string {
  const topics = DOCS_TOPICS.map((entry) => ({
    index: entry.index,
    name: entry.name,
    description: entry.description,
    aliases: entry.aliases,
    command: `features-cli docs ${entry.name}`,
  }));
  if (options.json) {
    return JSON.stringify(
      {
        schemaVersion: '1',
        kind: 'docs-index',
        topics,
        actions: [
          {
            name: 'current',
            description: "Explain the selected feature's current position.",
            command:
              'features-cli docs current [--feature <selector>] [--json]',
          },
        ],
      },
      null,
      2,
    );
  }
  return [
    'JZ workflow documentation',
    '',
    '#  Topic       Description                                      Command',
    ...topics.map(
      (entry) =>
        `${entry.index}  ${entry.name.padEnd(11)} ${entry.description.padEnd(48)} ${entry.command}`,
    ),
  ].join('\n');
}

export function renderDocsTopic(
  entry: DocsTopic,
  options: { json: boolean },
): string {
  const commands = entry.commandKeys.map((key) => ({
    name: key,
    signature: commandSignature(key),
  }));
  if (options.json) {
    return JSON.stringify(
      {
        schemaVersion: '1',
        kind: 'docs-topic',
        topic: {
          index: entry.index,
          name: entry.name,
          description: entry.description,
          purpose: entry.purpose,
          when: entry.when,
          inputs: entry.inputs,
          artifacts: entry.artifacts,
          commands,
          owners: entry.owners,
          completion: entry.completion,
          commonMistakes: entry.commonMistakes,
          prohibitedMutations: entry.prohibitedMutations,
          relatedTopics: entry.relatedTopics,
        },
      },
      null,
      2,
    );
  }
  return [
    `Topic: ${entry.name}`,
    `Purpose: ${entry.purpose}`,
    'Commands:',
    ...commands.map((command) => `  - ${command.signature}`),
    'Owners:',
    ...entry.owners.map((owner) => `  - ${owner}`),
    'Important:',
    ...entry.prohibitedMutations.map((instruction) => `  - ${instruction}`),
    `Related: ${entry.relatedTopics.join(', ')}`,
  ].join('\n');
}

export type DocsErrorCode =
  | 'DOCS_USAGE_ERROR'
  | 'DOCS_TOPIC_NOT_FOUND'
  | 'FEATURE_SELECTION_ERROR'
  | 'FEATURE_STATE_ERROR';
type Guidance = {
  skill: string | null;
  action: string;
  related: string[];
  stop: string[];
};
export const FRONTIER_GUIDANCE: Record<FrontierKind, Guidance> = {
  'migration-required': {
    skill: null,
    action: 'Read the migration note before proceeding.',
    related: ['recovery', 'workflow'],
    stop: ['Do not bypass migration requirements.'],
  },
  'write-prd': {
    skill: 'jz-feature-grilling',
    action: 'Capture the product framing.',
    related: ['design', 'artifacts'],
    stop: ['No dedicated PRD procedure is installed.'],
  },
  'grill-and-consolidate-decisions': {
    skill: 'jz-feature-grilling',
    action: 'Complete grilling and DECISIONS.md.',
    related: ['design', 'workflow'],
    stop: ['Do not write SPEC.md yet.'],
  },
  'design-ready': {
    skill: 'jz-write-spec',
    action: 'Write SPEC.md.',
    related: ['design', 'planning'],
    stop: ['Do not skip specification.'],
  },
  'write-spec': {
    skill: 'jz-write-spec',
    action: 'Write SPEC.md.',
    related: ['design', 'planning'],
    stop: ['Do not decompose work yet.'],
  },
  'plan-milestones': {
    skill: 'jz-spec-to-milestones',
    action: 'Plan milestones.',
    related: ['planning', 'issues'],
    stop: ['Do not create issues before milestones.'],
  },
  'decompose-milestone': {
    skill: 'jz-milestone-to-issues',
    action: 'Decompose the milestone.',
    related: ['planning', 'issues'],
    stop: ['Do not bypass dependencies.'],
  },
  'contract-issue': {
    skill: 'jz-issue-to-contract',
    action: 'Scope the selected issue.',
    related: ['issues', 'execution'],
    stop: ['Do not implement before the contract exists.'],
  },
  'implement-issue': {
    skill: 'jz-implement-contract',
    action: 'Implement the contract.',
    related: ['issues', 'execution'],
    stop: ['Do not expand outside the contract.'],
  },
  'review-issue': {
    skill: 'jz-implement-contract',
    action: 'Complete review or reopen it.',
    related: ['execution', 'issues'],
    stop: ['Do not mark done before review.'],
  },
  blocked: {
    skill: null,
    action: 'Resolve blockers.',
    related: ['issues', 'recovery'],
    stop: ['Do not bypass blockers.'],
  },
  'feature-review': {
    skill: null,
    action: 'Escalate the ownership gap.',
    related: ['execution', 'workflow'],
    stop: ['Do not invent an archival workflow.'],
  },
  archived: {
    skill: null,
    action: 'No action is recommended.',
    related: ['features', 'recovery'],
    stop: ['Do not reopen from docs.'],
  },
};
export function renderDocsError(code: DocsErrorCode, message: string): string {
  return JSON.stringify(
    { schemaVersion: '1', kind: 'docs-error', error: { code, message } },
    null,
    2,
  );
}
export function renderDocsNoCurrent(
  json: boolean,
  registeredFeatures: number,
): string {
  const guidance = {
    state: 'no-current-feature',
    meaning: 'No feature is in-progress.',
    nextArtifact: null,
    recommendedSkill: null,
    recommendedAction: 'Choose a selector and rerun docs current.',
    doNotStart: ['Do not activate or mutate a feature from docs.'],
    relatedTopics: ['features', 'commands'],
  };
  return json
    ? JSON.stringify(
        {
          schemaVersion: '1',
          kind: 'docs-current',
          selection: { selector: null, mode: 'implicit', registeredFeatures },
          progress: null,
          guidance,
        },
        null,
        2,
      )
    : 'No current feature is selected.\nRecommended skill: none';
}
export function renderDocsCurrent(
  progress: FeatureProgress,
  selector: string | undefined,
  json: boolean,
): string {
  const base = FRONTIER_GUIDANCE[progress.frontier.kind];
  const doNotStart =
    progress.feature.status === 'paused' || progress.feature.status === 'todo'
      ? [...base.stop, 'Let the owning skill perform activation preflight.']
      : base.stop;
  const guidance = {
    state: 'selected',
    meaning: progress.frontier.summary,
    nextArtifact: progress.frontier.artifactPath ?? null,
    recommendedSkill: base.skill,
    recommendedAction: base.action,
    doNotStart,
    relatedTopics: base.related,
  };
  const value = {
    schemaVersion: '1',
    kind: 'docs-current',
    selection: {
      selector: selector ?? null,
      mode: selector ? 'explicit' : 'implicit',
    },
    progress,
    guidance,
  };
  return json
    ? JSON.stringify(value, null, 2)
    : [
        `Feature: ${String(progress.feature.id).padStart(3, '0')}-${progress.feature.slug}`,
        `Status: ${progress.feature.status}`,
        `Phase: ${progress.feature.phase}`,
        `Position: ${progress.frontier.kind}`,
        `Meaning: ${guidance.meaning}`,
        `Next artifact: ${guidance.nextArtifact ?? 'none'}`,
        `Recommended skill: ${base.skill ?? 'none'}`,
        `Safety: ${doNotStart.join(' ')}`,
        `Learn more: ${base.related.join(', ')}`,
      ].join('\n');
}
