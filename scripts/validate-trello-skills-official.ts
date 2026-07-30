#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import { realpath, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MANAGED_SKILL_NAMES,
  prepareSkillsPayload,
} from '../packages/trello-work-cli/src/skills-install';

const PINNED_COMMIT = '38a2ff82958afee88dadf4831509e6f7e9d8ef4e';

function parseArgs(argv: string[]): {
  checkout: string;
  payloadRoot: string;
  python: string;
} {
  const allowed = new Set(['checkout', 'payload-root', 'python']);
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`invalid argument: ${key ?? '<missing>'}`);
    }
    const name = key.slice(2);
    if (!allowed.has(name) || values.has(name)) {
      throw new Error(`invalid argument: ${key}`);
    }
    values.set(name, value);
  }
  const checkout = values.get('checkout');
  const python = values.get('python');
  if (!checkout || !python) {
    throw new Error(
      'required arguments: --checkout <pinned agentskills checkout> --python <python executable>',
    );
  }
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  return {
    checkout,
    payloadRoot:
      values.get('payload-root') ??
      join(
        repositoryRoot,
        'packages',
        'trello-work-cli',
        'assets',
        'agent-skills',
      ),
    python,
  };
}

function cleanEnvironment(
  environment: NodeJS.ProcessEnv,
  blockedPrefixes: string[],
): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(environment).filter(
      ([key]) =>
        !blockedPrefixes.some((prefix) =>
          key.toUpperCase().startsWith(prefix.toUpperCase()),
        ),
    ),
  );
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<string> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      env,
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', rejectRun);
    child.once('close', (code) => {
      if (code === 0) resolveRun(stdout);
      else rejectRun(new Error(stderr.trim() || `${command} exited ${code}`));
    });
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const gitEnv = cleanEnvironment(process.env, ['GIT_']);
  const pythonEnv = cleanEnvironment(process.env, [
    'PYTHONPATH',
    'PYTHONHOME',
    'PYTHONUSERBASE',
    'PYTHONSAFEPATH',
    'PYTHONNOUSERSITE',
    'PYTHONSTARTUP',
    'PYTHONINSPECT',
    'PYTHONCASEOK',
    'PYTHONPLATLIBDIR',
    'PYTHONEXECUTABLE',
    '__PYVENV_LAUNCHER__',
  ]);

  let checkoutRoot: string;
  try {
    checkoutRoot = await realpath(options.checkout);
    const topLevel = (
      await run(
        'git',
        ['-C', checkoutRoot, 'rev-parse', '--show-toplevel'],
        gitEnv,
      )
    ).trim();
    const canonicalTopLevel = await realpath(topLevel);
    const commit = (
      await run('git', ['-C', checkoutRoot, 'rev-parse', 'HEAD'], gitEnv)
    ).trim();
    const changes = (
      await run(
        'git',
        [
          '-C',
          checkoutRoot,
          'status',
          '--porcelain',
          '--untracked-files=all',
          '--',
          'skills-ref',
        ],
        gitEnv,
      )
    ).trim();
    if (
      canonicalTopLevel !== checkoutRoot ||
      commit !== PINNED_COMMIT ||
      changes
    ) {
      throw new Error(
        `expected clean Git top level at ${PINNED_COMMIT}; observed ${canonicalTopLevel} at ${commit}${changes ? ' with modified or untracked skills-ref source' : ''}`,
      );
    }
  } catch (error) {
    throw new Error(
      `SKILLS_VALIDATOR_PROVENANCE: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const stageRoot = await prepareSkillsPayload(options.payloadRoot);
  try {
    const sourceRoot = join(checkoutRoot, 'skills-ref', 'src');
    for (const name of MANAGED_SKILL_NAMES) {
      await run(
        options.python,
        [
          '-I',
          '-X',
          'utf8',
          '-c',
          'import sys; sys.path.insert(0, sys.argv.pop(1)); from skills_ref.cli import main; main()',
          sourceRoot,
          'validate',
          join(stageRoot, name),
        ],
        pythonEnv,
      );
    }
  } catch (error) {
    throw new Error(
      `SKILLS_PAYLOAD_INVALID: official pinned skills-ref validation failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }

  console.log(
    `Official skills-ref validation passed for ${MANAGED_SKILL_NAMES.length} transformed bundled skills at ${PINNED_COMMIT}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
