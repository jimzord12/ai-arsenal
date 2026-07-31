import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { calculateReviewSnapshot } from './calculate-review-snapshot.mjs';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const validatorPath = path.join(
  scriptsDirectory,
  'validate-monorepo-work-item.mjs',
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
const workItemId = '2026-07-13-example';
const reviewDigest = `sha256:${'a'.repeat(64)}`;
const reviewBatch = 'review-20260731-01';
const reviewExpected = ['contract', 'quality'];

function matchingReviewResults(snapshot = reviewDigest, batchId = reviewBatch) {
  return reviewExpected.map((reviewer) => ({
    reviewer,
    outcome: 'passed',
    batchId,
    snapshot,
  }));
}

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-work-item-'));
  const workItemDirectory = path.join(root, 'docs', 'work-items', workItemId);
  fs.mkdirSync(workItemDirectory, { recursive: true });
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return { root, workItemDirectory };
}

function createNamedFixture(t, id) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-work-item-'));
  const workItemDirectory = path.join(root, 'docs', 'work-items', id);
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

function initializeGitFixture(root) {
  runGit(root, ['init', '--quiet']);
  runGit(root, ['config', 'user.name', 'Workflow Tests']);
  runGit(root, ['config', 'user.email', 'workflow-tests@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '--quiet', '-m', 'fixture baseline']);
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
    finalVerificationResult = stage === 'deliver' ? 'passed' : 'pending',
  } = {},
) {
  writeArtifact(
    workItemDirectory,
    'work-item.md',
    `# Work Item

Work item: ${workItemId}
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
`,
  );
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
  assert.doesNotMatch(template, /^Required findings remaining:/m);
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
  addV2WorkItem(fixture.workItemDirectory, { stage: 'verify' });
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
