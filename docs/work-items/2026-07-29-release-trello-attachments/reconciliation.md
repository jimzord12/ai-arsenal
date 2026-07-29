Work item: 2026-07-29-release-trello-attachments
Artifact: reconciliation
Revision: 1
Prerequisites: verification@1
Status: passed

# Resulting state

The private Trello Work Unit CLI source is versioned `0.3.0` with a generated changelog for the verified additive attachment feature. Package/root/workflow/packed-artifact gates and independent review pass. Git/CI, exact tarball installation, and read-only live workbook remain required downstream evidence.

## Canonical-plan updates

Replace `0.2.0` as current source release truth with `0.3.0`, retain `0.2.0` as the currently installed rollback baseline until post-CI replacement, and set the immediate action to exact-SHA Git/CI followed by exact tarball installation and allowlisted live validation.

## NEXT.md update

Clear the work-item registration and state one exact operator action: commit/push, exact-SHA CI, then authorized exact pack/install/live verification. Preserve publication, Trello mutation, deletion, and Git Bash remediation as excluded.

## Risks

- Installation must bind to a tarball packed from the exact CI-green commit, not the mutable pre-commit worktree.
- Global `0.2.0` remains active until exact-SHA CI passes and `0.3.0` replacement succeeds.
- Registry publication remains prohibited.

## Next action

Commit and push the exact verified `0.3.0` release snapshot, require Quality and Portability for its full SHA, then pack/install that exact commit and run the authorized read-only TestingBoard attachment workbook.
