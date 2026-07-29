Work item: 2026-07-29-fix-deprecated-draft-create-docs
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Problem statement

The authoritative Trello CLI guide correctly marks `jz-trello-flow create` deprecated but still teaches that alias in two recommended examples, perpetuating obsolete automation.

## Intended outcome

Use `jz-trello-flow draft create` in both recommended examples while retaining explicit documentation that `create` remains a deprecated compatibility alias.

## In scope

- `packages/trello-work-cli/assets/work-guide.md` recommended human workflow command.
- `packages/trello-work-cli/assets/work-guide.md` corresponding example command.
- Work-item evidence and planning reconciliation.

## Out of scope

- CLI behavior, command catalog, tests, package manifest/boundary/version, release, installation, Trello mutation, protocol/skill semantics, commit, or push.

## Acceptance criteria

1. Both recommended creation examples use `jz-trello-flow draft create`.
2. Deprecated alias documentation remains intact.
3. No other CLI guide semantics change.
4. Formatting, relevant documentation/package validation, work-item validation, living-workflow validation, and `git diff --check` pass.

## Approval requirements

Explicit approval of the exact implementation plan is required before editing the guide.
