import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { calculateReviewSnapshot } from './calculate-review-snapshot.mjs';
import { reconcileReviewBatch } from './reconcile-review-batch.mjs';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const validatorPath = path.join(
  scriptsDirectory,
  'validate-monorepo-work-item.mjs',
);
const provisionerPath = path.join(
  scriptsDirectory,
  'provision-monorepo-worktree.mjs',
);
const compactTemplatePath = path.join(
  scriptsDirectory,
  '..',
  'docs',
  'workflow',
  'templates',
  'work-item',
  'work-item.md',
);
const defineSkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'define-monorepo-change',
  'SKILL.md',
);
const orchestrateSkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'orchestrate-monorepo-work',
  'SKILL.md',
);
const implementSkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'implement-monorepo-change',
  'SKILL.md',
);
const reviewSkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'review-monorepo-change',
  'SKILL.md',
);
const verifySkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'verify-monorepo-change',
  'SKILL.md',
);
const deliverSkillPath = path.join(
  scriptsDirectory,
  '..',
  '.agents',
  'skills',
  'deliver-monorepo-change',
  'SKILL.md',
);
const qualityWorkflowPath = path.join(
  scriptsDirectory,
  '..',
  '.github',
  'workflows',
  'quality.yml',
);
const agentsPath = path.join(scriptsDirectory, '..', 'AGENTS.md');
const pipelinePath = path.join(
  scriptsDirectory,
  '..',
  'docs',
  'workflow',
  'MONOREPO_WORK_ITEM_PIPELINE.md',
);
const workflowOverviewPath = path.join(
  scriptsDirectory,
  '..',
  'docs',
  'workflow',
  'WORKFLOW_OVERVIEW.md',
);
const livingValidatorPath = path.join(
  scriptsDirectory,
  'validate-living-workflow.mjs',
);
const workItemId = '2026-07-13-example';
const reviewDigest = `sha256:${'a'.repeat(64)}`;
const reviewBatch = 'review-20260731-01';
const reviewExpected = ['contract', 'quality'];
const deliveryEvidenceDefaults = {
  result: 'pending',
  artifactCommit: 'pending',
  remote: 'pending',
  ci: 'pending',
  package: 'pending',
  tarball: 'pending',
  global: 'pending',
  smoke: 'pending',
  provenance: 'pending',
  rollback: 'pending',
  clean: 'pending',
};

function matchingReviewResults(snapshot = reviewDigest, batchId = reviewBatch) {
  return reviewExpected.map((reviewer) => ({
    reviewer,
    outcome: 'passed',
    batchId,
    snapshot,
  }));
}

function qualityWorktreeSetupScript() {
  const workflow = fs.readFileSync(qualityWorkflowPath, 'utf8');
  const step = '      - name: Enter isolated active worktree\n';
  const run = '        run: |\n';
  const stepStart = workflow.indexOf(step);
  const runStart = workflow.indexOf(run, stepStart);
  const nextStep = workflow.indexOf('\n      - name:', runStart);
  assert.ok(
    stepStart >= 0 && runStart >= 0 && nextStep >= 0,
    'Quality workflow must contain the active-worktree setup',
  );
  return workflow
    .slice(runStart + run.length, nextStep)
    .replace(/^ {10}/gm, '');
}

function resolveBashForSyntaxCheck() {
  if (process.platform !== 'win32') {
    return 'bash';
  }

  const gitExecPath = spawnSync('git', ['--exec-path'], {
    encoding: 'utf8',
  });
  assert.equal(gitExecPath.status, 0, gitExecPath.stderr);
  const bashPath = path.resolve(
    gitExecPath.stdout.trim(),
    '..',
    '..',
    '..',
    'bin',
    'bash.exe',
  );
  assert.ok(fs.existsSync(bashPath), `Git Bash is missing at ${bashPath}`);
  return bashPath;
}

test('quality CI fetches delivery history and enters the active isolated worktree', () => {
  const workflow = fs.readFileSync(qualityWorkflowPath, 'utf8');
  assert.match(workflow, /uses: actions\/checkout@v6\s+with:\s+fetch-depth: 2/);
  assert.match(workflow, /git worktree add/);
  assert.match(
    workflow,
    /git checkout --detach "\$GITHUB_SHA"[\s\S]*git branch --force/,
  );
  assert.match(workflow, /QUALITY_WORKDIR/);
  assert.match(workflow, /cd "\$QUALITY_WORKDIR"/);
});

test('Quality active-worktree setup is valid Bash', () => {
  const result = spawnSync(resolveBashForSyntaxCheck(), ['-n'], {
    input: qualityWorktreeSetupScript(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
});

test('Quality setup frees an already checked-out work branch before linking it', (t) => {
  const { root, worktreesRoot } = createCleanBaseFixture(t);
  const itemDirectory = path.join(root, 'docs', 'work-items', workItemId);
  fs.mkdirSync(itemDirectory, { recursive: true });
  writeActiveState(root, workItemId, 'deliver-monorepo-change');
  fs.writeFileSync(
    path.join(itemDirectory, 'work-item.md'),
    'Worktree: isolated\n',
    'utf8',
  );
  runGit(root, ['checkout', '-b', `work/${workItemId}`]);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '--quiet', '-m', 'active fixture']);

  const script = [
    'export GITHUB_WORKSPACE="$PWD"',
    'export GITHUB_SHA="$(git rev-parse HEAD)"',
    'export GITHUB_ENV="$PWD/github-env"',
    qualityWorktreeSetupScript(),
  ].join('\n');
  const result = spawnSync(resolveBashForSyntaxCheck(), ['-c', script], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(runGit(root, ['branch', '--show-current']), '');
  assert.equal(
    runGit(path.join(worktreesRoot, workItemId), ['branch', '--show-current']),
    `work/${workItemId}`,
  );
});

function createFixture(t) {
  return createNamedFixture(t, workItemId);
}

function createNamedFixture(t, id) {
  const baseRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ai-arsenal-work-item-base-'),
  );
  const worktreesRoot = `${baseRoot}.worktrees`;
  const root = path.join(worktreesRoot, id);
  const workItemDirectory = path.join(root, 'docs', 'work-items', id);
  fs.mkdirSync(workItemDirectory, { recursive: true });
  t.after(() => {
    fs.rmSync(baseRoot, { force: true, recursive: true });
    fs.rmSync(worktreesRoot, { force: true, recursive: true });
  });
  return { root, workItemDirectory };
}

function artifact(type, prerequisites, status, body = '', revision = 1) {
  return `Work item: ${workItemId}\nArtifact: ${type}\nRevision: ${revision}\nPrerequisites: ${prerequisites}\nStatus: ${status}\n${body}`;
}

function writeArtifact(workItemDirectory, name, contents) {
  fs.writeFileSync(path.join(workItemDirectory, name), contents, 'utf8');
}

function archiveArtifact(workItemDirectory, name, contents) {
  const revision = contents.match(/^Revision: ([1-9]\d*)$/m)?.[1];
  assert.ok(revision, `${name} must have a revision before it is archived`);
  const archiveDirectory = path.join(workItemDirectory, 'revisions', name);
  fs.mkdirSync(archiveDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(archiveDirectory, `v${revision}.md`),
    contents.replace(/^Status: .+$/m, 'Status: superseded'),
    'utf8',
  );
  fs.rmSync(path.join(workItemDirectory, name));
}

function addRequest(workItemDirectory) {
  writeArtifact(
    workItemDirectory,
    'request.md',
    artifact('request', 'none', 'ready'),
  );
}

function addContext(workItemDirectory) {
  writeArtifact(
    workItemDirectory,
    'context.md',
    artifact('context', 'request@1', 'ready'),
  );
}

function addContract(
  workItemDirectory,
  dangerousOperation = 'no',
  hardPrerequisites = 'resolved',
) {
  writeArtifact(
    workItemDirectory,
    'change-contract.md',
    artifact(
      'contract',
      'request@1,context@1',
      'ready',
      `\n## Authority classification\n\nDangerous deletion or irreversible data loss: \`${dangerousOperation}\`\nHard prerequisites: \`${hardPrerequisites}\`\n`,
    ),
  );
}

function addPlan(workItemDirectory) {
  const contents = artifact('plan', 'contract@1', 'ready', '\n# Plan\n');
  writeArtifact(workItemDirectory, 'implementation-plan.md', contents);
  return contents;
}

function addApproval(
  workItemDirectory,
  planContents,
  digestOverride,
  approvedBy = 'user',
  approvalSource,
) {
  const digest =
    digestOverride ??
    createHash('sha256')
      .update(Buffer.from(planContents, 'utf8'))
      .digest('hex');
  const source =
    approvalSource ??
    (approvedBy === 'autonomous-agent'
      ? 'policy:ai-arsenal-autonomy-v1'
      : 'User approved the implementation plan.');
  writeArtifact(
    workItemDirectory,
    'approval.md',
    artifact(
      'approval',
      'plan@1',
      'approved',
      `\nApproved plan SHA-256: \`${digest}\`\nApproved by: \`${approvedBy}\`\nApproval source: \`${source}\`\n`,
    ),
  );
}

function addRevisionRequest(
  workItemDirectory,
  target,
  targetRevision = 1,
  revision = 1,
) {
  const contents = artifact(
    'revision-request',
    `${target}@${targetRevision}`,
    'ready',
    `\nRevision target: \`${target}\`\nRevision source: \`User requested a ${target} revision.\`\n`,
    revision,
  );
  writeArtifact(workItemDirectory, 'revision-request.md', contents);
  return contents;
}

function runValidator(root, arguments_ = ['--work-item', workItemId]) {
  const result = spawnSync(
    process.execPath,
    [validatorPath, ...arguments_, '--json'],
    { cwd: root, encoding: 'utf8' },
  );
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    assert.fail(
      `validator did not emit JSON\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }
  return { ...result, json };
}

function runCurrentValidator(root) {
  return runValidator(root, ['--current']);
}

function writeActiveState(root, activeWorkItem, pipelineStep) {
  fs.writeFileSync(
    path.join(root, 'NEXT.md'),
    `# NEXT\n\n**Active work item:** \`${activeWorkItem}\`\n**Pipeline step:** \`${pipelineStep}\`\n`,
    'utf8',
  );
}

function runGit(root, arguments_) {
  const result = spawnSync('git', arguments_, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function initializeGitFixture(root, workItem = workItemId) {
  if (fs.existsSync(path.join(root, '.git'))) return;
  const worktreesRoot = path.dirname(root);
  const baseRoot = path.join(
    path.dirname(worktreesRoot),
    path.basename(worktreesRoot, '.worktrees'),
  );
  for (const entry of fs.readdirSync(root)) {
    fs.cpSync(path.join(root, entry), path.join(baseRoot, entry), {
      recursive: true,
    });
  }
  fs.rmSync(root, { force: true, recursive: true });

  runGit(baseRoot, ['init', '--quiet']);
  runGit(baseRoot, ['config', 'user.name', 'Workflow Tests']);
  runGit(baseRoot, ['config', 'user.email', 'workflow-tests@example.invalid']);
  runGit(baseRoot, ['config', 'core.autocrlf', 'false']);
  runGit(baseRoot, ['add', '.']);
  runGit(baseRoot, ['commit', '--quiet', '-m', 'fixture baseline']);
  runGit(baseRoot, [
    'worktree',
    'add',
    '--quiet',
    '-b',
    `work/${workItem}`,
    root,
    'HEAD',
  ]);
}

function createCleanBaseFixture(t) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ai-arsenal-worktree-base-'),
  );
  const worktreesRoot = path.join(
    path.dirname(root),
    `${path.basename(root)}.worktrees`,
  );
  t.after(() => {
    fs.rmSync(root, { force: true, recursive: true });
    fs.rmSync(worktreesRoot, { force: true, recursive: true });
  });
  writeActiveState(root, 'none', 'none');
  runGit(root, ['init', '--quiet']);
  runGit(root, ['config', 'user.name', 'Workflow Tests']);
  runGit(root, ['config', 'user.email', 'workflow-tests@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '--quiet', '-m', 'fixture baseline']);
  return { root, worktreesRoot };
}

function runProvisioner(root, workItem = workItemId) {
  const result = spawnSync(
    process.execPath,
    [provisionerPath, '--work-item', workItem, '--json'],
    { cwd: root, encoding: 'utf8' },
  );
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    assert.fail(
      `provisioner did not emit JSON\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }
  return { ...result, json };
}

function makeActiveCandidateFresh(root, workItemDirectory) {
  initializeGitFixture(root);
  const workItemPath = path.join(workItemDirectory, 'work-item.md');
  const recordedSnapshot = fs
    .readFileSync(workItemPath, 'utf8')
    .match(/^Review snapshot: (sha256:[0-9a-f]{64})$/m)?.[1];
  assert.ok(recordedSnapshot);
  const freshSnapshot = calculateReviewSnapshot({
    repositoryRoot: root,
    workItemPath,
  });
  fs.writeFileSync(
    workItemPath,
    fs
      .readFileSync(workItemPath, 'utf8')
      .replaceAll(recordedSnapshot, freshSnapshot),
    'utf8',
  );
}

function addPassedCompletion(workItemDirectory) {
  addRequest(workItemDirectory);
  addContext(workItemDirectory);
  addContract(workItemDirectory);
  const planContents = addPlan(workItemDirectory);
  addApproval(workItemDirectory, planContents);
  writeArtifact(
    workItemDirectory,
    'implementation-report.md',
    artifact('implementation', 'contract@1,plan@1,approval@1', 'ready'),
  );
  writeArtifact(
    workItemDirectory,
    'verification.md',
    artifact('verification', 'contract@1,plan@1,implementation@1', 'passed'),
  );
  writeArtifact(
    workItemDirectory,
    'reconciliation.md',
    artifact('reconciliation', 'verification@1', 'passed'),
  );
}

function deliveryEvidenceSection(mode, evidence = {}) {
  if (mode === 'not-required') return '';
  const fields = { ...deliveryEvidenceDefaults, ...evidence };
  return `\n## Delivery evidence\n\nDelivery result: ${fields.result}\nArtifact-bearing commit: ${fields.artifactCommit}\nRemote ref equality: ${fields.remote}\nRequired CI: ${fields.ci}\nPackage: ${fields.package}\nTarball: ${fields.tarball}\nGlobal replacement: ${fields.global}\nInstalled-shim smoke: ${fields.smoke}\nInstalled artifact provenance: ${fields.provenance}\nRollback: ${fields.rollback}\nClean worktree: ${fields.clean}\n`;
}

function completeDeliveryEvidence(overrides = {}) {
  const artifactCommit = 'a'.repeat(40);
  const packageName = '@jz/ai-arsenal-example';
  const packageVersion = '1.2.3';
  const evidence = {
    result: 'passed',
    artifactCommit,
    remote: JSON.stringify({
      ref: 'origin/master',
      sha: artifactCommit,
      confirmed: true,
    }),
    ci: JSON.stringify([
      {
        url: 'https://github.com/jimzord12/ai-arsenal/actions/runs/123',
        sha: artifactCommit,
        conclusion: 'success',
      },
    ]),
    package: JSON.stringify({ name: packageName, version: packageVersion }),
    tarball: JSON.stringify({
      file: `${packageName.replace(/^@/, '').replaceAll('/', '-')}-${packageVersion}.tgz`,
      sha256: 'b'.repeat(64),
      pack: 'success',
    }),
    global: JSON.stringify({
      command: 'pnpm add --global ./package.tgz',
      result: 'success',
      installedPackage: packageName,
      installedVersion: packageVersion,
    }),
    smoke: JSON.stringify({
      version: 'passed',
      help: 'passed',
      featureSmoke: 'passed',
    }),
    provenance: JSON.stringify({
      artifactBytes: 'confirmed',
      sourceTree: 'not-used',
    }),
    rollback: JSON.stringify({
      identity: `${packageName}@1.2.2`,
      ready: true,
      attempted: false,
      result: 'not-attempted',
    }),
    clean: JSON.stringify({ confirmed: true }),
  };
  return { ...evidence, ...overrides };
}

function addV2WorkItem(
  workItemDirectory,
  {
    stage = 'implement',
    status = 'active',
    turns = 0,
    reviewCycles = 0,
    reviewStatus = stage === 'verify' || stage === 'deliver'
      ? 'passed'
      : 'pending',
    reviewSnapshot = stage === 'verify' || stage === 'deliver'
      ? reviewDigest
      : 'pending',
    reviewBatchId = reviewSnapshot === 'pending' ? 'pending' : reviewBatch,
    expectedReviewers = reviewSnapshot === 'pending'
      ? 'pending'
      : reviewExpected,
    receivedResults = reviewSnapshot === 'pending'
      ? 'pending'
      : matchingReviewResults(reviewSnapshot, reviewBatchId).map(
          (result, index) =>
            reviewStatus === 'failed' && index === 0
              ? { ...result, outcome: 'failed' }
              : result,
        ),
    omitBatchEvidence = false,
    legacyRequiredFindings,
    dangerous = 'no',
    prerequisites = 'resolved',
    approval = 'not-required',
    approvalSource = 'none',
    worktreeMode = 'isolated',
    withGit = true,
    finalVerificationResult = stage === 'deliver' ? 'passed' : 'pending',
    deliveryMode = 'not-required',
    deliveryEvidence = {},
    workItem = workItemId,
  } = {},
) {
  writeArtifact(
    workItemDirectory,
    'work-item.md',
    `# Work Item

Work item: ${workItem}
Workflow: 2
Stage: ${stage}
Status: ${status}
Started at: 2026-07-29T10:00:00+03:00
Max time: 4 hours
Last time check: 2026-07-29T10:00:00+03:00
Turns since time check: ${turns}
Review cycles: ${reviewCycles}
${
  legacyRequiredFindings === undefined
    ? `Review status: ${reviewStatus}\nReview snapshot: ${reviewSnapshot}${
        omitBatchEvidence
          ? ''
          : `\nReview batch: ${reviewBatchId}\nReview expected: ${
              typeof expectedReviewers === 'string'
                ? expectedReviewers
                : JSON.stringify(expectedReviewers)
            }\nReview received: ${
              typeof receivedResults === 'string'
                ? receivedResults
                : JSON.stringify(receivedResults)
            }`
      }`
    : `Required findings remaining: ${legacyRequiredFindings}`
}
Dangerous deletion or irreversible data loss: ${dangerous}
Hard prerequisites: ${prerequisites}
Approval: ${approval}
Approval source: ${approvalSource}
${worktreeMode === null ? '' : `Worktree: ${worktreeMode}\n`}CLI local-delivery evidence: ${deliveryMode}

## Goal

Deliver Workflow v2.

## Non-goals

- Migration automation.

## Acceptance criteria

- The compact workflow validates.

## Implementation summary

${stage === 'implement' ? 'Pending.' : 'Implementation complete.'}

## Review findings and repairs

${stage === 'verify' || stage === 'deliver' ? 'No required findings.' : 'Pending.'}

## Final verification

Result: ${finalVerificationResult}
${deliveryEvidenceSection(deliveryMode, deliveryEvidence)}`,
  );
  const repositoryRoot = path.resolve(workItemDirectory, '..', '..', '..');
  if (
    status === 'active' &&
    withGit &&
    !fs.existsSync(path.join(repositoryRoot, '.git'))
  ) {
    initializeGitFixture(repositoryRoot, workItem);
  }
}

function addActiveIsolatedV2WorkItem(root, workItem = workItemId) {
  const workItemDirectory = path.join(root, 'docs', 'work-items', workItem);
  fs.mkdirSync(workItemDirectory, { recursive: true });
  addV2WorkItem(workItemDirectory, { workItem });
  writeActiveState(root, workItem, 'implement-monorepo-change');
  return workItemDirectory;
}

test('a compact v2 work item routes through the five-stage workflow', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'implement-monorepo-change');
  assert.deepEqual(result.json.artifacts.workItem, {
    workflow: 2,
    stage: 'implement',
    status: 'active',
    reviewCycles: 0,
    reviewStatus: 'pending',
    reviewSnapshot: 'pending',
    turnsSinceTimeCheck: 0,
  });
});

test('the compact template initializes explicit review as pending', () => {
  const template = fs.readFileSync(compactTemplatePath, 'utf8');

  assert.match(template, /^Review status: pending$/m);
  assert.match(template, /^Review snapshot: pending$/m);
  assert.match(
    template,
    /^CLI local-delivery evidence: <required\|not-required>$/m,
  );
  assert.match(template, /## Delivery evidence.*Clean worktree/is);
  assert.doesNotMatch(template, /^Required findings remaining:/m);
});

test('active work items require their deterministic work branch', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');
  initializeGitFixture(fixture.root);

  const matching = runValidator(fixture.root);
  assert.equal(matching.status, 0, matching.json.blocker);

  runGit(fixture.root, ['switch', '--quiet', '-c', 'work/wrong-branch']);
  const mismatched = runValidator(fixture.root);
  assert.equal(mismatched.status, 1);
  assert.match(
    mismatched.json.blocker,
    /exactly|work\/2026-07-13-example|branch/i,
  );
});

test('definition provisioner creates a deterministic isolated worktree from a clean base', (t) => {
  const fixture = createCleanBaseFixture(t);

  const result = runProvisioner(fixture.root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.workItem, workItemId);
  assert.equal(result.json.branch, `work/${workItemId}`);
  assert.ok(fs.existsSync(result.json.worktree));
  assert.equal(path.basename(result.json.worktree), workItemId);
  assert.equal(
    path.basename(path.dirname(result.json.worktree)),
    `${path.basename(fixture.root)}.worktrees`,
  );
  assert.equal(runGit(fixture.root, ['branch', '--show-current']), 'master');
  assert.equal(runGit(fixture.root, ['status', '--porcelain']), '');
  assert.equal(
    runGit(result.json.worktree, ['branch', '--show-current']),
    `work/${workItemId}`,
  );
});

test('definition provisioner rejects dirty bases and branch or path collisions', (t) => {
  const dirty = createCleanBaseFixture(t);
  fs.writeFileSync(path.join(dirty.root, 'uncommitted.txt'), 'dirty\n', 'utf8');
  const dirtyResult = runProvisioner(dirty.root);
  assert.equal(dirtyResult.status, 1);
  assert.match(dirtyResult.json.blocker, /clean base checkout/i);

  const branchCollision = createCleanBaseFixture(t);
  runGit(branchCollision.root, ['branch', `work/${workItemId}`]);
  const branchResult = runProvisioner(branchCollision.root);
  assert.equal(branchResult.status, 1);
  assert.match(branchResult.json.blocker, /work branch collision/i);

  const pathCollision = createCleanBaseFixture(t);
  fs.mkdirSync(path.join(pathCollision.worktreesRoot, workItemId), {
    recursive: true,
  });
  const pathResult = runProvisioner(pathCollision.root);
  assert.equal(pathResult.status, 1);
  assert.match(pathResult.json.blocker, /worktree path collision/i);

  const linked = createCleanBaseFixture(t);
  const linkedProvision = runProvisioner(linked.root);
  assert.equal(linkedProvision.status, 0, linkedProvision.json.blocker);
  const linkedResult = runProvisioner(
    linkedProvision.json.worktree,
    '2026-07-14-from-linked-worktree',
  );
  assert.equal(linkedResult.status, 1);
  assert.match(linkedResult.json.blocker, /non-work base checkout/i);
});

test('isolated active items require their exact deterministic worktree', (t) => {
  const matchingBase = createCleanBaseFixture(t);
  const matchingProvision = runProvisioner(matchingBase.root);
  assert.equal(matchingProvision.status, 0, matchingProvision.json.blocker);
  const matchingDirectory = path.join(
    matchingProvision.json.worktree,
    'docs',
    'work-items',
    workItemId,
  );
  fs.mkdirSync(matchingDirectory, { recursive: true });
  addV2WorkItem(matchingDirectory);
  writeActiveState(
    matchingProvision.json.worktree,
    workItemId,
    'implement-monorepo-change',
  );
  const matching = runValidator(matchingProvision.json.worktree);
  assert.equal(matching.status, 0, matching.json.blocker);

  const redirectedBase = createCleanBaseFixture(t);
  const redirectedRoot = path.join(
    redirectedBase.worktreesRoot,
    'not-the-work-item-id',
  );
  runGit(redirectedBase.root, [
    'worktree',
    'add',
    '--quiet',
    '-b',
    `work/${workItemId}`,
    redirectedRoot,
    'HEAD',
  ]);
  const redirectedDirectory = path.join(
    redirectedRoot,
    'docs',
    'work-items',
    workItemId,
  );
  fs.mkdirSync(redirectedDirectory, { recursive: true });
  addV2WorkItem(redirectedDirectory);
  writeActiveState(redirectedRoot, workItemId, 'implement-monorepo-change');

  const redirected = runValidator(redirectedRoot);
  assert.equal(redirected.status, 1);
  assert.match(redirected.json.blocker, /deterministic worktree|worktree/i);
});

test('active v2 items reject omitted Worktree isolation', (t) => {
  const fixture = createCleanBaseFixture(t);
  const provisioned = runProvisioner(fixture.root);
  assert.equal(provisioned.status, 0, provisioned.json.blocker);
  const workItemDirectory = path.join(
    provisioned.json.worktree,
    'docs',
    'work-items',
    workItemId,
  );
  fs.mkdirSync(workItemDirectory, { recursive: true });
  addV2WorkItem(workItemDirectory, { worktreeMode: null });
  writeActiveState(
    provisioned.json.worktree,
    workItemId,
    'implement-monorepo-change',
  );

  const result = runValidator(provisioned.json.worktree);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /Worktree: isolated/i);
});

test('only immutable delivered historical records may omit Worktree isolation', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
    worktreeMode: null,
  });
  writeActiveState(fixture.root, 'none', 'none');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /Worktree: isolated.*immutable delivered/i);
});

test('active isolated items require Git metadata for exact worktree validation', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, { withGit: false });
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /requires Git repository metadata/i);
});

test('two isolated active items route and snapshot independently', (t) => {
  const fixture = createCleanBaseFixture(t);
  const secondWorkItem = '2026-07-14-independent-example';
  const first = runProvisioner(fixture.root);
  const second = runProvisioner(fixture.root, secondWorkItem);
  assert.equal(first.status, 0, first.json.blocker);
  assert.equal(second.status, 0, second.json.blocker);

  const firstDirectory = addActiveIsolatedV2WorkItem(first.json.worktree);
  const secondDirectory = addActiveIsolatedV2WorkItem(
    second.json.worktree,
    secondWorkItem,
  );
  const firstResult = runValidator(first.json.worktree);
  const secondResult = runValidator(second.json.worktree, [
    '--work-item',
    secondWorkItem,
  ]);
  assert.equal(firstResult.status, 0, firstResult.json.blocker);
  assert.equal(secondResult.status, 0, secondResult.json.blocker);
  assert.equal(runValidator(fixture.root, ['--work-item', 'none']).status, 0);

  const firstSnapshot = calculateReviewSnapshot({
    repositoryRoot: first.json.worktree,
    workItemPath: path.join(firstDirectory, 'work-item.md'),
  });
  fs.writeFileSync(
    path.join(second.json.worktree, 'only-second-candidate.txt'),
    'second\n',
    'utf8',
  );
  assert.equal(
    calculateReviewSnapshot({
      repositoryRoot: first.json.worktree,
      workItemPath: path.join(firstDirectory, 'work-item.md'),
    }),
    firstSnapshot,
  );
  assert.notEqual(
    calculateReviewSnapshot({
      repositoryRoot: second.json.worktree,
      workItemPath: path.join(secondDirectory, 'work-item.md'),
    }),
    firstSnapshot,
  );
});

test('isolated active items reject base and detached checkouts', (t) => {
  const fixture = createCleanBaseFixture(t);
  const provisioned = runProvisioner(fixture.root);
  assert.equal(provisioned.status, 0, provisioned.json.blocker);
  const itemDirectory = addActiveIsolatedV2WorkItem(provisioned.json.worktree);

  fs.mkdirSync(path.join(fixture.root, 'docs', 'work-items'), {
    recursive: true,
  });
  fs.cpSync(
    itemDirectory,
    path.join(fixture.root, 'docs', 'work-items', workItemId),
    {
      recursive: true,
    },
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');
  const base = runValidator(fixture.root);
  assert.equal(base.status, 1);
  assert.match(base.json.blocker, /work\/|base checkout|branch/i);

  runGit(provisioned.json.worktree, ['switch', '--quiet', '--detach']);
  const detached = runValidator(provisioned.json.worktree);
  assert.equal(detached.status, 1);
  assert.match(detached.json.blocker, /detached|branch/i);
});

test('live Workflow v2 authorities require one isolated worktree per new item', () => {
  const authorities = new Map([
    ['root operating guidance', fs.readFileSync(agentsPath, 'utf8')],
    ['compact template', fs.readFileSync(compactTemplatePath, 'utf8')],
    ['normative pipeline', fs.readFileSync(pipelinePath, 'utf8')],
    ['workflow overview', fs.readFileSync(workflowOverviewPath, 'utf8')],
    ['router', fs.readFileSync(orchestrateSkillPath, 'utf8')],
    ['definition skill', fs.readFileSync(defineSkillPath, 'utf8')],
    ['delivery skill', fs.readFileSync(deliverSkillPath, 'utf8')],
  ]);

  for (const [name, contents] of authorities) {
    assert.match(contents, /work\/<work-item-id>/, `${name}: work branch`);
    assert.match(contents, /\.worktrees/, `${name}: isolated worktree`);
  }
  assert.match(authorities.get('compact template'), /^Worktree: isolated$/m);
  assert.match(
    authorities.get('definition skill'),
    /provision-monorepo-worktree\.mjs/,
  );
  assert.match(
    authorities.get('delivery skill'),
    /remov(?:e|al).*dangerous deletion/is,
  );
});

test('stage skills define pending entry, failed review, pass, and repair reset', () => {
  const defineSkill = fs.readFileSync(defineSkillPath, 'utf8');
  const implementSkill = fs.readFileSync(implementSkillPath, 'utf8');
  const reviewSkill = fs.readFileSync(reviewSkillPath, 'utf8');
  const verifySkill = fs.readFileSync(verifySkillPath, 'utf8');
  const deliverSkill = fs.readFileSync(deliverSkillPath, 'utf8');

  assert.match(defineSkill, /Review status: pending/);
  assert.match(defineSkill, /Review snapshot: pending/);
  assert.match(implementSkill, /reset.*Review status: pending/is);
  assert.match(implementSkill, /Review snapshot: pending/);
  assert.match(reviewSkill, /Review status: failed/);
  assert.match(reviewSkill, /Review status: passed/);
  assert.match(reviewSkill, /four cycles/i);
  assert.match(verifySkill, /Review status: passed/);
  assert.match(verifySkill, /Review snapshot: sha256/);
  assert.match(deliverSkill, /Review status: passed/);
  assert.match(deliverSkill, /Review snapshot: sha256/);
  for (const skill of [
    defineSkill,
    implementSkill,
    reviewSkill,
    verifySkill,
    deliverSkill,
  ]) {
    assert.match(skill, /work\/<(?:id|work-item-id)>/i);
  }
});

test('live Workflow v2 authorities define one review-barrier contract', () => {
  const authorities = new Map([
    ['root operating guidance', fs.readFileSync(agentsPath, 'utf8')],
    ['compact template', fs.readFileSync(compactTemplatePath, 'utf8')],
    ['review skill', fs.readFileSync(reviewSkillPath, 'utf8')],
    ['normative pipeline', fs.readFileSync(pipelinePath, 'utf8')],
    [
      'living-workflow assertions',
      fs.readFileSync(livingValidatorPath, 'utf8'),
    ],
  ]);

  for (const [name, contents] of authorities) {
    for (const field of [
      'Review status',
      'Review snapshot',
      'Review batch',
      'Review expected',
      'Review received',
    ]) {
      assert.match(contents, new RegExp(field), `${name}: ${field}`);
    }
    assert.match(
      contents,
      /another agent;\s*it\s*does not require a human reviewer/i,
      `${name}: independent-agent review policy`,
    );
  }

  for (const name of [
    'root operating guidance',
    'compact template',
    'normative pipeline',
  ]) {
    assert.match(
      authorities.get(name),
      /work\/<work-item-id>/,
      `${name}: branch-per-work-item policy`,
    );
  }

  const pipeline = authorities.get('normative pipeline');
  assert.match(pipeline, /calculate-review-snapshot\.mjs/);
  assert.match(pipeline, /NEXT\.md.*excluded/is);
  assert.match(pipeline, /candidate-changing repair.*all five.*pending/is);
  assert.match(pipeline, /verify and deliver.*fail closed/is);
  assert.match(pipeline, /immutable.*historical.*exact.*hash/is);

  const semanticExpectations = new Map([
    [
      'root operating guidance',
      [
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
        /all five.*pending/is,
        /every\s+expected reviewer.*exactly one matching successful/is,
        /candidate-changing repair resets all five.*pending/is,
        /verify\s+and\s+deliver fail closed/is,
        /immutable delivered records/is,
      ],
    ],
    [
      'compact template',
      [
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
        /status.*snapshot.*batch.*expected.*received.*pending/is,
        /every expected role.*exactly one matching successful/is,
        /repair that changes candidate bytes resets.*pending/is,
        /verify\s+and\s+deliver fail closed/is,
        /immutable delivered records.*exact matching hash/is,
      ],
    ],
    [
      'review skill',
      [
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
        /Review status.*Review snapshot.*Review batch.*Review expected.*Review received.*pending/is,
        /every\s+expected reviewer.*exactly once.*matching passed/is,
        /repair that changes candidate bytes resets.*pending/is,
        /verify\s+and\s+deliver fail closed/is,
      ],
    ],
    [
      'normative pipeline',
      [
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
        /all five.*pending/is,
        /every\s+expected reviewer.*exactly once.*matching successful/is,
        /candidate-changing repair resets all five.*pending/is,
        /verify\s+and\s+deliver fail closed/is,
        /immutable historical compatibility.*exact hash/is,
      ],
    ],
  ]);
  for (const [name, patterns] of semanticExpectations) {
    for (const pattern of patterns) {
      assert.match(authorities.get(name), pattern, `${name}: ${pattern}`);
    }
  }

  const livingAssertions = authorities.get('living-workflow assertions');
  for (const label of [
    'snapshot definition',
    'pending initialization',
    'complete matching evidence',
    'repair reset',
    'fail-closed advancement',
    'historical compatibility',
  ]) {
    assert.match(livingAssertions, new RegExp(label), label);
  }
});

test('integrated review-barrier lifecycle matrix fails closed and preserves compatibility', async (t) => {
  await t.test('new or unperformed review cannot verify', () => {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      stage: 'verify',
      reviewStatus: 'pending',
      reviewSnapshot: 'pending',
    });
    writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 1);
    assert.match(result.json.blocker, /Review status must be passed/i);
  });

  await t.test('pending and failed review cannot verify', () => {
    for (const [name, options] of [
      [
        'pending',
        {
          stage: 'verify',
          reviewStatus: 'pending',
          reviewSnapshot: reviewDigest,
          receivedResults: [matchingReviewResults()[0]],
        },
      ],
      [
        'failed',
        {
          stage: 'verify',
          reviewStatus: 'failed',
          reviewSnapshot: reviewDigest,
          receivedResults: matchingReviewResults().map((result, index) =>
            index === 0 ? { ...result, outcome: 'failed' } : result,
          ),
        },
      ],
    ]) {
      const fixture = createFixture(t);
      addV2WorkItem(fixture.workItemDirectory, options);
      writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

      const result = runValidator(fixture.root);
      assert.equal(result.status, 1, name);
      assert.match(result.json.blocker, /pending|passed/i, name);
    }
  });

  await t.test('incomplete or mismatched batch evidence cannot verify', () => {
    for (const [name, receivedResults, blocker] of [
      [
        'incomplete',
        [matchingReviewResults()[0]],
        /missing required reviewer/i,
      ],
      [
        'mismatched',
        matchingReviewResults().map((result, index) =>
          index === 0 ? { ...result, batchId: 'review-wrong' } : result,
        ),
        /wrong batch/i,
      ],
    ]) {
      const fixture = createFixture(t);
      addV2WorkItem(fixture.workItemDirectory, {
        stage: 'verify',
        receivedResults,
      });
      writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

      const result = runValidator(fixture.root);
      assert.equal(result.status, 1, name);
      assert.match(result.json.blocker, blocker, name);
    }
  });

  await t.test(
    'unchanged reviewed bytes verify and changed bytes do not',
    () => {
      const fixture = createFixture(t);
      addV2WorkItem(fixture.workItemDirectory, { stage: 'verify' });
      writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
      makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

      const unchanged = runValidator(fixture.root);
      assert.equal(unchanged.status, 0, unchanged.json.blocker);

      fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'changed\n');
      const changed = runValidator(fixture.root);
      assert.equal(changed.status, 1);
      assert.match(
        changed.json.blocker,
        /review snapshot is stale.*re-review/i,
      );
    },
  );

  await t.test(
    'candidate repair resets all review evidence before re-review',
    () => {
      const fixture = createFixture(t);
      addV2WorkItem(fixture.workItemDirectory, { stage: 'verify' });
      writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
      makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);
      fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'repaired\n');
      assert.equal(runValidator(fixture.root).status, 1);

      addV2WorkItem(fixture.workItemDirectory, { stage: 'review' });
      writeActiveState(fixture.root, workItemId, 'review-monorepo-change');
      const reset = runValidator(fixture.root);
      assert.equal(reset.status, 0, reset.json.blocker);
      assert.equal(reset.json.nextSkill, 'review-monorepo-change');
      assert.match(reset.json.blocker, /not been dispatched/i);
    },
  );

  await t.test(
    'active deliver and newly delivered records cannot bypass review',
    () => {
      for (const status of ['active', 'delivered']) {
        const fixture = createFixture(t);
        addV2WorkItem(fixture.workItemDirectory, {
          stage: 'deliver',
          status,
          reviewStatus: 'pending',
          reviewSnapshot: 'pending',
        });
        writeActiveState(
          fixture.root,
          status === 'active' ? workItemId : 'none',
          status === 'active' ? 'deliver-monorepo-change' : 'none',
        );

        const result = runValidator(fixture.root);
        assert.equal(result.status, 1, status);
        assert.match(result.json.blocker, /Review status must be passed/i);
      }
    },
  );

  await t.test(
    'immediate and later-arriving complete batches validate equivalently',
    () => {
      const immediate = reconcileReviewBatch({
        batchId: reviewBatch,
        snapshot: reviewDigest,
        expectedReviewers: reviewExpected,
        receivedResults: matchingReviewResults().toReversed(),
      });
      const partial = reconcileReviewBatch({
        batchId: reviewBatch,
        snapshot: reviewDigest,
        expectedReviewers: reviewExpected,
        receivedResults: [matchingReviewResults()[1]],
      });
      const resumed = reconcileReviewBatch({
        batchId: reviewBatch,
        snapshot: reviewDigest,
        expectedReviewers: reviewExpected,
        receivedResults: [
          ...partial.receivedResults,
          matchingReviewResults()[0],
        ],
      });
      assert.deepEqual(resumed, immediate);

      for (const evidence of [immediate, resumed]) {
        const fixture = createFixture(t);
        addV2WorkItem(fixture.workItemDirectory, {
          stage: 'verify',
          reviewStatus: evidence.status,
          expectedReviewers: evidence.expectedReviewers,
          receivedResults: evidence.receivedResults,
        });
        writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
        makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

        const result = runValidator(fixture.root);
        assert.equal(result.status, 0, result.json.blocker);
      }
    },
  );

  await t.test('exact immutable historical records remain readable', () => {
    const historicalId = '2026-07-31-deterministic-review-snapshot';
    const fixture = createNamedFixture(t, historicalId);
    const historicalPath = path.join(
      scriptsDirectory,
      '..',
      'docs',
      'work-items',
      historicalId,
      'work-item.md',
    );
    writeArtifact(
      fixture.workItemDirectory,
      'work-item.md',
      fs.readFileSync(historicalPath, 'utf8'),
    );
    writeActiveState(fixture.root, 'none', 'none');

    const result = runValidator(fixture.root, ['--work-item', historicalId]);
    assert.equal(result.status, 0, result.json.blocker);
    assert.match(result.json.blocker, /delivered/i);
  });
});

test('v2 accepts each valid explicit review state', (t) => {
  for (const [name, options, step] of [
    ['pending', {}, 'implement-monorepo-change'],
    [
      'failed',
      {
        stage: 'review',
        reviewStatus: 'failed',
        reviewSnapshot: reviewDigest,
        reviewBatchId: reviewBatch,
        expectedReviewers: reviewExpected,
        receivedResults: matchingReviewResults().map((result, index) =>
          index === 0 ? { ...result, outcome: 'failed' } : result,
        ),
      },
      'review-monorepo-change',
    ],
    ['passed', { stage: 'verify' }, 'verify-monorepo-change'],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, step);
    if (options.stage === 'verify') {
      makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);
    }

    const result = runValidator(fixture.root);
    assert.equal(result.status, 0, `${name}: ${result.json.blocker}`);
  }
});

test('v2 accepts a pending concrete snapshot only during review', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'review',
    reviewStatus: 'pending',
    reviewSnapshot: reviewDigest,
    reviewBatchId: reviewBatch,
    expectedReviewers: reviewExpected,
    receivedResults: [],
  });
  writeActiveState(fixture.root, workItemId, 'review-monorepo-change');

  const result = runValidator(fixture.root);
  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, 'review-monorepo-change');
});

test('review evidence fields are required and must contain valid JSON shapes', (t) => {
  for (const [name, options, blocker] of [
    [
      'missing batch evidence',
      { stage: 'verify', omitBatchEvidence: true },
      /Review batch.*Review expected.*Review received/i,
    ],
    [
      'malformed expected JSON',
      { stage: 'verify', expectedReviewers: '["contract"' },
      /Review expected.*JSON/i,
    ],
    [
      'invalid received shape',
      { stage: 'verify', receivedResults: {} },
      /Review received.*array/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 1, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('review stage remains in review until the complete matching batch passes', (t) => {
  for (const [name, options, blocker] of [
    ['undispatched', { stage: 'review' }, /review has not been dispatched/i],
    [
      'incomplete',
      {
        stage: 'review',
        reviewSnapshot: reviewDigest,
        reviewBatchId: reviewBatch,
        expectedReviewers: reviewExpected,
        receivedResults: [matchingReviewResults()[0]],
      },
      /missing required reviewer: quality/i,
    ],
    [
      'failed',
      {
        stage: 'review',
        reviewStatus: 'failed',
        reviewSnapshot: reviewDigest,
        reviewBatchId: reviewBatch,
        expectedReviewers: reviewExpected,
        receivedResults: matchingReviewResults().map((result, index) =>
          index === 0 ? { ...result, outcome: 'failed' } : result,
        ),
      },
      /contract review outcome: failed/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, 'review-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 0, `${name}: ${result.json.blocker}`);
    assert.equal(result.json.nextSkill, 'review-monorepo-change', name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('verify rejects incomplete, mismatched, and inconsistent review evidence', (t) => {
  for (const [name, options, blocker] of [
    [
      'pending',
      {
        stage: 'verify',
        reviewStatus: 'pending',
        reviewSnapshot: 'pending',
        reviewBatchId: 'pending',
        expectedReviewers: 'pending',
        receivedResults: 'pending',
      },
      /Review status must be passed/i,
    ],
    [
      'incomplete',
      { stage: 'verify', receivedResults: [matchingReviewResults()[0]] },
      /missing required reviewer: quality/i,
    ],
    [
      'wrong batch',
      {
        stage: 'verify',
        receivedResults: matchingReviewResults().map((result, index) =>
          index === 0 ? { ...result, batchId: 'review-wrong' } : result,
        ),
      },
      /wrong batch for reviewer contract/i,
    ],
    [
      'wrong snapshot',
      {
        stage: 'verify',
        receivedResults: matchingReviewResults().map((result, index) =>
          index === 0
            ? { ...result, snapshot: `sha256:${'b'.repeat(64)}` }
            : result,
        ),
      },
      /wrong snapshot for reviewer contract/i,
    ],
    [
      'duplicate reviewer',
      {
        stage: 'verify',
        receivedResults: [
          ...matchingReviewResults(),
          matchingReviewResults()[0],
        ],
      },
      /duplicate required reviewer: contract/i,
    ],
    [
      'unexpected reviewer',
      {
        stage: 'verify',
        receivedResults: [
          ...matchingReviewResults(),
          {
            reviewer: 'security',
            outcome: 'passed',
            batchId: reviewBatch,
            snapshot: reviewDigest,
          },
        ],
      },
      /unexpected reviewer: security/i,
    ],
    [
      'recorded status mismatch',
      {
        stage: 'verify',
        reviewStatus: 'failed',
        receivedResults: matchingReviewResults(),
      },
      /Review status must be passed/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 1, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('verify and active deliver require the fresh current candidate snapshot', (t) => {
  for (const stage of ['verify', 'deliver']) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      stage,
      reviewSnapshot: reviewDigest,
    });
    writeActiveState(fixture.root, workItemId, `${stage}-monorepo-change`);
    initializeGitFixture(fixture.root);
    fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'reviewed\n');
    const workItemPath = path.join(fixture.workItemDirectory, 'work-item.md');
    const freshSnapshot = calculateReviewSnapshot({
      repositoryRoot: fixture.root,
      workItemPath,
    });
    const contents = fs
      .readFileSync(workItemPath, 'utf8')
      .replaceAll(reviewDigest, freshSnapshot);
    fs.writeFileSync(workItemPath, contents, 'utf8');

    const unchanged = runValidator(fixture.root);
    assert.equal(unchanged.status, 0, `${stage}: ${unchanged.json.blocker}`);
    assert.equal(fs.readFileSync(workItemPath, 'utf8'), contents);

    if (stage === 'deliver') {
      runGit(fixture.root, ['add', '.']);
      runGit(fixture.root, ['commit', '--quiet', '-m', 'reviewed artifact']);
      const cleanArtifact = runValidator(fixture.root);
      assert.equal(
        cleanArtifact.status,
        0,
        `clean artifact: ${cleanArtifact.json.blocker}`,
      );
    }

    fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'changed\n');
    const stale = runValidator(fixture.root);
    assert.equal(stale.status, 1, stage);
    assert.match(stale.json.blocker, /review snapshot is stale.*re-review/i);
  }
});

test('active deliver rejects dirty submodules even when repository config ignores them', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, { stage: 'deliver' });
  writeActiveState(fixture.root, workItemId, 'deliver-monorepo-change');
  initializeGitFixture(fixture.root);

  const source = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ai-arsenal-validator-submodule-'),
  );
  t.after(() => fs.rmSync(source, { force: true, recursive: true }));
  runGit(source, ['init', '--quiet']);
  runGit(source, ['config', 'user.name', 'Workflow Tests']);
  runGit(source, ['config', 'user.email', 'workflow-tests@example.invalid']);
  fs.writeFileSync(path.join(source, 'value.txt'), 'baseline\n');
  runGit(source, ['add', '.']);
  runGit(source, ['commit', '--quiet', '-m', 'submodule baseline']);
  runGit(fixture.root, [
    '-c',
    'protocol.file.allow=always',
    'submodule',
    'add',
    '--quiet',
    source,
    'modules/sample',
  ]);
  runGit(fixture.root, ['commit', '--quiet', '-am', 'add submodule baseline']);

  fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'reviewed\n');
  const workItemPath = path.join(fixture.workItemDirectory, 'work-item.md');
  const freshSnapshot = calculateReviewSnapshot({
    repositoryRoot: fixture.root,
    workItemPath,
  });
  fs.writeFileSync(
    workItemPath,
    fs
      .readFileSync(workItemPath, 'utf8')
      .replaceAll(reviewDigest, freshSnapshot),
    'utf8',
  );
  runGit(fixture.root, ['add', '.']);
  runGit(fixture.root, ['commit', '--quiet', '-m', 'reviewed artifact']);
  const cleanArtifact = runValidator(fixture.root);
  assert.equal(cleanArtifact.status, 0, cleanArtifact.json.blocker);

  fs.writeFileSync(
    path.join(fixture.root, 'modules', 'sample', 'untracked.txt'),
    'dirty\n',
  );
  runGit(fixture.root, ['config', 'submodule.modules/sample.ignore', 'all']);
  assert.equal(runGit(fixture.root, ['status', '--porcelain=v2']), '');

  const dirtyArtifact = runValidator(fixture.root);
  assert.equal(dirtyArtifact.status, 1);
  assert.match(
    dirtyArtifact.json.blocker,
    /review snapshot is stale.*re-review/i,
  );
});

test('freshness-required stages fail closed without Git metadata', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'verify',
    withGit: false,
  });
  writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');

  const result = runValidator(fixture.root);
  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /requires Git repository metadata/i);
});

test('newly delivered records require complete evidence and a clean candidate', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
  });
  writeActiveState(fixture.root, 'none', 'none');
  initializeGitFixture(fixture.root);

  const clean = runValidator(fixture.root);
  assert.equal(clean.status, 0, clean.json.blocker);

  fs.writeFileSync(path.join(fixture.root, 'candidate.txt'), 'changed\n');
  const changed = runValidator(fixture.root);
  assert.equal(changed.status, 1);
  assert.match(
    changed.json.blocker,
    /delivered candidate has uncommitted changes/i,
  );

  const incomplete = createFixture(t);
  addV2WorkItem(incomplete.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
    receivedResults: [matchingReviewResults()[0]],
  });
  writeActiveState(incomplete.root, 'none', 'none');
  initializeGitFixture(incomplete.root);
  const incompleteResult = runValidator(incomplete.root);
  assert.equal(incompleteResult.status, 1);
  assert.match(incompleteResult.json.blocker, /missing required reviewer/i);
});

test('committed batch-field removal cannot impersonate a delivered historical record', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, { stage: 'verify' });
  writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
  initializeGitFixture(fixture.root);
  const workItemPath = path.join(fixture.workItemDirectory, 'work-item.md');
  const bypass = fs
    .readFileSync(workItemPath, 'utf8')
    .replace('Stage: verify', 'Stage: deliver')
    .replace('Status: active', 'Status: delivered')
    .replace('Result: pending', 'Result: passed')
    .replace(/^Review (?:batch|expected|received): .*\n/gm, '');
  fs.writeFileSync(workItemPath, bypass, 'utf8');
  writeActiveState(fixture.root, 'none', 'none');
  runGit(fixture.root, ['add', '.']);
  runGit(fixture.root, ['commit', '--quiet', '-m', 'attempted bypass']);

  const result = runValidator(fixture.root);
  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /current review evidence requires/i);
});

test('v2 rejects malformed or contradictory explicit review states', (t) => {
  for (const [name, reviewStatus, reviewSnapshot, blocker] of [
    ['pending with digest', 'pending', reviewDigest, /pending snapshot/i],
    ['failed without digest', 'failed', 'pending', /concrete snapshot/i],
    ['passed without digest', 'passed', 'pending', /concrete snapshot/i],
    ['unknown status', 'complete', reviewDigest, /Review status/i],
    ['malformed digest', 'passed', 'sha256:abc', /Review snapshot/i],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      reviewStatus,
      reviewSnapshot,
    });
    writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 1, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('ordinary delivery remains valid without CLI artifact evidence', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    deliveryMode: 'not-required',
  });
  writeActiveState(fixture.root, workItemId, 'deliver-monorepo-change');
  makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, 'deliver-monorepo-change');
});

test('required CLI delivery stays active while evidence is pending', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    deliveryMode: 'required',
  });
  writeActiveState(fixture.root, workItemId, 'deliver-monorepo-change');
  makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, 'deliver-monorepo-change');
});

test('required CLI delivery accepts complete evidence without a closure SHA', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
    deliveryMode: 'required',
    deliveryEvidence: completeDeliveryEvidence(),
  });
  writeActiveState(fixture.root, 'none', 'none');
  initializeGitFixture(fixture.root);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, null);
});

test('required CLI delivery rejects each missing evidence category', (t) => {
  for (const category of Object.keys(deliveryEvidenceDefaults)) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      stage: 'deliver',
      status: 'delivered',
      deliveryMode: 'required',
      deliveryEvidence: {
        ...completeDeliveryEvidence(),
        [category]: 'pending',
      },
    });
    writeActiveState(fixture.root, 'none', 'none');
    initializeGitFixture(fixture.root);

    const result = runValidator(fixture.root);

    assert.equal(result.status, 1, category);
    assert.match(
      result.json.blocker,
      /delivery evidence|passed|pending/i,
      category,
    );
  }
});

test('required CLI delivery rejects artifact, remote, CI, package, and checksum mismatches', (t) => {
  const cases = [
    ['artifact SHA', { artifactCommit: 'c'.repeat(40) }],
    [
      'remote SHA',
      {
        remote: JSON.stringify({
          ref: 'origin/master',
          sha: 'c'.repeat(40),
          confirmed: true,
        }),
      },
    ],
    [
      'CI SHA',
      {
        ci: JSON.stringify([
          {
            url: 'https://github.com/jimzord12/ai-arsenal/actions/runs/123',
            sha: 'c'.repeat(40),
            conclusion: 'success',
          },
        ]),
      },
    ],
    [
      'package version',
      {
        package: JSON.stringify({
          name: '@jz/ai-arsenal-example',
          version: '9.9.9',
        }),
      },
    ],
    [
      'checksum',
      {
        tarball: JSON.stringify({
          file: 'package.tgz',
          sha256: 'not-a-checksum',
          pack: 'success',
        }),
      },
    ],
  ];

  for (const [name, override] of cases) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      stage: 'deliver',
      status: 'delivered',
      deliveryMode: 'required',
      deliveryEvidence: completeDeliveryEvidence(override),
    });
    writeActiveState(fixture.root, 'none', 'none');
    initializeGitFixture(fixture.root);

    const result = runValidator(fixture.root);

    assert.equal(result.status, 1, name);
    assert.match(
      result.json.blocker,
      /delivery|mismatch|package|checksum|SHA/i,
      name,
    );
  }
});

test('failed CI and failed installation with successful rollback remain active and resumable', (t) => {
  const fixture = createFixture(t);
  const evidence = completeDeliveryEvidence({
    result: 'failed',
    ci: JSON.stringify([
      {
        url: 'https://github.com/jimzord12/ai-arsenal/actions/runs/123',
        sha: 'a'.repeat(40),
        conclusion: 'failure',
      },
    ]),
    global: JSON.stringify({
      command: 'pnpm add --global ./package.tgz',
      result: 'failed',
      error: 'shim invocation failed',
    }),
    rollback: JSON.stringify({
      identity: '@jz/ai-arsenal-example@1.2.2',
      ready: true,
      attempted: true,
      result: 'success',
    }),
  });
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    deliveryMode: 'required',
    deliveryEvidence: evidence,
  });
  writeActiveState(fixture.root, workItemId, 'deliver-monorepo-change');
  makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, 'deliver-monorepo-change');
});

test('failed installed-shim smoke cannot be represented as delivered', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
    deliveryMode: 'required',
    deliveryEvidence: completeDeliveryEvidence({
      smoke: JSON.stringify({
        version: 'passed',
        help: 'passed',
        featureSmoke: 'failed',
      }),
    }),
  });
  writeActiveState(fixture.root, 'none', 'none');
  initializeGitFixture(fixture.root);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /delivery|smoke|passed/i);
});

test('v2 enforces time checks and the review-cycle ceiling', (t) => {
  for (const [name, options, step, expectedStatus, blocker] of [
    [
      'overdue time check',
      { turns: 5 },
      'implement-monorepo-change',
      1,
      /time check/i,
    ],
    [
      'fifth unresolved review',
      {
        stage: 'review',
        status: 'blocked',
        reviewCycles: 4,
        reviewStatus: 'failed',
        reviewSnapshot: reviewDigest,
      },
      'review-monorepo-change',
      0,
      /four review cycles/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, step);

    const result = runValidator(fixture.root);
    assert.equal(result.status, expectedStatus, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('v2 accepts recorded turn counts through four in verify and deliver', (t) => {
  for (const stage of ['verify', 'deliver']) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, { stage, turns: 4 });
    writeActiveState(fixture.root, workItemId, `${stage}-monorepo-change`);
    makeActiveCandidateFresh(fixture.root, fixture.workItemDirectory);

    const result = runValidator(fixture.root);

    assert.equal(result.status, 0, `${stage}: ${result.json.blocker}`);
    assert.equal(result.json.artifacts.workItem.turnsSinceTimeCheck, 4);
  }
});

test('v2 requires direct approval only for dangerous work', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    dangerous: 'yes',
    approval: 'required',
  });
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /direct approval/i);
});

test('v2 treats approval-required and prerequisite-blocked states as valid stops', (t) => {
  for (const [name, options, blocker] of [
    [
      'dangerous approval required',
      {
        stage: 'define',
        status: 'blocked',
        dangerous: 'yes',
        approval: 'required',
      },
      /awaiting direct approval/i,
    ],
    [
      'hard prerequisite blocked',
      {
        stage: 'define',
        status: 'blocked',
        prerequisites: 'blocked',
      },
      /hard prerequisite/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, options);
    writeActiveState(fixture.root, workItemId, 'define-monorepo-change');

    const result = runValidator(fixture.root);

    assert.equal(result.status, 0, `${name}: ${result.json.blocker}`);
    assert.equal(result.json.valid, true, name);
    assert.equal(result.json.nextSkill, null, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('completed v2 work validates with cleared registration', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
  });
  writeActiveState(fixture.root, 'none', 'none');
  initializeGitFixture(fixture.root);

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0, result.json.blocker);
  assert.equal(result.json.nextSkill, null);
  assert.match(result.json.blocker, /delivered/i);
});

test('newly fabricated legacy v2 work cannot claim historical compatibility', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'deliver',
    status: 'delivered',
    legacyRequiredFindings: 'no',
  });
  writeActiveState(fixture.root, 'none', 'none');
  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /immutable delivered historical records/i);
});

test('immutable pre-batch delivered records remain readable without rewriting', (t) => {
  for (const historicalId of [
    '2026-07-29-workflow-v2',
    '2026-07-31-deterministic-review-snapshot',
  ]) {
    const fixture = createNamedFixture(t, historicalId);
    const historicalPath = path.join(
      scriptsDirectory,
      '..',
      'docs',
      'work-items',
      historicalId,
      'work-item.md',
    );
    writeArtifact(
      fixture.workItemDirectory,
      'work-item.md',
      fs.readFileSync(historicalPath, 'utf8'),
    );
    writeActiveState(fixture.root, 'none', 'none');

    const result = runValidator(fixture.root, ['--work-item', historicalId]);

    assert.equal(result.status, 0, `${historicalId}: ${result.json.blocker}`);
    assert.equal(result.json.valid, true);
    assert.match(result.json.blocker, /delivered/i);
  }
});

test('active legacy v2 work must adopt the explicit review lifecycle', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    legacyRequiredFindings: 'no',
  });
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /delivered historical records/i);
});

test('v2 deliver state requires explicit passed final verification', (t) => {
  for (const status of ['active', 'delivered']) {
    const fixture = createFixture(t);
    addV2WorkItem(fixture.workItemDirectory, {
      stage: 'deliver',
      status,
      finalVerificationResult: 'failed',
    });
    writeActiveState(
      fixture.root,
      status === 'delivered' ? 'none' : workItemId,
      status === 'delivered' ? 'none' : 'deliver-monorepo-change',
    );

    const result = runValidator(fixture.root);

    assert.equal(result.status, 1);
    assert.match(result.json.blocker, /passed final verification/i);
  }
});

test('v2 rejects mixed current artifacts and incomplete stage evidence', (t) => {
  const mixed = createFixture(t);
  addV2WorkItem(mixed.workItemDirectory);
  addRequest(mixed.workItemDirectory);
  writeActiveState(mixed.root, workItemId, 'implement-monorepo-change');
  const mixedResult = runValidator(mixed.root);
  assert.equal(mixedResult.status, 1);
  assert.match(mixedResult.json.blocker, /one compact|v1 artifact/i);

  const incomplete = createFixture(t);
  addV2WorkItem(incomplete.workItemDirectory, {
    stage: 'verify',
  });
  const incompletePath = path.join(
    incomplete.workItemDirectory,
    'work-item.md',
  );
  fs.writeFileSync(
    incompletePath,
    fs
      .readFileSync(incompletePath, 'utf8')
      .replace('No required findings.', 'Pending.'),
    'utf8',
  );
  writeActiveState(incomplete.root, workItemId, 'verify-monorepo-change');
  const incompleteResult = runValidator(incomplete.root);
  assert.equal(incompleteResult.status, 1);
  assert.match(incompleteResult.json.blocker, /review findings.*pending/i);
});

test('four unresolved review cycles must stop as blocked', (t) => {
  const fixture = createFixture(t);
  addV2WorkItem(fixture.workItemDirectory, {
    stage: 'review',
    reviewCycles: 4,
    reviewStatus: 'failed',
    reviewSnapshot: reviewDigest,
  });
  writeActiveState(fixture.root, workItemId, 'review-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /blocked after four review cycles/i);
});

test('a ready request routes to orientation', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'orient-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'orient-monorepo-change');
  assert.deepEqual(result.json.artifacts.request, {
    revision: 1,
    status: 'ready',
  });
});

test('ready request and context route to scoping', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'scope-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'scope-monorepo-change');
});

test('a ready plan routes to autonomous digest authorization', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  addPlan(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'record-monorepo-approval');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'record-monorepo-approval');
  assert.equal(result.json.blocker, null);
});

test('an autonomous digest authorization routes to implementation', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(
    fixture.workItemDirectory,
    planContents,
    undefined,
    'autonomous-agent',
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'implement-monorepo-change');
  assert.equal(result.json.blocker, null);
});

test('an unknown authorization principal is invalid', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(fixture.workItemDirectory, planContents, undefined, 'robot');
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /user or autonomous-agent/i);
});

test('autonomous authorization requires canonical policy provenance', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(
    fixture.workItemDirectory,
    planContents,
    undefined,
    'autonomous-agent',
    'Agent decided this was fine.',
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /policy:ai-arsenal-autonomy-v1/i);
});

test('autonomous authorization cannot cover dangerous deletion', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory, 'yes');
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(
    fixture.workItemDirectory,
    planContents,
    undefined,
    'autonomous-agent',
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(result.json.blocker, /cannot authorize dangerous deletion/i);
});

test('autonomous authorization requires resolved hard prerequisites', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory, 'no', 'blocked');
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(
    fixture.workItemDirectory,
    planContents,
    undefined,
    'autonomous-agent',
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(
    result.json.blocker,
    /cannot bypass blocked hard prerequisites/i,
  );
});

test('user authorization cannot bypass blocked hard prerequisites', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory, 'no', 'blocked');
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(fixture.workItemDirectory, planContents, undefined, 'user');
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.match(
    result.json.blocker,
    /cannot bypass blocked hard prerequisites/i,
  );
});

test('an approval with a stale plan digest is invalid', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(fixture.workItemDirectory, planContents, '0'.repeat(64));
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.equal(result.json.nextSkill, null);
  assert.match(result.json.blocker, /digest/i);
});

test('failed verification routes back to implementation', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  const planContents = addPlan(fixture.workItemDirectory);
  addApproval(fixture.workItemDirectory, planContents);
  writeArtifact(
    fixture.workItemDirectory,
    'implementation-report.md',
    artifact('implementation', 'contract@1,plan@1,approval@1', 'ready'),
  );
  writeArtifact(
    fixture.workItemDirectory,
    'verification.md',
    artifact('verification', 'contract@1,plan@1,implementation@1', 'failed'),
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'implement-monorepo-change');
});

test('conflicting active work-item references are invalid', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  fs.writeFileSync(
    path.join(fixture.root, 'NEXT.md'),
    `# NEXT\n\n**Active work item:** \`${workItemId}\`\n**Pipeline step:** \`orient-monorepo-change\`\n**Active work item:** \`2026-07-13-other\`\n**Pipeline step:** \`orient-monorepo-change\`\n`,
    'utf8',
  );

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.equal(result.json.nextSkill, null);
  assert.ok(result.json.blocker);
});

test('missing active registration is invalid for selected and inactive checks', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);

  const selected = runValidator(fixture.root);
  const inactive = runValidator(fixture.root, ['--work-item', 'none']);

  assert.equal(selected.status, 1);
  assert.equal(selected.json.valid, false);
  assert.match(selected.json.blocker, /active work-item|pipeline-step/i);
  assert.equal(inactive.status, 1);
  assert.equal(inactive.json.valid, false);
  assert.match(inactive.json.blocker, /active work-item|pipeline-step/i);
});

test('partial active registration is invalid', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  fs.writeFileSync(
    path.join(fixture.root, 'NEXT.md'),
    `# NEXT\n\n**Active work item:** \`${workItemId}\`\n`,
    'utf8',
  );

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /active work-item|pipeline-step/i);
});

test('current mode validates the explicit inactive registration', (t) => {
  const fixture = createFixture(t);
  writeActiveState(fixture.root, 'none', 'none');

  const result = runCurrentValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.workItem, 'none');
  assert.equal(result.json.valid, true);
  assert.match(result.json.blocker, /no active work item/i);
});

test('current mode validates the registered active work item', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'orient-monorepo-change');

  const result = runCurrentValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.workItem, workItemId);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, 'orient-monorepo-change');
});

test('pipeline step must match the computed route', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /pipeline step/i);
});

test('a completed work item validates after active registration is cleared', (t) => {
  const fixture = createFixture(t);
  addPassedCompletion(fixture.workItemDirectory);
  writeActiveState(fixture.root, 'none', 'none');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, null);
  assert.match(result.json.blocker, /complete/i);
});

test('a completed work item is invalid while still registered active', (t) => {
  const fixture = createFixture(t);
  addPassedCompletion(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'reconcile-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /active registration/i);
});

test('an archived revision requires a complete superseded header', (t) => {
  const fixture = createFixture(t);
  fs.mkdirSync(
    path.join(fixture.workItemDirectory, 'revisions', 'request.md'),
    { recursive: true },
  );
  fs.writeFileSync(
    path.join(fixture.workItemDirectory, 'revisions', 'request.md', 'v1.md'),
    `Work item: ${workItemId}\nArtifact: request\nRevision: 1\n`,
    'utf8',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'request.md',
    artifact('request', 'none', 'ready').replace('Revision: 1', 'Revision: 2'),
  );
  writeActiveState(fixture.root, workItemId, 'orient-monorepo-change');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /archived|header/i);
});

test('valid contract and plan revision requests route only to their owners', (t) => {
  const contractFixture = createFixture(t);
  addRequest(contractFixture.workItemDirectory);
  addContext(contractFixture.workItemDirectory);
  addContract(contractFixture.workItemDirectory);
  addPlan(contractFixture.workItemDirectory);
  addRevisionRequest(contractFixture.workItemDirectory, 'contract');
  writeActiveState(contractFixture.root, workItemId, 'scope-monorepo-change');

  const contractResult = runValidator(contractFixture.root);
  assert.equal(contractResult.status, 0);
  assert.equal(contractResult.json.nextSkill, 'scope-monorepo-change');

  const planFixture = createFixture(t);
  addRequest(planFixture.workItemDirectory);
  addContext(planFixture.workItemDirectory);
  addContract(planFixture.workItemDirectory);
  addPlan(planFixture.workItemDirectory);
  addRevisionRequest(planFixture.workItemDirectory, 'plan');
  writeActiveState(planFixture.root, workItemId, 'plan-monorepo-change');

  const planResult = runValidator(planFixture.root);
  assert.equal(planResult.status, 0);
  assert.equal(planResult.json.nextSkill, 'plan-monorepo-change');
});

test('revision requests reject malformed, stale, duplicate, and unsupported targets', (t) => {
  for (const [name, contents, blocker] of [
    [
      'stale prerequisite',
      artifact(
        'revision-request',
        'plan@2',
        'ready',
        '\nRevision target: `plan`\nRevision source: `User request.`\n',
      ),
      /current|stale|prerequisite/i,
    ],
    [
      'duplicate target',
      artifact(
        'revision-request',
        'plan@1',
        'ready',
        '\nRevision target: `plan`\nRevision target: `plan`\nRevision source: `User request.`\n',
      ),
      /exactly once|target/i,
    ],
    [
      'unsupported target',
      artifact(
        'revision-request',
        'approval@1',
        'ready',
        '\nRevision target: `approval`\nRevision source: `User request.`\n',
      ),
      /contract|plan|unsupported/i,
    ],
  ]) {
    const fixture = createFixture(t);
    addRequest(fixture.workItemDirectory);
    addContext(fixture.workItemDirectory);
    addContract(fixture.workItemDirectory);
    addPlan(fixture.workItemDirectory);
    writeArtifact(fixture.workItemDirectory, 'revision-request.md', contents);
    writeActiveState(fixture.root, workItemId, 'plan-monorepo-change');

    const result = runValidator(fixture.root);
    assert.equal(result.status, 1, name);
    assert.match(result.json.blocker, blocker, name);
  }
});

test('a failed verification recovery archives and increments attempt records', (t) => {
  const fixture = createFixture(t);
  const expectRoute = (nextSkill) => {
    const result = runValidator(fixture.root);
    assert.equal(result.status, 0);
    assert.equal(result.json.valid, true);
    assert.equal(result.json.nextSkill, nextSkill);
  };

  addRequest(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'orient-monorepo-change');
  expectRoute('orient-monorepo-change');

  addContext(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'scope-monorepo-change');
  expectRoute('scope-monorepo-change');

  addContract(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'plan-monorepo-change');
  expectRoute('plan-monorepo-change');

  const planContents = addPlan(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'record-monorepo-approval');
  const awaitingAuthorization = runValidator(fixture.root);
  assert.equal(awaitingAuthorization.status, 0);
  assert.equal(awaitingAuthorization.json.valid, true);
  assert.equal(
    awaitingAuthorization.json.nextSkill,
    'record-monorepo-approval',
  );
  assert.equal(awaitingAuthorization.json.blocker, null);

  addApproval(fixture.workItemDirectory, planContents);
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');
  expectRoute('implement-monorepo-change');

  const firstImplementation = artifact(
    'implementation',
    'contract@1,plan@1,approval@1',
    'ready',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'implementation-report.md',
    firstImplementation,
  );
  writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
  expectRoute('verify-monorepo-change');

  const failedVerification = artifact(
    'verification',
    'contract@1,plan@1,implementation@1',
    'failed',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'verification.md',
    failedVerification,
  );
  writeActiveState(fixture.root, workItemId, 'implement-monorepo-change');
  expectRoute('implement-monorepo-change');

  archiveArtifact(
    fixture.workItemDirectory,
    'verification.md',
    failedVerification,
  );
  archiveArtifact(
    fixture.workItemDirectory,
    'implementation-report.md',
    firstImplementation,
  );
  writeArtifact(
    fixture.workItemDirectory,
    'implementation-report.md',
    artifact('implementation', 'contract@1,plan@1,approval@1', 'ready', '', 2),
  );
  writeActiveState(fixture.root, workItemId, 'verify-monorepo-change');
  expectRoute('verify-monorepo-change');

  writeArtifact(
    fixture.workItemDirectory,
    'verification.md',
    artifact(
      'verification',
      'contract@1,plan@1,implementation@2',
      'passed',
      '',
      2,
    ),
  );
  writeActiveState(fixture.root, workItemId, 'reconcile-monorepo-change');
  expectRoute('reconcile-monorepo-change');

  assert.match(
    fs.readFileSync(
      path.join(
        fixture.workItemDirectory,
        'revisions',
        'implementation-report.md',
        'v1.md',
      ),
      'utf8',
    ),
    /^Status: superseded$/m,
  );
  assert.match(
    fs.readFileSync(
      path.join(
        fixture.workItemDirectory,
        'revisions',
        'verification.md',
        'v1.md',
      ),
      'utf8',
    ),
    /^Status: superseded$/m,
  );

  writeArtifact(
    fixture.workItemDirectory,
    'reconciliation.md',
    artifact('reconciliation', 'verification@2', 'passed'),
  );
  writeActiveState(fixture.root, 'none', 'none');

  const completed = runValidator(fixture.root);
  assert.equal(completed.status, 0);
  assert.equal(completed.json.valid, true);
  assert.equal(completed.json.nextSkill, null);
  assert.match(completed.json.blocker, /complete/i);
});

test('contract and plan revisions archive downstream state before rerouting', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  const firstContract = artifact('contract', 'request@1,context@1', 'ready');
  writeArtifact(fixture.workItemDirectory, 'change-contract.md', firstContract);
  const firstPlan = addPlan(fixture.workItemDirectory);
  addApproval(fixture.workItemDirectory, firstPlan);
  const firstImplementation = artifact(
    'implementation',
    'contract@1,plan@1,approval@1',
    'ready',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'implementation-report.md',
    firstImplementation,
  );
  const firstVerification = artifact(
    'verification',
    'contract@1,plan@1,implementation@1',
    'passed',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'verification.md',
    firstVerification,
  );
  const firstReconciliation = artifact(
    'reconciliation',
    'verification@1',
    'passed',
  );
  writeArtifact(
    fixture.workItemDirectory,
    'reconciliation.md',
    firstReconciliation,
  );
  const contractRevisionRequest = addRevisionRequest(
    fixture.workItemDirectory,
    'contract',
  );
  writeActiveState(fixture.root, workItemId, 'scope-monorepo-change');
  const contractRequestRoute = runValidator(fixture.root);
  assert.equal(
    contractRequestRoute.status,
    0,
    contractRequestRoute.json.blocker,
  );
  assert.equal(contractRequestRoute.json.nextSkill, 'scope-monorepo-change');

  for (const [name, contents] of [
    ['reconciliation.md', firstReconciliation],
    ['verification.md', firstVerification],
    ['implementation-report.md', firstImplementation],
    [
      'approval.md',
      fs.readFileSync(
        path.join(fixture.workItemDirectory, 'approval.md'),
        'utf8',
      ),
    ],
    ['implementation-plan.md', firstPlan],
  ]) {
    archiveArtifact(fixture.workItemDirectory, name, contents);
  }
  archiveArtifact(
    fixture.workItemDirectory,
    'change-contract.md',
    firstContract,
  );
  archiveArtifact(
    fixture.workItemDirectory,
    'revision-request.md',
    contractRevisionRequest,
  );
  writeArtifact(
    fixture.workItemDirectory,
    'change-contract.md',
    artifact('contract', 'request@1,context@1', 'ready', '', 2),
  );
  writeActiveState(fixture.root, workItemId, 'plan-monorepo-change');

  const afterContractRevision = runValidator(fixture.root);

  assert.equal(afterContractRevision.status, 0);
  assert.equal(afterContractRevision.json.valid, true);
  assert.equal(afterContractRevision.json.nextSkill, 'plan-monorepo-change');
  for (const name of [
    'reconciliation.md',
    'verification.md',
    'implementation-report.md',
    'approval.md',
    'implementation-plan.md',
  ]) {
    assert.match(
      fs.readFileSync(
        path.join(fixture.workItemDirectory, 'revisions', name, 'v1.md'),
        'utf8',
      ),
      /^Status: superseded$/m,
    );
  }

  writeArtifact(
    fixture.workItemDirectory,
    'implementation-plan.md',
    artifact('plan', 'contract@2', 'ready', '', 2),
  );
  const planRevisionRequest = addRevisionRequest(
    fixture.workItemDirectory,
    'plan',
    2,
    2,
  );
  writeActiveState(fixture.root, workItemId, 'plan-monorepo-change');

  const planRequestRoute = runValidator(fixture.root);
  assert.equal(planRequestRoute.status, 0);
  assert.equal(planRequestRoute.json.nextSkill, 'plan-monorepo-change');

  archiveArtifact(
    fixture.workItemDirectory,
    'implementation-plan.md',
    artifact('plan', 'contract@2', 'ready', '', 2),
  );
  archiveArtifact(
    fixture.workItemDirectory,
    'revision-request.md',
    planRevisionRequest,
  );
  writeArtifact(
    fixture.workItemDirectory,
    'implementation-plan.md',
    artifact('plan', 'contract@2', 'ready', '', 3),
  );
  writeActiveState(fixture.root, workItemId, 'record-monorepo-approval');

  const afterPlanRevision = runValidator(fixture.root);

  assert.equal(afterPlanRevision.status, 0);
  assert.equal(afterPlanRevision.json.valid, true);
  assert.equal(afterPlanRevision.json.nextSkill, 'record-monorepo-approval');
  assert.equal(afterPlanRevision.json.blocker, null);
  assert.match(
    fs.readFileSync(
      path.join(
        fixture.workItemDirectory,
        'revisions',
        'change-contract.md',
        'v1.md',
      ),
      'utf8',
    ),
    /^Status: superseded$/m,
  );
  for (const revision of [1, 2]) {
    assert.match(
      fs.readFileSync(
        path.join(
          fixture.workItemDirectory,
          'revisions',
          'revision-request.md',
          `v${revision}.md`,
        ),
        'utf8',
      ),
      /^Status: superseded$/m,
    );
  }
});

test('validation does not mutate the selected work item', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'orient-monorepo-change');
  const before = fs.readFileSync(
    path.join(fixture.workItemDirectory, 'request.md'),
    'utf8',
  );

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(
    fs.readFileSync(path.join(fixture.workItemDirectory, 'request.md'), 'utf8'),
    before,
  );
  assert.deepEqual(fs.readdirSync(fixture.workItemDirectory), ['request.md']);
});
