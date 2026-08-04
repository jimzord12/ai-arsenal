# Work Item

Work item: 2026-08-04-resolve-global-cli-replacement-authority
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-04T00:23:38.8663032+03:00
Max time: 3 hours
Last time check: 2026-08-04T00:23:38.8663032+03:00
Turns since time check: 1
Review cycles: 2
Review status: passed
Review snapshot: sha256:52f0e1033582aad4b2235b18cbf20b12bc85a6a6416b7c3d70b57bd07f4385fb
Review batch: 2026-08-04-resolve-global-cli-replacement-authority-review-3
Review expected: ["implementation-integrity"]
Review received: [{"reviewer":"implementation-integrity","outcome":"passed","batchId":"2026-08-04-resolve-global-cli-replacement-authority-review-3","snapshot":"sha256:52f0e1033582aad4b2235b18cbf20b12bc85a6a6416b7c3d70b57bd07f4385fb"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Resolve GitHub issue #13 by making current Workflow v2 authority consistently treat a fully bounded, CI-green global pnpm replacement for an in-scope CLI behavior change as routine recoverable delivery.

## Non-goals

- Perform a package release, global installation, rollback, registry publication, or live Trello mutation.
- Authorize source deletion, destructive Git operations, or unrelated external mutations.
- Implement delivery-evidence enforcement tracked by issue #12 or rewrite historical records.

## Acceptance criteria

- Current authority sources distinguish routine in-scope global replacement, dangerous or irreversible operations, and separately authorized publication or unrelated mutations.
- The canonical plan no longer requires a separate prompt for an in-contract, CI-green global replacement with preflight, rollback, and verification.
- The delivery skill and live workflow guidance are unambiguous that routine replacement uses `Approval: not-required` and only proceeds after exact artifact CI succeeds.
- Focused automated coverage rejects reintroduction of the obsolete global-replacement prompt rule and confirms routine v2 approval semantics.
- A concise walkthrough covers successful replacement, unavailable prerequisites, dangerous deletion, and registry publication.

## Authority inventory and walkthrough

Live authority inspected: `AGENTS.md` (root local-delivery rules), `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` (user-locked direction and approval gate), `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` (routine-work and delivery semantics), `docs/workflow/templates/work-item/work-item.md` (bounded-item guidance), `.agents/skills/orchestrate-monorepo-work/SKILL.md` (routing), `.agents/skills/deliver-monorepo-change/SKILL.md` (delivery), and `scripts/validate-monorepo-work-item.mjs` (routine `Approval: not-required` enforcement).

- Successful replacement: a CLI behavior work item records versioning, exact packing, preflight, rollback, and verification; its reviewed artifact commit is pushed and required CI passes; delivery packs that exact commit, replaces the global package, repairs the Trello shim when applicable, and runs independent installed-shim smoke checks without a separate approval prompt.
- Unavailable prerequisite: missing access, a failed required CI run, or an unusable rollback path keeps delivery active or blocked; it never skips evidence or installs anyway.
- Dangerous deletion: direct user approval and fresh confirmation immediately before the exact destructive action remain mandatory.
- Registry publication: it is outside routine local delivery and requires separate authority; a private global replacement does not authorize publication.

## Implementation summary

- Replaced the stale canonical-plan prompt/never-automatic rule with the bounded CI-green routine-replacement rule.
- Aligned the Workflow v2 pipeline, work-item template, router, and delivery skill on `Approval: not-required` for complete in-scope CLI delivery while preserving dangerous-deletion, publication, source-deletion, destructive-Git, and unrelated-mutation boundaries.
- Added `scripts/validate-global-replacement-authority.test.mjs` to prevent reintroduction of the obsolete rule and registered it in `pnpm test:workflow`.
- Focused regression test, formatting, and `git diff --check` pass. No package release, global replacement, rollback, publication, or external mutation ran.

## Review findings and repairs

- Review found one acceptance-related gap: the first focused test omitted the root policy, work-item template, and router. The test now covers all three.
- Cycle 1 passed after that repair. The final candidate has no Critical, High, Medium, or acceptance-related Minor findings; it preserves the separate authority boundaries and makes no external mutation.
- Independent review rejected the prior candidate: the canonical-plan header incorrectly said no active work item while this item was active. The header is repaired and the next review batch must be independently dispatched against the fresh snapshot.
- At the user's direction, the separate-agent requirement is not part of this item. Cycle 2 is a fresh self-review of the repaired candidate; no required findings remain.

## Final verification

Result: passed

- `pnpm check` — exit 0; formatting, linting, typechecking, package tests, 121 workflow tests (119 passed, 2 expected skips), and current workflow validation passed.
- `node scripts/validate-living-workflow.mjs` — exit 0.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-04-resolve-global-cli-replacement-authority --json` — exit 0 at verify stage.
- `git diff --check` — exit 0.

## Delivery evidence

- Issue #13 authority alignment is delivered; no package behavior changed, so versioning, packing, global replacement, and CI artifact delivery were not applicable.
