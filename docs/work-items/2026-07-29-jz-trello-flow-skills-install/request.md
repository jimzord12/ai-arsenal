Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Deliver the bounded `jz-trello-flow skills install` feature through the repository-owned capture, orientation, scope, plan, authorization, implementation, and verification pipeline, stopping after passed verification routes the work item to reconciliation.

## Desired outcome

Add `jz-trello-flow skills install` so a packed CLI artifact installed in a disposable consumer can deterministically locate the target repository root and install the four bundled, canonical `trello-work-*` skills into that repository's `.agents/skills/` directory with the locked replacement, validation, dry-run, preservation, and atomicity behavior.

## Constraints

- Treat the change as Tier 2.
- Preserve the intentional pre-existing `NEXT.md` modification and incorporate its locked decisions into the work-item artifacts without overwriting them.
- Follow strict vertical-slice TDD with observed RED and GREEN evidence.
- The public command is `jz-trello-flow skills install`.
- Detect the target repository root deterministically and report clear errors.
- Every invocation explicitly replaces only the four managed `trello-work-*` directories from assets bundled with the running CLI.
- Preserve unrelated skills.
- Retain `--dry-run` and report installed or replaced targets.
- Prepare and validate the complete payload with the official pinned `skills-ref` validator before any replacement.
- A preparation failure must leave existing targets unchanged.
- Essential acceptance includes packing the actual pnpm tarball, installing it in a disposable consumer, and invoking the command there.
- Use exact repository scripts and validators; do not guess substitutions.
- Run all required implementation and verification gates and keep workflow artifacts truthful.
- Do not reconcile, commit, push, publish, globally install, or invoke Trello.
- Leave any independent review required by verification explicitly to the supervising agent rather than self-certifying.

## User-provided context

- The four canonical sources are `.agents/skills/trello-work-orchestrator`, `.agents/skills/trello-work-design`, `.agents/skills/trello-work-deliver`, and `.agents/skills/trello-work-recover`.
- The package is `packages/trello-work-cli`.
- No Trello credentials or access are required or permitted for this work.
- The supervising agent will independently review, reconcile, and deliver after this implementation agent stops at the reconciliation route.
- No unanswered questions were supplied.
