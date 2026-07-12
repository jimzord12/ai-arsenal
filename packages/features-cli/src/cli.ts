import { isAbsolute, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  createFeature,
  FEATURE_PHASES,
  FEATURE_STATUSES,
  FeatureStateError,
  initFeaturesState,
  readFeaturesState,
  resolveCurrentFeature,
  updateFeature,
} from './features-state';
import {
  getActionableIssues,
  getIssuesStatusPath,
  IssueStateError,
  readIssuesState,
  regenerateIssuesStateFromIssueFiles,
  reopenIssue,
  resolveFeatureForIssueRead,
  selectNextContractIssue,
  selectNextIssue,
  selectResumableIssue,
  updateIssueBlockers,
  updateIssueStatus,
} from './issues-state';
import {
  markMilestoneDecomposed,
  MilestoneStateError,
} from './milestone-state';
import {
  type FeatureProgress,
  getContractedIssueIds,
  getFeatureProgress,
} from './progress-state';

export type CliResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

export const FEATURES_CLI_HELP = `features-cli commands:
  init
  create-feature <slug>
  status
  progress [--feature <slug>] [--json]
  list-issues [--feature <slug>] [--actionable]
  get-issue <--next|--next-contract|--resume> [--feature <slug>]
  get-feature
  update-feature <slug> [--status <status>] [--phase <phase>] [--focus <path|none>] [--pause-current]
  mark-milestone-decomposed <milestone-slug> [--feature <slug>]
  sync-issues [--feature <slug>]
  update-blockers <id> --blockers <none|id[,id...]> [--feature <slug>]
  update-status <id> --status <status> [--feature <slug>] [--force]
  reopen-issue <id> --phase <red|green> <--reason <text>|--reason-file <path>> [--feature <slug>] [--force]
  help | --help`;

function parseNewCommandArgs(
  args: string[],
  options: {
    positionals: number;
    valueFlags?: string[];
    booleanFlags?: string[];
  },
): {
  positionals: string[];
  values: Map<string, string>;
  booleans: Set<string>;
} {
  const positionals: string[] = [];
  const values = new Map<string, string>();
  const booleans = new Set<string>();
  const valueFlags = new Set(options.valueFlags ?? []);
  const booleanFlags = new Set(options.booleanFlags ?? []);

  for (let index = 1; index < args.length; index += 1) {
    const token = args[index];
    if (valueFlags.has(token)) {
      if (values.has(token)) {
        throw new FeatureStateError(`Duplicate flag ${token}.`);
      }
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new FeatureStateError(`Flag ${token} requires a value.`);
      }
      values.set(token, value);
      index += 1;
    } else if (booleanFlags.has(token)) {
      if (booleans.has(token)) {
        throw new FeatureStateError(`Duplicate flag ${token}.`);
      }
      booleans.add(token);
    } else if (token.startsWith('--')) {
      throw new FeatureStateError(
        `Unknown flag ${token}. Run --help for usage.`,
      );
    } else {
      positionals.push(token);
    }
  }

  if (positionals.length !== options.positionals) {
    throw new FeatureStateError(`Unexpected arguments. Run --help for usage.`);
  }
  return { positionals, values, booleans };
}

export function formatFeatureProgress(progress: FeatureProgress): string {
  const frontierTarget = progress.frontier.issueId
    ? ` (#${String(progress.frontier.issueId).padStart(2, '0')})`
    : progress.frontier.milestoneSlug
      ? ` (${progress.frontier.milestoneSlug})`
      : '';
  const lines = [
    `Feature: ${String(progress.feature.id).padStart(3, '0')}-${progress.feature.slug}`,
    `Status: ${progress.feature.status}`,
    `Phase: ${progress.feature.phase}`,
    `Frontier: ${progress.frontier.kind}${frontierTarget}`,
    `Artifacts: PRD=${progress.artifacts.prd} Grill=${progress.artifacts.grillSession} Decisions=${progress.artifacts.decisions} SPEC=${progress.artifacts.spec}`,
    `Focus: ${progress.feature.focusPath ?? 'none'}`,
  ];

  if (progress.milestones) {
    const pending = progress.milestones.entries
      .filter((entry) => entry.decomposedAt === null)
      .map((entry) => entry.slug);
    lines.push(
      `Milestones: ${progress.milestones.decomposed}/${progress.milestones.planned} decomposed, ${progress.milestones.pending} pending`,
      `Pending milestones: ${pending.join(', ') || 'none'}`,
    );
  } else {
    lines.push('Milestones: none');
  }
  if (progress.issues) {
    lines.push(
      `Issues: ${progress.issues.done} done, ${progress.issues.pending} pending, ${progress.issues.actionable} actionable, ${progress.issues.blocked} blocked`,
      `Issue statuses: ${
        Object.entries(progress.issues.byStatus)
          .map(([status, count]) => `${status}=${count}`)
          .join(', ') || 'none'
      }`,
      `Resumable issue: ${progress.issues.resumableIssueId === null ? 'none' : `#${String(progress.issues.resumableIssueId).padStart(2, '0')}`}`,
      `Next issue: ${progress.issues.nextIssueId === null ? 'none' : `#${String(progress.issues.nextIssueId).padStart(2, '0')}`}`,
    );
  } else {
    lines.push('Issues: none', 'Resumable issue: none', 'Next issue: none');
  }
  lines.push('Warnings:');
  if (progress.warnings.length === 0) {
    lines.push('  none');
  } else {
    lines.push(
      ...progress.warnings.map(
        (warning) =>
          `  - ${warning.code}: ${warning.message}${warning.path ? ` (${warning.path})` : ''}`,
      ),
    );
  }
  return lines.join('\n');
}

export async function runIssuesManagerCli(
  args: string[],
  options: { cwd: string },
): Promise<CliResult> {
  try {
    if (args[0] === 'help' || args[0] === '--help') {
      return { exitCode: 0, stdout: FEATURES_CLI_HELP, stderr: '' };
    }

    if (args[0] === 'list-issues') {
      const featureFlagIndex = args.indexOf('--feature');
      const actionableOnly = args.includes('--actionable');
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const issuesState = await readIssuesState(options.cwd, feature);
      const issues = actionableOnly
        ? getActionableIssues(issuesState)
        : issuesState.issues;

      return {
        exitCode: 0,
        stderr: '',
        stdout: [
          actionableOnly ? 'Feature issues (actionable)' : 'Feature issues',
          `id: ${issuesState.featureId}`,
          `slug: ${issuesState.featureSlug}`,
          `status: ${issuesState.featureStatus ?? 'unknown'}`,
          ...issues.flatMap((issue) => [
            '',
            `${issue.id}. ${issue.title}`,
            `status: ${issue.status}`,
            `method: ${issue.method}`,
            `complexity: ${issue.complexity}`,
            `decomposed: ${issue.decomposed ?? 'no'}`,
            `path: ${issue.filePath}`,
          ]),
        ].join('\n'),
      };
    }

    if (args[0] === 'init') {
      const { created } = await initFeaturesState({ cwd: options.cwd });

      return {
        exitCode: 0,
        stderr: '',
        stdout: created
          ? 'Initialized pipeline state at .scratch/features-status.json'
          : 'Pipeline state already exists at .scratch/features-status.json (left unchanged)',
      };
    }

    if (args[0] === 'create-feature') {
      const slugFlagIndex = args.indexOf('--slug');
      const slug = slugFlagIndex >= 0 ? args[slugFlagIndex + 1] : args[1];

      if (!slug || slug.startsWith('--')) {
        throw new FeatureStateError('Usage: create-feature <slug>');
      }

      const { feature, dir } = await createFeature({
        cwd: options.cwd,
        slug,
      });

      const lines = [
        'Created feature',
        `id: ${feature.id}`,
        `slug: ${feature.slug}`,
        `status: ${feature.status}`,
        `phase: ${feature.phase}`,
        `focus: ${feature.focusPath ?? 'none'}`,
        `dir: ${dir}`,
      ];

      return {
        exitCode: 0,
        stderr: '',
        stdout: lines.join('\n'),
      };
    }

    if (args[0] === 'get-feature') {
      const state = await readFeaturesState(options.cwd);
      const feature = resolveCurrentFeature(state);

      return {
        exitCode: 0,
        stderr: '',
        stdout: [
          'Current feature',
          `id: ${feature.id}`,
          `slug: ${feature.slug}`,
          `status: ${feature.status}`,
          `phase: ${feature.phase}`,
          `focus: ${feature.focusPath ?? 'none'}`,
        ].join('\n'),
      };
    }

    if (args[0] === 'status') {
      const state = await readFeaturesState(options.cwd);

      if (state.features.length === 0) {
        return {
          exitCode: 0,
          stderr: '',
          stdout: 'No features registered.',
        };
      }

      return {
        exitCode: 0,
        stderr: '',
        stdout: (
          await Promise.all(
            state.features.map((feature) =>
              getFeatureProgress({ cwd: options.cwd, feature }),
            ),
          )
        )
          .map(formatFeatureProgress)
          .join('\n\n---\n\n'),
      };
    }

    if (args[0] === 'progress') {
      const parsed = parseNewCommandArgs(args, {
        positionals: 0,
        valueFlags: ['--feature'],
        booleanFlags: ['--json'],
      });
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        parsed.values.get('--feature'),
      );
      const progress = await getFeatureProgress({ cwd: options.cwd, feature });
      return {
        exitCode: 0,
        stderr: '',
        stdout: parsed.booleans.has('--json')
          ? JSON.stringify(progress, null, 2)
          : formatFeatureProgress(progress),
      };
    }

    if (args[0] === 'mark-milestone-decomposed') {
      const parsed = parseNewCommandArgs(args, {
        positionals: 1,
        valueFlags: ['--feature'],
      });
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        parsed.values.get('--feature'),
      );
      const result = await markMilestoneDecomposed({
        cwd: options.cwd,
        feature,
        milestoneSlug: parsed.positionals[0],
      });
      return {
        exitCode: 0,
        stderr: '',
        stdout: `${result.changed ? 'Marked' : 'Already marked'} milestone\nfeature: ${feature.slug}\nmilestone: ${result.milestoneSlug}\ndecomposedAt: ${result.decomposedAt}`,
      };
    }

    if (args[0] === 'sync-issues') {
      const parsed = parseNewCommandArgs(args, {
        positionals: 0,
        valueFlags: ['--feature'],
      });
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        parsed.values.get('--feature'),
      );
      const synced = await regenerateIssuesStateFromIssueFiles({
        cwd: options.cwd,
        feature,
      });
      return {
        exitCode: 0,
        stderr: '',
        stdout: `Synchronized issues\nfeature: ${feature.slug}\nissues: ${synced.issues.length}\npath: ${getIssuesStatusPath(options.cwd, feature)}`,
      };
    }

    if (args[0] === 'update-feature') {
      const slug = args[1];
      const statusFlagIndex = args.indexOf('--status');
      const phaseFlagIndex = args.indexOf('--phase');
      const focusFlagIndex = args.indexOf('--focus');
      const status =
        statusFlagIndex >= 0 ? args[statusFlagIndex + 1] : undefined;
      const phase = phaseFlagIndex >= 0 ? args[phaseFlagIndex + 1] : undefined;
      const focus = focusFlagIndex >= 0 ? args[focusFlagIndex + 1] : undefined;
      const pauseCurrent = args.includes('--pause-current');

      if (
        !slug ||
        slug.startsWith('--') ||
        (statusFlagIndex >= 0 && (!status || status.startsWith('--'))) ||
        (phaseFlagIndex >= 0 && (!phase || phase.startsWith('--'))) ||
        (focusFlagIndex >= 0 && (!focus || focus.startsWith('--')))
      ) {
        throw new FeatureStateError(
          'Usage: update-feature <slug> [--status <todo|in-progress|paused|archived>] [--phase <design|implementation>] [--focus <feature-relative-path|none>] [--pause-current]',
        );
      }

      if (
        status !== undefined &&
        !FEATURE_STATUSES.includes(status as (typeof FEATURE_STATUSES)[number])
      ) {
        throw new FeatureStateError(
          `Invalid feature status "${status}". Expected one of: ${FEATURE_STATUSES.join(', ')}.`,
        );
      }

      if (
        phase !== undefined &&
        !FEATURE_PHASES.includes(phase as (typeof FEATURE_PHASES)[number])
      ) {
        throw new FeatureStateError(
          `Invalid feature phase "${phase}". Expected one of: ${FEATURE_PHASES.join(', ')}.`,
        );
      }

      const feature = await updateFeature({
        cwd: options.cwd,
        slug,
        ...(status !== undefined
          ? { status: status as (typeof FEATURE_STATUSES)[number] }
          : {}),
        ...(phase !== undefined
          ? { phase: phase as (typeof FEATURE_PHASES)[number] }
          : {}),
        ...(focus !== undefined
          ? { focusPath: focus.toLowerCase() === 'none' ? null : focus }
          : {}),
        pauseCurrent,
      });

      const lines = [
        'Updated feature',
        `id: ${feature.id}`,
        `slug: ${feature.slug}`,
        `status: ${feature.status}`,
        `phase: ${feature.phase}`,
        `focus: ${feature.focusPath ?? 'none'}`,
      ];

      return {
        exitCode: 0,
        stderr: '',
        stdout: lines.join('\n'),
      };
    }

    if (args[0] === 'update-blockers') {
      const issueIdRaw = args[1];
      const blockersFlagIndex = args.indexOf('--blockers');
      const featureFlagIndex = args.indexOf('--feature');
      const blockersRaw =
        blockersFlagIndex >= 0 ? args[blockersFlagIndex + 1] : undefined;

      if (!issueIdRaw || !blockersRaw) {
        throw new IssueStateError(
          'Usage: update-blockers <issue-id> --blockers <none|id[,id...]> [--feature <slug>]',
        );
      }

      const issueId = Number(issueIdRaw);

      if (!Number.isInteger(issueId) || issueId <= 0) {
        throw new IssueStateError(
          `Invalid issue id "${issueIdRaw}". Expected a positive integer issue id.`,
        );
      }

      const blockedBy = parseBlockedByArgument(blockersRaw);
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const update = await updateIssueBlockers({
        cwd: options.cwd,
        feature,
        issueId,
        blockedBy,
      });

      // Re-validate the regenerated state explicitly as a feature-wide guard.
      await regenerateIssuesStateFromIssueFiles({
        cwd: options.cwd,
        feature,
      });

      return {
        exitCode: 0,
        stderr: '',
        stdout: [
          'Updated blockers',
          `feature: ${update.featureSlug}`,
          `issue: ${update.issueId}`,
          `blockedBy: ${update.blockedBy.length > 0 ? update.blockedBy.join(', ') : 'none'}`,
          `path: ${update.issuePath}`,
        ].join('\n'),
      };
    }

    if (args[0] === 'get-issue' && args.includes('--resume')) {
      const featureFlagIndex = args.indexOf('--feature');
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const issuesState = await readIssuesState(options.cwd, feature);
      const result = selectResumableIssue(issuesState);

      if (result.kind === 'winner') {
        return {
          exitCode: 0,
          stderr: '',
          stdout: [
            'Resumable issue',
            `feature: ${issuesState.featureSlug}`,
            `id: ${result.issue.id}`,
            `title: ${result.issue.title}`,
            `status: ${result.issue.status}`,
            `phase: ${result.issue.phase ?? 'unknown'}`,
            `path: ${result.issue.filePath}`,
          ].join('\n'),
        };
      }

      return {
        exitCode: 0,
        stderr: '',
        stdout: 'No resumable issues (none in-progress or in-review).',
      };
    }

    if (args[0] === 'get-issue' && args[1] === '--next') {
      const featureFlagIndex = args.indexOf('--feature');
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const issuesState = await readIssuesState(options.cwd, feature);
      const result = selectNextIssue(issuesState);

      if (result.kind === 'winner') {
        const contractedIssueIds = await getContractedIssueIds(
          options.cwd,
          issuesState.issues,
        );
        const contracted = contractedIssueIds.has(result.issue.id);
        return {
          exitCode: 0,
          stderr: '',
          stdout: [
            'Next issue',
            `feature: ${issuesState.featureSlug}`,
            `id: ${result.issue.id}`,
            `title: ${result.issue.title}`,
            `complexity: ${result.issue.complexity}`,
            `path: ${result.issue.filePath}`,
            `contracted: ${contracted}`,
            `nextAction: ${contracted ? 'implement' : 'contract'}`,
          ].join('\n'),
        };
      }

      if (result.reason === 'no-actionable') {
        return {
          exitCode: 1,
          stderr:
            'No actionable issues found. All issues are blocked or not in ready-for-agent status.',
          stdout: '',
        };
      }

      const message =
        result.reason === 'empty'
          ? 'No issues found for this feature.'
          : 'All issues are complete.';

      return {
        exitCode: 0,
        stderr: '',
        stdout: message,
      };
    }

    if (args[0] === 'get-issue' && args[1] === '--next-contract') {
      const featureFlagIndex = args.indexOf('--feature');
      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const issuesState = await readIssuesState(options.cwd, feature);
      const contractedIssueIds = await getContractedIssueIds(
        options.cwd,
        issuesState.issues,
      );
      const result = selectNextContractIssue(issuesState, contractedIssueIds);

      if (result.kind === 'winner') {
        return {
          exitCode: 0,
          stderr: '',
          stdout: [
            'Next contract issue',
            `feature: ${issuesState.featureSlug}`,
            `id: ${result.issue.id}`,
            `title: ${result.issue.title}`,
            `complexity: ${result.issue.complexity}`,
            `path: ${result.issue.filePath}`,
            'contracted: false',
            'nextAction: contract',
          ].join('\n'),
        };
      }

      if (result.reason === 'no-actionable') {
        return {
          exitCode: 1,
          stderr:
            'No contract-ready issues found. Uncontracted issues are blocked, not ready-for-agent, or already contracted.',
          stdout: '',
        };
      }

      return {
        exitCode: 0,
        stderr: '',
        stdout:
          result.reason === 'empty'
            ? 'No issues found for this feature.'
            : 'All issues are complete.',
      };
    }

    if (args[0] === 'update-status') {
      const issueIdRaw = args[1];
      const statusFlagIndex = args.indexOf('--status');
      const featureFlagIndex = args.indexOf('--feature');
      const force = args.includes('--force');
      const status =
        statusFlagIndex >= 0 ? args[statusFlagIndex + 1] : undefined;

      if (!issueIdRaw || !status) {
        throw new IssueStateError(
          'Usage: update-status <issue-id> --status <status> [--feature <slug>] [--force]',
        );
      }

      const issueId = Number(issueIdRaw);
      if (!Number.isInteger(issueId) || issueId <= 0) {
        throw new IssueStateError(
          `Invalid issue id "${issueIdRaw}". Expected a positive integer issue id.`,
        );
      }

      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const update = await updateIssueStatus({
        cwd: options.cwd,
        feature,
        issueId,
        status,
        force,
      });

      return {
        exitCode: 0,
        stderr: '',
        stdout: [
          'Updated status',
          `feature: ${update.featureSlug}`,
          `issue: ${update.issueId}`,
          `status: ${update.status}`,
          `path: ${update.issuePath}`,
        ].join('\n'),
      };
    }

    if (args[0] === 'reopen-issue') {
      const issueIdRaw = args[1];
      const phaseFlagIndex = args.indexOf('--phase');
      const reasonFlagIndex = args.indexOf('--reason');
      const reasonFileFlagIndex = args.indexOf('--reason-file');
      const featureFlagIndex = args.indexOf('--feature');
      const force = args.includes('--force');
      const phase = phaseFlagIndex >= 0 ? args[phaseFlagIndex + 1] : undefined;

      if (!issueIdRaw || issueIdRaw.startsWith('--') || !phase) {
        throw new IssueStateError(
          'Usage: reopen-issue <issue-id> --phase <red|green> --reason "<finding>" | --reason-file <path> [--feature <slug>] [--force]',
        );
      }

      const issueId = Number(issueIdRaw);
      if (!Number.isInteger(issueId) || issueId <= 0) {
        throw new IssueStateError(
          `Invalid issue id "${issueIdRaw}". Expected a positive integer issue id.`,
        );
      }

      if (phase !== 'red' && phase !== 'green') {
        throw new IssueStateError(
          `Invalid phase "${phase}". Expected red (rewrite tests) or green (re-implement).`,
        );
      }

      let reason: string | undefined;

      if (reasonFileFlagIndex >= 0) {
        const reasonPath = args[reasonFileFlagIndex + 1];

        if (!reasonPath || reasonPath.startsWith('--')) {
          throw new IssueStateError('Missing path for --reason-file.');
        }

        try {
          reason = await readFile(
            isAbsolute(reasonPath) ? reasonPath : join(options.cwd, reasonPath),
            'utf8',
          );
        } catch {
          throw new IssueStateError(
            `Could not read --reason-file at "${reasonPath}".`,
          );
        }
      } else if (reasonFlagIndex >= 0) {
        reason = args[reasonFlagIndex + 1];
      }

      if (!reason || reason.trim().length === 0) {
        throw new IssueStateError(
          'reopen-issue requires a reason. Pass --reason "<finding>" or --reason-file <path>.',
        );
      }

      const state = await readFeaturesState(options.cwd);
      const feature = resolveFeatureForIssueRead(
        state,
        featureFlagIndex >= 0 ? args[featureFlagIndex + 1] : undefined,
      );

      const update = await reopenIssue({
        cwd: options.cwd,
        feature,
        issueId,
        phase,
        reason,
        force,
      });

      return {
        exitCode: 0,
        stderr: '',
        stdout: [
          'Reopened issue',
          `feature: ${update.featureSlug}`,
          `issue: ${update.issueId}`,
          'status: ready-for-agent',
          `phase: ${update.phase}`,
          `reopens: ${update.reopens}`,
          `path: ${update.issuePath}`,
        ].join('\n'),
      };
    }

    return {
      exitCode: 1,
      stderr: 'Unknown command. Run --help for supported commands.',
      stdout: '',
    };
  } catch (error) {
    if (
      error instanceof FeatureStateError ||
      error instanceof IssueStateError ||
      error instanceof MilestoneStateError
    ) {
      return {
        exitCode: 1,
        stderr: error.message,
        stdout: '',
      };
    }

    throw error;
  }
}

function parseBlockedByArgument(value: string): number[] {
  if (value.trim().toLowerCase() === 'none') {
    return [];
  }

  const parts = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (parts.length === 0) {
    throw new IssueStateError(
      'Invalid blockers value. Use --blockers none or --blockers <id[,id...]>',
    );
  }

  return parts.map((part) => {
    if (!/^\d+$/.test(part) || Number(part) <= 0) {
      throw new IssueStateError(
        `Invalid blocker id "${part}". Blocker IDs must be positive integers.`,
      );
    }

    return Number(part);
  });
}

export async function runIssuesManagerCliMain(
  args: string[],
  options?: { cwd?: string },
): Promise<number> {
  const result = await runIssuesManagerCli(args, {
    cwd: options?.cwd ?? process.cwd(),
  });

  if (result.stdout) {
    process.stdout.write(`${result.stdout}\n`);
  }

  if (result.stderr) {
    process.stderr.write(`${result.stderr}\n`);
  }

  return result.exitCode;
}
