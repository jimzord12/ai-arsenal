import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const workItemPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseArguments(argv) {
  let workItem = null;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      if (json) throw new Error('Duplicate argument: --json');
      json = true;
      continue;
    }
    if (argument === '--work-item') {
      if (workItem !== null) throw new Error('Duplicate argument: --work-item');
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--work-item requires a value');
      }
      workItem = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!workItem || !workItemPattern.test(workItem)) {
    throw new Error('Work-item ID must match YYYY-MM-DD-lowercase-kebab-slug');
  }
  return { workItem, json };
}

function runGit(repositoryRoot, arguments_) {
  const result = spawnSync('git', arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim();
    throw new Error(`Git ${arguments_.join(' ')} failed: ${detail}`);
  }
  return result.stdout.trim();
}

function gitRefExists(repositoryRoot, ref) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', ref], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    const detail = result.error?.message ?? result.stderr.trim();
    throw new Error(`Git show-ref --verify ${ref} failed: ${detail}`);
  }
  return result.status === 0;
}

function samePath(first, second) {
  const normalize = (value) => {
    const normalized = path.normalize(path.resolve(value));
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  };
  return normalize(first) === normalize(second);
}

function lstatExists(target) {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function registeredWorktrees(repositoryRoot) {
  const output = runGit(repositoryRoot, ['worktree', 'list', '--porcelain']);
  const entries = [];
  let current = null;

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      if (current) entries.push(current);
      current = { path: line.slice('worktree '.length), branch: null };
      continue;
    }
    if (line.startsWith('branch ') && current) {
      current.branch = line.slice('branch '.length);
    }
  }
  if (current) entries.push(current);
  return entries;
}

function requireCleanBaseCheckout(repositoryRoot) {
  const baseRoot = fs.realpathSync(
    path.resolve(runGit(repositoryRoot, ['rev-parse', '--show-toplevel'])),
  );
  const gitDirectory = path.resolve(
    baseRoot,
    runGit(repositoryRoot, ['rev-parse', '--git-dir']),
  );
  const commonGitDirectory = path.resolve(
    baseRoot,
    runGit(repositoryRoot, ['rev-parse', '--git-common-dir']),
  );
  if (!samePath(gitDirectory, commonGitDirectory)) {
    throw new Error(
      'Definition must run from the non-work base checkout, not a linked worktree',
    );
  }

  const branch = runGit(repositoryRoot, [
    'symbolic-ref',
    '--quiet',
    '--short',
    'HEAD',
  ]);
  if (branch.startsWith('work/')) {
    throw new Error(
      'Definition must run from a non-work base branch, not a work/<work-item-id> branch',
    );
  }

  const status = runGit(repositoryRoot, [
    '-c',
    'core.quotepath=false',
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--ignore-submodules=none',
  ]);
  if (status) {
    throw new Error('Definition requires a clean base checkout');
  }
  return baseRoot;
}

function provisionWorktree(repositoryRoot, workItem) {
  const baseRoot = requireCleanBaseCheckout(repositoryRoot);
  const branch = `work/${workItem}`;
  const worktreesRoot = path.join(
    path.dirname(baseRoot),
    `${path.basename(baseRoot)}.worktrees`,
  );
  const worktree = path.join(worktreesRoot, workItem);
  const expectedBranch = `refs/heads/${branch}`;

  const parentStatus = lstatExists(worktreesRoot);
  if (parentStatus) {
    if (parentStatus.isSymbolicLink()) {
      throw new Error(
        'The deterministic worktrees directory must not be redirected',
      );
    }
    if (!parentStatus.isDirectory()) {
      throw new Error('The deterministic worktrees path is not a directory');
    }
    if (!samePath(fs.realpathSync(worktreesRoot), worktreesRoot)) {
      throw new Error(
        'The deterministic worktrees directory must not be redirected',
      );
    }
  }

  if (lstatExists(worktree)) {
    throw new Error(`Worktree path collision: ${worktree} already exists`);
  }
  if (gitRefExists(baseRoot, expectedBranch)) {
    throw new Error(`Work branch collision: ${branch} already exists`);
  }

  for (const registered of registeredWorktrees(baseRoot)) {
    if (registered.branch === expectedBranch) {
      throw new Error(
        `Work branch collision: ${branch} is already registered at ${registered.path}`,
      );
    }
    if (samePath(registered.path, worktree)) {
      throw new Error(
        `Worktree path collision: ${worktree} is already registered`,
      );
    }
  }

  runGit(baseRoot, [
    'worktree',
    'add',
    '--quiet',
    '-b',
    branch,
    worktree,
    'HEAD',
  ]);
  return { workItem, branch, worktree };
}

function main() {
  const { workItem, json } = parseArguments(process.argv.slice(2));
  const output = provisionWorktree(process.cwd(), workItem);
  if (json) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
  } else {
    process.stdout.write(`${output.worktree}\n`);
  }
}

try {
  main();
} catch (error) {
  const output = { valid: false, blocker: error.message };
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
  } else {
    process.stderr.write(`${error.message}\n`);
  }
  process.exitCode = 1;
}
