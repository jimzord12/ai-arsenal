Work item: 2026-07-29-release-trello-skills-installer
Artifact: plan
Revision: 2
Prerequisites: contract@2
Status: ready

# Preconditions

- Contract revision 2 is ready with autonomous authority (`no` dangerous deletion, hard prerequisites `resolved`).
- Package and globally installed baseline is `0.3.0`; the uncommitted `0.3.1` output is invalidated candidate metadata, not a release.
- Repository stages may create disposable candidate packs but must not globally install. The direct user request separately authorizes exact-SHA packing/global replacement only after release-commit Quality and Portability pass.
- Registry publication and every Trello call remain prohibited.

## Ordered tasks

### 1. Replace invalid candidate metadata through Changesets

- Paths: `.changeset/release-trello-skills-installer.md`, `packages/trello-work-cli/package.json`, `packages/trello-work-cli/CHANGELOG.md`, `pnpm-lock.yaml`
- Inputs: Acceptance criterion 1 and Changesets status/generated-metadata seam; baseline `0.3.0`, invalid uncommitted `0.3.1` output.
- Output: Restored baseline metadata, one minor Changeset predicting only `0.4.0`, consumed by `pnpm version-packages`; generated metadata names `0.4.0` with unrelated package versions unchanged.
- Test command: `git checkout HEAD -- packages/trello-work-cli/package.json packages/trello-work-cli/CHANGELOG.md pnpm-lock.yaml && pnpm changeset status --output "$TEMP/trello-0.4.0-status.json" && pnpm version-packages && git diff -- packages/trello-work-cli/package.json packages/trello-work-cli/CHANGELOG.md pnpm-lock.yaml`
- Expected result: Status JSON contains one minor release `0.3.0 -> 0.4.0`; Changesets consumes the pending file and generates only intended package/changelog metadata.
- Rollback: Restore package metadata and pending Changeset to the pre-task state before retrying proper Changesets mechanics.

### 2. Add reproducible installed-byte proof

- Paths: `scripts/verify-trello-skills-install-bytes.mjs`, `scripts/verify-trello-skills-install-bytes.test.mjs`, `package.json`
- Inputs: Acceptance criterion 2 and transformed-payload/sentinel/repeat test seams; installer-managed marker and protocol-link rules already present in package source.
- Output: Checked-in CLI script with explicit payload root, installed repository root, sentinel, and optional baseline-manifest inputs; fixture tests prove exact bytes, complete four-tree inventory, missing/extra/mismatch rejection, sentinel preservation, and repeat-manifest equality.
- Test command: `node --test scripts/verify-trello-skills-install-bytes.test.mjs`
- Expected result: All positive and adversarial byte-proof tests pass and failures identify the differing boundary.
- Rollback: Remove only the new script/test and manifest script entry.

### 3. Run repository acceptance and record implementation

- Paths: `docs/work-items/2026-07-29-release-trello-skills-installer/implementation-report.md`, `NEXT.md`
- Inputs: Acceptance criteria 1-3; package/root/workflow/candidate-pack seams; completed tasks 1-2.
- Output: Durable implementation report records Changesets proof, test totals, candidate packed-consumer byte-proof command/output, no global installation, and routes to verification.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli format && pnpm --filter @jz/ai-arsenal-trello-work-cli lint && pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck && pnpm --filter @jz/ai-arsenal-trello-work-cli test && pnpm --filter @jz/ai-arsenal-trello-work-cli validate && pnpm check && pnpm validate:workflow && git diff --check`
- Expected result: Every gate exits zero; disposable candidate pack/consumer has exact `0.4.0` boundary and the checked-in proof passes without credentials, Trello, or global installation.
- Rollback: Remove disposable candidate artifacts; preserve truthful failures and route repair within the approved contract.

### 4. Independently verify and reconcile repository truth

- Paths: `docs/work-items/2026-07-29-release-trello-skills-installer/verification.md`, `docs/work-items/2026-07-29-release-trello-skills-installer/reconciliation.md`, `NEXT.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- Inputs: Acceptance criteria 4-5; stable changed bytes and implementation evidence.
- Output: Fresh review has zero Critical/High/Medium; verification passes without installation claims; reconciliation records exact release installation pending and clears the active route.
- Test command: `pnpm validate:workflow && git diff --check && node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-release-trello-skills-installer --json`
- Expected result: Review is non-blocking, pipeline validates complete, current truth names the post-CI operational phase as pending.
- Rollback: Preserve failed review/verification evidence and use the validator-routed repair loop.

### 5. Commit, push, and gate the release SHA

- Paths: `Not applicable.`
- Inputs: Acceptance criterion 5 and exact-SHA Git/CI seam; completed repository pipeline.
- Output: Reviewed release commit on `origin/master`, local/remote full SHAs equal, exact-SHA Quality and Portability successful.
- Test command: `git push origin master && git fetch origin && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)" && gh run list --commit "$(git rev-parse HEAD)" --json databaseId,name,status,conclusion,url,headSha`
- Expected result: Both named workflows complete successfully for the full release SHA.
- Rollback: Do not globally install on CI failure; repair through a new reviewed commit.

### 6. Execute separately authorized exact-SHA installation

- Paths: `<disposable-artifact-directory>`, `<disposable-git-repository>`, Windows global pnpm package/shims
- Inputs: Acceptance criteria 6-8; clean exact release SHA and its green CI; checked-in byte-proof script.
- Output: SHA-256-recorded exact tarball globally installed by native pnpm; installed manifest/version and generated native help/docs pass; disposable repository first/repeat installs pass byte proof and preserve sentinel.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli pack --pack-destination <disposable-artifact-directory> && sha256sum <exact-tarball> && cmd.exe /d /c pnpm add -g <native-exact-tarball-path> && cmd.exe /d /c pnpm list -g --depth=0 && cmd.exe /d /c jz-trello-flow --help && cmd.exe /d /c jz-trello-flow docs && cmd.exe /d /c jz-trello-flow skills install --repo <disposable-git-repository> && node scripts/verify-trello-skills-install-bytes.mjs --payload-root <unpacked-tarball>/package/assets/agent-skills --repo-root <disposable-git-repository> --sentinel <sentinel> --write-manifest <first.json> && cmd.exe /d /c jz-trello-flow skills install --repo <disposable-git-repository> && node scripts/verify-trello-skills-install-bytes.mjs --payload-root <unpacked-tarball>/package/assets/agent-skills --repo-root <disposable-git-repository> --sentinel <sentinel> --compare-manifest <first.json>`
- Expected result: Exact `0.4.0` package is globally registered; native generated shim works; all four transformed skill trees match with no missing/extra files, sentinel hash is unchanged, and repeat manifest is identical.
- Rollback: Reinstall the prior exact `0.3.0` package if replacement/smoke fails; remove only disposable operational artifacts.

### 7. Record post-install truth and final CI

- Paths: `docs/work-items/2026-07-29-release-trello-skills-installer/post-install-evidence.md`, `NEXT.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- Inputs: Acceptance criteria 9-10 and operational outputs from task 6.
- Output: Current-truth evidence records SHAs, run URLs, tarball/checksum, native version/shim smokes, byte-proof command/results, and prohibited-effect compliance; final commit is pushed and CI-green.
- Test command: `pnpm validate:workflow && git diff --check && git push origin master && git fetch origin && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)" && gh run list --commit "$(git rev-parse HEAD)" --json databaseId,name,status,conclusion,url,headSha`
- Expected result: Final Quality and Portability succeed for exact final SHA; local `master == origin/master`; worktree clean.
- Rollback: Repair documentation truth in a follow-up commit and repeat exact-SHA CI; do not repeat a successful external install.

## Affected paths

- Create: `.changeset/release-trello-skills-installer.md` (consumed), `scripts/verify-trello-skills-install-bytes.mjs`, `scripts/verify-trello-skills-install-bytes.test.mjs`, `docs/work-items/2026-07-29-release-trello-skills-installer/{implementation-report,verification,reconciliation,post-install-evidence}.md`, revision archives already required by contract recovery.
- Modify: `package.json`, `packages/trello-work-cli/package.json`, `packages/trello-work-cli/CHANGELOG.md`, `pnpm-lock.yaml` only if Changesets changes it, `NEXT.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`.
- Delete: pending Changeset only through `pnpm version-packages`; disposable artifacts after evidence capture.

## Verification commands

- Task 1 Changesets restore/status/version/diff command — predicts and generates only `0.4.0` minor release.
- `node --test scripts/verify-trello-skills-install-bytes.test.mjs` — proves deterministic byte comparator and adversarial failures.
- Task 3 package/root/workflow gates plus disposable candidate packed-consumer invocation — all pass without global installation.
- Fresh independent exact-snapshot review — zero Critical/High/Medium.
- Task 4 validator/whitespace commands — repository pipeline passes with operation pending.
- Task 5 push/full-SHA/CI query — release SHA Quality and Portability pass.
- Task 6 exact pack/checksum/native install/help/docs/first-repeat byte-proof chain — globally installed exact `0.4.0` works and bytes match.
- Task 7 workflow/full-SHA/final-CI command — final truth commit is green, aligned, and clean.

## Rollback

1. Before release commit, restore generated metadata/pending Changeset and remove new proof files if mandatory gates cannot pass.
2. After push, do not install unless exact release SHA CI is green; repair with a new reviewed commit.
3. On global replacement failure, reinstall prior exact `0.3.0`; never manually edit generated shims.
4. Preserve successful external installation and repair only stale documentation if final truth CI fails.
5. Never publish, call Trello, delete source, or rewrite history.
