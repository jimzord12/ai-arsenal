import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const validatorPath = path.join(
  scriptsDirectory,
  'validate-monorepo-work-item.mjs',
);
const workItemId = '2026-07-13-example';

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-work-item-'));
  const workItemDirectory = path.join(root, 'docs', 'work-items', workItemId);
  fs.mkdirSync(workItemDirectory, { recursive: true });
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
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

function addContract(workItemDirectory) {
  writeArtifact(
    workItemDirectory,
    'change-contract.md',
    artifact('contract', 'request@1,context@1', 'ready'),
  );
}

function addPlan(workItemDirectory) {
  const contents = artifact('plan', 'contract@1', 'ready', '\n# Plan\n');
  writeArtifact(workItemDirectory, 'implementation-plan.md', contents);
  return contents;
}

function addApproval(workItemDirectory, planContents, digestOverride) {
  const digest =
    digestOverride ??
    createHash('sha256')
      .update(Buffer.from(planContents, 'utf8'))
      .digest('hex');
  writeArtifact(
    workItemDirectory,
    'approval.md',
    artifact(
      'approval',
      'plan@1',
      'approved',
      `\nApproved plan SHA-256: \`${digest}\`\nApproved by: \`user\`\nApproval source: \`User approved the implementation plan.\`\n`,
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

test('a ready plan without approval blocks for explicit user approval', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
  addContext(fixture.workItemDirectory);
  addContract(fixture.workItemDirectory);
  addPlan(fixture.workItemDirectory);
  writeActiveState(fixture.root, workItemId, 'record-monorepo-approval');

  const result = runValidator(fixture.root);

  assert.equal(result.status, 0);
  assert.equal(result.json.valid, true);
  assert.equal(result.json.nextSkill, null);
  assert.match(result.json.blocker, /explicit user approval/i);
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
  const awaitingApproval = runValidator(fixture.root);
  assert.equal(awaitingApproval.status, 0);
  assert.equal(awaitingApproval.json.valid, true);
  assert.equal(awaitingApproval.json.nextSkill, null);
  assert.match(awaitingApproval.json.blocker, /explicit user approval/i);

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
  assert.equal(afterPlanRevision.json.nextSkill, null);
  assert.match(afterPlanRevision.json.blocker, /explicit user approval/i);
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
