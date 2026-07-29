Work item: 2026-07-29-release-trello-attachments
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Produce and install an exact, CI-green private `0.3.0` release containing the verified additive Trello attachment behavior, without registry publication or Trello mutation.

# In scope

- Add a minor Changeset for `@jz/ai-arsenal-trello-work-cli` and apply it to generate version `0.3.0` and changelog/lockfile updates.
- Verify the exact packed manifest, files, executable map, attachment module/docs, and absence of the retired `work` alias.
- Run package/root/workflow gates and independent review.
- Reconcile current truth, commit, push, and require Quality and Portability for the exact release SHA.
- Pack from the clean exact CI-green checkout, record SHA-256, replace the global package with that tarball, and verify `jz-trello-flow --help` through native Windows command execution.
- Run the approved read-only attachment workbook against TestingBoard/card `6a691ff583597d8cfdd0c780`, including metadata-only no-write, exact binary download, and no-overwrite checks.

# Out of scope

- npm-compatible registry publication.
- Any Trello mutation or access to another board/card.
- Git Bash shim remediation.
- Package source/rollback deletion or unrelated changes.

# Acceptance criteria

1. Source package and generated changelog report `0.3.0`; the pending Changeset is consumed and unrelated packages do not change.
2. Full package/root/workflow gates and strict packed-artifact validation pass; independent review has no Critical/High issue.
3. Exact release commit is pushed and Quality/Portability pass for its full SHA.
4. A tarball packed from that exact clean commit has a recorded SHA-256 and contains only the intended executable/package boundary, including attachment implementation/docs and no retired alias.
5. Global pnpm reports `@jz/ai-arsenal-trello-work-cli@0.3.0`; native `jz-trello-flow --help` succeeds and exposes `--attachments-dir`.
6. Live read-only TestingBoard validation reports one attachment, downloads the 15,182-byte Markdown file at SHA-256 `56ba0f503a27f310624d8b6eed645fac3f9cd84005666c4e5a9833f4c8955867`, creates no attachment on metadata-only `get`, and refuses overwrite without changing bytes.
7. Repository worktree ends clean and aligned with `origin/master`; no publication or Trello mutation occurs.

# Rollback

Reinstall the previously verified `0.2.0` exact package artifact/source if the `0.3.0` global installation or live read-only workbook fails. Do not delete either source.
