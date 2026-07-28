Work item: 2026-07-28-rename-trello-cli-executable
Artifact: reconciliation
Revision: 1
Prerequisites: verification@1
Status: passed

# Resulting state

The package is `@jz/ai-arsenal-trello-work-cli@0.2.0` and exposes only `jz-trello-flow`. Help, shipped docs, current operator docs, tests, and changelog match the new executable. The old package-owned `work` alias is removed.

# Canonical and NEXT updates

Current canonical truth and operator instructions target `0.2.0`, exact CI-green global installation, native Windows help, and the authorized TestingBoard onboarding workbook as the final E2E gate.

# Remaining operation

Commit/push this exact verified snapshot; wait for Quality and Portability CI; install its exact tarball globally; verify `jz-trello-flow --help` and old-shim absence; then run and repair the TestingBoard workbook until it passes. Do not publish or access another board.
