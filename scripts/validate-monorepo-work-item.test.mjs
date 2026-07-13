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

function artifact(type, prerequisites, status, body = '') {
  return `Work item: ${workItemId}\nArtifact: ${type}\nRevision: 1\nPrerequisites: ${prerequisites}\nStatus: ${status}\n${body}`;
}

function writeArtifact(workItemDirectory, name, contents) {
  fs.writeFileSync(path.join(workItemDirectory, name), contents, 'utf8');
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

function runValidator(root) {
  const result = spawnSync(
    process.execPath,
    [validatorPath, '--work-item', workItemId, '--json'],
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

  const result = runValidator(fixture.root);

  assert.equal(result.status, 1);
  assert.equal(result.json.valid, false);
  assert.match(result.json.blocker, /archived|header/i);
});

test('validation does not mutate the selected work item', (t) => {
  const fixture = createFixture(t);
  addRequest(fixture.workItemDirectory);
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
