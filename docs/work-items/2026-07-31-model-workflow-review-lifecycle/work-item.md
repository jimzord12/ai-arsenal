# Work Item

Work item: 2026-07-31-model-workflow-review-lifecycle
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T13:05:00+03:00
Max time: 4 hours
Last time check: 2026-07-31T13:05:00+03:00
Turns since time check: 1
Review cycles: 1
Review status: passed
Review snapshot: sha256:95c04bb7c5ed77515b92d00f0962f2d70c8c62b2004c65e3d77ef7e8813b21b9
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Implement GitHub issue #15 by replacing implicit Workflow v2 review success with an explicit pending, failed, or passed lifecycle and snapshot field for active and newly created compact work items, while keeping already-delivered compact records readable without rewriting them.

## Non-goals

- Do not define the deterministic review-candidate digest algorithm owned by GitHub issue #16.
- Do not define complete review-batch or delegation-completion semantics owned by GitHub issue #17.
- Do not implement the full validator/routing barrier for pending, incomplete, mismatched, or stale review evidence owned by GitHub issue #18; validator changes in this item are limited to recognizing the new schema, enforcing its field-level state combinations, preserving the four-cycle stop, and reading delivered legacy records.
- Do not perform the integrated regression and normative pipeline-documentation alignment owned by GitHub issue #19 beyond the compact template and stage-skill text directly required to define these lifecycle transitions.
- Do not add workflow stages, change Trello behavior, rewrite delivered historical work items, redesign review delegation, or alter CI, release, or Git-delivery policy.

## Acceptance criteria

- The compact work-item template replaces `Required findings remaining` with exactly one `Review status: pending | failed | passed` field and one `Review snapshot: pending | sha256:<64 lowercase hexadecimal characters>` field, initializes both fields to `pending`, and documents all allowed lifecycle transitions.
- Active/new compact records accept only these combinations: `pending` with a pending snapshot, `failed` with a concrete snapshot, or `passed` with a concrete snapshot; malformed values and contradictory combinations fail focused schema validation.
- Entering review records `Review status: pending` and `Review snapshot: pending`; review completion with unresolved required findings records `failed`, while complete required evidence for a concrete recorded snapshot permits `passed`.
- Any implementation repair that changes candidate bytes returns both review fields to `pending` before re-review; the existing maximum of four repair/re-review cycles remains unchanged, and an unsuccessful fourth cycle becomes a valid blocked review state.
- Active work-item lifecycle and stage-skill guidance no longer treats absence of required findings as implicit proof that review ran, and a new compact item cannot encode unperformed review as passed through its initial state.
- Existing delivered Workflow v2 records using `Required findings remaining` continue to validate and remain readable without byte changes; the active issue-#15 work item is migrated to the new schema as part of implementation after compatibility support exists.
- Focused validator/schema and lifecycle tests demonstrate template defaults, every allowed review state, rejected invalid combinations, pending reset after candidate-changing repairs, the four-cycle bound, and delivered-legacy compatibility.

## Implementation summary

- Changed `docs/workflow/templates/work-item/work-item.md` so new compact records initialize `Review status: pending` and `Review snapshot: pending`, with inline lifecycle documentation for pending, failed, passed, repair reset, and the four-cycle stop.
- Changed `scripts/validate-monorepo-work-item.mjs` to parse the explicit fields, reject malformed or contradictory field combinations, retain the existing four-cycle blocked state through `failed`, expose the parsed state in JSON, and accept the retired `Required findings remaining: no` field only on delivered historical v2 records.
- Changed `scripts/validate-monorepo-work-item.test.mjs` with focused template, stage-skill, allowed-state, invalid-combination, four-cycle, active-legacy rejection, and delivered-legacy compatibility coverage.
- Updated the current Workflow v2 sections of `define-monorepo-change`, `implement-monorepo-change`, `review-monorepo-change`, `verify-monorepo-change`, and `deliver-monorepo-change` so definition/review entry starts pending, candidate-changing repair resets pending, unsuccessful review records failed, and successful review records passed for a concrete snapshot.
- Migrated this active work item to the explicit fields without modifying any delivered historical record. `NEXT.md` contains the active registration and routed stage.
- RED: `node --test scripts/validate-monorepo-work-item.test.mjs` exited `1` with 13 expected failures because the validator and template still required implicit `Required findings remaining`; the added downstream stage-skill assertion also failed before verify/deliver guidance changed.
- GREEN: `node --test scripts/validate-monorepo-work-item.test.mjs` exited `0`; all 40 tests passed. The selected-item validator, living-workflow validator, and `git diff --check` also exited `0` before review handoff.

## Review findings and repairs

- Cycle 1 inspected the full ten-path candidate against issue #15's lifecycle ownership and the explicit #16–#19 exclusions. Schema parsing, allowed field combinations, delivered-history compatibility, the four-cycle blocked state, template defaults, and all five current stage-skill transitions match the bounded acceptance criteria.
- One acceptance-related repository-quality finding was found: `scripts/validate-monorepo-work-item.test.mjs` was not Prettier-clean. The file was formatted mechanically; because candidate bytes changed, review remained/reset to pending before fresh review.
- The invalidated focused suite was rerun after repair: `node --test scripts/validate-monorepo-work-item.test.mjs` exited `0` with 40/40 tests passing. The ten-path Prettier check, selected-item validator, and `git diff --check` also exited `0`.
- Fresh review of the repaired candidate found no remaining Critical, High, Medium, or acceptance-related Minor finding. Concrete pre-evidence candidate snapshot: `sha256:95c04bb7c5ed77515b92d00f0962f2d70c8c62b2004c65e3d77ef7e8813b21b9`.

## Final verification

Result: passed

- Changed-path inspection: `git status --short` showed exactly the five Workflow v2 stage skills, `NEXT.md`, the compact template, validator and focused test, plus this new work-item directory; every path is attributable to issue #15 and no delivered historical record changed.
- Focused lifecycle suite: `node --test scripts/validate-monorepo-work-item.test.mjs` — exit `0`; 40/40 tests passed, covering template defaults, all explicit field states, invalid combinations, stage guidance, cycle-four blocking, and legacy delivered-record compatibility.
- Full repository gate: `pnpm check` — exit `0`; Prettier, four-package lint and typecheck, all package tests, 62 workflow tests (61 passed and one documented Windows privilege-dependent skip), the living-workflow validator, and current-item validation passed.
- Selected-item validator: `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-31-model-workflow-review-lifecycle --json` — exit `0`; valid review-stage state routed to `verify-monorepo-change` with the recorded passed review and concrete snapshot.
- Living-workflow validator: `node scripts/validate-living-workflow.mjs` — exit `0`; required workflow files and `NEXT.md` structure passed.
- Whitespace gate: `git diff --check` — exit `0` with no output.
- Manual acceptance inspection confirmed that the active item uses the new fields, delivered historical work-item bytes are unchanged, the five-stage route and four-cycle limit remain intact, and deterministic digest computation, review-batch semantics, the full validator advancement barrier, and integrated documentation remain excluded for issues #16–#19.

## Delivery evidence

- Verified artifact-bearing commit `94994da4c7862563364751719cecec82386952fa` was committed with `fix(workflow): model explicit review lifecycle` and pushed to `origin/master`; local `HEAD` and `origin/master` were equal after a fresh fetch, and the worktree was clean before closure evidence edits.
- Exact-commit Quality run `https://github.com/jimzord12/ai-arsenal/actions/runs/30622861219` completed successfully for head SHA `94994da4c7862563364751719cecec82386952fa`, including repository checks and private artifact validation.
- Exact-commit Portability run `https://github.com/jimzord12/ai-arsenal/actions/runs/30622861201` completed successfully for the same head SHA; both Ubuntu and Windows process/distribution jobs passed.
- GitHub issue `#15` was read back as `CLOSED` with reason `COMPLETED`. The connected GitHub app lacked close permission (`403`), so the authenticated `gh issue close` fallback performed the same bounded mutation and `gh issue view` verified it.
- This is workflow-policy behavior, not a shipped CLI behavior change; no Changeset, package version, packed artifact replacement, registry publication, or global installation applies.
- Canonical planning truth now records the explicit lifecycle and historical compatibility. The next planned child is GitHub issue `#16`, which remains a separate bounded request.
