import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const packageRoot = resolve(__dirname, '..');
const canonicalProtocolLink =
  '../../../packages/trello-work-cli/assets/agent-workflow-protocol.md';
const installedProtocolLink = 'references/agent-workflow-protocol.md';
const managedNames = [
  'trello-work-orchestrator',
  'trello-work-design',
  'trello-work-deliver',
  'trello-work-recover',
];

function runPnpm(args: string[], cwd: string): void {
  if (process.platform === 'win32') {
    execFileSync(
      process.env.ComSpec ?? 'cmd.exe',
      [
        '/d',
        '/s',
        '/c',
        `pnpm ${args.map((value) => (value.includes(' ') ? quote(value) : value)).join(' ')}`,
      ],
      { cwd, stdio: 'pipe' },
    );
    return;
  }
  execFileSync('pnpm', args, { cwd, stdio: 'pipe' });
}

function quote(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function runInstalled(
  shim: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): { status: number | null; stderr: string; stdout: string } {
  const env = { ...process.env };
  delete env.JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT;
  delete env.JZ_TRELLO_FLOW_SKILLS_REF_PYTHON;
  Object.assign(env, extraEnv);
  const result =
    process.platform === 'win32'
      ? spawnSync(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/s', '/c', `call ${shim} ${args.join(' ')}`],
          { cwd, encoding: 'utf8', env, windowsHide: true },
        )
      : spawnSync(shim, args, {
          cwd,
          encoding: 'utf8',
          env,
          windowsHide: true,
        });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}

describe('packed skills installer', () => {
  it('packs the actual tarball and installs through its generated shim without validator provenance', () => {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), 'jz-trello-flow-packed-required-'),
    );
    try {
      const packRoot = join(temporaryRoot, 'packed');
      const consumerRoot = join(temporaryRoot, 'consumer');
      const repositoryRoot = join(temporaryRoot, 'repository');
      mkdirSync(packRoot, { recursive: true });
      mkdirSync(consumerRoot, { recursive: true });
      mkdirSync(repositoryRoot, { recursive: true });
      execFileSync('git', ['init', '--quiet', repositoryRoot]);
      writeFileSync(
        join(consumerRoot, 'package.json'),
        '{"name":"skills-consumer-required","private":true}\n',
      );

      runPnpm(['pack', '--pack-destination', packRoot], packageRoot);
      const tarball = join(
        packRoot,
        readdirSync(packRoot).find((name) => name.endsWith('.tgz')) as string,
      );
      runPnpm(['add', tarball], consumerRoot);
      const shim = join(
        consumerRoot,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'jz-trello-flow.CMD' : 'jz-trello-flow',
      );
      const dryRun = runInstalled(
        shim,
        ['skills', 'install', '--dry-run', '--output', 'json'],
        repositoryRoot,
      );
      expect(dryRun).toMatchObject({ status: 0, stderr: '' });
      expect(JSON.parse(dryRun.stdout).skills).toHaveLength(4);
      expect(
        readdirSync(repositoryRoot).filter((name) => name === '.agents'),
      ).toEqual([]);

      const installed = runInstalled(
        shim,
        ['skills', 'install', '--output', 'json'],
        repositoryRoot,
      );
      expect(installed).toMatchObject({ status: 0, stderr: '' });
      expect(JSON.parse(installed.stdout).skills).toHaveLength(4);
    } finally {
      rmSync(temporaryRoot, { force: true, recursive: true });
    }
  }, 120_000);

  it('installs the actual tarball and invokes its generated shim in a disposable repository', () => {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), 'jz-trello-flow-packed-skills-'),
    );
    try {
      const packRoot = join(temporaryRoot, 'packed');
      const consumerRoot = join(temporaryRoot, 'consumer');
      const repositoryRoot = join(temporaryRoot, 'repository with spaces Ω');
      const nested = join(repositoryRoot, 'packages', 'nested');
      mkdirSync(packRoot, { recursive: true });
      mkdirSync(consumerRoot, { recursive: true });
      mkdirSync(nested, { recursive: true });
      execFileSync('git', ['init', '--quiet', repositoryRoot]);
      writeFileSync(
        join(consumerRoot, 'package.json'),
        '{"name":"skills-consumer","private":true}\n',
      );

      runPnpm(['pack', '--pack-destination', packRoot], packageRoot);
      const tarball = join(
        packRoot,
        readdirSync(packRoot).find((name) => name.endsWith('.tgz')) as string,
      );
      runPnpm(['add', tarball], consumerRoot);
      const shim = join(
        consumerRoot,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'jz-trello-flow.CMD' : 'jz-trello-flow',
      );

      const unrelated = join(
        repositoryRoot,
        '.agents',
        'skills',
        'personal-skill',
        'notes.txt',
      );
      mkdirSync(dirname(unrelated), { recursive: true });
      writeFileSync(unrelated, 'preserve me\n');
      const pythonShadowRoot = join(temporaryRoot, 'python-shadow');
      const pythonShadowMarker = join(temporaryRoot, 'python-shadow-loaded');
      mkdirSync(join(pythonShadowRoot, 'skills_ref'), { recursive: true });
      writeFileSync(
        join(pythonShadowRoot, 'sitecustomize.py'),
        `from pathlib import Path\nimport sys\nPath(${JSON.stringify(pythonShadowMarker)}).write_text('sitecustomize loaded')\nsys.path.insert(0, ${JSON.stringify(pythonShadowRoot)})\n`,
      );
      writeFileSync(join(pythonShadowRoot, 'skills_ref', '__init__.py'), '');
      writeFileSync(
        join(pythonShadowRoot, 'skills_ref', 'cli.py'),
        "raise RuntimeError('consumer skills_ref shadow loaded')\n",
      );
      const adversarialPythonEnv = {
        JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT: join(
          temporaryRoot,
          'missing-validator-checkout',
        ),
        JZ_TRELLO_FLOW_SKILLS_REF_PYTHON: join(temporaryRoot, 'missing-python'),
        PYTHONPATH: pythonShadowRoot,
      };

      const dryRun = runInstalled(
        shim,
        ['skills', 'install', '--dry-run', '--output', 'json'],
        nested,
        adversarialPythonEnv,
      );
      expect(dryRun).toMatchObject({ status: 0, stderr: '' });
      expect(JSON.parse(dryRun.stdout).skills).toHaveLength(4);
      expect(readdirSync(join(repositoryRoot, '.agents', 'skills'))).toEqual([
        'personal-skill',
      ]);

      const installed = runInstalled(
        shim,
        ['skills', 'install', '--output', 'json'],
        nested,
        adversarialPythonEnv,
      );
      expect(installed).toMatchObject({ status: 0, stderr: '' });
      expect(
        JSON.parse(installed.stdout).skills.map(
          ({ action }: { action: string }) => action,
        ),
      ).toEqual(['installed', 'installed', 'installed', 'installed']);

      const repeated = runInstalled(
        shim,
        ['skills', 'install', '--output', 'json'],
        nested,
        adversarialPythonEnv,
      );
      expect(repeated).toMatchObject({ status: 0, stderr: '' });
      expect(
        JSON.parse(repeated.stdout).skills.map(
          ({ action }: { action: string }) => action,
        ),
      ).toEqual(['replaced', 'replaced', 'replaced', 'replaced']);
      expect(readFileSync(unrelated, 'utf8')).toBe('preserve me\n');
      expect(() => readFileSync(pythonShadowMarker, 'utf8')).toThrow();
      const packedPayload = join(
        consumerRoot,
        'node_modules',
        '@jz',
        'ai-arsenal-trello-work-cli',
        'assets',
        'agent-skills',
      );
      const expectedProtocol = readFileSync(
        join(packedPayload, 'agent-workflow-protocol.md'),
      );
      expect(
        readdirSync(join(repositoryRoot, '.agents', 'skills')).sort(),
      ).toEqual([...managedNames, 'personal-skill'].sort());
      for (const name of managedNames) {
        const installedRoot = join(repositoryRoot, '.agents', 'skills', name);
        expect(readdirSync(installedRoot).sort()).toEqual(
          ['.jz-trello-flow-managed.json', 'SKILL.md', 'references'].sort(),
        );
        expect(readFileSync(join(installedRoot, 'SKILL.md'), 'utf8')).toBe(
          readFileSync(join(packedPayload, name, 'SKILL.md'), 'utf8').replace(
            canonicalProtocolLink,
            installedProtocolLink,
          ),
        );
        expect(
          readFileSync(
            join(installedRoot, 'references', 'agent-workflow-protocol.md'),
          ),
        ).toEqual(expectedProtocol);
        expect(
          readFileSync(
            join(installedRoot, '.jz-trello-flow-managed.json'),
            'utf8',
          ),
        ).toBe(
          `${JSON.stringify({ managedBy: 'jz-trello-flow', replaceable: true, skill: name, version: 1 })}\n`,
        );
      }
    } finally {
      rmSync(temporaryRoot, { force: true, recursive: true });
    }
  }, 120_000);
});
