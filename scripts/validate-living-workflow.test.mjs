import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validator = path.resolve('scripts/validate-living-workflow.mjs');

const normalSkills = [
  'orchestrate-monorepo-work',
  'capture-monorepo-change',
  'orient-monorepo-change',
  'scope-monorepo-change',
  'plan-monorepo-change',
  'record-monorepo-approval',
  'implement-monorepo-change',
  'verify-monorepo-change',
  'reconcile-monorepo-change',
];

const revisionSkill = 'request-monorepo-revision';

function write(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function createFixture() {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-living-workflow-'));

  write(
    'AGENTS.md',
    `<!-- living-plan-workflow:start -->\n<!-- living-plan-workflow:end -->\nNEXT.md\nCANONICAL_IMPLEMENTATION_PLAN.md\ninitializing-living-plan-workflow\nexecuting-living-plan-phase\nreconciling-living-plan\n${revisionSkill}\n${normalSkills.join('\n')}\n`,
  );
  write(
    'NEXT.md',
    '# NEXT\n\n**Active work item:** `none`\n**Pipeline step:** `none`\n\n## Next Action\nNone.\n\n## Why This Is Next\nNone.\n\n## Requirements\nNone.\n\n## Done When\nNone.\n\n## Source of Truth\nNone.\n',
  );
  write(
    'docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md',
    [
      '# 1. Purpose and Authority',
      '# 4. Current Verified State',
      '# 6. Definition of Done',
      '# 8. Monorepo Work-Item Pipeline and Legacy Plan Maintenance',
      '# 9. Phase Map',
      '# 19. Current Risks',
      '# 20. Current Open Decisions',
      '# 24. Immediate Next Step',
    ].join('\n'),
  );
  write('docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md', '# Pipeline\n');
  write(
    'package.json',
    JSON.stringify({
      scripts: {
        'validate:workflow':
          'node scripts/validate-living-workflow.mjs && node scripts/validate-monorepo-work-item.mjs --current --json',
      },
    }),
  );

  for (const skill of [
    'initializing-living-plan-workflow',
    'executing-living-plan-phase',
    'reconciling-living-plan',
    revisionSkill,
    ...normalSkills,
  ]) {
    const body =
      skill === 'orchestrate-monorepo-work'
        ? '\n## Revision routing\nSelect `request-monorepo-revision` for a direct user revision request or a concrete in-contract defect.\n'
        : skill === 'scope-monorepo-change'
          ? '\n## Contract revision recovery\nConsume `revision-request.md`, archive downstream current artifacts in reverse dependency order, archive the current contract and request, then write `contract@N+1` and route to `plan-monorepo-change`.\n'
          : skill === 'plan-monorepo-change'
            ? '\n## Plan revision recovery\nConsume `revision-request.md`, archive downstream current artifacts in reverse dependency order, archive the current plan and request, then write `plan@N+1` and route to `record-monorepo-approval`.\n'
            : skill === revisionSkill
              ? '\n## Bounded revision intent\nRun for a direct user revision request or concrete in-contract defect. Record `revision-request.md` and route only to `scope-monorepo-change` for contract or `plan-monorepo-change` for plan.\n'
              : '';
    write(
      `.agents/skills/${skill}/SKILL.md`,
      `---\nname: ${skill}\ndescription: Use when validating the fixture.\n---\n${body}`,
    );
  }

  return root;
}

function validate(cwd) {
  return spawnSync(process.execPath, [validator], { cwd, encoding: 'utf8' });
}

let root;

test.afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

test('root workflow test script runs both workflow validator test files', () => {
  const packageManifest = JSON.parse(
    fs.readFileSync(path.resolve('package.json'), 'utf8'),
  );

  assert.match(
    packageManifest.scripts['test:workflow'],
    /validate-living-workflow\.test\.mjs/,
  );
  assert.match(
    packageManifest.scripts['test:workflow'],
    /validate-monorepo-work-item\.test\.mjs/,
  );
});

test('accepts a complete routed-workflow fixture', () => {
  const fixture = createFixture();
  const result = validate(fixture);

  assert.equal(result.status, 0, result.stderr);
});

test('rejects a fixture missing a normal pipeline skill', () => {
  const fixture = createFixture();
  fs.rmSync(
    path.join(fixture, '.agents/skills/verify-monorepo-change/SKILL.md'),
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /verify-monorepo-change/);
});

test('rejects a fixture missing the revision-request skill', () => {
  const fixture = createFixture();
  fs.rmSync(path.join(fixture, `.agents/skills/${revisionSkill}/SKILL.md`));

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /request-monorepo-revision/);
});

test('rejects a fixture whose skill frontmatter name differs from its directory', () => {
  const fixture = createFixture();
  write(
    '.agents/skills/verify-monorepo-change/SKILL.md',
    '---\nname: incorrectly-named-skill\ndescription: Use when validating the fixture.\n---\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /verify-monorepo-change/);
  assert.match(result.stderr, /incorrectly-named-skill/);
});

test('rejects a fixture without the active work-item fields', () => {
  const fixture = createFixture();
  write(
    'NEXT.md',
    '# NEXT\n\n## Next Action\nNone.\n\n## Why This Is Next\nNone.\n\n## Requirements\nNone.\n\n## Done When\nNone.\n\n## Source of Truth\nNone.\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Active work item/);
});

test('rejects root instructions that omit a write-capable skill', () => {
  const fixture = createFixture();
  write(
    'AGENTS.md',
    `<!-- living-plan-workflow:start -->\n<!-- living-plan-workflow:end -->\nNEXT.md\nCANONICAL_IMPLEMENTATION_PLAN.md\ninitializing-living-plan-workflow\nexecuting-living-plan-phase\nreconciling-living-plan\n${normalSkills.filter((skill) => skill !== 'verify-monorepo-change').join('\n')}\n`,
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /verify-monorepo-change/);
});

test('rejects root instructions that retain the broad legacy execution loop', () => {
  const fixture = createFixture();
  fs.appendFileSync(
    path.join(fixture, 'AGENTS.md'),
    '→ execute one approved phase\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /legacy broad execution loop/);
});

test('rejects fixture skills without contract and plan revision recovery rules', () => {
  const fixture = createFixture();
  for (const skill of ['scope-monorepo-change', 'plan-monorepo-change']) {
    write(
      `.agents/skills/${skill}/SKILL.md`,
      `---\nname: ${skill}\ndescription: Use when validating the fixture.\n---\n`,
    );
  }

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /scope-monorepo-change.*revision recovery/i);
  assert.match(result.stderr, /plan-monorepo-change.*revision recovery/i);
});

test('rejects a router that offers revision entry without bounded revision authority', () => {
  const fixture = createFixture();
  write(
    '.agents/skills/orchestrate-monorepo-work/SKILL.md',
    '---\nname: orchestrate-monorepo-work\ndescription: Use when validating the fixture.\n---\nRoute revisions to request-monorepo-revision.\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /orchestrate-monorepo-work.*bounded revision entry/i,
  );
});

test('rejects a root workflow command that bypasses the current registration', () => {
  const fixture = createFixture();
  write(
    'package.json',
    JSON.stringify({
      scripts: {
        'validate:workflow':
          'node scripts/validate-living-workflow.mjs && node scripts/validate-monorepo-work-item.mjs --work-item none --json',
      },
    }),
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /validate:workflow.*--current/i);
});
