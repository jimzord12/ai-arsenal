import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const packageRoot = resolve(__dirname, '..');
const binPath = resolve(packageRoot, 'dist', 'bin.js');

it('runs help through the compiled Node.js process', () => {
  const result = spawnSync(process.execPath, [binPath, '--help'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });

  expect(result).toMatchObject({
    status: 0,
    stderr: '',
  });
  expect(result.stdout).toContain('weekly-report-cli');
  expect(result.stdout).toContain(
    'Evidence collection commands are not available in this foundation release.',
  );
});

it('keeps stdout and stderr separated for version and usage results', () => {
  const version = spawnSync(process.execPath, [binPath, '--version'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  expect(version).toMatchObject({
    status: 0,
    stderr: '',
    stdout: 'weekly-report-cli 0.0.0\n',
  });

  const unknown = spawnSync(process.execPath, [binPath, 'collect'], {
    cwd: packageRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  expect(unknown).toMatchObject({
    status: 2,
    stderr: 'USAGE_ERROR: Unknown command: collect.\n',
    stdout: '',
  });
});
