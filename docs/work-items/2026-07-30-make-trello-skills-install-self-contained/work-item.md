# Work Item

Work item: 2026-07-30-make-trello-skills-install-self-contained
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-30T21:00:25.038+03:00
Max time: 10 hours
Last time check: 2026-07-30T21:16:33.948+03:00
Turns since time check: 2
Review cycles: 1
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Release and locally install a backward-compatible Trello Work CLI patch whose real and dry-run skill installers use only the four skills bundled with the executing package, require no external validator checkout or Python runtime, and retain the existing all-or-nothing transaction, rollback, containment, managed-replacement, and unrelated-skill preservation guarantees.

## Non-goals

- Do not access or mutate Trello, Greek Essence, WU-20, WU-19, any consumer project, or any non-disposable repository state.
- Do not fetch latest skills, use repository source as the runtime payload, mix package versions, install arbitrary skills, create a general-purpose skill manager, publish to a registry, or bootstrap external clients.
- Do not weaken Git-root discovery, four-directory allowlisting, symlink/junction containment, complete pre-mutation validation, deterministic transformations, dry-run immutability, transactional replacement, rollback, recovery-data retention, or partial-install prevention.
- Do not retain the former validator environment variables as a runtime compatibility surface unless repository evidence identifies a real consumer; development/release verification owns official `skills-ref` validation.

## Acceptance criteria

- Generated-shim `jz-trello-flow skills install --dry-run --output json` and real installation succeed in isolated disposable Git repositories with `JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT` and `JZ_TRELLO_FLOW_SKILLS_REF_PYTHON` unset, Python unavailable, no Trello credentials, and no network dependency or Trello access.
- Runtime resolves the actual Git root and uses only the executing package's bundled payload. Exact transformed-byte and inventory proof shows exactly four managed skill directories, each with expected `SKILL.md`, protocol reference, and managed marker, with no partial or mixed-version installation.
- Dry-run is strictly non-mutating; same-version repeat replacement is safe; unrelated sentinel content remains byte-for-byte unchanged.
- Focused fault tests prove mid-replacement rollback, restoration-failure recovery retention and exact reporting, symlink/junction containment, and missing or malformed bundled payload failure before repository mutation.
- Official pinned `skills-ref` validation runs as a development/release verification gate against the exact bundled and installation-transformed payload that will be packed, without becoming a runtime prerequisite.
- Runtime documentation and tests no longer instruct or require the two validator variables. Repository evidence determines and records that obsolete runtime variables are ignored because payload selection and validation no longer consult them.
- A patch Changeset versions only `@jz/ai-arsenal-trello-work-cli`; the reviewed stable snapshot passes focused tests, complete package and repository gates, workflow validators, strict packed-artifact validation, release-time official validation, and a clean unrelated packed-consumer dry-run/real-install smoke through the generated shim.
- The exact reviewed commit is pushed and passes required Quality and Portability CI. That exact CI-green commit is packed and checksummed, then—only after fresh confirmation for the exact overwrite command—installed/replaced through native global pnpm and independently proves package name/version, generated shim, help/docs, variable-free dry-run and real installation, exact four-skill transformed bytes, repeat identity, and unrelated sentinel preservation.
- Durable evidence records package version, release and evidence SHAs, remote equality, CI URLs, tarball identity/checksum, official release-validator result, global replacement command and installed-version proof, installed-artifact smoke results, clean worktree, and confirmation that Trello, Greek Essence, registry, consumer-project, and network state were not accessed or mutated.

## Implementation summary

- Removed runtime `officialValidate` and all runtime reads of `JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT` / `JZ_TRELLO_FLOW_SKILLS_REF_PYTHON` from `packages/trello-work-cli/src/skills-install.ts`. The executing package's `assets/agent-skills` payload remains the sole source; complete staging now performs local frontmatter/name/description, transformed-link, protocol, and managed-marker checks before dry-run reporting or repository mutation.
- Preserved Git-root discovery, exact four-skill allowlisting, redirected-path rejection, deterministic protocol/marker transformations, dry-run immutability, transactional replacement, rollback, restoration-failure retention, unrelated-skill preservation, and optional injected validation as an internal test seam.
- Added `scripts/validate-trello-skills-official.ts`, its provenance/argument regressions, root `validate:trello-skills-official` command, and workflow-test registration. The command verifies a clean `agentskills/agentskills@38a2ff82958afee88dadf4831509e6f7e9d8ef4e` checkout and runs its isolated official validator against the exact locally transformed package or explicitly supplied packed payload.
- Updated built-in docs, README, and packaged work guide to describe self-contained offline runtime behavior and official release-time validation. The former runtime variables are intentionally ignored because runtime payload selection and validation no longer consult them; no confirmed consumer requires them.
- Replaced the packed E2E defect expectation with generated-shim dry-run, install, repeat replacement, invalid external-variable/Python-shadow isolation, exact four-skill/12-file transformed-byte proof, and unrelated sentinel preservation. Added missing/malformed payload pre-mutation tests while retaining rollback, recovery, and junction coverage.
- Added `.changeset/quiet-skills-travel.md` for a patch bump of only `@jz/ai-arsenal-trello-work-cli`.
- RED evidence: the initial focused run failed because runtime still returned `SKILLS_VALIDATOR_UNAVAILABLE`; missing payload leaked `ENOENT`; updated docs lacked the self-contained contract; and the release-validator script did not exist.
- GREEN evidence: 23 tests across `docs.test.ts`, `skills-install.test.ts`, and packed `skills-install.e2e.test.ts` passed; the official-script provenance test passed; package strict typechecking passed; focused Prettier, ESLint, Changesets status, and whitespace checks passed. Direct official validation passed all four exact transformed bundled skills using clean `C:\Temp\asrepo2` and isolated `C:\Temp\asref\.venv\Scripts\python.exe`.
- Changed paths: `.changeset/quiet-skills-travel.md`, `NEXT.md`, `package.json`, `packages/trello-work-cli/{README.md,assets/work-guide.md,package.json,src/docs.test.ts,src/docs.ts,src/skills-install.test.ts,src/skills-install.ts,test/skills-install.e2e.test.ts}`, `scripts/validate-trello-skills-official.{test.mjs,ts}`, and this compact work item.

## Review findings and repairs

- Cycle 1 found three acceptance-impacting findings. First, the packed E2E helper applied adversarial environment overrides and then deleted the two former validator variables, weakening its proof that obsolete values are ignored. Second, the official-validation command was registered in the packable package even though its repository-owned script is intentionally outside the tarball, leaving a broken package script in clean consumers. Third, the release validator silently accepted unknown or duplicate flags, so a misspelled `--payload-root` could validate repository defaults rather than the intended packed payload.
- Repaired the E2E environment order so unset behavior and deliberately invalid former-variable behavior are both exercised. Moved official validation to the root-only `validate:trello-skills-official` command. Made its argument parser reject unknown and duplicate flags before provenance or payload work, with a focused regression.
- Repair checks passed: 2 official-validator script tests, packed generated-shim E2E (2 cases), direct official validation of all four transformed bundled skills, package strict typechecking, focused ESLint, Prettier, and whitespace checks.
- Re-review found no remaining Critical, High, Medium, or acceptance-related Minor finding. Optional polish and broader skill-manager behavior remain excluded.

## Final verification

Result: passed

- `pnpm check` — exit 0. Repository formatting, package lint/typecheck/tests, workflow tests, and both workflow validators passed on the stable snapshot. Trello CLI: 22 suites, 277 passed and 2 credential-gated live cases skipped. Features CLI: 154 passed. Workflow/scripts: 55 passed with one expected Windows ordinary-file-symlink privilege skip.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit 0. Strict publint packed the candidate and reported `All good!`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test:live` — exit 0. Credential-free boundary: 12 passed and 2 explicitly opted-in live scenarios skipped before client construction; no Trello API call occurred.
- `pnpm lint:root` — exit 0. Root ESLint passed.
- `pnpm changeset status` — exit 0. Only `@jz/ai-arsenal-trello-work-cli` is scheduled for a patch bump; no minor or major bump exists.
- `pnpm validate:trello-skills-official -- --checkout C:\Temp\asrepo2 --python C:\Temp\asref\.venv\Scripts\python.exe --payload-root <unpacked-candidate>/package/assets/agent-skills` — exit 0. Provenance was the clean exact upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`; official `skills-ref` passed all four exact transformed skills extracted from candidate tarball `jz-ai-arsenal-trello-work-cli-0.4.1.tgz` (SHA-256 `84be61812f275932fb717e26f586db3a898ebb028db86c514ac656fbe4a47498`). This pre-version tarball is disposable verification evidence; delivery must apply the Changeset and validate the final versioned artifact.
- Packed acceptance within `pnpm check` — exit 0. Both generated-shim E2E cases packed and installed the actual tarball into clean unrelated consumers. With former validator variables unset or deliberately invalid and Python shadowed, dry-run remained strictly non-mutating, real and repeat installation succeeded, exactly four managed directories/12 managed files byte-matched the packed transformed payload, and the unrelated sentinel remained unchanged.
- Focused fault acceptance within `pnpm check` — exit 0. Missing/malformed bundled payload fails as `SKILLS_PAYLOAD_INVALID` before mutation; mid-replacement rollback, restoration-failure recovery retention/reporting, Git-root containment, and junction rejection pass.
- `node scripts/validate-living-workflow.mjs`, selected-item JSON validation, and `git diff --check` — exit 0. Living workflow passed, the compact item remained valid at verification before this evidence update, and no whitespace errors exist.
- Changed-path audit — all changed paths are within the compact contract: Trello installer source/tests/docs, root release-validation command/tests, one patch Changeset, `NEXT.md`, and this work item. No consumer project, Trello, Greek Essence, WU-20/WU-19, registry, global pnpm installation, or Git history was accessed or mutated.
- Remaining failures: None.
- Proportionality check at 2026-07-30T21:16:33.948+03:00: about 16 minutes elapsed against the 10-hour maximum; scope remains bounded and delivery is on track, so no simplification or escalation is needed.
- Delivery confirmation: after being shown exact command `pnpm version-packages`, deletion of `.changeset/quiet-skills-travel.md`, the `0.4.1` to `0.4.2` manifest update, and generated changelog overwrite, the user replied `I approve`. Fresh target recheck matched those exact effects; the command exited 0, consumed only that Changeset, and generated `@jz/ai-arsenal-trello-work-cli@0.4.2` plus its changelog entry.
- Versioned snapshot: `pnpm check`, strict publint, credential-free live-boundary tests, root lint, and official pinned validation of all four transformed skills extracted from the exact `0.4.2` candidate tarball passed. The tarball is `jz-ai-arsenal-trello-work-cli-0.4.2.tgz` with SHA-256 `ff6706e7e4b3ded79c0977a2d59ddcfec70595e17c06ff07386092ce3773f391` in disposable verification root `C:\Users\JIMZOR~1\AppData\Local\Temp\trello-self-contained-042-b741913efddf42778fc2ef1324047e60`.
- Post-consumption `pnpm changeset status` exited 1 with the expected `changed packages but no changesets were found` diagnostic because the approved patch record is now represented by the generated `0.4.2` manifest/changelog. The pre-version status passed with only this package at patch, `pnpm version-packages` exited 0, and the complete versioned repository gate passed; no second Changeset is required for the same delivered change.
- Release delivery: commit `ea8c0a8627b740cbb587a4ab519c275d0b5137d5` was pushed with local/remote equality and a clean worktree. Exact-SHA Quality `30570080747` and Portability `30570080760` passed; Ubuntu and Windows distribution jobs both succeeded.
- Exact CI-green artifact: `C:\Users\jimzord12\AppData\Local\Temp\ai-arsenal-trello-release-ea8c0a8627b7\packed\jz-ai-arsenal-trello-work-cli-0.4.2.tgz` has SHA-256 `ff6706e7e4b3ded79c0977a2d59ddcfec70595e17c06ff07386092ce3773f391` and SHA-512 Base64 `+GF+tANapahw7EkjCSnMttcn+biCr+2bDZsxisMw9EmN+w/iQoYqBLA50c/Wk76C67vcczgSrr18B5oavhMdbw==`; official pinned validation passed all four transformed skills extracted from that exact artifact.
- Global replacement confirmation: after being shown exact command `pnpm add --global "C:\Users\jimzord12\AppData\Local\Temp\ai-arsenal-trello-release-ea8c0a8627b7\packed\jz-ai-arsenal-trello-work-cli-0.4.2.tgz"`, its `0.4.1` replacement consequence, and exact `0.4.1` rollback artifact, the user replied `I approve`. Fresh preflight rechecked the unchanged `0.4.1` target and exact `0.4.2` SHA-256; the approved command exited 0 and pnpm reported global `@jz/ai-arsenal-trello-work-cli 0.4.2`.
- Installed-artifact proof: `pnpm list -g --depth=0 --json` reports `0.4.2`; all 32 packed files byte-match the exact unpacked CI-green artifact and pnpm adds only its expected three generated package shims. Global `jz-trello-flow.ps1` help and `docs --topic skills` pass and expose the self-contained contract.
- Disposable installed-shim proof at `C:\Temp\ai-arsenal-trello-042-delivery-5002661525144990ad5efe23680444ed`: with Trello credentials absent, former validator paths deliberately invalid, and network proxies pointed to an unavailable local endpoint, dry-run reported four installs without managed mutation; real installation reported four installs; repeat reported four replacements. Repository-owned proof verified the exact 12 transformed managed files, four-directory inventory, repeat manifest SHA-256 `25f634b6bde261d7429b817a9ea2f73d29cb05333e79cfd8dde4dfdd0d16a062`, and unchanged sentinel SHA-256 `b072885a36ba742a882e9a6db2be87feca22e4ea463bc6cb5f3adf9f685d978c`.
- Boundary confirmation: no Trello API call, Greek Essence/WU-20/WU-19 or consumer-project access, registry publication, mutable source link, or network dependency occurred. The `0.4.1` rollback artifact remains available with verified SHA-256 `7d52253d335e9555d1fede9693955522611c8e58dfdbfae61469ace68d546035`.
- Installed-evidence snapshot: commit `42720e476aa1ca95482286a3b44c83dc526252cf` was pushed with local/remote equality and a clean worktree. Exact-SHA Quality `30570886060` and Portability `30570885879` passed, including both Ubuntu and Windows distribution jobs.
- Delivery result: all acceptance criteria are satisfied; planning reflects verified current truth; the compact item is delivered; and active registration is cleared. Delivery-invalidated formatting, living-workflow validation, selected-item validation, and whitespace checks pass on the closure snapshot.
