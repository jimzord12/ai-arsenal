import packageJson from '../package.json' with { type: 'json' };
import {
  parseGitCollectionArguments,
  type GitCollectionArguments,
} from './arguments.js';
import { serializeGitEvidence } from './evidence-schema.js';
import { collectGitEvidence, GitCollectionFailure } from './git-collector.js';

export type CliResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

export const HELP = [
  'weekly-report-cli',
  '',
  'Usage:',
  '  weekly-report-cli --help',
  '  weekly-report-cli --version',
  '  weekly-report-cli collect git --repository <path> --remote <name> --default-branch <name> --since <instant> --until <instant>',
  '',
  'Successful collection writes validated JSON evidence to stdout.',
  '',
].join('\n');

export const VERSION = packageJson.version;

type GitCollector = (request: GitCollectionArguments) => unknown;

function collectionFailure(
  request: GitCollectionArguments,
  error: unknown,
): CliResult {
  const failure =
    error instanceof GitCollectionFailure
      ? error
      : new GitCollectionFailure(
          error instanceof Error &&
            error.message.startsWith('Invalid Git evidence:')
            ? 'GIT_OUTPUT_VALIDATION_FAILED'
            : 'GIT_COLLECTION_FAILED',
          'Git evidence collection failed.',
        );
  const evidence = {
    collector: 'git' as const,
    errors: [
      {
        code: failure.code,
        ...(failure.detail === undefined ? {} : { detail: failure.detail }),
        message: failure.message,
      },
    ],
    interval: { since: request.since, until: request.until },
    schemaVersion: '1' as const,
    source: {
      defaultBranch: request.defaultBranch,
      remote: request.remote,
    },
    status: 'unverifiable' as const,
  };
  const detail = failure.detail === undefined ? '' : `\n${failure.detail}`;
  return {
    exitCode: 1,
    stderr: `COLLECTION_ERROR ${failure.code}: ${failure.message}${detail}\n`,
    stdout: serializeGitEvidence(evidence),
  };
}

export function runCli(
  args: readonly string[],
  collector: GitCollector = collectGitEvidence,
): CliResult {
  if (
    args.length === 0 ||
    (args.length === 1 && ['--help', 'help'].includes(args[0]))
  ) {
    return { exitCode: 0, stderr: '', stdout: HELP };
  }

  if (args.length === 1 && ['--version', 'version'].includes(args[0])) {
    return {
      exitCode: 0,
      stderr: '',
      stdout: `weekly-report-cli ${VERSION}\n`,
    };
  }

  if (args[0] === 'collect' && args[1] === 'git') {
    const parsed = parseGitCollectionArguments(args.slice(2));
    if (!parsed.ok) {
      return {
        exitCode: 2,
        stderr: `USAGE_ERROR: ${parsed.error}\n`,
        stdout: '',
      };
    }

    try {
      return {
        exitCode: 0,
        stderr: '',
        stdout: serializeGitEvidence(collector(parsed.value)),
      };
    } catch (error) {
      return collectionFailure(parsed.value, error);
    }
  }

  return {
    exitCode: 2,
    stderr: `USAGE_ERROR: Unknown command: ${args[0]}.\n`,
    stdout: '',
  };
}
