import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
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
const artifactByKey = new Map(
  artifactDefinitions.map((definition) => [definition.key, definition]),
);
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

  if (workItem === null)
    throw new Error('Missing required argument: --work-item');
  if (workItem !== 'none' && !workItemPattern.test(workItem)) {
    throw new Error(
      'Work-item ID must match YYYY-MM-DD-lowercase-kebab-slug or be none',
    );
  }
  return { workItem, json };
}

function result(workItem, valid, nextSkill, blocker, artifacts = {}) {
  return { workItem, valid, nextSkill, blocker, artifacts };
}

function parseActiveState() {
  const nextPath = path.join(root, 'NEXT.md');
  if (!fs.existsSync(nextPath)) return null;

  const contents = fs.readFileSync(nextPath, 'utf8');
  const activeMatches = [
    ...contents.matchAll(/^\*\*Active work item:\*\* `([^`]+)`\r?$/gm),
  ];
  const stepMatches = [
    ...contents.matchAll(/^\*\*Pipeline step:\*\* `([^`]+)`\r?$/gm),
  ];

  if (activeMatches.length === 0 && stepMatches.length === 0) return null;
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

  const complete = Boolean(output.artifacts.reconciliation);
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

function validateApproval(workItemDirectory, planContents) {
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
  if (approvedByMatches[0][1] !== 'user') {
    throw new Error('approval.md Approved by field must be user');
  }
  if (sourceMatches[0][1].trim().length === 0) {
    throw new Error('approval.md Approval source must not be empty');
  }

  const expectedDigest = createHash('sha256')
    .update(Buffer.from(planContents, 'utf8'))
    .digest('hex');
  if (digestMatches[0][1] !== expectedDigest) {
    throw new Error('approval.md plan digest is stale or incorrect');
  }
}

function validateWorkItem(workItem, activeState) {
  const artifacts = {};
  const finish = (output) => validateActiveRoute(activeState, output);

  const workItemsRoot = path.resolve(root, 'docs', 'work-items');
  const workItemDirectory = path.resolve(workItemsRoot, workItem);
  if (!workItemDirectory.startsWith(`${workItemsRoot}${path.sep}`)) {
    throw new Error('Work-item path escapes docs/work-items');
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

  if (artifacts.approval) {
    const planPath = path.join(
      workItemDirectory,
      artifactByKey.get('plan').file,
    );
    validateApproval(workItemDirectory, fs.readFileSync(planPath, 'utf8'));
  }
  if (artifacts.reconciliation && artifacts.verification.status !== 'passed') {
    throw new Error('reconciliation requires passed verification');
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
      result(
        workItem,
        true,
        null,
        'Explicit user approval of the current implementation plan is required.',
        artifacts,
      ),
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

let parsedArguments = { workItem: null, json: process.argv.includes('--json') };
try {
  parsedArguments = parseArguments(process.argv.slice(2));
  const activeState = parseActiveState();
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
