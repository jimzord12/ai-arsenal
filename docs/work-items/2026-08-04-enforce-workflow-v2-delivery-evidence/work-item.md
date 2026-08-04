# Work Item

Work item: 2026-08-04-enforce-workflow-v2-delivery-evidence
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-04T10:23:00+03:00
Max time: 4 hours
Last time check: 2026-08-04T10:23:00+03:00
Turns since time check: 3
Review cycles: 2
Review status: passed
Review snapshot: sha256:3aa3ab74750bb2e375e8eb255b5606b72e15c47528b9255d9d1e8de9e26b1c2c
Review batch: review-20260804-branch-delivery-02
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260804-branch-delivery-02","snapshot":"sha256:3aa3ab74750bb2e375e8eb255b5606b72e15c47528b9255d9d1e8de9e26b1c2c"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260804-branch-delivery-02","snapshot":"sha256:3aa3ab74750bb2e375e8eb255b5606b72e15c47528b9255d9d1e8de9e26b1c2c"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
CLI local-delivery evidence: not-required

## Goal

Make Workflow v2 delivery fail closed and remain honestly resumable until every required CLI local-delivery obligation is durably recorded and mutually consistent, while keeping ordinary non-CLI work exempt and enforcing branch-per-work-item development.

## Non-goals

- Perform a package release, packing, global replacement, rollback, publication, live Trello mutation, or other external delivery operation.
- Rewrite delivered historical work-item records or redesign the stable review barrier.
- Introduce a release service, registry publication, dangerous deletion, or a new workflow stage.
- Merge or delete work branches as part of workflow delivery.

## Acceptance criteria

- The compact record identifies whether CLI local-delivery evidence is required; the template and validator preserve compatibility for existing delivered records without inventing evidence.
- Required CLI delivery has structured evidence for the artifact-bearing commit, pushed remote-ref equality, successful required CI URLs/conclusions tied to that SHA, package name/version, exact tarball identity/checksum, global replacement/result and installed-version proof, generated-shim version/help and feature smoke, installed-artifact byte provenance, rollback identity/readiness and any attempted rollback result, and clean-worktree completion.
- A required CLI item remains active at `Stage: deliver` when evidence is pending or failed; failed CI, packing, installation, smoke, or rollback does not clear its route. Delivered status is rejected unless every category is complete, successful, and mutually consistent with the artifact SHA and package version.
- A failed installation with a successful rollback records both outcomes and remains resumable; an attempted failed rollback cannot be represented as successful delivery.
- Ordinary source, documentation, planning, test-only, and workflow-policy delivery succeeds without CLI artifact evidence, and closure evidence does not require a self-referential closure-commit SHA.
- Focused regression tests cover each missing evidence category, SHA/remote/CI/package/checksum mismatch, pending or failed CI, installation recovery, failed smoke, successful evidence-only closure, and the ordinary-work exemption. The template, pipeline guide, delivery skill, validator, and tests state the same fail-closed rule.
- Each active v2 item uses a dedicated `work/<work-item-id>` branch created at definition; active routing fails closed on another branch while delivered historical records remain readable.

## Implementation summary

Implemented fail-closed CLI delivery evidence validation and deterministic
branch-per-work-item routing.

### Changed paths

- `AGENTS.md`
- `.agents/skills/{define,orchestrate,implement,review,verify,deliver}-monorepo-change/SKILL.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/WORKFLOW_OVERVIEW.md`
- `docs/workflow/templates/work-item/work-item.md`
- `package.json`
- `scripts/validate-monorepo-work-item.mjs`
- `scripts/validate-monorepo-work-item.test.mjs`

### Focused checks

- `node --test scripts/validate-monorepo-work-item.test.mjs` — passed, 69 tests.
- `pnpm test:workflow` — passed, 127 tests and 2 platform-conditional skips.
- `pnpm lint:root` — passed.
- `pnpm exec prettier --check <affected paths>` — passed.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-04-enforce-workflow-v2-delivery-evidence --json` — passed.
- `node scripts/validate-living-workflow.mjs` — passed.
- `git diff --check` — passed.

## Review findings and repairs

No Critical, High, Medium, or acceptance-related Minor findings. The first
verification attempt found and the repair corrected one Prettier formatting issue
in the workflow regression test. Contract and quality re-review confirmed the
branch policy, CLI evidence barrier, focused tests, formatting, lint, and workflow
validators pass.

## Final verification

Result: passed

- `pnpm check` — passed. This ran repository formatting, package linting,
  package typechecking, all package tests (154 Features CLI, 285 Trello Flow
  CLI with 2 skipped live cases, and 79 weekly-report tests), the 129-test
  workflow suite with 127 passed and 2 platform-conditional skips, and both
  workflow validators.
- `node scripts/validate-monorepo-work-item.mjs --current --json` — passed;
  route is `verify-monorepo-change` with matching work branch and review batch.
- `node scripts/validate-living-workflow.mjs` — passed.
- `git diff --check` — passed.
- Current branch — `work/2026-08-04-enforce-workflow-v2-delivery-evidence`.
- Exact artifact-bearing commit — `58abca6d96738678fb4819758a4f26a7e1f9e3eb`.
- Remote branch equality — `origin/work/2026-08-04-enforce-workflow-v2-delivery-evidence` points to the exact commit.
- Required CI — [Quality](https://github.com/jimzord12/ai-arsenal/actions/runs/30889498928) and [Portability](https://github.com/jimzord12/ai-arsenal/actions/runs/30889498850) both concluded successfully for that SHA.
- CLI local-delivery evidence — not required for this workflow-policy item.
