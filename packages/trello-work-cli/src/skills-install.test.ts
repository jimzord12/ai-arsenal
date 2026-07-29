import { execFileSync } from 'node:child_process';
import {
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  installSkills,
  MANAGED_SKILL_NAMES,
  type SkillsInstallOptions,
} from './skills-install';

async function createPayload(root: string): Promise<string> {
  const assetsRoot = join(root, 'assets');
  await mkdir(assetsRoot, { recursive: true });
  await writeFile(
    join(assetsRoot, 'agent-workflow-protocol.md'),
    '# Protocol\n',
  );
  for (const name of MANAGED_SKILL_NAMES) {
    const skillRoot = join(assetsRoot, name);
    await mkdir(skillRoot, { recursive: true });
    await writeFile(
      join(skillRoot, 'SKILL.md'),
      [
        '---',
        `name: ${name}`,
        `description: ${name} test skill`,
        '---',
        '',
        '# Test skill',
        '',
        'See [`protocol`](../../../packages/trello-work-cli/assets/agent-workflow-protocol.md).',
        '',
      ].join('\n'),
    );
  }
  return assetsRoot;
}

describe('skills install', () => {
  it('ignores inherited Git repository selectors when discovering the cwd repository', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-git-env-'));
    const repositoryRoot = join(temporaryRoot, 'consumer');
    const nested = join(repositoryRoot, 'packages', 'app');
    const selectedElsewhere = join(temporaryRoot, 'selected-elsewhere');
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    execFileSync('git', ['init', '--quiet', selectedElsewhere]);
    await mkdir(nested, { recursive: true });
    const poisonedEnvironment = {
      ...process.env,
      GIT_DIR: join(selectedElsewhere, '.git'),
      GIT_WORK_TREE: selectedElsewhere,
    };

    try {
      expect(
        resolve(
          execFileSync('git', ['-C', nested, 'rev-parse', '--show-toplevel'], {
            encoding: 'utf8',
            env: poisonedEnvironment,
          }).trim(),
        ),
      ).toBe(resolve(await realpath(selectedElsewhere)));
      const discovered = execFileSync(
        'bun',
        [
          '-e',
          "import { findRepositoryRoot } from './src/skills-install.ts'; console.log(await findRepositoryRoot(process.env.TEST_CWD!));",
        ],
        {
          cwd: resolve(__dirname, '..'),
          encoding: 'utf8',
          env: { ...poisonedEnvironment, TEST_CWD: nested },
        },
      ).trim();
      expect(resolve(discovered)).toBe(resolve(await realpath(repositoryRoot)));
    } finally {
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });

  it('rejects an arbitrary .git entry that is not an actual Git top level', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-fake-git-'));
    const fakeRoot = join(temporaryRoot, 'fake');
    const nested = join(fakeRoot, 'nested');
    await mkdir(join(fakeRoot, '.git'), { recursive: true });
    await mkdir(nested, { recursive: true });

    await expect(
      installSkills({
        assetsRoot: await createPayload(temporaryRoot),
        cwd: nested,
        dryRun: false,
        validateSkill: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'SKILLS_REPOSITORY_NOT_FOUND' });
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('rejects .agents path redirection before installing any skill', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'jz-skills-link-escape-'),
    );
    const repositoryRoot = join(temporaryRoot, 'repo');
    const redirectedRoot = join(temporaryRoot, 'redirected');
    await mkdir(repositoryRoot, { recursive: true });
    await mkdir(redirectedRoot, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    await symlink(
      redirectedRoot,
      join(repositoryRoot, '.agents'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    await expect(
      installSkills({
        assetsRoot: await createPayload(temporaryRoot),
        cwd: repositoryRoot,
        dryRun: false,
        validateSkill: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'SKILLS_PATH_REDIRECTED' });
    await expect(lstat(redirectedRoot)).resolves.toBeDefined();
    for (const name of MANAGED_SKILL_NAMES) {
      await expect(lstat(join(redirectedRoot, 'skills', name))).rejects.toThrow(
        /ENOENT/,
      );
    }
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('rejects validator source whose Git provenance is not the official pinned commit', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'jz-skills-validator-provenance-'),
    );
    const repositoryRoot = join(temporaryRoot, 'repo');
    const validatorCheckout = join(temporaryRoot, 'validator-checkout');
    await mkdir(repositoryRoot, { recursive: true });
    await mkdir(validatorCheckout, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    execFileSync('git', ['init', '--quiet', validatorCheckout]);
    const previousCheckout = process.env.JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT;
    const previousPython = process.env.JZ_TRELLO_FLOW_SKILLS_REF_PYTHON;
    process.env.JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT = validatorCheckout;
    process.env.JZ_TRELLO_FLOW_SKILLS_REF_PYTHON = process.execPath;

    try {
      await expect(
        installSkills({
          assetsRoot: await createPayload(temporaryRoot),
          cwd: repositoryRoot,
          dryRun: false,
        }),
      ).rejects.toMatchObject({ code: 'SKILLS_VALIDATOR_PROVENANCE' });
      await expect(
        lstat(join(repositoryRoot, '.agents', 'skills')),
      ).rejects.toThrow(/ENOENT/);
    } finally {
      if (previousCheckout === undefined) {
        delete process.env.JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT;
      } else {
        process.env.JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT = previousCheckout;
      }
      if (previousPython === undefined) {
        delete process.env.JZ_TRELLO_FLOW_SKILLS_REF_PYTHON;
      } else {
        process.env.JZ_TRELLO_FLOW_SKILLS_REF_PYTHON = previousPython;
      }
      await rm(temporaryRoot, { force: true, recursive: true });
    }
  });

  it('discovers a nested repository and installs all four managed skills', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-install-'));
    const repositoryRoot = join(temporaryRoot, 'consumer repo Ω');
    const nested = join(repositoryRoot, 'packages', 'app');
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    await mkdir(nested, { recursive: true });
    const assetsRoot = await createPayload(temporaryRoot);
    const validated: string[] = [];

    const result = await installSkills({
      assetsRoot,
      cwd: nested,
      dryRun: false,
      validateSkill: async (skillRoot) => {
        validated.push(skillRoot);
      },
    });

    const canonicalRoot = await realpath(repositoryRoot);
    expect(result.repositoryRoot).toBe(canonicalRoot);
    expect(result.skills).toEqual(
      MANAGED_SKILL_NAMES.map((name) => ({
        action: 'installed',
        name,
        target: join(canonicalRoot, '.agents', 'skills', name),
      })),
    );
    expect(validated).toHaveLength(4);
    for (const name of MANAGED_SKILL_NAMES) {
      const installedRoot = join(repositoryRoot, '.agents', 'skills', name);
      await expect(
        readFile(join(installedRoot, 'SKILL.md'), 'utf8'),
      ).resolves.toContain('references/agent-workflow-protocol.md');
      await expect(
        readFile(
          join(installedRoot, 'references', 'agent-workflow-protocol.md'),
          'utf8',
        ),
      ).resolves.toBe('# Protocol\n');
      await expect(
        readFile(join(installedRoot, '.jz-trello-flow-managed.json'), 'utf8'),
      ).resolves.toContain('jz-trello-flow');
    }
  });

  it('fails clearly when no repository root exists', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-no-repo-'));
    await expect(
      installSkills({
        assetsRoot: join(temporaryRoot, 'missing-assets'),
        cwd: temporaryRoot,
        dryRun: false,
        validateSkill: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'SKILLS_REPOSITORY_NOT_FOUND' });
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('dry-runs, replaces modified targets repeatedly, and preserves unrelated skills', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-repeat-'));
    const repositoryRoot = join(temporaryRoot, 'repo');
    const skillsRoot = join(repositoryRoot, '.agents', 'skills');
    const unrelated = join(skillsRoot, 'personal-skill', 'notes.txt');
    await mkdir(repositoryRoot, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    await mkdir(join(skillsRoot, 'trello-work-orchestrator'), {
      recursive: true,
    });
    await writeFile(
      join(skillsRoot, 'trello-work-orchestrator', 'SKILL.md'),
      'locally modified\n',
    );
    await mkdir(join(skillsRoot, 'personal-skill'), { recursive: true });
    await writeFile(unrelated, 'preserve me\n');
    const assetsRoot = await createPayload(temporaryRoot);
    const options = {
      assetsRoot,
      cwd: repositoryRoot,
      validateSkill: async () => undefined,
    };

    const planned = await installSkills({ ...options, dryRun: true });
    expect(planned.skills.map(({ action }) => action)).toEqual([
      'replaced',
      'installed',
      'installed',
      'installed',
    ]);
    await expect(
      readFile(
        join(skillsRoot, 'trello-work-orchestrator', 'SKILL.md'),
        'utf8',
      ),
    ).resolves.toBe('locally modified\n');

    await installSkills({ ...options, dryRun: false });
    await writeFile(
      join(skillsRoot, 'trello-work-deliver', 'SKILL.md'),
      'second local modification\n',
    );
    const repeated = await installSkills({ ...options, dryRun: false });

    expect(repeated.skills.every(({ action }) => action === 'replaced')).toBe(
      true,
    );
    await expect(readFile(unrelated, 'utf8')).resolves.toBe('preserve me\n');
    await expect(
      readFile(join(skillsRoot, 'trello-work-deliver', 'SKILL.md'), 'utf8'),
    ).resolves.toContain('references/agent-workflow-protocol.md');
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('leaves every target unchanged when complete-payload validation fails', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-invalid-'));
    const repositoryRoot = join(temporaryRoot, 'repo');
    const skillsRoot = join(repositoryRoot, '.agents', 'skills');
    await mkdir(repositoryRoot, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    const before = new Map<string, string>();
    for (const name of MANAGED_SKILL_NAMES) {
      const content = `existing ${name}\n`;
      before.set(name, content);
      await mkdir(join(skillsRoot, name), { recursive: true });
      await writeFile(join(skillsRoot, name, 'SKILL.md'), content);
    }
    const assetsRoot = await createPayload(temporaryRoot);
    let calls = 0;

    await expect(
      installSkills({
        assetsRoot,
        cwd: repositoryRoot,
        dryRun: false,
        validateSkill: async () => {
          calls += 1;
          if (calls === 3) throw new Error('invalid staged skill');
        },
      }),
    ).rejects.toThrow('invalid staged skill');

    for (const name of MANAGED_SKILL_NAMES) {
      await expect(
        readFile(join(skillsRoot, name, 'SKILL.md'), 'utf8'),
      ).resolves.toBe(before.get(name));
    }
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('restores prior targets when a later replacement step fails', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'jz-skills-rollback-'));
    const repositoryRoot = join(temporaryRoot, 'repo');
    const skillsRoot = join(repositoryRoot, '.agents', 'skills');
    await mkdir(repositoryRoot, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    const before = new Map<string, string>();
    for (const name of MANAGED_SKILL_NAMES) {
      const content = `existing ${name}\n`;
      before.set(name, content);
      await mkdir(join(skillsRoot, name), { recursive: true });
      await writeFile(join(skillsRoot, name, 'SKILL.md'), content);
    }

    await expect(
      installSkills({
        assetsRoot: await createPayload(temporaryRoot),
        beforeReplace: async (_name, index) => {
          if (index === 1) throw new Error('injected replacement failure');
        },
        cwd: repositoryRoot,
        dryRun: false,
        validateSkill: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: 'SKILLS_INSTALL_FAILED' });

    for (const name of MANAGED_SKILL_NAMES) {
      await expect(
        readFile(join(skillsRoot, name, 'SKILL.md'), 'utf8'),
      ).resolves.toBe(before.get(name));
    }
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('preserves the transaction backup and reports its exact path when restoration fails', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'jz-skills-recovery-required-'),
    );
    const repositoryRoot = join(temporaryRoot, 'repo');
    const skillsRoot = join(repositoryRoot, '.agents', 'skills');
    await mkdir(repositoryRoot, { recursive: true });
    execFileSync('git', ['init', '--quiet', repositoryRoot]);
    for (const name of MANAGED_SKILL_NAMES) {
      await mkdir(join(skillsRoot, name), { recursive: true });
      await writeFile(join(skillsRoot, name, 'SKILL.md'), `existing ${name}\n`);
    }
    const options: SkillsInstallOptions & {
      beforeRestore: (name: string) => Promise<void>;
    } = {
      assetsRoot: await createPayload(temporaryRoot),
      beforeReplace: async (_name, index) => {
        if (index === 1) throw new Error('injected replacement failure');
      },
      beforeRestore: async (name) => {
        if (name === MANAGED_SKILL_NAMES[0]) {
          throw new Error('injected restoration failure');
        }
      },
      cwd: repositoryRoot,
      dryRun: false,
      validateSkill: async () => undefined,
    };

    let caught: unknown;
    try {
      await installSkills(options);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: 'SKILLS_RECOVERY_REQUIRED' });
    const recoveryPath = (caught as Error).message.match(
      /Recovery data preserved at: (.+)$/,
    )?.[1];
    expect(recoveryPath).toBeDefined();
    await expect(lstat(recoveryPath as string)).resolves.toBeDefined();
    await expect(
      readFile(
        join(
          recoveryPath as string,
          'backup',
          MANAGED_SKILL_NAMES[0],
          'SKILL.md',
        ),
        'utf8',
      ),
    ).resolves.toBe(`existing ${MANAGED_SKILL_NAMES[0]}\n`);
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('bundles byte-equal canonical skill and protocol sources', async () => {
    const packageRoot = resolve(__dirname, '..');
    const repositoryRoot = resolve(packageRoot, '..', '..');
    for (const name of MANAGED_SKILL_NAMES) {
      await expect(
        readFile(join(packageRoot, 'assets', 'agent-skills', name, 'SKILL.md')),
      ).resolves.toEqual(
        await readFile(
          join(repositoryRoot, '.agents', 'skills', name, 'SKILL.md'),
        ),
      );
    }
    await expect(
      readFile(
        join(
          packageRoot,
          'assets',
          'agent-skills',
          'agent-workflow-protocol.md',
        ),
      ),
    ).resolves.toEqual(
      await readFile(join(packageRoot, 'assets', 'agent-workflow-protocol.md')),
    );
  });
});
