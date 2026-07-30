import { HELP, runCli } from './cli.js';

describe('weekly-report-cli help', () => {
  it('returns honest foundation help when no arguments are supplied', () => {
    expect(runCli([])).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: [
        'weekly-report-cli',
        '',
        'Usage:',
        '  weekly-report-cli --help',
        '  weekly-report-cli --version',
        '',
        'Evidence collection commands are not available in this foundation release.',
        '',
      ].join('\n'),
    });
  });

  it.each([['--help'], ['help']])('returns the same help for %s', (...args) => {
    expect(runCli(args)).toEqual({
      exitCode: 0,
      stderr: '',
      stdout: HELP,
    });
  });
});

describe('weekly-report-cli version', () => {
  it.each([['--version'], ['version']])(
    'returns its package version for %s',
    (...args) => {
      expect(runCli(args)).toEqual({
        exitCode: 0,
        stderr: '',
        stdout: 'weekly-report-cli 0.0.0\n',
      });
    },
  );
});

describe('weekly-report-cli usage failures', () => {
  it('writes a structured diagnostic to stderr for an unknown command', () => {
    expect(runCli(['collect'])).toEqual({
      exitCode: 2,
      stderr: 'USAGE_ERROR: Unknown command: collect.\n',
      stdout: '',
    });
  });
});
