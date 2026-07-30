import packageJson from '../package.json' with { type: 'json' };

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
  '',
  'Evidence collection commands are not available in this foundation release.',
  '',
].join('\n');

export const VERSION = packageJson.version;

export function runCli(args: readonly string[]): CliResult {
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

  return {
    exitCode: 2,
    stderr: `USAGE_ERROR: Unknown command: ${args[0]}.\n`,
    stdout: '',
  };
}
