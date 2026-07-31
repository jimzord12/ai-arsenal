import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { calculateReviewSnapshot } from './calculate-review-snapshot.mjs';
import { reconcileReviewBatch } from './reconcile-review-batch.mjs';

const root = process.cwd();
const autonomousApprovalSource = 'policy:ai-arsenal-autonomy-v1';
const artifactDefinitions = [
  {
    key: 'request',
    file: 'request.md',
    statuses: ['ready'],
    prerequisites: [],
  },
  {
    key: 'context',
    file: 'context.md',
    statuses: ['ready'],
    prerequisites: ['request'],
  },
  {
    key: 'contract',
    file: 'change-contract.md',
    statuses: ['ready'],
    prerequisites: ['request', 'context'],
  },
  {
    key: 'plan',
    file: 'implementation-plan.md',
    statuses: ['ready'],
    prerequisites: ['contract'],
  },
  {
    key: 'approval',
    file: 'approval.md',
    statuses: ['approved'],
    prerequisites: ['plan'],
  },
  {
    key: 'implementation',
    file: 'implementation-report.md',
    statuses: ['ready'],
    prerequisites: ['contract', 'plan', 'approval'],
  },
  {
    key: 'verification',
    file: 'verification.md',
    statuses: ['passed', 'failed'],
    prerequisites: ['contract', 'plan', 'implementation'],
  },
  {
    key: 'reconciliation',
    file: 'reconciliation.md',
    statuses: ['passed'],
    prerequisites: ['verification'],
  },
];
const revisionRequestDefinition = {
  key: 'revision-request',
  file: 'revision-request.md',
  statuses: ['ready'],
  prerequisites: [],
};
const artifactByKey = new Map(
  [...artifactDefinitions, revisionRequestDefinition].map((definition) => [
    definition.key,
    definition,
  ]),
);
const workItemPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const immutablePreReviewBatchRecords = new Map([
  [
    '2026-07-29-workflow-v2',
    '4a4b0348d7bcac172def0598bd7cfd9607621f67a010d4ec635aff682fb48864',
  ],
  [
    '2026-07-30-add-weekly-report-cli-foundation',
    '7e8d0fd11ccb4f4b2b9a779c7c85aa36d0153ff0ec8fc8c076271d6940c97f8e',
  ],
  [
    '2026-07-30-fix-trello-mutation-recovery',
    '8e421437d351accc64fe29c2acded21eeeef2566f947db3f84517913e74a1bfc',
  ],
  [
    '2026-07-30-make-trello-skills-install-self-contained',
    '72057502d19fe5af9948c150223a2be2ffff495f69952acabf7bf4d525031d50',
  ],
  [
    '2026-07-30-reconcile-next',
    '24cd9e096d3691b6ca4c85642dfde21ab98326d80e1af08c377f7b7734476461',
  ],
  [
    '2026-07-31-add-git-evidence-collector',
    'b14afac1de48397ab53bdd56828e998ee082013b6629aad24efaafd5c0ba0eb4',
  ],
  [
    '2026-07-31-deterministic-review-snapshot',
    'd355defcb756b233d38c6af182479f6f054988b6c9389f461e802e71e3134976',
  ],
  [
    '2026-07-31-filter-all-open-trello-cards-by-member',
    'e82707d173e03eb71473a095fffaac2e4d2bdc5ebd15b375a0ef64a8407c430c',
  ],
  [
    '2026-07-31-filter-trello-card-members',
    '7184c879e492536241c5ea6aa888fe3c24169c6edb64f9aefbdfc770cf4b730c',
  ],
  [
    '2026-07-31-model-workflow-review-lifecycle',
    'b67ba3128ba67a8b4b3acfc4837a435619ac96ab1c427704f29af6fae8b38d7c',
  ],
  [
    '2026-07-31-recover-git-evidence-collector',
    'dd153ade7d78ec93a0909feb4543e091b0e2b4f888df241b73640c78df0b56a9',
  ],
]);

function parseArguments(argv) {
  let workItem = null;
  let current = false;
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
    if (argument === '--current') {
      if (current) throw new Error('Duplicate argument: --current');
      current = true;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (workItem === null && !current)
    throw new Error('Missing required argument: --work-item');
  if (workItem !== null && current) {
    throw new Error('--work-item and --current cannot be combined');
  }
  if (
    workItem !== null &&
    workItem !== 'none' &&
    !workItemPattern.test(workItem)
  ) {
    throw new Error(
      'Work-item ID must match YYYY-MM-DD-lowercase-kebab-slug or be none',
    );
  }
  return { workItem, current, json };
}

function result(workItem, valid, nextSkill, blocker, artifacts = {}) {
  return { workItem, valid, nextSkill, blocker, artifacts };
}

function parseActiveState() {
  const nextPath = path.join(root, 'NEXT.md');
  if (!fs.existsSync(nextPath)) {
    throw new Error(
      'NEXT.md must contain exactly one active work-item field and one pipeline-step field',
    );
  }

  const contents = fs.readFileSync(nextPath, 'utf8');
  const activeMatches = [
    ...contents.matchAll(/^\*\*Active work item:\*\* `([^`]+)`\r?$/gm),
  ];
  const stepMatches = [
    ...contents.matchAll(/^\*\*Pipeline step:\*\* `([^`]+)`\r?$/gm),
  ];

  if (activeMatches.length !== 1 || stepMatches.length !== 1) {
    throw new Error(
      'NEXT.md must contain exactly one active work-item field and one pipeline-step field',
    );
  }

  const activeWorkItem = activeMatches[0][1];
  const pipelineStep = stepMatches[0][1];
  if (activeWorkItem !== 'none' && !workItemPattern.test(activeWorkItem)) {
    throw new Error('NEXT.md contains a malformed active work-item ID');
  }
  if (
    pipelineStep !== 'none' &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pipelineStep)
  ) {
    throw new Error('NEXT.md contains a malformed pipeline step');
  }
  if ((activeWorkItem === 'none') !== (pipelineStep === 'none')) {
    throw new Error(
      'NEXT.md active work item and pipeline step must both be none or both be set',
    );
  }
  return { activeWorkItem, pipelineStep };
}

function parseArtifact(contents, definition, workItem) {
  const lines = contents.split(/\r?\n/);
  const expectedPrefixes = [
    'Work item: ',
    'Artifact: ',
    'Revision: ',
    'Prerequisites: ',
    'Status: ',
  ];
  for (let index = 0; index < expectedPrefixes.length; index += 1) {
    if (!lines[index]?.startsWith(expectedPrefixes[index])) {
      throw new Error(
        `${definition.file} has a malformed header at line ${index + 1}`,
      );
    }
  }

  const parsed = {
    workItem: lines[0].slice(expectedPrefixes[0].length),
    type: lines[1].slice(expectedPrefixes[1].length),
    revisionText: lines[2].slice(expectedPrefixes[2].length),
    prerequisitesText: lines[3].slice(expectedPrefixes[3].length),
    status: lines[4].slice(expectedPrefixes[4].length),
  };

  if (parsed.workItem !== workItem) {
    throw new Error(`${definition.file} has a mismatched work-item ID`);
  }
  if (parsed.type !== definition.key) {
    throw new Error(`${definition.file} has artifact type ${parsed.type}`);
  }
  if (!/^[1-9]\d*$/.test(parsed.revisionText)) {
    throw new Error(`${definition.file} revision must be a positive integer`);
  }
  if (!definition.statuses.includes(parsed.status)) {
    throw new Error(
      `${definition.file} has illegal current status ${parsed.status}`,
    );
  }

  return {
    revision: Number(parsed.revisionText),
    status: parsed.status,
    prerequisitesText: parsed.prerequisitesText,
  };
}

function revisionExists(workItemDirectory, artifactKey, revision) {
  const definition = artifactByKey.get(artifactKey);
  const currentPath = path.join(workItemDirectory, definition.file);
  if (fs.existsSync(currentPath)) {
    const currentRevision = fs
      .readFileSync(currentPath, 'utf8')
      .split(/\r?\n/)[2];
    if (currentRevision === `Revision: ${revision}`) return true;
  }
  return fs.existsSync(
    path.join(
      workItemDirectory,
      'revisions',
      definition.file,
      `v${revision}.md`,
    ),
  );
}

function validateArchivedRevisions(workItemDirectory, definition, artifact) {
  if (artifact.revision === 1) return;

  for (let revision = 1; revision < artifact.revision; revision += 1) {
    const archivePath = path.join(
      workItemDirectory,
      'revisions',
      definition.file,
      `v${revision}.md`,
    );
    if (!fs.existsSync(archivePath)) {
      throw new Error(
        `${definition.file} revision ${artifact.revision} is missing archived v${revision}`,
      );
    }
    const archiveLines = fs.readFileSync(archivePath, 'utf8').split(/\r?\n/);
    const expectedIdentity = [
      `Work item: ${path.basename(workItemDirectory)}`,
      `Artifact: ${definition.key}`,
      `Revision: ${revision}`,
    ];
    if (expectedIdentity.some((line, index) => archiveLines[index] !== line)) {
      throw new Error(
        `${definition.file} archived v${revision} has inconsistent identity`,
      );
    }
    if (!archiveLines[3]?.startsWith('Prerequisites: ')) {
      throw new Error(
        `${definition.file} archived v${revision} has a malformed prerequisite header`,
      );
    }
    if (archiveLines[4] !== 'Status: superseded') {
      throw new Error(
        `${definition.file} archived v${revision} must have superseded status`,
      );
    }

    const prerequisiteText = archiveLines[3].slice('Prerequisites: '.length);
    if (definition.prerequisites.length === 0) {
      if (prerequisiteText !== 'none') {
        throw new Error(
          `${definition.file} archived v${revision} prerequisites must be none`,
        );
      }
      continue;
    }

    const prerequisiteEntries = prerequisiteText.split(',');
    if (prerequisiteEntries.length !== definition.prerequisites.length) {
      throw new Error(
        `${definition.file} archived v${revision} has malformed prerequisites`,
      );
    }
    for (let index = 0; index < definition.prerequisites.length; index += 1) {
      const expectedKey = definition.prerequisites[index];
      const match = prerequisiteEntries[index].match(/^([a-z]+)@([1-9]\d*)$/);
      if (!match || match[1] !== expectedKey) {
        throw new Error(
          `${definition.file} archived v${revision} has malformed prerequisites`,
        );
      }
      const prerequisiteRevision = Number(match[2]);
      if (
        !revisionExists(workItemDirectory, expectedKey, prerequisiteRevision)
      ) {
        throw new Error(
          `${definition.file} archived v${revision} references missing ${expectedKey}@${prerequisiteRevision}`,
        );
      }
    }
  }
}

function validateActiveRoute(activeState, output) {
  if (!activeState) return output;

  const complete =
    Boolean(output.artifacts.reconciliation) &&
    !output.artifacts.revisionRequest;
  if (complete) {
    if (
      activeState.activeWorkItem !== 'none' ||
      activeState.pipelineStep !== 'none'
    ) {
      throw new Error(
        'Completed work item must have its active registration cleared',
      );
    }
    return output;
  }

  if (activeState.activeWorkItem !== output.workItem) {
    throw new Error(
      `NEXT.md active work item ${activeState.activeWorkItem} does not match ${output.workItem}`,
    );
  }
  const expectedStep =
    output.nextSkill ??
    (output.artifacts.plan && !output.artifacts.approval
      ? 'record-monorepo-approval'
      : null);
  if (!expectedStep || activeState.pipelineStep !== expectedStep) {
    throw new Error(
      `NEXT.md pipeline step ${activeState.pipelineStep} does not match ${expectedStep ?? 'none'}`,
    );
  }
  return output;
}

function validateApproval(workItemDirectory, planContents, contractContents) {
  const approvalPath = path.join(workItemDirectory, 'approval.md');
  const approval = fs.readFileSync(approvalPath, 'utf8');
  const digestMatches = [
    ...approval.matchAll(/^Approved plan SHA-256: `([0-9a-f]{64})`\r?$/gm),
  ];
  const approvedByMatches = [
    ...approval.matchAll(/^Approved by: `([^`]+)`\r?$/gm),
  ];
  const sourceMatches = [
    ...approval.matchAll(/^Approval source: `([^`]+)`\r?$/gm),
  ];
  if (
    digestMatches.length !== 1 ||
    approvedByMatches.length !== 1 ||
    sourceMatches.length !== 1
  ) {
    throw new Error(
      'approval.md must contain each approval field exactly once',
    );
  }
  if (!['user', 'autonomous-agent'].includes(approvedByMatches[0][1])) {
    throw new Error(
      'approval.md Approved by field must be user or autonomous-agent',
    );
  }
  if (sourceMatches[0][1].trim().length === 0) {
    throw new Error('approval.md Approval source must not be empty');
  }
  if (
    approvedByMatches[0][1] === 'autonomous-agent' &&
    sourceMatches[0][1] !== autonomousApprovalSource
  ) {
    throw new Error(
      `approval.md autonomous Approval source must be ${autonomousApprovalSource}`,
    );
  }
  const dangerousMatches = [
    ...contractContents.matchAll(
      /^Dangerous deletion or irreversible data loss: `(yes|no)`\r?$/gm,
    ),
  ];
  const prerequisiteMatches = [
    ...contractContents.matchAll(
      /^Hard prerequisites: `(resolved|blocked)`\r?$/gm,
    ),
  ];
  if (dangerousMatches.length > 1 || prerequisiteMatches.length > 1) {
    throw new Error(
      'contract authority classification fields must appear at most once',
    );
  }
  if (
    prerequisiteMatches.length === 1 &&
    prerequisiteMatches[0][1] !== 'resolved'
  ) {
    throw new Error(
      'approval cannot bypass blocked hard prerequisites; resolve or escalate them',
    );
  }
  if (approvedByMatches[0][1] === 'autonomous-agent') {
    if (dangerousMatches.length !== 1 || prerequisiteMatches.length !== 1) {
      throw new Error(
        'autonomous approval requires exactly one contract authority classification',
      );
    }
    if (dangerousMatches[0][1] !== 'no') {
      throw new Error(
        'autonomous approval cannot authorize dangerous deletion or irreversible data loss',
      );
    }
  }

  const expectedDigest = createHash('sha256')
    .update(Buffer.from(planContents, 'utf8'))
    .digest('hex');
  if (digestMatches[0][1] !== expectedDigest) {
    throw new Error('approval.md plan digest is stale or incorrect');
  }
}

function parseRevisionRequestBody(contents, label) {
  const targetMatches = [
    ...contents.matchAll(/^Revision target: `([^`]+)`\r?$/gm),
  ];
  const sourceMatches = [
    ...contents.matchAll(/^Revision source: `([^`]+)`\r?$/gm),
  ];
  if (targetMatches.length !== 1 || sourceMatches.length !== 1) {
    throw new Error(
      `${label} must contain Revision target and Revision source exactly once`,
    );
  }
  const target = targetMatches[0][1];
  if (target !== 'contract' && target !== 'plan') {
    throw new Error(`${label} target must be contract or plan`);
  }
  if (sourceMatches[0][1].trim().length === 0) {
    throw new Error(`${label} Revision source must not be empty`);
  }
  return target;
}

function validateRevisionRequestArchives(workItemDirectory, revisionRequest) {
  for (let revision = 1; revision < revisionRequest.revision; revision += 1) {
    const archivePath = path.join(
      workItemDirectory,
      'revisions',
      revisionRequestDefinition.file,
      `v${revision}.md`,
    );
    if (!fs.existsSync(archivePath)) {
      throw new Error(
        `revision-request.md revision ${revisionRequest.revision} is missing archived v${revision}`,
      );
    }
    const contents = fs.readFileSync(archivePath, 'utf8');
    const lines = contents.split(/\r?\n/);
    if (
      lines[0] !== `Work item: ${path.basename(workItemDirectory)}` ||
      lines[1] !== 'Artifact: revision-request' ||
      lines[2] !== `Revision: ${revision}` ||
      lines[4] !== 'Status: superseded'
    ) {
      throw new Error(
        `revision-request.md archived v${revision} has inconsistent identity or status`,
      );
    }
    const target = parseRevisionRequestBody(
      contents,
      `revision-request.md archived v${revision}`,
    );
    const prerequisiteMatch = lines[3]?.match(
      /^Prerequisites: (contract|plan)@([1-9]\d*)$/,
    );
    if (!prerequisiteMatch || prerequisiteMatch[1] !== target) {
      throw new Error(
        `revision-request.md archived v${revision} has malformed prerequisites`,
      );
    }
    if (
      !revisionExists(workItemDirectory, target, Number(prerequisiteMatch[2]))
    ) {
      throw new Error(
        `revision-request.md archived v${revision} references a missing target revision`,
      );
    }
  }
}

const v2StageSkills = {
  define: 'define-monorepo-change',
  implement: 'implement-monorepo-change',
  review: 'review-monorepo-change',
  verify: 'verify-monorepo-change',
  deliver: 'deliver-monorepo-change',
};

function readSingleField(contents, label, pattern) {
  const matches = [
    ...contents.matchAll(new RegExp(`^${label}: (.+)\\r?$`, 'gm')),
  ];
  if (matches.length !== 1 || !pattern.test(matches[0][1])) {
    throw new Error(`work-item.md must contain one valid ${label} field`);
  }
  return matches[0][1];
}

function parseJsonReviewField(contents, label) {
  const value = readSingleField(contents, label, /^.+$/);
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must contain valid JSON`);
  }
}

function validateReviewBatchEvidence({
  contents,
  workItemPath,
  stage,
  status,
  reviewStatus,
  reviewSnapshot,
}) {
  const labels = ['Review batch', 'Review expected', 'Review received'];
  const matches = labels.map((label) => [
    ...contents.matchAll(new RegExp(`^${label}: (.+)\\r?$`, 'gm')),
  ]);
  const fieldCount = matches.reduce((total, fieldMatches) => {
    return total + fieldMatches.length;
  }, 0);

  if (fieldCount === 0) {
    if (
      stage === 'deliver' &&
      status === 'delivered' &&
      isImmutablePreReviewBatchRecord(workItemPath, contents)
    ) {
      return { historical: true, blocker: null };
    }
    throw new Error(
      'Current review evidence requires Review batch, Review expected, and Review received exactly once; reset all three fields to pending and re-review',
    );
  }
  if (matches.some((fieldMatches) => fieldMatches.length !== 1)) {
    throw new Error(
      'Review batch, Review expected, and Review received must each appear exactly once',
    );
  }

  const batchId = matches[0][0][1];
  const expectedText = matches[1][0][1];
  const receivedText = matches[2][0][1];
  const pendingFields = [batchId, expectedText, receivedText].filter(
    (value) => value === 'pending',
  ).length;
  if (pendingFields > 0) {
    if (
      pendingFields !== 3 ||
      reviewStatus !== 'pending' ||
      reviewSnapshot !== 'pending'
    ) {
      throw new Error(
        'Pending review evidence requires status, snapshot, batch, expected, and received fields all reset to pending before re-review',
      );
    }
    if (stage !== 'review' && stage !== 'implement' && stage !== 'define') {
      throw new Error(
        'Review status must be passed before verify or deliver; complete a fresh matching review batch',
      );
    }
    return {
      historical: false,
      blocker:
        'Review has not been dispatched; record a fresh snapshot and complete review batch.',
    };
  }

  const expectedReviewers = parseJsonReviewField(contents, 'Review expected');
  const receivedResults = parseJsonReviewField(contents, 'Review received');
  if (!Array.isArray(expectedReviewers)) {
    throw new Error('Review expected must contain a JSON array');
  }
  if (!Array.isArray(receivedResults)) {
    throw new Error('Review received must contain a JSON array');
  }

  let reconciliation;
  try {
    reconciliation = reconcileReviewBatch({
      batchId,
      snapshot: reviewSnapshot,
      expectedReviewers,
      receivedResults,
    });
  } catch (error) {
    throw new Error(`Review evidence is malformed: ${error.message}`, {
      cause: error,
    });
  }

  const remediation =
    reconciliation.blockers.length > 0
      ? `${reconciliation.blockers.join('; ')}; complete a fresh matching review batch before advancing`
      : null;
  if (stage === 'review') {
    if (reviewStatus !== reconciliation.status) {
      throw new Error(
        `Review status ${reviewStatus} does not match reconciled status ${reconciliation.status}; reconcile and record the complete batch evidence`,
      );
    }
    return { historical: false, blocker: remediation };
  }
  if (reviewStatus !== 'passed') {
    throw new Error(
      'Review status must be passed before verify or deliver; complete a fresh matching review batch',
    );
  }
  if (reconciliation.status !== 'passed') {
    throw new Error(`Review barrier is incomplete: ${remediation}`);
  }
  return { historical: false, blocker: null };
}

function requireGitRepository(repositoryRoot) {
  if (!fs.existsSync(path.join(repositoryRoot, '.git'))) {
    throw new Error(
      'Review freshness requires Git repository metadata; restore the repository context before validating',
    );
  }
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0 || result.stdout.trim() !== 'true') {
    throw new Error(
      'Review freshness requires a readable Git repository; restore the repository context before validating',
    );
  }
}

function isImmutablePreReviewBatchRecord(workItemPath, contents) {
  const workItem = path.basename(path.dirname(workItemPath));
  const expectedHash = immutablePreReviewBatchRecords.get(workItem);
  if (!expectedHash) return false;
  const currentHash = createHash('sha256')
    .update(Buffer.from(contents, 'utf8'))
    .digest('hex');
  return currentHash === expectedHash;
}

function hasUncommittedCandidateChanges(repositoryRoot) {
  const result = spawnSync(
    'git',
    [
      '-c',
      'core.quotepath=false',
      'status',
      '--porcelain=v2',
      '-z',
      '--untracked-files=all',
      '--no-renames',
      '--',
      '.',
      ':(exclude)NEXT.md',
    ],
    { cwd: repositoryRoot, encoding: 'buffer', windowsHide: true },
  );
  if (result.error || result.status !== 0) {
    throw new Error('Git could not inspect delivered candidate freshness');
  }
  return result.stdout.length > 0;
}

function validateV2ActiveRoute(activeState, output) {
  const complete = output.artifacts.workItem.status === 'delivered';
  if (complete) {
    if (
      activeState.activeWorkItem !== 'none' ||
      activeState.pipelineStep !== 'none'
    ) {
      throw new Error(
        'Delivered v2 work item must have its active registration cleared',
      );
    }
    return output;
  }
  if (activeState.activeWorkItem !== output.workItem) {
    throw new Error(
      `NEXT.md active work item ${activeState.activeWorkItem} does not match ${output.workItem}`,
    );
  }
  const expectedStep = v2StageSkills[output.artifacts.workItem.stage];
  if (activeState.pipelineStep !== expectedStep) {
    throw new Error(
      `NEXT.md pipeline step ${activeState.pipelineStep} does not match ${expectedStep}`,
    );
  }
  return output;
}

function validateV2WorkItem(workItem, workItemDirectory, activeState) {
  const workItemPath = path.join(workItemDirectory, 'work-item.md');
  const contents = fs.readFileSync(workItemPath, 'utf8');
  const identity = readSingleField(contents, 'Work item', workItemPattern);
  if (identity !== workItem) {
    throw new Error('work-item.md has a mismatched work-item ID');
  }
  const workflow = readSingleField(contents, 'Workflow', /^2$/);
  const stage = readSingleField(
    contents,
    'Stage',
    /^(define|implement|review|verify|deliver)$/,
  );
  const status = readSingleField(
    contents,
    'Status',
    /^(active|blocked|delivered)$/,
  );
  const startedAt = readSingleField(contents, 'Started at', /^\S+$/);
  readSingleField(contents, 'Max time', /^[1-9]\d* (?:minutes?|hours?)$/);
  const lastTimeCheck = readSingleField(contents, 'Last time check', /^\S+$/);
  const turnsSinceTimeCheck = Number(
    readSingleField(contents, 'Turns since time check', /^\d+$/),
  );
  const reviewCycles = Number(
    readSingleField(contents, 'Review cycles', /^\d+$/),
  );
  const reviewStatusMatches = [
    ...contents.matchAll(/^Review status: (.+)\r?$/gm),
  ];
  const reviewSnapshotMatches = [
    ...contents.matchAll(/^Review snapshot: (.+)\r?$/gm),
  ];
  const legacyRequiredFindingsMatches = [
    ...contents.matchAll(/^Required findings remaining: (.+)\r?$/gm),
  ];
  const usesExplicitReviewLifecycle =
    reviewStatusMatches.length > 0 || reviewSnapshotMatches.length > 0;
  let reviewStatus;
  let reviewSnapshot;
  let reviewBarrier;
  if (usesExplicitReviewLifecycle) {
    if (legacyRequiredFindingsMatches.length > 0) {
      throw new Error(
        'work-item.md cannot mix explicit review lifecycle fields with Required findings remaining',
      );
    }
    reviewStatus = readSingleField(
      contents,
      'Review status',
      /^(pending|failed|passed)$/,
    );
    reviewSnapshot = readSingleField(
      contents,
      'Review snapshot',
      /^(pending|sha256:[0-9a-f]{64})$/,
    );
    if (
      reviewStatus === 'pending' &&
      reviewSnapshot !== 'pending' &&
      stage !== 'review'
    ) {
      throw new Error('A pending snapshot digest is valid only during review');
    }
    if (reviewStatus !== 'pending' && reviewSnapshot === 'pending') {
      throw new Error(
        `${reviewStatus === 'passed' ? 'Passed' : 'Failed'} review requires a concrete snapshot`,
      );
    }
    reviewBarrier = validateReviewBatchEvidence({
      contents,
      workItemPath,
      stage,
      status,
      reviewStatus,
      reviewSnapshot,
    });
  } else {
    if (
      legacyRequiredFindingsMatches.length !== 1 ||
      !/^(yes|no)$/.test(legacyRequiredFindingsMatches[0][1])
    ) {
      throw new Error(
        'work-item.md must contain one valid Review status field and one valid Review snapshot field',
      );
    }
    if (
      stage !== 'deliver' ||
      status !== 'delivered' ||
      legacyRequiredFindingsMatches[0][1] !== 'no' ||
      !isImmutablePreReviewBatchRecord(workItemPath, contents)
    ) {
      throw new Error(
        'Required findings remaining is supported only for immutable delivered historical records',
      );
    }
    reviewStatus = 'passed';
    reviewSnapshot = null;
    reviewBarrier = { historical: true, blocker: null };
  }
  const dangerous = readSingleField(
    contents,
    'Dangerous deletion or irreversible data loss',
    /^(yes|no)$/,
  );
  const hardPrerequisites = readSingleField(
    contents,
    'Hard prerequisites',
    /^(resolved|blocked)$/,
  );
  const approval = readSingleField(
    contents,
    'Approval',
    /^(not-required|required|approved)$/,
  );
  const approvalSource = readSingleField(contents, 'Approval source', /^.+$/);

  for (const timestamp of [startedAt, lastTimeCheck]) {
    if (Number.isNaN(Date.parse(timestamp))) {
      throw new Error('work-item.md timestamps must be parseable');
    }
  }
  if (turnsSinceTimeCheck >= 5) {
    throw new Error(
      'Recorded time check is overdue; record a proportionality check and reset Turns since time check',
    );
  }
  if (reviewCycles > 4) {
    throw new Error('Review cycles cannot exceed four');
  }
  const awaitingDangerousApproval =
    dangerous === 'yes' && approval === 'required' && approvalSource === 'none';
  const exhaustedReview =
    stage === 'review' && reviewCycles === 4 && reviewStatus === 'failed';
  if (hardPrerequisites === 'blocked' && status !== 'blocked') {
    throw new Error('Blocked hard prerequisites require blocked status');
  }
  if (dangerous === 'yes') {
    if (approval === 'required') {
      if (approvalSource !== 'none' || status !== 'blocked') {
        throw new Error(
          'Dangerous work awaiting direct approval requires blocked status and Approval source: none',
        );
      }
    } else if (approval !== 'approved' || approvalSource === 'none') {
      throw new Error('Dangerous work requires direct approval and its source');
    }
  } else if (approval !== 'not-required') {
    throw new Error('Routine v2 work must use Approval: not-required');
  }
  if (status === 'active' && exhaustedReview) {
    throw new Error(
      'Required findings must be blocked after four review cycles',
    );
  }
  if (
    status === 'blocked' &&
    hardPrerequisites !== 'blocked' &&
    !awaitingDangerousApproval &&
    !exhaustedReview
  ) {
    throw new Error(
      'Blocked status requires an unavailable hard prerequisite, pending dangerous approval, or four exhausted review cycles',
    );
  }
  if (status === 'delivered' && stage !== 'deliver') {
    throw new Error('Delivered status requires the deliver stage');
  }
  if (status !== 'delivered' && stage === 'deliver' && status !== 'active') {
    throw new Error('Deliver stage must be active or delivered');
  }

  const sectionBodies = new Map();
  for (const heading of [
    '## Goal',
    '## Non-goals',
    '## Acceptance criteria',
    '## Implementation summary',
    '## Review findings and repairs',
    '## Final verification',
  ]) {
    const matches = [...contents.matchAll(new RegExp(`^${heading}$`, 'gm'))];
    if (matches.length !== 1) {
      throw new Error(`work-item.md must contain ${heading} exactly once`);
    }
    const bodyStart = matches[0].index + heading.length;
    const body = contents.slice(bodyStart).split(/^## /m, 1)[0].trim();
    if (!body) throw new Error(`${heading} must not be empty`);
    sectionBodies.set(heading, body);
  }

  const stageIndex = [
    'define',
    'implement',
    'review',
    'verify',
    'deliver',
  ].indexOf(stage);
  if (
    stageIndex >= 2 &&
    /^Pending\.$/i.test(sectionBodies.get('## Implementation summary'))
  ) {
    throw new Error(
      'Implementation summary cannot remain Pending after implement',
    );
  }
  if (
    stageIndex >= 3 &&
    /^Pending\.$/i.test(sectionBodies.get('## Review findings and repairs'))
  ) {
    throw new Error(
      'Review findings and repairs cannot remain Pending at verify',
    );
  }
  const finalVerificationBody = sectionBodies.get('## Final verification');
  const finalVerificationMatches = [
    ...finalVerificationBody.matchAll(/^Result: (pending|passed|failed)\r?$/gm),
  ];
  if (finalVerificationMatches.length !== 1) {
    throw new Error(
      'Final verification must contain exactly one Result: pending, passed, or failed',
    );
  }
  const finalVerificationResult = finalVerificationMatches[0][1];
  if (stageIndex >= 4 && finalVerificationResult !== 'passed') {
    throw new Error('Deliver requires explicit passed final verification');
  }

  if (
    !reviewBarrier.historical &&
    (stage === 'verify' || (stage === 'deliver' && status === 'active'))
  ) {
    requireGitRepository(root);
    const currentSnapshot = calculateReviewSnapshot({
      repositoryRoot: root,
      workItemPath,
    });
    if (currentSnapshot !== reviewSnapshot) {
      throw new Error(
        'Review snapshot is stale for the current candidate; reset review evidence and re-review the fresh candidate before advancing',
      );
    }
  }
  if (!reviewBarrier.historical && status === 'delivered') {
    requireGitRepository(root);
    if (hasUncommittedCandidateChanges(root)) {
      throw new Error(
        'Delivered candidate has uncommitted changes; restore the delivered snapshot or reopen the item for fresh review',
      );
    }
  }

  const currentV1Files = artifactDefinitions
    .map((definition) => definition.file)
    .concat(revisionRequestDefinition.file)
    .filter((file) => fs.existsSync(path.join(workItemDirectory, file)));
  if (currentV1Files.length > 0) {
    throw new Error(
      `Workflow v2 permits one compact current record; remove v1 artifact(s): ${currentV1Files.join(', ')}`,
    );
  }

  const artifact = {
    workflow: Number(workflow),
    stage,
    status,
    reviewCycles,
    reviewStatus,
    reviewSnapshot,
    turnsSinceTimeCheck,
  };
  let blocker = stage === 'review' ? reviewBarrier.blocker : null;
  let nextSkill = status === 'delivered' ? null : v2StageSkills[stage];
  if (status === 'blocked') {
    nextSkill = null;
    if (awaitingDangerousApproval) {
      blocker = 'Dangerous work is awaiting direct approval.';
    } else if (hardPrerequisites === 'blocked') {
      blocker = 'A hard prerequisite is blocked.';
    } else {
      blocker = 'Required findings remain after four review cycles.';
    }
  } else if (status === 'delivered') {
    blocker = 'Work item is delivered.';
  }
  return validateV2ActiveRoute(
    activeState,
    result(workItem, true, nextSkill, blocker, { workItem: artifact }),
  );
}

function validateWorkItem(workItem, activeState) {
  const artifacts = {};
  const finish = (output) => validateActiveRoute(activeState, output);

  const workItemsRoot = path.resolve(root, 'docs', 'work-items');
  const workItemDirectory = path.resolve(workItemsRoot, workItem);
  if (!workItemDirectory.startsWith(`${workItemsRoot}${path.sep}`)) {
    throw new Error('Work-item path escapes docs/work-items');
  }

  if (fs.existsSync(path.join(workItemDirectory, 'work-item.md'))) {
    return validateV2WorkItem(workItem, workItemDirectory, activeState);
  }

  const existing = artifactDefinitions.map((definition) =>
    fs.existsSync(path.join(workItemDirectory, definition.file)),
  );
  const firstMissing = existing.indexOf(false);
  if (firstMissing !== -1 && existing.slice(firstMissing + 1).some(Boolean)) {
    throw new Error('Work-item artifacts contain a pipeline-order gap');
  }

  for (let index = 0; index < artifactDefinitions.length; index += 1) {
    if (!existing[index]) break;
    const definition = artifactDefinitions[index];
    const artifactPath = path.join(workItemDirectory, definition.file);
    const contents = fs.readFileSync(artifactPath, 'utf8');
    const artifact = parseArtifact(contents, definition, workItem);
    validateArchivedRevisions(workItemDirectory, definition, artifact);

    const expectedPrerequisites = definition.prerequisites
      .map((key) => {
        const prerequisite = artifacts[key];
        if (!prerequisite) {
          throw new Error(
            `${definition.file} is missing prerequisite artifact ${key}`,
          );
        }
        return `${key}@${prerequisite.revision}`;
      })
      .join(',');
    const expectedText = expectedPrerequisites || 'none';
    if (artifact.prerequisitesText !== expectedText) {
      throw new Error(
        `${definition.file} prerequisites must be ${expectedText}`,
      );
    }

    artifacts[definition.key] = {
      revision: artifact.revision,
      status: artifact.status,
    };
  }

  const revisionRequestPath = path.join(
    workItemDirectory,
    revisionRequestDefinition.file,
  );
  if (fs.existsSync(revisionRequestPath)) {
    const contents = fs.readFileSync(revisionRequestPath, 'utf8');
    const revisionRequest = parseArtifact(
      contents,
      revisionRequestDefinition,
      workItem,
    );
    validateRevisionRequestArchives(workItemDirectory, revisionRequest);
    const target = parseRevisionRequestBody(contents, 'revision-request.md');
    const targetArtifact = artifacts[target];
    if (!targetArtifact) {
      throw new Error(
        `revision-request.md target ${target} does not exist in current state`,
      );
    }
    const expectedPrerequisite = `${target}@${targetArtifact.revision}`;
    if (revisionRequest.prerequisitesText !== expectedPrerequisite) {
      throw new Error(
        `revision-request.md prerequisite is stale; expected ${expectedPrerequisite}`,
      );
    }
    artifacts.revisionRequest = {
      revision: revisionRequest.revision,
      status: revisionRequest.status,
      target,
    };
  }

  if (artifacts.approval) {
    const planPath = path.join(
      workItemDirectory,
      artifactByKey.get('plan').file,
    );
    const contractPath = path.join(
      workItemDirectory,
      artifactByKey.get('contract').file,
    );
    validateApproval(
      workItemDirectory,
      fs.readFileSync(planPath, 'utf8'),
      fs.readFileSync(contractPath, 'utf8'),
    );
  }
  if (artifacts.reconciliation && artifacts.verification.status !== 'passed') {
    throw new Error('reconciliation requires passed verification');
  }

  if (artifacts.revisionRequest) {
    return finish(
      result(
        workItem,
        true,
        artifacts.revisionRequest.target === 'contract'
          ? 'scope-monorepo-change'
          : 'plan-monorepo-change',
        null,
        artifacts,
      ),
    );
  }

  if (!artifacts.request) {
    return finish(
      result(workItem, true, 'capture-monorepo-change', null, artifacts),
    );
  }
  if (!artifacts.context) {
    return finish(
      result(workItem, true, 'orient-monorepo-change', null, artifacts),
    );
  }
  if (!artifacts.contract) {
    return finish(
      result(workItem, true, 'scope-monorepo-change', null, artifacts),
    );
  }
  if (!artifacts.plan) {
    return finish(
      result(workItem, true, 'plan-monorepo-change', null, artifacts),
    );
  }
  if (!artifacts.approval) {
    return finish(
      result(workItem, true, 'record-monorepo-approval', null, artifacts),
    );
  }
  if (!artifacts.implementation) {
    return finish(
      result(workItem, true, 'implement-monorepo-change', null, artifacts),
    );
  }
  if (!artifacts.verification) {
    return finish(
      result(workItem, true, 'verify-monorepo-change', null, artifacts),
    );
  }
  if (artifacts.verification.status === 'failed') {
    return finish(
      result(
        workItem,
        true,
        'implement-monorepo-change',
        'Required verification failed; repair within the approved contract.',
        artifacts,
      ),
    );
  }
  if (!artifacts.reconciliation) {
    return finish(
      result(workItem, true, 'reconcile-monorepo-change', null, artifacts),
    );
  }
  return finish(
    result(workItem, true, null, 'Work item is complete.', artifacts),
  );
}

function print(output, asJson) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
    return;
  }
  console.log(`Work item: ${output.workItem}`);
  console.log(`Valid: ${output.valid}`);
  console.log(`Next skill: ${output.nextSkill ?? 'none'}`);
  console.log(`Blocker: ${output.blocker ?? 'none'}`);
}

let parsedArguments = {
  workItem: null,
  current: false,
  json: process.argv.includes('--json'),
};
try {
  parsedArguments = parseArguments(process.argv.slice(2));
  const activeState = parseActiveState();
  if (parsedArguments.current) {
    parsedArguments.workItem = activeState.activeWorkItem;
  }
  let output;
  if (parsedArguments.workItem === 'none') {
    if (activeState && activeState.activeWorkItem !== 'none') {
      throw new Error(
        `NEXT.md declares active work item ${activeState.activeWorkItem}`,
      );
    }
    output = result('none', true, null, 'No active work item.', {});
  } else {
    output = validateWorkItem(parsedArguments.workItem, activeState);
  }
  print(output, parsedArguments.json);
} catch (error) {
  const blocker = error instanceof Error ? error.message : String(error);
  const output = result(parsedArguments.workItem, false, null, blocker, {});
  print(output, parsedArguments.json);
  process.exitCode = 1;
}
