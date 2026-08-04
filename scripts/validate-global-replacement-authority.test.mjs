import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');

test('live Workflow v2 authority permits bounded CI-green global replacement without a prompt', () => {
  const canonical = read('docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md');
  const pipeline = read('docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md');
  const delivery = read('.agents/skills/deliver-monorepo-change/SKILL.md');
  const rootPolicy = read('AGENTS.md');
  const template = read('docs/workflow/templates/work-item/work-item.md');
  const router = read('.agents/skills/orchestrate-monorepo-work/SKILL.md');

  assert.doesNotMatch(
    canonical,
    /Ask before changing the user's global pnpm installation/i,
  );
  assert.doesNotMatch(canonical, /never update it automatically/i);
  assert.match(canonical, /routine recoverable delivery operation/i);
  assert.match(canonical, /preflight, rollback, and verification/i);
  assert.match(canonical, /artifact-bearing commit.*required CI succeeds/i);
  assert.match(canonical, /Dangerous deletion.*fresh confirmation/i);
  assert.match(
    canonical,
    /Registry publication, source deletion, destructive Git operations/i,
  );
  assert.match(pipeline, /Approval: not-required/i);
  assert.match(pipeline, /preflight, rollback, and verification/i);
  assert.match(pipeline, /required CI succeeds/i);
  assert.match(pipeline, /unusable rollback path.*blocked prerequisite/i);
  assert.match(
    pipeline,
    /Registry publication, source deletion, destructive Git operations/i,
  );
  assert.match(delivery, /does not require a separate user approval prompt/i);
  assert.match(delivery, /exact artifact CI passes/i);
  assert.match(
    delivery,
    /Dangerous deletion, registry\s+publication, source deletion/i,
  );
  assert.match(rootPolicy, /Proceed autonomously when prerequisites exist/i);
  assert.match(rootPolicy, /preflight, rollback, and verification/i);
  assert.match(rootPolicy, /exact reviewed snapshot.*CI is successful/i);
  assert.match(rootPolicy, /dangerous deletion\/data-loss step/i);
  assert.match(template, /CI-green global replacement then uses/i);
  assert.match(template, /complete release chain, preflight, rollback/i);
  assert.match(
    template,
    /dangerous deletion and separately authorized external/i,
  );
  assert.match(router, /routine global replacement with/i);
  assert.match(router, /complete release, preflight, rollback, and/i);
  assert.match(router, /exact CI-green delivery may execute it/i);
});
