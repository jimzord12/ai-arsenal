Work item: 2026-07-29-release-trello-attachments
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- Current stage skills and the artifact-gated delivery procedure

# Verified baseline

- Clean aligned `master`, `HEAD`, and `origin/master`: `1c1e7e438b6c75fd28e406e67796c0266baea7c0`.
- Source package version: `0.2.0`.
- Global package version: `0.2.0`.
- Attachment feature commit `af5345cbd829223ea019d4e8d831239a539b98f5` and final documentation commit are CI-green.
- Live read-only attachment workbook passed on TestingBoard/card `6a691ff583597d8cfdd0c780`.
- No pending Changeset exists.

# Affected surfaces

- Changesets release metadata, package version/changelog, lockfile, current planning/work-item artifacts.
- Exact packed tarball and Windows global pnpm installation after Git/CI.
- Read-only TestingBoard attachment metadata/download verification after installation.

# Risks and boundaries

- Release version must reflect additive public CLI behavior: minor `0.3.0`.
- Pack/install must bind to the exact CI-green commit and must not publish.
- Native Windows `cmd.exe` invocation is the supported installed smoke path; Git Bash shim compatibility remains separate.
- Trello access is read-only and restricted to board `6a16bbf1fea5389eb39636b7` and card `6a691ff583597d8cfdd0c780`.
- Preserve rollback source and the existing `0.2.0` tarball/package source; no deletion.
