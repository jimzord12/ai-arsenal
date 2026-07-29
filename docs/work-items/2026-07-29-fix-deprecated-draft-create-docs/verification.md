Work item: 2026-07-29-fix-deprecated-draft-create-docs
Artifact: verification
Revision: 1
Prerequisites: contract@1,plan@1,implementation@1
Status: passed

# Result

- Recommended human workflow uses `jz-trello-flow draft create`.
- Matching command example uses `jz-trello-flow draft create`.
- Concepts and command-catalog sections still document `create` as a deprecated compatibility alias.
- Only the two intended guide lines changed for this implementation.
- Prettier, package tests, work-item validation, and `git diff --check` are required final gates and were run before reconciliation completion.
- No Trello access or mutation occurred.
