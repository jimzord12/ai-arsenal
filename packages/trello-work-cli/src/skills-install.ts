import { spawn } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { WorkCliError } from './errors';

export const MANAGED_SKILL_NAMES = [
  'trello-work-orchestrator',
  'trello-work-design',
  'trello-work-deliver',
  'trello-work-recover',
] as const;

const CANONICAL_PROTOCOL_LINK =
  '../../../packages/trello-work-cli/assets/agent-workflow-protocol.md';
const INSTALLED_PROTOCOL_LINK = 'references/agent-workflow-protocol.md';

export type SkillInstallAction = {
  action: 'installed' | 'replaced';
  name: (typeof MANAGED_SKILL_NAMES)[number];
  target: string;
};

export type SkillsInstallResult = {
  dryRun: boolean;
  repositoryRoot: string;
  skills: SkillInstallAction[];
};

export type SkillsInstallOptions = {
  assetsRoot?: string;
  beforeReplace?: (name: string, index: number) => Promise<void>;
  beforeRestore?: (name: string) => Promise<void>;
  cwd: string;
  dryRun: boolean;
  validateSkill?: (skillRoot: string) => Promise<void>;
};

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false;
    }
    throw error;
  }
}

function withoutEnvironmentPrefixes(
  environment: NodeJS.ProcessEnv,
  prefixes: string[],
): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(environment).filter(
      ([key]) =>
        !prefixes.some((prefix) => key.toUpperCase().startsWith(prefix)),
    ),
  );
}

function gitEnvironment(): NodeJS.ProcessEnv {
  return withoutEnvironmentPrefixes(process.env, ['GIT_']);
}

export async function findRepositoryRoot(cwd: string): Promise<string> {
  let canonicalCwd: string;
  try {
    canonicalCwd = await realpath(resolve(cwd));
  } catch {
    throw new WorkCliError(
      'SKILLS_REPOSITORY_NOT_FOUND',
      'No valid Git repository top level was found from the current directory.',
    );
  }
  return new Promise((resolveRoot, rejectRoot) => {
    const child = spawn(
      'git',
      ['-C', resolve(cwd), 'rev-parse', '--show-toplevel'],
      {
        env: gitEnvironment(),
        shell: false,
        windowsHide: true,
      },
    );
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.once('error', () => {
      rejectRoot(
        new WorkCliError(
          'SKILLS_REPOSITORY_NOT_FOUND',
          'No valid Git repository top level was found from the current directory.',
        ),
      );
    });
    child.once('close', async (code) => {
      const topLevel = stdout.trim();
      if (code === 0 && topLevel) {
        try {
          const canonicalTopLevel = await realpath(resolve(topLevel));
          const fromTopLevel = relative(canonicalTopLevel, canonicalCwd);
          if (
            fromTopLevel === '' ||
            (!isAbsolute(fromTopLevel) &&
              fromTopLevel !== '..' &&
              !fromTopLevel.startsWith(`..${sep}`))
          ) {
            resolveRoot(canonicalTopLevel);
            return;
          }
        } catch {
          // Use the stable discovery failure below.
        }
      }
      rejectRoot(
        new WorkCliError(
          'SKILLS_REPOSITORY_NOT_FOUND',
          'No valid Git repository top level was found from the current directory.',
        ),
      );
    });
  });
}

async function rejectRedirectedPath(path: string): Promise<void> {
  try {
    const entry = await lstat(path);
    if (entry.isSymbolicLink()) {
      throw new WorkCliError(
        'SKILLS_PATH_REDIRECTED',
        `Managed skills path must not contain a symbolic link or junction: ${path}`,
      );
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }
    throw error;
  }
}

async function assertSafeSkillsPath(repositoryRoot: string): Promise<void> {
  const agentsRoot = join(repositoryRoot, '.agents');
  const skillsRoot = join(agentsRoot, 'skills');
  await rejectRedirectedPath(agentsRoot);
  await rejectRedirectedPath(skillsRoot);
  for (const name of MANAGED_SKILL_NAMES) {
    await rejectRedirectedPath(join(skillsRoot, name));
  }
}

async function validatePreparedSkill(
  name: (typeof MANAGED_SKILL_NAMES)[number],
  skillRoot: string,
): Promise<void> {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  const protocol = await readFile(
    join(skillRoot, 'references', 'agent-workflow-protocol.md'),
    'utf8',
  );
  const marker = JSON.parse(
    await readFile(join(skillRoot, '.jz-trello-flow-managed.json'), 'utf8'),
  ) as Record<string, unknown>;
  const headerEnd = skill.indexOf('\n---', 4);
  const header = headerEnd >= 0 ? skill.slice(4, headerEnd) : '';
  const names = header.match(/^name:\s*(.+)$/gm) ?? [];
  const descriptions = header.match(/^description:\s*(.+)$/gm) ?? [];
  if (
    !skill.startsWith('---\n') ||
    names.length !== 1 ||
    names[0] !== `name: ${name}` ||
    descriptions.length !== 1 ||
    !protocol.trim() ||
    skill.split(INSTALLED_PROTOCOL_LINK).length !== 2 ||
    marker.managedBy !== 'jz-trello-flow' ||
    marker.replaceable !== true ||
    marker.skill !== name ||
    marker.version !== 1
  ) {
    throw new WorkCliError(
      'SKILLS_PAYLOAD_INVALID',
      `Bundled ${name} failed self-contained structural validation.`,
    );
  }
}

export async function prepareSkillsPayload(
  assetsRoot: string,
  validateSkill?: (skillRoot: string) => Promise<void>,
): Promise<string> {
  const stageRoot = await mkdtemp(join(tmpdir(), 'jz-trello-flow-skills-'));
  try {
    const protocol = await readFile(
      join(assetsRoot, 'agent-workflow-protocol.md'),
      'utf8',
    );
    for (const name of MANAGED_SKILL_NAMES) {
      const source = await readFile(join(assetsRoot, name, 'SKILL.md'), 'utf8');
      const first = source.indexOf(CANONICAL_PROTOCOL_LINK);
      if (
        first < 0 ||
        source.indexOf(CANONICAL_PROTOCOL_LINK, first + 1) >= 0
      ) {
        throw new WorkCliError(
          'SKILLS_PAYLOAD_INVALID',
          `Bundled ${name}/SKILL.md must contain exactly one canonical protocol link.`,
        );
      }
      const skillRoot = join(stageRoot, name);
      await mkdir(join(skillRoot, 'references'), { recursive: true });
      await writeFile(
        join(skillRoot, 'SKILL.md'),
        source.replace(CANONICAL_PROTOCOL_LINK, INSTALLED_PROTOCOL_LINK),
      );
      await writeFile(
        join(skillRoot, 'references', 'agent-workflow-protocol.md'),
        protocol,
      );
      await writeFile(
        join(skillRoot, '.jz-trello-flow-managed.json'),
        `${JSON.stringify({
          managedBy: 'jz-trello-flow',
          replaceable: true,
          skill: name,
          version: 1,
        })}\n`,
      );
    }
    for (const name of MANAGED_SKILL_NAMES) {
      const skillRoot = join(stageRoot, name);
      await validatePreparedSkill(name, skillRoot);
      await validateSkill?.(skillRoot);
    }
    return stageRoot;
  } catch (error) {
    await rm(stageRoot, { force: true, recursive: true });
    if (error instanceof WorkCliError) throw error;
    throw new WorkCliError(
      'SKILLS_PAYLOAD_INVALID',
      `Bundled skill payload is missing or malformed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function installSkills(
  options: SkillsInstallOptions,
): Promise<SkillsInstallResult> {
  const repositoryRoot = await findRepositoryRoot(options.cwd);
  const assetsRoot =
    options.assetsRoot ??
    resolve(dirname(process.argv[1] ?? ''), '..', 'assets', 'agent-skills');
  const stageRoot = await prepareSkillsPayload(
    assetsRoot,
    options.validateSkill,
  );
  try {
    const skillsRoot = join(repositoryRoot, '.agents', 'skills');
    await assertSafeSkillsPath(repositoryRoot);
    const skills: SkillInstallAction[] = [];
    for (const name of MANAGED_SKILL_NAMES) {
      const target = join(skillsRoot, name);
      skills.push({
        action: (await exists(target)) ? 'replaced' : 'installed',
        name,
        target,
      });
    }
    if (options.dryRun) {
      return { dryRun: true, repositoryRoot, skills };
    }

    await mkdir(skillsRoot, { recursive: true });
    const transactionRoot = await mkdtemp(
      join(skillsRoot, '.jz-trello-flow-transaction-'),
    );
    const incomingRoot = join(transactionRoot, 'incoming');
    const backupRoot = join(transactionRoot, 'backup');
    const mutated: Array<{ hadBackup: boolean; name: string }> = [];
    let preserveTransaction = false;
    try {
      await mkdir(incomingRoot, { recursive: true });
      await mkdir(backupRoot, { recursive: true });
      for (const name of MANAGED_SKILL_NAMES) {
        await cp(join(stageRoot, name), join(incomingRoot, name), {
          recursive: true,
        });
      }
      for (const [index, name] of MANAGED_SKILL_NAMES.entries()) {
        await options.beforeReplace?.(name, index);
        const target = join(skillsRoot, name);
        const backup = join(backupRoot, name);
        const hadBackup = await exists(target);
        if (hadBackup) await rename(target, backup);
        mutated.push({ hadBackup, name });
        await rename(join(incomingRoot, name), target);
      }
    } catch (error) {
      const restorationFailures: string[] = [];
      for (const { hadBackup, name } of mutated.reverse()) {
        try {
          await options.beforeRestore?.(name);
          const target = join(skillsRoot, name);
          const backup = join(backupRoot, name);
          const displaced = join(incomingRoot, `${name}.failed-install`);
          if (await exists(target)) await rename(target, displaced);
          if (hadBackup) await rename(backup, target);
        } catch (restoreError) {
          restorationFailures.push(
            `${name}: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`,
          );
        }
      }
      if (restorationFailures.length > 0) {
        preserveTransaction = true;
        throw new WorkCliError(
          'SKILLS_RECOVERY_REQUIRED',
          `Managed skill replacement and restoration failed (${restorationFailures.join('; ')}). Recovery data preserved at: ${transactionRoot}`,
        );
      }
      throw new WorkCliError(
        'SKILLS_INSTALL_FAILED',
        `Managed skill replacement failed and prior targets were restored: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      if (!preserveTransaction) {
        await rm(transactionRoot, { force: true, recursive: true });
      }
    }
    return { dryRun: false, repositoryRoot, skills };
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }
}
