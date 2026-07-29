import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const validator = path.resolve('scripts/validate-living-workflow.mjs');

const normalSkills = [
  'orchestrate-monorepo-work',
  'define-monorepo-change',
  'implement-monorepo-change',
  'review-monorepo-change',
  'verify-monorepo-change',
  'deliver-monorepo-change',
];

const retiredV1Skills = [
  'capture-monorepo-change',
  'orient-monorepo-change',
  'scope-monorepo-change',
  'plan-monorepo-change',
  'record-monorepo-approval',
  'request-monorepo-revision',
  'reconcile-monorepo-change',
];

function write(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function createFixture() {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-living-workflow-'));

  write(
    'AGENTS.md',
    `<!-- living-plan-workflow:start -->\n<!-- living-plan-workflow:end -->\nNEXT.md\nCANONICAL_IMPLEMENTATION_PLAN.md\ninitializing-living-plan-workflow\nexecuting-living-plan-phase\nreconciling-living-plan\n${normalSkills.join('\n')}\n`,
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
    'docs/workflow/WORKFLOW_OVERVIEW.md',
    '# Overview\n\ndefine → implement → review/repair → verify → deliver\none compact `work-item.md`\norchestrate-monorepo-work\ndeliver-monorepo-change\n',
  );
  write(
    '.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md',
    '# Template\n\ndefine → implement → review/repair → verify → deliver\none compact `work-item.md`\norchestrate-monorepo-work\ndeliver-monorepo-change\n',
  );
  write(
    'docs/workflow/templates/work-item/work-item.md',
    '## Goal\n## Non-goals\n## Acceptance criteria\nStarted at:\nMax time:\n## Implementation summary\n## Review findings and repairs\n## Final verification\n',
  );
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
    ...normalSkills,
  ]) {
    const body =
      skill === 'orchestrate-monorepo-work'
        ? '\ndefine → implement → review/repair → verify → deliver\ndefine-monorepo-change\n'
        : '';
    write(
      `.agents/skills/${skill}/SKILL.md`,
      `---\nname: ${skill}\ndescription: Use when validating the fixture.\n---\n${body}`,
    );
  }

  for (const skill of retiredV1Skills) {
    write(
      `.agents/skills/${skill}/SKILL.md`,
      `---\nname: ${skill}\ndescription: Historical Workflow v1 compatibility reference only; never use for new work.\n---\n\n> **Historical Workflow v1 Compatibility:** Never use this skill for new work.\n`,
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

test('rejects a router that omits the v2 stage order', () => {
  const fixture = createFixture();
  write(
    '.agents/skills/orchestrate-monorepo-work/SKILL.md',
    '---\nname: orchestrate-monorepo-work\ndescription: Use when validating the fixture.\n---\nNo stage order.\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /orchestrate-monorepo-work.*stage order/i);
});

test('rejects current routing guidance that retains v1 stage concepts', () => {
  for (const retiredGuidance of [
    'No active item routes to capture-monorepo-change.',
    'Continue through the digest-authorization stage.',
    'Stop for stale approval.',
  ]) {
    const fixture = createFixture();
    fs.appendFileSync(
      path.join(fixture, '.agents/skills/orchestrate-monorepo-work/SKILL.md'),
      `\n${retiredGuidance}\n`,
    );

    const result = validate(fixture);

    assert.equal(result.status, 1, retiredGuidance);
    assert.match(result.stderr, /retired v1 routing guidance/i);
  }
});

test('rejects a retained v1 skill that is still triggerable for new work', () => {
  const fixture = createFixture();
  write(
    '.agents/skills/capture-monorepo-change/SKILL.md',
    '---\nname: capture-monorepo-change\ndescription: Use when starting new work.\n---\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /historical compatibility marker/i);
});

test('rejects material v1 reversion in current overview guidance', () => {
  const fixture = createFixture();
  write(
    'docs/workflow/WORKFLOW_OVERVIEW.md',
    '# Overview\n\ncapture → orient → scope → plan → implement → verify → reconcile\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /WORKFLOW_OVERVIEW\.md.*Workflow v2/i);
});

test('rejects material v1 reversion in the initializer AGENTS template', () => {
  const fixture = createFixture();
  write(
    '.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md',
    '# Template\n\nExecute one bounded phase, verify, and reconcile.\n',
  );

  const result = validate(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /AGENTS\.template\.md.*Workflow v2/i);
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
