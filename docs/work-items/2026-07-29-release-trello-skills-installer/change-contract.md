Work item: 2026-07-29-release-trello-skills-installer
Artifact: contract
Revision: 2
Prerequisites: request@1,context@1
Status: ready

# Goal

Produce a reviewed private `0.4.0` release candidate for the already delivered additive `jz-trello-flow skills install` command, complete repository verification and reconciliation before operations, then under the user's separately authorized post-CI operational phase pack and globally install the exact CI-green commit and preserve reproducible installation evidence without registry publication or Trello access.

## Non-goals

- Registry publication or automated publication configuration.
- Any Trello API call or Trello mutation.
- Product behavior changes beyond correct generated version/changelog metadata, a reproducible byte-proof utility, and evidence/current-truth reconciliation.
- Installation into a non-disposable consumer repository.
- Manual editing of pnpm-generated global shims.
- Source deletion, history rewriting, or unrelated package changes.

## Hard walls

- Do not publish or call Trello.
- Use proper Changesets mechanics and SemVer to replace the invalidated `0.3.1` candidate with minor release `0.4.0`; do not hand-edit final package version or changelog output.
- Repository implementation, verification, and reconciliation may create and inspect disposable candidate packs but must stop before external/global installation. Packing for installation, global replacement, and installed-state checks belong only to the separately authorized post-CI operational phase.
- Begin operational installation only from a clean exact release commit after Quality and Portability workflows succeed for its full SHA.
- Use the actual exact-SHA tarball in an unrelated disposable Git repository for installed `skills install` checks; do not substitute workspace source or mocks.
- Replace only the Windows global pnpm package from that tarball; do not globally link a mutable worktree or manually patch generated shims.
- Check in an inspectable, deterministic script or command that compares expected transformed package payload bytes with installed bytes, verifies all four managed skill trees, detects missing/extra files, and proves unrelated sentinel preservation and repeat-install stability.
- Record checksum and durable evidence, reconcile current truth after operational installation, push the documentation reconciliation, and require final exact-SHA CI.
- Finish with local `master == origin/master` and a clean worktree.

## Acceptance criteria

1. Proper Changesets recovery restores the package metadata to the `0.3.0` baseline, creates one minor Changeset selecting only `@jz/ai-arsenal-trello-work-cli`, predicts `0.3.0 -> 0.4.0`, consumes that Changeset with `pnpm version-packages`, and leaves generated package/changelog metadata at `0.4.0` with no unrelated package bump.
2. A repository-owned reproducible byte-proof script or exact durable command accepts explicit package-payload and installed-repository roots, models the documented managed marker/protocol-link transformation, compares every expected file byte, rejects missing/extra managed files, verifies all four skill directories, preserves an unrelated sentinel hash, and can compare first/repeated installation manifests.
3. Focused installer and byte-proof tests, complete package format/lint/typecheck/test/strict validation, candidate packed-consumer validation, root checks, workflow validators, and `git diff --check` pass without Trello access or global installation.
4. Fresh independent review of stable repository bytes reports zero Critical, High, or Medium findings; any such finding is repaired, invalidated gates rerun, and the corrected snapshot re-reviewed.
5. Repository reconciliation truthfully records that release installation remains pending, verification contains no global-install claim, and the reviewed release snapshot is committed/pushed with local/remote full SHA equality and successful exact-SHA Quality and Portability workflows.
6. Only after criterion 5, a tarball packed from a clean checkout of that exact CI-green SHA has recorded path, filename, and SHA-256; its real manifest reports `0.4.0`, only `jz-trello-flow -> src/bin.ts`, all four managed skill payloads and protocol authority, and excludes tests, configuration, credentials, and any retired alias.
7. In the separately authorized operational phase, native Windows pnpm installs that exact tarball globally; global listing and installed manifest report exactly `@jz/ai-arsenal-trello-work-cli@0.4.0`; the generated native shim's `--help` and `docs` commands succeed without repository-source resolution.
8. In an unrelated disposable Git repository, the installed global shim performs `skills install`; the checked-in byte-proof command proves the four expected managed skill directories exactly match transformed package payload bytes, unrelated sentinel bytes remain unchanged, and a repeated install produces an identical managed-file manifest.
9. Durable post-install evidence records release and final SHAs, CI run IDs/URLs, tarball identity and SHA-256, package/file boundary, native install command and version proof, generated-shim help/docs, reproducible byte-proof invocation/output, and explicit no-publication/no-Trello compliance.
10. Post-install current-truth reconciliation is committed/pushed and exact-SHA Quality and Portability CI pass; final `master == origin/master` and status is clean.

## Test seams

- Changesets status JSON before application, consumed changeset, generated manifest/changelog, and unrelated-package/lockfile diff.
- Repository-owned byte-proof unit/fixture tests and a real disposable installed repository.
- Package installer unit/E2E suites and official pinned Agent Skills validation path.
- Real candidate `pnpm pack` archive manifest/package metadata and install into an unrelated disposable consumer during repository acceptance, without global replacement.
- GitHub Actions runs bound to full commit SHA for Quality and Portability.
- Clean exact-SHA tarball and SHA-256 in the post-CI operational phase.
- Native Windows global pnpm registration, installed manifest, and generated `.cmd` executable invocation.
- Disposable Git repository with sentinel unrelated skill, first/repeat manifests, and script-driven transformed source-to-installed byte comparison.
- Git full-SHA equality and clean-worktree checks before operational packing and at final completion.

## Verification

- SemVer/Changesets: prove restoration from invalidated candidate output, inspect minor status JSON before application, and inspect direct metadata/changelog/package-scope diff afterward.
- Byte-proof reproducibility: review and run the checked-in script against controlled fixtures and candidate packed installation, preserving exact command and output.
- Package and repository quality: run focused, package, root, workflow, packed-consumer, and whitespace gates; preserve exits and test totals; do not globally install.
- Independent review: inspect exact stable diff/full files and acceptance matrix; require zero Critical/High/Medium.
- Repository reconciliation: record release installation as pending, validate the pipeline, and end repository stages before operational installation.
- Git/CI: push the reviewed release commit, fetch, compare full SHAs, and require successful Quality and Portability runs bound to that exact SHA.
- Separately authorized operational installation: pack the clean CI-green SHA, record SHA-256, install via native Windows pnpm, inspect global registration/manifest/shims, run help/docs, and exercise disposable `skills install` with the checked-in byte-proof command.
- Post-install current truth: record operational results directly, commit/push reconciliation, require final exact-SHA CI, and prove full SHA equality plus clean status.

## Approval required

No. Repository work is bounded and reversible. The direct user request separately authorizes the post-CI exact-tarball global replacement and read-only installed-state checks; neither phase includes dangerous deletion or irreversible data loss.

## Authority classification

Dangerous deletion or irreversible data loss: `no`
Hard prerequisites: `resolved`
