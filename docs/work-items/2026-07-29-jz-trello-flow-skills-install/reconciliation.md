Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: reconciliation
Revision: 1
Prerequisites: verification@3
Status: passed

# Resulting state

`jz-trello-flow skills install` is implemented and independently verified as an offline command. It deterministically discovers the containing Git repository, prepares and officially validates the complete four-skill managed payload before mutation, replaces only the four `trello-work-*` targets with rollback on later replacement failure, preserves unrelated skills, supports truthful `--dry-run` reporting, and works from the actual packed package in a disposable consumer. Git discovery ignores inherited `GIT_*` selectors, and official validation uses the provenance-verified pinned source in an isolated UTF-8 Python process that consumer import state cannot shadow.

## Canonical-plan updates

Update current verified repository state, repository layout, Trello test/distribution architecture, the Trello workflow boundary, and the maintenance record to treat the locked installer behavior as delivered product truth. Remove the obsolete risks and open decisions that the skills remain outside the packed boundary or lack package installation support; retain actual harness installation, release/publication, production Trello use, and managed-directory replacement as explicit boundaries.

## NEXT.md update

Clear the active work item and pipeline step to `none`. Replace the completed feature-selection view with the exact remaining operator action: commit and push the verified implementation and reconciliation snapshot, then confirm the resulting `master` CI.

## Risks

The command intentionally replaces user edits inside its four CLI-managed directories; the managed marker and documentation must remain explicit. Successful installation requires the pinned official validator source and Python runtime to be available. This source snapshot has not been released, published, globally installed, installed into a non-disposable target, or exercised against Trello.

## Next action

Commit and push the exact verified implementation and reconciliation snapshot, then confirm the resulting `master` CI runs.
